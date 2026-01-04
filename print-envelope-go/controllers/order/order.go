package order

import (
	"encoding/json"
	"fmt"
	"printenvelope/logger"
	"printenvelope/models/order"
	"printenvelope/types"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type OrderController struct {
	db             *gorm.DB
	loggerInstance *logger.AsyncLogger
}

func NewOrderController(db *gorm.DB, async_logger *logger.AsyncLogger) *OrderController {
	return &OrderController{db: db, loggerInstance: async_logger}
}

func (oc *OrderController) OrderList(c *fiber.Ctx) error {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100 // Max limit
	}

	// Build query
	query := oc.db.Model(&order.Order{}).
		Preload("Address").
		Preload("ReturningAddress")

	// Filter by sequence
	if sequence := c.Query("sequence"); sequence != "" {
		query = query.Where("sequence ILIKE ?", "%"+sequence+"%")
	}

	// Filter by OrderEvent status
	if status := c.Query("status"); status != "" {
		query = query.Joins("JOIN order_events ON order_events.order_id = orders.id").
			Where("order_events.status = ?", status).
			Group("orders.id")
	}

	// Filter by date range on createdAt
	if startDate := c.Query("start_date"); startDate != "" {
		parsedStartDate, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			query = query.Where("orders.created_at >= ?", parsedStartDate)
		}
	}
	if endDate := c.Query("end_date"); endDate != "" {
		parsedEndDate, err := time.Parse("2006-01-02", endDate)
		if err == nil {
			// Add 1 day to include the entire end date
			query = query.Where("orders.created_at < ?", parsedEndDate.AddDate(0, 0, 1))
		}
	}

	// Filter by ReturningAddress fields
	if districtHeadPostOffice := c.Query("district_head_post_office"); districtHeadPostOffice != "" {
		query = query.Joins("JOIN returning_addresses ON returning_addresses.id = orders.returning_address_id").
			Where("returning_addresses.district_head_post_office ILIKE ?", "%"+districtHeadPostOffice+"%")
	}
	if returningZipCode := c.Query("returning_zip_code"); returningZipCode != "" {
		query = query.Joins("JOIN returning_addresses ON returning_addresses.id = orders.returning_address_id").
			Where("returning_addresses.zip_code ILIKE ?", "%"+returningZipCode+"%")
	}
	if district := c.Query("district"); district != "" {
		query = query.Joins("JOIN returning_addresses ON returning_addresses.id = orders.returning_address_id").
			Where("returning_addresses.district ILIKE ?", "%"+district+"%")
	}

	// Filter by Address fields
	if recipientForeName := c.Query("recipient_fore_name"); recipientForeName != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.recipient_fore_name ILIKE ?", "%"+recipientForeName+"%")
	}
	if recipientOtherName := c.Query("recipient_other_name"); recipientOtherName != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.recipient_other_name ILIKE ?", "%"+recipientOtherName+"%")
	}
	if addressZipCode := c.Query("zip_code"); addressZipCode != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.zip_code ILIKE ?", "%"+addressZipCode+"%")
	}
	if city := c.Query("city"); city != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.city ILIKE ?", "%"+city+"%")
	}
	if phoneNo := c.Query("phone_no"); phoneNo != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.phone_no ILIKE ?", "%"+phoneNo+"%")
	}
	if qrID := c.Query("qr_id"); qrID != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.qr_id ILIKE ?", "%"+qrID+"%")
	}
	if countryCode := c.Query("country_code"); countryCode != "" {
		query = query.Joins("JOIN addresses ON addresses.id = orders.address_id").
			Where("addresses.country_code ILIKE ?", "%"+countryCode+"%")
	}

	// Count total records
	var total int64
	countQuery := query
	if err := countQuery.Count(&total).Error; err != nil {
		logger.Error("Failed to count orders", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to count orders",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Fetch paginated results
	var orders []order.Order
	offset := (page - 1) * pageSize

	// Order by created_at descending (newest first)
	if err := query.Order("orders.created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&orders).Error; err != nil {
		logger.Error("Failed to fetch orders", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch orders",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Calculate pagination metadata
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	hasNextPage := page < totalPages
	hasPrevPage := page > 1

	// Build filter summary
	filterSummary := buildFilterSummary(c)

	// Return response
	response := types.ApiResponse{
		Message: "Orders fetched successfully",
		Status:  fiber.StatusOK,
		Data: fiber.Map{
			"orders": orders,
			"pagination": fiber.Map{
				"current_page":  page,
				"page_size":     pageSize,
				"total_records": total,
				"total_pages":   totalPages,
				"has_next_page": hasNextPage,
				"has_prev_page": hasPrevPage,
				"next_page":     getNextPage(page, totalPages),
				"prev_page":     getPrevPage(page),
			},
			"filters": filterSummary,
		},
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// Helper function to build filter summary
func buildFilterSummary(c *fiber.Ctx) map[string]interface{} {
	filters := make(map[string]interface{})

	if sequence := c.Query("sequence"); sequence != "" {
		filters["sequence"] = sequence
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if startDate := c.Query("start_date"); startDate != "" {
		filters["start_date"] = startDate
	}
	if endDate := c.Query("end_date"); endDate != "" {
		filters["end_date"] = endDate
	}
	if districtHeadPostOffice := c.Query("district_head_post_office"); districtHeadPostOffice != "" {
		filters["district_head_post_office"] = districtHeadPostOffice
	}
	if returningZipCode := c.Query("returning_zip_code"); returningZipCode != "" {
		filters["returning_zip_code"] = returningZipCode
	}
	if district := c.Query("district"); district != "" {
		filters["district"] = district
	}
	if recipientForeName := c.Query("recipient_fore_name"); recipientForeName != "" {
		filters["recipient_fore_name"] = recipientForeName
	}
	if recipientOtherName := c.Query("recipient_other_name"); recipientOtherName != "" {
		filters["recipient_other_name"] = recipientOtherName
	}
	if addressZipCode := c.Query("zip_code"); addressZipCode != "" {
		filters["zip_code"] = addressZipCode
	}
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if phoneNo := c.Query("phone_no"); phoneNo != "" {
		filters["phone_no"] = phoneNo
	}
	if qrID := c.Query("qr_id"); qrID != "" {
		filters["qr_id"] = qrID
	}
	if countryCode := c.Query("country_code"); countryCode != "" {
		filters["country_code"] = countryCode
	}

	return filters
}

// Helper function to get next page number
func getNextPage(currentPage, totalPages int) *int {
	if currentPage < totalPages {
		nextPage := currentPage + 1
		return &nextPage
	}
	return nil
}

// Helper function to get previous page number
func getPrevPage(currentPage int) *int {
	if currentPage > 1 {
		prevPage := currentPage - 1
		return &prevPage
	}
	return nil
}

// BatchOrderCreate creates a batch of orders based on sequence range
func (oc *OrderController) BatchOrderCreate(c *fiber.Ctx) error {
	// Parse request body
	var req types.BatchOrderRequest
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse batch order request", err)
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Invalid request payload",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Validate input
	if req.StartSequence <= 0 || req.EndSequence <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Start sequence and end sequence must be positive integers",
			Status:  fiber.StatusBadRequest,
		})
	}

	if req.StartSequence > req.EndSequence {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Start sequence must be less than or equal to end sequence",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Get user UUID from context (set by auth middleware)
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
	if err := oc.db.Table("users").Select("id").Where("uuid = ?", userUUID).First(&user).Error; err != nil {
		logger.Error("Failed to find user by UUID", err)
		return c.Status(fiber.StatusUnauthorized).JSON(types.ErrorResponse{
			Message: "Invalid user",
			Status:  fiber.StatusUnauthorized,
		})
	}
	userID := user.ID

	// Start transaction
	tx := oc.db.Begin()
	if tx.Error != nil {
		logger.Error("Failed to begin transaction", tx.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create batch",
			Status:  fiber.StatusInternalServerError,
		})
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find orders within the sequence range
	var orders []order.Order
	if err := tx.Where("sequence >= ? AND sequence <= ?", req.StartSequence, req.EndSequence).
		Order("sequence ASC").
		Find(&orders).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to fetch orders", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch orders for batching",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Check if any orders were found
	if len(orders) == 0 {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(types.ErrorResponse{
			Message: "No orders found in the specified sequence range",
			Status:  fiber.StatusNotFound,
		})
	}

	// Check if any orders in this range are already batched
	var orderIDs []uint
	for _, ord := range orders {
		orderIDs = append(orderIDs, ord.ID)
	}

	var batchedItems []struct {
		OrderID      uint
		Sequence     int
		BatchNumber  string
		OrderBatchID uint
	}

	if err := tx.Table("order_batch_items").
		Select("order_batch_items.order_id, orders.sequence, order_batches.batch_number, order_batch_items.order_batch_id").
		Joins("JOIN orders ON orders.id = order_batch_items.order_id").
		Joins("JOIN order_batches ON order_batches.id = order_batch_items.order_batch_id").
		Where("order_batch_items.order_id IN ?", orderIDs).
		Where("order_batch_items.deleted_at IS NULL").
		Where("order_batches.deleted_at IS NULL").
		Find(&batchedItems).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to check for existing batches", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to validate batch",
			Status:  fiber.StatusInternalServerError,
		})
	}

	if len(batchedItems) > 0 {
		tx.Rollback()

		// Build a detailed error message
		conflictDetails := make([]fiber.Map, 0)
		for _, item := range batchedItems {
			conflictDetails = append(conflictDetails, fiber.Map{
				"sequence":     item.Sequence,
				"batch_number": item.BatchNumber,
				"batch_id":     item.OrderBatchID,
			})
		}

		return c.Status(fiber.StatusConflict).JSON(types.ErrorResponse{
			Message: fmt.Sprintf("%d order(s) in this range are already batched", len(batchedItems)),
			Status:  fiber.StatusConflict,
			Data: fiber.Map{
				"conflicts": conflictDetails,
			},
		})
	}

	// Generate batch number (using timestamp)
	batchNumber := fmt.Sprintf("BATCH-%d", time.Now().Unix())

	// Create the batch
	batch := order.OrderBatch{
		BatchNumber:   batchNumber,
		StartSequence: req.StartSequence,
		EndSequence:   req.EndSequence,
		TotalOrders:   len(orders),
		CreatedByID:   userID,
	}

	if err := tx.Create(&batch).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create order batch", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create order batch",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Create batch items and fire events for each order
	var batchItems []order.OrderBatchItem
	var batchedOrderIDs []uint

	for _, ord := range orders {
		// Create batch item
		batchItem := order.OrderBatchItem{
			OrderID:      ord.ID,
			OrderBatchID: batch.ID,
		}
		batchItems = append(batchItems, batchItem)
		batchedOrderIDs = append(batchedOrderIDs, ord.ID)

		// Create metadata JSON
		metadataMap := map[string]interface{}{
			"batch_id":       batch.ID,
			"batch_number":   batch.BatchNumber,
			"order_sequence": ord.Sequence,
		}
		metadataJSON, err := json.Marshal(metadataMap)
		if err != nil {
			tx.Rollback()
			logger.Error("Failed to marshal metadata", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create batch metadata",
				Status:  fiber.StatusInternalServerError,
			})
		}
		metadataStr := string(metadataJSON)

		// Fire ORDER_BATCHED event for the order
		orderEvent := order.OrderEvent{
			OrderID:  ord.ID,
			Status:   order.OrderBatched,
			Message:  fmt.Sprintf("Order %s has been batched into %s", ord.Sequence, batch.BatchNumber),
			Metadata: &metadataStr,
		}

		if err := tx.Create(&orderEvent).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create order event", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create order batched event",
				Status:  fiber.StatusInternalServerError,
			})
		}
	}

	// Bulk insert batch items
	if len(batchItems) > 0 {
		if err := tx.Create(&batchItems).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create batch items", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to associate orders with batch",
				Status:  fiber.StatusInternalServerError,
			})
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		logger.Error("Failed to commit transaction", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to finalize batch creation",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Log the activity
	logger.Success(fmt.Sprintf("Created batch %s with %d orders (sequences: %s to %s)", batch.BatchNumber, len(orders), req.StartSequence, req.EndSequence))

	// Return success response
	return c.Status(fiber.StatusCreated).JSON(types.ApiResponse{
		Message: "Order batch created successfully",
		Status:  fiber.StatusCreated,
		Data: fiber.Map{
			"batch": fiber.Map{
				"id":             batch.ID,
				"batch_number":   batch.BatchNumber,
				"start_sequence": batch.StartSequence,
				"end_sequence":   batch.EndSequence,
				"total_orders":   batch.TotalOrders,
				"created_at":     batch.CreatedAt,
			},
			"batched_order_ids": batchedOrderIDs,
		},
	})
}
