package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"gioui.org/app"
)

// UpdateManifest represents the JSON structure from the update server
type UpdateManifest struct {
	Version     string `json:"version"`
	DownloadURL string `json:"download_url"`
	Checksum    string `json:"checksum"`
	ReleaseDate string `json:"release_date"`
	Critical    bool   `json:"critical"`
}

// UpdateStatus represents the current state of the update process
type UpdateStatus int

const (
	UpdateStatusIdle UpdateStatus = iota
	UpdateStatusChecking
	UpdateStatusDownloading
	UpdateStatusReady
	UpdateStatusInstalling
	UpdateStatusError
	UpdateStatusRestartRequired
)

func (us UpdateStatus) String() string {
	switch us {
	case UpdateStatusIdle:
		return "Idle"
	case UpdateStatusChecking:
		return "Checking for updates"
	case UpdateStatusDownloading:
		return "Downloading update"
	case UpdateStatusReady:
		return "Update ready to install"
	case UpdateStatusInstalling:
		return "Installing update"
	case UpdateStatusError:
		return "Update error"
	case UpdateStatusRestartRequired:
		return "Restart required"
	default:
		return "Unknown"
	}
}

// AutoUpdater manages the auto-update functionality
type AutoUpdater struct {
	mu               sync.RWMutex
	settings         *AppSettings
	console          *Console
	currentVersion   string
	manifestURL      string
	checkInterval    time.Duration
	status           UpdateStatus
	lastError        error
	lastCheck        time.Time
	availableUpdate  *UpdateManifest
	downloadPath     string
	isEnabled        bool
	stopChan         chan struct{}
	statusCallbacks  []func(UpdateStatus, string)
	window           *app.Window
	updateReady      bool
	restartRequested bool
}

// NewAutoUpdater creates a new auto-updater instance
func NewAutoUpdater(settings *AppSettings, console *Console) *AutoUpdater {
	return &AutoUpdater{
		settings:        settings,
		console:         console,
		currentVersion:  getVersion(),
		manifestURL:     settings.UPDATE_MANIFEST_URL,
		checkInterval:   time.Duration(settings.UPDATE_CHECK_INTERVAL) * time.Minute,
		status:          UpdateStatusIdle,
		isEnabled:       settings.AUTO_UPDATE_ENABLED,
		stopChan:        make(chan struct{}),
		statusCallbacks: make([]func(UpdateStatus, string), 0),
		downloadPath:    filepath.Join(os.TempDir(), "cloud-print-client-update.exe"),
	}
}

// Start begins the auto-update service
func (au *AutoUpdater) Start(window *app.Window) {
	au.mu.Lock()
	au.window = window
	au.mu.Unlock()

	if !au.isEnabled {
		au.logMessage("Auto-updater is disabled")
		return
	}

	au.logMessage("Auto-updater started")

	// Check for updates immediately on startup
	go au.checkForUpdates()

	// Start the periodic update checker
	go au.periodicUpdateChecker()
}

// Stop stops the auto-update service
func (au *AutoUpdater) Stop() {
	au.mu.Lock()
	defer au.mu.Unlock()

	close(au.stopChan)
	au.logMessage("Auto-updater stopped")
}

// periodicUpdateChecker runs the update check at specified intervals
func (au *AutoUpdater) periodicUpdateChecker() {
	ticker := time.NewTicker(au.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if au.isEnabled {
				go au.checkForUpdates()
			}
		case <-au.stopChan:
			return
		}
	}
}

// checkForUpdates checks the manifest URL for new versions
func (au *AutoUpdater) checkForUpdates() {
	au.mu.Lock()
	au.status = UpdateStatusChecking
	au.lastCheck = time.Now()
	au.mu.Unlock()

	au.notifyStatusChange("Checking for updates...")

	manifest, err := au.fetchUpdateManifest()
	if err != nil {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = err
		au.mu.Unlock()
		au.logMessage(fmt.Sprintf("Failed to check for updates: %v", err))
		au.notifyStatusChange(fmt.Sprintf("Update check failed: %v", err))
		return
	}

	au.mu.Lock()
	if au.isNewerVersion(manifest.Version) {
		au.availableUpdate = manifest
		au.status = UpdateStatusIdle
		au.mu.Unlock()

		au.logMessage(fmt.Sprintf("New version available: %s", manifest.Version))
		au.notifyStatusChange(fmt.Sprintf("Update available: v%s", manifest.Version))

		// If auto-download is enabled, start downloading
		if au.settings.AUTO_DOWNLOAD_UPDATES {
			go au.downloadUpdate()
		}
	} else {
		au.status = UpdateStatusIdle
		au.mu.Unlock()
		au.logMessage("No updates available")
		au.notifyStatusChange("No updates available")
	}
}

