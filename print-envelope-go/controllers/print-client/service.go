package printclient

import (
	"context"
	"log"
	"sync"
	"time"
)

// PrintClientService orchestrates all print client components
type PrintClientService struct {
	channelService    *ChannelService
	metricsReporter   *MetricsReporter
	upstreamProcessor *UpstreamProcessor
	ctx               context.Context
	cancel            context.CancelFunc
	wg                sync.WaitGroup
}

// UpstreamProcessor handles upstream log processing
type UpstreamProcessor struct {
	workerCount int
	stopChan    chan struct{}
	wg          sync.WaitGroup
}

// Global service instance
var globalPrintClientService *PrintClientService
var serviceInitOnce sync.Once

// InitPrintClientService initializes the print client service
func InitPrintClientService() *PrintClientService {
	serviceInitOnce.Do(func() {
		log.Println("🔄 Initializing Print Client Service...")

		ctx, cancel := context.WithCancel(context.Background())

		service := &PrintClientService{
			channelService:    NewChannelService(20),                // 20 workers for channel operations
			metricsReporter:   NewMetricsReporter(60 * time.Second), // Report every minute
			upstreamProcessor: NewUpstreamProcessor(5),              // 5 workers for upstream logs
			ctx:               ctx,
			cancel:            cancel,
		}

		globalPrintClientService = service
		log.Println("✅ Print Client Service initialized")
	})

	return globalPrintClientService
}

// Start begins all service components
func (pcs *PrintClientService) Start() {
	log.Println("🚀 Starting Print Client Service...")

	// Start channel service
	pcs.channelService.Start()

	// Start metrics reporter
	pcs.metricsReporter.Start()

	// Start upstream processor
	pcs.upstreamProcessor.Start()

	log.Println("✅ Print Client Service started successfully")
}

// Stop gracefully shuts down all service components
func (pcs *PrintClientService) Stop() {
	log.Println("🔄 Stopping Print Client Service...")

	// Cancel context
	pcs.cancel()

	// Stop all components
	pcs.channelService.Stop()
	pcs.metricsReporter.Stop()
	pcs.upstreamProcessor.Stop()

	// Wait for all goroutines to finish
	pcs.wg.Wait()

	log.Println("✅ Print Client Service stopped")
}

// NewUpstreamProcessor creates a new upstream processor
func NewUpstreamProcessor(workerCount int) *UpstreamProcessor {
	if workerCount <= 0 {
		workerCount = 5
	}

	return &UpstreamProcessor{
		workerCount: workerCount,
		stopChan:    make(chan struct{}),
	}
}

// Start begins processing upstream logs
func (up *UpstreamProcessor) Start() {
	log.Printf("📤 Starting %d upstream log workers", up.workerCount)

	for i := 0; i < up.workerCount; i++ {
		up.wg.Add(1)
		go up.logWorker(i)
	}

	log.Println("✅ Upstream processor started")
}

// Stop gracefully stops the upstream processor
func (up *UpstreamProcessor) Stop() {
	log.Println("🔄 Stopping upstream processor...")
	close(up.stopChan)
	up.wg.Wait()
	log.Println("✅ Upstream processor stopped")
}

// logWorker processes upstream log messages
func (up *UpstreamProcessor) logWorker(workerID int) {
	defer up.wg.Done()
	log.Printf("📤 Log worker %d started", workerID)

	for {
		select {
		case logMsg, ok := <-upstreamLogsChan:
			if !ok {
				log.Printf("📤 Log worker %d: channel closed", workerID)
				return
			}

			// Process the log message
			// In cloud-print-server, this would publish to RabbitMQ
			// Here, you can integrate with your database or other logging system
			up.processLogMessage(logMsg, workerID)

		case <-up.stopChan:
			log.Printf("📤 Log worker %d stopping", workerID)
			return
		}
	}
}

// processLogMessage processes an upstream log message
func (up *UpstreamProcessor) processLogMessage(logMsg UpstreamMsg, workerID int) {
	// TODO: Integrate with your database or logging system
	// For now, just log it
	log.Printf("📤 Worker %d - Upstream Log: Type=%s, Event=%s, ID=%s, JobID=%s, Message=%s",
		workerID, logMsg.Type, logMsg.Event, logMsg.ID, logMsg.JobID, logMsg.Message)

	// You can add database insertion here, for example:
	// if globalPrintClientService.db != nil {
	//     // Insert into logs table
	//     globalPrintClientService.db.Create(&PrintClientLog{
	//         ClientID: logMsg.ID,
	//         Event: logMsg.Event,
	//         Message: logMsg.Message,
	//         ...
	//     })
	// }
}

// GetService returns the global print client service instance
func GetService() *PrintClientService {
	return globalPrintClientService
}

// IsServiceRunning checks if the service is running
func IsServiceRunning() bool {
	return globalPrintClientService != nil
}
