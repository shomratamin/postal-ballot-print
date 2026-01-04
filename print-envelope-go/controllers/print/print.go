package print

import (
	"fmt"
	"printenvelope/logger"
	"printenvelope/models/order"
	"printenvelope/models/print"
	"printenvelope/types"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PrintController struct {
	db             *gorm.DB
	loggerInstance *logger.AsyncLogger
}

func NewPrintController(db *gorm.DB, async_logger *logger.AsyncLogger) *PrintController {
	return &PrintController{db: db, loggerInstance: async_logger}
}

// PrintBatch creates a print batch job from a batch number
func (pc *PrintController) PrintBatch(c *fiber.Ctx) error {
	// Parse request body
	var req struct {
		BatchNumber string `json:"batch_number" validate:"required"`
		PrinterID   string `json:"printer_id" validate:"required"`
		Command     string `json:"command" validate:"required"`
		JobType     string `json:"job_type" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse print batch request", err)
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Invalid request payload",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Validate input
	if req.BatchNumber == "" {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Batch number is required",
			Status:  fiber.StatusBadRequest,
		})
	}

	if req.PrinterID == "" || req.Command == "" || req.JobType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Printer ID, command, and job type are required",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Generate UUID for job
	jobUuid := uuid.New().String()

	// Get user UUID from context
	userUUIDInterface := c.Locals("user_id")
	if userUUIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(types.ErrorResponse{
			Message: "User not authenticated",
			Status:  fiber.StatusUnauthorized,
		})
	}
	userUUID := userUUIDInterface.(string)

	// Look up user by UUID to get their ID
	var user struct {
		ID uint
	}
	if err := pc.db.Table("users").Select("id").Where("uuid = ?", userUUID).First(&user).Error; err != nil {
		logger.Error("Failed to find user by UUID", err)
		return c.Status(fiber.StatusUnauthorized).JSON(types.ErrorResponse{
			Message: "Invalid user",
			Status:  fiber.StatusUnauthorized,
		})
	}
	userID := user.ID

	// Start transaction
	tx := pc.db.Begin()
	if tx.Error != nil {
		logger.Error("Failed to begin transaction", tx.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find the order batch
	var orderBatch order.OrderBatch
	if err := tx.Where("batch_number = ?", req.BatchNumber).First(&orderBatch).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(types.ErrorResponse{
				Message: fmt.Sprintf("Batch number '%s' not found", req.BatchNumber),
				Status:  fiber.StatusNotFound,
			})
		}
		logger.Error("Failed to fetch order batch", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch order batch",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Check if print batch job already exists for this batch
	var existingPrintBatch print.PrintBatchJob
	if err := tx.Where("order_batch_id = ?", orderBatch.ID).First(&existingPrintBatch).Error; err == nil {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(types.ErrorResponse{
			Message: fmt.Sprintf("Print batch job already exists for batch '%s'", req.BatchNumber),
			Status:  fiber.StatusConflict,
			Data: fiber.Map{
				"print_batch_job_id": existingPrintBatch.ID,
				"status":             existingPrintBatch.Status,
			},
		})
	}

	// Get all orders in the batch with their full details
	var batchItems []order.OrderBatchItem
	if err := tx.Preload("Order.Address").Preload("Order.ReturningAddress").
		Where("order_batch_id = ?", orderBatch.ID).
		Find(&batchItems).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to fetch batch items", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch orders for printing",
			Status:  fiber.StatusInternalServerError,
		})
	}

	if len(batchItems) == 0 {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(types.ErrorResponse{
			Message: "No orders found in this batch",
			Status:  fiber.StatusNotFound,
		})
	}

	// Create PrintBatchJob
	printBatchJob := print.PrintBatchJob{
		BatchNumber:  req.BatchNumber,
		OrderBatchID: orderBatch.ID,
		Status:       print.PrintJobPending,
		TotalJobs:    len(batchItems),
		CreatedByID:  userID,
		PrinterID:    req.PrinterID,
		Command:      req.Command,
		JobType:      req.JobType,
		JobUuid:      jobUuid,
	}

	if err := tx.Create(&printBatchJob).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create print batch job", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Create PrintSingleJob and PrintJobData for each order
	var printSingleJobs []print.PrintSingleJob
	var printJobDataList []print.PrintJobData

	for _, item := range batchItems {
		// Create PrintSingleJob
		printSingleJob := print.PrintSingleJob{
			PrintBatchJobID: printBatchJob.ID,
			OrderID:         item.Order.ID,
			Sequence:        item.Order.Sequence,
			Status:          print.PrintJobPending,
			PrinterID:       req.PrinterID,
			Command:         req.Command,
			JobType:         req.JobType,
			JobUuid:         jobUuid,
		}

		if err := tx.Create(&printSingleJob).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create print single job", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create print jobs",
				Status:  fiber.StatusInternalServerError,
			})
		}

		printSingleJobs = append(printSingleJobs, printSingleJob)

		// Create PrintJobData with flattened order data
		printJobData := print.PrintJobData{
			PrintSingleJobID:       printSingleJob.ID,
			OrderID:                item.Order.ID,
			Sequence:               item.Order.Sequence,
			RecipientForeName:      item.Order.Address.RecipientForeName,
			RecipientOtherName:     item.Order.Address.RecipientOtherName,
			PostalAddress:          item.Order.Address.PostalAddress,
			ZipCode:                item.Order.Address.ZipCode,
			City:                   item.Order.Address.City,
			PhoneNo:                item.Order.Address.PhoneNo,
			QrID:                   item.Order.Address.QrID,
			CountryCode:            item.Order.Address.CountryCode,
			DistrictHeadPostOffice: item.Order.ReturningAddress.DistrictHeadPostOffice,
			ReturningZipCode:       item.Order.ReturningAddress.ZipCode,
			District:               item.Order.ReturningAddress.District,
		}

		if err := tx.Create(&printJobData).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create print job data", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create print job data",
				Status:  fiber.StatusInternalServerError,
			})
		}

		printJobDataList = append(printJobDataList, printJobData)

		// Fire OrderPrinted event
		orderEvent := order.OrderEvent{
			OrderID: item.Order.ID,
			Status:  order.OrderPrintStarted,
			Message: fmt.Sprintf("Order %d queued for printing in batch %s", item.Order.Sequence, req.BatchNumber),
		}

		if err := tx.Create(&orderEvent).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create order event", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create order event",
				Status:  fiber.StatusInternalServerError,
			})
		}
	}

	// Update print batch job start time
	now := time.Now()
	printBatchJob.StartedAt = &now
	if err := tx.Save(&printBatchJob).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to update print batch job", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to update print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		logger.Error("Failed to commit transaction", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to finalize print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Log the activity
	logger.Success(fmt.Sprintf("Created print batch job for batch %s with %d orders", req.BatchNumber, len(batchItems)))

	// Return success response
	return c.Status(fiber.StatusCreated).JSON(types.ApiResponse{
		Message: "Print batch job created successfully",
		Status:  fiber.StatusCreated,
		Data: fiber.Map{
			"print_batch_job": fiber.Map{
				"id":           printBatchJob.ID,
				"batch_number": printBatchJob.BatchNumber,
				"status":       printBatchJob.Status,
				"total_jobs":   printBatchJob.TotalJobs,
				"started_at":   printBatchJob.StartedAt,
			},
			"total_print_jobs": len(printSingleJobs),
		},
	})
}
