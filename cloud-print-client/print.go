package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/gob"
	"errors"
	"fmt"
	"image"
	"image/color"
	"io"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"

	mathrand "math/rand"

	"github.com/unidoc/unipdf/v3/model"
	"github.com/unidoc/unipdf/v3/render"
)

var query_auto_print_log = true

// PrintJob represents a print job with necessary details
type PrintJob struct {
	PrinterName string
	Data        []byte // Data to be printed
	Token       string // Job token
	Width       float64
	Height      float64
	JobID       string
	Event       string
	Barcode     string
	Mashul      string
	Weight      string
}

const (
	// PRINT_EVENT_JOB_QUEUED is the event for a print job being queued
	PRINT_EVENT_JOB_QUEUED = "job-queued"
	// PRINT_EVENT_JOB_STARTED is the event for a spooling job
	PRINT_EVENT_JOB_STARTED = "job-spooling"
	// PRINT_EVENT_JOB_PRINTING is the event for a print job being printed
	PRINT_EVENT_JOB_PRINTING = "job-printing"
	// PRINT_EVENT_JOB_RENDERING is the event for a print job being rendered
	PRINT_EVENT_JOB_RENDERING = "job-rendering"
	// PRINT_EVENT_JOB_COMPLETED is the event for a print job being completed
	PRINT_EVENT_JOB_COMPLETED = "job-completed"
	// PRINT_EVENT_JOB_FAILED is the event for a print job failing
	PRINT_EVENT_JOB_FAILED = "job-failed"

	PRINT_EVENT_JOB_IGNORE = "job-ignore"
)

type PrintEvent struct {
	JobID          string
	QueueID        int
	QueueTime      time.Time
	EventQueued    string
	EventSpooling  string
	EventPrinting  string
	EventRendering string
	EventCompleted string
	EventFailed    string
}

type LastPrintEvent struct {
	JobID     string
	QueueID   int
	QueueTime time.Time
}

// jobConfig for UniPDF processing (DEPRECATED - kept for legacy compatibility)
// type jobConfig struct {
// 	printerName string
// 	pdfPath     string
// 	dpi         int
// 	widthMm     float64
// 	heightMm    float64
// 	quiet       bool
// 	totalPages  int
// 	saveOutput  bool
// }

// Define the struct to hold the parsed event log data
type WindowsPrintEventLog struct {
	LogName     string
	Source      string
	Date        time.Time
	EventID     int
	Task        string
	Level       string
	Opcode      string
	Keyword     string
	User        string
	UserName    string
	Computer    string
	Description string
	QueueID     int // New field for queue ID
}

var printEventTracker = sync.Map{}
var eck = []byte("ozi0o2wDwDO1fSgEvk9RElJbyFU25ike") // Must be 16, 24, or 32 bytes

// PrintManager is responsible for managing print jobs
type PrintManager struct {
	jobQueue chan PrintJob
	mu       sync.Mutex
}

// NewPrintManager initializes a new PrintManager with a specified buffer size
func NewPrintManager(bufferSize int) *PrintManager {
	print_mngr := PrintManager{
		jobQueue: make(chan PrintJob, bufferSize),
	}

	return &print_mngr
}

// Start begins processing print jobs from the jobQueue
func (pm *PrintManager) Start(console *Console) {
	// Check print service logging status without trying to enable automatically
	enabled, err := CheckPrintLoggingStatus()
	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Warning: Cannot check print logging status: %v", err),
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
	} else if !enabled {
		console.MsgChan <- Message{
			Text:  "Print Service logging is disabled. Some print tracking features may not work properly.",
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
		console.MsgChan <- Message{
			Text:  "Click 'Enable Print Logging' button in the UI to enable it, or run enable_print_logging.ps1 as Administrator",
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
	}

	err = loadFromEncryptedFile("evnts.bin", eck)
	if err != nil {
		fmt.Println("Error loading print events:", err)
	} else {
		console.MsgChan <- Message{
			Text:  "Print events loaded successfully",
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}
		printEventTracker.Range(func(key, value interface{}) bool {
			print_event := value.(PrintEvent)
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Job: %s, Print ID: %d", print_event.JobID, print_event.QueueID),
				Color: colorNRGBA(0, 255, 255, 255), // Cyan
			}
			return true
		})
	}
	go func() {
		for job := range pm.jobQueue {

			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Processing print job for printer: %s", job.PrinterName),
				Color: colorNRGBA(0, 255, 255, 255), // Cyan
			}
			pm.processPrintJob(job, console)

		}

	}()
}

// handlePrintJob adds a new print job to the queue
func (pm *PrintManager) handlePrintJob(job PrintJob, console *Console) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.jobQueue <- job
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Print job for printer '%s' added to queue.", job.PrinterName),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
}

