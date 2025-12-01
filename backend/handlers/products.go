package handlers

import (
	"net/http"
	"strconv"

	"starter/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProductHandler struct {
	DB *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{DB: db}
}

// GetProducts retrieves all products with pagination
func (h *ProductHandler) GetProducts(c *gin.Context) {
	var products []models.Product
	var total int64

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	categoryID := c.Query("category_id")

	offset := (page - 1) * limit

	query := h.DB.Preload("Category").Preload("Variants")

	if search != "" {
		query = query.Where("name LIKE ? OR sku LIKE ? OR barcode LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	// Get total count
	query.Model(&models.Product{}).Count(&total)

	// Get products with pagination
	if err := query.Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetProduct retrieves a single product by ID
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Product
	if err := h.DB.Preload("Category").Preload("Variants").First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": product})
}

// CreateProduct creates a new product
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if product.Name == "" || product.SKU == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and SKU are required"})
		return
	}

	// Check if SKU already exists
	var existingProduct models.Product
	if err := h.DB.Where("sku = ?", product.SKU).First(&existingProduct).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SKU already exists"})
		return
	}

	if err := h.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with related data
	h.DB.Preload("Category").Preload("Variants").First(&product, product.ID)

	c.JSON(http.StatusCreated, gin.H{"data": product})
}

// UpdateProduct updates an existing product
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Product
	if err := h.DB.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var updateData models.Product
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if SKU is being changed and already exists
	if updateData.SKU != "" && updateData.SKU != product.SKU {
		var existingProduct models.Product
		if err := h.DB.Where("sku = ? AND id != ?", updateData.SKU, id).First(&existingProduct).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "SKU already exists"})
			return
		}
	}

	if err := h.DB.Model(&product).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with related data
	h.DB.Preload("Category").Preload("Variants").First(&product, product.ID)

	c.JSON(http.StatusOK, gin.H{"data": product})
}

// DeleteProduct deletes a product
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Product
	if err := h.DB.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if product has inventory or sales
	var inventoryCount int64
	h.DB.Model(&models.Inventory{}).Where("product_id = ?", id).Count(&inventoryCount)
	if inventoryCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete product with existing inventory"})
		return
	}

	if err := h.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// GetCategories retrieves all categories with pagination
func (h *ProductHandler) GetCategories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	h.DB.Model(&models.Category{}).Count(&total)

	var categories []models.Category

	if err := h.DB.Preload("Parent").Preload("Children").Offset(offset).Limit(limit).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// CreateCategory creates a new category
func (h *ProductHandler) CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if category.Name == "" || category.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and code are required"})
		return
	}

	// Check if code already exists
	var existingCategory models.Category
	if err := h.DB.Where("code = ?", category.Code).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category code already exists"})
		return
	}

	if err := h.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": category})
}

// GetCategory retrieves a single category by ID
func (h *ProductHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category

	if err := h.DB.Preload("Parent").First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": category})
}

// UpdateCategory updates an existing category
func (h *ProductHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category

	if err := h.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var updateData models.Category
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if updateData.Name == "" || updateData.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and code are required"})
		return
	}

	// Check if code already exists for other categories
	var existingCategory models.Category
	if err := h.DB.Where("code = ? AND id != ?", updateData.Code, id).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category code already exists"})
		return
	}

	// Update fields
	category.Name = updateData.Name
	category.Code = updateData.Code
	category.Description = updateData.Description
	category.ParentID = updateData.ParentID
	category.ImageURL = updateData.ImageURL
	category.Status = updateData.Status

	if err := h.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": category})
}

// DeleteCategory deletes a category
func (h *ProductHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	var category models.Category

	if err := h.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Check if category has products
	var productCount int64
	h.DB.Model(&models.Product{}).Where("category_id = ?", id).Count(&productCount)
	if productCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete category with existing products"})
		return
	}

	// Check if category has children
	var childCount int64
	h.DB.Model(&models.Category{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete category with subcategories"})
		return
	}

	if err := h.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}
