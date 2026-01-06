package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	logModel "printenvelope/models/log"
	"printenvelope/models/order"

	"github.com/IBM/sarama"
	"gorm.io/gorm"
)

type ConsumerService struct {
	db                *gorm.DB
	brokers           []string
	topic             string
	username          string
	password          string
	group             string
	consumer          sarama.Consumer
	partitionConsumer sarama.PartitionConsumer
	orderCount        int
	sigChan           chan os.Signal
	doneChan          chan struct{}
}

// NewConsumerService creates a new consumer service instance
func NewConsumerService(db *gorm.DB, brokers []string, topic, username, password, group string) *ConsumerService {
	return &ConsumerService{
		db:       db,
		brokers:  brokers,
		topic:    topic,
		username: username,
		password: password,
		group:    group,
		sigChan:  make(chan os.Signal, 1),
		doneChan: make(chan struct{}),
	}
}

// ConnectConsumer establishes a connection to Kafka
func (cs *ConsumerService) ConnectConsumer() error {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true

	// Increase timeouts for OCI Streams
	config.Net.DialTimeout = 30 * time.Second
	config.Net.ReadTimeout = 30 * time.Second
	config.Net.WriteTimeout = 30 * time.Second

	// Configure SASL authentication if credentials are provided
	if cs.username != "" && cs.password != "" {
		log.Printf("Connecting to Kafka with username: %s", cs.username)
		log.Printf("Broker: %v", cs.brokers)

		config.Net.SASL.Enable = true
		config.Net.SASL.User = cs.username
		config.Net.SASL.Password = cs.password
		config.Net.SASL.Mechanism = sarama.SASLTypePlaintext
		config.Net.SASL.Handshake = true

		// Enable TLS for SASL_SSL (required for OCI Streams)
		config.Net.TLS.Enable = true

		// IMPORTANT: Set SASL version to V1 for OCI Streams compatibility
		config.Net.SASL.Version = sarama.SASLHandshakeV1
	}

	// OCI Streams supports Kafka 2.3.1 or higher
	config.Version = sarama.V2_3_0_0

	// Enable verbose logging for debugging
	sarama.Logger = log.New(os.Stdout, "[Sarama] ", log.LstdFlags)

	consumer, err := sarama.NewConsumer(cs.brokers, config)
	if err != nil {
		return fmt.Errorf("failed to connect to consumer: %w", err)
	}
	cs.consumer = consumer
	return nil
}

