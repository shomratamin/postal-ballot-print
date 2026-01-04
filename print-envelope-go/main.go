package main

import (
	"fmt"
	"os"
	"printenvelope/database"
	"printenvelope/logger"
	"printenvelope/middleware"
	"printenvelope/routes"
	"printenvelope/services"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	app := fiber.New(fiber.Config{
		ReadBufferSize:  32768, // 32KB read buffer
		WriteBufferSize: 32768, // 32KB write buffer
		ReadTimeout:     time.Second * 30,
		WriteTimeout:    time.Second * 30,
		BodyLimit:       50 * 1024 * 1024, // 50MB body limit
	})

	env := godotenv.Load()
	if env != nil {
		logger.Error("Error loading .env file", env)
		fmt.Println("Error loading .env file", env)
	}

	// Use your custom logger to print a success message.
	logger.Success("Server is running on ip: " + os.Getenv("APP_HOST") + " port: " + os.Getenv("APP_PORT") +
		"\n\t\t\t\t\t\t******************************************************************************************\n")

	// Initialize database with new consolidated db.go
	db, err := database.InitDB()
	if err != nil {
		logger.Error("Failed to connect to the database", err)
		return
	}

	// Initialize the async logger with the database connection
	// go logger.AsyncLogger(db)

	app.Use(middleware.CORS())

	// Serve static files from uploads directory
	app.Static("/uploads", "./uploads")

	// Use new consolidated routes
	routes.SetupRoutes(app, db)

	// Initialize Kafka consumer service
	kafkaBrokers := []string{os.Getenv("KAFKA_BROKERS")} // e.g., "localhost:9092"
	if kafkaBrokers[0] == "" {
		kafkaBrokers = []string{"localhost:9092"} // default fallback
	}
	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	if kafkaTopic == "" {
		kafkaTopic = "ballot_orders" // default fallback
	}

	consumerService := services.NewConsumerService(db, kafkaBrokers, kafkaTopic)
	if err := consumerService.Start(); err != nil {
		logger.Error("Failed to start consumer service", err)
		fmt.Printf("Failed to start consumer service: %s\n", err.Error())
	} else {
		logger.Success("Kafka consumer service started successfully")
	}

	// Start Fiber server in a goroutine
	go func() {
		app_host := os.Getenv("APP_HOST")
		if app_host == "" {
			app_host = "0.0.0.0"
		}
		app_port := os.Getenv("APP_PORT")
		if app_port == "" {
			app_port = "8056"
		}
		if err := app.Listen(app_host + ":" + app_port); err != nil {
			logger.Error("Failed to start Fiber server", err)
		}
	}()

	// Wait for consumer service to complete (blocks until shutdown signal)
	consumerService.Wait()

	// Graceful shutdown
	if err := consumerService.Shutdown(); err != nil {
		logger.Error("Error during consumer shutdown", err)
	}
	if err := app.Shutdown(); err != nil {
		logger.Error("Error during Fiber server shutdown", err)
	}

	// Additional application code can follow...
}
