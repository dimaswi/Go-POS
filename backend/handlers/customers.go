package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	DB *gorm.DB
}

func NewCustomerHandler(db *gorm.DB) *CustomerHandler {
	return &CustomerHandler{DB: db}
}

// GetCustomers retrieves all customers with pagination
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	var customers []models.Customer
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	query := h.DB.Model(&models.Customer{})

	if search != "" {
		query = query.Where("name LIKE ? OR email LIKE ? OR phone LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Get total count
	query.Count(&total)

	// Get customers with pagination
	if err := query.Limit(limit).Offset(offset).Find(&customers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": customers,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetCustomer retrieves a single customer by ID
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	if err := h.DB.First(&customer, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": customer})
}

// CreateCustomer creates a new customer
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var customer models.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if customer.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// Check if email already exists (if provided)
	if customer.Email != "" {
		var existingCustomer models.Customer
		if err := h.DB.Where("email = ?", customer.Email).First(&existingCustomer).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
			return
		}
	}

	if err := h.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": customer})
}

// UpdateCustomer updates an existing customer
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	if err := h.DB.First(&customer, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updateData models.Customer
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email is being changed and already exists
	if updateData.Email != "" && updateData.Email != customer.Email {
		var existingCustomer models.Customer
		if err := h.DB.Where("email = ? AND id != ?", updateData.Email, id).First(&existingCustomer).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
			return
		}
	}

	// Use Select to explicitly update is_member field (GORM ignores zero values by default)
	if err := h.DB.Model(&customer).Select("name", "email", "phone", "address", "date_of_birth", "gender", "status", "is_member").Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload customer to get updated data
	h.DB.First(&customer, id)

	c.JSON(http.StatusOK, gin.H{"data": customer})
}

// DeleteCustomer deletes a customer
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	var customer models.Customer
	if err := h.DB.First(&customer, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if customer has any sales
	var salesCount int64
	h.DB.Model(&models.Sale{}).Where("customer_id = ?", id).Count(&salesCount)
	if salesCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete customer with existing sales"})
		return
	}

	if err := h.DB.Delete(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}

// GetCustomerStats retrieves customer statistics
func (h *CustomerHandler) GetCustomerStats(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	// Check if customer exists
	var customer models.Customer
	if err := h.DB.First(&customer, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get customer statistics
	var totalSales int64
	var totalSpent float64
	var lastPurchase *models.Sale

	h.DB.Model(&models.Sale{}).Where("customer_id = ? AND sale_status = ?", id, "completed").Count(&totalSales)
	h.DB.Model(&models.Sale{}).Where("customer_id = ? AND sale_status = ?", id, "completed").Select("COALESCE(SUM(total_amount), 0)").Scan(&totalSpent)
	h.DB.Where("customer_id = ? AND sale_status = ?", id, "completed").Order("sale_date DESC").First(&lastPurchase)

	stats := gin.H{
		"customer_id":    id,
		"total_sales":    totalSales,
		"total_spent":    totalSpent,
		"loyalty_points": customer.LoyaltyPoints,
		"last_purchase":  lastPurchase,
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
