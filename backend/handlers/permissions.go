package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"

	"github.com/gin-gonic/gin"
)

func GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	if err := database.DB.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permissions})
}

func GetPermissionsByModule(c *gin.Context) {
	var permissions []models.Permission
	if err := database.DB.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Group permissions by module
	modulePermissions := make(map[string][]models.Permission)
	for _, permission := range permissions {
		modulePermissions[permission.Module] = append(modulePermissions[permission.Module], permission)
	}

	c.JSON(http.StatusOK, gin.H{"data": modulePermissions})
}

func GetPermission(c *gin.Context) {
	id := c.Param("id")

	var permission models.Permission
	if err := database.DB.First(&permission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permission})
}

type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Module      string `json:"module" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Description string `json:"description"`
	Actions     string `json:"actions" binding:"required"` // JSON string of actions
}

func CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	permission := models.Permission{
		Name:        req.Name,
		Module:      req.Module,
		Category:    req.Category,
		Description: req.Description,
		Actions:     req.Actions,
	}

	if err := database.DB.Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": permission})
}

type UpdatePermissionRequest struct {
	Name        string `json:"name"`
	Module      string `json:"module"`
	Category    string `json:"category"`
	Description string `json:"description"`
	Actions     string `json:"actions"`
}

func UpdatePermission(c *gin.Context) {
	id := c.Param("id")

	var permission models.Permission
	if err := database.DB.First(&permission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
		return
	}

	var req UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != "" {
		permission.Name = req.Name
	}
	if req.Module != "" {
		permission.Module = req.Module
	}
	if req.Category != "" {
		permission.Category = req.Category
	}
	if req.Description != "" {
		permission.Description = req.Description
	}
	if req.Actions != "" {
		permission.Actions = req.Actions
	}

	if err := database.DB.Save(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": permission})
}

func DeletePermission(c *gin.Context) {
	id := c.Param("id")

	// Check if permission is being used by any role
	var count int64
	database.DB.Table("role_permissions").Where("permission_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete permission that is assigned to roles"})
		return
	}

	if err := database.DB.Delete(&models.Permission{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission deleted successfully"})
}
