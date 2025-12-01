package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InventoryHandler struct {
	DB *gorm.DB
}

func NewInventoryHandler(db *gorm.DB) *InventoryHandler {
	return &InventoryHandler{DB: db}
}

// GetInventory retrieves warehouse inventory with pagination
func (h *InventoryHandler) GetInventory(c *gin.Context) {
	var inventory []models.Inventory
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	warehouseID := c.Query("warehouse_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Product").Preload("ProductVariant").Preload("Warehouse")

	if search != "" {
		query = query.Joins("JOIN products ON inventory.product_id = products.id").
			Where("products.name LIKE ? OR products.sku LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	// Get total count
	query.Model(&models.Inventory{}).Count(&total)

	// Get inventory with pagination
	if err := query.Limit(limit).Offset(offset).Find(&inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": inventory,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetStoreInventory retrieves store inventory with pagination
func (h *InventoryHandler) GetStoreInventory(c *gin.Context) {
	var inventory []models.StoreInventory
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	storeID := c.Query("store_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Product").Preload("ProductVariant").Preload("Store")

	if search != "" {
		query = query.Joins("JOIN products ON store_inventories.product_id = products.id").
			Where("products.name LIKE ? OR products.sku LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}

	// Get total count
	query.Model(&models.StoreInventory{}).Count(&total)

	// Get inventory with pagination
	if err := query.Limit(limit).Offset(offset).Find(&inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": inventory,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetInventoryByID retrieves a single inventory by ID
func (h *InventoryHandler) GetInventoryByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid inventory ID"})
		return
	}

	var inventory models.Inventory
	if err := h.DB.Preload("Product").Preload("ProductVariant").Preload("Warehouse").
		First(&inventory, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Inventory not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": inventory})
}

// GetStoreInventoryByID retrieves a single store inventory by ID
func (h *InventoryHandler) GetStoreInventoryByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store inventory ID"})
		return
	}

	var storeInventory models.StoreInventory
	if err := h.DB.Preload("Product").Preload("ProductVariant").Preload("Store").
		First(&storeInventory, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store inventory not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": storeInventory})
}

// UpdateInventory updates warehouse inventory location info
func (h *InventoryHandler) UpdateInventory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid inventory ID"})
		return
	}

	var req struct {
		ShelfLocation *string  `json:"shelf_location"`
		BinLocation   *string  `json:"bin_location"`
		Zone          *string  `json:"zone"`
		Aisle         *string  `json:"aisle"`
		Level         *string  `json:"level"`
		MinStock      *float64 `json:"min_stock"`
		MaxStock      *float64 `json:"max_stock"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var inventory models.Inventory
	if err := h.DB.First(&inventory, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Inventory not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update only provided fields
	if req.ShelfLocation != nil {
		inventory.ShelfLocation = *req.ShelfLocation
	}
	if req.BinLocation != nil {
		inventory.BinLocation = *req.BinLocation
	}
	if req.Zone != nil {
		inventory.Zone = *req.Zone
	}
	if req.Aisle != nil {
		inventory.Aisle = *req.Aisle
	}
	if req.Level != nil {
		inventory.Level = *req.Level
	}
	if req.MinStock != nil {
		inventory.MinStock = *req.MinStock
	}
	if req.MaxStock != nil {
		inventory.MaxStock = *req.MaxStock
	}

	if err := h.DB.Save(&inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with preloads
	h.DB.Preload("Product").Preload("ProductVariant").Preload("Warehouse").First(&inventory, id)

	c.JSON(http.StatusOK, gin.H{"data": inventory, "message": "Inventory updated successfully"})
}

// UpdateStoreInventory updates store inventory location info
func (h *InventoryHandler) UpdateStoreInventory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store inventory ID"})
		return
	}

	var req struct {
		ShelfLocation *string  `json:"shelf_location"`
		Section       *string  `json:"section"`
		DisplayArea   *string  `json:"display_area"`
		MinStock      *float64 `json:"min_stock"`
		MaxStock      *float64 `json:"max_stock"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var storeInventory models.StoreInventory
	if err := h.DB.First(&storeInventory, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store inventory not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update only provided fields
	if req.ShelfLocation != nil {
		storeInventory.ShelfLocation = *req.ShelfLocation
	}
	if req.Section != nil {
		storeInventory.Section = *req.Section
	}
	if req.DisplayArea != nil {
		storeInventory.DisplayArea = *req.DisplayArea
	}
	if req.MinStock != nil {
		storeInventory.MinStock = *req.MinStock
	}
	if req.MaxStock != nil {
		storeInventory.MaxStock = *req.MaxStock
	}

	if err := h.DB.Save(&storeInventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with preloads
	h.DB.Preload("Product").Preload("ProductVariant").Preload("Store").First(&storeInventory, id)

	c.JSON(http.StatusOK, gin.H{"data": storeInventory, "message": "Store inventory updated successfully"})
}

// AdjustInventory adjusts inventory quantity
func (h *InventoryHandler) AdjustInventory(c *gin.Context) {
	var req struct {
		ProductID        uint    `json:"product_id" binding:"required"`
		ProductVariantID *uint   `json:"product_variant_id"`
		WarehouseID      uint    `json:"warehouse_id" binding:"required"`
		Quantity         float64 `json:"quantity" binding:"required"`
		Reason           string  `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := h.DB.Begin()

	// Find or create inventory record
	var inventory models.Inventory
	where := models.Inventory{ProductID: req.ProductID, WarehouseID: req.WarehouseID}
	if req.ProductVariantID != nil {
		where.ProductVariantID = req.ProductVariantID
	}

	if err := tx.Where(where).FirstOrCreate(&inventory, where).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate adjustment
	adjustment := req.Quantity - inventory.Quantity

	// Update inventory
	inventory.Quantity = req.Quantity
	if err := tx.Save(&inventory).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create inventory transaction
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	transaction := models.InventoryTransaction{
		ProductID:        req.ProductID,
		ProductVariantID: req.ProductVariantID,
		LocationType:     "warehouse",
		LocationID:       req.WarehouseID,
		WarehouseID:      &req.WarehouseID,
		TransactionType:  "adjustment",
		Quantity:         adjustment,
		ReferenceType:    "adjustment",
		Notes:            req.Reason,
		CreatedBy:        userID.(uint),
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"data": inventory})
}

// AdjustStoreInventory adjusts store inventory quantity
func (h *InventoryHandler) AdjustStoreInventory(c *gin.Context) {
	var req struct {
		ProductID        uint    `json:"product_id" binding:"required"`
		ProductVariantID *uint   `json:"product_variant_id"`
		StoreID          uint    `json:"store_id" binding:"required"`
		Quantity         float64 `json:"quantity" binding:"required"`
		Reason           string  `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction
	tx := h.DB.Begin()

	// Find or create store inventory record
	var storeInventory models.StoreInventory
	where := models.StoreInventory{ProductID: req.ProductID, StoreID: req.StoreID}
	if req.ProductVariantID != nil {
		where.ProductVariantID = req.ProductVariantID
	}

	if err := tx.Where(where).FirstOrCreate(&storeInventory, where).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate adjustment
	adjustment := req.Quantity - storeInventory.Quantity

	// Update store inventory
	storeInventory.Quantity = req.Quantity
	if err := tx.Save(&storeInventory).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create inventory transaction
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // fallback
	}

	transaction := models.InventoryTransaction{
		ProductID:        req.ProductID,
		ProductVariantID: req.ProductVariantID,
		LocationType:     "store",
		LocationID:       req.StoreID,
		StoreID:          &req.StoreID,
		TransactionType:  "adjustment",
		Quantity:         adjustment,
		ReferenceType:    "adjustment",
		Notes:            req.Reason,
		CreatedBy:        userID.(uint),
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"data": storeInventory})
}

// GetInventoryTransactions retrieves inventory transactions
func (h *InventoryHandler) GetInventoryTransactions(c *gin.Context) {
	var transactions []models.InventoryTransaction
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	productID := c.Query("product_id")
	warehouseID := c.Query("warehouse_id")
	storeID := c.Query("store_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Product").Preload("ProductVariant").Preload("Warehouse").Preload("Store").Preload("CreatedByUser")

	if productID != "" {
		query = query.Where("product_id = ?", productID)
	}

	if warehouseID != "" {
		query = query.Where("location_type = ? AND location_id = ?", "warehouse", warehouseID)
	}

	if storeID != "" {
		query = query.Where("location_type = ? AND location_id = ?", "store", storeID)
	}

	// Get total count
	query.Model(&models.InventoryTransaction{}).Count(&total)

	// Get transactions with pagination
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": transactions,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}