// Start begins consuming messages from Kafka
func (cs *ConsumerService) Start() error {
	// Connect to consumer
	if err := cs.ConnectConsumer(); err != nil {
		return err
	}

	// Start partition consumer
	partitionConsumer, err := cs.consumer.ConsumePartition(cs.topic, 0, sarama.OffsetOldest)
	if err != nil {
		return fmt.Errorf("failed to start partition consumer: %w", err)
	}
	cs.partitionConsumer = partitionConsumer

	fmt.Printf("Consumer started for topic '%s', waiting for messages...\n", cs.topic)

	// Setup signal handling
	signal.Notify(cs.sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start consuming in a goroutine
	go cs.consumeMessages()

	return nil
}

// cleanJSONMessage removes literal newlines within string values and fixes common JSON issues
func cleanJSONMessage(data []byte) []byte {
	str := string(data)

	// Step 1: Remove literal newlines that appear within quoted strings
	result := ""
	inString := false
	escapeNext := false

	for i := 0; i < len(str); i++ {
		char := str[i]

		// Handle escape sequences
		if escapeNext {
			result += string(char)
			escapeNext = false
			continue
		}

		if char == '\\' {
			result += string(char)
			escapeNext = true
			continue
		}

		// Track if we're inside a string
		if char == '"' {
			inString = !inString
			result += string(char)
			continue
		}

		// Replace newlines and carriage returns inside strings with spaces
		if inString && (char == '\n' || char == '\r') {
			// Skip this character (remove it)
			continue
		}

		result += string(char)
	}

	// Step 2: Remove trailing commas before } or ]
	// Match pattern: comma followed by optional whitespace and then } or ]
	cleaned := ""
	inString = false
	escapeNext = false

	for i := 0; i < len(result); i++ {
		char := result[i]

		// Handle escape sequences
		if escapeNext {
			cleaned += string(char)
			escapeNext = false
			continue
		}

		if char == '\\' {
			cleaned += string(char)
			escapeNext = true
			continue
		}

		// Track if we're inside a string
		if char == '"' {
			inString = !inString
			cleaned += string(char)
			continue
		}

		// If we find a comma outside a string, check if it's a trailing comma
		if !inString && char == ',' {
			// Look ahead to see if there's only whitespace before } or ]
			j := i + 1
			for j < len(result) && (result[j] == ' ' || result[j] == '\t' || result[j] == '\n' || result[j] == '\r') {
				j++
			}

			// If the next non-whitespace character is } or ], skip this comma
			if j < len(result) && (result[j] == '}' || result[j] == ']') {
				// Skip the trailing comma
				continue
			}
		}

		cleaned += string(char)
	}

	return []byte(cleaned)
}

// consumeMessages handles the message consumption loop
func (cs *ConsumerService) consumeMessages() {
	for {
		select {
		case err := <-cs.partitionConsumer.Errors():
			log.Printf("Error consuming messages: %s\n", err.Error())
		case msg := <-cs.partitionConsumer.Messages():
			cs.processMessage(msg)
		case <-cs.sigChan:
			fmt.Println("Termination signal received, shutting down consumer...")
			cs.doneChan <- struct{}{}
			return
		}
	}
}

// OrderMessage represents the incoming message structure
type OrderMessage struct {
	Sequence         string                 `json:"sequence"`
	Address          order.Address          `json:"address"`
	ReturningAddress order.ReturningAddress `json:"returning_address"`
}

// processMessage processes individual Kafka messages
func (cs *ConsumerService) processMessage(msg *sarama.ConsumerMessage) {
	fmt.Printf("Received message: %s\n", string(msg.Value))
	cs.orderCount++

	// Save raw message immediately to database
	kafkaLog := logModel.KafkaMessageLog{
		Topic:     msg.Topic,
		Partition: msg.Partition,
		Offset:    msg.Offset,
		Key:       string(msg.Key),
		Value:     string(msg.Value),
		Timestamp: msg.Timestamp,
		Status:    "received",
	}

	if err := cs.db.Create(&kafkaLog).Error; err != nil {
		log.Printf("Error saving raw message to database: %s\n", err.Error())
		// Continue processing even if log fails
	}

	// Clean the JSON message (remove literal newlines and fix trailing commas)
	cleanedJSON := cleanJSONMessage(msg.Value)

	// Parse the JSON message
	var orderMsg OrderMessage
	if err := json.Unmarshal(cleanedJSON, &orderMsg); err != nil {
		log.Printf("Error unmarshaling message: %s\n", err.Error())
		log.Printf("Cleaned JSON was: %s\n", string(cleanedJSON))
		// Update kafka log with error
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "parse_failed",
			"error":  err.Error(),
		})
		return
	}

	// Validate message structure: sequence must exist and not be empty
	if orderMsg.Sequence == "" {
		log.Printf("Invalid message structure: missing or empty sequence field\n")
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "invalid_structure",
			"error":  "missing or empty sequence field",
		})
		return
	}

	// Parse sequence string to integer
	sequenceInt, err := strconv.Atoi(orderMsg.Sequence)
	if err != nil {
		log.Printf("Invalid sequence format: %s (must be numeric)\n", orderMsg.Sequence)
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "invalid_sequence_format",
			"error":  fmt.Sprintf("sequence must be numeric: %s", orderMsg.Sequence),
		})
		return
	}

	// Validate PhoneNo is not empty
	if orderMsg.Address.PhoneNo == "" {
		log.Printf("Invalid message structure: missing or empty phone_no field\n")
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "invalid_structure",
			"error":  "missing or empty phone_no field",
		})
		return
	}

	// Note: Duplicate phone numbers, QR codes, and names are allowed
	// Multiple orders can be sent to the same recipient

	// Check if order with same sequence already exists
	var existingOrder order.Order
	if err := cs.db.Where("sequence = ?", sequenceInt).First(&existingOrder).Error; err == nil {
		log.Printf("Order with sequence %d already exists (ID: %d), skipping\n", sequenceInt, existingOrder.ID)
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status":   "duplicate_sequence",
			"error":    fmt.Sprintf("order with sequence %d already exists", sequenceInt),
			"order_id": existingOrder.ID,
		})
		return
	}

	var savedOrderID uint

	// Save to database using a transaction
	err = cs.db.Transaction(func(tx *gorm.DB) error {
		// Check if returning address with same ZipCode exists, reuse if found
		var returningAddress order.ReturningAddress
		err := tx.Where("zip_code = ?", orderMsg.ReturningAddress.ZipCode).First(&returningAddress).Error
		if err != nil {
			// ReturningAddress doesn't exist, create new one
			if err := tx.Create(&orderMsg.ReturningAddress).Error; err != nil {
				return fmt.Errorf("failed to save returning address: %w", err)
			}
			returningAddress = orderMsg.ReturningAddress
		} else {
			// ReturningAddress exists, reuse it
			log.Printf("Reusing existing returning address with zip_code %s (ID: %d)\n", returningAddress.ZipCode, returningAddress.ID)
		}

		// Save the address (new address for each order)
		if err := tx.Create(&orderMsg.Address).Error; err != nil {
			return fmt.Errorf("failed to save address: %w", err)
		}

		// Create the order with foreign keys
		newOrder := order.Order{
			Sequence:           sequenceInt,
			AddressID:          orderMsg.Address.ID,
			ReturningAddressID: returningAddress.ID,
		}

		if err := tx.Create(&newOrder).Error; err != nil {
			return fmt.Errorf("failed to save order: %w", err)
		}

		savedOrderID = newOrder.ID

		// Update kafka log with order ID
		tx.Model(&kafkaLog).Update("order_id", newOrder.ID)

		// Log OrderReceived event
		receivedEvent := order.OrderEvent{
			OrderID: newOrder.ID,
			Status:  order.OrderReceived,
			Message: fmt.Sprintf("Order received from Kafka (Sequence: %s)", orderMsg.Sequence),
		}
		if err := tx.Create(&receivedEvent).Error; err != nil {
			return fmt.Errorf("failed to save OrderReceived event: %w", err)
		}

		// Log OrderSaved event
		savedEvent := order.OrderEvent{
			OrderID: newOrder.ID,
			Status:  order.OrderSaved,
			Message: fmt.Sprintf("Order saved successfully to database (Sequence: %s)", orderMsg.Sequence),
		}
		if err := tx.Create(&savedEvent).Error; err != nil {
			return fmt.Errorf("failed to save OrderSaved event: %w", err)
		}

		return nil
	})

	if err != nil {
		log.Printf("Error saving to database: %s\n", err.Error())

		// Update kafka log with error
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "processing_failed",
			"error":  err.Error(),
		})

		// Try to log failure event (outside transaction)
		if savedOrderID > 0 {
			failEvent := order.OrderEvent{
				OrderID: savedOrderID,
				Status:  order.OrderSaveFailed,
				Message: fmt.Sprintf("Failed to save order: %s", err.Error()),
			}
			cs.db.Create(&failEvent)
		}
		return
	}

	// Update kafka log status to processed
	cs.db.Model(&kafkaLog).Update("status", "processed")
	fmt.Printf("Order (Sequence: %s) processed and saved successfully.\n", orderMsg.Sequence)
}
func (cs *ConsumerService) Wait() {
	<-cs.doneChan
	fmt.Println("Total Ballot Orders Processed:", cs.orderCount)
}

// Shutdown gracefully shuts down the consumer service
func (cs *ConsumerService) Shutdown() error {
	if cs.partitionConsumer != nil {
		if err := cs.partitionConsumer.Close(); err != nil {
			log.Printf("Error closing partition consumer: %s\n", err.Error())
		}
	}

	if cs.consumer != nil {
		if err := cs.consumer.Close(); err != nil {
			return fmt.Errorf("error closing consumer: %w", err)
		}
	}

	return nil
}
