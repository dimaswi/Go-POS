package models

import (
	"time"
)

type Inventory struct {
	ID               uint            `json:"id" gorm:"primaryKey"`
	ProductID        uint            `json:"product_id" gorm:"not null"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID *uint           `json:"product_variant_id"`
	ProductVariant   *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	WarehouseID      uint            `json:"warehouse_id" gorm:"not null"`
	Warehouse        *Warehouse      `json:"warehouse,omitempty" gorm:"foreignKey:WarehouseID"`
	Quantity         float64         `json:"quantity" gorm:"default:0"`
	ReservedQuantity float64         `json:"reserved_quantity" gorm:"default:0"`
	MinStock         float64         `json:"min_stock" gorm:"default:0"`
	MaxStock         float64         `json:"max_stock" gorm:"default:0"`
	// Location fields
	ShelfLocation string    `json:"shelf_location" gorm:"size:50"` // e.g., "A1", "B2"
	BinLocation   string    `json:"bin_location" gorm:"size:50"`   // e.g., "Bin-001"
	Zone          string    `json:"zone" gorm:"size:50"`           // e.g., "Zone A", "Cold Storage"
	Aisle         string    `json:"aisle" gorm:"size:50"`          // e.g., "Aisle 1"
	Level         string    `json:"level" gorm:"size:20"`          // e.g., "Level 1", "Ground"
	LastUpdated   time.Time `json:"last_updated" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt     time.Time `json:"created_at"`
}

type StoreInventory struct {
	ID               uint            `json:"id" gorm:"primaryKey"`
	ProductID        uint            `json:"product_id" gorm:"not null"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID *uint           `json:"product_variant_id"`
	ProductVariant   *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	StoreID          uint            `json:"store_id" gorm:"not null"`
	Store            *Store          `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	Quantity         float64         `json:"quantity" gorm:"default:0"`
	ReservedQuantity float64         `json:"reserved_quantity" gorm:"default:0"`
	MinStock         float64         `json:"min_stock" gorm:"default:0"`
	MaxStock         float64         `json:"max_stock" gorm:"default:0"`
	// Location fields
	ShelfLocation string    `json:"shelf_location" gorm:"size:50"` // e.g., "Rak A", "Display 1"
	Section       string    `json:"section" gorm:"size:50"`        // e.g., "Makanan", "Minuman"
	DisplayArea   string    `json:"display_area" gorm:"size:50"`   // e.g., "Depan Kasir", "Rak Utama"
	LastUpdated   time.Time `json:"last_updated" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt     time.Time `json:"created_at"`
}

type InventoryTransaction struct {
	ID               uint            `json:"id" gorm:"primaryKey"`
	ProductID        uint            `json:"product_id" gorm:"not null"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID *uint           `json:"product_variant_id"`
	ProductVariant   *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	LocationType     string          `json:"location_type" gorm:"not null"` // warehouse, store
	LocationID       uint            `json:"location_id" gorm:"not null"`   // warehouse_id or store_id
	WarehouseID      *uint           `json:"warehouse_id"`                  // For warehouse transactions
	Warehouse        *Warehouse      `json:"warehouse,omitempty" gorm:"foreignKey:WarehouseID"`
	StoreID          *uint           `json:"store_id"` // For store transactions
	Store            *Store          `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	TransactionType  string          `json:"transaction_type" gorm:"not null"` // in, out, transfer, adjustment
	Quantity         float64         `json:"quantity" gorm:"not null"`         // Positive for in, negative for out
	UnitCost         float64         `json:"unit_cost" gorm:"default:0"`
	ReferenceType    string          `json:"reference_type" gorm:"not null"` // purchase, sale, transfer, adjustment, return
	ReferenceID      *uint           `json:"reference_id"`
	Notes            string          `json:"notes"`
	CreatedBy        uint            `json:"created_by" gorm:"not null"`
	CreatedByUser    *User           `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
	CreatedAt        time.Time       `json:"created_at"`
}