// processPrintJob processes a print job using our new UniPDF method with print event tracking
func (pm *PrintManager) processPrintJob(job PrintJob, console *Console) {
	query_auto_print_log = false

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Starting UniPDF processing for job: %s", job.JobID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Get print queue before processing (for tracking)
	last_print_event, p_err := pm.getPrintLastQueue(job.JobID, console)
	last_print_event_found := true
	if p_err != nil {
		log.Println(p_err)
		last_print_event_found = false
	}

	// Process with our new UniPDF method
	err := pm.processWithUniPDF(job, console)

	query_auto_print_log = true

	if err != nil {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Error printing job %s: %v", job.JobID, err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
		// return a json response with error message
		outgoingMessages <- OutGoingLog{JobID: job.JobID, Event: "print-failed", Message: fmt.Sprintf("Error printing file: %v", err)}
		return
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Successfully processed job %s", job.JobID),
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	// Bind print queue for event tracking
	pm.attachPrintQueue(last_print_event, console, last_print_event_found)

	if job.Event == "live-print" || job.Event == "specimen-print" {
		now_time := getNowTime()
		print_history := PrintHistory{Barcode: job.Barcode + "  ", Mashul: job.Mashul + "  ", Weight: job.Weight + "  ", Time: now_time}
		addPrintHistory(print_history)
	}
}

// processWithUniPDF processes PDF using optimized in-memory UniPDF rendering
func (pm *PrintManager) processWithUniPDF(job PrintJob, console *Console) error {
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Processing PDF from memory (%.1f\" x %.1f\")", job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Create PDF reader directly from byte data
	pdfReader, err := model.NewPdfReader(bytes.NewReader(job.Data))
	if err != nil {
		return fmt.Errorf("failed to create PDF reader: %w", err)
	}

	// Count PDF pages
	numPages, err := pdfReader.GetNumPages()
	if err != nil {
		return fmt.Errorf("failed to count PDF pages: %w", err)
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Processing %d pages for job %s (%.1f\" x %.1f\", %.1fmm x %.1fmm)", numPages, job.JobID, job.Width, job.Height, job.Width*25.4, job.Height*25.4),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Process PDF pages with optimized in-memory method
	return pm.processPDFPagesInMemory(pdfReader, numPages, job, console)
}

// processPDFPagesInMemory processes PDF pages entirely in memory with proper size calculation
func (pm *PrintManager) processPDFPagesInMemory(pdfReader *model.PdfReader, numPages int, job PrintJob, console *Console) error {
	// Brother printers: Use direct PDF printing via Ghostscript DLL (fastest method)
	if strings.Contains(strings.ToLower(job.PrinterName), "brother") ||
		strings.Contains(strings.ToLower(job.PrinterName), "td-") {

		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Brother printer detected: printing PDF directly via Ghostscript DLL (%.1f\"×%.1f\", %d pages)", job.Width, job.Height, numPages),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}

		log.Printf("Brother TD-4000: Direct PDF printing - bypassing image conversion")
		err := pm.printBrotherPDFFromJobData(job.PrinterName, job)
		if err != nil {
			return fmt.Errorf("Brother direct PDF printing failed: %v", err)
		}

		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Brother printer: Successfully printed %d pages directly from PDF", numPages),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}

		return nil
	}

	// Check if thermal printer first - they always use 300 DPI for compatibility
	isThermalPrinter := strings.Contains(strings.ToLower(job.PrinterName), "tsc") ||
		strings.Contains(strings.ToLower(job.PrinterName), "brother") ||
		strings.Contains(strings.ToLower(job.PrinterName), "td-") ||
		strings.Contains(strings.ToLower(job.PrinterName), "ql-") ||
		strings.Contains(strings.ToLower(job.PrinterName), "pt-")

	if isThermalPrinter {
		// Thermal printers: always render at 300 DPI for best quality and compatibility
		dpi := 300
		widthPx := int(job.Width * float64(dpi))
		heightPx := int(job.Height * float64(dpi))
		console.MsgChan <- Message{
			Text: fmt.Sprintf("Thermal printer: rendering at fixed 300 DPI (%dpx x %dpx for %.1f\" x %.1f\")",
				widthPx, heightPx, job.Width, job.Height),
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}
		return pm.processPDFPagesWithFixedDPI(pdfReader, numPages, job, console, widthPx, heightPx)
	}

	// Regular printers: render at printer's native DPI capability
	printerNamePtr, _ := syscall.UTF16PtrFromString(job.PrinterName)
	winspool16Ptr, _ := syscall.UTF16PtrFromString("WINSPOOL")
	hDC, _, _ := procCreateDC.Call(
		uintptr(unsafe.Pointer(winspool16Ptr)),
		uintptr(unsafe.Pointer(printerNamePtr)),
		0, 0)
	if hDC == 0 {
		console.MsgChan <- Message{
			Text:  "Warning: Could not get printer DC for sizing, using 300 DPI fallback",
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
		// Fallback to 300 DPI calculation
		dpi := 300
		widthPx := int(job.Width * float64(dpi))
		heightPx := int(job.Height * float64(dpi))
		console.MsgChan <- Message{
			Text: fmt.Sprintf("Fallback: rendering at fixed 300 DPI (%dpx x %dpx for %.1f\" x %.1f\")",
				widthPx, heightPx, job.Width, job.Height),
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}
		return pm.processPDFPagesWithFixedDPI(pdfReader, numPages, job, console, widthPx, heightPx)
	}
	defer procDeleteDC.Call(hDC)

	// Get actual printer DPI and render at native DPI
	printerDpiX, _, _ := procGetDeviceCaps.Call(hDC, LOGPIXELSX)
	printerDpiY, _, _ := procGetDeviceCaps.Call(hDC, LOGPIXELSY)

	// Calculate target print size in pixels using actual printer DPI
	// job.Width and job.Height are in inches
	widthPx := int(job.Width * float64(printerDpiX))
	heightPx := int(job.Height * float64(printerDpiY))

	console.MsgChan <- Message{
		Text: fmt.Sprintf("Regular printer: rendering at native DPI %dx%d (%dpx x %dpx for %.1f\" x %.1f\")",
			printerDpiX, printerDpiY, widthPx, heightPx, job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	return pm.processPDFPagesWithFixedDPI(pdfReader, numPages, job, console, widthPx, heightPx)
}

// processPDFPagesWithFixedDPI processes PDF pages with specified pixel dimensions - batch render then print
func (pm *PrintManager) processPDFPagesWithFixedDPI(pdfReader *model.PdfReader, numPages int, job PrintJob, console *Console, widthPx, heightPx int) error {

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Batch rendering %d pages for job %s (%.1f\" x %.1f\")", numPages, job.JobID, job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Step 1: Batch render all pages first
	renderedPages := make([]*image.Gray, numPages)
	for pageNum := 1; pageNum <= numPages; pageNum++ {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Rendering page %d/%d...", pageNum, numPages),
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}

		// Render PDF page to monochrome image
		img, err := pm.renderPDFPageToMonochrome(pdfReader, pageNum, widthPx, heightPx)
		if err != nil {
			return fmt.Errorf("render page %d: %w", pageNum, err)
		}
		renderedPages[pageNum-1] = img
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("All pages rendered, now printing %d pages...", numPages),
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	// Step 2: Print all rendered pages
	for pageNum, img := range renderedPages {
		actualPageNum := pageNum + 1
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Printing page %d/%d...", actualPageNum, numPages),
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}

		// Check if this is the last page for page cut
		isLastPage := actualPageNum == numPages

		// Print using universal Windows printing with safe page cut
		if err := pm.printImageUniversalWithSafeCut(img, job.PrinterName, actualPageNum, job.JobID, job, isLastPage, console); err != nil {
			return fmt.Errorf("print page %d: %w", actualPageNum, err)
		}

		console.MsgChan <- Message{
			Text:  fmt.Sprintf("✓ Page %d printed successfully", actualPageNum),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}
	}

	return nil
}

// Removed unused thermal printer functions - using universal printing instead

// renderPDFPageToMonochrome renders PDF directly at target DPI without scaling
func (pm *PrintManager) renderPDFPageToMonochrome(pdfReader *model.PdfReader, pageNum, widthPx, heightPx int) (*image.Gray, error) {
	page, err := pdfReader.GetPage(pageNum)
	if err != nil {
		return nil, fmt.Errorf("get page %d: %w", pageNum, err)
	}

	// Render directly at target dimensions - no scaling needed
	device := render.NewImageDevice()
	device.OutputWidth = widthPx

	// Render at target DPI directly
	img, err := device.Render(page)
	if err != nil {
		return nil, fmt.Errorf("render page %d at target DPI: %w", pageNum, err)
	}

	// Convert to grayscale using standard library for best quality
	bounds := img.Bounds()
	grayImg := image.NewGray(bounds)

	// Use Go's standard color conversion for highest quality
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			originalColor := img.At(x, y)
			grayColor := color.GrayModel.Convert(originalColor)
			grayImg.Set(x, y, grayColor)
		}
	}

	return grayImg, nil
}

// scaleGrayscaleImage scales grayscale image using high-quality bilinear interpolation

// printImageUniversalWithSafeCut prints grayscale image with safe page cut approach
func (pm *PrintManager) printImageUniversalWithSafeCut(img *image.Gray, printerName string, pageNum int, jobID string, job PrintJob, isLastPage bool, console *Console) error {
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Sending page %d directly to printer '%s' for job %s", pageNum, printerName, jobID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Check printer type and route accordingly
	isTSCPrinter := strings.Contains(strings.ToLower(printerName), "tsc")
	if isTSCPrinter {
		// Route to TSC thermal printer TSPL method
		log.Printf("Routing to TSC thermal printer TSPL method for: %s", printerName)
		// processedImg := pm.enhanceImageForThermalPrinter(img)
		return pm.printImageTSCThermal(img, printerName, pageNum, jobID, job, console)

	} else {
		// Route to GDI method for regular printers only
		log.Printf("Routing to GDI method for regular printer: %s", printerName)
		return pm.printImageDirectlyWithGDI(img, printerName, jobID, job, isLastPage)
	}

	return nil
}

// enhanceImageForThermalPrinter converts grayscale image to high-contrast for thermal printers
func (pm *PrintManager) enhanceImageForThermalPrinter(img *image.Gray) *image.Gray {
	bounds := img.Bounds()
	enhanced := image.NewGray(bounds)

	// Convert to high-contrast black and white for thermal printing
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			pixel := img.GrayAt(x, y)
			// Use better threshold for thermal printers - 128 is middle gray
			if pixel.Y < 128 { // Anything darker than middle gray becomes black
				enhanced.SetGray(x, y, color.Gray{Y: 0}) // Black
			} else {
				enhanced.SetGray(x, y, color.Gray{Y: 255}) // White
			}
		}
	}

	log.Printf("Enhanced image for thermal printer: %dx%d pixels converted to high-contrast",
		bounds.Dx(), bounds.Dy())
	return enhanced
}

// sendBrotherCutAfterPrint sends separate cut command after GDI print completes

// printImageTSCThermal handles TSC thermal printer printing with TSPL commands
func (pm *PrintManager) printImageTSCThermal(img *image.Gray, printerName string, pageNum int, jobID string, job PrintJob, console *Console) error {
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Sending page %d to TSC thermal printer '%s' for job %s", pageNum, printerName, jobID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Open TSC thermal printer using Windows API with proper document setup
	printerNamePtr, _ := syscall.UTF16PtrFromString(printerName)
	var hPrinter syscall.Handle
	ret, _, _ := procOpenPrinter.Call(
		uintptr(unsafe.Pointer(printerNamePtr)),
		uintptr(unsafe.Pointer(&hPrinter)),
		0)
	if ret == 0 {
		return fmt.Errorf("failed to open TSC thermal printer '%s'", printerName)
	}
	defer procClosePrinter.Call(uintptr(hPrinter))

	// Start document for TSC thermal printer
	jobNamePtr, _ := syscall.UTF16PtrFromString(fmt.Sprintf("TSC Print Job %s", jobID))
	datatypePtr, _ := syscall.UTF16PtrFromString("RAW")

	docInfo := struct {
		pDocName    *uint16
		pOutputFile *uint16
		pDatatype   *uint16
	}{
		pDocName:  jobNamePtr,
		pDatatype: datatypePtr,
	}

	ret, _, _ = procStartDocPrinter.Call(
		uintptr(hPrinter),
		1,
		uintptr(unsafe.Pointer(&docInfo)))
	if ret == 0 {
		return fmt.Errorf("failed to start TSC document")
	}
	defer procEndDocPrinter.Call(uintptr(hPrinter))

	// Start page for TSC thermal printer
	ret, _, _ = procStartPagePrinter.Call(uintptr(hPrinter))
	if ret == 0 {
		return fmt.Errorf("failed to start TSC page")
	}
	defer procEndPagePrinter.Call(uintptr(hPrinter))

	// Use the original working convertImageToTSPL function (centered positioning works)
	tsplData := convertImageToTSPL(img)

	// Send TSPL data to TSC thermal printer
	var bytesWritten uint32
	ret, _, _ = procWritePrinter.Call(
		uintptr(hPrinter),
		uintptr(unsafe.Pointer(&tsplData[0])),
		uintptr(len(tsplData)),
		uintptr(unsafe.Pointer(&bytesWritten)))

	if ret == 0 {
		return fmt.Errorf("failed to write to TSC thermal printer")
	}

	log.Printf("Sent %d bytes to TSC thermal printer %s", bytesWritten, printerName)
	log.Printf("Successfully sent TSC thermal print job to %s", printerName)
	return nil
}

// printBrotherPDFFromJobData prints PDF directly from job.Data using Ghostscript DLL
func (pm *PrintManager) printBrotherPDFFromJobData(printerName string, job PrintJob) error {
	log.Printf("Brother TD-4000: Ghostscript printing with 0.9 scaling fix")

	// Ghostscript path
	gsPath := "./bin/gswin64c.exe"

	// Calculate dimensions with 0.9 scaling to fix zoom issue
	scaledWidth := job.Width * 1.0   // Apply 0.9 scaling
	scaledHeight := job.Height * 1.0 // Apply 0.9 scaling

	// Ghostscript command with 0.9 scaling
	cmd := exec.Command(
		gsPath,
		"-dBATCH",                            // Exit after processing
		"-dNOPAUSE",                          // Don't pause between pages
		"-dQUIET",                            // Suppress normal output
		"-sDEVICE=mswinpr2",                  // Use Windows printer device
		"-sOutputFile=%printer%"+printerName, // Output to the specified printer
		"-dDEVICEWIDTHPOINTS="+fmt.Sprintf("%.2f", scaledWidth*72),   // Scaled width in points
		"-dDEVICEHEIGHTPOINTS="+fmt.Sprintf("%.2f", scaledHeight*72), // Scaled height in points
		"-r300",           // Set DPI to 300
		"-dFIXEDMEDIA",    // Fix media size (avoid scaling)
		"-dPDFFitPage",    // Fit the PDF to the page size
		"-dTrimMargin=0",  // Set trimming margin to zero
		"-dMargin=0",      // Set margin to zero
		"-dNoOutputFonts", // Optimize for output without font adjustments
		"-",               // Read from stdin
	)

	// Set the input data as the standard input for the command
	cmd.Stdin = bytes.NewReader(job.Data)

	// Suppress console window when executing Ghostscript
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	log.Printf("Brother TD-4000: Processing %d bytes with 0.9 scaling (%.2f\"x%.2f\" -> %.2f\"x%.2f\")",
		len(job.Data), job.Width, job.Height, scaledWidth, scaledHeight)

	// Run the command
	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("ghostscript processing with 0.9 scaling failed: %v", err)
	}

	log.Printf("Brother TD-4000: Ghostscript print successful with 0.9 scaling!")
	return nil
}

