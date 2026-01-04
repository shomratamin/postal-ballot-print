package services

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	logModel "printenvelope/models/log"
	"printenvelope/models/order"

	"github.com/IBM/sarama"
	"gorm.io/gorm"
)

type ConsumerService struct {
	db                *gorm.DB
	brokers           []string
	topic             string
	consumer          sarama.Consumer
	partitionConsumer sarama.PartitionConsumer
	orderCount        int
	sigChan           chan os.Signal
	doneChan          chan struct{}
}

// NewConsumerService creates a new consumer service instance
func NewConsumerService(db *gorm.DB, brokers []string, topic string) *ConsumerService {
	return &ConsumerService{
		db:       db,
		brokers:  brokers,
		topic:    topic,
		sigChan:  make(chan os.Signal, 1),
		doneChan: make(chan struct{}),
	}
}

// ConnectConsumer establishes a connection to Kafka
func (cs *ConsumerService) ConnectConsumer() error {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true

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

	// Parse the JSON message
	var orderMsg OrderMessage
	if err := json.Unmarshal(msg.Value, &orderMsg); err != nil {
		log.Printf("Error unmarshaling message: %s\n", err.Error())
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

	// Check if address with same PhoneNo already exists (invalid - duplicate customer)
	var existingAddress order.Address
	if err := cs.db.Where("phone_no = ?", orderMsg.Address.PhoneNo).First(&existingAddress).Error; err == nil {
		log.Printf("Address with phone_no %s already exists (ID: %d), invalid duplicate order\n", orderMsg.Address.PhoneNo, existingAddress.ID)
		cs.db.Model(&kafkaLog).Updates(map[string]interface{}{
			"status": "duplicate_phone_number",
			"error":  fmt.Sprintf("address with phone_no %s already exists", orderMsg.Address.PhoneNo),
		})
		return
	}

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
