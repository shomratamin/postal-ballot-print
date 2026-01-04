package database

import (
	"fmt"
	"os"

	"printenvelope/models/log"
	"printenvelope/models/order"
	"printenvelope/models/print"
	"printenvelope/models/user"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	logger "printenvelope/logger"
)

var DB *gorm.DB

// InitDB initializes the database connection with auto migration and indexing
func InitDB() (*gorm.DB, error) {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		logger.Error("Error loading .env file", err)
	}

	// Live
	// host := os.Getenv("POSTGRES_HOST")
	// port := os.Getenv("POSTGRES_PORT")
	// database := os.Getenv("POSTGRES_DB")
	// user := os.Getenv("POSTGRES_USER")
	// password := os.Getenv("POSTGRES_PASSWORD")
	// sslmode := os.Getenv("DB_SSLMODE") // Optional: "disable", "require", etc.

	// Local
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	database := os.Getenv("DB_DATABASE")
	user := os.Getenv("DB_USERNAME")
	password := os.Getenv("DB_PASSWORD")
	sslmode := os.Getenv("DB_SSLMODE") // Optional: "disable", "require", etc.

	// Set default sslmode if not provided
	if sslmode == "" {
		sslmode = "disable"
	}

	// Build PostgreSQL DSN string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, database, sslmode)

	fmt.Println("DSN:", dsn)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		logger.Error("Failed to connect to the database", err)
		return nil, err
	}
	logger.Success("Successfully connected to the database")

	// Use dynamic migration system instead of simple AutoMigrate
	migrator := NewDynamicMigrator(DB)

	// Detect schema changes
	operations, err := migrator.DetectChanges()
	if err != nil {
		logger.Error("Failed to detect schema changes", err)
		return nil, err
	}

	// Save migration operations to file before executing
	if len(operations) > 0 {
		migrationFile, err := SaveMigrationToFile(operations)
		if err != nil {
			logger.Warning(fmt.Sprintf("Failed to save migration file: %v", err))
			// Continue with execution even if file save fails
		} else if migrationFile != "" {
			logger.Success(fmt.Sprintf("Migration saved to: %s", migrationFile))
		}
	}

	// Execute migrations
	if err := migrator.ExecuteMigrations(operations); err != nil {
		logger.Error("Failed to execute migrations", err)
		return nil, err
	}
	logger.Success("All dynamic migrations completed successfully")

	// Create indexes for better performance
	if err := createIndexes(); err != nil {
		logger.Error("Failed to create indexes", err)
		return nil, err
	}
	logger.Success("All indexes created successfully")

	// Seed initial data
	if err := SeedData(DB); err != nil {
		logger.Error("Failed to seed initial data", err)
		return nil, err
	}

	return DB, nil
}

// autoMigrate runs auto migration for all models
func autoMigrate() error {
	// First, migrate models without foreign key constraints in stages

	// Stage 1: Core foundation models
	stage1Models := []interface{}{
		&user.User{},
		&user.AdminUpdateLog{},

		&order.Order{},
		&order.OrderEvent{},
		&order.Address{},
		&order.ReturningAddress{},
		&order.OrderBatch{},
		&order.OrderBatchItem{},

		&print.PrintBatchJob{},
		&print.PrintSingleJob{},
		&print.PrintJobData{},

		&log.KafkaMessageLog{},
		&log.Log{},
	}

	for _, model := range stage1Models {
		if err := DB.AutoMigrate(model); err != nil {
			return fmt.Errorf("failed to migrate %T: %w", model, err)
		}
	}

	// Stage 2: Order table with FK constraints to Address and ReturningAddress
	if err := DB.AutoMigrate(&order.Order{}); err != nil {
		return fmt.Errorf("failed to migrate Order: %w", err)
	}

	// Stage 3: OrderEvent table with FK constraint to Order
	if err := DB.AutoMigrate(&order.OrderEvent{}); err != nil {
		return fmt.Errorf("failed to migrate OrderEvent: %w", err)
	}

	// // Stage 2: Account table without FK constraints to itself
	// if err := DB.AutoMigrate(&account.Account{}); err != nil {
	// 	return fmt.Errorf("failed to migrate Account: %w", err)
	// }
	// Stage 3: Models that depend on Account but don't have circular dependencies
	// stage3Models := []interface{}{
	// 	&account.LedgerUpdateDocument{},
	// 	&account.PostPaidBill{},
	// 	&account.PostPaidBillEvent{},
	// 	&account.AccountLedgerReport{},
	// 	&account.AccountLedgerReportItem{},
	// }

	// for _, model := range stage3Models {
	// 	if err := DB.AutoMigrate(model); err != nil {
	// 		return fmt.Errorf("failed to migrate %T: %w", model, err)
	// 	}
	// }

	// Stage 4: AccountLedger with its self-referencing FK constraints
	// if err := DB.AutoMigrate(&account.AccountLedger{}); err != nil {
	// 	return fmt.Errorf("failed to migrate AccountLedger: %w", err)
	// }

	// // Stage 5: Remaining models
	// remainingModels := []interface{}{

	// 	// Logging
	// 	&log.Log{},
	// 	&requisition.Requisition{},
	// 	&requisition.RequisitionEvent{},
	// }

	// for _, model := range remainingModels {
	// 	if err := DB.AutoMigrate(model); err != nil {
	// 		return fmt.Errorf("failed to migrate %T: %w", model, err)
	// 	}
	// }

	return nil
}

