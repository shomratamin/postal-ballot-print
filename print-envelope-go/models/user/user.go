package user

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// RequisitionEventStatus enum
type UserRole string

const (
	SUPER_ADMIN UserRole = "SUPER_ADMIN"
	ADMIN       UserRole = "ADMIN"
	OPERATOR    UserRole = "OPERATOR"
)

// RequisitionEventStatus enum
type UserPermission string

const (
	FULL_PERMIT UserPermission = "FULL_PERMIT"
)

// User model with fields based on the JWT token structure
type User struct {
	ID            uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Uuid          string  `gorm:"type:varchar(255);not null;unique" json:"uuid"`
	Username      string  `gorm:"type:varchar(255);not null;unique" json:"username"`
	LegalName     string  `gorm:"type:varchar(255);not null" json:"legal_name"`
	Phone         *string `gorm:"type:varchar(20);unique" json:"phone"`
	PhoneVerified bool    `gorm:"type:bool;default:false" json:"phone_verified"`
	Email         *string `gorm:"type:varchar(255);unique" json:"email"`
	EmailVerified bool    `gorm:"type:bool;default:false" json:"email_verified"`
	Avatar        string  `gorm:"type:varchar(2048)" json:"avatar"`
	Nonce         int     `gorm:"type:int" json:"nonce"`
	Password      string  `gorm:"type:varchar(255);not null" json:"-"`

	JoinedAt           *time.Time  `json:"joined_at,omitempty"`
	CreatedByID        *uint       `gorm:"index" json:"created_by_id,omitempty"`
	ApprovedByID       *uint       `gorm:"index" json:"approved_by_id,omitempty"`
	CurrentRole        UserRole    `gorm:"size:100;index" json:"current_role,omitempty"`
	CurrentPermissions StringSlice `gorm:"type:json" json:"current_permissions"` // Use JSON column to store slice of strings

	// Self-referencing relationships
	CreatedByUser  *User `gorm:"foreignKey:CreatedByID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"created_by,omitempty"`
	ApprovedByUser *User `gorm:"foreignKey:ApprovedByID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"approved_by,omitempty"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// StringSlice is a custom type to handle JSON serialization for PostgreSQL
type StringSlice []UserPermission

// Scan implements the Scanner interface for database deserialization
func (ss *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*ss = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, ss)
}

// Value implements the driver Valuer interface for database serialization
func (ss StringSlice) Value() (driver.Value, error) {
	if ss == nil {
		return nil, nil
	}
	return json.Marshal(ss)
}