// fetchUpdateManifest retrieves the update manifest from the server
func (au *AutoUpdater) fetchUpdateManifest() (*UpdateManifest, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(au.manifestURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch manifest: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status: %s", resp.Status)
	}

	var manifest UpdateManifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, fmt.Errorf("failed to decode manifest: %w", err)
	}

	return &manifest, nil
}

// isNewerVersion compares version strings to determine if an update is available
func (au *AutoUpdater) isNewerVersion(newVersion string) bool {
	current := au.parseVersion(au.currentVersion)
	new := au.parseVersion(newVersion)

	for i := 0; i < len(current) && i < len(new); i++ {
		if new[i] > current[i] {
			return true
		}
		if new[i] < current[i] {
			return false
		}
	}

	return len(new) > len(current)
}

// parseVersion converts version string to slice of integers for comparison
func (au *AutoUpdater) parseVersion(version string) []int {
	parts := strings.Split(version, ".")
	result := make([]int, len(parts))

	for i, part := range parts {
		if num, err := strconv.Atoi(part); err == nil {
			result[i] = num
		}
	}

	return result
}

// downloadUpdate downloads the update file
func (au *AutoUpdater) downloadUpdate() {
	au.mu.Lock()
	if au.availableUpdate == nil {
		au.mu.Unlock()
		return
	}

	au.status = UpdateStatusDownloading
	manifest := au.availableUpdate
	au.mu.Unlock()

	au.notifyStatusChange("Downloading update...")
	au.logMessage(fmt.Sprintf("Downloading update v%s", manifest.Version))

	// Use direct download URL from manifest
	downloadURL := manifest.DownloadURL
	expectedChecksum := manifest.Checksum

	if downloadURL == "" {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = fmt.Errorf("no download URL in manifest")
		au.mu.Unlock()
		au.logMessage("No download URL available in manifest")
		return
	} // Download the file
	if err := au.downloadFile(downloadURL, au.downloadPath); err != nil {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = err
		au.mu.Unlock()
		au.logMessage(fmt.Sprintf("Download failed: %v", err))
		au.notifyStatusChange(fmt.Sprintf("Download failed: %v", err))
		return
	}

	// Verify checksum if provided
	if expectedChecksum != "" {
		if err := au.verifyChecksum(au.downloadPath, expectedChecksum); err != nil {
			au.mu.Lock()
			au.status = UpdateStatusError
			au.lastError = err
			au.mu.Unlock()
			au.logMessage(fmt.Sprintf("Checksum verification failed: %v", err))
			au.notifyStatusChange("Download verification failed")
			os.Remove(au.downloadPath) // Remove corrupted file
			return
		}
	}

	au.mu.Lock()
	au.status = UpdateStatusReady
	au.updateReady = true
	au.mu.Unlock()

	au.logMessage("Update downloaded and ready to install")
	au.notifyStatusChange("Update ready - restart to apply")

	// If auto-install is enabled, install immediately
	if au.settings.AUTO_INSTALL_UPDATES {
		au.installUpdate()
	}
}

// downloadFile downloads a file from URL to the specified path with progress tracking
func (au *AutoUpdater) downloadFile(url, filepath string) error {
	out, err := os.Create(filepath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer out.Close()

	client := &http.Client{
		Timeout: 10 * time.Minute, // Long timeout for large files
	}

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned status: %s", resp.Status)
	}

	// Copy with progress tracking
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}

	return nil
}

// verifyChecksum verifies the downloaded file's SHA256 checksum
func (au *AutoUpdater) verifyChecksum(filepath, expectedChecksum string) error {
	file, err := os.Open(filepath)
	if err != nil {
		return fmt.Errorf("failed to open file for verification: %w", err)
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return fmt.Errorf("failed to calculate checksum: %w", err)
	}

	actualChecksum := hex.EncodeToString(hash.Sum(nil))
	if actualChecksum != expectedChecksum {
		return fmt.Errorf("checksum mismatch: expected %s, got %s", expectedChecksum, actualChecksum)
	}

	return nil
}

