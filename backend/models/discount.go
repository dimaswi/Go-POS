package models

import (
	"time"

	"gorm.io/gorm"
)

type Discount struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Name             string         `json:"name" gorm:"not null"`
	Code             string         `json:"code" gorm:"uniqueIndex"`
	Description      string         `json:"description"`
	DiscountType     string         `json:"discount_type" gorm:"not null"` // percentage, fixed
	DiscountValue    float64        `json:"discount_value" gorm:"not null"`
	MinPurchase      float64        `json:"min_purchase" gorm:"default:0"`    // Minimum purchase amount
	MaxDiscount      float64        `json:"max_discount" gorm:"default:0"`    // Maximum discount amount (0 = unlimited)
	ApplicableTo     string         `json:"applicable_to" gorm:"default:all"` // all, member, specific_customer
	CustomerID       *uint          `json:"customer_id"`                      // For specific customer
	Customer         *Customer      `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	ApplicableItems  string         `json:"applicable_items" gorm:"default:all"` // all, category, product
	CategoryID       *uint          `json:"category_id"`                         // For specific category
	ProductID        *uint          `json:"product_id"`                          // For specific product
	UsageLimit       int            `json:"usage_limit" gorm:"default:0"`        // 0 = unlimited
	UsageCount       int            `json:"usage_count" gorm:"default:0"`
	UsagePerCustomer int            `json:"usage_per_customer" gorm:"default:0"` // 0 = unlimited
	StartDate        *time.Time     `json:"start_date"`
	EndDate          *time.Time     `json:"end_date"`
	IsActive         bool           `json:"is_active" gorm:"default:true"`
	StoreID          *uint          `json:"store_id"` // null = all stores
	Store            *Store         `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	CreatedBy        uint           `json:"created_by"`
	CreatedByUser    *User          `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// DiscountUsage tracks discount usage per customer
type DiscountUsage struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	DiscountID uint      `json:"discount_id" gorm:"not null"`
	Discount   *Discount `json:"discount,omitempty" gorm:"foreignKey:DiscountID"`
	CustomerID *uint     `json:"customer_id"`
	Customer   *Customer `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	SaleID     uint      `json:"sale_id" gorm:"not null"`
	Sale       *Sale     `json:"sale,omitempty" gorm:"foreignKey:SaleID"`
	Amount     float64   `json:"amount" gorm:"not null"` // Actual discount amount applied
	CreatedAt  time.Time `json:"created_at"`
}
