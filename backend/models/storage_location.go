package models

import (
	"time"
)

// StorageLocation represents a master location for storing products
type StorageLocation struct {
	ID           uint             `json:"id" gorm:"primaryKey"`
	Code         string           `json:"code" gorm:"uniqueIndex;size:50;not null"` // e.g., "WH-A1-01", "ST-SEC-01"
	Name         string           `json:"name" gorm:"size:100;not null"`            // e.g., "Rak A Tingkat 1"
	Type         string           `json:"type" gorm:"size:20;not null"`             // warehouse, store
	LocationType string           `json:"location_type" gorm:"size:50;not null"`    // zone, aisle, shelf, bin, section, display_area
	WarehouseID  *uint            `json:"warehouse_id"`                             // For warehouse locations
	Warehouse    *Warehouse       `json:"warehouse,omitempty" gorm:"foreignKey:WarehouseID"`
	StoreID      *uint            `json:"store_id"` // For store locations
	Store        *Store           `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	ParentID     *uint            `json:"parent_id"` // For hierarchical locations (e.g., shelf under zone)
	Parent       *StorageLocation `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Description  string           `json:"description" gorm:"size:255"`
	Capacity     float64          `json:"capacity" gorm:"default:0"` // Maximum capacity (optional)
	IsActive     bool             `json:"is_active" gorm:"default:true"`
	SortOrder    int              `json:"sort_order" gorm:"default:0"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

// TableName specifies the table name
func (StorageLocation) TableName() string {
	return "storage_locations"
}
