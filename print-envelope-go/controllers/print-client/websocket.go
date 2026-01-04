package printclient

import (
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gofiber/websocket/v2"
)

// ConnectWS handles WebSocket connections with authentication and message processing
func ConnectWS(c *websocket.Conn) {
	log.Println("New WebSocket connection - waiting for authentication")

	// Channel to notify that token was received
	tokenReceived := make(chan bool, 1)
	defer close(tokenReceived)

	// Timer to close connection if no token received within 5 seconds
	go func() {
		select {
		case <-time.After(5 * time.Second):
			log.Println("No token received within 5 seconds, closing connection")
			_ = c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Token not received"))
			c.Close()
			IncrementAuthErrors()
		case <-tokenReceived:
			log.Println("Token received within the allowed time")
		}
	}()

	// Read authentication message
	var sub Subscription
	_, message, err := c.ReadMessage()
	if err != nil {
		log.Println("Failed to read message:", err)
		c.Close()
		IncrementConnectionErrors()
		return
	}

	// Parse authentication message
	var authMessage AuthMessage
	if err := json.Unmarshal(message, &authMessage); err != nil {
		log.Println("Failed to parse authentication message:", err)
		c.Close()
		IncrementAuthErrors()
		return
	}

	tokenReceived <- true

	// Validate authentication
	var userUUID, channel string
	if authMessage.Type == "auth" {
		isValid, err := ValidateAuthToken(&authMessage)
		if err != nil {
			log.Println("Invalid authentication message:", err)
			c.Close()
			IncrementAuthErrors()
			return
		}

		if !isValid {
			log.Println("Authentication failed for client:", authMessage.Token)
			c.Close()
			IncrementAuthErrors()
			return
		}

		userUUID = authMessage.Token
		channel = "printer-channel"
		log.Println("Printer", userUUID, "authenticated successfully")
	}

	if channel == "" {
		log.Println("User does not have permission to subscribe to any channel")
		c.Close()
		return
	}

	if userUUID == "" {
		log.Println("No user UUID found in the token")
		c.Close()
		return
	}

	// Create message channel with buffer for high-throughput scenarios
	messageChan := make(chan []byte, 1000)

	sub = Subscription{
		ChannelName: channel,
		UserUUID:    userUUID,
		Conn:        c,
		MessageChan: messageChan,
		Closed:      false,
	}

	// Update metrics
	IncrementActiveConnections()

	// Start WebSocket write handler
	go handleWebSocketWrites(&sub)

	// Subscribe to channel
	subscribeChan <- &sub

	// Process any undelivered messages
	go ProcessUndeliveredMessages(userUUID, messageChan)

	// Send connection log
	if channel == "printer-channel" {
		log.Printf("Printer %s subscribed to channel: %s, client version: %s", userUUID, channel, authMessage.ClientVersion)

		// Send connection event upstream
		upstreamLogsChan <- UpstreamMsg{
			ID:            userUUID,
			Type:          "printer",
			Event:         "printer-connected",
			Message:       "Printer connected",
			ClientVersion: authMessage.ClientVersion,
		}
	}

	// Cleanup on disconnect
	defer func() {
		if channel == "printer-channel" {
			unsubscribeChan <- Unsubscription{ChannelName: channel, UserUUID: userUUID}
			upstreamLogsChan <- UpstreamMsg{
				ID:            userUUID,
				Type:          "printer",
				Event:         "printer-disconnected",
				Message:       "Printer disconnected",
				ClientVersion: authMessage.ClientVersion,
			}
		}

		closeConnection(&sub)
		log.Println("Printer disconnected:", userUUID)

		// Update metrics
		DecrementActiveConnections()
	}()

	// Main message processing loop
	for {
		_, message, err := c.ReadMessage()
		if err != nil {
			break
		}

		if channel == "printer-channel" {
			clientJob := ClientJob{}
			err = json.Unmarshal(message, &clientJob)
			if err != nil {
				log.Printf("Error parsing client job from user %s: %v", userUUID, err)
				continue
			}

			if strings.Compare(clientJob.Event, "ping") == 0 {
				log.Printf("🟢 Printer %s is alive, received ping", userUUID)
			} else {
				// Send job log upstream
				upstreamLogsChan <- UpstreamMsg{
					ID:      userUUID,
					Type:    "printer",
					Event:   clientJob.Event,
					JobID:   clientJob.JobID,
					Message: clientJob.Message,
				}
			}
		}

		// Update metrics
		IncrementMessagesProcessed()
	}
}

// handleWebSocketWrites manages outgoing WebSocket messages
func handleWebSocketWrites(sub *Subscription) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered in handleWebSocketWrites for user %s: %v", sub.UserUUID, r)
		}
	}()

	for {
		select {
		case message, ok := <-sub.MessageChan:
			if !ok {
				log.Printf("Message channel closed for user %s", sub.UserUUID)
				return
			}

			sub.Mutex.Lock()
			if sub.Closed {
				log.Printf("Connection closed for user %s, stopping writes", sub.UserUUID)
				sub.Mutex.Unlock()
				return
			}

			// Set write deadline for better reliability
			if err := sub.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second)); err != nil {
				log.Printf("Failed to set write deadline for user %s: %v", sub.UserUUID, err)
				sub.Mutex.Unlock()
				return
			}

			if err := sub.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Failed to write message to user %s: %v", sub.UserUUID, err)
				sub.Mutex.Unlock()
				return
			}
			sub.Mutex.Unlock()
		}
	}
}

// closeConnection safely closes a WebSocket connection
func closeConnection(sub *Subscription) {
	sub.Mutex.Lock()
	defer sub.Mutex.Unlock()

	if !sub.Closed {
		sub.Closed = true
		close(sub.MessageChan)
		sub.Conn.Close()
	}
}
