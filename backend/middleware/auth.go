package middleware

import (
	"net/http"
	"starter/backend/database"
	"starter/backend/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret []byte

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	RoleID uint   `json:"role_id"`
	jwt.RegisteredClaims
}

func GenerateToken(user *models.User) (string, error) {
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RoleID: user.RoleID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role_id", claims.RoleID)
		c.Next()
	}
}

func RequirePermission(permission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userID, _ := c.Get("user_id")

		// Admin bypass: User ID 1 with Role ID 1 always has all permissions
		if userID.(uint) == 1 && roleID.(uint) == 1 {
			c.Next()
			return
		}

		// Also bypass for any user with role name "admin" (case insensitive check)
		var role models.Role
		if err := database.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			c.Abort()
			return
		}

		// Admin role always has all permissions
		if strings.ToLower(role.Name) == "admin" {
			c.Next()
			return
		}

		hasPermission := false
		for _, perm := range role.Permissions {
			if perm.Name == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission checks if user has at least one of the specified permissions (OR logic)
// This is useful for POS access where kasir needs to read stores/inventory data without full access
func RequireAnyPermission(permissions ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleID, exists := c.Get("role_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userID, _ := c.Get("user_id")

		// Admin bypass: User ID 1 with Role ID 1 always has all permissions
		if userID.(uint) == 1 && roleID.(uint) == 1 {
			c.Next()
			return
		}

		// Get role with permissions
		var role models.Role
		if err := database.DB.Preload("Permissions").First(&role, roleID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			c.Abort()
			return
		}

		// Admin role always has all permissions
		if strings.ToLower(role.Name) == "admin" {
			c.Next()
			return
		}

		// Check if user has at least one of the required permissions
		hasAnyPermission := false
		for _, requiredPerm := range permissions {
			for _, perm := range role.Permissions {
				if perm.Name == requiredPerm {
					hasAnyPermission = true
					break
				}
			}
			if hasAnyPermission {
				break
			}
		}

		if !hasAnyPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