// convertImageToTSPL converts an image to TSPL format with dynamic dimensions (original working version for TSC)
func convertImageToTSPL(img *image.Gray) []byte {
	var buf bytes.Buffer
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Calculate actual dimensions from image size at 300 DPI
	// At 300 DPI: 1 inch = 300 pixels, 1 mm = 11.811 pixels
	widthMm := float64(width) * 25.4 / 300.0   // Convert pixels to mm
	heightMm := float64(height) * 25.4 / 300.0 // Convert pixels to mm

	// TSPL header with dynamic dimensions
	buf.WriteString(fmt.Sprintf("SIZE %.1f mm, %.1f mm\n", widthMm, heightMm))
	buf.WriteString("DIRECTION 1\n")
	buf.WriteString("CLS\n")

	// Calculate bytes per row (must be multiple of 8)
	bytesPerRow := (width + 7) / 8

	// BITMAP command (TSC centers automatically with this approach)
	buf.WriteString(fmt.Sprintf("BITMAP 0,0,%d,%d,0,", bytesPerRow, height))

	// Convert image to 1-bit bitmap data
	for y := 0; y < height; y++ {
		for byteIdx := 0; byteIdx < bytesPerRow; byteIdx++ {
			var byteVal uint8
			for bit := 0; bit < 8; bit++ {
				x := byteIdx*8 + bit
				if x < width {
					pixel := img.GrayAt(x, y).Y
					if pixel >= 128 { // White pixel (inverted for thermal printer)
						byteVal |= (1 << (7 - bit))
					}
				}
			}
			buf.WriteByte(byteVal)
		}
	}

	buf.WriteString("\nPRINT 1\n")
	return buf.Bytes()
}

func getNowTime() string {
	now := time.Now()
	now_time := now.Format("02 Jan 2006, 03:04:05 PM")
	return now_time
}

