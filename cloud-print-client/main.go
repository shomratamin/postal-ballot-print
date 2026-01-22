// main.go
package main

import (
	"log"
	"os"
	"time"

	"gioui.org/app"
)

var appSettings = NewAppSettings()
var weightdimensionMachineManager = NewWeightDimMachineManager()

// var autoUpdater *AutoUpdater

func main() {
	appSettings.LoadAppSettings()
	auth_message, err := GenerateAuthMessage()
	if err != nil {
		log.Println("Auth message generation failed:", err)
		return
	}

	appSettings.SetAppID(auth_message.Token)
	weightdimensionMachineManager.SetPrinterClientID(auth_message.Token)

	var w *app.Window
	done := make(chan struct{})
	// Initialize the console with a buffer size of 100 messages
	console := NewConsole(70)

	// Initialize the Auto-updater
	// autoUpdater = NewAutoUpdater(appSettings, console)

	// Initialize the PrintManager with a buffer size of 10 print jobs
	printManager := NewPrintManager(1000)
	printManager.Start(console)

	// Channel to receive the list of printers from discovery
	printersChan := make(chan []PrinterStatus, 20)

	// Start a goroutine to periodically update the printers list using WMI
	go StartPrinterDiscovery(60*time.Second, console, printersChan) // Update every 60 seconds

	// Create and launch the GUI in a separate goroutine
	go func() {
		w = new(app.Window)
		version_text := "BPO Cloud Machines, Version: " + getVersion()
		w.Option(app.Title(version_text))

		// Start the auto-updater after window is created
		// go autoUpdater.Start(w)

		close(done)
		if err := loop(w, console, printManager, printersChan, auth_message.Token); err != nil {
			log.Fatal(err)
		}

		// Stop auto-updater before exiting
		// autoUpdater.Stop()
		os.Exit(0)
	}()

	// Start a goroutine to continuously listen for messages and update the console
	<-done
	go console.LoadMessages(w)
	// Initiate WebSocket connection
	go connectWebSocket(console, printManager, auth_message)
	// Start message sender
	go sendMessageWorker(console)
	// go getPrintQueue(console)
	go getAllPrintServiceLogs(console, printManager)
	go monitorPrintQueueService(printManager, console)
	go PingPong()
	// Start the Gio event loop
	go weightdimensionMachineManager.StartMachine(console)
	go InitWebServer()
	app.Main()
}
