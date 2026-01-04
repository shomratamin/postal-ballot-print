package printclient

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// ValidateAuthToken validates the authentication message from the client
// This validation is based on hardware fingerprinting without external JWT verification
func ValidateAuthToken(authMsg *AuthMessage) (bool, error) {
	// 1. Structural Validation
	if authMsg.Type != "auth" {
		return false, fmt.Errorf("invalid message type: expected 'auth', got '%s'", authMsg.Type)
	}

	if strings.TrimSpace(authMsg.Token) == "" {
		return false, fmt.Errorf("authentication token is empty")
	}

	// 2. Validate required hardware information
	if strings.TrimSpace(authMsg.Processor) == "" {
		return false, fmt.Errorf("processor information is missing")
	}

	if strings.TrimSpace(authMsg.Platform) == "" {
		return false, fmt.Errorf("platform information is missing")
	}

	if strings.TrimSpace(authMsg.HardwareID) == "" {
		return false, fmt.Errorf("hardware ID is missing")
	}

	// 3. Combine machine details to create a fingerprint
	data := authMsg.Processor + authMsg.Platform + authMsg.HardwareID

	// 4. Generate SHA-256 hash
	hash := sha256.Sum256([]byte(data))
	expectedID := hex.EncodeToString(hash[:])

	// 5. Extract specific characters to create the expected token
	// This matches the pattern from cloud-print-server
	expectedToken := expectedID[3:8] + expectedID[16:21] + expectedID[32:37] + expectedID[48:51]

	// 6. Compare the provided token with the expected hash
	if authMsg.Token != expectedToken {
		return false, fmt.Errorf("token does not match expected hash")
	}

	// 7. If all validations pass
	return true, nil
}

// ValidateToken is an alias for ValidateAuthToken for backward compatibility
func ValidateToken(authMsg *AuthMessage) (bool, error) {
	return ValidateAuthToken(authMsg)
}
