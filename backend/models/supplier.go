package models

import (
	"time"
)

type Supplier struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Code         string    `json:"code" gorm:"uniqueIndex;not null"`
	Contact      string    `json:"contact"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	Address      string    `json:"address"`
	TaxNumber    string    `json:"tax_number"`
	Status       string    `json:"status" gorm:"default:active"` // active, inactive
	PaymentTerms string    `json:"payment_terms"`                // COD, Net 30, etc.
	CreditLimit  float64   `json:"credit_limit" gorm:"default:0"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
