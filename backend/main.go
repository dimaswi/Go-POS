package main

import (
	"log"
	"starter/backend/config"
	"starter/backend/database"
	"starter/backend/handlers"
	"starter/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default configuration")
	}

	// Load config
	cfg := config.Load()

	// Set JWT secret
	middleware.SetJWTSecret(cfg.JWTSecret)

	// Connect to database
	if err := database.Connect(cfg.DatabaseDSN); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Skip auto migration - restore database manually
	// if err := database.Migrate(); err != nil {
	// 	log.Fatal("Failed to migrate database:", err)
	// }

	// Skip seeding - data will come from restore
	// if err := database.SeedData(); err != nil {
	// 	log.Printf("Warning: Failed to seed data: %v", err)
	// }

	// Set Gin mode from config
	gin.SetMode(cfg.GinMode)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware - use config for frontend URL
	corsOrigins := []string{cfg.FrontendURL, "http://localhost:5173", "http://localhost:3000"}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		api.GET("/settings", handlers.GetSettings) // Public access to settings

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/auth/profile", handlers.GetProfile)

			// Settings routes
			protected.PUT("/settings", handlers.UpdateSettings)

			// Users routes (with RBAC)
			protected.GET("/users", middleware.RequirePermission("users.view"), handlers.GetUsers)
			protected.GET("/users/:id", middleware.RequirePermission("users.view"), handlers.GetUser)
			protected.POST("/users", middleware.RequirePermission("users.create"), handlers.CreateUser)
			protected.PUT("/users/:id", middleware.RequirePermission("users.update"), handlers.UpdateUser)
			protected.DELETE("/users/:id", middleware.RequirePermission("users.delete"), handlers.DeleteUser)

			// Roles routes (with RBAC)
			protected.GET("/roles", middleware.RequirePermission("roles.view"), handlers.GetRoles)
			protected.GET("/roles/:id", middleware.RequirePermission("roles.view"), handlers.GetRole)
			protected.POST("/roles", middleware.RequirePermission("roles.create"), handlers.CreateRole)
			protected.PUT("/roles/:id", middleware.RequirePermission("roles.update"), handlers.UpdateRole)
			protected.DELETE("/roles/:id", middleware.RequirePermission("roles.delete"), handlers.DeleteRole)

			// Permissions routes
			protected.GET("/permissions", middleware.RequirePermission("permissions.view"), handlers.GetPermissions)
			protected.GET("/permissions/by-module", middleware.RequirePermission("permissions.view"), handlers.GetPermissionsByModule)
			protected.GET("/permissions/:id", middleware.RequirePermission("permissions.view"), handlers.GetPermission)
			protected.POST("/permissions", middleware.RequirePermission("permissions.create"), handlers.CreatePermission)
			protected.PUT("/permissions/:id", middleware.RequirePermission("permissions.update"), handlers.UpdatePermission)
			protected.DELETE("/permissions/:id", middleware.RequirePermission("permissions.delete"), handlers.DeletePermission)

			// Initialize handlers
			storeHandler := handlers.NewStoreHandler(database.DB)
			warehouseHandler := handlers.NewWarehouseHandler(database.DB)
			productHandler := handlers.NewProductHandler(database.DB)
			inventoryHandler := handlers.NewInventoryHandler(database.DB)
			salesHandler := handlers.NewSalesHandler(database.DB)
			customerHandler := handlers.NewCustomerHandler(database.DB)
			supplierHandler := handlers.NewSupplierHandler(database.DB)
			purchaseOrderHandler := handlers.NewPurchaseOrderHandler(database.DB)
			stockTransferHandler := handlers.NewStockTransferHandler(database.DB)
			storageLocationHandler := handlers.NewStorageLocationHandler(database.DB)
			discountHandler := handlers.NewDiscountHandler(database.DB)

			// Store routes
			// Note: pos.view allows POS/Kasir to read store list without full stores management access
			protected.GET("/stores", middleware.RequireAnyPermission("stores.view", "pos.view"), storeHandler.GetStores)
			protected.GET("/stores/:id", middleware.RequireAnyPermission("stores.view", "pos.view"), storeHandler.GetStore)
			protected.POST("/stores", middleware.RequirePermission("stores.create"), storeHandler.CreateStore)
			protected.PUT("/stores/:id", middleware.RequirePermission("stores.update"), storeHandler.UpdateStore)
			protected.DELETE("/stores/:id", middleware.RequirePermission("stores.delete"), storeHandler.DeleteStore)
			protected.GET("/stores/:id/stats", middleware.RequireAnyPermission("stores.view", "pos.view"), storeHandler.GetStoreStats)

			// Warehouse routes
			protected.GET("/warehouses", middleware.RequirePermission("warehouses.view"), warehouseHandler.GetWarehouses)
			protected.GET("/warehouses/:id", middleware.RequirePermission("warehouses.view"), warehouseHandler.GetWarehouse)
			protected.POST("/warehouses", middleware.RequirePermission("warehouses.create"), warehouseHandler.CreateWarehouse)
			protected.PUT("/warehouses/:id", middleware.RequirePermission("warehouses.update"), warehouseHandler.UpdateWarehouse)
			protected.DELETE("/warehouses/:id", middleware.RequirePermission("warehouses.delete"), warehouseHandler.DeleteWarehouse)
			protected.GET("/warehouses/:id/inventory", middleware.RequirePermission("inventory.view"), warehouseHandler.GetWarehouseInventory)

			// Product routes
			// Note: pos.view allows POS/Kasir to read products for transactions
			protected.GET("/products", middleware.RequireAnyPermission("products.view", "pos.view"), productHandler.GetProducts)
			protected.GET("/products/:id", middleware.RequireAnyPermission("products.view", "pos.view"), productHandler.GetProduct)
			protected.POST("/products", middleware.RequirePermission("products.create"), productHandler.CreateProduct)
			protected.PUT("/products/:id", middleware.RequirePermission("products.update"), productHandler.UpdateProduct)
			protected.DELETE("/products/:id", middleware.RequirePermission("products.delete"), productHandler.DeleteProduct)

			// Category routes
			// Note: pos.view allows POS/Kasir to read categories for filtering products
			protected.GET("/categories", middleware.RequireAnyPermission("products.view", "pos.view"), productHandler.GetCategories)
			protected.GET("/categories/:id", middleware.RequireAnyPermission("products.view", "pos.view"), productHandler.GetCategory)
			protected.POST("/categories", middleware.RequirePermission("products.create"), productHandler.CreateCategory)
			protected.PUT("/categories/:id", middleware.RequirePermission("products.update"), productHandler.UpdateCategory)
			protected.DELETE("/categories/:id", middleware.RequirePermission("products.delete"), productHandler.DeleteCategory)

			// Inventory routes
			// Note: pos.view allows POS/Kasir to read inventory for stock checking
			protected.GET("/inventory", middleware.RequireAnyPermission("inventory.view", "pos.view"), inventoryHandler.GetInventory)
			protected.GET("/inventory/:id", middleware.RequireAnyPermission("inventory.view", "pos.view"), inventoryHandler.GetInventoryByID)
			protected.PUT("/inventory/:id", middleware.RequirePermission("inventory.update"), inventoryHandler.UpdateInventory)
			protected.POST("/inventory/adjust", middleware.RequirePermission("inventory.update"), inventoryHandler.AdjustInventory)
			protected.GET("/inventory/transactions", middleware.RequirePermission("inventory.view"), inventoryHandler.GetInventoryTransactions)

			// Store Inventory routes
			// Note: pos.view allows POS/Kasir to read store inventory for stock checking
			protected.GET("/store-inventory", middleware.RequireAnyPermission("inventory.view", "pos.view"), inventoryHandler.GetStoreInventory)
			protected.GET("/store-inventory/:id", middleware.RequireAnyPermission("inventory.view", "pos.view"), inventoryHandler.GetStoreInventoryByID)
			protected.PUT("/store-inventory/:id", middleware.RequirePermission("inventory.update"), inventoryHandler.UpdateStoreInventory)
			protected.POST("/store-inventory/adjust", middleware.RequirePermission("inventory.update"), inventoryHandler.AdjustStoreInventory)

			// Sales routes
			// Note: pos.view/pos.create allows POS/Kasir to manage sales transactions
			protected.GET("/sales", middleware.RequireAnyPermission("sales.view", "pos.view"), salesHandler.GetSales)
			protected.GET("/sales/:id", middleware.RequireAnyPermission("sales.view", "pos.view"), salesHandler.GetSale)
			protected.POST("/sales", middleware.RequireAnyPermission("sales.create", "pos.create"), salesHandler.CreateSale)
			protected.PUT("/sales/:id", middleware.RequirePermission("sales.update"), salesHandler.UpdateSale)
			protected.GET("/sales/stats", middleware.RequireAnyPermission("sales.view", "pos.view"), salesHandler.GetSalesStats)

			// Customer routes
			// Note: pos.view allows POS/Kasir to read customer list for transactions
			protected.GET("/customers", middleware.RequireAnyPermission("customers.view", "pos.view"), customerHandler.GetCustomers)
			protected.GET("/customers/:id", middleware.RequireAnyPermission("customers.view", "pos.view"), customerHandler.GetCustomer)
			protected.POST("/customers", middleware.RequireAnyPermission("customers.create", "pos.create"), customerHandler.CreateCustomer)
			protected.PUT("/customers/:id", middleware.RequirePermission("customers.update"), customerHandler.UpdateCustomer)
			protected.DELETE("/customers/:id", middleware.RequirePermission("customers.delete"), customerHandler.DeleteCustomer)
			protected.GET("/customers/:id/stats", middleware.RequireAnyPermission("customers.view", "pos.view"), customerHandler.GetCustomerStats)

			// Supplier routes
			protected.GET("/suppliers", middleware.RequirePermission("suppliers.view"), supplierHandler.GetSuppliers)
			protected.GET("/suppliers/:id", middleware.RequirePermission("suppliers.view"), supplierHandler.GetSupplier)
			protected.POST("/suppliers", middleware.RequirePermission("suppliers.create"), supplierHandler.CreateSupplier)
			protected.PUT("/suppliers/:id", middleware.RequirePermission("suppliers.update"), supplierHandler.UpdateSupplier)
			protected.DELETE("/suppliers/:id", middleware.RequirePermission("suppliers.delete"), supplierHandler.DeleteSupplier)

			// Purchase Order routes
			protected.GET("/purchase-orders", middleware.RequirePermission("inventory.view"), purchaseOrderHandler.GetPurchaseOrders)
			protected.GET("/purchase-orders/:id", middleware.RequirePermission("inventory.view"), purchaseOrderHandler.GetPurchaseOrder)
			protected.POST("/purchase-orders", middleware.RequirePermission("inventory.create"), purchaseOrderHandler.CreatePurchaseOrder)
			protected.POST("/purchase-orders/:id/receive", middleware.RequirePermission("inventory.update"), purchaseOrderHandler.ReceivePurchaseOrder)

			// Stock Transfer routes
			protected.GET("/stock-transfers", middleware.RequirePermission("inventory.view"), stockTransferHandler.GetStockTransfers)
			protected.GET("/stock-transfers/:id", middleware.RequirePermission("inventory.view"), stockTransferHandler.GetStockTransfer)
			protected.POST("/stock-transfers", middleware.RequirePermission("inventory.create"), stockTransferHandler.CreateStockTransfer)
			protected.POST("/stock-transfers/:id/execute", middleware.RequirePermission("inventory.update"), stockTransferHandler.ExecuteStockTransfer)

			// Storage Location routes
			protected.GET("/storage-locations", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetAll)
			protected.GET("/storage-locations/types", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetLocationTypes)
			protected.GET("/storage-locations/active", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetAllActive)
			protected.GET("/storage-locations/warehouse/:warehouseId", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetByWarehouse)
			protected.GET("/storage-locations/store/:storeId", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetByStore)
			protected.GET("/storage-locations/:id", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetByID)
			protected.GET("/storage-locations/:id/products", middleware.RequirePermission("inventory.view"), storageLocationHandler.GetProductsByLocation)
			protected.POST("/storage-locations", middleware.RequirePermission("inventory.create"), storageLocationHandler.Create)
			protected.PUT("/storage-locations/:id", middleware.RequirePermission("inventory.update"), storageLocationHandler.Update)
			protected.DELETE("/storage-locations/:id", middleware.RequirePermission("inventory.delete"), storageLocationHandler.Delete)

			// Discount routes
			// Note: pos.view allows POS/Kasir to read active discounts for transactions
			protected.GET("/discounts", middleware.RequireAnyPermission("sales.view", "discounts.view", "pos.view"), discountHandler.GetDiscounts)
			protected.GET("/discounts/active", middleware.RequireAnyPermission("sales.view", "discounts.view", "pos.view"), discountHandler.GetActiveDiscounts)
			protected.GET("/discounts/validate", middleware.RequireAnyPermission("sales.view", "discounts.view", "pos.view"), discountHandler.ValidateDiscount)
			protected.GET("/discounts/:id", middleware.RequireAnyPermission("sales.view", "discounts.view", "pos.view"), discountHandler.GetDiscount)
			protected.POST("/discounts", middleware.RequireAnyPermission("sales.create", "discounts.create"), discountHandler.CreateDiscount)
			protected.PUT("/discounts/:id", middleware.RequireAnyPermission("sales.update", "discounts.update"), discountHandler.UpdateDiscount)
			protected.DELETE("/discounts/:id", middleware.RequireAnyPermission("sales.delete", "discounts.delete"), discountHandler.DeleteDiscount)

			// AI Chat routes
			protected.POST("/ai/chat", handlers.AIChatHandler)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Server starting on port %s...", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