type StockTransfer struct {
	ID              uint                `json:"id" gorm:"primaryKey"`
	TransferNumber  string              `json:"transfer_number" gorm:"uniqueIndex;not null"`
	FromWarehouseID *uint               `json:"from_warehouse_id"`
	FromWarehouse   *Warehouse          `json:"from_warehouse,omitempty" gorm:"foreignKey:FromWarehouseID"`
	ToWarehouseID   *uint               `json:"to_warehouse_id"`
	ToWarehouse     *Warehouse          `json:"to_warehouse,omitempty" gorm:"foreignKey:ToWarehouseID"`
	FromStoreID     *uint               `json:"from_store_id"`
	FromStore       *Store              `json:"from_store,omitempty" gorm:"foreignKey:FromStoreID"`
	ToStoreID       *uint               `json:"to_store_id"`
	ToStore         *Store              `json:"to_store,omitempty" gorm:"foreignKey:ToStoreID"`
	Status          string              `json:"status" gorm:"default:pending"` // pending, in_transit, completed, cancelled
	RequestedBy     uint                `json:"requested_by" gorm:"not null"`
	RequestedByUser *User               `json:"requested_by_user,omitempty" gorm:"foreignKey:RequestedBy"`
	ApprovedBy      *uint               `json:"approved_by"`
	ApprovedByUser  *User               `json:"approved_by_user,omitempty" gorm:"foreignKey:ApprovedBy"`
	ShippedAt       *time.Time          `json:"shipped_at"`
	ReceivedAt      *time.Time          `json:"received_at"`
	Notes           string              `json:"notes"`
	Items           []StockTransferItem `json:"items,omitempty" gorm:"foreignKey:TransferID"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

type StockTransferItem struct {
	ID                uint            `json:"id" gorm:"primaryKey"`
	TransferID        uint            `json:"transfer_id" gorm:"not null"`
	ProductID         uint            `json:"product_id" gorm:"not null"`
	Product           *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID  *uint           `json:"product_variant_id"`
	ProductVariant    *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	QuantityRequested float64         `json:"quantity_requested" gorm:"not null"`
	QuantityShipped   float64         `json:"quantity_shipped" gorm:"default:0"`
	QuantityReceived  float64         `json:"quantity_received" gorm:"default:0"`
	CreatedAt         time.Time       `json:"created_at"`
}

type PurchaseOrder struct {
	ID              uint                `json:"id" gorm:"primaryKey"`
	PurchaseNumber  string              `json:"purchase_number" gorm:"uniqueIndex;not null"`
	SupplierID      *uint               `json:"supplier_id"`
	Supplier        *Supplier           `json:"supplier,omitempty" gorm:"foreignKey:SupplierID"`
	SupplierName    string              `json:"supplier_name"`
	SupplierContact string              `json:"supplier_contact"`
	WarehouseID     uint                `json:"warehouse_id" gorm:"not null"`
	Warehouse       *Warehouse          `json:"warehouse,omitempty" gorm:"foreignKey:WarehouseID"`
	Status          string              `json:"status" gorm:"default:draft"` // draft, pending, approved, received, cancelled
	OrderDate       time.Time           `json:"order_date"`
	ExpectedDate    *time.Time          `json:"expected_date"`
	ReceivedDate    *time.Time          `json:"received_date"`
	TotalAmount     float64             `json:"total_amount" gorm:"default:0"`
	Notes           string              `json:"notes"`
	CreatedBy       uint                `json:"created_by" gorm:"not null"`
	CreatedByUser   *User               `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
	Items           []PurchaseOrderItem `json:"items,omitempty" gorm:"foreignKey:PurchaseOrderID"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

type PurchaseOrderItem struct {
	ID               uint            `json:"id" gorm:"primaryKey"`
	PurchaseOrderID  uint            `json:"purchase_order_id" gorm:"not null"`
	ProductID        uint            `json:"product_id" gorm:"not null"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID *uint           `json:"product_variant_id"`
	ProductVariant   *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	QuantityOrdered  float64         `json:"quantity_ordered" gorm:"not null"`
	QuantityReceived float64         `json:"quantity_received" gorm:"default:0"`
	UnitCost         float64         `json:"unit_cost" gorm:"default:0"`
	TotalCost        float64         `json:"total_cost" gorm:"default:0"`
	CreatedAt        time.Time       `json:"created_at"`
}
