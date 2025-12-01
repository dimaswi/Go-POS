package handlers

import (
	"net/http"
	"strconv"
	"time"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DiscountHandler struct {
	DB *gorm.DB
}

// getUserIDFromContext extracts user ID from JWT context
func getUserIDFromContext(c *gin.Context) uint {
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			return id
		}
	}
	return 1 // Default fallback
}

// DiscountRequest is a custom struct for parsing discount input with flexible date format
type DiscountRequest struct {
	Name             string  `json:"name"`
	Code             string  `json:"code"`
	Description      string  `json:"description"`
	DiscountType     string  `json:"discount_type"`
	DiscountValue    float64 `json:"discount_value"`
	MinPurchase      float64 `json:"min_purchase"`
	MaxDiscount      float64 `json:"max_discount"`
	ApplicableTo     string  `json:"applicable_to"`
	CustomerID       *uint   `json:"customer_id"`
	ApplicableItems  string  `json:"applicable_items"`
	CategoryID       *uint   `json:"category_id"`
	ProductID        *uint   `json:"product_id"`
	UsageLimit       int     `json:"usage_limit"`
	UsagePerCustomer int     `json:"usage_per_customer"`
	StartDate        *string `json:"start_date"`
	EndDate          *string `json:"end_date"`
	IsActive         *bool   `json:"is_active"`
	StoreID          *uint   `json:"store_id"`
}

// parseDate parses date string in multiple formats
func parseDate(dateStr string) (*time.Time, error) {
	if dateStr == "" {
		return nil, nil
	}

	// Try different date formats
	formats := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return &t, nil
		}
	}

	return nil, nil
}

func NewDiscountHandler(db *gorm.DB) *DiscountHandler {
	return &DiscountHandler{DB: db}
}

// GetDiscounts retrieves all discounts with pagination
func (h *DiscountHandler) GetDiscounts(c *gin.Context) {
	var discounts []models.Discount
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")

	offset := (page - 1) * limit

	query := h.DB.Preload("Store").Preload("Customer").Preload("CreatedByUser")

	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}

	query.Model(&models.Discount{}).Count(&total)

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&discounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": discounts,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetDiscount retrieves a single discount by ID
func (h *DiscountHandler) GetDiscount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount ID"})
		return
	}

	var discount models.Discount
	if err := h.DB.Preload("Store").Preload("Customer").Preload("CreatedByUser").First(&discount, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Discount not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": discount})
}

// CreateDiscount creates a new discount
func (h *DiscountHandler) CreateDiscount(c *gin.Context) {
	var req DiscountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate discount type
	if req.DiscountType != "percentage" && req.DiscountType != "fixed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount type. Must be 'percentage' or 'fixed'"})
		return
	}

	// Validate percentage value
	if req.DiscountType == "percentage" && req.DiscountValue > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Percentage discount cannot exceed 100%"})
		return
	}

	// Parse dates
	var startDate, endDate *time.Time
	if req.StartDate != nil {
		startDate, _ = parseDate(*req.StartDate)
	}
	if req.EndDate != nil {
		endDate, _ = parseDate(*req.EndDate)
	}

	// Set default is_active
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	discount := models.Discount{
		Name:             req.Name,
		Code:             req.Code,
		Description:      req.Description,
		DiscountType:     req.DiscountType,
		DiscountValue:    req.DiscountValue,
		MinPurchase:      req.MinPurchase,
		MaxDiscount:      req.MaxDiscount,
		ApplicableTo:     req.ApplicableTo,
		CustomerID:       req.CustomerID,
		ApplicableItems:  req.ApplicableItems,
		CategoryID:       req.CategoryID,
		ProductID:        req.ProductID,
		UsageLimit:       req.UsageLimit,
		UsagePerCustomer: req.UsagePerCustomer,
		StartDate:        startDate,
		EndDate:          endDate,
		IsActive:         isActive,
		StoreID:          req.StoreID,
		CreatedBy:        getUserIDFromContext(c),
	}

	if err := h.DB.Create(&discount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with relations
	h.DB.Preload("Store").Preload("Customer").Preload("CreatedByUser").First(&discount, discount.ID)

	c.JSON(http.StatusCreated, gin.H{"data": discount})
}

