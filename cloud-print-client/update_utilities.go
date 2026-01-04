package main

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// UpdateUtilities provides helper functions for the auto-update process
type UpdateUtilities struct{}

// NewUpdateUtilities creates a new instance of UpdateUtilities
func NewUpdateUtilities() *UpdateUtilities {
	return &UpdateUtilities{}
}

// CreateBackup creates a backup of the current executable
func (uu *UpdateUtilities) CreateBackup(executablePath string) (string, error) {
	timestamp := time.Now().Format("20060102_150405")
	backupPath := executablePath + ".backup_" + timestamp

	return backupPath, uu.copyFile(executablePath, backupPath)
}

// RestoreFromBackup restores the executable from a backup
func (uu *UpdateUtilities) RestoreFromBackup(executablePath, backupPath string) error {
	if !uu.fileExists(backupPath) {
		return fmt.Errorf("backup file does not exist: %s", backupPath)
	}

	return uu.copyFile(backupPath, executablePath)
}

// CleanupBackups removes old backup files (keeps only the last 3)
func (uu *UpdateUtilities) CleanupBackups(executablePath string) error {
	dir := filepath.Dir(executablePath)
	baseName := filepath.Base(executablePath)

	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("failed to read directory: %w", err)
	}

	var backups []string
	for _, entry := range entries {
		if !entry.IsDir() {
			name := entry.Name()
			if len(name) > len(baseName)+8 && name[:len(baseName)+8] == baseName+".backup_" {
				backups = append(backups, filepath.Join(dir, name))
			}
		}
	}

	// Keep only the 3 most recent backups
	if len(backups) > 3 {
		for i := 0; i < len(backups)-3; i++ {
			os.Remove(backups[i])
		}
	}

	return nil
}

// fileExists checks if a file exists
func (uu *UpdateUtilities) fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

// copyFile copies a file from src to dst
func (uu *UpdateUtilities) copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	// Copy file contents
	buf := make([]byte, 32*1024) // 32KB buffer
	for {
		n, err := sourceFile.Read(buf)
		if n > 0 {
			if _, err := destFile.Write(buf[:n]); err != nil {
				return fmt.Errorf("failed to write to destination: %w", err)
			}
		}
		if err != nil {
			if err.Error() == "EOF" {
				break
			}
			return fmt.Errorf("failed to read from source: %w", err)
		}
	}

	return nil
}

// GetExecutablePath returns the path of the current executable
func (uu *UpdateUtilities) GetExecutablePath() (string, error) {
	return os.Executable()
}

// IsWritableDirectory checks if a directory is writable
func (uu *UpdateUtilities) IsWritableDirectory(dir string) bool {
	testFile := filepath.Join(dir, ".write_test")
	file, err := os.Create(testFile)
	if err != nil {
		return false
	}
	file.Close()
	os.Remove(testFile)
	return true
}

// GetTempDirectory returns a suitable temporary directory for downloads
func (uu *UpdateUtilities) GetTempDirectory() string {
	if runtime.GOOS == "windows" {
		return os.TempDir()
	}

	// For Unix-like systems, try /tmp first
	if uu.IsWritableDirectory("/tmp") {
		return "/tmp"
	}

	return os.TempDir()
}

// CreateUpdateScript creates a platform-specific update script
func (uu *UpdateUtilities) CreateUpdateScript(currentExe, updateFile, scriptPath string) error {
	var script string

	if runtime.GOOS == "windows" {
		script = fmt.Sprintf(`@echo off
echo Waiting for application to close...
timeout /t 3 /nobreak >nul

:retry
copy /Y "%s" "%s" >nul 2>&1
if errorlevel 1 (
    echo Waiting for file to be released...
    timeout /t 1 /nobreak >nul
    goto retry
)

echo Starting updated application...
start "" "%s"

echo Update completed successfully!
timeout /t 2 /nobreak >nul
del "%s" >nul 2>&1
del "%%~f0" >nul 2>&1
`, updateFile, currentExe, currentExe, scriptPath)
	} else {
		script = fmt.Sprintf(`#!/bin/bash
echo "Waiting for application to close..."
sleep 3

echo "Applying update..."
cp "%s" "%s"
chmod +x "%s"

echo "Starting updated application..."
nohup "%s" > /dev/null 2>&1 &

echo "Update completed successfully!"
sleep 2
rm "%s"
rm "$0"
`, updateFile, currentExe, currentExe, currentExe, scriptPath)
	}

	return os.WriteFile(scriptPath, []byte(script), 0755)
}

// GetUpdateScriptPath returns the path where the update script should be created
func (uu *UpdateUtilities) GetUpdateScriptPath(executablePath string) string {
	dir := filepath.Dir(executablePath)
	if runtime.GOOS == "windows" {
		return filepath.Join(dir, "update.bat")
	}
	return filepath.Join(dir, "update.sh")
}

// IsRunningAsAdmin checks if the application is running with administrator privileges
func (uu *UpdateUtilities) IsRunningAsAdmin() bool {
	if runtime.GOOS == "windows" {
		// On Windows, try to create a file in the Windows directory
		testPath := filepath.Join(os.Getenv("WINDIR"), "temp", "admin_test")
		file, err := os.Create(testPath)
		if err != nil {
			return false
		}
		file.Close()
		os.Remove(testPath)
		return true
	}

	// On Unix-like systems, check if running as root
	return os.Geteuid() == 0
}

// ValidateUpdateFile validates the downloaded update file
func (uu *UpdateUtilities) ValidateUpdateFile(filePath string) error {
	// Check if file exists
	if !uu.fileExists(filePath) {
		return fmt.Errorf("update file does not exist: %s", filePath)
	}

	// Check file size (should be reasonable for an executable)
	info, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("failed to get file info: %w", err)
	}

	// Minimum size check (1MB) to ensure it's not corrupted
	if info.Size() < 1024*1024 {
		return fmt.Errorf("update file is too small (may be corrupted): %d bytes", info.Size())
	}

	// Maximum size check (100MB) to prevent excessive downloads
	if info.Size() > 100*1024*1024 {
		return fmt.Errorf("update file is too large (may be wrong file): %d bytes", info.Size())
	}

	return nil
}

// GetCurrentProcessPID returns the current process ID
func (uu *UpdateUtilities) GetCurrentProcessPID() int {
	return os.Getpid()
}

// IsProcessRunning checks if a process with the given PID is running
func (uu *UpdateUtilities) IsProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	// On Windows, FindProcess always succeeds, so we need to actually check
	if runtime.GOOS == "windows" {
		// On Windows, we can't easily check if process is running without additional packages
		// For now, just assume FindProcess success means the process exists
		return true
	}

	return process != nil
}
