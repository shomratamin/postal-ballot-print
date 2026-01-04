package printclient

import (
	"encoding/json"
	"log"
)

// PrintJobHelper provides helper functions to send print jobs to connected clients
type PrintJobHelper struct{}

// NewPrintJobHelper creates a new print job helper
func NewPrintJobHelper() *PrintJobHelper {
	return &PrintJobHelper{}
}

// SendBatchPrintJob sends a batch print job to a specific printer
func (pjh *PrintJobHelper) SendBatchPrintJob(printerID, batchNumber, jobUUID string, orders []map[string]interface{}) error {
	job := PrintJob{
		JobID:     jobUUID,
		JobType:   "batch",
		Command:   "print_batch",
		PrinterID: printerID,
		Data: map[string]interface{}{
			"batch_number": batchNumber,
			"orders":       orders,
			"total_count":  len(orders),
		},
	}

	return pjh.sendJob(job, printerID)
}

// SendSinglePrintJob sends a single print job to a printer
func (pjh *PrintJobHelper) SendSinglePrintJob(printerID, orderID, jobUUID string, orderData map[string]interface{}) error {
	job := PrintJob{
		JobID:     jobUUID,
		JobType:   "single",
		Command:   "print_order",
		PrinterID: printerID,
		Data: map[string]interface{}{
			"order_id": orderID,
			"order":    orderData,
		},
	}

	return pjh.sendJob(job, printerID)
}

// SendTestPrintJob sends a test print job to verify printer connectivity
func (pjh *PrintJobHelper) SendTestPrintJob(printerID string) error {
	job := PrintJob{
		JobID:     "test_" + generateJobID(),
		JobType:   "test",
		Command:   "test_print",
		PrinterID: printerID,
		Data: map[string]interface{}{
			"message": "Test print job from server",
		},
	}

	return pjh.sendJob(job, printerID)
}

// SendCustomJob sends a custom print job with arbitrary data
func (pjh *PrintJobHelper) SendCustomJob(printerID, jobType, command, jobID string, data map[string]interface{}) error {
	job := PrintJob{
		JobID:     jobID,
		JobType:   jobType,
		Command:   command,
		PrinterID: printerID,
		Data:      data,
	}

	return pjh.sendJob(job, printerID)
}

// sendJob is a helper method to send a job to a printer
func (pjh *PrintJobHelper) sendJob(job PrintJob, printerID string) error {
	// Convert job to JSON
	jobJSON, err := json.Marshal(job)
	if err != nil {
		log.Printf("Failed to marshal print job: %v", err)
		return err
	}

	// Send to printer via channel
	PushNotification("printer-channel", printerID, string(jobJSON))

	log.Printf("✅ Print job sent to printer %s: JobID=%s, Type=%s", printerID, job.JobID, job.JobType)
	return nil
}

// IsPrinterConnected checks if a printer is currently connected
func (pjh *PrintJobHelper) IsPrinterConnected(printerID string) bool {
	subscriptionKey := "printer-channel" + printerID
	_, ok := channelSubscriptions.Load(subscriptionKey)
	return ok
}

// GetConnectedPrinterCount returns the number of currently connected printers
func (pjh *PrintJobHelper) GetConnectedPrinterCount() int {
	count := 0
	channelSubscriptions.Range(func(key, value interface{}) bool {
		count++
		return true
	})
	return count
}

// BroadcastToAllPrinters sends a message to all connected printers
func (pjh *PrintJobHelper) BroadcastToAllPrinters(jobType, command string, data map[string]interface{}) error {
	jobID := "broadcast_" + generateJobID()

	var errors []error
	channelSubscriptions.Range(func(key, value interface{}) bool {
		if sub, ok := value.(*Subscription); ok {
			job := PrintJob{
				JobID:     jobID,
				JobType:   jobType,
				Command:   command,
				PrinterID: sub.UserUUID,
				Data:      data,
			}

			if err := pjh.sendJob(job, sub.UserUUID); err != nil {
				errors = append(errors, err)
			}
		}
		return true
	})

	if len(errors) > 0 {
		log.Printf("⚠️ Broadcast completed with %d errors", len(errors))
		return errors[0] // Return first error
	}

	return nil
}
