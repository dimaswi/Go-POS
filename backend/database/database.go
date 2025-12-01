package database

import (
	"log"
	"starter/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect(dsn string) error {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	log.Println("Database connected successfully")
	return nil
}

func Migrate() error {
	// Step 1: Create base tables WITHOUT foreign key constraints first
	// Disable foreign key checks temporarily
	DB.Exec("SET session_replication_role = 'replica';")

	// Migrate in correct order - base tables first
	// 1. Tables with no dependencies
	err := DB.AutoMigrate(
		&models.Role{},
		&models.Permission{},
		&models.Setting{},
		&models.Category{},
		&models.Supplier{},
		&models.Customer{},
		&models.FinancialAccount{},
	)
	if err != nil {
		return err
	}

	// 2. Junction tables and tables depending on step 1
	err = DB.AutoMigrate(
		&models.RolePermission{},
		&models.User{}, // Depends on Role
	)
	if err != nil {
		return err
	}

	// 3. Tables depending on User
	err = DB.AutoMigrate(
		&models.Store{},     // Has ManagerID -> User
		&models.Warehouse{}, // Has ManagerID -> User, StoreID -> Store
	)
	if err != nil {
		return err
	}

	// 4. Tables depending on Store/Warehouse
	err = DB.AutoMigrate(
		&models.StorageLocation{}, // Depends on Store, Warehouse
		&models.Product{},         // Depends on Category
		&models.Discount{},        // Depends on Store (optional)
	)
	if err != nil {
		return err
	}

	// 5. Tables depending on Product
	err = DB.AutoMigrate(
		&models.ProductVariant{},
		&models.Inventory{},            // Depends on Product, Warehouse
		&models.StoreInventory{},       // Depends on Product, Store
		&models.InventoryTransaction{}, // Depends on Product, Warehouse
	)
	if err != nil {
		return err
	}

	// 6. Order/Transaction tables
	err = DB.AutoMigrate(
		&models.PurchaseOrder{},     // Depends on Warehouse, Supplier, User
		&models.PurchaseOrderItem{}, // Depends on PurchaseOrder, Product
		&models.StockTransfer{},     // Depends on Warehouse
		&models.StockTransferItem{}, // Depends on StockTransfer, Product
		&models.Sale{},              // Depends on Store, Customer, User
		&models.SaleItem{},          // Depends on Sale, Product
		&models.SalePayment{},       // Depends on Sale
		&models.JournalEntry{},      // Depends on User
		&models.JournalEntryLine{},  // Depends on JournalEntry, FinancialAccount
		&models.DiscountUsage{},     // Depends on Discount, Sale, Customer
	)
	if err != nil {
		return err
	}

	// Re-enable foreign key checks
	DB.Exec("SET session_replication_role = 'origin';")

	log.Println("Database migrated successfully")
	return nil
}

// CleanMigrate drops all tables and recreates them for fresh database structure
func CleanMigrate() error {
	// Drop tables in reverse order to handle foreign key constraints
	DB.Exec("DROP TABLE IF EXISTS role_permissions CASCADE")
	DB.Exec("DROP TABLE IF EXISTS users CASCADE")
	DB.Exec("DROP TABLE IF EXISTS permissions CASCADE")
	DB.Exec("DROP TABLE IF EXISTS roles CASCADE")
	DB.Exec("DROP TABLE IF EXISTS settings CASCADE")

	log.Println("Dropped existing tables for clean migration")

	// Now run normal migration
	return Migrate()
}

