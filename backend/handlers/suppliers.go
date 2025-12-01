package handlers

import (
	"net/http"
	"strconv"
	"time"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SupplierHandler struct {
	DB *gorm.DB
}

func NewSupplierHandler(db *gorm.DB) *SupplierHandler {
	return &SupplierHandler{DB: db}
}

// GetSuppliers retrieves all suppliers with pagination
func (h *SupplierHandler) GetSuppliers(c *gin.Context) {
	var suppliers []models.Supplier
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	query := h.DB.Model(&models.Supplier{})

	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ? OR contact ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Get total count
	query.Count(&total)

	// Get suppliers with pagination
	result := query.Offset(offset).Limit(limit).Find(&suppliers)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch suppliers",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": suppliers,
		"pagination": gin.H{
			"page":     page,
			"limit":    limit,
			"total":    total,
			"pages":    (total + int64(limit) - 1) / int64(limit),
			"has_next": int64(page*limit) < total,
			"has_prev": page > 1,
		},
	})
}

// GetSupplier retrieves a supplier by ID
func (h *SupplierHandler) GetSupplier(c *gin.Context) {
	id := c.Param("id")

	var supplier models.Supplier
	result := h.DB.First(&supplier, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Supplier not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch supplier",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": supplier,
	})
}

// CreateSupplier creates a new supplier
func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var supplier models.Supplier

	if err := c.ShouldBindJSON(&supplier); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Validate required fields
	if supplier.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Supplier name is required",
		})
		return
	}

	if supplier.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Supplier code is required",
		})
		return
	}

	// Check if supplier code already exists
	var existing models.Supplier
	if err := h.DB.Where("code = ?", supplier.Code).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Supplier code already exists",
		})
		return
	}

	result := h.DB.Create(&supplier)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create supplier",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    supplier,
		"message": "Supplier created successfully",
	})
}

// UpdateSupplier updates an existing supplier
func (h *SupplierHandler) UpdateSupplier(c *gin.Context) {
	id := c.Param("id")

	var supplier models.Supplier
	result := h.DB.First(&supplier, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Supplier not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find supplier",
		})
		return
	}

	var updateData models.Supplier
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Validate required fields
	if updateData.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Supplier name is required",
		})
		return
	}

	if updateData.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Supplier code is required",
		})
		return
	}

	// Check if supplier code already exists (excluding current supplier)
	var existing models.Supplier
	if err := h.DB.Where("code = ? AND id != ?", updateData.Code, supplier.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Supplier code already exists",
		})
		return
	}

	// Update supplier
	supplier.Name = updateData.Name
	supplier.Code = updateData.Code
	supplier.Contact = updateData.Contact
	supplier.Phone = updateData.Phone
	supplier.Email = updateData.Email
	supplier.Address = updateData.Address
	supplier.TaxNumber = updateData.TaxNumber
	supplier.Status = updateData.Status
	supplier.PaymentTerms = updateData.PaymentTerms
	supplier.CreditLimit = updateData.CreditLimit
	supplier.Notes = updateData.Notes
	supplier.UpdatedAt = time.Now()

	result = h.DB.Save(&supplier)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update supplier",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    supplier,
		"message": "Supplier updated successfully",
	})
}

// DeleteSupplier deletes a supplier by ID
func (h *SupplierHandler) DeleteSupplier(c *gin.Context) {
	id := c.Param("id")

	var supplier models.Supplier
	result := h.DB.First(&supplier, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Supplier not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find supplier",
		})
		return
	}

	result = h.DB.Delete(&supplier)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete supplier",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Supplier deleted successfully",
	})
}