func testPrint(console *Console, printManager *PrintManager, printCmd *PrintCommand) {
	selectedPrinter := printerList.Value
	pdfData, err := downloadPDF("test-print", "", "")
	if err == nil {
		printJob := PrintJob{
			PrinterName: selectedPrinter,
			Data:        pdfData,
			Token:       "test-print",
			Width:       printCmd.Width,
			Height:      printCmd.Height,
			JobID:       "test-print",
			Event:       "test-print",
			Barcode:     printCmd.Barcode,
			Mashul:      printCmd.Mashul,
			Weight:      printCmd.Weight,
		}
		printManager.handlePrintJob(printJob, console)

	} else {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Failed to download PDF: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
	}
}

func LivePrint(console *Console, printManager *PrintManager, printCmd *PrintCommand) {
	selectedPrinter := printerList.Value
	pdfData, err := downloadPDF("print", printCmd.JobID, printCmd.JobToken)
	if err == nil {
		printJob := PrintJob{
			PrinterName: selectedPrinter,
			Data:        pdfData,
			Token:       "live-print",
			Width:       printCmd.Width,
			Height:      printCmd.Height,
			JobID:       printCmd.JobID,
			Event:       "live-print",
			Barcode:     printCmd.Barcode,
			Mashul:      printCmd.Mashul,
			Weight:      printCmd.Weight,
		}
		printManager.handlePrintJob(printJob, console)
		outgoinglog := OutGoingLog{JobID: printCmd.JobID, Event: "live-print-sent-to-printer", Message: "Live Print job sent to printer"}
		outgoingMessages <- outgoinglog
	} else {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Failed to download live PDF: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
		outgoinglog := OutGoingLog{JobID: printCmd.JobID, Event: "live-pdf-download-failed", Message: "Failed to download live pdf"}
		outgoingMessages <- outgoinglog
	}
}

func SpecimenPrint(console *Console, printManager *PrintManager, printCmd *PrintCommand) {
	selectedPrinter := printerList.Value
	pdfData, err := downloadPDF("specimen-print", printCmd.JobID, printCmd.JobToken)
	if err == nil {
		printJob := PrintJob{
			PrinterName: selectedPrinter,
			Data:        pdfData,
			Token:       "specimen-print",
			Width:       printCmd.Width,
			Height:      printCmd.Height,
			JobID:       printCmd.JobID,
			Event:       "specimen-print",
			Barcode:     printCmd.Barcode,
			Mashul:      printCmd.Mashul,
			Weight:      printCmd.Weight,
		}
		printManager.handlePrintJob(printJob, console)
		outgoinglog := OutGoingLog{JobID: printCmd.JobID, Event: "specimen-print-sent-to-printer", Message: "Specimen Print job sent to printer"}
		outgoingMessages <- outgoinglog
	} else {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Failed to download live PDF: %v", err),
			Color: colorNRGBA(255, 40, 0, 255), // Red
		}
		outgoinglog := OutGoingLog{JobID: printCmd.JobID, Event: "specimen-pdf-download-failed", Message: "Failed to download Specimen pdf"}
		outgoingMessages <- outgoinglog
	}
}

func (pm *PrintManager) attachPrintQueue(last_print_event LastPrintEvent, console *Console, last_print_event_found bool) {

	if !last_print_event_found {
		time.Sleep(3 * time.Second)
	}

	// selectedPrinter := printerList.Value // Ensure this is the correct printer name
	// sanitizedPrinter := strings.ReplaceAll(selectedPrinter, " ", "%20")

	// XML query for wevtutil (no time constraint, just print service logs)
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Binding print queue for job: %s", last_print_event.JobID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
	loop_count := 1
	event_found := false

	for {
		time.Sleep(300 * time.Millisecond)

		log.Println("Binding Loop Count: ", loop_count)

		query_time := 3600000 * loop_count
		if loop_count > 10 {
			query_time = 360000000 * loop_count
		}

		// Generate a random integer between 0 and 9999 to not get cached query
		query_time += mathrand.Intn(1000)

		// console.MsgChan <- Message{
		// 	Text:  fmt.Sprintf("Loop Count: %d", loop_count),
		// 	Color: colorNRGBA(0, 255, 255, 255), // Cyan
		// }

		xmlQuery := fmt.Sprintf(`
<QueryList>
  <Query Id="0" Path="Microsoft-Windows-PrintService/Operational">
    <Select Path="Microsoft-Windows-PrintService/Operational">*[System[Provider[@Name='Microsoft-Windows-PrintService'] and (Level=1  or Level=2 or Level=3 or Level=4 or Level=0) and ( Task = 11 or Task = 12 or Task = 14 or Task = 15 or Task = 22 or Task = 23 or Task = 24 or Task = 26 or Task = 27 or Task = 43 ) and TimeCreated[timediff(@SystemTime) &lt;= %d]]]</Select>
  </Query>
</QueryList>`, query_time)

		// Run the wevtutil command to get the logs
		cmd := exec.Command("wevtutil", "qe", "Microsoft-Windows-PrintService/Operational", "/q:"+xmlQuery, "/f:Text")
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		// Capture the output
		output, err := cmd.CombinedOutput()
		if err != nil {
			console.MsgChan <- Message{
				Text: fmt.Sprintf("Failed to query print events: %v", err),
				//bright pink color
				Color: colorNRGBA(255, 105, 180, 255),
			}
		}

		// log.Println("Output: ", string(output))

		// If no events are returned, inform the user
		if len(output) > 0 {

			// Parse the logs
			events, err := parsePrintServiceEvents(string(output))
			if err != nil {
				fmt.Println("Error:", err)

			}

			queue_id := 0
			queue_time := time.Now()

			previous_print_event_found := false
			// Print the parsed events
			for _, event := range events {

				eventConstant, queueID, err := extractQueueIDAndEvent(event.Description)
				if err != nil {
					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Error extracting event type: %v", err),
						Color: colorNRGBA(255, 40, 0, 255), // Red
					}
					continue
				}

				switch eventConstant {
				case PRINT_EVENT_JOB_STARTED:
					if last_print_event_found {
						if queueID == last_print_event.QueueID && event.Date.Equal(last_print_event.QueueTime) {
							previous_print_event_found = true
						}
						if previous_print_event_found && event.Date.After(last_print_event.QueueTime) {
							queue_id = queueID
							queue_time = event.Date
						}
					} else {

						queue_id = queueID
						queue_time = event.Date
					}

				}

				if queue_id > 0 {

					log.Printf("Attached Queue ID: %d, Attached Queue Time: %s , Job ID: %s", queue_id, queue_time, last_print_event.JobID)

					found_print_event := PrintEvent{JobID: last_print_event.JobID, QueueID: queue_id, QueueTime: queue_time}
					event_found = true
					printEventTracker.Store(strconv.Itoa(queueID), found_print_event)
					err := saveToEncryptedFile("evnts.bin", eck)
					if err != nil {
						log.Println("Error saving print event to file:", err)
					}
					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Print queue attached for job: %s, QueueID: %d", last_print_event.JobID, queue_id),
						Color: colorNRGBA(0, 255, 255, 255), // Cyan
					}

					break
				}
			}

		}
		loop_count++
		if loop_count > 20 || event_found {
			if !event_found {
				console.MsgChan <- Message{
					Text:  fmt.Sprintf("Print queue not attached for job: %s", last_print_event.JobID),
					Color: colorNRGBA(255, 40, 0, 255), // Red
				}
				outgoingMessages <- OutGoingLog{JobID: last_print_event.JobID, Event: "print-queue-not-attached", Message: "Print queue not attached"}
			}
			break
		}
	}
}

