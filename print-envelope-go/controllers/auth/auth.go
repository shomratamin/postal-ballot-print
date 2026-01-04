package auth

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"printenvelope/logger"
	"printenvelope/middleware"
	logModel "printenvelope/models/log"
	"printenvelope/models/user"
	"printenvelope/types"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthController struct {
	db             *gorm.DB
	loggerInstance *logger.AsyncLogger
}

func NewAuthController(db *gorm.DB, async_logger *logger.AsyncLogger) *AuthController {
	return &AuthController{db: db, loggerInstance: async_logger}
}

// Helper function to set secure cookies based on environment
func (h *AuthController) setSecureCookie(c *fiber.Ctx, name, value string, maxAge int) {
	isProduction := os.Getenv("APP_ENV") == "production"

	c.Cookie(&fiber.Cookie{
		Name:     name,
		Value:    value,
		HTTPOnly: false,
		Secure:   isProduction, // Only secure in production (HTTPS)
		SameSite: "Strict",
		MaxAge:   maxAge,
		Path:     "/",
	})
}

func (h *AuthController) RegisterAdmin(c *fiber.Ctx) error {
	// Parse form data for file upload
	_, err := c.MultipartForm()
	if err != nil {
		logger.Error("Error parsing multipart form", err)
		response := types.ErrorResponse{
			Message: fmt.Sprintf("Error parsing form data: %v", err),
			Status:  fiber.StatusBadRequest,
		}
		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Extract form values
	phoneNumber := c.FormValue("phone_number")
	password := c.FormValue("password")
	username := c.FormValue("username")
	email := c.FormValue("email")

	// Create clean JSON request body for logging (mask password)
	formDataLog := map[string]interface{}{
		"phone_number": phoneNumber,
		"password":     "*******",
		"username":     username,
		"email":        email,
		"avatar":       "file_uploaded",
	}
	cleanRequestBody, _ := json.Marshal(formDataLog)

	// Create and save initial log entry with request details
	requestLog := logModel.Log{
		Method:         c.Method(),
		URL:            c.OriginalURL(),
		RequestBody:    string(cleanRequestBody),
		RequestHeaders: string(c.Request().Header.Header()),
	}

	// Save initial log entry to database
	if err := h.db.Create(&requestLog).Error; err != nil {
		logger.Error("Failed to create request log", err)
		// Continue processing even if log fails
	}

	// Validate phone number length
	if len(phoneNumber) != 14 {
		logger.Error("Phone number must be 14 characters long with Bangladeshi Country Code (+880)", nil)
		response := types.ErrorResponse{
			Message: "Phone number must be 14 characters long with Bangladeshi Country Code (+880)",
			Status:  fiber.StatusBadRequest,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Validate email format if provided
	var emailPtr *string
	if email != "" {
		// Basic email validation
		if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
			logger.Error("Invalid email format", nil)
			response := types.ErrorResponse{
				Message: "Invalid email format",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}
		emailPtr = &email
	}

	// Check if user with phone number already exists
	var existingUser user.User
	if err := h.db.Where("phone = ?", phoneNumber).First(&existingUser).Error; err == nil {
		logger.Error("User with this phone number already exists", nil)
		response := types.ErrorResponse{
			Message: "User with this phone number already exists",
			Status:  fiber.StatusConflict,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusConflict,
		})

		return c.Status(fiber.StatusConflict).JSON(response)
	}

	// Check if user with username already exists
	if err := h.db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		logger.Error("User with this username already exists", nil)
		response := types.ErrorResponse{
			Message: "User with this username already exists",
			Status:  fiber.StatusConflict,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusConflict,
		})

		return c.Status(fiber.StatusConflict).JSON(response)
	}

	req := types.RegisterUserRequest{
		PhoneNumber: phoneNumber,
		Password:    password,
		Username:    username,
		Email:       emailPtr,
	}

	// Validate request
	if validationErr := req.Validate(); validationErr != "" {
		logger.Error(validationErr, nil)
		response := types.ErrorResponse{
			Message: validationErr,
			Status:  fiber.StatusBadRequest,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", err)
		response := types.ErrorResponse{
			Message: "Failed to process password",
			Status:  fiber.StatusInternalServerError,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusInternalServerError,
		})

		return c.Status(fiber.StatusInternalServerError).JSON(response)
	}

	// Generate proper UUID for the user
	uuidStr := uuid.New().String()
	userUUID := uuidStr

	// Handle avatar file upload
	var avatarPath string
	file, err := c.FormFile("avatar")
	if err == nil && file != nil {
		// Create organized upload directory structure: uploads/avatars/admins/date/
		currentDate := time.Now().Format("2006-01-02") // YYYY-MM-DD format
		uploadDir := fmt.Sprintf("uploads/avatars/admins/%s", currentDate)
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Error("Failed to create avatar upload directory", err)
			response := types.ErrorResponse{
				Message: "Failed to create upload directory",
				Status:  fiber.StatusInternalServerError,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusInternalServerError,
			})

			return c.Status(fiber.StatusInternalServerError).JSON(response)
		}

		// Validate file type (basic image validation)
		fileExt := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
		validExt := false
		for _, ext := range allowedExts {
			if fileExt == ext {
				validExt = true
				break
			}
		}
		if !validExt {
			response := types.ErrorResponse{
				Message: "Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP are allowed",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}

		// Validate file size (limit to 10MB)
		if file.Size > 10*1024*1024 {
			response := types.ErrorResponse{
				Message: "File size too large. Maximum size is 10MB",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}

		// Generate unique filename with timestamp
		timestamp := time.Now().Format("150405") // HHMMSS format
		safeFilename := strings.ReplaceAll(file.Filename, " ", "_")
		// Remove any potentially dangerous characters
		safeFilename = strings.ReplaceAll(safeFilename, "..", "_")
		filename := fmt.Sprintf("%s_%s_%s", userUUID, timestamp, safeFilename)
		avatarPath = fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save the avatar file
		if err := c.SaveFile(file, avatarPath); err != nil {
			logger.Error("Failed to save avatar file", err)
			response := types.ErrorResponse{
				Message: "Failed to save avatar file",
				Status:  fiber.StatusInternalServerError,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusInternalServerError,
			})

			return c.Status(fiber.StatusInternalServerError).JSON(response)
		}
		logger.Success("Avatar file saved: " + avatarPath)
	}

	// Create new user
	newUser := user.User{
		Uuid:               userUUID,
		Username:           username,
		Phone:              &phoneNumber,
		Email:              emailPtr,
		PhoneVerified:      false,
		EmailVerified:      false,
		LegalName:          "",         // Can be updated later
		Avatar:             avatarPath, // Path to uploaded avatar or empty string
		Password:           string(hashedPassword),
		Nonce:              0,
		CurrentRole:        user.ADMIN,                         // Staff gets ADMIN role
		CurrentPermissions: user.StringSlice{user.FULL_PERMIT}, // Full permissions for staff
	}

	// Create user in database transaction
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		// Create user
		if err := tx.Create(&newUser).Error; err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		return nil
	}); err != nil {
		logger.Error("Failed to create user in database", err)
		response := types.ErrorResponse{
			Message: "Failed to create user",
			Status:  fiber.StatusInternalServerError,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusInternalServerError,
		})

		return c.Status(fiber.StatusInternalServerError).JSON(response)
	}

	logger.Success("User created successfully. UUID: " + newUser.Uuid)

	// Return success response
	response := types.ApiResponse{
		Message: "User registered successfully",
		Status:  fiber.StatusCreated,
		Data: map[string]interface{}{
			"user_id":    newUser.ID,
			"uuid":       newUser.Uuid,
			"username":   newUser.Username,
			"avatar_url": avatarPath,
		},
	}

	// Marshal response to JSON for logging
	responseBody, _ := json.Marshal(response)

	// Update log with success response
	h.db.Model(&requestLog).Updates(map[string]interface{}{
		"response_body":    string(responseBody),
		"response_headers": string(c.Response().Header.Header()),
		"status_code":      fiber.StatusCreated,
	})

	return c.Status(fiber.StatusCreated).JSON(response)
}

