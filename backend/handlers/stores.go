package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StoreHandler struct {
	DB *gorm.DB
}

func NewStoreHandler(db *gorm.DB) *StoreHandler {
	return &StoreHandler{DB: db}
}

// GetStores retrieves all stores with pagination
func (h *StoreHandler) GetStores(c *gin.Context) {
	var stores []models.Store
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	query := h.DB.Preload("Manager")

	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Get total count
	query.Model(&models.Store{}).Count(&total)

	// Get stores with pagination
	if err := query.Limit(limit).Offset(offset).Find(&stores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": stores,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetStore retrieves a single store by ID
func (h *StoreHandler) GetStore(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	var store models.Store
	if err := h.DB.Preload("Manager").First(&store, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": store})
}

// CreateStore creates a new store
func (h *StoreHandler) CreateStore(c *gin.Context) {
	var store models.Store
	if err := c.ShouldBindJSON(&store); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if store.Name == "" || store.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and code are required"})
		return
	}

	// Check if code already exists
	var existingStore models.Store
	if err := h.DB.Where("code = ?", store.Code).First(&existingStore).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Store code already exists"})
		return
	}

	if err := h.DB.Create(&store).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with manager data
	h.DB.Preload("Manager").First(&store, store.ID)

	c.JSON(http.StatusCreated, gin.H{"data": store})
}

// UpdateStore updates an existing store
func (h *StoreHandler) UpdateStore(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	var store models.Store
	if err := h.DB.First(&store, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updateData models.Store
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if code is being changed and already exists
	if updateData.Code != "" && updateData.Code != store.Code {
		var existingStore models.Store
		if err := h.DB.Where("code = ? AND id != ?", updateData.Code, id).First(&existingStore).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Store code already exists"})
			return
		}
	}

	if err := h.DB.Model(&store).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with manager data
	h.DB.Preload("Manager").First(&store, store.ID)

	c.JSON(http.StatusOK, gin.H{"data": store})
}

// DeleteStore deletes a store
func (h *StoreHandler) DeleteStore(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	var store models.Store
	if err := h.DB.First(&store, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if store has any sales or other dependencies
	var salesCount int64
	h.DB.Model(&models.Sale{}).Where("store_id = ?", id).Count(&salesCount)
	if salesCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete store with existing sales"})
		return
	}

	if err := h.DB.Delete(&store).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Store deleted successfully"})
}

// GetStoreStats retrieves store statistics
func (h *StoreHandler) GetStoreStats(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	// Check if store exists
	var store models.Store
	if err := h.DB.First(&store, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Store not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get sales statistics
	var totalSales int64
	var totalRevenue float64

	h.DB.Model(&models.Sale{}).Where("store_id = ? AND sale_status = ?", id, "completed").Count(&totalSales)
	h.DB.Model(&models.Sale{}).Where("store_id = ? AND sale_status = ?", id, "completed").Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

	// Get today's sales
	var todaySales int64
	var todayRevenue float64

	h.DB.Model(&models.Sale{}).Where("store_id = ? AND sale_status = ? AND DATE(sale_date) = CURDATE()", id, "completed").Count(&todaySales)
	h.DB.Model(&models.Sale{}).Where("store_id = ? AND sale_status = ? AND DATE(sale_date) = CURDATE()", id, "completed").Select("COALESCE(SUM(total_amount), 0)").Scan(&todayRevenue)

	stats := gin.H{
		"store_id":      id,
		"total_sales":   totalSales,
		"total_revenue": totalRevenue,
		"today_sales":   todaySales,
		"today_revenue": todayRevenue,
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