// getPrintQueue retrieves the print queue for a specific printer
func (pm *PrintManager) getPrintLastQueue(job_id string, console *Console) (LastPrintEvent, error) {

	// selectedPrinter := printerList.Value // Ensure this is the correct printer name
	// sanitizedPrinter := strings.ReplaceAll(selectedPrinter, " ", "%20")

	// XML query for wevtutil (no time constraint, just print service logs)
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Getting print queue for job: %s", job_id),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
	loop_count := 1
	event_found := false
	last_print_event := LastPrintEvent{JobID: job_id}
	for {
		log.Println("Loop Count: ", loop_count)

		query_time := 3600000 * loop_count
		if loop_count > 10 {
			query_time = 360000000 * loop_count
		}

		// Generate a random integer between 0 and 9999 to not get cached query
		query_time += mathrand.Intn(1000)

		// console.MsgChan <- Message{
		// 	Text:  fmt.Sprintf("Loop Count: %d", loop_count),
		// 	Color: colorNRGBA(0, 255, 255, 255), // Cyan
		// }

		xmlQuery := fmt.Sprintf(`
<QueryList>
  <Query Id="0" Path="Microsoft-Windows-PrintService/Operational">
    <Select Path="Microsoft-Windows-PrintService/Operational">*[System[Provider[@Name='Microsoft-Windows-PrintService'] and (Level=1  or Level=2 or Level=3 or Level=4 or Level=0) and ( Task = 11 or Task = 12 or Task = 14 or Task = 15 or Task = 22 or Task = 23 or Task = 24 or Task = 26 or Task = 27 or Task = 43 ) and TimeCreated[timediff(@SystemTime) &lt;= %d]]]</Select>
  </Query>
</QueryList>`, query_time)

		// Run the wevtutil command to get the logs
		cmd := exec.Command("wevtutil", "qe", "Microsoft-Windows-PrintService/Operational", "/q:"+xmlQuery, "/f:Text")
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		// Capture the output
		output, err := cmd.CombinedOutput()
		if err != nil {
			console.MsgChan <- Message{
				Text: fmt.Sprintf("Failed to query print events: %v", err),
				//bright pink color
				Color: colorNRGBA(255, 105, 180, 255),
			}
		}

		// log.Println("Output: ", string(output))

		// If no events are returned, inform the user
		if len(output) > 0 {

			// Parse the logs
			events, err := parsePrintServiceEvents(string(output))
			if err != nil {
				fmt.Println("Error:", err)

			}

			last_queue_id := 0
			last_queue_time := time.Now()

			// Print the parsed events
			for _, event := range events {

				eventConstant, queueID, err := extractQueueIDAndEvent(event.Description)
				if err != nil {
					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Error extracting event type: %v", err),
						Color: colorNRGBA(255, 40, 0, 255), // Red
					}
					continue
				}

				switch eventConstant {
				case PRINT_EVENT_JOB_STARTED:
					if event.Date.After(last_queue_time) {
						last_queue_id = queueID
						last_queue_time = event.Date
					}

				}

			}

			if last_queue_id > 0 {

				log.Printf("Last Queue ID: %d, Last Queue Time: %s", last_queue_id, last_queue_time)

				last_print_event = LastPrintEvent{JobID: job_id, QueueID: last_queue_id, QueueTime: last_queue_time}
				event_found = true

			}
		}

		loop_count++
		if loop_count > 20 || event_found {
			log.Println("Event Found: ", event_found)
			break
		}
		time.Sleep(300 * time.Millisecond)
	}

	if event_found {
		log.Println("Last Print Event: ", last_print_event)
		return last_print_event, nil
	}

	return last_print_event, errors.New("last print event not found")
}

func getAllPrintServiceLogs(console *Console) {
	for {

		// Sleep for 200 ms before checking for new events
		time.Sleep(200 * time.Millisecond)

		isEmpty := true
		printEventTracker.Range(func(key, value interface{}) bool {
			isEmpty = false
			return false // Stop iteration early since we only need to check if it's non-empty
		})

		if isEmpty {
			continue
		}

		if !query_auto_print_log {
			time.Sleep(250 * time.Millisecond)
			continue
		}

		// XML query for wevtutil (no time constraint, just print service logs)
		xmlQuery := `
<QueryList>
  <Query Id="0" Path="Microsoft-Windows-PrintService/Operational">
    <Select Path="Microsoft-Windows-PrintService/Operational">*[System[Provider[@Name='Microsoft-Windows-PrintService'] and (Level=1  or Level=2 or Level=3 or Level=4 or Level=0) and ( Task = 11 or Task = 12 or Task = 14 or Task = 15 or Task = 22 or Task = 23 or Task = 24 or Task = 26 or Task = 27 or Task = 43 ) and TimeCreated[timediff(@SystemTime) &lt;= 3600000]]]</Select>
  </Query>
</QueryList>`

		// Run the wevtutil command to get the logs
		cmd := exec.Command("wevtutil", "qe", "Microsoft-Windows-PrintService/Operational", "/q:"+xmlQuery, "/f:Text")
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		// Capture the output
		output, err := cmd.CombinedOutput()
		if err != nil {
			console.MsgChan <- Message{
				Text: fmt.Sprintf("Failed to query print events: %v", err),
				//bright pink color
				Color: colorNRGBA(255, 105, 180, 255),
			}
		}

		// If no events are returned, inform the user
		if len(output) > 0 {

			// Parse the logs
			events, err := parsePrintServiceEvents(string(output))
			if err != nil {
				fmt.Println("Error:", err)

			}

			// Print the parsed events
			for _, event := range events {

				if event.QueueID == 0 {
					continue
				}

				delete_event_flag := false
				store_event_flag := false

				if value, ok := printEventTracker.Load(strconv.Itoa(event.QueueID)); ok {

					print_event := value.(PrintEvent) // Type assertion

					eventConstant, queueID, err := extractQueueIDAndEvent(event.Description)
					if err != nil {
						console.MsgChan <- Message{
							Text:  fmt.Sprintf("Error extracting event type: %v", err),
							Color: colorNRGBA(255, 40, 0, 255), // Red
						}
						continue
					}
					if queueID == print_event.QueueID {

						switch eventConstant {
						case PRINT_EVENT_JOB_QUEUED:
							if print_event.EventQueued == "" {
								print_event.EventQueued = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %d Queued at %s", print_event.QueueID, print_event.EventQueued),
									Color: colorNRGBA(0, 255, 0, 255), // Green
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_QUEUED, Message: print_event.EventQueued}
								}
								store_event_flag = true
							}
						case PRINT_EVENT_JOB_STARTED:
							if print_event.EventSpooling == "" {
								print_event.EventSpooling = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %s Spooling at %s", print_event.JobID, print_event.EventSpooling),
									Color: colorNRGBA(0, 255, 0, 255), // Green
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_STARTED, Message: print_event.EventSpooling}
								}
								store_event_flag = true
							}
						case PRINT_EVENT_JOB_PRINTING:
							if print_event.EventPrinting == "" {
								print_event.EventPrinting = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %s Printing at %s", print_event.JobID, print_event.EventPrinting),
									Color: colorNRGBA(0, 255, 0, 255), // Green
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_PRINTING, Message: print_event.EventPrinting}
								}
								store_event_flag = true
							}
						case PRINT_EVENT_JOB_RENDERING:
							if print_event.EventRendering == "" {
								print_event.EventRendering = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %s Rendering at %s", print_event.JobID, print_event.EventRendering),
									Color: colorNRGBA(0, 255, 0, 255), // Green
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_RENDERING, Message: print_event.EventRendering}
								}
								store_event_flag = true
							}
						case PRINT_EVENT_JOB_COMPLETED:
							if print_event.EventCompleted == "" {
								print_event.EventCompleted = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %d Completed at %s", print_event.QueueID, print_event.EventCompleted),
									Color: colorNRGBA(0, 255, 0, 255), // Green
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_COMPLETED, Message: print_event.EventCompleted}
								}
								// Remove the print event from the tracker
								delete_event_flag = true
							}
						case PRINT_EVENT_JOB_FAILED:
							if print_event.EventFailed == "" && print_event.EventCompleted == "" {

								print_event.EventFailed = event.Description
								console.MsgChan <- Message{
									Text:  fmt.Sprintf("Job %d Failed at %s", print_event.QueueID, print_event.EventFailed),
									Color: colorNRGBA(255, 40, 0, 255), // Red
								}
								if print_event.JobID != "test-print" {
									outgoingMessages <- OutGoingLog{JobID: print_event.JobID, Event: PRINT_EVENT_JOB_FAILED, Message: print_event.EventFailed}
								}
								delete_event_flag = true
							}
						}

						if store_event_flag {

							// Store the updated print_event back into the sync.Map
							printEventTracker.Store(strconv.Itoa(event.QueueID), print_event)
							err := saveToEncryptedFile("evnts.bin", eck)
							if err != nil {
								log.Println("Error saving print event to file:", err)
							}
						}

						if delete_event_flag {
							printEventTracker.Delete(strconv.Itoa(event.QueueID))
							err := saveToEncryptedFile("evnts.bin", eck)
							if err != nil {
								log.Println("Error saving print event to file:", err)
							}
						}
					}
				}

			}
		}

	}
}

