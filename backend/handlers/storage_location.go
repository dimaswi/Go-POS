package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StorageLocationHandler struct {
	DB *gorm.DB
}

func NewStorageLocationHandler(db *gorm.DB) *StorageLocationHandler {
	return &StorageLocationHandler{DB: db}
}

// GetAll retrieves all storage locations with pagination and filtering
func (h *StorageLocationHandler) GetAll(c *gin.Context) {
	var locations []models.StorageLocation
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	locationType := c.Query("type")                // warehouse or store
	locationTypeFilter := c.Query("location_type") // zone, aisle, shelf, etc.
	warehouseID := c.Query("warehouse_id")
	storeID := c.Query("store_id")
	isActive := c.Query("is_active")

	offset := (page - 1) * limit

	query := h.DB.Model(&models.StorageLocation{}).
		Preload("Warehouse").
		Preload("Store").
		Preload("Parent")

	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ? OR description LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if locationType != "" {
		query = query.Where("type = ?", locationType)
	}

	if locationTypeFilter != "" {
		query = query.Where("location_type = ?", locationTypeFilter)
	}

	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	if storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}

	if isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	// Get total count
	query.Count(&total)

	// Get locations with pagination
	if err := query.Order("sort_order ASC, name ASC").Limit(limit).Offset(offset).Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": locations,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetByID retrieves a single storage location by ID
func (h *StorageLocationHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location ID"})
		return
	}

	var location models.StorageLocation
	if err := h.DB.Preload("Warehouse").Preload("Store").Preload("Parent").
		First(&location, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Storage location not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": location})
}

