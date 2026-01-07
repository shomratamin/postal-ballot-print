package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type AppSettings struct {
	PUBLIC_KEY_URL    string
	TEST_PDF_URL      string
	LIVE_PDf_URL      string
	SPECIMEN_PDF_URL  string
	INTERNAL_PDF_URL  string
	SOCKET_URL        string
	WT_DIM_MACHINE_ID string
	CAMERA_ID         string
	APP_ID            string
	// Auto-update settings
	UPDATE_MANIFEST_URL   string
	UPDATE_CHECK_INTERVAL int // in minutes
	AUTO_UPDATE_ENABLED   bool
	AUTO_DOWNLOAD_UPDATES bool
	AUTO_INSTALL_UPDATES  bool
}

type AppSettingsData struct {
	WT_DIM_MACHINE_ID string `json:"wt_dim_machine_id"`
	CAMERA_ID         string `json:"camera_id"`
	// Auto-update settings
	UPDATE_MANIFEST_URL   string `json:"update_manifest_url"`
	UPDATE_CHECK_INTERVAL int    `json:"update_check_interval"`
	AUTO_UPDATE_ENABLED   bool   `json:"auto_update_enabled"`
	AUTO_DOWNLOAD_UPDATES bool   `json:"auto_download_updates"`
	AUTO_INSTALL_UPDATES  bool   `json:"auto_install_updates"`
}

// func NewAppSettings() *AppSettings {
// 	return &AppSettings{
// 		PUBLIC_KEY_URL:    "https://sso.ekdak.com/sso/fetch-public-key/",
// 		TEST_PDF_URL:      "https://ekdak.com/print/generate-test-mashul/",
// 		LIVE_PDf_URL:      "https://ekdak.com/print/generate-mashul/",
// 		SPECIMEN_PDF_URL:  "https://ekdak.com/print/generate-specimen-mashul/",
// 		INTERNAL_PDF_URL:  "https://ekdak.com/print/generate-internal-mashul/",
// 		SOCKET_URL:        "wss://election2026.ekdak.com/v1/ws",
// 		WT_DIM_MACHINE_ID: "",
// 		CAMERA_ID:         "",
// 		// Auto-update settings with defaults
// 		UPDATE_MANIFEST_URL:   "https://mdm.smartpostbd.com/files/update-manifest.json",
// 		UPDATE_CHECK_INTERVAL: 60, // Check every 60 minutes
// 		AUTO_UPDATE_ENABLED:   true,
// 		AUTO_DOWNLOAD_UPDATES: true,
// 		AUTO_INSTALL_UPDATES:  true, // Require user confirmation by default
// 	}
// }

// func NewAppSettings() *AppSettings {
// 	return &AppSettings{
// 		PUBLIC_KEY_URL:    "http://192.168.1.18:8000/sso/fetch-public-key/",
// 		TEST_PDF_URL:      "https://mdm.smartpostbd.com/files/envelope_AAAA100000001-test.pdf",
// 		LIVE_PDf_URL:      "http://192.168.1.18:8056/api/print/envelope-pdf-generator/",
// 		SPECIMEN_PDF_URL:  "http://192.168.1.18:8002/print/generate-specimen-mashul/",
// 		INTERNAL_PDF_URL:  "http://192.168.1.18:8002/print/generate-internal-mashul/",
// 		SOCKET_URL:        "ws://192.168.1.18:8056/ws",
// 		WT_DIM_MACHINE_ID: "",
// 		CAMERA_ID:         "",
// 		// Auto-update settings with defaults
// 		UPDATE_MANIFEST_URL:   "https://mdm.smartpostbd.com/files/update-manifest.json",
// 		UPDATE_CHECK_INTERVAL: 60, // Check every 60 minutes
// 		AUTO_UPDATE_ENABLED:   true,
// 		AUTO_DOWNLOAD_UPDATES: true,
// 		AUTO_INSTALL_UPDATES:  true, // Require user confirmation by default
// 	}
// }

