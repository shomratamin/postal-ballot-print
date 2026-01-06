package printclient

import (
	"encoding/json"
	"log"
	"printenvelope/types"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// PrintClientController handles HTTP requests for print client management
type PrintClientController struct {
	service *PrintClientService
}

// NewPrintClientController creates a new print client controller
func NewPrintClientController(service *PrintClientService) *PrintClientController {
	return &PrintClientController{
		service: service,
	}
}

// GetMetrics returns current WebSocket and service metrics
func (pcc *PrintClientController) GetMetrics(c *fiber.Ctx) error {
	metrics := GetWebSocketMetrics()
	return c.JSON(fiber.Map{
		"status":  "success",
		"metrics": metrics,
	})
}

// // SendPrintJob sends a print job to a specific printer
// func (pcc *PrintClientController) SendPrintJob(c *fiber.Ctx) error {
// 	var req struct {
// 		PrinterID string                 `json:"printer_id" validate:"required"`
// 		JobType   string                 `json:"job_type" validate:"required"`
// 		Command   string                 `json:"command" validate:"required"`
// 		Data      map[string]interface{} `json:"data" validate:"required"`
// 	}

// 	if err := c.BodyParser(&req); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"status":  "error",
// 			"message": "Invalid request payload",
// 		})
// 	}

// 	// Create print job
// 	job := PrintJob{
// 		JobID:     generateJobID(),
// 		JobType:   req.JobType,
// 		Command:   req.Command,
// 		Data:      req.Data,
// 		PrinterID: req.PrinterID,
// 	}

// 	// Convert to JSON
// 	jobJSON, err := json.Marshal(job)
// 	if err != nil {
// 		log.Printf("Failed to marshal print job: %v", err)
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"status":  "error",
// 			"message": "Failed to create print job",
// 		})
// 	}

// 	// Send to printer via channel
// 	PushNotification("printer-channel", req.PrinterID, string(jobJSON))

// 	return c.JSON(fiber.Map{
// 		"status":  "success",
// 		"message": "Print job sent successfully",
// 		"job_id":  job.JobID,
// 	})
// }

// GetConnectedPrinters returns a list of connected printers
func (pcc *PrintClientController) GetConnectedPrinters(c *fiber.Ctx) error {
	var printers []map[string]interface{}

	// Iterate through subscriptions
	channelSubscriptions.Range(func(key, value interface{}) bool {
		if sub, ok := value.(*Subscription); ok {
			printers = append(printers, map[string]interface{}{
				"printer_id": sub.UserUUID,
				"channel":    sub.ChannelName,
				"connected":  !sub.Closed,
			})
		}
		return true
	})

	return c.JSON(fiber.Map{
		"status":   "success",
		"count":    len(printers),
		"printers": printers,
	})
}

// DisconnectPrinter forcefully disconnects a printer
func (pcc *PrintClientController) DisconnectPrinter(c *fiber.Ctx) error {
	printerID := c.Params("printer_id")
	if printerID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Printer ID is required",
		})
	}

	// Unsubscribe the printer
	unsubscribeChan <- Unsubscription{
		ChannelName: "printer-channel",
		UserUUID:    printerID,
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Printer disconnection requested",
	})
}

// SendPrintJobDirect sends a print job directly without HTTP context
// Returns the job ID and any error that occurred
func SendPrintJobDirect(data types.PrintJob) (string, error) {

	// Convert to JSON
	jobJSON, err := json.Marshal(data)
	if err != nil {
		log.Printf("Failed to marshal print job: %v", err)
		return "", err
	}

	// Send to printer via channel
	PushNotification("printer-channel", data.PrinterID, string(jobJSON))

	return data.JobID, nil
}

func generateJobID() string {
	return uuid.New().String()
}
