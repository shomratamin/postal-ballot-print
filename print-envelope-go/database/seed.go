package database

import (
	"printenvelope/logger"
	"printenvelope/models/user"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedData seeds the database with initial data
func SeedData(db *gorm.DB) error {
	logger.Success("🌱 Starting database seeding...")

	// Seed Super Admin user
	if err := SeedSuperAdmin(db); err != nil {
		return err
	}

	logger.Success("✅ Database seeding completed successfully")
	return nil
}

// SeedSuperAdmin creates the default Super Admin user
func SeedSuperAdmin(db *gorm.DB) error {
	// Check if super admin already exists
	var existingUser user.User
	err := db.Where("username = ?", "super-admin").First(&existingUser).Error
	if err == nil {
		logger.Debug("Super Admin already exists, skipping...")
		return nil
	}
	if err != gorm.ErrRecordNotFound {
		logger.Error("Error checking for existing super admin", err)
		return err
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Qwer1234"), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password for super admin", err)
		return err
	}

	// Create phone number
	phone := "+8801700000000"
	now := time.Now()

	// Create Super Admin user
	superAdmin := user.User{
		Uuid:               uuid.New().String(),
		Username:           "super-admin",
		LegalName:          "Super Administrator",
		Phone:              &phone,
		PhoneVerified:      true,
		Password:           string(hashedPassword),
		CurrentRole:        user.SUPER_ADMIN,
		CurrentPermissions: []user.UserPermission{user.FULL_PERMIT},
		JoinedAt:           &now,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if err := db.Create(&superAdmin).Error; err != nil {
		logger.Error("Failed to create super admin user", err)
		return err
	}

	logger.Success("✅ Super Admin user created successfully (username: super-admin, phone: 01700000000)")
	return nil
}

// Helper functions for creating pointers
func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

func timePtr(t time.Time) *time.Time {
	return &t
}