// installUpdate applies the downloaded update
func (au *AutoUpdater) installUpdate() {
	au.mu.Lock()
	if !au.updateReady {
		au.mu.Unlock()
		return
	}

	au.status = UpdateStatusInstalling
	au.mu.Unlock()

	au.notifyStatusChange("Installing update...")
	au.logMessage("Installing update...")

	// Get current executable path
	currentExe, err := os.Executable()
	if err != nil {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = err
		au.mu.Unlock()
		au.logMessage(fmt.Sprintf("Failed to get current executable path: %v", err))
		return
	}

	// Create backup of current executable
	backupPath := currentExe + ".backup"
	if err := au.copyFile(currentExe, backupPath); err != nil {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = err
		au.mu.Unlock()
		au.logMessage(fmt.Sprintf("Failed to create backup: %v", err))
		return
	}

	// Schedule the update to happen after application exit
	if err := au.scheduleUpdateAndRestart(currentExe, au.downloadPath, backupPath); err != nil {
		au.mu.Lock()
		au.status = UpdateStatusError
		au.lastError = err
		au.mu.Unlock()
		au.logMessage(fmt.Sprintf("Failed to schedule update: %v", err))
		return
	}

	au.mu.Lock()
	au.status = UpdateStatusRestartRequired
	au.restartRequested = true
	au.mu.Unlock()

	au.logMessage("Update scheduled - application will restart")
	au.notifyStatusChange("Update ready - restarting application...")

	// Trigger application restart after a short delay
	go func() {
		time.Sleep(2 * time.Second)
		au.restartApplication()
	}()
}

// scheduleUpdateAndRestart creates a script to update the executable after the app exits
func (au *AutoUpdater) scheduleUpdateAndRestart(currentExe, updateFile, backupFile string) error {
	if runtime.GOOS == "windows" {
		return au.scheduleWindowsUpdate(currentExe, updateFile, backupFile)
	}
	return au.scheduleUnixUpdate(currentExe, updateFile, backupFile)
}

// scheduleWindowsUpdate creates a batch script for Windows update
func (au *AutoUpdater) scheduleWindowsUpdate(currentExe, updateFile, backupFile string) error {
	scriptPath := filepath.Join(filepath.Dir(currentExe), "update.bat")

	// Get just the filename for the executable
	exeFileName := filepath.Base(currentExe)

	script := fmt.Sprintf(`@echo off
echo Waiting for application to close...
timeout /t 3 /nobreak >nul
echo Applying update...

:retry
echo Stopping any running processes...
taskkill /F /IM "%s" >nul 2>&1
timeout /t 1 /nobreak >nul

echo Copying new executable...
copy /Y "%s" "%s" >nul 2>&1
if errorlevel 1 (
    echo Waiting for file to be released...
    timeout /t 2 /nobreak >nul
    goto retry
)

echo Starting updated application...
start "" "%s"

echo Update completed successfully!
timeout /t 2 /nobreak >nul
echo Cleaning up...
del "%s" >nul 2>&1
del "%%~f0" >nul 2>&1
`, exeFileName, updateFile, currentExe, currentExe, scriptPath)

	return os.WriteFile(scriptPath, []byte(script), 0755)
} // scheduleUnixUpdate creates a shell script for Unix-like systems update
func (au *AutoUpdater) scheduleUnixUpdate(currentExe, updateFile, backupFile string) error {
	scriptPath := filepath.Join(filepath.Dir(currentExe), "update.sh")

	script := fmt.Sprintf(`#!/bin/bash
echo "Waiting for application to close..."
sleep 3
echo "Applying update..."

cp "%s" "%s"
chmod +x "%s"

echo "Starting updated application..."
nohup "%s" > /dev/null 2>&1 &
rm "%s"
rm "$0"
`, updateFile, currentExe, currentExe, currentExe, scriptPath)

	return os.WriteFile(scriptPath, []byte(script), 0755)
}

// copyFile copies a file from src to dst
func (au *AutoUpdater) copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}

