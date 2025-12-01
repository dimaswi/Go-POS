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

type PurchaseOrderHandler struct {
	DB *gorm.DB
}

type PurchaseOrderItemCreate struct {
	ProductID        uint    `json:"product_id" binding:"required"`
	ProductVariantID *uint   `json:"product_variant_id"`
	QuantityOrdered  float64 `json:"quantity_ordered" binding:"required,gt=0"`
	UnitCost         float64 `json:"unit_cost" binding:"required,gte=0"`
}

func NewPurchaseOrderHandler(db *gorm.DB) *PurchaseOrderHandler {
	return &PurchaseOrderHandler{DB: db}
}

// CreatePurchaseOrder creates a new purchase order
func (h *PurchaseOrderHandler) CreatePurchaseOrder(c *gin.Context) {
	var req struct {
		SupplierID      *uint                     `json:"supplier_id"`
		SupplierName    string                    `json:"supplier_name"`
		SupplierContact string                    `json:"supplier_contact"`
		WarehouseID     uint                      `json:"warehouse_id" binding:"required"`
		ExpectedDate    *string                   `json:"expected_date"`
		Notes           string                    `json:"notes"`
		Items           []PurchaseOrderItemCreate `json:"items" binding:"required,dive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Basic validation: must have either SupplierID or SupplierName
	if (req.SupplierID == nil || *req.SupplierID == 0) && req.SupplierName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either supplier_id or supplier_name is required"})
		return
	}

	// If SupplierID provided, load supplier and normalize name/contact
	if req.SupplierID != nil && *req.SupplierID != 0 {
		var s models.Supplier
		if err := h.DB.First(&s, *req.SupplierID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Supplier not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			return
		}
		// Override supplier name/contact if not explicitly set
		if req.SupplierName == "" {
			req.SupplierName = s.Name
		}
		if req.SupplierContact == "" {
			req.SupplierContact = s.Contact
		}
	}

	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	// Generate purchase number
	purchaseNumber := fmt.Sprintf("PO-%d-%d", time.Now().Unix(), req.WarehouseID)

	// Parse expected date
	var expectedDate *time.Time
	if req.ExpectedDate != nil && *req.ExpectedDate != "" {
		if parsed, err := time.Parse("2006-01-02", *req.ExpectedDate); err == nil {
			expectedDate = &parsed
		}
	}

	// Start transaction
	tx := h.DB.Begin()

	// Create purchase order
	po := models.PurchaseOrder{
		PurchaseNumber:  purchaseNumber,
		SupplierID:      req.SupplierID,
		SupplierName:    req.SupplierName,
		SupplierContact: req.SupplierContact,
		WarehouseID:     req.WarehouseID,
		Status:          "draft",
		OrderDate:       time.Now(),
		ExpectedDate:    expectedDate,
		Notes:           req.Notes,
		CreatedBy:       userID.(uint),
	}

	if err := tx.Create(&po).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create purchase order items and calculate total
	var totalAmount float64
	for _, itemReq := range req.Items {
		item := models.PurchaseOrderItem{
			PurchaseOrderID:  po.ID,
			ProductID:        itemReq.ProductID,
			ProductVariantID: itemReq.ProductVariantID,
			QuantityOrdered:  itemReq.QuantityOrdered,
			UnitCost:         itemReq.UnitCost,
			TotalCost:        itemReq.QuantityOrdered * itemReq.UnitCost,
		}

		if err := tx.Create(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		totalAmount += item.TotalCost
	}

	// Update total amount
	po.TotalAmount = totalAmount
	if err := tx.Save(&po).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	// Load the complete purchase order with relations
	if err := h.DB.Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("Warehouse").Preload("CreatedByUser").Preload("Supplier").First(&po, po.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": po})
}

// ReceivePurchaseOrder processes receiving of purchase order items
func (h *PurchaseOrderHandler) ReceivePurchaseOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase order ID"})
		return
	}

	var req struct {
		Items []struct {
			ItemID           uint    `json:"item_id" binding:"required"`
			QuantityReceived float64 `json:"quantity_received" binding:"required,gt=0"`
		} `json:"items" binding:"required,dive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	// Start transaction
	tx := h.DB.Begin()

	// Get purchase order
	var po models.PurchaseOrder
	if err := tx.Preload("Items").First(&po, id).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Purchase order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if po.Status != "draft" && po.Status != "pending" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase order cannot be received in current status"})
		return
	}

	// Process each item
	for _, itemReq := range req.Items {
		// Find the purchase order item
		var poItem models.PurchaseOrderItem
		found := false
		for _, item := range po.Items {
			if item.ID == itemReq.ItemID {
				poItem = item
				found = true
				break
			}
		}

		if !found {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Item ID %d not found in purchase order", itemReq.ItemID)})
			return
		}

		// Update quantity received
		poItem.QuantityReceived += itemReq.QuantityReceived
		if err := tx.Save(&poItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update warehouse inventory
		var inventory models.Inventory
		where := models.Inventory{ProductID: poItem.ProductID, WarehouseID: po.WarehouseID}
		if poItem.ProductVariantID != nil {
			where.ProductVariantID = poItem.ProductVariantID
		}

		if err := tx.Where(where).FirstOrCreate(&inventory, where).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		inventory.Quantity += itemReq.QuantityReceived
		if err := tx.Save(&inventory).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create inventory transaction
		transaction := models.InventoryTransaction{
			ProductID:        poItem.ProductID,
			ProductVariantID: poItem.ProductVariantID,
			LocationType:     "warehouse",
			LocationID:       po.WarehouseID,
			WarehouseID:      &po.WarehouseID,
			TransactionType:  "in",
			Quantity:         itemReq.QuantityReceived,
			UnitCost:         poItem.UnitCost,
			ReferenceType:    "purchase",
			ReferenceID:      &po.ID,
			Notes:            fmt.Sprintf("Received from PO: %s", po.PurchaseNumber),
			CreatedBy:        userID.(uint),
		}

		if err := tx.Create(&transaction).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Reload items to check received quantities
	var updatedItems []models.PurchaseOrderItem
	if err := tx.Where("purchase_order_id = ?", po.ID).Find(&updatedItems).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Determine status based on received quantities
	allReceived := true
	anyReceived := false
	for _, item := range updatedItems {
		if item.QuantityReceived > 0 {
			anyReceived = true
		}
		if item.QuantityReceived < item.QuantityOrdered {
			allReceived = false
		}
	}

	// Update purchase order status and received date
	now := time.Now()
	if allReceived {
		po.Status = "received"
		po.ReceivedDate = &now
	} else if anyReceived {
		po.Status = "partial"
	}

	if err := tx.Save(&po).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Purchase order received successfully"})
}

// GetPurchaseOrders retrieves purchase orders with pagination
func (h *PurchaseOrderHandler) GetPurchaseOrders(c *gin.Context) {
	var orders []models.PurchaseOrder
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	warehouseID := c.Query("warehouse_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Warehouse").Preload("CreatedByUser").Preload("Supplier").Preload("Items")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	// Get total count
	query.Model(&models.PurchaseOrder{}).Count(&total)

	// Get orders with pagination
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orders,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetPurchaseOrder retrieves a single purchase order by ID
func (h *PurchaseOrderHandler) GetPurchaseOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid purchase order ID"})
		return
	}

	var po models.PurchaseOrder
	if err := h.DB.Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("Warehouse").Preload("CreatedByUser").Preload("Supplier").First(&po, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Purchase order not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": po})
}
