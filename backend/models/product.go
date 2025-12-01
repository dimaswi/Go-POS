package models

import (
	"encoding/json"
	"time"
)

type Category struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	Name        string     `json:"name" gorm:"not null"`
	Code        string     `json:"code" gorm:"uniqueIndex;not null"`
	Description string     `json:"description"`
	ParentID    *uint      `json:"parent_id"`
	Parent      *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	ImageURL    string     `json:"image_url"`
	Status      string     `json:"status" gorm:"default:active"` // active, inactive
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Product struct {
	ID           uint             `json:"id" gorm:"primaryKey"`
	Name         string           `json:"name" gorm:"not null"`
	SKU          string           `json:"sku" gorm:"uniqueIndex;not null"`
	Barcode      string           `json:"barcode" gorm:"uniqueIndex"`
	CategoryID   *uint            `json:"category_id"`
	Category     *Category        `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Description  string           `json:"description"`
	Unit         string           `json:"unit" gorm:"default:pcs"`
	CostPrice    float64          `json:"cost_price" gorm:"default:0"`
	SellingPrice float64          `json:"selling_price" gorm:"default:0"`
	MinStock     int              `json:"min_stock" gorm:"default:0"`
	MaxStock     *int             `json:"max_stock"`
	IsTrackable  bool             `json:"is_trackable" gorm:"default:true"`
	IsActive     bool             `json:"is_active" gorm:"default:true"`
	Images       json.RawMessage  `json:"images,omitempty"`
	Attributes   json.RawMessage  `json:"attributes,omitempty"`
	Variants     []ProductVariant `json:"variants,omitempty" gorm:"foreignKey:ProductID"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

type ProductVariant struct {
	ID           uint            `json:"id" gorm:"primaryKey"`
	ProductID    uint            `json:"product_id" gorm:"not null"`
	Product      *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Name         string          `json:"name" gorm:"not null"`
	SKU          string          `json:"sku" gorm:"uniqueIndex;not null"`
	Barcode      string          `json:"barcode" gorm:"uniqueIndex"`
	CostPrice    float64         `json:"cost_price" gorm:"default:0"`
	SellingPrice float64         `json:"selling_price" gorm:"default:0"`
	Attributes   json.RawMessage `json:"attributes,omitempty"`
	IsActive     bool            `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}