// Create creates a new storage location
func (h *StorageLocationHandler) Create(c *gin.Context) {
	var req struct {
		Code         string  `json:"code" binding:"required"`
		Name         string  `json:"name" binding:"required"`
		Type         string  `json:"type" binding:"required"` // warehouse or store
		LocationType string  `json:"location_type" binding:"required"`
		WarehouseID  *uint   `json:"warehouse_id"`
		StoreID      *uint   `json:"store_id"`
		ParentID     *uint   `json:"parent_id"`
		Description  string  `json:"description"`
		Capacity     float64 `json:"capacity"`
		SortOrder    int     `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate type and location assignment
	if req.Type == "warehouse" && req.WarehouseID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Warehouse ID is required for warehouse locations"})
		return
	}
	if req.Type == "store" && req.StoreID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Store ID is required for store locations"})
		return
	}

	// Check if code already exists
	var existing models.StorageLocation
	if err := h.DB.Where("code = ?", req.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location code already exists"})
		return
	}

	location := models.StorageLocation{
		Code:         req.Code,
		Name:         req.Name,
		Type:         req.Type,
		LocationType: req.LocationType,
		WarehouseID:  req.WarehouseID,
		StoreID:      req.StoreID,
		ParentID:     req.ParentID,
		Description:  req.Description,
		Capacity:     req.Capacity,
		IsActive:     true,
		SortOrder:    req.SortOrder,
	}

	if err := h.DB.Create(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with preloads
	h.DB.Preload("Warehouse").Preload("Store").Preload("Parent").First(&location, location.ID)

	c.JSON(http.StatusCreated, gin.H{"data": location, "message": "Storage location created successfully"})
}

// Update updates an existing storage location
func (h *StorageLocationHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location ID"})
		return
	}

	var location models.StorageLocation
	if err := h.DB.First(&location, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Storage location not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var req struct {
		Code         string  `json:"code"`
		Name         string  `json:"name"`
		LocationType string  `json:"location_type"`
		ParentID     *uint   `json:"parent_id"`
		Description  string  `json:"description"`
		Capacity     float64 `json:"capacity"`
		IsActive     *bool   `json:"is_active"`
		SortOrder    int     `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if code already exists (if changed)
	if req.Code != "" && req.Code != location.Code {
		var existing models.StorageLocation
		if err := h.DB.Where("code = ? AND id != ?", req.Code, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Location code already exists"})
			return
		}
		location.Code = req.Code
	}

	if req.Name != "" {
		location.Name = req.Name
	}
	if req.LocationType != "" {
		location.LocationType = req.LocationType
	}
	if req.ParentID != nil {
		location.ParentID = req.ParentID
	}
	location.Description = req.Description
	location.Capacity = req.Capacity
	location.SortOrder = req.SortOrder
	if req.IsActive != nil {
		location.IsActive = *req.IsActive
	}

	if err := h.DB.Save(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with preloads
	h.DB.Preload("Warehouse").Preload("Store").Preload("Parent").First(&location, id)

	c.JSON(http.StatusOK, gin.H{"data": location, "message": "Storage location updated successfully"})
}

// Delete deletes a storage location
func (h *StorageLocationHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location ID"})
		return
	}

	var location models.StorageLocation
	if err := h.DB.First(&location, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Storage location not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if location has children
	var childCount int64
	h.DB.Model(&models.StorageLocation{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete location with child locations"})
		return
	}

	if err := h.DB.Delete(&location).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Storage location deleted successfully"})
}

// GetLocationTypes returns available location types
func (h *StorageLocationHandler) GetLocationTypes(c *gin.Context) {
	locationType := c.Query("type") // warehouse or store

	warehouseTypes := []map[string]string{
		{"value": "zone", "label": "Zona"},
		{"value": "aisle", "label": "Lorong (Aisle)"},
		{"value": "shelf", "label": "Rak"},
		{"value": "level", "label": "Level/Tingkat"},
		{"value": "bin", "label": "Bin/Container"},
	}

	storeTypes := []map[string]string{
		{"value": "section", "label": "Seksi/Area"},
		{"value": "shelf", "label": "Rak"},
		{"value": "display_area", "label": "Area Display"},
	}

	if locationType == "warehouse" {
		c.JSON(http.StatusOK, gin.H{"data": warehouseTypes})
	} else if locationType == "store" {
		c.JSON(http.StatusOK, gin.H{"data": storeTypes})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"warehouse": warehouseTypes,
			"store":     storeTypes,
		})
	}
}

// GetProductsByLocation retrieves products in a specific location
func (h *StorageLocationHandler) GetProductsByLocation(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location ID"})
		return
	}

	var location models.StorageLocation
	if err := h.DB.First(&location, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Storage location not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get products based on location type
	if location.Type == "warehouse" {
		var inventory []models.Inventory
		query := h.DB.Preload("Product").Preload("ProductVariant").Preload("Warehouse")

		// Filter based on location type
		switch location.LocationType {
		case "zone":
			query = query.Where("zone = ? AND warehouse_id = ?", location.Name, location.WarehouseID)
		case "aisle":
			query = query.Where("aisle = ? AND warehouse_id = ?", location.Name, location.WarehouseID)
		case "shelf":
			query = query.Where("shelf_location = ? AND warehouse_id = ?", location.Name, location.WarehouseID)
		case "bin":
			query = query.Where("bin_location = ? AND warehouse_id = ?", location.Name, location.WarehouseID)
		}

		if err := query.Find(&inventory).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": inventory, "location": location})
	} else {
		var inventory []models.StoreInventory
		query := h.DB.Preload("Product").Preload("ProductVariant").Preload("Store")

		// Filter based on location type
		switch location.LocationType {
		case "section":
			query = query.Where("section = ? AND store_id = ?", location.Name, location.StoreID)
		case "shelf":
			query = query.Where("shelf_location = ? AND store_id = ?", location.Name, location.StoreID)
		case "display_area":
			query = query.Where("display_area = ? AND store_id = ?", location.Name, location.StoreID)
		}

		if err := query.Find(&inventory).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": inventory, "location": location})
	}
}

// GetByWarehouse retrieves all storage locations for a specific warehouse
func (h *StorageLocationHandler) GetByWarehouse(c *gin.Context) {
	warehouseID, err := strconv.Atoi(c.Param("warehouseId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid warehouse ID"})
		return
	}

	var locations []models.StorageLocation
	if err := h.DB.Preload("Parent").
		Where("type = ? AND warehouse_id = ? AND is_active = ?", "warehouse", warehouseID, true).
		Order("sort_order ASC, name ASC").
		Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// GetByStore retrieves all storage locations for a specific store
func (h *StorageLocationHandler) GetByStore(c *gin.Context) {
	storeID, err := strconv.Atoi(c.Param("storeId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	var locations []models.StorageLocation
	if err := h.DB.Preload("Parent").
		Where("type = ? AND store_id = ? AND is_active = ?", "store", storeID, true).
		Order("sort_order ASC, name ASC").
		Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}

// GetAllActive retrieves all active storage locations
func (h *StorageLocationHandler) GetAllActive(c *gin.Context) {
	var locations []models.StorageLocation
	if err := h.DB.Preload("Warehouse").Preload("Store").Preload("Parent").
		Where("is_active = ?", true).
		Order("type ASC, sort_order ASC, name ASC").
		Find(&locations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": locations})
}
