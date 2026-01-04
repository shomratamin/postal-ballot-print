package log

import (
	"time"
)

// Log represents an HTTP request/response log entry.
type Log struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Method          string    `gorm:"type:varchar(10);not null" json:"method"`
	URL             string    `gorm:"type:text;not null" json:"url"`
	RequestBody     string    `gorm:"type:text" json:"request_body"`
	RequestHeaders  string    `gorm:"type:text" json:"request_headers"`
	ResponseBody    string    `gorm:"type:text" json:"response_body"`
	ResponseHeaders string    `gorm:"type:text" json:"response_headers"`
	StatusCode      int       `gorm:"type:int" json:"status_code"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type ProcessingStatus string

const (
	ProcessingStatusPending   ProcessingStatus = "pending"
	ProcessingStatusRunning   ProcessingStatus = "running"
	ProcessingStatusCompleted ProcessingStatus = "completed"
	ProcessingStatusFailed    ProcessingStatus = "failed"
	ProcessingStatusCancelled ProcessingStatus = "cancelled"
)

// KafkaMessageLog represents a raw Kafka message log entry
type KafkaMessageLog struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Topic     string    `gorm:"type:varchar(255);not null;index" json:"topic"`
	Partition int32     `gorm:"type:int;not null;index" json:"partition"`
	Offset    int64     `gorm:"type:bigint;not null;index" json:"offset"`
	Key       string    `gorm:"type:text" json:"key"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	Timestamp time.Time `gorm:"type:timestamp;index" json:"timestamp"`
	OrderID   *uint     `gorm:"index" json:"order_id,omitempty"`      // Link to order if processed
	Status    string    `gorm:"type:varchar(50);index" json:"status"` // e.g., "received", "processed", "failed"
	Error     string    `gorm:"type:text" json:"error,omitempty"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}
