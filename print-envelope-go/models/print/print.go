package print

import "time"

// PrintJobStatus enum for tracking print job lifecycle
type PrintJobStatus string

const (
	PrintJobPending    PrintJobStatus = "PENDING"
	PrintJobProcessing PrintJobStatus = "PROCESSING"
	PrintJobCompleted  PrintJobStatus = "COMPLETED"
	PrintJobFailed     PrintJobStatus = "FAILED"
	PrintJobCancelled  PrintJobStatus = "CANCELLED"
)

// PrintBatchJob represents a batch print job
type PrintBatchJob struct {
	ID            uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	BatchNumber   string         `gorm:"type:varchar(50);not null;index" json:"batch_number"`
	OrderBatchID  uint           `gorm:"index;not null" json:"order_batch_id"`
	Status        PrintJobStatus `gorm:"type:varchar(20);not null;default:'PENDING';index" json:"status"`
	TotalJobs     int            `gorm:"not null;default:0" json:"total_jobs"`
	CompletedJobs int            `gorm:"not null;default:0" json:"completed_jobs"`
	FailedJobs    int            `gorm:"not null;default:0" json:"failed_jobs"`
	CreatedByID   uint           `gorm:"index" json:"created_by_id"`

	ErrorMessage string `gorm:"type:text" json:"error_message,omitempty"`
	PrinterID    string `gorm:"type:varchar(255);index" json:"printer_id,omitempty"`
	Command      string `gorm:"type:varchar(255);index" json:"command,omitempty"`
	JobType      string `gorm:"type:varchar(255);index" json:"job_type,omitempty"`
	JobToken     string `gorm:"type:varchar(255);index" json:"job_token,omitempty"`
	JobUuid      string `gorm:"type:varchar(255);index" json:"job_uuid,omitempty"`

	CreatedAt   time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	StartedAt   *time.Time `gorm:"index" json:"started_at,omitempty"`
	CompletedAt *time.Time `gorm:"index" json:"completed_at,omitempty"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted   bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// PrintSingleJob represents a single order print job within a batch
type PrintSingleJob struct {
	ID              uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	PrintBatchJobID uint           `gorm:"index;not null" json:"print_batch_job_id"`
	OrderID         uint           `gorm:"index;not null" json:"order_id"`
	Sequence        int            `gorm:"index;not null" json:"sequence"`
	Status          PrintJobStatus `gorm:"type:varchar(20);not null;default:'PENDING';index" json:"status"`
	PrintedAt       *time.Time     `gorm:"index" json:"printed_at,omitempty"`
	ErrorMessage    string         `gorm:"type:text" json:"error_message,omitempty"`

	PrinterID string `gorm:"type:varchar(255);index" json:"printer_id,omitempty"`
	Command   string `gorm:"type:varchar(255);index" json:"command,omitempty"`
	JobType   string `gorm:"type:varchar(255);index" json:"job_type,omitempty"`
	JobToken  string `gorm:"type:varchar(255);index" json:"job_token,omitempty"`
	JobUuid   string `gorm:"type:varchar(255);index" json:"job_uuid,omitempty"`

	CreatedAt time.Time  `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}

// PrintJobData represents flattened order data for printing
type PrintJobData struct {
	ID               uint `gorm:"primaryKey;autoIncrement" json:"id"`
	PrintSingleJobID uint `gorm:"index;not null;unique" json:"print_single_job_id"`
	OrderID          uint `gorm:"index;not null" json:"order_id"`
	Sequence         int  `gorm:"index;not null" json:"sequence"`

	// Recipient Address Fields
	RecipientForeName  string `gorm:"type:varchar(255)" json:"recipient_fore_name"`
	RecipientOtherName string `gorm:"type:varchar(255)" json:"recipient_other_name"`
	PostalAddress      string `gorm:"type:text" json:"postal_address"`
	ZipCode            string `gorm:"type:varchar(20)" json:"zip_code"`
	City               string `gorm:"type:varchar(255)" json:"city"`
	PhoneNo            string `gorm:"type:varchar(20)" json:"phone_no"`
	QrID               string `gorm:"type:varchar(255)" json:"qr_id"`
	CountryCode        string `gorm:"type:varchar(10)" json:"country_code"`

	// Returning Address Fields
	DistrictHeadPostOffice string `gorm:"type:varchar(255)" json:"district_head_post_office"`
	ReturningZipCode       string `gorm:"type:varchar(20)" json:"returning_zip_code"`
	District               string `gorm:"type:varchar(255)" json:"district"`

	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	IsDeleted bool       `gorm:"not null;default:false" json:"is_deleted"`
}
