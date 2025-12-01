package models

import (
	"time"
)

type FinancialAccount struct {
	ID          uint               `json:"id" gorm:"primaryKey"`
	Name        string             `json:"name" gorm:"not null"`
	Code        string             `json:"code" gorm:"uniqueIndex;not null"`
	Type        string             `json:"type" gorm:"not null"` // asset, liability, equity, revenue, expense
	Subtype     string             `json:"subtype"`              // current_asset, fixed_asset, etc.
	ParentID    *uint              `json:"parent_id"`
	Parent      *FinancialAccount  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []FinancialAccount `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Balance     float64            `json:"balance" gorm:"default:0"`
	IsActive    bool               `json:"is_active" gorm:"default:true"`
	Description string             `json:"description"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

type JournalEntry struct {
	ID            uint               `json:"id" gorm:"primaryKey"`
	EntryNumber   string             `json:"entry_number" gorm:"uniqueIndex;not null"`
	Description   string             `json:"description" gorm:"not null"`
	TotalDebit    float64            `json:"total_debit" gorm:"default:0"`
	TotalCredit   float64            `json:"total_credit" gorm:"default:0"`
	EntryDate     time.Time          `json:"entry_date" gorm:"not null"`
	ReferenceType string             `json:"reference_type"` // sale, purchase, payment, adjustment, transfer
	ReferenceID   *uint              `json:"reference_id"`   // Related transaction ID
	CreatedBy     uint               `json:"created_by" gorm:"not null"`
	CreatedByUser *User              `json:"created_by_user,omitempty" gorm:"foreignKey:CreatedBy"`
	Status        string             `json:"status" gorm:"default:draft"` // draft, posted
	Lines         []JournalEntryLine `json:"lines,omitempty" gorm:"foreignKey:EntryID"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

type JournalEntryLine struct {
	ID           uint              `json:"id" gorm:"primaryKey"`
	EntryID      uint              `json:"entry_id" gorm:"not null"`
	AccountID    uint              `json:"account_id" gorm:"not null"`
	Account      *FinancialAccount `json:"account,omitempty" gorm:"foreignKey:AccountID"`
	DebitAmount  float64           `json:"debit_amount" gorm:"default:0"`
	CreditAmount float64           `json:"credit_amount" gorm:"default:0"`
	Description  string            `json:"description"`
	CreatedAt    time.Time         `json:"created_at"`
}
