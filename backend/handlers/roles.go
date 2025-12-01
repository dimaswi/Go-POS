package handlers

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetRoles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	database.DB.Model(&models.Role{}).Count(&total)

	var roles []models.Role
	if err := database.DB.Preload("Permissions").Offset(offset).Limit(limit).Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": roles,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        total,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
		},
	})
}

func GetRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.Preload("Permissions").First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": role})
}

type CreateRoleRequest struct {
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		database.DB.Find(&permissions, req.PermissionIDs)
		database.DB.Model(&role).Association("Permissions").Append(permissions)
	}

	database.DB.Preload("Permissions").First(&role, role.ID)
	c.JSON(http.StatusCreated, gin.H{"data": role})
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")

	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role.Name = req.Name
	role.Description = req.Description

	if err := database.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		database.DB.Find(&permissions, req.PermissionIDs)
		database.DB.Model(&role).Association("Permissions").Replace(permissions)
	}

	database.DB.Preload("Permissions").First(&role, role.ID)
	c.JSON(http.StatusOK, gin.H{"data": role})
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Role{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role deleted successfully"})
}