func parsePrintServiceEvents(logs string) ([]WindowsPrintEventLog, error) {
	var events []WindowsPrintEventLog

	// Split the logs based on "Event[" as a marker (skip the first empty element)
	eventBlocks := strings.Split(logs, "Event[")
	// The first element in the resulting slice will be empty, so start from index 1
	for _, eventBlock := range eventBlocks[1:] {
		// Add the "Event[" back to each block that was split off
		eventBlock = "Event[" + eventBlock
		event, err := parsePrintServiceEvent(eventBlock)
		if err != nil {
			return nil, err
		}
		events = append(events, *event)
	}

	// Return the slice of parsed events
	return events, nil
}

func parsePrintServiceEvent(log string) (*WindowsPrintEventLog, error) {
	// Create an instance of the struct
	event := &WindowsPrintEventLog{}

	// Regular expressions for each field we want to extract
	var err error
	event.LogName, err = extractField(log, `Log Name:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.Source, err = extractField(log, `Source:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	// Parse Date field, using regex and time parsing
	dateStr, err := extractField(log, `Date:\s*(.+)`)
	if err != nil {
		return nil, err
	}
	event.Date, err = time.Parse(time.RFC3339Nano, dateStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse date: %v", err)
	}

	// Parse Event ID
	eventIDStr, err := extractField(log, `Event ID:\s*(\d+)`)
	if err != nil {
		return nil, err
	}
	event.EventID, err = strconv.Atoi(eventIDStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Event ID: %v", err)
	}

	event.Task, err = extractField(log, `Task:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.Level, err = extractField(log, `Level:\s*(\w+)`)
	if err != nil {
		return nil, err
	}

	event.Opcode, err = extractField(log, `Opcode:\s*(\w+)`)
	if err != nil {
		return nil, err
	}

	event.Keyword, err = extractField(log, `Keyword:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.User, err = extractField(log, `User:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.UserName, err = extractField(log, `User Name:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.Computer, err = extractField(log, `Computer:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	event.Description, err = extractField(log, `Description:\s*(.+)`)
	if err != nil {
		return nil, err
	}

	// Extract QueueID from the Description field (document or job number)
	event.QueueID, err = extractQueueID(event.Description)
	if err != nil {
		return nil, err
	}

	// Return the parsed event
	return event, nil
}

// Helper function to extract a field using a regular expression
func extractField(log, pattern string) (string, error) {
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(log)
	if len(matches) < 2 {
		return "", fmt.Errorf("pattern %s not found", pattern)
	}

	// Replace all occurrences of the null byte \x00 with an empty string
	result := matches[1]
	result = strings.Replace(result, "\x00", "", -1)

	// Also trim any surrounding spaces
	return strings.TrimSpace(result), nil
}

// Extracts the queue ID from the Description field
func extractQueueID(description string) (int, error) {
	// Updated regex to find "Printing job <number>", "Spooling job <number>", "Rendering job <number>", "Document <number>"
	// Also matches "document <number>" at any place in the description
	re := regexp.MustCompile(`(?:Printing job|Spooling job|Rendering job|Deleting job|Document|document)\s*(\d+)[\.,]?`)
	matches := re.FindStringSubmatch(description)

	if len(matches) < 2 {
		return 0, fmt.Errorf("queue ID not found in description: %s", description)
	}

	// Convert the queue ID to an integer
	queueID, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, fmt.Errorf("failed to parse queue ID: %v", err)
	}

	return queueID, nil
}

// Extracts the queue ID and event type from the Description field
func extractQueueIDAndEvent(description string) (string, int, error) {
	// Regex to match event types and queue IDs (Printing job, Spooling job, Rendering job, Document)
	// Captures both the event type and the queue ID (number)
	re := regexp.MustCompile(`(?i)(Printing job|Spooling job|Rendering job|Deleting job|Document|document)\s*(\d+)[\.,]?`)
	matches := re.FindStringSubmatch(description)

	if len(matches) < 3 {
		return "", 0, fmt.Errorf("event or queue ID not found in description: %s", description)
	}

	// Extract the event type (matches[1]) and the queue ID (matches[2])
	eventType := matches[1]
	queueID, err := strconv.Atoi(matches[2])
	if err != nil {
		return "", 0, fmt.Errorf("failed to parse queue ID: %v", err)
	}

	// Map event type to constant
	var eventConstant string
	switch eventType {
	case "Printing job":
		eventConstant = PRINT_EVENT_JOB_PRINTING
	case "Spooling job":
		eventConstant = PRINT_EVENT_JOB_STARTED
	case "Rendering job":
		eventConstant = PRINT_EVENT_JOB_RENDERING
	case "Document", "document":
		if strings.Contains(description, "deleted") {
			eventConstant = PRINT_EVENT_JOB_FAILED
		} else if strings.Contains(description, "printed") {
			eventConstant = PRINT_EVENT_JOB_COMPLETED
		} else {
			eventConstant = PRINT_EVENT_JOB_IGNORE
		}
	case "Deleting job":
		eventConstant = PRINT_EVENT_JOB_FAILED
	default:
		return "", 0, fmt.Errorf("unknown event type: %s", eventType)
	}

	return eventConstant, queueID, nil
}

func saveToEncryptedFile(filePath string, key []byte) error {
	// Collect data from sync.Map into a temporary map
	tempMap := make(map[string]PrintEvent)
	printEventTracker.Range(func(key, value interface{}) bool {
		tempMap[key.(string)] = value.(PrintEvent)
		return true
	})

	// Serialize the map to binary using gob
	var buffer bytes.Buffer
	encoder := gob.NewEncoder(&buffer)
	if err := encoder.Encode(tempMap); err != nil {
		return err
	}
	plainData := buffer.Bytes()

	// Encrypt the binary data
	cipherData, err := encryptData(plainData, key)
	if err != nil {
		return err
	}

	// Write the encrypted data to a file
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(cipherData)
	return err
}

func encryptData(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, errors.New("no data to encrypt")
	}

	// Generate a random IV
	cipherData := make([]byte, aes.BlockSize+len(data))
	iv := cipherData[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	// Encrypt the data
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(cipherData[aes.BlockSize:], data)

	return cipherData, nil
}

func loadFromEncryptedFile(filePath string, key []byte) error {
	// Read the encrypted data from the file
	file, err := os.Open(filePath)
	if err != nil {
		// If the file doesn't exist, initialize an empty map
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer file.Close()

	cipherData, err := io.ReadAll(file)
	if err != nil {
		return err
	}

	// Decrypt the data
	plainData, err := decryptData(cipherData, key)
	if err != nil {
		return err
	}

	// Deserialize the binary data into a temporary map
	tempMap := make(map[string]PrintEvent)
	buffer := bytes.NewBuffer(plainData)
	decoder := gob.NewDecoder(buffer)
	if err := decoder.Decode(&tempMap); err != nil {
		return err
	}

	// Populate the sync.Map
	for key, value := range tempMap {
		printEventTracker.Store(key, value)
	}
	return nil
}

func decryptData(data []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	if len(data) < aes.BlockSize {
		return nil, errors.New("ciphertext too short")
	}

	// Extract the IV
	iv := data[:aes.BlockSize]
	cipherData := data[aes.BlockSize:]

	// Decrypt the data
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(cipherData, cipherData)

	return cipherData, nil
}

// ===== OPTIMIZED PDF PROCESSING COMPLETE =====
// ===== OPTIMIZED PDF PROCESSING COMPLETE =====
// All legacy functions have been removed in favor of optimized in-memory processing

// All custom grayscale conversion functions removed - using UniPDF's direct rendering for best quality

// Windows GDI printing structures and APIs
var (
	gdi32    = syscall.NewLazyDLL("gdi32.dll")
	winspool = syscall.NewLazyDLL("winspool.drv")

	// GDI APIs for direct printing
	procCreateDC      = gdi32.NewProc("CreateDCW")
	procDeleteDC      = gdi32.NewProc("DeleteDC")
	procStretchDIBits = gdi32.NewProc("StretchDIBits")

	// Page size and device capability APIs
	procGetDeviceCaps    = gdi32.NewProc("GetDeviceCaps")
	procSetViewportExtEx = gdi32.NewProc("SetViewportExtEx")
	procStartDoc         = gdi32.NewProc("StartDocW")
	procEndDoc           = gdi32.NewProc("EndDoc")
	procStartPage        = gdi32.NewProc("StartPage")
	procEndPage          = gdi32.NewProc("EndPage")

	// Winspool APIs for thermal printing and Brother cutting
	procOpenPrinter      = winspool.NewProc("OpenPrinterW")
	procClosePrinter     = winspool.NewProc("ClosePrinter")
	procWritePrinter     = winspool.NewProc("WritePrinter")
	procStartDocPrinter  = winspool.NewProc("StartDocPrinterW")
	procEndDocPrinter    = winspool.NewProc("EndDocPrinter")
	procStartPagePrinter = winspool.NewProc("StartPagePrinter")
	procEndPagePrinter   = winspool.NewProc("EndPagePrinter")
)

// BITMAPINFO structure for DIB
type BITMAPINFO struct {
	BmiHeader BITMAPINFOHEADER
	BmiColors [1]RGBQUAD
}

type BITMAPINFOHEADER struct {
	BiSize          uint32
	BiWidth         int32
	BiHeight        int32
	BiPlanes        uint16
	BiBitCount      uint16
	BiCompression   uint32
	BiSizeImage     uint32
	BiXPelsPerMeter int32
	BiYPelsPerMeter int32
	BiClrUsed       uint32
	BiClrImportant  uint32
}

type RGBQUAD struct {
	RgbBlue     uint8
	RgbGreen    uint8
	RgbRed      uint8
	RgbReserved uint8
}

type DOCINFO struct {
	CbSize       int32
	LpszDocName  *uint16
	LpszOutput   *uint16
	LpszDatatype *uint16
	FwType       uint32
}

// Structures removed - using simplified approach without complex document setup

// Constants
const (
	SRCCOPY        = 0x00CC0020
	DIB_RGB_COLORS = 0
	BI_RGB         = 0

	// Device capability constants for page size
	HORZSIZE   = 4  // Width of physical page in millimeters
	VERTSIZE   = 6  // Height of physical page in millimeters
	HORZRES    = 8  // Width of physical page in pixels
	VERTRES    = 10 // Height of physical page in pixels
	LOGPIXELSX = 88 // Logical pixels per inch horizontally
	LOGPIXELSY = 90 // Logical pixels per inch vertically

	// StretchDIBits mode
	SRCCOPY_STRETCH = 0x00CC0020

	// Conversion constants
	MM_PER_INCH      = 25.4
	PIXELS_PER_METER = 39.3701 // pixels per meter conversion

	// Windows GDI mapping modes for coordinate transformation
	MM_TEXT        = 1 // Default mapping mode (1 unit = 1 pixel)
	MM_LOMETRIC    = 2 // 0.1mm units
	MM_HIMETRIC    = 3 // 0.01mm units
	MM_LOENGLISH   = 4 // 0.01 inch units
	MM_HIENGLISH   = 5 // 0.001 inch units
	MM_TWIPS       = 6 // 1/1440 inch units
	MM_ISOTROPIC   = 7 // Arbitrary units with equal X and Y scaling
	MM_ANISOTROPIC = 8 // Arbitrary units with independent X and Y scaling
)

// printImageDirectlyWithGDI sends image data directly to printer using Windows GDI with accurate size matching and optional page cut
func (pm *PrintManager) printImageDirectlyWithGDI(img *image.Gray, printerName string, jobID string, job PrintJob, isLastPage bool) error {
	// Step 1: Get image dimensions and use print job paper size
	bounds := img.Bounds()
	imgWidth := bounds.Dx()
	imgHeight := bounds.Dy()
	log.Printf("Source image size: %dpx x %dpx", imgWidth, imgHeight)

	// Use paper size from print job (in inches) - this is what user requested
	jobPaperWidthInches := job.Width
	jobPaperHeightInches := job.Height
	jobPaperWidthMM := jobPaperWidthInches * 25.4
	jobPaperHeightMM := jobPaperHeightInches * 25.4

	log.Printf("Print job paper size: %.1f\" x %.1f\" (%.1fmm x %.1fmm)",
		jobPaperWidthInches, jobPaperHeightInches, jobPaperWidthMM, jobPaperHeightMM)

	// Step 2: Create printer device context (simplified approach)
	printerNamePtr, _ := syscall.UTF16PtrFromString(printerName)
	winspool16Ptr, _ := syscall.UTF16PtrFromString("WINSPOOL")

	// Calculate content dimensions for comparison
	contentWidthMM := float64(imgWidth) / 300.0 * 25.4   // Convert 300 DPI to mm
	contentHeightMM := float64(imgHeight) / 300.0 * 25.4 // Convert 300 DPI to mm
	log.Printf("Content size: %.1fmm x %.1fmm vs Job paper size: %.1fmm x %.1fmm",
		contentWidthMM, contentHeightMM, jobPaperWidthMM, jobPaperHeightMM)

	// Create printer DC with custom page size configuration
	hDC, _, err := procCreateDC.Call(
		uintptr(unsafe.Pointer(winspool16Ptr)),
		uintptr(unsafe.Pointer(printerNamePtr)),
		0, 0)
	if hDC == 0 {
		return fmt.Errorf("failed to create printer DC for '%s': %v", printerName, err)
	}
	defer procDeleteDC.Call(hDC)

	// Set custom page size using SetViewportExtEx to match job paper dimensions
	// Convert job paper size from inches to logical units (pixels at 300 DPI)
	pageWidthPixels := int(jobPaperWidthInches * 300) // 300 DPI conversion
	pageHeightPixels := int(jobPaperHeightInches * 300)

	log.Printf("Setting logical page size: %dpx x %dpx (%.1f\" x %.1f\")",
		pageWidthPixels, pageHeightPixels, jobPaperWidthInches, jobPaperHeightInches)

	// Set viewport extent to match job paper size (this configures the logical page size)
	viewportRet, _, viewportErr := procSetViewportExtEx.Call(hDC, uintptr(pageWidthPixels), uintptr(pageHeightPixels), 0)
	if viewportRet == 0 {
		log.Printf("Warning: Failed to set viewport extent to %dx%d: %v", pageWidthPixels, pageHeightPixels, viewportErr)
	} else {
		log.Printf("Successfully configured viewport extent to %dx%d pixels", pageWidthPixels, pageHeightPixels)
	} // Step 2: Get printer capabilities but override for label printers
	pageWidthMM, _, _ := procGetDeviceCaps.Call(hDC, HORZSIZE)
	pageHeightMM, _, _ := procGetDeviceCaps.Call(hDC, VERTSIZE)
	pageWidthPx, _, _ := procGetDeviceCaps.Call(hDC, HORZRES)
	pageHeightPx, _, _ := procGetDeviceCaps.Call(hDC, VERTRES)
	printerDpiX, _, _ := procGetDeviceCaps.Call(hDC, LOGPIXELSX)
	printerDpiY, _, _ := procGetDeviceCaps.Call(hDC, LOGPIXELSY)

	log.Printf("Printer reported capabilities: %dmm x %dmm (%dpx x %dpx) at %d x %d DPI",
		pageWidthMM, pageHeightMM, pageWidthPx, pageHeightPx, printerDpiX, printerDpiY)

	// Calculate required paper dimensions to prevent overfeeding
	requiredWidthMM := int(float64(imgWidth) / 300.0 * 25.4)   // Convert 300 DPI to mm
	requiredHeightMM := int(float64(imgHeight) / 300.0 * 25.4) // Convert 300 DPI to mm
	log.Printf("Required paper size to prevent overfeeding: %dmm x %dmm for content %dpx x %dpx",
		requiredWidthMM, requiredHeightMM, imgWidth, imgHeight)

	// Override page dimensions for label/thermal printers to match content size
	// This prevents overfeeding by telling the printer the paper is exactly the content size

	// Step 3: Image dimensions already obtained above for paper size configuration

	// Step 4: Use job paper size for page configuration
	// This properly configures the page size based on the print job specification
	actualPageWidthPx := pageWidthPixels   // Use job-specified page width
	actualPageHeightPx := pageHeightPixels // Use job-specified page height

	log.Printf("Using job-specified page size: %dpx x %dpx (printer reported %dpx x %dpx)",
		actualPageWidthPx, actualPageHeightPx, pageWidthPx, pageHeightPx)

	// Regular printers: use 1:1 pixel mapping and center horizontally
	var scaledWidth, scaledHeight, offsetX, offsetY int
	scaledWidth = imgWidth
	scaledHeight = imgHeight

	// Center horizontally using printer's reported page width
	offsetX = (int(pageWidthPx) - scaledWidth) / 2
	offsetY = 0
	if offsetX < 0 {
		offsetX = 0
	}
	log.Printf("Regular printer - printing %dx%d at 1:1 pixel mapping centered at (%d,0)", scaledWidth, scaledHeight, offsetX) // For compatibility, continue with remaining logic
	if false {                                                                                                                 // Placeholder for any additional printer-specific logic
		scaledWidth = imgWidth
		scaledHeight = imgHeight
	}

	log.Printf("Printing image: %dpx x %dpx at position (%d,%d) - 1:1 pixel mapping",
		scaledWidth, scaledHeight, offsetX, offsetY)

	// Step 5: Start print document with page cut support
	jobNamePtr, _ := syscall.UTF16PtrFromString(fmt.Sprintf("Cloud Print Job %s", jobID))
	docInfo := DOCINFO{
		CbSize:       int32(unsafe.Sizeof(DOCINFO{})),
		LpszDocName:  jobNamePtr,
		LpszOutput:   nil,
		LpszDatatype: nil,
		FwType:       0,
	}

	ret, _, err := procStartDoc.Call(hDC, uintptr(unsafe.Pointer(&docInfo)))
	if ret <= 0 {
		return fmt.Errorf("failed to start document: %v", err)
	}
	defer procEndDoc.Call(hDC)

	// Step 6: Start page
	ret, _, err = procStartPage.Call(hDC)
	if ret <= 0 {
		return fmt.Errorf("failed to start page: %v", err)
	}
	defer procEndPage.Call(hDC)

	// Step 7: Create proper BITMAPINFO structure with grayscale palette
	bmi := &struct {
		BmiHeader BITMAPINFOHEADER
		BmiColors [256]RGBQUAD
	}{
		BmiHeader: BITMAPINFOHEADER{
			BiSize:          uint32(unsafe.Sizeof(BITMAPINFOHEADER{})),
			BiWidth:         int32(imgWidth),
			BiHeight:        int32(imgHeight), // Positive for bottom-up DIB
			BiPlanes:        1,
			BiBitCount:      8, // 8-bit grayscale
			BiCompression:   BI_RGB,
			BiSizeImage:     0, // Can be 0 for BI_RGB
			BiXPelsPerMeter: int32(float64(printerDpiX) * PIXELS_PER_METER),
			BiYPelsPerMeter: int32(float64(printerDpiY) * PIXELS_PER_METER),
			BiClrUsed:       256, // Full grayscale palette
			BiClrImportant:  0,
		},
	}

	// Create proper grayscale palette (0=black, 255=white)
	for i := 0; i < 256; i++ {
		bmi.BmiColors[i] = RGBQUAD{
			RgbBlue:     uint8(i),
			RgbGreen:    uint8(i),
			RgbRed:      uint8(i),
			RgbReserved: 0,
		}
	}

	// Step 8: Copy image data in proper format (bottom-up DIB)
	imageData := make([]byte, imgWidth*imgHeight)
	for y := 0; y < imgHeight; y++ {
		for x := 0; x < imgWidth; x++ {
			gray := img.GrayAt(x, y)
			// DIB format is bottom-up, so flip Y coordinate
			flippedY := imgHeight - 1 - y
			imageData[flippedY*imgWidth+x] = gray.Y
		}
	}

	// Step 9: Print image using StretchDIBits with proper DPI scaling
	ret, _, err = procStretchDIBits.Call(
		hDC,                                    // printer device context
		uintptr(offsetX),                       // destination X (centered)
		uintptr(offsetY),                       // destination Y (centered)
		uintptr(scaledWidth),                   // destination width (scaled for DPI)
		uintptr(scaledHeight),                  // destination height (scaled for DPI)
		0,                                      // source X (start of image)
		0,                                      // source Y (start of image)
		uintptr(imgWidth),                      // source width (original)
		uintptr(imgHeight),                     // source height (original)
		uintptr(unsafe.Pointer(&imageData[0])), // image pixel data
		uintptr(unsafe.Pointer(bmi)),           // bitmap info with palette
		DIB_RGB_COLORS,                         // use RGB color table
		SRCCOPY_STRETCH)                        // copy with stretching

	if ret == 0 {
		return fmt.Errorf("StretchDIBits failed to print image: %v", err)
	}

	log.Printf("Regular printer: %dpx x %dpx at 1:1 pixel mapping at position (%d,%d)", imgWidth, imgHeight, offsetX, offsetY)

	// Note: Brother printers now use custom TSPL solution, not GDI method

	log.Printf("Successfully printed image to %s with accurate sizing", printerName)
	return nil
}

// End of print.go - Direct GDI printing with safe form feed page cutting
