package printclient

import (
	"log"
	"sync"
	"sync/atomic"
	"time"
)

// WebSocketMetrics tracks WebSocket connection and message statistics
type WebSocketMetrics struct {
	activeConnections    int64
	totalConnections     int64
	messagesProcessed    int64
	authenticationErrors int64
	connectionErrors     int64
	mu                   sync.RWMutex
}

// Global metrics instance
var wsMetrics = &WebSocketMetrics{}

// IncrementActiveConnections increases the active connection count
func IncrementActiveConnections() {
	atomic.AddInt64(&wsMetrics.activeConnections, 1)
	atomic.AddInt64(&wsMetrics.totalConnections, 1)
}

// DecrementActiveConnections decreases the active connection count
func DecrementActiveConnections() {
	atomic.AddInt64(&wsMetrics.activeConnections, -1)
}

// IncrementMessagesProcessed increases the message processing count
func IncrementMessagesProcessed() {
	atomic.AddInt64(&wsMetrics.messagesProcessed, 1)
}

// IncrementAuthErrors increases the authentication error count
func IncrementAuthErrors() {
	atomic.AddInt64(&wsMetrics.authenticationErrors, 1)
}

// IncrementConnectionErrors increases the connection error count
func IncrementConnectionErrors() {
	atomic.AddInt64(&wsMetrics.connectionErrors, 1)
}

// GetWebSocketMetrics returns current WebSocket metrics for monitoring
func GetWebSocketMetrics() map[string]interface{} {
	return map[string]interface{}{
		"active_connections":    atomic.LoadInt64(&wsMetrics.activeConnections),
		"total_connections":     atomic.LoadInt64(&wsMetrics.totalConnections),
		"messages_processed":    atomic.LoadInt64(&wsMetrics.messagesProcessed),
		"authentication_errors": atomic.LoadInt64(&wsMetrics.authenticationErrors),
		"connection_errors":     atomic.LoadInt64(&wsMetrics.connectionErrors),
	}
}

// ResetMetrics resets all metrics to zero (useful for testing)
func ResetMetrics() {
	atomic.StoreInt64(&wsMetrics.activeConnections, 0)
	atomic.StoreInt64(&wsMetrics.totalConnections, 0)
	atomic.StoreInt64(&wsMetrics.messagesProcessed, 0)
	atomic.StoreInt64(&wsMetrics.authenticationErrors, 0)
	atomic.StoreInt64(&wsMetrics.connectionErrors, 0)
}

// MetricsReporter periodically logs WebSocket metrics
type MetricsReporter struct {
	interval time.Duration
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// NewMetricsReporter creates a new metrics reporter
func NewMetricsReporter(interval time.Duration) *MetricsReporter {
	if interval <= 0 {
		interval = 60 * time.Second // Default to 1 minute
	}

	return &MetricsReporter{
		interval: interval,
		stopChan: make(chan struct{}),
	}
}

// Start begins reporting metrics at the specified interval
func (mr *MetricsReporter) Start() {
	mr.wg.Add(1)
	go mr.reportLoop()
	log.Println("✅ Metrics Reporter started")
}

// Stop gracefully stops the metrics reporter
func (mr *MetricsReporter) Stop() {
	close(mr.stopChan)
	mr.wg.Wait()
	log.Println("✅ Metrics Reporter stopped")
}

// reportLoop periodically reports metrics
func (mr *MetricsReporter) reportLoop() {
	defer mr.wg.Done()
	ticker := time.NewTicker(mr.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			mr.logMetrics()
		case <-mr.stopChan:
			return
		}
	}
}

// logMetrics logs current metrics
func (mr *MetricsReporter) logMetrics() {
	metrics := GetWebSocketMetrics()
	log.Printf("╔══════════════════════════════════════════════════════════════╗")
	log.Printf("║                  WEBSOCKET METRICS REPORT                    ║")
	log.Printf("╠══════════════════════════════════════════════════════════════╣")
	log.Printf("║ Active Connections:    %-10v                           ║", metrics["active_connections"])
	log.Printf("║ Total Connections:     %-10v                           ║", metrics["total_connections"])
	log.Printf("║ Messages Processed:    %-10v                           ║", metrics["messages_processed"])
	log.Printf("║ Auth Errors:           %-10v                           ║", metrics["authentication_errors"])
	log.Printf("║ Connection Errors:     %-10v                           ║", metrics["connection_errors"])
	log.Printf("╚══════════════════════════════════════════════════════════════╝")
}