func (h *AuthController) RegisterOperator(c *fiber.Ctx) error {
	// Parse form data for file upload
	_, err := c.MultipartForm()
	if err != nil {
		logger.Error("Error parsing multipart form", err)
		response := types.ErrorResponse{
			Message: fmt.Sprintf("Error parsing form data: %v", err),
			Status:  fiber.StatusBadRequest,
		}
		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Extract form values
	phoneNumber := c.FormValue("phone_number")
	password := c.FormValue("password")
	username := c.FormValue("username")
	email := c.FormValue("email")

	// Create clean JSON request body for logging (mask password)
	formDataLog := map[string]interface{}{
		"phone_number": phoneNumber,
		"password":     "*******",
		"username":     username,
		"email":        email,
		"avatar":       "file_uploaded",
	}
	cleanRequestBody, _ := json.Marshal(formDataLog)

	// Create and save initial log entry with request details
	requestLog := logModel.Log{
		Method:         c.Method(),
		URL:            c.OriginalURL(),
		RequestBody:    string(cleanRequestBody),
		RequestHeaders: string(c.Request().Header.Header()),
	}

	// Save initial log entry to database
	if err := h.db.Create(&requestLog).Error; err != nil {
		logger.Error("Failed to create request log", err)
		// Continue processing even if log fails
	}

	// Validate phone number length
	if len(phoneNumber) != 14 {
		logger.Error("Phone number must be 14 characters long with Bangladeshi Country Code (+880)", nil)
		response := types.ErrorResponse{
			Message: "Phone number must be 14 characters long with Bangladeshi Country Code (+880)",
			Status:  fiber.StatusBadRequest,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Validate email format if provided
	var emailPtr *string
	if email != "" {
		// Basic email validation
		if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
			logger.Error("Invalid email format", nil)
			response := types.ErrorResponse{
				Message: "Invalid email format",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}
		emailPtr = &email
	}

	// Check if user with phone number already exists
	var existingUser user.User
	if err := h.db.Where("phone = ?", phoneNumber).First(&existingUser).Error; err == nil {
		logger.Error("User with this phone number already exists", nil)
		response := types.ErrorResponse{
			Message: "User with this phone number already exists",
			Status:  fiber.StatusConflict,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusConflict,
		})

		return c.Status(fiber.StatusConflict).JSON(response)
	}

	// Check if user with username already exists
	if err := h.db.Where("username = ?", username).First(&existingUser).Error; err == nil {
		logger.Error("User with this username already exists", nil)
		response := types.ErrorResponse{
			Message: "User with this username already exists",
			Status:  fiber.StatusConflict,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusConflict,
		})

		return c.Status(fiber.StatusConflict).JSON(response)
	}

	req := types.RegisterUserRequest{
		PhoneNumber: phoneNumber,
		Password:    password,
		Username:    username,
		Email:       emailPtr,
	}

	// Validate request
	if validationErr := req.Validate(); validationErr != "" {
		logger.Error(validationErr, nil)
		response := types.ErrorResponse{
			Message: validationErr,
			Status:  fiber.StatusBadRequest,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", err)
		response := types.ErrorResponse{
			Message: "Failed to process password",
			Status:  fiber.StatusInternalServerError,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusInternalServerError,
		})

		return c.Status(fiber.StatusInternalServerError).JSON(response)
	}

	// Generate proper UUID for the customer (shorter format)
	uuidStr := uuid.New().String()
	userUUID := uuidStr // Use first 8 characters for shorter UUID

	// Handle avatar file upload
	var avatarPath string
	file, err := c.FormFile("avatar")
	if err == nil && file != nil {
		// Create organized upload directory structure: uploads/avatars/customers/date/
		currentDate := time.Now().Format("2006-01-02") // YYYY-MM-DD format
		uploadDir := fmt.Sprintf("uploads/avatars/customers/%s", currentDate)
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			logger.Error("Failed to create avatar upload directory", err)
			response := types.ErrorResponse{
				Message: "Failed to create upload directory",
				Status:  fiber.StatusInternalServerError,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusInternalServerError,
			})

			return c.Status(fiber.StatusInternalServerError).JSON(response)
		}

		// Validate file type (basic image validation)
		fileExt := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
		validExt := false
		for _, ext := range allowedExts {
			if fileExt == ext {
				validExt = true
				break
			}
		}
		if !validExt {
			response := types.ErrorResponse{
				Message: "Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP are allowed",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}

		// Validate file size (limit to 10MB)
		if file.Size > 10*1024*1024 {
			response := types.ErrorResponse{
				Message: "File size too large. Maximum size is 10MB",
				Status:  fiber.StatusBadRequest,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusBadRequest,
			})

			return c.Status(fiber.StatusBadRequest).JSON(response)
		}

		// Generate unique filename with timestamp
		timestamp := time.Now().Format("150405") // HHMMSS format
		safeFilename := strings.ReplaceAll(file.Filename, " ", "_")
		// Remove any potentially dangerous characters
		safeFilename = strings.ReplaceAll(safeFilename, "..", "_")
		filename := fmt.Sprintf("%s_%s_%s", userUUID, timestamp, safeFilename)
		avatarPath = fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save the avatar file
		if err := c.SaveFile(file, avatarPath); err != nil {
			logger.Error("Failed to save avatar file", err)
			response := types.ErrorResponse{
				Message: "Failed to save avatar file",
				Status:  fiber.StatusInternalServerError,
			}

			// Update log with error response
			responseBody, _ := json.Marshal(response)
			h.db.Model(&requestLog).Updates(map[string]interface{}{
				"response_body":    string(responseBody),
				"response_headers": string(c.Response().Header.Header()),
				"status_code":      fiber.StatusInternalServerError,
			})

			return c.Status(fiber.StatusInternalServerError).JSON(response)
		}
		logger.Success("Avatar file saved: " + avatarPath)
	}

	// Create new operator user
	newUser := user.User{
		Uuid:               userUUID,
		Username:           username,
		Phone:              &phoneNumber,
		Email:              emailPtr,
		PhoneVerified:      false,
		EmailVerified:      false,
		LegalName:          "",         // Can be updated later
		Avatar:             avatarPath, // Path to uploaded avatar or empty string
		Password:           string(hashedPassword),
		Nonce:              0,
		CurrentRole:        user.OPERATOR,                      // Operator role
		CurrentPermissions: user.StringSlice{user.FULL_PERMIT}, // Full permissions as requested
	}

	// Create user in database transaction
	if err := h.db.Transaction(func(tx *gorm.DB) error {
		// Create user
		if err := tx.Create(&newUser).Error; err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}

		return nil
	}); err != nil {
		logger.Error("Failed to create customer in database", err)
		response := types.ErrorResponse{
			Message: "Failed to create customer",
			Status:  fiber.StatusInternalServerError,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusInternalServerError,
		})

		return c.Status(fiber.StatusInternalServerError).JSON(response)
	}

	logger.Success("Operator created successfully. UUID: " + newUser.Uuid)

	// Return success response
	response := types.ApiResponse{
		Message: "Operator registered successfully",
		Status:  fiber.StatusCreated,
		Data: map[string]interface{}{
			"user_id":    newUser.ID,
			"uuid":       newUser.Uuid,
			"username":   newUser.Username,
			"role":       newUser.CurrentRole,
			"avatar_url": avatarPath,
		},
	}

	// Marshal response to JSON for logging
	responseBody, _ := json.Marshal(response)

	// Update log with success response
	h.db.Model(&requestLog).Updates(map[string]interface{}{
		"response_body":    string(responseBody),
		"response_headers": string(c.Response().Header.Header()),
		"status_code":      fiber.StatusCreated,
	})

	return c.Status(fiber.StatusCreated).JSON(response)
}