func NewAppSettings() *AppSettings {
	return &AppSettings{
		PUBLIC_KEY_URL:    "http://192.168.1.18:8000/sso/fetch-public-key/",
		TEST_PDF_URL:      "https://mdm.smartpostbd.com/files/envelope_AAAA100000001-test.pdf",
		LIVE_PDf_URL:      "http://192.168.1.18:8056/api/print/envelope-pdf-generator/",
		SPECIMEN_PDF_URL:  "http://192.168.1.18:8002/print/generate-specimen-mashul/",
		INTERNAL_PDF_URL:  "http://192.168.1.18:8002/print/generate-internal-mashul/",
		// SOCKET_URL:        "wss://election2026.ekdak.com/v1/ws",
		SOCKET_URL:        "ws://192.168.1.18:8056/ws",
		WT_DIM_MACHINE_ID: "",
		CAMERA_ID:         "",
		// Auto-update settings with defaults
		UPDATE_MANIFEST_URL:   "https://mdm.smartpostbd.com/files/update-manifest.json",
		UPDATE_CHECK_INTERVAL: 60, // Check every 60 minutes
		AUTO_UPDATE_ENABLED:   true,
		AUTO_DOWNLOAD_UPDATES: true,
		AUTO_INSTALL_UPDATES:  true, // Require user confirmation by default
	}
}

// func NewAppSettings() *AppSettings {
// 	return &AppSettings{
// 		PUBLIC_KEY_URL:    "http://192.168.1.18:8000/sso/fetch-public-key/",
// 		TEST_PDF_URL:      "http://192.168.1.18:8002/print/generate-test-mashul/",
// 		LIVE_PDf_URL:      "http://192.168.1.18:8002/print/generate-mashul/",
// 		SPECIMEN_PDF_URL:  "http://192.168.1.18:8002/print/generate-specimen-mashul/",
// 		SOCKET_URL:        "ws://192.168.1.18:3005/ws",
// 		WT_DIM_MACHINE_ID: "",
// 		CAMERA_ID:         "",
// 	}
// }

func (app_settings *AppSettings) GetAppID() string {
	return app_settings.APP_ID
}

func (app_settings *AppSettings) SetAppID(app_id string) {
	app_settings.APP_ID = app_id
}

func (app_settings *AppSettings) SetMachineID(machine_id string) {
	app_settings.WT_DIM_MACHINE_ID = machine_id
	app_settings.SaveAppSettings()
}

func (app_settings *AppSettings) SetCameraID(camera_id string) {
	app_settings.CAMERA_ID = camera_id
	app_settings.SaveAppSettings()
}

func (app_settings *AppSettings) GetMachineID() string {
	return app_settings.WT_DIM_MACHINE_ID
}

func (app_settings *AppSettings) GetCameraID() string {
	return app_settings.CAMERA_ID
}

func (appSettings *AppSettings) SaveAppSettings() error {
	// Save app settings to a file
	fileToSave := "data/app_settings.json"
	dataToSave := AppSettingsData{
		WT_DIM_MACHINE_ID: appSettings.WT_DIM_MACHINE_ID,
		CAMERA_ID:         appSettings.CAMERA_ID,
	}

	err := saveJSONToFile(fileToSave, dataToSave)
	if err != nil {
		return fmt.Errorf("failed to save app settings: %w", err)
	}

	fmt.Println("App settings saved successfully.")
	return nil
}

func (appSettings *AppSettings) LoadAppSettings() error {
	// Load app settings from a file
	fileToLoad := "data/app_settings.json"
	var data AppSettingsData

	err := loadJSONFromFile(fileToLoad, &data)
	if err != nil {
		return fmt.Errorf("failed to load app settings: %w", err)
	}

	appSettings.WT_DIM_MACHINE_ID = data.WT_DIM_MACHINE_ID
	appSettings.CAMERA_ID = data.CAMERA_ID

	fmt.Println("App settings loaded successfully.")
	return nil
}

func saveJSONToFile(fileName string, data interface{}) error {
	file, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	err = os.WriteFile(fileName, file, 0644)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

func loadJSONFromFile(fileName string, data interface{}) error {
	file, err := os.ReadFile(fileName)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	err = json.Unmarshal(file, data)
	if err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return nil
}
