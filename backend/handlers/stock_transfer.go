package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StockTransferHandler struct {
	DB *gorm.DB
}

type StockTransferItemCreate struct {
	ProductID         uint    `json:"product_id" binding:"required"`
	ProductVariantID  *uint   `json:"product_variant_id"`
	QuantityRequested float64 `json:"quantity_requested" binding:"required,gt=0"`
}

func NewStockTransferHandler(db *gorm.DB) *StockTransferHandler {
	return &StockTransferHandler{DB: db}
}

// CreateStockTransfer creates a new stock transfer
func (h *StockTransferHandler) CreateStockTransfer(c *gin.Context) {
	var req struct {
		FromWarehouseID *uint                     `json:"from_warehouse_id"`
		ToWarehouseID   *uint                     `json:"to_warehouse_id"`
		FromStoreID     *uint                     `json:"from_store_id"`
		ToStoreID       *uint                     `json:"to_store_id"`
		Notes           string                    `json:"notes"`
		Items           []StockTransferItemCreate `json:"items" binding:"required,dive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate transfer locations
	fromCount := 0
	toCount := 0
	if req.FromWarehouseID != nil {
		fromCount++
	}
	if req.FromStoreID != nil {
		fromCount++
	}
	if req.ToWarehouseID != nil {
		toCount++
	}
	if req.ToStoreID != nil {
		toCount++
	}

	if fromCount != 1 || toCount != 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Must specify exactly one source and one destination"})
		return
	}

	// Cannot transfer to same location
	if (req.FromWarehouseID != nil && req.ToWarehouseID != nil && *req.FromWarehouseID == *req.ToWarehouseID) ||
		(req.FromStoreID != nil && req.ToStoreID != nil && *req.FromStoreID == *req.ToStoreID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot transfer to the same location"})
		return
	}

	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	// Generate transfer number
	fromID := uint(0)
	toID := uint(0)
	if req.FromWarehouseID != nil {
		fromID = *req.FromWarehouseID
	} else {
		fromID = *req.FromStoreID
	}
	if req.ToWarehouseID != nil {
		toID = *req.ToWarehouseID
	} else {
		toID = *req.ToStoreID
	}
	transferNumber := fmt.Sprintf("ST-%d-%d%d", time.Now().Unix(), fromID, toID)

	// Start transaction
	tx := h.DB.Begin()

	// Validate stock availability for each item
	for _, itemReq := range req.Items {
		// Check if source has enough stock
		if req.FromWarehouseID != nil {
			var inventory models.Inventory
			where := models.Inventory{ProductID: itemReq.ProductID, WarehouseID: *req.FromWarehouseID}
			if itemReq.ProductVariantID != nil {
				where.ProductVariantID = itemReq.ProductVariantID
			}

			if err := tx.Where(where).First(&inventory).Error; err != nil {
				tx.Rollback()
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Product not found in source warehouse"})
				} else {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				}
				return
			}

			if inventory.Quantity < itemReq.QuantityRequested {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient stock in source warehouse. Available: %.2f, Requested: %.2f", inventory.Quantity, itemReq.QuantityRequested)})
				return
			}
		} else {
			var inventory models.StoreInventory
			where := models.StoreInventory{ProductID: itemReq.ProductID, StoreID: *req.FromStoreID}
			if itemReq.ProductVariantID != nil {
				where.ProductVariantID = itemReq.ProductVariantID
			}

			if err := tx.Where(where).First(&inventory).Error; err != nil {
				tx.Rollback()
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Product not found in source store"})
				} else {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				}
				return
			}

			if inventory.Quantity < itemReq.QuantityRequested {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Insufficient stock in source store. Available: %.2f, Requested: %.2f", inventory.Quantity, itemReq.QuantityRequested)})
				return
			}
		}
	}

	// Create stock transfer
	transfer := models.StockTransfer{
		TransferNumber:  transferNumber,
		FromWarehouseID: req.FromWarehouseID,
		ToWarehouseID:   req.ToWarehouseID,
		FromStoreID:     req.FromStoreID,
		ToStoreID:       req.ToStoreID,
		Status:          "pending",
		Notes:           req.Notes,
		RequestedBy:     userID.(uint),
	}

	if err := tx.Create(&transfer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create stock transfer items
	for _, itemReq := range req.Items {
		item := models.StockTransferItem{
			TransferID:        transfer.ID,
			ProductID:         itemReq.ProductID,
			ProductVariantID:  itemReq.ProductVariantID,
			QuantityRequested: itemReq.QuantityRequested,
		}

		if err := tx.Create(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()

	// Load the complete stock transfer with relations
	if err := h.DB.Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("RequestedByUser").Preload("FromWarehouse").Preload("ToWarehouse").
		Preload("FromStore").Preload("ToStore").First(&transfer, transfer.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": transfer})
}

// ExecuteStockTransfer processes the actual stock transfer
func (h *StockTransferHandler) ExecuteStockTransfer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock transfer ID"})
		return
	}

	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	// Start transaction
	tx := h.DB.Begin()

	// Get stock transfer
	var transfer models.StockTransfer
	if err := tx.Preload("Items").First(&transfer, id).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Stock transfer not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if transfer.Status != "pending" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock transfer cannot be executed in current status"})
		return
	}

	// Process each item
	for i := range transfer.Items {
		item := &transfer.Items[i]
		quantityToTransfer := item.QuantityRequested

		// Deduct from source location
		if transfer.FromWarehouseID != nil {
			var inventory models.Inventory
			where := models.Inventory{ProductID: item.ProductID, WarehouseID: *transfer.FromWarehouseID}
			if item.ProductVariantID != nil {
				where.ProductVariantID = item.ProductVariantID
			}

			if err := tx.Where(where).First(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			inventory.Quantity -= quantityToTransfer
			if err := tx.Save(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Create outbound transaction
			outTransaction := models.InventoryTransaction{
				ProductID:        item.ProductID,
				ProductVariantID: item.ProductVariantID,
				LocationType:     "warehouse",
				LocationID:       *transfer.FromWarehouseID,
				WarehouseID:      transfer.FromWarehouseID,
				TransactionType:  "out",
				Quantity:         quantityToTransfer,
				ReferenceType:    "transfer",
				ReferenceID:      &transfer.ID,
				Notes:            fmt.Sprintf("Transfer out: %s", transfer.TransferNumber),
				CreatedBy:        userID.(uint),
			}

			if err := tx.Create(&outTransaction).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			var inventory models.StoreInventory
			where := models.StoreInventory{ProductID: item.ProductID, StoreID: *transfer.FromStoreID}
			if item.ProductVariantID != nil {
				where.ProductVariantID = item.ProductVariantID
			}

			if err := tx.Where(where).First(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			inventory.Quantity -= quantityToTransfer
			if err := tx.Save(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Create outbound transaction
			outTransaction := models.InventoryTransaction{
				ProductID:        item.ProductID,
				ProductVariantID: item.ProductVariantID,
				LocationType:     "store",
				LocationID:       *transfer.FromStoreID,
				StoreID:          transfer.FromStoreID,
				TransactionType:  "out",
				Quantity:         quantityToTransfer,
				ReferenceType:    "transfer",
				ReferenceID:      &transfer.ID,
				Notes:            fmt.Sprintf("Transfer out: %s", transfer.TransferNumber),
				CreatedBy:        userID.(uint),
			}

			if err := tx.Create(&outTransaction).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		// Add to destination location
		if transfer.ToWarehouseID != nil {
			var inventory models.Inventory
			where := models.Inventory{ProductID: item.ProductID, WarehouseID: *transfer.ToWarehouseID}
			if item.ProductVariantID != nil {
				where.ProductVariantID = item.ProductVariantID
			}

			if err := tx.Where(where).FirstOrCreate(&inventory, where).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			inventory.Quantity += quantityToTransfer
			if err := tx.Save(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Create inbound transaction
			inTransaction := models.InventoryTransaction{
				ProductID:        item.ProductID,
				ProductVariantID: item.ProductVariantID,
				LocationType:     "warehouse",
				LocationID:       *transfer.ToWarehouseID,
				WarehouseID:      transfer.ToWarehouseID,
				TransactionType:  "in",
				Quantity:         quantityToTransfer,
				ReferenceType:    "transfer",
				ReferenceID:      &transfer.ID,
				Notes:            fmt.Sprintf("Transfer in: %s", transfer.TransferNumber),
				CreatedBy:        userID.(uint),
			}

			if err := tx.Create(&inTransaction).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			var inventory models.StoreInventory
			where := models.StoreInventory{ProductID: item.ProductID, StoreID: *transfer.ToStoreID}
			if item.ProductVariantID != nil {
				where.ProductVariantID = item.ProductVariantID
			}

			if err := tx.Where(where).FirstOrCreate(&inventory, where).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			inventory.Quantity += quantityToTransfer
			if err := tx.Save(&inventory).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Create inbound transaction
			inTransaction := models.InventoryTransaction{
				ProductID:        item.ProductID,
				ProductVariantID: item.ProductVariantID,
				LocationType:     "store",
				LocationID:       *transfer.ToStoreID,
				StoreID:          transfer.ToStoreID,
				TransactionType:  "in",
				Quantity:         quantityToTransfer,
				ReferenceType:    "transfer",
				ReferenceID:      &transfer.ID,
				Notes:            fmt.Sprintf("Transfer in: %s", transfer.TransferNumber),
				CreatedBy:        userID.(uint),
			}

			if err := tx.Create(&inTransaction).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		// Update item quantities
		item.QuantityShipped = quantityToTransfer
		item.QuantityReceived = quantityToTransfer
		if err := tx.Save(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Update stock transfer status
	now := time.Now()
	transfer.Status = "completed"
	transfer.ShippedAt = &now
	transfer.ReceivedAt = &now
	if err := tx.Save(&transfer).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Stock transfer executed successfully"})
}

// GetStockTransfers retrieves stock transfers with pagination
func (h *StockTransferHandler) GetStockTransfers(c *gin.Context) {
	var transfers []models.StockTransfer
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")

	offset := (page - 1) * limit

	query := h.DB.Preload("RequestedByUser").Preload("Items").
		Preload("FromWarehouse").Preload("ToWarehouse").
		Preload("FromStore").Preload("ToStore")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	query.Model(&models.StockTransfer{}).Count(&total)

	// Get transfers with pagination
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&transfers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": transfers,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetStockTransfer retrieves a single stock transfer by ID
func (h *StockTransferHandler) GetStockTransfer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock transfer ID"})
		return
	}

	var transfer models.StockTransfer
	if err := h.DB.Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("RequestedByUser").Preload("FromWarehouse").Preload("ToWarehouse").
		Preload("FromStore").Preload("ToStore").First(&transfer, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Stock transfer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transfer})
}
