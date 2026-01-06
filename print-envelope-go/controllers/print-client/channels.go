package printclient

import (
	"log"
	"printenvelope/types"
	"sync"
	"time"
)

// Channel-based messaging service to replace RabbitMQ
// Uses Go channels for inter-service communication

// Shared channels for inter-service communication
var (
	// Storage for undelivered messages
	unDeliveredMessages sync.Map

	// Channels for message passing (replacing RabbitMQ queues)
	undeliveredChan      = make(chan UndeliveredMsg, 10000) // Buffer for undelivered messages
	subscribeChan        = make(chan *Subscription, 10000)  // Subscription requests
	unsubscribeChan      = make(chan Unsubscription, 10000) // Unsubscribe requests
	broadcastChan        = make(chan BroadcastMsg, 10000)   // Broadcast messages
	internalMsgChan      = make(chan ChannelMsg, 10000)     // Internal messages (replaces RabbitMQ)
	upstreamLogsChan     = make(chan UpstreamMsg, 10000)    // Upstream log messages
	printJobChan         = make(chan types.PrintJob, 10000) // Print job queue
	channelSubscriptions sync.Map                           // Map to store channel subscriptions
)

// ChannelService manages channel-based messaging
type ChannelService struct {
	workerCount int
	stopChan    chan struct{}
	wg          sync.WaitGroup
}

// NewChannelService creates a new channel service
func NewChannelService(workerCount int) *ChannelService {
	if workerCount <= 0 {
		workerCount = 20 // Default worker count
	}

	return &ChannelService{
		workerCount: workerCount,
		stopChan:    make(chan struct{}),
	}
}

// Start begins the channel service with worker pool
func (cs *ChannelService) Start() {
	log.Printf("Starting Channel Service with %d workers", cs.workerCount)

	// Start channel workers
	for i := 0; i < cs.workerCount; i++ {
		cs.wg.Add(1)
		go cs.channelWorker(i)
	}

	// Start undelivered message cleanup
	cs.wg.Add(1)
	go cs.cleanUndeliveredMessages()

	log.Println("✅ Channel Service started successfully")
}

// Stop gracefully shuts down the channel service
func (cs *ChannelService) Stop() {
	log.Println("🔄 Shutting down Channel Service...")
	close(cs.stopChan)
	cs.wg.Wait()
	log.Println("✅ Channel Service stopped")
}

// channelWorker processes messages from various channels
func (cs *ChannelService) channelWorker(workerID int) {
	defer cs.wg.Done()
	log.Printf("Channel worker %d started", workerID)

	for {
		select {
		case sub := <-subscribeChan:
			cs.processSubscription(sub)

		case unsub := <-unsubscribeChan:
			cs.processUnsubscription(unsub)

		case broadcast := <-broadcastChan:
			cs.processBroadcast(broadcast)

		case internalMsg := <-internalMsgChan:
			// Convert internal message to broadcast
			broadcast := BroadcastMsg{
				Channel:  internalMsg.Channel,
				UserUUID: internalMsg.UserUUID,
				Message:  internalMsg.Message,
			}
			cs.processBroadcast(broadcast)

		case undelivered := <-undeliveredChan:
			cs.storeUndeliveredMessage(undelivered)

		case <-cs.stopChan:
			log.Printf("Channel worker %d stopping", workerID)
			return
		}
	}
}

// processSubscription handles new subscriptions
func (cs *ChannelService) processSubscription(sub *Subscription) {
	subscriptionKey := sub.ChannelName + sub.UserUUID
	channelSubscriptions.Store(subscriptionKey, sub)
	log.Printf("User %s subscribed to channel: %s", sub.UserUUID, sub.ChannelName)
}

// processUnsubscription handles unsubscription requests
func (cs *ChannelService) processUnsubscription(unsub Unsubscription) {
	subscriptionKey := unsub.ChannelName + unsub.UserUUID

	if value, ok := channelSubscriptions.Load(subscriptionKey); ok {
		if _, ok := value.(*Subscription); ok {
			channelSubscriptions.Delete(subscriptionKey)
			log.Printf("User %s unsubscribed from channel: %s", unsub.UserUUID, unsub.ChannelName)
		} else {
			log.Printf("Unexpected type for channelSubscriptions[%s]", subscriptionKey)
		}
	} else {
		log.Printf("No subscriptions found: %s", subscriptionKey)
	}
}