func SeedData() error {
	// Clear existing permissions first to start fresh
	DB.Exec("DELETE FROM role_permissions")
	DB.Exec("DELETE FROM permissions")
	log.Println("Cleared existing permissions")

	// Seed permissions that match actual frontend features
	permissions := []models.Permission{
		// Dashboard
		{Name: "dashboard.view", Module: "Dashboard", Category: "view", Description: "Akses halaman dashboard", Actions: `["view"]`},

		// POS (Point of Sale / Kasir)
		{Name: "pos.view", Module: "POS", Category: "view", Description: "Akses halaman kasir", Actions: `["view"]`},
		{Name: "pos.create", Module: "POS", Category: "create", Description: "Buat transaksi di kasir", Actions: `["create"]`},

		// Sales (Penjualan)
		{Name: "sales.view", Module: "Penjualan", Category: "view", Description: "Lihat daftar penjualan", Actions: `["view"]`},
		{Name: "sales.create", Module: "Penjualan", Category: "create", Description: "Buat transaksi penjualan", Actions: `["create"]`},
		{Name: "sales.update", Module: "Penjualan", Category: "edit", Description: "Edit transaksi penjualan", Actions: `["update"]`},
		{Name: "sales.delete", Module: "Penjualan", Category: "delete", Description: "Hapus transaksi penjualan", Actions: `["delete"]`},

		// Discounts
		{Name: "discounts.view", Module: "Diskon", Category: "view", Description: "Lihat daftar diskon", Actions: `["view"]`},
		{Name: "discounts.create", Module: "Diskon", Category: "create", Description: "Buat diskon baru", Actions: `["create"]`},
		{Name: "discounts.update", Module: "Diskon", Category: "edit", Description: "Edit diskon", Actions: `["update"]`},
		{Name: "discounts.delete", Module: "Diskon", Category: "delete", Description: "Hapus diskon", Actions: `["delete"]`},

		// Products
		{Name: "products.view", Module: "Produk", Category: "view", Description: "Lihat daftar produk", Actions: `["view"]`},
		{Name: "products.create", Module: "Produk", Category: "create", Description: "Tambah produk baru", Actions: `["create"]`},
		{Name: "products.update", Module: "Produk", Category: "edit", Description: "Edit produk", Actions: `["update"]`},
		{Name: "products.delete", Module: "Produk", Category: "delete", Description: "Hapus produk", Actions: `["delete"]`},

		// Categories
		{Name: "categories.view", Module: "Kategori", Category: "view", Description: "Lihat daftar kategori", Actions: `["view"]`},
		{Name: "categories.create", Module: "Kategori", Category: "create", Description: "Tambah kategori baru", Actions: `["create"]`},
		{Name: "categories.update", Module: "Kategori", Category: "edit", Description: "Edit kategori", Actions: `["update"]`},
		{Name: "categories.delete", Module: "Kategori", Category: "delete", Description: "Hapus kategori", Actions: `["delete"]`},

		// Suppliers
		{Name: "suppliers.view", Module: "Pemasok", Category: "view", Description: "Lihat daftar pemasok", Actions: `["view"]`},
		{Name: "suppliers.create", Module: "Pemasok", Category: "create", Description: "Tambah pemasok baru", Actions: `["create"]`},
		{Name: "suppliers.update", Module: "Pemasok", Category: "edit", Description: "Edit pemasok", Actions: `["update"]`},
		{Name: "suppliers.delete", Module: "Pemasok", Category: "delete", Description: "Hapus pemasok", Actions: `["delete"]`},

		// Customers
		{Name: "customers.view", Module: "Pelanggan", Category: "view", Description: "Lihat daftar pelanggan", Actions: `["view"]`},
		{Name: "customers.create", Module: "Pelanggan", Category: "create", Description: "Tambah pelanggan baru", Actions: `["create"]`},
		{Name: "customers.update", Module: "Pelanggan", Category: "edit", Description: "Edit pelanggan", Actions: `["update"]`},
		{Name: "customers.delete", Module: "Pelanggan", Category: "delete", Description: "Hapus pelanggan", Actions: `["delete"]`},

		// Inventory
		{Name: "inventory.view", Module: "Inventori", Category: "view", Description: "Lihat ringkasan stok", Actions: `["view"]`},
		{Name: "inventory.update", Module: "Inventori", Category: "edit", Description: "Update stok / adjustment", Actions: `["update"]`},

		// Storage Locations
		{Name: "storage_locations.view", Module: "Lokasi Penyimpanan", Category: "view", Description: "Lihat lokasi penyimpanan", Actions: `["view"]`},
		{Name: "storage_locations.create", Module: "Lokasi Penyimpanan", Category: "create", Description: "Tambah lokasi penyimpanan", Actions: `["create"]`},
		{Name: "storage_locations.update", Module: "Lokasi Penyimpanan", Category: "edit", Description: "Edit lokasi penyimpanan", Actions: `["update"]`},
		{Name: "storage_locations.delete", Module: "Lokasi Penyimpanan", Category: "delete", Description: "Hapus lokasi penyimpanan", Actions: `["delete"]`},

		// Purchase Orders
		{Name: "purchase_orders.view", Module: "Pesanan Pembelian", Category: "view", Description: "Lihat pesanan pembelian", Actions: `["view"]`},
		{Name: "purchase_orders.create", Module: "Pesanan Pembelian", Category: "create", Description: "Buat pesanan pembelian", Actions: `["create"]`},
		{Name: "purchase_orders.update", Module: "Pesanan Pembelian", Category: "edit", Description: "Edit pesanan pembelian", Actions: `["update"]`},
		{Name: "purchase_orders.delete", Module: "Pesanan Pembelian", Category: "delete", Description: "Hapus pesanan pembelian", Actions: `["delete"]`},

		// Stock Transfers
		{Name: "stock_transfers.view", Module: "Transfer Stok", Category: "view", Description: "Lihat transfer stok", Actions: `["view"]`},
		{Name: "stock_transfers.create", Module: "Transfer Stok", Category: "create", Description: "Buat transfer stok", Actions: `["create"]`},
		{Name: "stock_transfers.update", Module: "Transfer Stok", Category: "edit", Description: "Edit transfer stok", Actions: `["update"]`},
		{Name: "stock_transfers.delete", Module: "Transfer Stok", Category: "delete", Description: "Hapus transfer stok", Actions: `["delete"]`},

		// Stores
		{Name: "stores.view", Module: "Toko", Category: "view", Description: "Lihat daftar toko", Actions: `["view"]`},
		{Name: "stores.create", Module: "Toko", Category: "create", Description: "Tambah toko baru", Actions: `["create"]`},
		{Name: "stores.update", Module: "Toko", Category: "edit", Description: "Edit toko", Actions: `["update"]`},
		{Name: "stores.delete", Module: "Toko", Category: "delete", Description: "Hapus toko", Actions: `["delete"]`},

		// Warehouses
		{Name: "warehouses.view", Module: "Gudang", Category: "view", Description: "Lihat daftar gudang", Actions: `["view"]`},
		{Name: "warehouses.create", Module: "Gudang", Category: "create", Description: "Tambah gudang baru", Actions: `["create"]`},
		{Name: "warehouses.update", Module: "Gudang", Category: "edit", Description: "Edit gudang", Actions: `["update"]`},
		{Name: "warehouses.delete", Module: "Gudang", Category: "delete", Description: "Hapus gudang", Actions: `["delete"]`},

		// Users
		{Name: "users.view", Module: "Pengguna", Category: "view", Description: "Lihat daftar pengguna", Actions: `["view"]`},
		{Name: "users.create", Module: "Pengguna", Category: "create", Description: "Tambah pengguna baru", Actions: `["create"]`},
		{Name: "users.update", Module: "Pengguna", Category: "edit", Description: "Edit pengguna", Actions: `["update"]`},
		{Name: "users.delete", Module: "Pengguna", Category: "delete", Description: "Hapus pengguna", Actions: `["delete"]`},

		// Roles
		{Name: "roles.view", Module: "Peran", Category: "view", Description: "Lihat daftar peran", Actions: `["view"]`},
		{Name: "roles.create", Module: "Peran", Category: "create", Description: "Tambah peran baru", Actions: `["create"]`},
		{Name: "roles.update", Module: "Peran", Category: "edit", Description: "Edit peran", Actions: `["update"]`},
		{Name: "roles.delete", Module: "Peran", Category: "delete", Description: "Hapus peran", Actions: `["delete"]`},

		// Permissions
		{Name: "permissions.view", Module: "Hak Akses", Category: "view", Description: "Lihat daftar hak akses", Actions: `["view"]`},

		// Reports
		{Name: "reports.view", Module: "Laporan", Category: "view", Description: "Akses semua laporan", Actions: `["view"]`},
		{Name: "reports.sales", Module: "Laporan", Category: "view", Description: "Lihat laporan penjualan", Actions: `["view"]`},
		{Name: "reports.inventory", Module: "Laporan", Category: "view", Description: "Lihat laporan inventori", Actions: `["view"]`},
		{Name: "reports.users", Module: "Laporan", Category: "view", Description: "Lihat laporan per kasir", Actions: `["view"]`},

		// Settings
		{Name: "settings.view", Module: "Pengaturan", Category: "view", Description: "Lihat pengaturan sistem", Actions: `["view"]`},
		{Name: "settings.update", Module: "Pengaturan", Category: "edit", Description: "Ubah pengaturan sistem", Actions: `["update"]`},
	}

	for _, perm := range permissions {
		DB.Create(&perm)
	}
	log.Printf("Created %d permissions", len(permissions))

	// Create default roles with different access levels
	var adminRole models.Role
	result := DB.Where("name = ?", "admin").First(&adminRole)
	if result.Error != nil || adminRole.ID == 0 {
		adminRole = models.Role{Name: "admin", Description: "Administrator dengan akses penuh"}
		DB.Create(&adminRole)
		log.Printf("Created admin role with ID: %d", adminRole.ID)
	} else {
		log.Printf("Found existing admin role with ID: %d", adminRole.ID)
	}

	// LANGSUNG INSERT KE role_permissions PAKAI RAW SQL (tanpa updated_at)
	// Hapus permission lama untuk admin role dulu
	DB.Exec("DELETE FROM role_permissions WHERE role_id = ?", adminRole.ID)

	// Insert semua permission untuk admin role
	DB.Exec(`INSERT INTO role_permissions (role_id, permission_id, created_at) 
		SELECT ?, id, NOW() FROM permissions 
		ON CONFLICT DO NOTHING`, adminRole.ID)
	log.Printf("Assigned ALL permissions to admin role (ID: %d) via direct SQL", adminRole.ID)

	var managerRole models.Role
	DB.Where("name = ?", "manager").First(&managerRole)
	if managerRole.ID == 0 {
		managerRole = models.Role{Name: "manager", Description: "Manager toko dengan akses operasional"}
		DB.Create(&managerRole)
	}

	var cashierRole models.Role
	DB.Where("name = ?", "kasir").First(&cashierRole)
	if cashierRole.ID == 0 {
		cashierRole = models.Role{Name: "kasir", Description: "Kasir dengan akses penjualan"}
		DB.Create(&cashierRole)
	}

	var warehouseRole models.Role
	DB.Where("name = ?", "gudang").First(&warehouseRole)
	if warehouseRole.ID == 0 {
		warehouseRole = models.Role{Name: "gudang", Description: "Staff gudang dengan akses inventori"}
		DB.Create(&warehouseRole)
	}

	// Assign manager permissions via raw SQL (tanpa updated_at)
	DB.Exec(`INSERT INTO role_permissions (role_id, permission_id, created_at) 
		SELECT ?, id, NOW() FROM permissions WHERE name IN (
			'dashboard.view','sales.view','sales.create','sales.update',
			'discounts.view','discounts.create','discounts.update',
			'products.view','products.create','products.update',
			'categories.view','categories.create','categories.update',
			'suppliers.view','suppliers.create','suppliers.update',
			'customers.view','customers.create','customers.update',
			'inventory.view','inventory.update',
			'storage_locations.view','storage_locations.create','storage_locations.update',
			'purchase_orders.view','purchase_orders.create','purchase_orders.update',
			'stock_transfers.view','stock_transfers.create','stock_transfers.update',
			'stores.view','warehouses.view','users.view','reports.view'
		) ON CONFLICT DO NOTHING`, managerRole.ID)

	// Assign cashier permissions via raw SQL (tanpa updated_at)
	// Note: pos.view and pos.create give kasir access to read stores, products, customers, inventory, discounts
	// without exposing those menus in the sidebar (sidebar checks specific permissions like stores.view)
	DB.Exec(`INSERT INTO role_permissions (role_id, permission_id, created_at) 
		SELECT ?, id, NOW() FROM permissions WHERE name IN (
			'dashboard.view','pos.view','pos.create','reports.view'
		) ON CONFLICT DO NOTHING`, cashierRole.ID)

	// Assign warehouse permissions via raw SQL (tanpa updated_at)
	DB.Exec(`INSERT INTO role_permissions (role_id, permission_id, created_at) 
		SELECT ?, id, NOW() FROM permissions WHERE name IN (
			'dashboard.view','products.view','inventory.view','inventory.update',
			'storage_locations.view','storage_locations.create','storage_locations.update',
			'purchase_orders.view','purchase_orders.create','purchase_orders.update',
			'stock_transfers.view','stock_transfers.create','stock_transfers.update',
			'warehouses.view','suppliers.view','reports.view'
		) ON CONFLICT DO NOTHING`, warehouseRole.ID)

	// Create default admin user
	var adminUser models.User
	adminResult := DB.Where(models.User{Email: "admin@pos.com"}).FirstOrCreate(&adminUser, models.User{
		Email:    "admin@pos.com",
		Username: "admin",
		FullName: "Administrator",
		IsActive: true,
		RoleID:   adminRole.ID,
	})

	if adminResult.RowsAffected > 0 {
		adminUser.HashPassword("admin123")
		DB.Save(&adminUser)
		log.Println("Default admin user created: admin@pos.com / admin123")
	}

	// Create sample manager user
	var managerUser models.User
	managerResult := DB.Where(models.User{Email: "manager@pos.com"}).FirstOrCreate(&managerUser, models.User{
		Email:    "manager@pos.com",
		Username: "manager",
		FullName: "Manager Toko",
		IsActive: true,
		RoleID:   managerRole.ID,
	})

	if managerResult.RowsAffected > 0 {
		managerUser.HashPassword("manager123")
		DB.Save(&managerUser)
		log.Println("Sample manager user created: manager@pos.com / manager123")
	}

	// Create sample cashier user
	var cashierUser models.User
	cashierResult := DB.Where(models.User{Email: "kasir@pos.com"}).FirstOrCreate(&cashierUser, models.User{
		Email:    "kasir@pos.com",
		Username: "kasir",
		FullName: "Staff Kasir",
		IsActive: true,
		RoleID:   cashierRole.ID,
	})

	if cashierResult.RowsAffected > 0 {
		cashierUser.HashPassword("kasir123")
		DB.Save(&cashierUser)
		log.Println("Sample cashier user created: kasir@pos.com / kasir123")
	}

	// Create sample warehouse staff user
	var warehouseUser models.User
	warehouseResult := DB.Where(models.User{Email: "gudang@pos.com"}).FirstOrCreate(&warehouseUser, models.User{
		Email:    "gudang@pos.com",
		Username: "gudang",
		FullName: "Staff Gudang",
		IsActive: true,
		RoleID:   warehouseRole.ID,
	})

	if warehouseResult.RowsAffected > 0 {
		warehouseUser.HashPassword("gudang123")
		DB.Save(&warehouseUser)
		log.Println("Sample warehouse user created: gudang@pos.com / gudang123")
	}

	// Create default settings for POS system
	defaultSettings := []models.Setting{
		{Key: "app_name", Value: "Go POS System"},
		{Key: "app_subtitle", Value: "Point of Sale & Inventory Management"},
		{Key: "company_name", Value: "Your Company Name"},
		{Key: "company_address", Value: "Your Company Address"},
		{Key: "company_phone", Value: "+62 123 456 7890"},
		{Key: "company_email", Value: "info@yourcompany.com"},
		{Key: "currency_symbol", Value: "Rp"},
		{Key: "currency_code", Value: "IDR"},
		{Key: "tax_rate", Value: "10"},
		{Key: "receipt_header", Value: "Thank you for your purchase!"},
		{Key: "receipt_footer", Value: "Please come again"},
		{Key: "inventory_auto_adjustment", Value: "true"},
		{Key: "low_stock_threshold", Value: "10"},
		{Key: "enable_barcode_scanner", Value: "true"},
		{Key: "default_payment_method", Value: "cash"},
		{Key: "allow_negative_inventory", Value: "false"},
		{Key: "auto_generate_sku", Value: "true"},
	}

	for _, setting := range defaultSettings {
		DB.Where(models.Setting{Key: setting.Key}).FirstOrCreate(&setting)
	}

	log.Println("Seed data created successfully with comprehensive permissions and roles")

	// Seed demo data for POS system
	if err := SeedDemoData(); err != nil {
		log.Printf("Warning: Failed to seed demo data: %v", err)
	}

	return nil
}

