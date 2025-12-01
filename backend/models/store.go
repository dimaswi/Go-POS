package models

import (
	"encoding/json"
	"time"
)

type Store struct {
	ID           uint            `json:"id" gorm:"primaryKey"`
	Name         string          `json:"name" gorm:"not null"`
	Code         string          `json:"code" gorm:"uniqueIndex;not null"`
	Address      string          `json:"address"`
	Phone        string          `json:"phone"`
	Email        string          `json:"email"`
	ManagerID    *uint           `json:"manager_id"`
	Manager      *User           `json:"manager,omitempty" gorm:"foreignKey:ManagerID"`
	Status       string          `json:"status" gorm:"default:active"` // active, inactive
	OpeningHours json.RawMessage `json:"opening_hours,omitempty"`
	Settings     json.RawMessage `json:"settings,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type Warehouse struct {
	ID           uint            `json:"id" gorm:"primaryKey"`
	Name         string          `json:"name" gorm:"not null"`
	Code         string          `json:"code" gorm:"uniqueIndex;not null"`
	Address      string          `json:"address"`
	Phone        string          `json:"phone"`
	ManagerID    *uint           `json:"manager_id"`
	Manager      *User           `json:"manager,omitempty" gorm:"foreignKey:ManagerID"`
	StoreID      *uint           `json:"store_id"`
	Store        *Store          `json:"store,omitempty" gorm:"foreignKey:StoreID"`
	Type         string          `json:"type" gorm:"default:main"`     // main, branch, virtual
	Status       string          `json:"status" gorm:"default:active"` // active, inactive
	CapacityInfo json.RawMessage `json:"capacity_info,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}
