package middleware

import (
	"errors"
	"printenvelope/constants"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// HMAC secret key for JWT signing
const hmacSecretKey = "your-256-bit-secret-key-change-this-in-production-environment-12345" // 64+ chars for security

// Claim structure
type AuthUserClaims struct {
	UserID      string   `json:"uid"`
	UserRole    string   `json:"role"`
	Permissions []string `json:"perms"`
	Phone       string   `json:"phone,omitempty"`
	Username    string   `json:"username,omitempty"`
	jwt.RegisteredClaims
}

// ========= TOKEN CREATION ===========

func IssueTokens(userID string, userRole string, phone string, username string, perms []string) (string, string, error) {
	now := time.Now()

	accessClaims := AuthUserClaims{
		UserID:      userID,
		UserRole:    userRole,
		Phone:       phone,
		Username:    username,
		Permissions: perms,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(8 * time.Hour)),
			// Removed IssuedAt to save space
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessStr, err := accessToken.SignedString([]byte(hmacSecretKey))
	if err != nil {
		return "", "", err
	}

	refreshClaims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(now),
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshStr, err := refreshToken.SignedString([]byte(hmacSecretKey))

	return accessStr, refreshStr, err
}

// ========= TOKEN VALIDATION ===========

func parseToken(tokenStr string) (*AuthUserClaims, error) {
	claims := &AuthUserClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("invalid signing method")
		}
		return []byte(hmacSecretKey), nil
	})
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ========= MIDDLEWARE ===========

func IsAuthenticated(requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. Bearer
		hdr := c.Get("Authorization")
		if strings.HasPrefix(strings.ToLower(hdr), "bearer ") {
			claims, err := parseToken(hdr[7:])
			if err == nil {
				c.Locals("user_id", claims.UserID)
				c.Locals("user_role", claims.UserRole)
				c.Locals("permissions", claims.Permissions)

				// Check permissions if any are required using role-based permission checking
				if len(requiredPermissions) > 0 && !hasPermissionWithRole(claims.UserRole, claims.Permissions, requiredPermissions) {
					return c.Status(403).JSON(fiber.Map{
						"error": "insufficient permissions",
					})
				}

				return c.Next()
			}
		}

		// 2. Cookie
		cookie := c.Cookies("access")
		if cookie != "" {
			claims, err := parseToken(cookie)
			if err == nil {
				c.Locals("user_id", claims.UserID)
				c.Locals("user_role", claims.UserRole)
				c.Locals("permissions", claims.Permissions)

				// Check permissions if any are required using role-based permission checking
				if len(requiredPermissions) > 0 && !hasPermissionWithRole(claims.UserRole, claims.Permissions, requiredPermissions) {
					return c.Status(403).JSON(fiber.Map{
						"error": "insufficient permissions",
					})
				}

				return c.Next()
			}
		}

		return c.Status(401).JSON(fiber.Map{
			"error": "unauthenticated",
		})
	}
}

// Call this from main.go - HMAC doesn't need key generation
func InitSSO() error {
	// HMAC uses a static secret key, no key generation needed
	return nil
}

// Helper function to check if user has any of the required permissions
func hasAnyPermission(userPermissions []string, requiredPermissions []string) bool {
	// If "any" is in required permissions, allow access
	for _, required := range requiredPermissions {
		if required == constants.PermAny {
			return true
		}
	}

	// Check if user has any of the required permissions
	for _, userPerm := range userPermissions {
		for _, required := range requiredPermissions {
			if userPerm == required {
				return true
			}
		}
	}

	return false
}

// hasPermissionWithRole checks if user has required permission
func hasPermissionWithRole(userRole string, userPermissions []string, requiredPermissions []string) bool {
	// If "any" is in required permissions, allow access
	for _, required := range requiredPermissions {
		if required == constants.PermAny {
			return true
		}
	}

	// Build full permission strings (ROLE.PERMISSION format)
	var fullPermissions []string
	for _, perm := range userPermissions {
		// If permission already contains a dot, use it as-is
		if strings.Contains(perm, ".") {
			fullPermissions = append(fullPermissions, perm)
		} else {
			// Construct full permission: ROLE.PERMISSION
			fullPerm := userRole + "." + perm
			fullPermissions = append(fullPermissions, fullPerm)
		}
	}

	// Check if user has any of the required permissions
	for _, userPerm := range fullPermissions {
		for _, required := range requiredPermissions {
			if userPerm == required {
				return true
			}
		}
	}

	return false
}

// Permission helper functions to work with existing middleware

// RequirePermissions is a helper function that creates a middleware with specific permissions
func RequirePermissions(permissions ...string) fiber.Handler {
	return IsAuthenticated(permissions...)
}

// RequireAnyPermission allows access if user has any of the specified permissions
func RequireAnyPermission(permissions ...string) fiber.Handler {
	return IsAuthenticated(permissions...)
}

// RequireAuthentication only requires valid authentication without specific permissions
func RequireAuthentication() fiber.Handler {
	return IsAuthenticated(constants.PermAny)
}

// CheckPermissionInController checks if user has specific permission within a controller
func CheckPermissionInController(c *fiber.Ctx, requiredPermission string) bool {
	userPermissions, ok := c.Locals("permissions").([]string)
	if !ok {
		return false
	}

	// Check if user has the required permission
	for _, perm := range userPermissions {
		if perm == requiredPermission {
			return true
		}
	}

	return false
}

// GetUserPermissions returns all user permissions from context
func GetUserPermissions(c *fiber.Ctx) []string {
	userPermissions, ok := c.Locals("permissions").([]string)
	if !ok {
		return []string{}
	}
	return userPermissions
}

// GetUserRole returns user role from context
func GetUserRole(c *fiber.Ctx) string {
	userRole, ok := c.Locals("user_role").(string)
	if !ok {
		return ""
	}
	return userRole
}

// GetUserID returns user ID from context
func GetUserID(c *fiber.Ctx) string {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return ""
	}
	return userID
}

// CORS middleware
func CORS() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-API-Key")
		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Max-Age", "86400")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}

		return c.Next()
	}
}
