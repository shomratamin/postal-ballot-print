# Print Client Quick Start Guide

## Overview

The Print Client module enables real-time communication with cloud-based print clients via WebSocket connections. This guide will help you get started quickly.

## Getting Started

### 1. Service Already Integrated

The print client service is already initialized in your application. When you run the server, you'll see:

```
Print Client Service started successfully
```

### 2. WebSocket Endpoint

Clients connect to: `ws://your-server-address/ws`

### 3. Client Authentication

Clients must send an authentication message within 5 seconds:

```json
{
  "type": "auth",
  "token": "hardware_token",
  "processor": "Intel Core i7",
  "platform": "Windows 10",
  "hardware_id": "ABC123XYZ",
  "client_version": "1.0.0"
}
```

The token is generated from hardware fingerprint:
```
SHA256(processor + platform + hardware_id)
Extract specific characters to create 16-char token
```

## Sending Print Jobs

### From Your Code

```go
import printclient "printenvelope/controllers/print-client"

// Create helper
helper := printclient.NewPrintJobHelper()

// Send a batch print job
err := helper.SendBatchPrintJob(
    "printer_token_123",    // Printer ID
    "BATCH-2024-001",       // Batch number
    "job_uuid_456",         // Job UUID
    []map[string]interface{}{ // Order data
        {
            "order_id": "ORD001",
            "recipient": "John Doe",
            "address": "123 Main St",
        },
    },
)
```

### Via HTTP API

```bash
curl -X POST http://localhost:8056/api/print-client/send-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "printer_id": "printer_token_123",
    "job_type": "envelope",
    "command": "print",
    "data": {
      "order_id": "12345",
      "recipient": "John Doe"
    }
  }'
```

## Checking Printer Status

### Get All Connected Printers

```bash
curl http://localhost:8056/api/print-client/connected-printers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "status": "success",
  "count": 3,
  "printers": [
    {
      "printer_id": "printer_001",
      "channel": "printer-channel",
      "connected": true
    }
  ]
}
```

### Get Metrics

```bash
curl http://localhost:8056/api/print-client/metrics
```

Response:
```json
{
  "status": "success",
  "metrics": {
    "active_connections": 3,
    "total_connections": 25,
    "messages_processed": 1523,
    "authentication_errors": 2,
    "connection_errors": 1
  }
}
```

## Integrating with Print Controller

### Example: Send job after creating batch

In [controllers/print/print.go](../print/print.go):

```go
import printclient "printenvelope/controllers/print-client"

func (pc *PrintController) PrintBatch(c *fiber.Ctx) error {
    // ... existing batch creation code ...
    
    // After creating print batch job, send to printer
    helper := printclient.NewPrintJobHelper()
    
    // Check if printer is connected
    if !helper.IsPrinterConnected(req.PrinterID) {
        return c.Status(fiber.StatusServiceUnavailable).JSON(types.ErrorResponse{
            Message: "Printer is not connected",
            Status:  fiber.StatusServiceUnavailable,
        })
    }
    
    // Send job to printer
    err := helper.SendBatchPrintJob(
        req.PrinterID,
        req.BatchNumber,
        jobUuid,
        orderData,
    )
    if err != nil {
        logger.Error("Failed to send job to printer", err)
        // Handle error - maybe mark job as pending
    }
    
    // ... rest of your code ...
}
```

## Client Message Handling

### Ping (Keep-Alive)

Clients should send periodic ping messages:

```json
{
  "JobId": "",
  "Event": "ping",
  "Message": ""
}
```

### Job Status Updates

Clients send status updates for jobs:

```json
{
  "JobId": "job_123",
  "Event": "job-started",
  "Message": "Starting print job"
}
```

Events:
- `job-started`: Job has started
- `job-completed`: Job finished successfully
- `job-failed`: Job encountered an error

## Monitoring

### Check Logs

The service logs important events:

```
🔄 Initializing Print Client Service...
✅ Print Client Service started successfully
Printer abc123 authenticated successfully
🚀 Message sent successfully to printer abc123
📤 Worker 0 - Upstream Log: Event=printer-connected
```

### Metrics Reporter

Every 60 seconds, metrics are logged:

```
╔══════════════════════════════════════════════════════════════╗
║                  WEBSOCKET METRICS REPORT                    ║
╠══════════════════════════════════════════════════════════════╣
║ Active Connections:    3                                     ║
║ Total Connections:     25                                    ║
║ Messages Processed:    1523                                  ║
╚══════════════════════════════════════════════════════════════╝
```

## Troubleshooting

### Printer Won't Connect

1. Check WebSocket URL is correct
2. Verify authentication message format
3. Ensure token is generated correctly
4. Check 5-second timeout

### Messages Not Delivered

1. Verify printer is connected: `GET /api/print-client/connected-printers`
2. Check undelivered message queue
3. Review logs for errors

### High Memory Usage

1. Check number of connected printers
2. Review undelivered message retention (5 min default)
3. Monitor metrics

## Testing

### Test Print Job

```go
helper := printclient.NewPrintJobHelper()
err := helper.SendTestPrintJob("printer_token_123")
```

### Broadcast to All Printers

```go
helper := printclient.NewPrintJobHelper()
err := helper.BroadcastToAllPrinters(
    "notification",
    "update",
    map[string]interface{}{
        "message": "System maintenance in 10 minutes",
    },
)
```

## Best Practices

1. **Check Connectivity**: Always verify printer is connected before sending jobs
2. **Handle Offline**: Queue jobs in database if printer is offline
3. **Retry Logic**: Implement retry for failed job sends
4. **Monitoring**: Regularly check metrics endpoint
5. **Logging**: Log all job sends and status updates
6. **Error Handling**: Gracefully handle connection errors

## Next Steps

1. Test WebSocket connection with a client
2. Send your first print job
3. Monitor metrics and logs
4. Integrate with your print workflow
5. Implement error handling
6. Add database persistence for logs

## Support

For detailed documentation, see:
- [README.md](README.md) - Full module documentation
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Migration details

## Example Client (Pseudo-code)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8056/ws');

// Generate token (from hardware info)
const token = generateHardwareToken();

// Send auth on connect
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: token,
    processor: 'Intel Core i7',
    platform: 'Windows 10',
    hardware_id: 'ABC123',
    client_version: '1.0.0'
  }));
};

// Handle incoming messages (print jobs)
ws.onmessage = (event) => {
  const job = JSON.parse(event.data);
  console.log('Received job:', job);
  
  // Process job...
  processPrintJob(job);
  
  // Send status update
  ws.send(JSON.stringify({
    JobId: job.job_id,
    Event: 'job-started',
    Message: 'Processing print job'
  }));
};

// Send periodic ping
setInterval(() => {
  ws.send(JSON.stringify({
    JobId: '',
    Event: 'ping',
    Message: ''
  }));
}, 30000); // Every 30 seconds
```

---

**You're all set!** The print client service is running and ready to communicate with your cloud print clients.
