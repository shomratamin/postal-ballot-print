package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	"syscall"
)

// EnablePrintServiceLogging enables the Windows Print Service operational logging
// Tries multiple methods: wevtutil, registry, and PowerShell
func EnablePrintServiceLogging() error {
	fmt.Println("DEBUG: Starting EnablePrintServiceLogging()")

	// Check if logging is already enabled
	fmt.Println("DEBUG: Checking if logging is already enabled...")
	enabled, err := IsPrintServiceLoggingEnabled()
	if err != nil {
		fmt.Printf("DEBUG: Error checking status: %v\n", err)
		return fmt.Errorf("failed to check logging status: %v", err)
	}

	if enabled {
		fmt.Println("DEBUG: Print Service logging is already enabled")
		return nil
	}

	fmt.Println("DEBUG: Logging is disabled, attempting to enable...")

	// Method 1: Try wevtutil command
	fmt.Println("DEBUG: Trying Method 1 - wevtutil...")
	cmd := exec.Command("wevtutil", "sl", "Microsoft-Windows-PrintService/Operational", "/e:true")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	fmt.Println("DEBUG: Running wevtutil command...")
	output, err := cmd.CombinedOutput()
	fmt.Printf("DEBUG: wevtutil result - err: %v, output: %s\n", err, string(output))

	if err == nil {
		fmt.Println("DEBUG: ✓ Print Service logging enabled successfully via wevtutil")
		return nil
	}

	fmt.Printf("DEBUG: wevtutil method failed: %v, output: %s\n", err, string(output))

	// Method 2: Try registry command
	fmt.Println("DEBUG: Trying Method 2 - registry...")
	err = EnablePrintServiceLoggingViaRegistry()
	if err == nil {
		fmt.Println("DEBUG: ✓ Print Service logging enabled successfully via registry")
		return nil
	}

	fmt.Printf("DEBUG: Registry method failed: %v\n", err)

	// Method 3: Try PowerShell command
	fmt.Println("DEBUG: Trying Method 3 - PowerShell...")
	err = EnablePrintServiceLoggingViaPowerShell()
	if err == nil {
		fmt.Println("DEBUG: ✓ Print Service logging enabled successfully via PowerShell")
		return nil
	}

	fmt.Printf("DEBUG: All methods failed. Last error: %v\n", err)
	return fmt.Errorf("all methods failed - wevtutil, registry, and PowerShell. Last error: %v", err)
}

// IsPrintServiceLoggingEnabled checks if the Print Service operational logging is enabled
func IsPrintServiceLoggingEnabled() (bool, error) {
	cmd := exec.Command("wevtutil", "gl", "Microsoft-Windows-PrintService/Operational")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return false, fmt.Errorf("failed to get log info: %v", err)
	}

	// Check if the log is enabled
	return strings.Contains(string(output), "enabled: true"), nil
}

// SetPrintServiceLogSize sets the maximum log size (optional)
func SetPrintServiceLogSize(sizeInBytes int) error {
	sizeStr := fmt.Sprintf("%d", sizeInBytes)
	cmd := exec.Command("wevtutil", "sl", "Microsoft-Windows-PrintService/Operational", "/ms:"+sizeStr)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to set log size: %v, output: %s", err, string(output))
	}

	fmt.Printf("Print Service log size set to %d bytes\n", sizeInBytes)
	return nil
}

// CheckPrintLoggingStatus checks if print logging is enabled and returns status
func CheckPrintLoggingStatus() (bool, error) {
	fmt.Println("Checking Print Service logging status...")

	enabled, err := IsPrintServiceLoggingEnabled()
	if err != nil {
		fmt.Printf("Failed to check logging status via wevtutil: %v\n", err)
		return false, err
	}

	if enabled {
		fmt.Println("✓ Print Service logging is already enabled")
		return true, nil
	}

	fmt.Println("⚠ Print Service logging is disabled")
	return false, nil
}

