package models

import (
	"time"
)

type Customer struct {
	ID            uint       `json:"id" gorm:"primaryKey"`
	Name          string     `json:"name" gorm:"not null"`
	Email         string     `json:"email" gorm:"uniqueIndex"`
	Phone         string     `json:"phone"`
	Address       string     `json:"address"`
	DateOfBirth   *time.Time `json:"date_of_birth"`
	Gender        string     `json:"gender"` // male, female, other
	IsMember      bool       `json:"is_member" gorm:"default:false"`
	LoyaltyPoints int        `json:"loyalty_points" gorm:"default:0"`
	TotalSpent    float64    `json:"total_spent" gorm:"default:0"`
	LastVisit     *time.Time `json:"last_visit"`
	Status        string     `json:"status" gorm:"default:active"` // active, inactive
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Sale struct {
	ID             uint          `json:"id" gorm:"primaryKey"`
	SaleNumber     string        `json:"sale_number" gorm:"uniqueIndex;not null"`
	StoreID        uint          `json:"store_id" gorm:"not null"`
	Store          *Store        `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	CustomerID     *uint         `json:"customer_id"`
	Customer       *Customer     `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	CashierID      uint          `json:"cashier_id" gorm:"not null"`
	Cashier        *User         `json:"cashier,omitempty" gorm:"foreignKey:CashierID"`
	DiscountID     *uint         `json:"discount_id"`
	Discount       *Discount     `json:"discount,omitempty" gorm:"foreignKey:DiscountID"`
	Subtotal       float64       `json:"subtotal" gorm:"default:0"`
	TaxAmount      float64       `json:"tax_amount" gorm:"default:0"`
	DiscountAmount float64       `json:"discount_amount" gorm:"default:0"`
	TotalAmount    float64       `json:"total_amount" gorm:"default:0"`
	PaidAmount     float64       `json:"paid_amount" gorm:"default:0"`
	ChangeAmount   float64       `json:"change_amount" gorm:"default:0"`
	PaymentStatus  string        `json:"payment_status" gorm:"default:pending"` // pending, paid, partial, refunded
	SaleStatus     string        `json:"sale_status" gorm:"default:draft"`      // draft, completed, cancelled, refunded
	PaymentMethod  string        `json:"payment_method" gorm:"default:cash"`    // cash, card, digital_wallet, credit, multiple
	Notes          string        `json:"notes"`
	Items          []SaleItem    `json:"items,omitempty" gorm:"foreignKey:SaleID"`
	Payments       []SalePayment `json:"payments,omitempty" gorm:"foreignKey:SaleID"`
	SaleDate       time.Time     `json:"sale_date" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

type SaleItem struct {
	ID               uint            `json:"id" gorm:"primaryKey"`
	SaleID           uint            `json:"sale_id" gorm:"not null"`
	ProductID        uint            `json:"product_id" gorm:"not null"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductVariantID *uint           `json:"product_variant_id"`
	ProductVariant   *ProductVariant `json:"product_variant,omitempty" gorm:"foreignKey:ProductVariantID"`
	Quantity         float64         `json:"quantity" gorm:"not null"`
	UnitPrice        float64         `json:"unit_price" gorm:"not null"`
	DiscountAmount   float64         `json:"discount_amount" gorm:"default:0"`
	TotalPrice       float64         `json:"total_price" gorm:"not null"` // (quantity * unit_price) - discount_amount
	CreatedAt        time.Time       `json:"created_at"`
}

type SalePayment struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	SaleID          uint      `json:"sale_id" gorm:"not null"`
	PaymentMethod   string    `json:"payment_method" gorm:"not null"` // cash, card, digital_wallet, credit
	Amount          float64   `json:"amount" gorm:"not null"`
	ReferenceNumber string    `json:"reference_number"`              // Card transaction ID, e-wallet ref, etc.
	Status          string    `json:"status" gorm:"default:pending"` // pending, completed, failed
	ProcessedAt     time.Time `json:"processed_at" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt       time.Time `json:"created_at"`
}
