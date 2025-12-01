package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SalesHandler struct {
	DB *gorm.DB
}

func NewSalesHandler(db *gorm.DB) *SalesHandler {
	return &SalesHandler{DB: db}
}

// getUserStoreID returns the store ID assigned to the current user
// Returns 0 if user is admin or not assigned to any store (can see all stores)
func (h *SalesHandler) getUserStoreID(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}

	var user models.User
	if err := h.DB.Preload("Role").First(&user, userID).Error; err != nil {
		return 0
	}

	// Admin, manager, owner, super roles can see all stores
	roleName := strings.ToLower(user.Role.Name)
	if roleName == "admin" || roleName == "manager" || roleName == "owner" || roleName == "super" || strings.Contains(roleName, "admin") {
		return 0
	}

	// Return user's assigned store ID (0 if not assigned)
	if user.StoreID != nil {
		return *user.StoreID
	}
	return 0
}

// GetSales retrieves all sales with pagination
func (h *SalesHandler) GetSales(c *gin.Context) {
	var sales []models.Sale
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	storeID := c.Query("store_id")
	status := c.Query("status")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	offset := (page - 1) * limit

	query := h.DB.Preload("Store").Preload("Customer").Preload("Cashier").Preload("Items").Preload("Items.Product").Preload("Payments")

	// Auto-filter by user's store if not admin
	userStoreID := h.getUserStoreID(c)
	if userStoreID > 0 {
		// User is assigned to a store, filter by their store
		query = query.Where("store_id = ?", userStoreID)
	} else if storeID != "" {
		// Admin can filter by any store
		query = query.Where("store_id = ?", storeID)
	}

	if search != "" {
		query = query.Where("sale_number LIKE ? OR notes LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if status != "" {
		query = query.Where("sale_status = ?", status)
	}

	if dateFrom != "" {
		query = query.Where("DATE(sale_date) >= ?", dateFrom)
	}

	if dateTo != "" {
		query = query.Where("DATE(sale_date) <= ?", dateTo)
	}

	// Get total count
	query.Model(&models.Sale{}).Count(&total)

	// Get sales with pagination
	if err := query.Order("sale_date DESC").Limit(limit).Offset(offset).Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": sales,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetSale retrieves a single sale by ID
func (h *SalesHandler) GetSale(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale ID"})
		return
	}

	var sale models.Sale
	if err := h.DB.Preload("Store").Preload("Customer").Preload("Cashier").
		Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("Payments").First(&sale, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sale not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sale})
}

