package order

import "time"

// Address represents the recipient address information
type Address struct {
	ID                 uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	RecipientForeName  string `gorm:"type:varchar(255)" json:"recipient_fore_name"`
	RecipientOtherName string `gorm:"type:varchar(255)" json:"recipient_other_name"`
	PostalAddress      string `gorm:"type:text" json:"postal_address"`
	ZipCode            string `gorm:"type:varchar(20)" json:"zip_code"`
	City               string `gorm:"type:varchar(255)" json:"city"`
	PhoneNo            string `gorm:"type:varchar(20)" json:"phone_no"`
	QrID               string `gorm:"type:varchar(255)" json:"qr_id"`
	CountryCode        string `gorm:"type:varchar(10)" json:"country_code"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// ReturningAddress represents the return address information
type ReturningAddress struct {
	ID                     uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	DistrictHeadPostOffice string `gorm:"type:varchar(255)" json:"district_head_post_office"`
	ZipCode                string `gorm:"type:varchar(20)" json:"zip_code"`
	District               string `gorm:"type:varchar(255)" json:"district"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"default:false" json:"is_deleted"`
}

// Order represents the main order structure
type Order struct {
	ID                 uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	Sequence           int              `gorm:"unique;not null;index" json:"sequence"`
	AddressID          uint             `gorm:"index;not null" json:"address_id"`
	ReturningAddressID uint             `gorm:"index;not null" json:"returning_address_id"`
	Address            Address          `gorm:"foreignKey:AddressID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"address"`
	ReturningAddress   ReturningAddress `gorm:"foreignKey:ReturningAddressID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"returning_address"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// OrderEventStatus enum for tracking order lifecycle events
type OrderEventStatus string

const (
	// Success statuses
	OrderReceived     OrderEventStatus = "ORDER_RECEIVED"
	OrderSaved        OrderEventStatus = "ORDER_SAVED"
	OrderBatched      OrderEventStatus = "ORDER_BATCHED"
	OrderPrintStarted OrderEventStatus = "ORDER_PRINT_STARTED"
	OrderPrinted      OrderEventStatus = "ORDER_PRINTED"
	OrderBooked       OrderEventStatus = "ORDER_BOOKED"
	OrderDelivered    OrderEventStatus = "ORDER_DELIVERED"
	OrderReturnBooked OrderEventStatus = "ORDER_RETURN_BOOKED"
	OrderReturned     OrderEventStatus = "ORDER_RETURNED"
	OrderReprinted    OrderEventStatus = "ORDER_REPRINTED"

	// Failure statuses
	OrderReceiveFailed  OrderEventStatus = "ORDER_RECEIVE_FAILED"
	OrderSaveFailed     OrderEventStatus = "ORDER_SAVE_FAILED"
	OrderBatchFailed    OrderEventStatus = "ORDER_BATCH_FAILED"
	OrderPrintFailed    OrderEventStatus = "ORDER_PRINT_FAILED"
	OrderBookingFailed  OrderEventStatus = "ORDER_BOOKING_FAILED"
	OrderDeliveryFailed OrderEventStatus = "ORDER_DELIVERY_FAILED"
	OrderReturnFailed   OrderEventStatus = "ORDER_RETURN_FAILED"
	OrderReprintFailed  OrderEventStatus = "ORDER_REPRINT_FAILED"
)

// OrderEvent represents an event in the order lifecycle
type OrderEvent struct {
	ID       uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID  uint             `gorm:"index;not null" json:"order_id"`
	Order    Order            `gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"order"`
	Status   OrderEventStatus `gorm:"type:varchar(50);not null;index" json:"status"`
	Message  string           `gorm:"type:text" json:"message"`
	Metadata *string          `gorm:"type:jsonb" json:"metadata,omitempty"` // Store additional data as JSON

	CreatedAt time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// OrderBatch represents a batch of orders grouped together
type OrderBatch struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	BatchNumber   string `gorm:"type:varchar(50);unique;not null" json:"batch_number"`
	StartSequence int    `gorm:"not null;index" json:"start_sequence"`
	EndSequence   int    `gorm:"not null;index" json:"end_sequence"`
	TotalOrders   int    `gorm:"not null;default:0" json:"total_orders"`
	CreatedByID   uint   `gorm:"index" json:"created_by_id"`

	CreatedAt time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// TableName specifies the table name for OrderBatch
func (OrderBatch) TableName() string {
	return "order_batches"
}

// OrderBatchItem represents the many-to-many relationship between orders and batches
type OrderBatchItem struct {
	ID           uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID      uint       `gorm:"index;not null" json:"order_id"`
	OrderBatchID uint       `gorm:"index;not null" json:"order_batch_id"`
	Order        Order      `gorm:"foreignKey:OrderID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"order"`
	OrderBatch   OrderBatch `gorm:"foreignKey:OrderBatchID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;references:ID" json:"order_batch"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}
