// printer.go
package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/StackExchange/wmi"
)

// Constants for Printer Status
const (
	PRINTER_STATUS_OFFLINE    = 7
	PRINTER_STATUS_IDLE       = 3
	PRINTER_STATUS_PRINTING   = 4
	PRINTER_STATUS_WARMING_UP = 5
	PRINTER_ATTRIBUTE_LOCAL   = 0x40
	PRINTER_ATTRIBUTE_NETWORK = 0x10
	PRINTER_ATTRIBUTE_FAX     = 0x2000
)

// Win32Printer represents the WMI Win32_Printer class
type Win32Printer struct {
	Name          string
	PortName      string
	DriverName    string
	Network       bool
	Local         bool
	Shared        bool
	Default       bool
	PrinterStatus uint16
	Attributes    uint32
}

// PrinterStatus represents the status of a printer
type PrinterStatus struct {
	Name     string
	Status   uint16
	IP       string // Optional: Not available via WMI, can be left empty or populated via other means
	PortName string
}

// isPhysicalPrinter determines if a printer is physical based on its name and attributes
func isPhysicalPrinter(p Win32Printer) bool {
	virtualPrinters := []string{
		"Microsoft Print to PDF",
		"Microsoft XPS Document Writer",
		"OneNote",
		"Fax",
	}
	for _, virtualPrinter := range virtualPrinters {
		if p.Name == virtualPrinter || containsIgnoreCase(p.Name, virtualPrinter) {
			return false
		}
	}
	if (p.Attributes & PRINTER_ATTRIBUTE_FAX) != 0 {
		return false
	}
	if (p.Attributes&PRINTER_ATTRIBUTE_LOCAL) != 0 || (p.Attributes&PRINTER_ATTRIBUTE_NETWORK) != 0 {
		return true
	}
	return false
}

// containsIgnoreCase checks if substr is present in str, case-insensitive
func containsIgnoreCase(str, substr string) bool {
	return strings.Contains(strings.ToLower(str), strings.ToLower(substr))
}

// getPrinterStatusText converts printer status code to human-readable text
func getPrinterStatusText(printer Win32Printer) string {
	switch printer.PrinterStatus {
	case PRINTER_STATUS_OFFLINE:
		return "Offline"
	case PRINTER_STATUS_IDLE:
		return "Idle"
	case PRINTER_STATUS_PRINTING:
		return "Printing"
	case PRINTER_STATUS_WARMING_UP:
		return "Warming Up"
	default:
		return "Unknown Status"
	}
}

// getAllPhysicalPrinters retrieves all physical printers using WMI
func getAllPhysicalPrinters(console *Console) ([]PrinterStatus, error) {
	var printers []Win32Printer
	query := "SELECT * FROM Win32_Printer"
	err := wmi.Query(query, &printers)
	if err != nil {
		return nil, fmt.Errorf("failed to query printers: %v", err)
	}

	if len(printers) == 0 {
		return nil, fmt.Errorf("no printers found")
	}

	var availablePrinters []PrinterStatus
	for _, p := range printers {
		if isPhysicalPrinter(p) {
			printerStatus := PrinterStatus{
				Name:     p.Name,
				Status:   p.PrinterStatus,
				IP:       "", // IP not available via WMI; can be enhanced if needed
				PortName: p.PortName,
			}
			statusText := getPrinterStatusText(p)
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Printer: %s, Status: %s", p.Name, statusText),
				Color: colorNRGBA(0, 255, 0, 255), // Green
			}
			if strings.HasPrefix(p.PortName, "USB") || strings.HasPrefix(p.PortName, "LPT") || strings.HasPrefix(p.Name, "RICOH") {
				availablePrinters = append(availablePrinters, printerStatus)
			}
		}
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Found %d physical printers", len(availablePrinters)),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
	for _, p := range availablePrinters {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Printer: %s, PortName: %s", p.Name, p.PortName),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}
	}
	return availablePrinters, nil
}

// StartPrinterDiscovery starts the printer discovery process periodically using WMI
func StartPrinterDiscovery(interval time.Duration, console *Console, printersChan chan<- []PrinterStatus) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		console.MsgChan <- Message{
			Text:  "Starting printer discovery via WMI...",
			Color: colorNRGBA(30, 144, 255, 255), // Blue
		}
		printersList, err := getAllPhysicalPrinters(console)
		if err != nil {
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Printer discovery failed: %v", err),
				Color: colorNRGBA(255, 40, 0, 255), // Red
			}
		} else {
			printersChan <- printersList
		}
		<-ticker.C
	}
}