// CreateSale creates a new sale (POS transaction)
func (h *SalesHandler) CreateSale(c *gin.Context) {
	var req struct {
		StoreID               uint                 `json:"store_id" binding:"required"`
		CustomerID            *uint                `json:"customer_id"`
		DiscountID            *uint                `json:"discount_id"`
		PointsRedeemed        int                  `json:"points_redeemed"`
		PointsRedemptionValue float64              `json:"points_redemption_value"`
		Items                 []models.SaleItem    `json:"items" binding:"required"`
		Payments              []models.SalePayment `json:"payments" binding:"required"`
		DiscountAmount        float64              `json:"discount_amount"`
		TaxAmount             float64              `json:"tax_amount"`
		Notes                 string               `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate store exists
	var store models.Store
	if err := h.DB.First(&store, req.StoreID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid store ID"})
		return
	}

	// Validate points redemption if applicable
	if req.PointsRedeemed > 0 && req.CustomerID != nil {
		var customer models.Customer
		if err := h.DB.First(&customer, *req.CustomerID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
			return
		}
		if !customer.IsMember {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Only members can redeem points"})
			return
		}
		if customer.LoyaltyPoints < req.PointsRedeemed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient loyalty points"})
			return
		}
	}

	// Start transaction
	tx := h.DB.Begin()

	// Generate sale number
	saleNumber := h.generateSaleNumber()

	// Calculate totals
	var subtotal float64
	for _, item := range req.Items {
		subtotal += item.TotalPrice
	}

	totalAmount := subtotal + req.TaxAmount - req.DiscountAmount

	// Calculate total paid amount
	var paidAmount float64
	for _, payment := range req.Payments {
		paidAmount += payment.Amount
	}

	changeAmount := paidAmount - totalAmount
	if changeAmount < 0 {
		changeAmount = 0
	}

	// Get user ID from JWT token
	userID := uint(1) // Default fallback
	if uid, exists := c.Get("user_id"); exists {
		if id, ok := uid.(uint); ok {
			userID = id
		}
	}

	// Determine primary payment method from payments
	primaryPaymentMethod := "cash"
	if len(req.Payments) > 0 {
		primaryPaymentMethod = req.Payments[0].PaymentMethod
	}

	// Create sale
	sale := models.Sale{
		SaleNumber:     saleNumber,
		StoreID:        req.StoreID,
		CustomerID:     req.CustomerID,
		DiscountID:     req.DiscountID,
		CashierID:      userID,
		Subtotal:       subtotal,
		TaxAmount:      req.TaxAmount,
		DiscountAmount: req.DiscountAmount,
		TotalAmount:    totalAmount,
		PaidAmount:     paidAmount,
		ChangeAmount:   changeAmount,
		PaymentStatus:  "paid",
		SaleStatus:     "completed",
		PaymentMethod:  primaryPaymentMethod,
		Notes:          req.Notes,
		SaleDate:       time.Now(),
	}

	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Track discount usage if discount was applied
	if req.DiscountID != nil && req.DiscountAmount > 0 {
		// Increment discount usage count
		if err := tx.Model(&models.Discount{}).Where("id = ?", *req.DiscountID).
			UpdateColumn("usage_count", gorm.Expr("usage_count + 1")).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update discount usage"})
			return
		}

		// Create discount usage record
		discountUsage := models.DiscountUsage{
			DiscountID: *req.DiscountID,
			CustomerID: req.CustomerID,
			SaleID:     sale.ID,
			Amount:     req.DiscountAmount,
		}
		if err := tx.Create(&discountUsage).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create discount usage record"})
			return
		}
	}

	// Create sale items and update inventory
	for _, item := range req.Items {
		item.SaleID = sale.ID
		if err := tx.Create(&item).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update inventory (reduce stock from store)
		if err := h.updateInventoryForSale(tx, req.StoreID, item, userID); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Create sale payments
	for _, payment := range req.Payments {
		payment.SaleID = sale.ID
		payment.Status = "completed"
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Update customer's total_spent, loyalty_points and last_visit if customer is specified
	if req.CustomerID != nil {
		now := time.Now()

		// Get loyalty settings from database
		minPurchaseForPoints := float64(10000) // Default: 1 point per Rp 10,000
		var loyaltySetting models.Setting
		if err := tx.Where("key = ?", "loyalty_min_purchase").First(&loyaltySetting).Error; err == nil {
			if val, err := strconv.ParseFloat(loyaltySetting.Value, 64); err == nil && val > 0 {
				minPurchaseForPoints = val
			}
		}

		// Calculate loyalty points earned (before points redemption)
		loyaltyPointsEarned := 0
		if totalAmount >= minPurchaseForPoints {
			loyaltyPointsEarned = int(totalAmount / minPurchaseForPoints)
		}

		// Calculate net points change (earned - redeemed)
		netPointsChange := loyaltyPointsEarned - req.PointsRedeemed

		updates := map[string]interface{}{
			"total_spent": gorm.Expr("total_spent + ?", totalAmount),
			"last_visit":  now,
		}

		// Update loyalty points if customer is a member
		var customer models.Customer
		if err := tx.First(&customer, *req.CustomerID).Error; err == nil && customer.IsMember {
			if netPointsChange != 0 {
				updates["loyalty_points"] = gorm.Expr("loyalty_points + ?", netPointsChange)
			}
		}

		if err := tx.Model(&models.Customer{}).Where("id = ?", *req.CustomerID).Updates(updates).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer stats"})
			return
		}
	}

	tx.Commit()

	// Reload with all relations
	h.DB.Preload("Store").Preload("Customer").Preload("Cashier").
		Preload("Items").Preload("Items.Product").Preload("Items.ProductVariant").
		Preload("Payments").First(&sale, sale.ID)

	c.JSON(http.StatusCreated, gin.H{"data": sale})
}

// UpdateSale updates an existing sale
func (h *SalesHandler) UpdateSale(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sale ID"})
		return
	}

	var sale models.Sale
	if err := h.DB.First(&sale, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Sale not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Only allow updating draft sales
	if sale.SaleStatus != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot update completed sale"})
		return
	}

	var updateData models.Sale
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&sale).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with relations
	h.DB.Preload("Store").Preload("Customer").Preload("Cashier").
		Preload("Items").Preload("Items.Product").Preload("Payments").First(&sale, sale.ID)

	c.JSON(http.StatusOK, gin.H{"data": sale})
}

// generateSaleNumber generates a unique sale number
func (h *SalesHandler) generateSaleNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")

	var count int64
	h.DB.Model(&models.Sale{}).Where("DATE(created_at) = CURRENT_DATE").Count(&count)

	// Use timestamp to ensure uniqueness
	return fmt.Sprintf("TRX%s%d", dateStr, now.UnixNano()/1000000)
}

// updateInventoryForSale reduces store inventory when sale is made
func (h *SalesHandler) updateInventoryForSale(tx *gorm.DB, storeID uint, item models.SaleItem, userID uint) error {
	// Find store inventory record
	var inventory models.StoreInventory
	where := models.StoreInventory{
		ProductID:        item.ProductID,
		ProductVariantID: item.ProductVariantID,
		StoreID:          storeID,
	}

	if err := tx.Where(where).First(&inventory).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("product ID %d not found in store inventory", item.ProductID)
		}
		return err
	}

	// Check if enough stock
	if inventory.Quantity < item.Quantity {
		return fmt.Errorf("insufficient inventory for product ID %d. Available: %.2f, Required: %.2f",
			item.ProductID, inventory.Quantity, item.Quantity)
	}

	// Reduce inventory
	inventory.Quantity -= item.Quantity
	if err := tx.Save(&inventory).Error; err != nil {
		return err
	}

	// Create inventory transaction
	transaction := models.InventoryTransaction{
		ProductID:        item.ProductID,
		ProductVariantID: item.ProductVariantID,
		LocationType:     "store",
		LocationID:       storeID,
		StoreID:          &storeID,
		TransactionType:  "out",
		Quantity:         -item.Quantity, // Negative for outgoing
		UnitCost:         item.UnitPrice,
		ReferenceType:    "sale",
		ReferenceID:      &item.SaleID,
		CreatedBy:        userID,
	}

	return tx.Create(&transaction).Error
}

// GetSalesStats retrieves sales statistics
func (h *SalesHandler) GetSalesStats(c *gin.Context) {
	storeID := c.Query("store_id")
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")

	query := h.DB.Model(&models.Sale{}).Where("sale_status = ?", "completed")

	// Auto-filter by user's store if not admin
	userStoreID := h.getUserStoreID(c)
	if userStoreID > 0 {
		// User is assigned to a store, filter by their store
		query = query.Where("store_id = ?", userStoreID)
	} else if storeID != "" {
		// Admin can filter by any store
		query = query.Where("store_id = ?", storeID)
	}

	if dateFrom != "" {
		query = query.Where("DATE(sale_date) >= ?", dateFrom)
	}

	if dateTo != "" {
		query = query.Where("DATE(sale_date) <= ?", dateTo)
	}

	// Get total sales and revenue
	var totalSales int64
	var totalRevenue float64

	query.Count(&totalSales)
	query.Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)

	// Get today's stats
	var todaySales int64
	var todayRevenue float64

	todayQuery := h.DB.Model(&models.Sale{}).Where("sale_status = ? AND DATE(sale_date) = CURRENT_DATE", "completed")
	if userStoreID > 0 {
		todayQuery = todayQuery.Where("store_id = ?", userStoreID)
	} else if storeID != "" {
		todayQuery = todayQuery.Where("store_id = ?", storeID)
	}

	todayQuery.Count(&todaySales)
	todayQuery.Select("COALESCE(SUM(total_amount), 0)").Scan(&todayRevenue)

	stats := gin.H{
		"total_sales":   totalSales,
		"total_revenue": totalRevenue,
		"today_sales":   todaySales,
		"today_revenue": todayRevenue,
		"average_sale": func() float64 {
			if totalSales > 0 {
				return totalRevenue / float64(totalSales)
			} else {
				return 0
			}
		}(),
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}