// EnablePrintLoggingWithUserConsent attempts to enable print logging with UAC elevation
func EnablePrintLoggingWithUserConsent(console *Console) error {
	// Add immediate console feedback and debug output
	fmt.Println("DEBUG: EnablePrintLoggingWithUserConsent called")

	// First, show immediate feedback
	console.MsgChan <- Message{
		Text:  "🔄 Starting Print Service logging enablement process...",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	fmt.Println("DEBUG: Sent first message to console")

	console.MsgChan <- Message{
		Text:  "🔐 Requesting Administrator privileges to enable Print Service logging...",
		Color: colorNRGBA(255, 165, 0, 255), // Orange
	}

	fmt.Println("DEBUG: Sent second message to console")

	// Check if we're already running as admin
	fmt.Println("DEBUG: Checking admin status...")
	isAdmin, err := isRunningAsAdmin()
	if err != nil {
		fmt.Printf("DEBUG: Admin check error: %v\n", err)
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("⚠️ Could not check admin status: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
	}

	fmt.Printf("DEBUG: Is admin: %v\n", isAdmin)

	if isAdmin {
		// We're already admin, just try to enable logging
		console.MsgChan <- Message{
			Text:  "✅ Already running as Administrator. Enabling logging...",
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}

		fmt.Println("DEBUG: Running as admin, calling enableLoggingDirectly")
		return enableLoggingDirectly(console)
	}

	// We're not admin, so we need to elevate
	console.MsgChan <- Message{
		Text:  "⚠️ Not running as Administrator. Requesting UAC elevation...",
		Color: colorNRGBA(255, 165, 0, 255), // Orange
	}

	console.MsgChan <- Message{
		Text:  "🔔 A User Account Control (UAC) prompt will appear. Click 'Yes' to continue.",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	fmt.Println("DEBUG: Not running as admin, calling enableLoggingWithUACElevation")

	// Try to run PowerShell with UAC elevation
	err = enableLoggingWithUACElevation(console)
	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("UAC elevation failed: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}

		// Provide manual instructions
		provideManualInstructions(console)
		return err
	}

	// Verify if logging was enabled
	console.MsgChan <- Message{
		Text:  "Verifying if Print Service logging was enabled...",
		Color: colorNRGBA(255, 165, 0, 255), // Orange
	}

	enabled, err := IsPrintServiceLoggingEnabled()
	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Warning: Could not verify logging status: %v", err),
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
		return nil
	}

	if enabled {
		console.MsgChan <- Message{
			Text:  "✅ Print Service logging has been enabled successfully!",
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}
	} else {
		console.MsgChan <- Message{
			Text:  "⚠ Logging still appears to be disabled. Please try manual method.",
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
		provideManualInstructions(console)
	}

	return nil
}

// enableLoggingWithUACElevation runs the logging enablement with UAC elevation
func enableLoggingWithUACElevation(console *Console) error {
	// Method 1: Try PowerShell with Start-Process -Verb RunAs
	console.MsgChan <- Message{
		Text:  "Attempting UAC elevation via PowerShell...",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	// PowerShell command that will trigger UAC and enable logging
	psScript := `Start-Process powershell -ArgumentList "-Command", "wevtutil sl 'Microsoft-Windows-PrintService/Operational' /e:true; Write-Host 'Print logging enabled'; Read-Host 'Press Enter to continue'" -Verb RunAs -Wait`

	cmd := exec.Command("powershell", "-Command", psScript)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	_, err := cmd.CombinedOutput()
	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("PowerShell UAC method failed: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}

		// Method 2: Try direct UAC elevation with wevtutil
		return enableLoggingWithDirectUAC(console)
	}

	console.MsgChan <- Message{
		Text:  "PowerShell UAC elevation completed successfully",
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	return nil
}

// enableLoggingWithDirectUAC tries direct UAC elevation
func enableLoggingWithDirectUAC(console *Console) error {
	console.MsgChan <- Message{
		Text:  "Trying alternative UAC elevation method...",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	// Create a temporary batch file that will enable logging
	batchScript := `@echo off
echo Enabling Windows Print Service Operational Logging...
wevtutil sl "Microsoft-Windows-PrintService/Operational" /e:true
if %errorlevel% equ 0 (
    echo Print Service logging enabled successfully!
) else (
    echo Failed to enable Print Service logging.
)
pause
`

	// Write the batch script to a temporary file
	batchFile := "temp_enable_logging.bat"
	err := os.WriteFile(batchFile, []byte(batchScript), 0644)
	if err != nil {
		return fmt.Errorf("failed to create temporary batch file: %v", err)
	}
	defer os.Remove(batchFile) // Clean up

	// Run the batch file with UAC elevation using PowerShell Start-Process
	psCommand := fmt.Sprintf(`Start-Process "%s" -Verb RunAs -Wait`, batchFile)
	cmd := exec.Command("powershell", "-Command", psCommand)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("direct UAC elevation failed: %v, output: %s", err, string(output))
	}

	console.MsgChan <- Message{
		Text:  "UAC elevation batch script completed",
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	return nil
}

// enableLoggingDirectly enables logging when already running as admin
func enableLoggingDirectly(console *Console) error {
	console.MsgChan <- Message{
		Text:  "Attempting to enable logging directly...",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	err := EnablePrintServiceLogging()
	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Failed to enable logging: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
		return err
	}

	console.MsgChan <- Message{
		Text:  "✅ Print Service logging enabled successfully!",
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	return nil
}

// provideManualInstructions shows manual steps to the user
func provideManualInstructions(console *Console) {
	console.MsgChan <- Message{
		Text:  "📋 Manual steps to enable Print Service logging:",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	console.MsgChan <- Message{
		Text:  "Option 1: Run PowerShell as Administrator and execute:",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	console.MsgChan <- Message{
		Text:  `   wevtutil sl "Microsoft-Windows-PrintService/Operational" /e:true`,
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	console.MsgChan <- Message{
		Text:  "Option 2: Use Event Viewer (run as Administrator):",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	console.MsgChan <- Message{
		Text:  "   • Navigate: Applications and Service Logs > Microsoft > Windows > PrintService > Operational",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	console.MsgChan <- Message{
		Text:  "   • Right-click 'Operational' > Properties > Check 'Enable Logging'",
		Color: colorNRGBA(255, 255, 255, 255), // White
	}

	console.MsgChan <- Message{
		Text:  "Option 3: Double-click enable_print_logging.ps1 (included with this app)",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
}

// isRunningAsAdmin checks if the current process is running with Administrator privileges
func isRunningAsAdmin() (bool, error) {
	fmt.Println("DEBUG: Checking admin privileges using 'net session'...")

	cmd := exec.Command("net", "session")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	fmt.Printf("DEBUG: 'net session' result - err: %v, output: %s\n", err, string(output))

	if err != nil {
		// If "net session" fails, we're likely not running as admin
		fmt.Printf("DEBUG: 'net session' failed, assuming not admin: %v\n", err)
		return false, nil
	}

	// If "net session" succeeds, we have admin privileges
	fmt.Println("DEBUG: 'net session' succeeded, we have admin privileges")
	return true, nil
} // EnablePrintServiceLoggingViaRegistry enables logging via Windows registry (fallback method)
func EnablePrintServiceLoggingViaRegistry() error {
	// Try using reg command to modify registry
	cmd := exec.Command("reg", "add",
		"HKLM\\SYSTEM\\CurrentControlSet\\Services\\EventLog\\Microsoft-Windows-PrintService/Operational",
		"/v", "Enabled", "/t", "REG_DWORD", "/d", "1", "/f")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("registry method failed: %v, output: %s", err, string(output))
	}

	return nil
}

// EnablePrintServiceLoggingViaPowerShell enables logging via PowerShell (third fallback method)
func EnablePrintServiceLoggingViaPowerShell() error {
	// Try using PowerShell directly
	psScript := `wevtutil sl "Microsoft-Windows-PrintService/Operational" /e:true`
	cmd := exec.Command("powershell", "-Command", psScript)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("PowerShell method failed: %v, output: %s", err, string(output))
	}

	return nil
}