// createIndexes creates additional indexes for better performance
func createIndexes() error {
	// User indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)").Error; err != nil {
		return fmt.Errorf("failed to create user uuid index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)").Error; err != nil {
		return fmt.Errorf("failed to create user username index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").Error; err != nil {
		return fmt.Errorf("failed to create user email index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)").Error; err != nil {
		return fmt.Errorf("failed to create user phone index: %w", err)
	}
	// if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)").Error; err != nil {
	// 	return fmt.Errorf("failed to create user organization_id index: %w", err)
	// }

	// Log indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_logs_method ON logs(method)").Error; err != nil {
		return fmt.Errorf("failed to create log method index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_logs_status_code ON logs(status_code)").Error; err != nil {
		return fmt.Errorf("failed to create log status_code index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create log created_at index: %w", err)
	}

	// Address indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_recipient_fore_name ON addresses(recipient_fore_name)").Error; err != nil {
		return fmt.Errorf("failed to create address recipient_fore_name index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_zip_code ON addresses(zip_code)").Error; err != nil {
		return fmt.Errorf("failed to create address zip_code index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city)").Error; err != nil {
		return fmt.Errorf("failed to create address city index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_phone_no ON addresses(phone_no)").Error; err != nil {
		return fmt.Errorf("failed to create address phone_no index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_qr_id ON addresses(qr_id)").Error; err != nil {
		return fmt.Errorf("failed to create address qr_id index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_country_code ON addresses(country_code)").Error; err != nil {
		return fmt.Errorf("failed to create address country_code index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_created_at ON addresses(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create address created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_addresses_updated_at ON addresses(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create address updated_at index: %w", err)
	}

	// ReturningAddress indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_returning_addresses_district_head_post_office ON returning_addresses(district_head_post_office)").Error; err != nil {
		return fmt.Errorf("failed to create returning_address district_head_post_office index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_returning_addresses_zip_code ON returning_addresses(zip_code)").Error; err != nil {
		return fmt.Errorf("failed to create returning_address zip_code index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_returning_addresses_district ON returning_addresses(district)").Error; err != nil {
		return fmt.Errorf("failed to create returning_address district index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_returning_addresses_created_at ON returning_addresses(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create returning_address created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_returning_addresses_updated_at ON returning_addresses(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create returning_address updated_at index: %w", err)
	}

	// Order indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_orders_sequence ON orders(sequence)").Error; err != nil {
		return fmt.Errorf("failed to create order sequence index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create order created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create order updated_at index: %w", err)
	}

	// OrderEvent indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_events_status ON order_events(status)").Error; err != nil {
		return fmt.Errorf("failed to create order_event status index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_events_metadata ON order_events(metadata)").Error; err != nil {
		return fmt.Errorf("failed to create order_event metadata index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create order_event created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_events_updated_at ON order_events(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create order_event updated_at index: %w", err)
	}

	// OrderBatch indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batches_batch_number ON order_batches(batch_number)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch batch_number index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batches_start_sequence ON order_batches(start_sequence)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch start_sequence index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batches_end_sequence ON order_batches(end_sequence)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch end_sequence index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batches_updated_at ON order_batches(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch updated_at index: %w", err)
	}

	// OrderBatchItem indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batch_items_created_at ON order_batch_items(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch_item created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_order_batch_items_updated_at ON order_batch_items(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create order_batch_item updated_at index: %w", err)
	}

	// KafkaMessageLog indexes
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_kafka_message_logs_key ON kafka_message_logs(key)").Error; err != nil {
		return fmt.Errorf("failed to create kafka_message_log key index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_kafka_message_logs_created_at ON kafka_message_logs(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create kafka_message_log created_at index: %w", err)
	}
	if err := DB.Exec("CREATE INDEX IF NOT EXISTS idx_kafka_message_logs_updated_at ON kafka_message_logs(updated_at)").Error; err != nil {
		return fmt.Errorf("failed to create kafka_message_log updated_at index: %w", err)
	}

	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// Legacy function for backward compatibility
func ConnectDB() (*gorm.DB, error) {
	return InitDB()
}