// processBroadcast sends messages to subscribed clients
func (cs *ChannelService) processBroadcast(broadcast BroadcastMsg) {
	subscriptionKey := broadcast.Channel + broadcast.UserUUID
	log.Printf("🔔 Processing broadcast for key: %s, message: %s", subscriptionKey, broadcast.Message)

	value, ok := channelSubscriptions.Load(subscriptionKey)
	if !ok {
		log.Printf("❌ No subscriptions found for: %s", subscriptionKey)
		undeliveredChan <- UndeliveredMsg{
			UserUUID:  broadcast.UserUUID,
			Message:   broadcast.Message,
			Timestamp: time.Now(),
			Delivered: false,
		}
		return
	}

	sub, ok := value.(*Subscription)
	if !ok {
		log.Printf("❌ Unexpected type for channelSubscriptions[%s]", subscriptionKey)
		return
	}

	// Check if the channel is closed
	sub.Mutex.Lock()
	if sub.Closed {
		log.Printf("Attempt to send to a closed channel for user %s", sub.UserUUID)
		sub.Mutex.Unlock()
		return
	}
	sub.Mutex.Unlock()

	// Attempt to send message with timeout
	select {
	case sub.MessageChan <- []byte(broadcast.Message):
		log.Printf("🚀 Message sent successfully to printer %s: %s", sub.UserUUID, broadcast.Message)
	case <-time.After(100 * time.Millisecond):
		log.Printf("⚠️ Message channel for user %s is full or slow, queuing as undelivered", sub.UserUUID)
		undeliveredChan <- UndeliveredMsg{
			UserUUID:  broadcast.UserUUID,
			Message:   broadcast.Message,
			Timestamp: time.Now(),
			Delivered: false,
		}
	}
}

// storeUndeliveredMessage stores messages that couldn't be delivered
func (cs *ChannelService) storeUndeliveredMessage(undeliveredMsg UndeliveredMsg) {
	// Load existing messages for the user
	value, _ := unDeliveredMessages.LoadOrStore(undeliveredMsg.UserUUID, []UndeliveredMsg{})

	// Append the new message to the list
	messages, ok := value.([]UndeliveredMsg)
	if !ok {
		messages = []UndeliveredMsg{}
	}
	messages = append(messages, undeliveredMsg)

	// Store the updated list back into the sync.Map
	unDeliveredMessages.Store(undeliveredMsg.UserUUID, messages)
}

// cleanUndeliveredMessages periodically cleans up old undelivered messages
func (cs *ChannelService) cleanUndeliveredMessages() {
	defer cs.wg.Done()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			unDeliveredMessages.Range(func(key, value interface{}) bool {
				if messages, ok := value.([]UndeliveredMsg); ok {
					var activeMessages []UndeliveredMsg
					for _, msg := range messages {
						// Keep messages that are less than 5 minutes old and not delivered
						if time.Since(msg.Timestamp) <= 5*time.Minute && !msg.Delivered {
							activeMessages = append(activeMessages, msg)
						}
					}

					if len(activeMessages) > 0 {
						unDeliveredMessages.Store(key, activeMessages)
					} else {
						unDeliveredMessages.Delete(key)
					}
				}
				return true
			})
		case <-cs.stopChan:
			log.Println("Undelivered message cleanup stopping")
			return
		}
	}
}

// PushNotification pushes a notification to a specific channel and user
func PushNotification(channel, userUUID, message string) {
	broadcastChan <- BroadcastMsg{
		Channel:  channel,
		UserUUID: userUUID,
		Message:  message,
	}
}

// PublishPrintJob publishes a print job to the job channel
func PublishPrintJob(job types.PrintJob) {
	printJobChan <- job
}

// ProcessUndeliveredMessages processes undelivered messages for a user
func ProcessUndeliveredMessages(userUUID string, messageChan chan []byte) {
	value, ok := unDeliveredMessages.Load(userUUID)
	if !ok {
		return
	}

	messages, ok := value.([]UndeliveredMsg)
	if !ok {
		return
	}

	var remainingMessages []UndeliveredMsg
	for _, msg := range messages {
		if !msg.Delivered {
			select {
			case messageChan <- []byte(msg.Message):
				log.Printf("Delivered undelivered message to user %s", userUUID)
				msg.Delivered = true
			default:
				log.Printf("Failed to deliver undelivered message to user %s: channel full", userUUID)
				remainingMessages = append(remainingMessages, msg)
			}
		}
	}

	if len(remainingMessages) > 0 {
		unDeliveredMessages.Store(userUUID, remainingMessages)
	} else {
		unDeliveredMessages.Delete(userUUID)
	}
}

// GetUpstreamLogsChannel returns the upstream logs channel for external use
func GetUpstreamLogsChannel() chan UpstreamMsg {
	return upstreamLogsChan
}

// GetPrintJobChannel returns the print job channel for external use
func GetPrintJobChannel() chan types.PrintJob {
	return printJobChan
}