// SeedDemoData creates demo data for Categories, Products, Stores, Warehouses, Suppliers, Customers, and Inventory
func SeedDemoData() error {
	log.Println("Seeding demo data...")

	// ============================================================
	// CLEANUP: Remove all existing demo data first
	// ============================================================
	log.Println("Cleaning up existing data...")
	DB.Exec("DELETE FROM store_inventories")
	DB.Exec("DELETE FROM inventories")
	DB.Exec("DELETE FROM products")
	DB.Exec("DELETE FROM categories")
	DB.Exec("DELETE FROM customers")
	DB.Exec("DELETE FROM suppliers")
	DB.Exec("DELETE FROM warehouses")
	DB.Exec("DELETE FROM stores WHERE code LIKE 'TKO-%'")
	log.Println("Cleanup completed")

	// ============================================================
	// SEED CATEGORIES (4 kategori utama)
	// ============================================================
	categories := []models.Category{
		{Name: "Makanan & Snack", Code: "MKN", Description: "Produk makanan dan snack", Status: "active"},
		{Name: "Minuman", Code: "MNM", Description: "Produk minuman", Status: "active"},
		{Name: "Sembako", Code: "SMB", Description: "Kebutuhan pokok sehari-hari", Status: "active"},
		{Name: "Peralatan Rumah Tangga", Code: "PRT", Description: "Peralatan dan perlengkapan rumah tangga", Status: "active"},
	}

	categoryMap := make(map[string]uint)
	for _, cat := range categories {
		if err := DB.Create(&cat).Error; err == nil {
			categoryMap[cat.Code] = cat.ID
		}
	}
	log.Println("Categories seeded: 4 categories")

	// ============================================================
	// SEED SUPPLIERS (3 supplier)
	// ============================================================
	suppliers := []models.Supplier{
		{
			Name:         "PT Indofood Sukses Makmur",
			Code:         "SUP-001",
			Contact:      "Budi Santoso",
			Phone:        "021-5795-8822",
			Email:        "order@indofood.com",
			Address:      "Jl. Jenderal Sudirman Kav. 76-78, Jakarta Selatan",
			TaxNumber:    "01.234.567.8-901.000",
			Status:       "active",
			PaymentTerms: "Net 30",
			CreditLimit:  50000000,
		},
		{
			Name:         "PT Mayora Indah Tbk",
			Code:         "SUP-002",
			Contact:      "Siti Rahayu",
			Phone:        "021-5200-888",
			Email:        "sales@mayora.com",
			Address:      "Gedung Mayora, Jl. Tomang Raya No. 21-23, Jakarta Barat",
			TaxNumber:    "02.345.678.9-012.000",
			Status:       "active",
			PaymentTerms: "Net 45",
			CreditLimit:  75000000,
		},
		{
			Name:         "PT Unilever Indonesia",
			Code:         "SUP-003",
			Contact:      "Ahmad Wijaya",
			Phone:        "021-526-2112",
			Email:        "order@unilever.com",
			Address:      "Jl. Jababeka Raya Blok O, Cikarang, Bekasi",
			TaxNumber:    "03.456.789.0-123.000",
			Status:       "active",
			PaymentTerms: "Net 30",
			CreditLimit:  60000000,
		},
	}

	for _, sup := range suppliers {
		DB.Create(&sup)
	}
	log.Println("Suppliers seeded: 3 suppliers")

	// ============================================================
	// SEED PRODUCTS (10 produk)
	// ============================================================
	uintPtr := func(v uint) *uint { return &v }

	products := []models.Product{
		// Makanan & Snack (3)
		{Name: "Indomie Goreng", SKU: "MKN-001", Barcode: "8992388001001", CategoryID: uintPtr(categoryMap["MKN"]), Unit: "pcs", CostPrice: 2500, SellingPrice: 3500, MinStock: 20, IsActive: true, IsTrackable: true},
		{Name: "Chitato Original 68g", SKU: "MKN-002", Barcode: "8992388001002", CategoryID: uintPtr(categoryMap["MKN"]), Unit: "pcs", CostPrice: 8000, SellingPrice: 10500, MinStock: 15, IsActive: true, IsTrackable: true},
		{Name: "Oreo Original 133g", SKU: "MKN-003", Barcode: "8992388001003", CategoryID: uintPtr(categoryMap["MKN"]), Unit: "pcs", CostPrice: 8500, SellingPrice: 11000, MinStock: 15, IsActive: true, IsTrackable: true},

		// Minuman (3)
		{Name: "Aqua Botol 600ml", SKU: "MNM-001", Barcode: "8992388002001", CategoryID: uintPtr(categoryMap["MNM"]), Unit: "botol", CostPrice: 2500, SellingPrice: 4000, MinStock: 30, IsActive: true, IsTrackable: true},
		{Name: "Coca-Cola 390ml", SKU: "MNM-002", Barcode: "8992388002002", CategoryID: uintPtr(categoryMap["MNM"]), Unit: "botol", CostPrice: 5000, SellingPrice: 7500, MinStock: 25, IsActive: true, IsTrackable: true},
		{Name: "Teh Botol Sosro 450ml", SKU: "MNM-003", Barcode: "8992388002003", CategoryID: uintPtr(categoryMap["MNM"]), Unit: "botol", CostPrice: 3500, SellingPrice: 5000, MinStock: 25, IsActive: true, IsTrackable: true},

		// Sembako (2)
		{Name: "Beras Premium 5kg", SKU: "SMB-001", Barcode: "8992388003001", CategoryID: uintPtr(categoryMap["SMB"]), Unit: "karung", CostPrice: 65000, SellingPrice: 75000, MinStock: 10, IsActive: true, IsTrackable: true},
		{Name: "Minyak Goreng Bimoli 2L", SKU: "SMB-002", Barcode: "8992388003002", CategoryID: uintPtr(categoryMap["SMB"]), Unit: "botol", CostPrice: 28000, SellingPrice: 34000, MinStock: 15, IsActive: true, IsTrackable: true},

		// Peralatan Rumah Tangga (2)
		{Name: "Sabun Cuci Rinso 800g", SKU: "PRT-001", Barcode: "8992388004001", CategoryID: uintPtr(categoryMap["PRT"]), Unit: "pcs", CostPrice: 18000, SellingPrice: 22000, MinStock: 10, IsActive: true, IsTrackable: true},
		{Name: "Sabun Mandi Lifebuoy 85g", SKU: "PRT-002", Barcode: "8992388004002", CategoryID: uintPtr(categoryMap["PRT"]), Unit: "pcs", CostPrice: 3000, SellingPrice: 4500, MinStock: 20, IsActive: true, IsTrackable: true},
	}

	productMap := make(map[string]uint)
	for _, prod := range products {
		if err := DB.Create(&prod).Error; err == nil {
			productMap[prod.SKU] = prod.ID
		}
	}
	log.Println("Products seeded: 10 products")

	// ============================================================
	// SEED STORES (2 toko)
	// ============================================================
	stores := []models.Store{
		{
			Name:    "Toko Pusat Jakarta",
			Code:    "TKO-JKT-01",
			Address: "Jl. Sudirman No. 123, Jakarta Pusat",
			Phone:   "021-5551234",
			Email:   "jakarta@gopos.com",
			Status:  "active",
		},
		{
			Name:    "Toko Cabang Bandung",
			Code:    "TKO-BDG-01",
			Address: "Jl. Braga No. 45, Bandung",
			Phone:   "022-4231234",
			Email:   "bandung@gopos.com",
			Status:  "active",
		},
	}

	storeMap := make(map[string]uint)
	for _, store := range stores {
		if err := DB.Create(&store).Error; err == nil {
			storeMap[store.Code] = store.ID
		}
	}
	log.Println("Stores seeded: 2 stores")

	// ============================================================
	// SEED WAREHOUSES (2 gudang, 1 per toko)
	// ============================================================
	warehouses := []models.Warehouse{
		{
			Name:    "Gudang Jakarta",
			Code:    "WH-JKT-01",
			Address: "Jl. Industri Raya No. 100, Cakung, Jakarta Timur",
			Phone:   "021-4601234",
			StoreID: &[]uint{storeMap["TKO-JKT-01"]}[0],
			Type:    "central",
			Status:  "active",
		},
		{
			Name:    "Gudang Bandung",
			Code:    "WH-BDG-01",
			Address: "Jl. Soekarno Hatta No. 50, Bandung",
			Phone:   "022-7301234",
			StoreID: &[]uint{storeMap["TKO-BDG-01"]}[0],
			Type:    "store",
			Status:  "active",
		},
	}

	warehouseMap := make(map[string]uint)
	for _, wh := range warehouses {
		if err := DB.Create(&wh).Error; err == nil {
			warehouseMap[wh.Code] = wh.ID
		}
	}
	log.Println("Warehouses seeded: 2 warehouses")

	// ============================================================
	// SEED CUSTOMERS (5 pelanggan)
	// ============================================================
	customers := []models.Customer{
		{Name: "Andi Pratama", Email: "andi@email.com", Phone: "081234567001", Address: "Jl. Merdeka No. 10, Jakarta", Gender: "male", LoyaltyPoints: 500, Status: "active"},
		{Name: "Siti Aminah", Email: "siti@email.com", Phone: "081234567002", Address: "Jl. Pahlawan No. 25, Bandung", Gender: "female", LoyaltyPoints: 750, Status: "active"},
		{Name: "Budi Setiawan", Email: "budi@email.com", Phone: "081234567003", Address: "Jl. Diponegoro No. 30, Surabaya", Gender: "male", LoyaltyPoints: 1200, Status: "active"},
		{Name: "Dewi Lestari", Email: "dewi@email.com", Phone: "081234567004", Address: "Jl. Gajah Mada No. 15, Yogyakarta", Gender: "female", LoyaltyPoints: 300, Status: "active"},
		{Name: "Rizki Ramadhan", Email: "rizki@email.com", Phone: "081234567005", Address: "Jl. Sudirman No. 50, Semarang", Gender: "male", LoyaltyPoints: 150, Status: "active"},
	}

	for _, cust := range customers {
		DB.Create(&cust)
	}
	log.Println("Customers seeded: 5 customers")

	// ============================================================
	// SEED STORE INVENTORY (10 produk x 2 toko = 20 records)
	// ============================================================
	storeIDs := []uint{storeMap["TKO-JKT-01"], storeMap["TKO-BDG-01"]}

	for sku, productID := range productMap {
		for i, storeID := range storeIDs {
			// Toko Jakarta stok lebih banyak
			var quantity, minStock, maxStock float64

			switch sku[:3] {
			case "MKN":
				quantity = float64(50 - i*10) // JKT: 50, BDG: 40
				minStock = 10
				maxStock = 100
			case "MNM":
				quantity = float64(80 - i*20) // JKT: 80, BDG: 60
				minStock = 20
				maxStock = 150
			case "SMB":
				quantity = float64(30 - i*5) // JKT: 30, BDG: 25
				minStock = 5
				maxStock = 50
			case "PRT":
				quantity = float64(40 - i*10) // JKT: 40, BDG: 30
				minStock = 10
				maxStock = 80
			default:
				quantity = float64(50 - i*10)
				minStock = 10
				maxStock = 100
			}

			storeInventory := models.StoreInventory{
				ProductID: productID,
				StoreID:   storeID,
				Quantity:  quantity,
				MinStock:  minStock,
				MaxStock:  maxStock,
			}
			DB.Create(&storeInventory)
		}
	}
	log.Println("Store inventory seeded: 20 records (10 products x 2 stores)")

	// ============================================================
	// SEED WAREHOUSE INVENTORY (10 produk x 2 gudang = 20 records)
	// ============================================================
	warehouseIDs := []uint{warehouseMap["WH-JKT-01"], warehouseMap["WH-BDG-01"]}

	for _, productID := range productMap {
		for i, warehouseID := range warehouseIDs {
			// Gudang Jakarta stok lebih banyak
			quantity := float64(100 - i*30) // JKT: 100, BDG: 70

			inventory := models.Inventory{
				ProductID:        productID,
				WarehouseID:      warehouseID,
				Quantity:         quantity,
				ReservedQuantity: 0,
			}
			DB.Create(&inventory)
		}
	}
	log.Println("Warehouse inventory seeded: 20 records (10 products x 2 warehouses)")

	log.Println("============================================================")
	log.Println("DEMO DATA SEEDED SUCCESSFULLY!")
	log.Println("- 4 Categories")
	log.Println("- 3 Suppliers")
	log.Println("- 10 Products")
	log.Println("- 2 Stores")
	log.Println("- 2 Warehouses")
	log.Println("- 5 Customers")
	log.Println("- 20 Store Inventory Records")
	log.Println("- 20 Warehouse Inventory Records")
	log.Println("============================================================")

	return nil
}
