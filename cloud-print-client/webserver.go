package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// Response struct to structure the JSON response
type Response struct {
	Message string `json:"Message"`
	Status  string `json:"Status"`
}

// Fiber handler function for the root path
func handler(c *fiber.Ctx) error {
	// Handle CORS headers
	c.Set("Access-Control-Allow-Origin", "*")
	c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	c.Set("Access-Control-Allow-Credentials", "true")
	c.Set("Content-Type", "application/json")

	// Handle preflight requests
	if c.Method() == fiber.MethodOptions {
		return c.SendStatus(fiber.StatusOK)
	}

	// Route logic
	if c.Path() == "/get-machine-id" {
		response := Response{
			Message: appSettings.GetAppID(),
			Status:  "success",
		}
		return c.JSON(response)
	} else if c.Path() == "/get-weightdim-data" {
		data, err := weightdimensionMachineManager.GetWeightDimData()
		if err != nil {
			response := Response{
				Message: err.Error(),
				Status:  "error",
			}
			return c.JSON(response)
		}
		return c.JSON(data)
	}

	// Fallback for invalid routes
	response := Response{
		Message: "Invalid request",
		Status:  "error",
	}
	return c.JSON(response)
}

// InitWebServer initializes and starts the Fiber web server
func InitWebServer() {
	// Create a new Fiber app
	app := fiber.New()

	// Define routes
	app.All("*", handler) // Handle all paths with the single handler

	// Start the server
	port := ":30880"
	log.Printf("Server is running on port %s...\n", port)
	if err := app.Listen(port); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