// ---- Full Login ------------------------------------------------------------
func (h *AuthController) Login(c *fiber.Ctx) error {
	// Mask password in request body for logging
	var tempReq map[string]interface{}
	json.Unmarshal(c.Body(), &tempReq)
	if _, exists := tempReq["password"]; exists {
		tempReq["password"] = "*******"
	}
	maskedRequestBody, _ := json.Marshal(tempReq)

	// Create and save initial log entry with request details
	requestLog := logModel.Log{
		Method:         c.Method(),
		URL:            c.OriginalURL(),
		RequestBody:    string(maskedRequestBody),
		RequestHeaders: string(c.Request().Header.Header()),
	}

	// Save initial log entry to database
	if err := h.db.Create(&requestLog).Error; err != nil {
		logger.Error("Failed to create request log", err)
		// Continue processing even if log fails
	}

	// Parse and validate request
	var req types.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Error parsing request body", err)
		response := types.ApiResponse{
			Message: fmt.Sprintf("Error parsing request body: %v", err),
			Status:  fiber.StatusBadRequest,
			Data:    nil,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	if v := req.Validate(); v != "" {
		logger.Error(v, nil)
		response := types.ApiResponse{
			Message: v,
			Status:  fiber.StatusBadRequest,
			Data:    nil,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusBadRequest,
		})

		return c.Status(fiber.StatusBadRequest).JSON(response)
	}

	// Find user by phone number
	var foundUser user.User
	if err := h.db.Where("phone = ?", req.PhoneNumber).First(&foundUser).Error; err != nil {
		logger.Error("User not found", err)
		response := types.ApiResponse{
			Message: "Invalid credentials",
			Status:  fiber.StatusUnauthorized,
			Data:    nil,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusUnauthorized,
		})

		return c.Status(fiber.StatusUnauthorized).JSON(response)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(req.Password)); err != nil {
		logger.Error("Invalid password", err)
		response := types.ApiResponse{
			Message: "Invalid credentials",
			Status:  fiber.StatusUnauthorized,
			Data:    nil,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusUnauthorized,
		})

		return c.Status(fiber.StatusUnauthorized).JSON(response)
	}

	// Update user's nonce on successful login
	foundUser.Nonce++
	if err := h.db.Model(&foundUser).Update("nonce", foundUser.Nonce).Error; err != nil {
		logger.Error("Failed to update user nonce", err)
		// Continue with login even if nonce update fails
	}

	// Convert user permissions to string slice for JWT
	permissions := make([]string, len(foundUser.CurrentPermissions))
	for i, perm := range foundUser.CurrentPermissions {
		permissions[i] = string(perm)
	}

	// Generate JWT tokens
	accessToken, refreshToken, err := middleware.IssueTokens(foundUser.Uuid, string(foundUser.CurrentRole), *foundUser.Phone, foundUser.Username, permissions)
	if err != nil {
		logger.Error("Failed to generate tokens", err)
		response := types.ApiResponse{
			Message: "Failed to generate authentication tokens",
			Status:  fiber.StatusInternalServerError,
			Data:    nil,
		}

		// Update log with error response
		responseBody, _ := json.Marshal(response)
		h.db.Model(&requestLog).Updates(map[string]interface{}{
			"response_body":    string(responseBody),
			"response_headers": string(c.Response().Header.Header()),
			"status_code":      fiber.StatusInternalServerError,
		})

		return c.Status(fiber.StatusInternalServerError).JSON(response)
	}

	// Set secure cookies
	h.setSecureCookie(c, "access", accessToken, 8*60*60)      // 8 hours
	h.setSecureCookie(c, "refresh", refreshToken, 7*24*60*60) // 7 days

	// Prepare response data
	now := time.Now()
	loginResponse := types.LoginUserResponse{
		Status:  "success",
		Type:    "authentication",
		Message: "Login successful",
		Access:  accessToken,
		Refresh: refreshToken,
		Data: types.UserLoginData{
			TokenType:     "Bearer",
			Exp:           now.Add(8 * time.Hour).Unix(),
			Iat:           now.Unix(),
			Jti:           foundUser.Uuid,
			UUID:          foundUser.Uuid,
			Username:      foundUser.Username,
			UserRole:      string(foundUser.CurrentRole),
			LegalName:     &foundUser.LegalName,
			Phone:         *foundUser.Phone,
			PhoneVerified: foundUser.PhoneVerified,
			Email:         foundUser.Email,
			EmailVerified: foundUser.EmailVerified,
			Avatar:        foundUser.Avatar,
			Nonce:         foundUser.Nonce,
			Permissions:   permissions,
		},
	}

	// Marshal response to JSON for logging
	responseBody, _ := json.Marshal(loginResponse)

	// Update log with success response
	h.db.Model(&requestLog).Updates(map[string]interface{}{
		"response_body":    string(responseBody),
		"response_headers": string(c.Response().Header.Header()),
		"status_code":      fiber.StatusOK,
	})

	nowStr := time.Now().Format("2006-01-02 03:04:05 PM")
	logger.Success("User logged in successfully. uuid: " + foundUser.Uuid + " at " + nowStr)

	return c.Status(fiber.StatusOK).JSON(loginResponse)
}

func (h *AuthController) LogOut(c *fiber.Ctx) error {
	// Get the token from the Authorization header
	tokenStr := c.Get("Authorization")
	tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")

	// Clear the access and refresh cookies
	h.setSecureCookie(c, "access", "", -1)  // Expire immediately
	h.setSecureCookie(c, "refresh", "", -1) // Expire immediately

	response := types.ApiResponse{
		Message: "Logout successful",
		Status:  fiber.StatusOK,
		Data:    nil,
	}
	logger.Success("Logout successful")
	return c.Status(fiber.StatusOK).JSON(response)
}