// UpdateDiscount updates an existing discount
func (h *DiscountHandler) UpdateDiscount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount ID"})
		return
	}

	var discount models.Discount
	if err := h.DB.First(&discount, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Discount not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var req DiscountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate discount type
	if req.DiscountType != "" && req.DiscountType != "percentage" && req.DiscountType != "fixed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount type"})
		return
	}

	// Parse dates
	if req.StartDate != nil {
		discount.StartDate, _ = parseDate(*req.StartDate)
	}
	if req.EndDate != nil {
		discount.EndDate, _ = parseDate(*req.EndDate)
	}

	// Update fields
	if req.Name != "" {
		discount.Name = req.Name
	}
	if req.Code != "" {
		discount.Code = req.Code
	}
	discount.Description = req.Description
	if req.DiscountType != "" {
		discount.DiscountType = req.DiscountType
	}
	if req.DiscountValue > 0 {
		discount.DiscountValue = req.DiscountValue
	}
	discount.MinPurchase = req.MinPurchase
	discount.MaxDiscount = req.MaxDiscount
	if req.ApplicableTo != "" {
		discount.ApplicableTo = req.ApplicableTo
	}
	discount.CustomerID = req.CustomerID
	if req.ApplicableItems != "" {
		discount.ApplicableItems = req.ApplicableItems
	}
	discount.CategoryID = req.CategoryID
	discount.ProductID = req.ProductID
	discount.UsageLimit = req.UsageLimit
	discount.UsagePerCustomer = req.UsagePerCustomer
	if req.IsActive != nil {
		discount.IsActive = *req.IsActive
	}
	discount.StoreID = req.StoreID

	if err := h.DB.Save(&discount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with relations
	h.DB.Preload("Store").Preload("Customer").Preload("CreatedByUser").First(&discount, id)

	c.JSON(http.StatusOK, gin.H{"data": discount})
}

// DeleteDiscount soft deletes a discount
func (h *DiscountHandler) DeleteDiscount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid discount ID"})
		return
	}

	var discount models.Discount
	if err := h.DB.First(&discount, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Discount not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Delete(&discount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Discount deleted successfully"})
}

// ValidateDiscount checks if a discount code is valid for the given context
func (h *DiscountHandler) ValidateDiscount(c *gin.Context) {
	code := c.Query("code")
	customerID := c.Query("customer_id")
	storeID := c.Query("store_id")
	amount := c.Query("amount")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discount code is required"})
		return
	}

	var discount models.Discount
	if err := h.DB.Where("code = ? AND is_active = ?", code, true).First(&discount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid discount code"})
		return
	}

	now := time.Now()

	// Check date validity
	if discount.StartDate != nil && now.Before(*discount.StartDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discount not yet active"})
		return
	}
	if discount.EndDate != nil && now.After(*discount.EndDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discount has expired"})
		return
	}

	// Check usage limit
	if discount.UsageLimit > 0 && discount.UsageCount >= discount.UsageLimit {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discount usage limit reached"})
		return
	}

	// Check store restriction
	if discount.StoreID != nil && storeID != "" {
		storeIDInt, _ := strconv.Atoi(storeID)
		if uint(storeIDInt) != *discount.StoreID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Discount not valid for this store"})
			return
		}
	}

	// Check minimum purchase
	if amount != "" {
		purchaseAmount, _ := strconv.ParseFloat(amount, 64)
		if purchaseAmount < discount.MinPurchase {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Minimum purchase amount not met"})
			return
		}
	}

	// Check customer restriction
	if discount.ApplicableTo == "member" && customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discount only for members"})
		return
	}

	if discount.ApplicableTo == "specific_customer" && discount.CustomerID != nil {
		if customerID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Discount only for specific customer"})
			return
		}
		customerIDInt, _ := strconv.Atoi(customerID)
		if uint(customerIDInt) != *discount.CustomerID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Discount not valid for this customer"})
			return
		}
	}

	// Check per-customer usage limit
	if discount.UsagePerCustomer > 0 && customerID != "" {
		var usageCount int64
		h.DB.Model(&models.DiscountUsage{}).
			Where("discount_id = ? AND customer_id = ?", discount.ID, customerID).
			Count(&usageCount)

		if int(usageCount) >= discount.UsagePerCustomer {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You have reached the usage limit for this discount"})
			return
		}
	}

	// Calculate discount amount
	var discountAmount float64
	if amount != "" {
		purchaseAmount, _ := strconv.ParseFloat(amount, 64)
		if discount.DiscountType == "percentage" {
			discountAmount = purchaseAmount * (discount.DiscountValue / 100)
		} else {
			discountAmount = discount.DiscountValue
		}

		// Apply max discount cap
		if discount.MaxDiscount > 0 && discountAmount > discount.MaxDiscount {
			discountAmount = discount.MaxDiscount
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":           true,
		"discount":        discount,
		"discount_amount": discountAmount,
	})
}

// GetActiveDiscounts retrieves all currently active discounts
func (h *DiscountHandler) GetActiveDiscounts(c *gin.Context) {
	var discounts []models.Discount
	now := time.Now()

	query := h.DB.Where("is_active = ?", true).
		Where("(start_date IS NULL OR start_date <= ?)", now).
		Where("(end_date IS NULL OR end_date >= ?)", now).
		Where("(usage_limit = 0 OR usage_count < usage_limit)")

	storeID := c.Query("store_id")
	if storeID != "" {
		query = query.Where("store_id IS NULL OR store_id = ?", storeID)
	}

	customerID := c.Query("customer_id")
	if customerID != "" {
		query = query.Where("applicable_to = 'all' OR applicable_to = 'member' OR (applicable_to = 'specific_customer' AND customer_id = ?)", customerID)
	}
	// If no customer_id provided, still load 'all' and 'member' discounts for POS use
	// The frontend will filter based on customer selection

	if err := query.Preload("Store").Find(&discounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": discounts})
}
