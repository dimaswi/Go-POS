package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WarehouseHandler struct {
	DB *gorm.DB
}

func NewWarehouseHandler(db *gorm.DB) *WarehouseHandler {
	return &WarehouseHandler{DB: db}
}

// GetWarehouses retrieves all warehouses with pagination
func (h *WarehouseHandler) GetWarehouses(c *gin.Context) {
	var warehouses []models.Warehouse
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	storeID := c.Query("store_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Manager").Preload("Store")

	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}

	// Get total count
	query.Model(&models.Warehouse{}).Count(&total)

	// Get warehouses with pagination
	if err := query.Limit(limit).Offset(offset).Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": warehouses,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetWarehouse retrieves a single warehouse by ID
func (h *WarehouseHandler) GetWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var warehouse models.Warehouse
	if err := h.DB.Preload("Manager").Preload("Store").First(&warehouse, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": warehouse})
}

// CreateWarehouse creates a new warehouse
func (h *WarehouseHandler) CreateWarehouse(c *gin.Context) {
	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if warehouse.Name == "" || warehouse.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and code are required"})
		return
	}

	// Check if code already exists
	var existingWarehouse models.Warehouse
	if err := h.DB.Where("code = ?", warehouse.Code).First(&existingWarehouse).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Warehouse code already exists"})
		return
	}

	if err := h.DB.Create(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with related data
	h.DB.Preload("Manager").Preload("Store").First(&warehouse, warehouse.ID)

	c.JSON(http.StatusCreated, gin.H{"data": warehouse})
}

// UpdateWarehouse updates an existing warehouse
func (h *WarehouseHandler) UpdateWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var warehouse models.Warehouse
	if err := h.DB.First(&warehouse, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updateData models.Warehouse
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if code is being changed and already exists
	if updateData.Code != "" && updateData.Code != warehouse.Code {
		var existingWarehouse models.Warehouse
		if err := h.DB.Where("code = ? AND id != ?", updateData.Code, id).First(&existingWarehouse).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Warehouse code already exists"})
			return
		}
	}

	if err := h.DB.Model(&warehouse).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with related data
	h.DB.Preload("Manager").Preload("Store").First(&warehouse, warehouse.ID)

	c.JSON(http.StatusOK, gin.H{"data": warehouse})
}

// DeleteWarehouse deletes a warehouse
func (h *WarehouseHandler) DeleteWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var warehouse models.Warehouse
	if err := h.DB.First(&warehouse, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if warehouse has any inventory
	var inventoryCount int64
	h.DB.Model(&models.Inventory{}).Where("warehouse_id = ?", id).Count(&inventoryCount)
	if inventoryCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete warehouse with existing inventory"})
		return
	}

	if err := h.DB.Delete(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Warehouse deleted successfully"})
}

// GetWarehouseInventory retrieves inventory for a specific warehouse
func (h *WarehouseHandler) GetWarehouseInventory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	// Check if warehouse exists
	var warehouse models.Warehouse
	if err := h.DB.First(&warehouse, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var inventory []models.Inventory
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	query := h.DB.Preload("Product").Preload("ProductVariant").Where("warehouse_id = ?", id)

	if search != "" {
		query = query.Joins("JOIN products ON inventory.product_id = products.id").
			Where("products.name LIKE ? OR products.sku LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.Inventory{}).Count(&total)

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
