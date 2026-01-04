package user

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// AdminUpdateLog stores audit trail for administrative actions
type AdminUpdateLog struct {
	ID uint `gorm:"primaryKey;autoIncrement" json:"id"`

	// Admin who performed the action
	AdminID   uint   `gorm:"not null;index" json:"admin_id"`
	AdminUser *User  `gorm:"foreignKey:AdminID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"admin_user,omitempty"`
	AdminUUID string `gorm:"type:varchar(255);not null;index" json:"admin_uuid"`

	// Action details
	Action      string `gorm:"type:varchar(100);not null;index" json:"action"`      // e.g., "FORCE_UPDATE_DPMG", "UPDATE_BRANCH", etc.
	EntityType  string `gorm:"type:varchar(100);not null;index" json:"entity_type"` // e.g., "POST_OFFICE_BRANCH", "USER", "ACCOUNT", etc.
	EntityID    uint   `gorm:"not null;index" json:"entity_id"`
	Description string `gorm:"type:text" json:"description"`

	// Previous and new values (stored as JSON for flexibility)
	OldValues JSONMap `gorm:"type:jsonb" json:"old_values"`
	NewValues JSONMap `gorm:"type:jsonb" json:"new_values"`

	// Metadata
	IPAddress string  `gorm:"type:varchar(45)" json:"ip_address"` // Supports IPv4 and IPv6
	UserAgent string  `gorm:"type:text" json:"user_agent"`
	RequestID *string `gorm:"type:varchar(255);index" json:"request_id,omitempty"`

	CreatedAt time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// JSONMap is a custom type to handle JSON serialization for PostgreSQL
type JSONMap map[string]interface{}

// Scan implements the Scanner interface for database deserialization
func (jm *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*jm = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, jm)
}

// Value implements the driver Valuer interface for database serialization
func (jm JSONMap) Value() (driver.Value, error) {
	if jm == nil {
		return nil, nil
	}
	return json.Marshal(jm)
}

// TableName specifies the table name for AdminUpdateLog
func (AdminUpdateLog) TableName() string {
	return "admin_update_logs"
}