// restartApplication gracefully shuts down and restarts the application
func (au *AutoUpdater) restartApplication() {
	au.logMessage("Restarting application...")

	// Get current executable path
	currentExe, err := os.Executable()
	if err != nil {
		au.logMessage(fmt.Sprintf("Failed to get executable path: %v", err))
		return
	}

	// Execute the update script
	scriptName := "update.bat"
	if runtime.GOOS != "windows" {
		scriptName = "update.sh"
	}
	scriptPath := filepath.Join(filepath.Dir(currentExe), scriptName)

	if runtime.GOOS == "windows" {
		cmd := exec.Command("cmd", "/C", "start", "/MIN", scriptPath)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		if err := cmd.Start(); err != nil {
			au.logMessage(fmt.Sprintf("Failed to start update script: %v", err))
			return
		}
	} else {
		cmd := exec.Command("sh", scriptPath)
		if err := cmd.Start(); err != nil {
			au.logMessage(fmt.Sprintf("Failed to start update script: %v", err))
			return
		}
	}

	// Close the application window to trigger shutdown
	if au.window != nil {
		// Instead of using undefined app.ActionClose, use os.Exit
		os.Exit(0)
	}

	// Force exit after a short delay if graceful shutdown doesn't work
	go func() {
		time.Sleep(5 * time.Second)
		os.Exit(0)
	}()
}

// GetStatus returns the current update status
func (au *AutoUpdater) GetStatus() (UpdateStatus, string, *UpdateManifest) {
	au.mu.RLock()
	defer au.mu.RUnlock()

	var message string
	if au.lastError != nil {
		message = au.lastError.Error()
	} else {
		message = au.status.String()
	}

	return au.status, message, au.availableUpdate
}

// IsUpdateAvailable returns true if an update is available
func (au *AutoUpdater) IsUpdateAvailable() bool {
	au.mu.RLock()
	defer au.mu.RUnlock()
	return au.availableUpdate != nil
}

// IsUpdateReady returns true if an update has been downloaded and is ready to install
func (au *AutoUpdater) IsUpdateReady() bool {
	au.mu.RLock()
	defer au.mu.RUnlock()
	return au.updateReady
}

// ManualUpdate triggers a manual update check
func (au *AutoUpdater) ManualUpdate() {
	go au.checkForUpdates()
}

// InstallPendingUpdate installs a downloaded update
func (au *AutoUpdater) InstallPendingUpdate() {
	if au.IsUpdateReady() {
		au.installUpdate()
	}
}

// AddStatusCallback adds a callback function to be called when status changes
func (au *AutoUpdater) AddStatusCallback(callback func(UpdateStatus, string)) {
	au.mu.Lock()
	defer au.mu.Unlock()
	au.statusCallbacks = append(au.statusCallbacks, callback)
}

// notifyStatusChange calls all registered status callbacks
func (au *AutoUpdater) notifyStatusChange(message string) {
	au.mu.RLock()
	callbacks := make([]func(UpdateStatus, string), len(au.statusCallbacks))
	copy(callbacks, au.statusCallbacks)
	status := au.status
	au.mu.RUnlock()

	for _, callback := range callbacks {
		go callback(status, message)
	}
}

// logMessage sends a message to the console
func (au *AutoUpdater) logMessage(message string) {
	if au.console != nil {
		au.console.MsgChan <- Message{
			Text:  fmt.Sprintf("[AutoUpdater] %s", message),
			Color: colorNRGBA(0, 150, 255, 255), // Blue color for updater messages
		}
	}
}

// SetEnabled enables or disables the auto-updater
func (au *AutoUpdater) SetEnabled(enabled bool) {
	au.mu.Lock()
	au.isEnabled = enabled
	au.mu.Unlock()

	if enabled {
		au.logMessage("Auto-updater enabled")
		go au.checkForUpdates()
	} else {
		au.logMessage("Auto-updater disabled")
	}
}

// IsEnabled returns whether auto-updater is enabled
func (au *AutoUpdater) IsEnabled() bool {
	au.mu.RLock()
	defer au.mu.RUnlock()
	return au.isEnabled
}

// GetLastCheckTime returns when the last update check occurred
func (au *AutoUpdater) GetLastCheckTime() time.Time {
	au.mu.RLock()
	defer au.mu.RUnlock()
	return au.lastCheck
}
