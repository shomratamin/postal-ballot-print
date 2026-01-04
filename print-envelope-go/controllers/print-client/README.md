# Print Client Module

## Overview

This module provides WebSocket-based real-time communication with cloud print clients. It has been migrated from the `cloud-print-server` project with RabbitMQ replaced by Go channels for inter-service communication.

## Architecture

### Components

1. **types.go** - Message type definitions
   - `AuthMessage`: Client authentication data
   - `Subscription`: WebSocket client subscriptions
   - `ClientJob`: Job messages from clients
   - `PrintJob`: Print jobs sent to clients
   - `UpstreamMsg`: Upstream log messages

2. **websocket.go** - WebSocket connection handling
   - `ConnectWS()`: Main WebSocket handler
   - Hardware-based authentication
   - Message routing and processing
   - Connection lifecycle management

3. **auth.go** - Client authentication
   - `ValidateAuthToken()`: Hardware fingerprint validation
   - SHA-256 hash-based token verification
   - No external JWT dependency

4. **channels.go** - Channel-based messaging (replaces RabbitMQ)
   - `ChannelService`: Message routing service
   - Worker pool for message processing
   - Subscription management
   - Undelivered message handling

5. **metrics.go** - Monitoring and statistics
   - Connection tracking
   - Message processing metrics
   - Error counting
   - Periodic reporting

6. **service.go** - Service orchestration
   - `PrintClientService`: Main service coordinator
   - Component lifecycle management
   - Upstream log processing
   - Graceful shutdown

7. **controller.go** - HTTP API endpoints
   - Send print jobs
   - Get metrics
   - List connected printers
   - Disconnect printers

## Key Features

### ✅ Migrated from cloud-print-server

- **WebSocket Management**: Real-time bidirectional communication
- **Hardware Authentication**: Token validation based on processor, platform, and hardware ID
- **Connection Tracking**: Active connection monitoring and metrics
- **Undelivered Messages**: Queue system for offline clients
- **Upstream Logging**: Event tracking (connected, disconnected, job events)
- **Message Broadcasting**: Targeted message delivery to specific clients

### 🔄 RabbitMQ → Go Channels

| Original (RabbitMQ) | Replaced With (Channels) |
|---------------------|-------------------------|
| `bpo_remote_print_queue` | `internalMsgChan` |
| `bpo_remote_print_queue_logs` | `upstreamLogsChan` |
| Message Publishing | Channel sends |
| Message Consumption | Worker pool with channel receives |
| Exchanges/Routing | Direct channel communication |

## Usage

### Starting the Service

The service is automatically initialized in `main.go`:

```go
printClientService := printclient.InitPrintClientService()
printClientService.Start()
```

### WebSocket Connection

Clients connect to: `ws://your-server/ws`

Authentication message format:
```json
{
  "type": "auth",
  "token": "generated_hardware_token",
  "processor": "Intel Core i7",
  "platform": "Windows 10",
  "hardware_id": "unique_machine_id",
  "client_version": "1.0.0"
}
```

### Sending Print Jobs

HTTP API endpoint:
```bash
POST /api/print-client/send-job
```

Request body:
```json
{
  "printer_id": "printer_token",
  "job_type": "envelope",
  "command": "print",
  "data": {
    "order_id": "12345",
    "recipient": "John Doe",
    "address": "123 Main St"
  }
}
```

### Getting Metrics

```bash
GET /api/print-client/metrics
```

Response:
```json
{
  "status": "success",
  "metrics": {
    "active_connections": 10,
    "total_connections": 150,
    "messages_processed": 5000,
    "authentication_errors": 2,
    "connection_errors": 1
  }
}
```

### Listing Connected Printers

```bash
GET /api/print-client/connected-printers
```

## Configuration

Default configuration values:

- **Channel Buffer Size**: 100,000 messages
- **Worker Count**: 20 workers
- **Upstream Log Workers**: 5 workers
- **Metrics Reporting Interval**: 60 seconds
- **Authentication Timeout**: 5 seconds
- **Write Deadline**: 10 seconds
- **Undelivered Message Retention**: 5 minutes

## Client Message Types

### Ping (Keep-Alive)
```json
{
  "JobId": "",
  "Event": "ping",
  "Message": ""
}
```

### Job Status Update
```json
{
  "JobId": "job_123",
  "Event": "job-started|job-completed|job-failed",
  "Message": "Job status message"
}
```

## Upstream Events

The following events are logged to the upstream channel:

- `printer-connected`: Client connects
- `printer-disconnected`: Client disconnects
- `job-started`: Print job initiated
- `job-completed`: Print job finished successfully
- `job-failed`: Print job encountered an error

## Differences from cloud-print-server

1. **No RabbitMQ Dependency**: Uses native Go channels
2. **Integrated into main application**: Part of print-envelope-go service
3. **No external JWT validation**: Hardware-based authentication only
4. **Simplified deployment**: Single binary, no separate RabbitMQ setup
5. **Direct database integration**: Can log directly to application database

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/ws` | WebSocket connection | Hardware token |
| GET | `/api/print-client/metrics` | Get service metrics | No |
| POST | `/api/print-client/send-job` | Send print job | Operator+ |
| GET | `/api/print-client/connected-printers` | List printers | Operator+ |
| DELETE | `/api/print-client/disconnect/:printer_id` | Disconnect printer | Admin |

## Performance

- **Concurrent Connections**: Supports thousands of simultaneous WebSocket connections
- **Message Throughput**: High throughput with buffered channels (100K buffer)
- **Worker Pool**: Scalable worker pool for message processing
- **Memory Efficient**: Automatic cleanup of old undelivered messages

## Monitoring

The service provides comprehensive metrics:

1. **Connection Metrics**: Active and total connections
2. **Processing Metrics**: Messages processed count
3. **Error Metrics**: Authentication and connection errors
4. **Periodic Reports**: Formatted logs every 60 seconds

## Future Enhancements

Potential improvements:

- [ ] Database persistence for upstream logs
- [ ] Client heartbeat monitoring
- [ ] Reconnection retry logic
- [ ] Load balancing across multiple instances
- [ ] Client capability negotiation
- [ ] Job queue prioritization
- [ ] Webhook notifications for job events

## Troubleshooting

### Client Can't Connect
- Check hardware token generation
- Verify authentication timeout (5 seconds)
- Check firewall/proxy WebSocket support

### Messages Not Delivered
- Check printer connection status
- Review undelivered message queue
- Verify printer ID in subscription

### High Memory Usage
- Check undelivered message retention
- Review channel buffer sizes
- Monitor connection count

## License

This module is part of the print-envelope-go project.
