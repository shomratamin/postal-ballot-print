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
	"image/png"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
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
	PrinterName      string
	PrintOrientation string
	JobName          string
	Data             []byte // Data to be printed
	Token            string // Job token
	Width            float64
	Height           float64
	JobID            string
	Event            string
	Barcode          string
	Mashul           string
	Weight           string
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

	err = loadFromEncryptedFile("data/evnts.bin", eck)
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
	err, numPages := pm.processWithUniPDF(job, console)
	// gsPath := "./bin/gswin64c.exe" // Update with your Ghostscript path

	// // Ghostscript command to set paper size and DPI in portrait mode
	// cmd := exec.Command(
	// 	gsPath,
	// 	"-dBATCH",                  // Exit after processing
	// 	"-dNOPAUSE",                // Don't pause between pages
	// 	"-dNOSAFER",                // Disable SAFER mode for local printing
	// 	"-dNumRenderingThreads=14", // USE CPU CORES
	// 	"-dUseFastColor=true",
	// 	"-dGraphicsAlphaBits=2",
	// 	"-dTextAlphaBits=2",
	// 	"-dUseStdinJobName=false",

	// 	// Memory (BIG SPEED GAIN)
	// 	"-dBandBufferSpace=512m",
	// 	"-dBufferSpace=2g",
	// 	"-dQUIET",           // Suppress normal output
	// 	"-sDEVICE=mswinpr2", // Use Windows printer device
	// 	"-sOutputFile=%printer%"+job.PrinterName,                   // Output to the specified printer
	// 	"-dDEVICEWIDTHPOINTS="+fmt.Sprintf("%.2f", job.Width*72),   // Width in points (72 points per inch)
	// 	"-dDEVICEHEIGHTPOINTS="+fmt.Sprintf("%.2f", job.Height*72), // Height in points
	// 	"-r150",        // Set DPI to 150
	// 	"-dFIXEDMEDIA", // Fix media size (avoid scaling)
	// 	"-dPDFFitPage", // Fit the PDF to the page size
	// 	"-f", "-",      // Read from stdin after executing commands
	// )

	// // Set the input data as the standard input for the command
	// cmd.Stdin = bytes.NewReader(job.Data)

	// // Suppress console window when executing Ghostscript
	// cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	// // Run the command
	// err := cmd.Run()

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

	// Printer resources are properly released by deferred cleanup in print function
	// No need for additional reset - proper defer sequence ensures clean state

	// Bind print queue for event tracking and start progress monitoring
	pm.attachPrintQueueWithMonitoring(last_print_event, console, last_print_event_found, job.PrinterName, numPages)

	if job.Event == "live-print" || job.Event == "specimen-print" {
		now_time := getNowTime()
		print_history := PrintHistory{Barcode: job.Barcode + "  ", Time: now_time}
		addPrintHistory(print_history)
	}
}

// processWithUniPDF processes PDF using optimized in-memory UniPDF rendering
func (pm *PrintManager) processWithUniPDF(job PrintJob, console *Console) (error, int) {
	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Processing PDF from memory (%.1f\" x %.1f\")", job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Create PDF reader directly from byte data
	pdfReader, err := model.NewPdfReader(bytes.NewReader(job.Data))
	if err != nil {
		return fmt.Errorf("failed to create PDF reader: %w", err), 0
	}

	// Count PDF pages
	numPages, err := pdfReader.GetNumPages()
	if err != nil {
		return fmt.Errorf("failed to count PDF pages: %w", err), 0
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Processing %d pages for job %s (%.1f\" x %.1f\", %.1fmm x %.1fmm)", numPages, job.JobID, job.Width, job.Height, job.Width*25.4, job.Height*25.4),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Process PDF pages with optimized in-memory method
	return pm.processPDFPagesInMemory(pdfReader, numPages, job, console), numPages
}

// processPDFPagesInMemory processes PDF pages entirely in memory with proper size calculation
// CRITICAL: Use fixed DPI to avoid unnecessary HDC calls that can block printer driver
func (pm *PrintManager) processPDFPagesInMemory(pdfReader *model.PdfReader, numPages int, job PrintJob, console *Console) error {
	// Use 300 DPI for better quality to capture fine details like QR codes
	// Higher DPI ensures embedded images and small graphics are properly rendered
	dpi := 200
	widthPx := int(job.Width * float64(dpi))
	heightPx := int(job.Height * float64(dpi))
	console.MsgChan <- Message{
		Text: fmt.Sprintf("Rendering at 200 DPI (%dpx x %dpx for %.1f\" x %.1f\")",
			widthPx, heightPx, job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
	return pm.processPDFPagesWithFixedDPI(pdfReader, numPages, job, console, widthPx, heightPx)
}

// processPDFPagesWithFixedDPI processes PDF pages with pipeline approach - render and print concurrently for memory efficiency
func (pm *PrintManager) processPDFPagesWithFixedDPI(pdfReader *model.PdfReader, numPages int, job PrintJob, console *Console, widthPx, heightPx int) error {

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Starting pipeline rendering and printing for %d pages (%.1f\" x %.1f\")", numPages, job.Width, job.Height),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Use pipeline approach: render pages concurrently and send to printer as they're ready
	// This saves memory and reduces total time
	return pm.printWithPipeline(pdfReader, numPages, job, console, widthPx, heightPx)
}

// printWithPipeline implements a producer-consumer pipeline for efficient rendering and printing
// CRITICAL: Printer is initialized ONLY after first page is ready to prevent driver corruption
func (pm *PrintManager) printWithPipeline(pdfReader *model.PdfReader, numPages int, job PrintJob, console *Console, widthPx, heightPx int) error {
	// Ordered page delivery system
	type PageResult struct {
		jobID   string // Job identifier for isolation
		pageNum int
		img     *image.RGBA
		err     error
	}

	// Channel for rendering results (unordered)
	resultChan := make(chan PageResult, numPages)
	// Channel for ordered page delivery to printer
	printChan := make(chan *image.RGBA, 10) // Buffer 10 pages ahead
	errChan := make(chan error, 1)

	// Signal channel to indicate first page is ready
	firstPageReady := make(chan struct{})

	log.Printf("Starting render pipeline before printer initialization...")

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Starting %d page render pipeline...", numPages),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	maxWorkers := runtime.NumCPU()
	if maxWorkers > 1 {
		maxWorkers = maxWorkers - 1 // Leave one CPU free
	}

	// CRITICAL FIX: Mutex to protect pdfReader access - it's NOT thread-safe
	var pdfReaderMutex sync.Mutex

	// Producer: Render pages concurrently (with serialized PDF access)
	semaphore := make(chan struct{}, maxWorkers)
	var renderWg sync.WaitGroup

	// Launch render goroutines in background so we don't block the printer
	// Launch rendering goroutines
	go func() {
		for pageNum := 1; pageNum <= numPages; pageNum++ {
			// CRITICAL: Add to WaitGroup BEFORE launching goroutine
			// This prevents renderWg.Wait() from returning before goroutines start
			renderWg.Add(1)

			go func(pNum int) {
				// CRITICAL: Panic recovery must be outermost defer to handle all panics
				// renderWg.Done() is called at the END to ensure all channel operations complete first
				defer func() {
					// Release semaphore
					<-semaphore

					// Recover from any panic to prevent crash
					if r := recover(); r != nil {
						log.Printf("PANIC in render goroutine page %d: %v", pNum, r)
						// Safe send - check if channel is still open
						select {
						case resultChan <- PageResult{jobID: job.JobID, pageNum: pNum, img: nil, err: fmt.Errorf("panic: %v", r)}:
							// Sent successfully
							log.Printf("Sent panic error for page %d", pNum)
						default:
							// Channel closed or full, skip
							log.Printf("Could not send panic error for page %d - channel closed", pNum)
						}
					}

					// CRITICAL: Signal completion LAST after all channel operations
					// This prevents resultChan from being closed while sends are in progress
					renderWg.Done()
				}()

				console.MsgChan <- Message{
					Text:  fmt.Sprintf("Rendering page %d/%d...", pNum, numPages),
					Color: colorNRGBA(0, 255, 255, 255), // Cyan
				}

				// Pass mutex to the render function - it will lock only for GetPage()
				img, err := pm.renderPDFPageToMonochrome(pdfReader, pNum, widthPx, heightPx, &pdfReaderMutex)

				// Acquire semaphore AFTER starting work to avoid blocking the launch loop
				semaphore <- struct{}{}

				if err != nil {
					log.Printf("ERROR rendering page %d: %v", pNum, err)
					select {
					case resultChan <- PageResult{jobID: job.JobID, pageNum: pNum, img: nil, err: err}:
					default:
						log.Printf("Could not send error for page %d - channel closed", pNum)
					}
					return
				}

				// Validate image before sending
				if img == nil || img.Pix == nil || len(img.Pix) == 0 {
					log.Printf("ERROR: page %d rendered nil or empty image", pNum)
					select {
					case resultChan <- PageResult{jobID: job.JobID, pageNum: pNum, img: nil, err: fmt.Errorf("rendered empty image")}:
					default:
						log.Printf("Could not send error for page %d - channel closed", pNum)
					}
					return
				}

				// CRITICAL FIX: Create deep copy IMMEDIATELY after rendering to prevent memory corruption
				// This ensures each page has its own independent memory buffer
				imgCopy := &image.RGBA{
					Pix:    make([]byte, len(img.Pix)),
					Stride: img.Stride,
					Rect:   img.Rect,
				}
				copy(imgCopy.Pix, img.Pix)

				log.Printf("Page %d: Created deep copy - Pix size: %d, Stride: %d, Rect: %v",
					pNum, len(imgCopy.Pix), imgCopy.Stride, imgCopy.Rect)

				console.MsgChan <- Message{
					Text:  fmt.Sprintf("✓ Page %d/%d rendered (%dx%d)", pNum, numPages, imgCopy.Bounds().Dx(), imgCopy.Bounds().Dy()),
					Color: colorNRGBA(0, 255, 0, 255), // Green
				}

				// Send COPY to printer, not original - prevents race conditions
				// Use select with default to handle closed channel gracefully
				select {
				case resultChan <- PageResult{jobID: job.JobID, pageNum: pNum, img: imgCopy, err: nil}:
					// Sent successfully
				default:
					// Channel closed or full - this shouldn't happen in normal flow
					log.Printf("Could not send result for page %d - channel closed", pNum)
				}
			}(pageNum)
		}
	}()

	// Close result channel after all rendering completes
	go func() {
		renderWg.Wait()
		close(resultChan)
	}()

	// Sequencer: Receive unordered results and send to printer in correct order
	// CRITICAL: Signal when first page is ready so printer can be initialized
	go func() {
		defer close(printChan)

		pageBuffer := make(map[int]*image.RGBA)
		nextPageToSend := 1
		hasError := false
		resultsReceived := 0
		firstPageSignaled := false

		log.Printf("Sequencer: Starting, waiting for %d pages from job %s", numPages, job.JobID)

		for result := range resultChan {
			resultsReceived++
			log.Printf("Sequencer: Received result %d: page=%d, jobID=%s, hasError=%v",
				resultsReceived, result.pageNum, result.jobID, result.err != nil)

			if result.err != nil {
				hasError = true
				log.Printf("Sequencer: Page %d has error: %v", result.pageNum, result.err)
				select {
				case errChan <- fmt.Errorf("render page %d: %w", result.pageNum, result.err):
				default:
				}
				// Continue draining resultChan to avoid goroutine leaks
				continue
			}

			// Validate job ID matches (job isolation)
			if result.jobID != job.JobID {
				log.Printf("WARNING: Page %d belongs to different job %s, expected %s", result.pageNum, result.jobID, job.JobID)
				continue
			}

			// If we already have an error, just drain the channel
			if hasError {
				log.Printf("Sequencer: Draining page %d due to previous error", result.pageNum)
				continue
			}

			// Store this page (already a deep copy from render goroutine)
			pageBuffer[result.pageNum] = result.img
			log.Printf("Sequencer: Stored page %d in buffer", result.pageNum)

			// Send all consecutive pages starting from nextPageToSend
			for {
				if img, ok := pageBuffer[nextPageToSend]; ok {
					// Validate image
					if img == nil || img.Pix == nil || len(img.Pix) == 0 {
						log.Printf("ERROR: Invalid image in buffer for page %d - img: %v, Pix: %v, Pix len: %d",
							nextPageToSend, img != nil, img != nil && img.Pix != nil,
							func() int {
								if img != nil && img.Pix != nil {
									return len(img.Pix)
								}
								return 0
							}())
						hasError = true
						select {
						case errChan <- fmt.Errorf("invalid image for page %d", nextPageToSend):
						default:
						}
						break
					}

					// CRITICAL: Signal when first page is ready (page 1)
					if nextPageToSend == 1 && !firstPageSignaled {
						log.Printf("Sequencer: First page ready, signaling printer initialization")
						close(firstPageReady)
						firstPageSignaled = true
					}

					// No need for additional copy - image is already a deep copy from render goroutine
					log.Printf("Sequencer: Sending page %d to printer (size: %dx%d, pix: %d bytes)",
						nextPageToSend, img.Bounds().Dx(), img.Bounds().Dy(), len(img.Pix))

					select {
					case printChan <- img:
						log.Printf("Sequencer: Successfully sent page %d to printChan", nextPageToSend)
					case <-time.After(30 * time.Second):
						log.Printf("ERROR: Timeout sending page %d to printChan", nextPageToSend)
						hasError = true
						break
					}

					delete(pageBuffer, nextPageToSend)
					nextPageToSend++
				} else {
					break
				}
			}
		}

		log.Printf("Sequencer: resultChan closed, processing remaining buffer...")

		// After resultChan is closed, verify we sent all pages
		if !hasError && nextPageToSend <= numPages {
			log.Printf("Sequencer: Sending %d remaining buffered pages", numPages-nextPageToSend+1)
			// Send any remaining buffered pages (shouldn't happen but safety check)
			for i := nextPageToSend; i <= numPages; i++ {
				if img, ok := pageBuffer[i]; ok {
					log.Printf("Sequencer: Sending buffered page %d", i)
					printChan <- img
					delete(pageBuffer, i)
				} else {
					log.Printf("WARNING: Page %d not in buffer", i)
				}
			}
		}

		log.Printf("Sequencer finished: sent %d pages, has error: %v, received %d results", nextPageToSend-1, hasError, resultsReceived)
	}()

	// Consumer: Initialize printer and print pages
	// CRITICAL: Wait for first page before initializing printer to prevent corruption
	log.Printf("Waiting for first page before initializing printer...")
	printErr := pm.printPagesFromChannelWithInit(printChan, errChan, numPages, firstPageReady, job, console)

	// Check for errors (print function handles its own cleanup)
	if printErr != nil {
		log.Printf("Print error occurred: %v", printErr)
		return printErr
	}

	// Check for rendering errors
	select {
	case renderErr := <-errChan:
		log.Printf("Rendering error occurred: %v", renderErr)
		return renderErr
	default:
		// Success
	}

	log.Printf("Print job completed successfully")
	return nil
}

// printPagesFromChannelWithInit initializes printer after first page is ready, then prints all pages
// CRITICAL: Printer DC is created ONLY after first page arrives to prevent driver corruption
func (pm *PrintManager) printPagesFromChannelWithInit(pageChan <-chan *image.RGBA, errChan <-chan error, numPages int, firstPageReady <-chan struct{}, job PrintJob, console *Console) error {
	var hDC uintptr
	var pageWidthPx uintptr
	var pageHeightPx uintptr
	var printerDpiX uintptr
	var printerDpiY uintptr
	printerInitialized := false
	pageNum := 0
	var ret uintptr
	var err error

	log.Printf("Printer consumer waiting for first page...")

	// CRITICAL: Wait for first page to be ready before initializing printer
	// This prevents the printer driver from being locked in a bad state
	select {
	case <-firstPageReady:
		log.Printf("First page ready - initializing printer now...")
	case <-time.After(60 * time.Second):
		return fmt.Errorf("timeout waiting for first page to render")
	}

	// Initialize printer DC now that first page is ready
	printerNamePtr, _ := syscall.UTF16PtrFromString(job.PrinterName)
	winspool16Ptr, _ := syscall.UTF16PtrFromString("WINSPOOL")

	// Convert job dimensions from inches to 0.1mm for DEVMODE
	paperWidthMM := int16(job.Width * 254)   // inches * 25.4 * 10
	paperLengthMM := int16(job.Height * 254) // inches * 25.4 * 10

	// Open printer to get handle for DocumentProperties
	var hPrinter syscall.Handle
	ret, _, _ = procOpenPrinter.Call(
		uintptr(unsafe.Pointer(printerNamePtr)),
		uintptr(unsafe.Pointer(&hPrinter)),
		0)
	if ret == 0 {
		log.Printf("⚠️  Failed to open printer, using simple DEVMODE")
		hPrinter = 0
	}
	if hPrinter != 0 {
		defer procClosePrinter.Call(uintptr(hPrinter))
	}

	// Get printer's default DEVMODE size
	var devModeSize int32
	if hPrinter != 0 {
		ret, _, _ = procDocumentProperties.Call(
			0, // hwnd
			uintptr(hPrinter),
			uintptr(unsafe.Pointer(printerNamePtr)),
			0, // pDevModeOutput (NULL to get size)
			0, // pDevModeInput
			0) // fMode (0 to get size)
		devModeSize = int32(ret)
	}

	if devModeSize <= 0 {
		devModeSize = int32(unsafe.Sizeof(DEVMODE{}))
	}

	// CRITICAL: Validate devModeSize is reasonable (prevent allocation crashes)
	if devModeSize > 65536 { // 64KB max for DEVMODE
		log.Printf("⚠️  Invalid devModeSize %d, capping at 64KB", devModeSize)
		devModeSize = 65536
	}
	if devModeSize < int32(unsafe.Sizeof(DEVMODE{})) {
		log.Printf("⚠️  devModeSize %d too small, using minimum", devModeSize)
		devModeSize = int32(unsafe.Sizeof(DEVMODE{}))
	}

	// Allocate buffer and get printer's default DEVMODE
	devModeBuffer := make([]byte, devModeSize)
	// CRITICAL: Validate buffer before unsafe pointer cast
	if len(devModeBuffer) < int(unsafe.Sizeof(DEVMODE{})) {
		log.Printf("ERROR: devModeBuffer too small: %d bytes", len(devModeBuffer))
		return fmt.Errorf("devModeBuffer allocation failed")
	}
	if len(devModeBuffer) == 0 {
		log.Printf("ERROR: devModeBuffer is empty")
		return fmt.Errorf("devModeBuffer is empty - cannot create DEVMODE pointer")
	}
	devMode := (*DEVMODE)(unsafe.Pointer(&devModeBuffer[0]))
	devMode.Size = uint16(unsafe.Sizeof(DEVMODE{}))
	devMode.DriverExtra = uint16(devModeSize) - uint16(unsafe.Sizeof(DEVMODE{}))

	if hPrinter != 0 {
		// Get default settings from printer
		ret, _, _ = procDocumentProperties.Call(
			0, // hwnd
			uintptr(hPrinter),
			uintptr(unsafe.Pointer(printerNamePtr)),
			uintptr(unsafe.Pointer(devMode)), // pDevModeOutput
			0,                                // pDevModeInput
			2)                                // DM_OUT_BUFFER
		if ret < 0 {
			log.Printf("⚠️  Failed to get default DEVMODE")
		} else {
			log.Printf("✅ Got default DEVMODE from printer, size: %d, driverExtra: %d", devMode.Size, devMode.DriverExtra)
		}
	}

	// Modify paper size fields - DON'T use DM_FORMNAME to avoid printer rejecting custom size
	devMode.Fields |= DM_PAPERSIZE | DM_PAPERLENGTH | DM_PAPERWIDTH | DM_ORIENTATION | DM_DUPLEX
	devMode.PaperSize = DMPAPER_USER // Custom size
	devMode.PaperWidth = paperWidthMM
	devMode.PaperLength = paperLengthMM
	devMode.Duplex = DMDUP_SIMPLEX // Single-sided

	// Set orientation
	if job.PrintOrientation == "L" || job.PrintOrientation == "Landscape" {
		devMode.Orientation = DMORIENT_LANDSCAPE
	} else {
		devMode.Orientation = DMORIENT_PORTRAIT
	}

	// CRITICAL: Skip DocumentProperties validation for Ricoh printers
	// Ricoh drivers often reject custom paper sizes during validation and revert to A4
	// Instead, pass DEVMODE directly to CreateDC without validation
	skipValidation := false
	printerNameLower := strings.ToLower(job.PrinterName)
	if strings.Contains(printerNameLower, "ricoh") {
		log.Printf("🔧 Ricoh printer detected - skipping DEVMODE validation to preserve custom paper size")
		skipValidation = true
	}

	if !skipValidation && hPrinter != 0 {
		outputBuffer := make([]byte, devModeSize)
		// CRITICAL: Validate output buffer before unsafe pointer cast
		if len(outputBuffer) < int(unsafe.Sizeof(DEVMODE{})) {
			log.Printf("⚠️  Output buffer too small, skipping validation")
		} else {
			outputDevMode := (*DEVMODE)(unsafe.Pointer(&outputBuffer[0]))
			outputDevMode.Size = uint16(unsafe.Sizeof(DEVMODE{}))
			outputDevMode.DriverExtra = uint16(devModeSize) - uint16(unsafe.Sizeof(DEVMODE{}))

			ret, _, _ = procDocumentProperties.Call(
				0, // hwnd
				uintptr(hPrinter),
				uintptr(unsafe.Pointer(printerNamePtr)),
				uintptr(unsafe.Pointer(outputDevMode)), // pDevModeOutput
				uintptr(unsafe.Pointer(devMode)),       // pDevModeInput
				10)                                     // DM_IN_BUFFER | DM_OUT_BUFFER (8|2)
			if ret >= 0 {
				// Check if validation changed paper size back to A4
				if outputDevMode.PaperSize != DMPAPER_USER {
					log.Printf("⚠️  Validation changed PaperSize from USER(%d) to %d - using unvalidated DEVMODE",
						DMPAPER_USER, outputDevMode.PaperSize)
				} else {
					// Use validated DEVMODE only if it preserved our custom size
					devMode = outputDevMode
					devModeBuffer = outputBuffer
					log.Printf("✅ DEVMODE validated: PaperSize=%d, Width=%dmm, Length=%dmm, Duplex=%d",
						devMode.PaperSize, devMode.PaperWidth/10, devMode.PaperLength/10, devMode.Duplex)
				}
			} else {
				log.Printf("⚠️  DEVMODE validation failed (ret=%d), using unvalidated settings", ret)
			}
		}
	}

	log.Printf("📄 Creating DC with custom paper size: %.1f x %.1f inches (%dmm x %dmm), orientation: %d, duplex: %d",
		job.Width, job.Height, paperWidthMM/10, paperLengthMM/10, devMode.Orientation, devMode.Duplex)

	// Create DC with validated DEVMODE
	// CRITICAL: Validate devMode pointer is within buffer bounds
	if devMode == nil || uintptr(unsafe.Pointer(devMode)) < uintptr(unsafe.Pointer(&devModeBuffer[0])) {
		log.Printf("ERROR: Invalid devMode pointer")
		return fmt.Errorf("invalid devMode pointer")
	}
	hDC, _, err = procCreateDC.Call(
		uintptr(unsafe.Pointer(winspool16Ptr)),
		uintptr(unsafe.Pointer(printerNamePtr)),
		0,
		uintptr(unsafe.Pointer(devMode)))
	if hDC == 0 {
		log.Printf("ERROR: Failed to create printer DC: %v", err)
		return fmt.Errorf("failed to create printer DC: %v", err)
	}

	// CRITICAL: Apply DEVMODE settings immediately after DC creation
	// This ensures Ricoh driver picks up the custom paper size
	newHDC, _, _ := procResetDC.Call(hDC, uintptr(unsafe.Pointer(devMode)))
	if newHDC == 0 {
		log.Printf("⚠️  ResetDC failed, continuing with original DC")
	} else {
		log.Printf("✅ DC reset with DEVMODE applied successfully")
	}

	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC during printer cleanup: %v", r)
		}
		if printerInitialized {
			// Ensure GDI commands are flushed before closing
			procGdiFlush.Call()
			time.Sleep(200 * time.Millisecond) // Increased from 100ms
			// Reset DC to clean state before closing
			if hDC != 0 {
				procResetDC.Call(hDC, 0)
			}
		}
		if hDC != 0 {
			procDeleteDC.Call(hDC)
		}
		log.Printf("Printer DC closed and resources released")
	}()

	log.Printf("Printer DC created successfully")

	// Get printer's ACTUAL printable area - this accounts for hardware margins
	pageWidthPx, _, _ = procGetDeviceCaps.Call(hDC, HORZRES)
	pageHeightPx, _, _ = procGetDeviceCaps.Call(hDC, VERTRES)

	// Get printer DPI
	printerDpiX, _, _ = procGetDeviceCaps.Call(hDC, LOGPIXELSX)
	printerDpiY, _, _ = procGetDeviceCaps.Call(hDC, LOGPIXELSY)

	// CRITICAL: Use the SMALLER DPI to ensure uniform scaling and reduce memory usage
	// This prevents aspect ratio distortion and works better with lower-end printers
	printerDpi := printerDpiX
	if printerDpiY < printerDpiX {
		printerDpi = printerDpiY
	}

	log.Printf("Printer: ACTUAL printable area = %dx%d px, DPI X=%d Y=%d, using minimum DPI=%d",
		pageWidthPx, pageHeightPx, printerDpiX, printerDpiY, printerDpi)
	log.Printf("Job paper size: %.2f\" x %.2f\" (theoretical %dx%d px at %d DPI, but using actual printable area)",
		job.Width, job.Height, int(job.Width*float64(printerDpi)), int(job.Height*float64(printerDpi)), printerDpi)

	// Calculate target dimensions at printer's DPI (using smaller DPI for both dimensions)
	// job.Width and job.Height are in inches
	targetWidthPx := int(job.Width * float64(printerDpi))
	targetHeightPx := int(job.Height * float64(printerDpi))

	log.Printf("JOB target: %dx%d px for %.2f\"x%.2f\" at %d DPI",
		targetWidthPx, targetHeightPx, job.Width, job.Height, printerDpi)

	// Start document
	jobNamePtr, _ := syscall.UTF16PtrFromString(fmt.Sprintf("BPO Print Job- %s", job.JobName))
	docInfo := DOCINFO{
		CbSize:       int32(unsafe.Sizeof(DOCINFO{})),
		LpszDocName:  jobNamePtr,
		LpszOutput:   nil,
		LpszDatatype: nil,
		FwType:       0,
	}

	ret, _, err = procStartDoc.Call(hDC, uintptr(unsafe.Pointer(&docInfo)))
	if ret <= 0 {
		log.Printf("ERROR: Failed to start document: %v", err)
		return fmt.Errorf("failed to start document: %v", err)
	}
	printerInitialized = true

	defer func() {
		if r := recover(); r != nil {
			log.Printf("PANIC during document end: %v", r)
		}
		if printerInitialized {
			// Flush all pending GDI commands before ending document
			if hDC != 0 {
				procGdiFlush.Call()
				// For reusable DIB approach, shorter wait is sufficient
				waitTime := 5 * time.Second
				if numPages > 50 {
					waitTime = 10 * time.Second
				}
				log.Printf("Waiting %v for spooler to process %d pages before ending document", waitTime, numPages)
				time.Sleep(waitTime)
				procEndDoc.Call(hDC)
				log.Printf("Document ended and finalized")
			}
		}
	}()

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Printer initialized - ready to print %d pages", numPages),
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	// CRITICAL: Small delay to ensure printer is fully initialized
	// This prevents the first page from being blank or corrupted
	time.Sleep(100 * time.Millisecond)

	log.Printf("Document started - now processing pages from channel...")

	// CRITICAL: Create reusable DIB section ONCE for all pages
	// This prevents GDI resource exhaustion and is much faster
	log.Printf("Creating reusable DIB section for %dx%d pages", targetWidthPx, targetHeightPx)

	screenDC, _, _ := procGetDC.Call(0)
	if screenDC == 0 {
		return fmt.Errorf("failed to get screen DC")
	}
	defer procReleaseDC.Call(0, screenDC)

	memDC, _, _ := procCreateCompatibleDC.Call(screenDC)
	if memDC == 0 {
		return fmt.Errorf("failed to create memory DC")
	}
	defer procDeleteDC.Call(memDC)

	// We'll create the DIB section when we get the first page (we know dimensions then)
	var reusableBitmap uintptr
	var reusableOldBitmap uintptr
	var reusablePBits uintptr
	dibSectionCreated := false

	for img := range pageChan {
		pageNum++

		log.Printf("Printer received page %d from channel", pageNum)

		// Check for rendering errors
		select {
		case err := <-errChan:
			return err
		default:
		}

		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Printing page %d/%d...", pageNum, numPages),
			Color: colorNRGBA(0, 255, 255, 255), // Cyan
		}

		// Validate image
		if img == nil {
			return fmt.Errorf("page %d: received nil image from channel", pageNum)
		}

		// // Save debug images asynchronously using the COPY
		// go func(image *image.RGBA, pageNumber int, jobID string) {
		// 	if err := saveRenderedImageForDebug(image, pageNumber, jobID); err != nil {
		// 		log.Printf("Warning: Failed to save debug image for page %d: %v", pageNumber, err)
		// 	}
		// }(img, pageNum, fmt.Sprintf("page%d", pageNum))

		// Get image dimensions - ensure we use actual bounds not min/max
		bounds := img.Bounds()
		imgWidth := bounds.Dx()
		imgHeight := bounds.Dy()

		// CRITICAL: Validate dimensions are positive
		if imgWidth <= 0 || imgHeight <= 0 {
			log.Printf("ERROR: Page %d has invalid dimensions: %dx%d", pageNum, imgWidth, imgHeight)
			return fmt.Errorf("page %d: invalid dimensions %dx%d", pageNum, imgWidth, imgHeight)
		}

		// CRITICAL: Validate Pix buffer has expected size
		expectedSize := img.Stride * imgHeight
		if len(img.Pix) < expectedSize {
			log.Printf("ERROR: Page %d Pix buffer too small: have %d, need %d", pageNum, len(img.Pix), expectedSize)
			return fmt.Errorf("page %d: Pix buffer too small", pageNum)
		}

		log.Printf("Page %d: Received image %dpx x %dpx (bounds: %v)", pageNum, imgWidth, imgHeight, bounds)

		// CRITICAL: Resize image to match printer's ACTUAL printable area, not paper size
		// The printer's printable area (pageWidthPx/pageHeightPx) is smaller than paper due to margins
		// We must fit within this area or the image will be clipped/misaligned
		targetWidthPx := int(pageWidthPx)
		targetHeightPx := int(pageHeightPx)

		// Maintain aspect ratio - scale to fit within printable area
		aspectRatio := float64(imgWidth) / float64(imgHeight)
		pageAspectRatio := float64(targetWidthPx) / float64(targetHeightPx)

		if aspectRatio > pageAspectRatio {
			// Image is wider relative to page - fit to width
			targetHeightPx = int(float64(targetWidthPx) / aspectRatio)
		} else {
			// Image is taller relative to page - fit to height
			targetWidthPx = int(float64(targetHeightPx) * aspectRatio)
		}

		log.Printf("Page %d: Resizing from %dx%d (300 DPI) to %dx%d (fit to printable area %dx%d)",
			pageNum, imgWidth, imgHeight, targetWidthPx, targetHeightPx, pageWidthPx, pageHeightPx)

		// Resize the image using FAST nearest neighbor (3-5x faster than bilinear)
		resizedImg := resizeRGBAFast(img, targetWidthPx, targetHeightPx)
		// CRITICAL: Validate resize result to prevent crashes
		if resizedImg == nil {
			return fmt.Errorf("page %d: failed to resize image from %dx%d to %dx%d",
				pageNum, imgWidth, imgHeight, targetWidthPx, targetHeightPx)
		}
		// Update dimensions to use resized image
		img = resizedImg
		bounds = img.Bounds()
		imgWidth = bounds.Dx()
		imgHeight = bounds.Dy()

		log.Printf("Page %d: Image resized to %dpx x %dpx", pageNum, imgWidth, imgHeight)

		// CRITICAL: Use image dimensions directly with 1:1 mapping
		// Now that image is at printer DPI, physical size will match exactly
		destWidth := imgWidth
		destHeight := imgHeight

		// CRITICAL: Center horizontally, align to top vertically
		// Calculate horizontal offset to center the image on the page
		log.Printf("Page %d: DIAGNOSTIC - pageWidthPx=%d, pageHeightPx=%d, destWidth=%d, destHeight=%d",
			pageNum, pageWidthPx, pageHeightPx, destWidth, destHeight)

		offsetX := (int(pageWidthPx) - destWidth) / 2
		offsetY := 0 // Start from top of page

		// Ensure horizontal offset is not negative (image wider than page)
		if offsetX < 0 {
			offsetX = 0
			log.Printf("WARNING: Page %d - Image width %d exceeds page width %d, left-aligning", pageNum, destWidth, pageWidthPx)
		}

		log.Printf("Page %d: DIAGNOSTIC - Calculated offsetX=%d (should center %d px image on %d px page)",
			pageNum, offsetX, destWidth, pageWidthPx)
		log.Printf("Page %d: Positioning image %dx%d on page %dx%d with offset (%d, %d) - centered horizontally, top-aligned",
			pageNum, destWidth, destHeight, pageWidthPx, pageHeightPx, offsetX, offsetY)

		// Start page
		ret, _, err = procStartPage.Call(hDC)
		if ret <= 0 {
			return fmt.Errorf("failed to start page %d: %v", pageNum, err)
		}

		log.Printf("Page %d: Started page", pageNum)

		// CRITICAL: Use 24-bit RGB DIB - directly from RGBA rendered image
		// This provides maximum printer compatibility across all models including Ricoh
		stride := ((imgWidth*3 + 3) & ^3) // 3 bytes per pixel (RGB), DWORD-aligned

		// CRITICAL: Set stretch mode for better image quality
		procSetStretchBltMode.Call(hDC, HALFTONE) // HALFTONE = 4

		// Create DIB section on first page only
		if !dibSectionCreated {
			log.Printf("Creating reusable DIB section for %dx%d bitmap", imgWidth, imgHeight)

			// Create 24-bit RGB bitmap info (no palette needed)
			bmi := &struct {
				BmiHeader BITMAPINFOHEADER
			}{}

			bmi.BmiHeader.BiSize = uint32(unsafe.Sizeof(BITMAPINFOHEADER{}))
			bmi.BmiHeader.BiWidth = int32(imgWidth)
			bmi.BmiHeader.BiHeight = int32(imgHeight) // POSITIVE = bottom-up DIB (standard)
			bmi.BmiHeader.BiPlanes = 1
			bmi.BmiHeader.BiBitCount = 24 // 24-bit RGB (3 bytes per pixel)
			bmi.BmiHeader.BiCompression = BI_RGB
			bmi.BmiHeader.BiSizeImage = uint32(stride * imgHeight)
			bmi.BmiHeader.BiXPelsPerMeter = 3780 // 96 DPI (96 * 39.37 inches/meter)
			bmi.BmiHeader.BiYPelsPerMeter = 3780 // 96 DPI
			bmi.BmiHeader.BiClrUsed = 0          // No palette for 24-bit
			bmi.BmiHeader.BiClrImportant = 0

			// Create DIB section - this creates a bitmap we can write pixel data to directly
			reusableBitmap, _, _ = procCreateDIBSection.Call(
				memDC,
				uintptr(unsafe.Pointer(bmi)),
				DIB_RGB_COLORS,
				uintptr(unsafe.Pointer(&reusablePBits)),
				0,
				0)

			if reusableBitmap == 0 || reusablePBits == 0 {
				return fmt.Errorf("failed to create reusable DIB section (GDI resource limit?)")
			}

			// Select DIB section into memory DC - do this ONCE
			reusableOldBitmap, _, _ = procSelectObject.Call(memDC, reusableBitmap)
			dibSectionCreated = true

			// Cleanup at end of print job
			defer func() {
				if dibSectionCreated {
					procSelectObject.Call(memDC, reusableOldBitmap)
					procDeleteObject.Call(reusableBitmap)
				}
			}()

			log.Printf("Reusable DIB section created successfully")
		}

		// Copy image data to the reusable DIB section
		log.Printf("Page %d: Fast-copying RGBA to reusable BGR DIB section", pageNum)

		// CRITICAL: Validate pBits before unsafe pointer operation
		if reusablePBits == 0 {
			return fmt.Errorf("DIB section pBits is NULL for page %d", pageNum)
		}

		// OPTIMIZED: Ultra-fast RGBA to BGR conversion with better cache locality
		// DIB sections are bottom-up, so we need to flip rows
		destSlice := (*[1 << 30]byte)(unsafe.Pointer(reusablePBits))[: stride*imgHeight : stride*imgHeight]
		srcPix := img.Pix

		// Fast conversion with improved memory access pattern
		for y := 0; y < imgHeight; y++ {
			// Bottom-up DIB: flip row order
			destRowStart := (imgHeight - 1 - y) * stride
			srcRowStart := y * img.Stride

			// Process row in single pass for better cache performance
			destIdx := destRowStart
			srcIdx := srcRowStart
			for x := 0; x < imgWidth; x++ {
				// BGR order for Windows DIB (skip alpha)
				destSlice[destIdx] = srcPix[srcIdx+2]   // B
				destSlice[destIdx+1] = srcPix[srcIdx+1] // G
				destSlice[destIdx+2] = srcPix[srcIdx]   // R
				destIdx += 3
				srcIdx += 4
			}
		}

		runtime.KeepAlive(img)
		runtime.KeepAlive(srcPix)

		// Now BitBlt from memory DC to printer DC
		log.Printf("Page %d: BitBlt from DIB section to printer DC at offset (%d, %d), size %dx%d",
			pageNum, offsetX, offsetY, destWidth, destHeight)

		retBlt, _, _ := procBitBlt.Call(
			hDC, // Destination: printer DC
			uintptr(offsetX), uintptr(offsetY),
			uintptr(destWidth), uintptr(destHeight),
			memDC, // Source: memory DC with DIB section
			0, 0,  // Source position
			SRCCOPY)

		if retBlt == 0 {
			return fmt.Errorf("BitBlt to printer DC failed for page %d", pageNum)
		}

		log.Printf("Page %d: Successfully transferred image to printer DC via BitBlt", pageNum)

		// CRITICAL: Flush GDI to ensure BitBlt completes
		procGdiFlush.Call()

		// End page immediately - no need for long waits since we're reusing objects
		ret, _, err = procEndPage.Call(hDC)
		if ret <= 0 {
			// Abort document on error
			procAbortDoc.Call(hDC)
			printerInitialized = false // Prevent double cleanup
			return fmt.Errorf("failed to end page %d: %v", pageNum, err)
		}

		// OPTIMIZED: No delay needed - GdiFlush + EndPage provide sufficient synchronization

		console.MsgChan <- Message{
			Text:  fmt.Sprintf("✓ Page %d/%d printed successfully", pageNum, numPages),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}

		log.Printf("Successfully printed page %d/%d", pageNum, numPages)
	}

	// CRITICAL: Verify all pages were sent
	if pageNum != numPages {
		log.Printf("ERROR: Expected %d pages but only sent %d", numPages, pageNum)
		procAbortDoc.Call(hDC)
		printerInitialized = false // Prevent double cleanup
		return fmt.Errorf("incomplete print job: sent %d/%d pages", pageNum, numPages)
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("All %d pages sent to printer successfully", numPages),
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	log.Printf("All pages printed - defer will handle EndDoc and cleanup")
	return nil
}

// Removed unused thermal printer functions - using universal printing instead

// renderPDFPageToMonochrome renders PDF directly at target DPI without scaling
func (pm *PrintManager) renderPDFPageToMonochrome(pdfReader *model.PdfReader, pageNum, widthPx, heightPx int, mutex *sync.Mutex) (*image.RGBA, error) {
	// Only lock for GetPage - the PDF reader is not thread-safe
	mutex.Lock()
	page, err := pdfReader.GetPage(pageNum)
	mutex.Unlock()

	if err != nil {
		return nil, fmt.Errorf("get page %d: %w", pageNum, err)
	}

	// Render directly at target dimensions - no scaling needed
	// This happens in parallel without mutex lock
	device := render.NewImageDevice()
	device.OutputWidth = widthPx

	log.Printf("Page %d: Rendering with OutputWidth=%d to capture all content including images", pageNum, widthPx)

	// Render at target DPI directly
	img, err := device.Render(page)
	if err != nil {
		return nil, fmt.Errorf("render page %d at target DPI: %w", pageNum, err)
	}

	// Convert to RGBA with white background for better printer compatibility
	// RGBA works better with Ricoh printers than grayscale palette-based formats
	bounds := img.Bounds()
	// CRITICAL: Always create image with (0,0) origin for consistent addressing
	rgbaImg := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))

	// Diagnostic: Count pixels to detect blank/transparent images
	// pixelCount := 0
	// nonWhitePixels := 0

	// FIXED: Iterate using dimensions, not source bounds
	// Convert to RGBA with white background (better for printers)
	for y := 0; y < bounds.Dy(); y++ {
		for x := 0; x < bounds.Dx(); x++ {
			// Read from source with offset
			srcX := bounds.Min.X + x
			srcY := bounds.Min.Y + y
			originalColor := img.At(srcX, srcY)

			// Convert to RGBA - preserve original colors for better rendering
			rgbaColor := color.RGBAModel.Convert(originalColor)
			rgba := rgbaColor.(color.RGBA)

			// Ensure fully opaque (alpha=255) for printer compatibility
			if rgba.A == 0 {
				// Transparent pixels become white
				rgba = color.RGBA{R: 255, G: 255, B: 255, A: 255}
			} else if rgba.A < 255 {
				// Blend semi-transparent pixels with white background
				alpha := float64(rgba.A) / 255.0
				rgba.R = uint8(float64(rgba.R)*alpha + 255.0*(1.0-alpha))
				rgba.G = uint8(float64(rgba.G)*alpha + 255.0*(1.0-alpha))
				rgba.B = uint8(float64(rgba.B)*alpha + 255.0*(1.0-alpha))
				rgba.A = 255
			}

			// Write to normalized (0,0)-based destination
			rgbaImg.SetRGBA(x, y, rgba)
		}
	}

	log.Printf("Page %d: Converted to RGBA with dimensions %dx%d", pageNum, bounds.Dx(), bounds.Dy())

	return rgbaImg, nil
}

// saveRenderedImageForDebug saves a rendered image to the out folder for debugging
// This helps identify if issues are in rendering or printing stages
func saveRenderedImageForDebug(img *image.RGBA, pageNum int, jobID string) error {
	// Create out folder if it doesn't exist
	outDir := "out"
	if err := os.MkdirAll(outDir, 0755); err != nil {
		return fmt.Errorf("failed to create out directory: %v", err)
	}

	// Generate filename based on job ID and page number
	outputPath := filepath.Join(outDir, fmt.Sprintf("%s_page_%d.png", jobID, pageNum))

	// Create output file
	outFile, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %v", err)
	}
	defer outFile.Close()

	// Encode as PNG
	if err := png.Encode(outFile, img); err != nil {
		return fmt.Errorf("failed to encode PNG: %v", err)
	}

	log.Printf("Saved debug image: %s", outputPath)
	return nil
}

// resetPrinterState ensures the printer driver is properly reset after a print job
// This prevents the printer from being left in a corrupted state that causes garbage output
func (pm *PrintManager) resetPrinterState(printerName string, console *Console) {
	log.Printf("Resetting printer state for: %s", printerName)

	// Create a temporary printer DC and immediately close it
	// This forces the driver to reset its internal state
	printerNamePtr, _ := syscall.UTF16PtrFromString(printerName)
	winspool16Ptr, _ := syscall.UTF16PtrFromString("WINSPOOL")

	hDC, _, _ := procCreateDC.Call(
		uintptr(unsafe.Pointer(winspool16Ptr)),
		uintptr(unsafe.Pointer(printerNamePtr)),
		0, 0)

	if hDC != 0 {
		// Flush any pending GDI operations
		procGdiFlush.Call()

		// Close the DC to reset the printer driver
		procDeleteDC.Call(hDC)

		// Give the driver time to reset
		time.Sleep(100 * time.Millisecond)

		log.Printf("Printer state reset completed for: %s", printerName)
	} else {
		log.Printf("Warning: Could not create DC for printer state reset: %s", printerName)
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Warning: Could not reset printer state for %s", printerName),
			Color: colorNRGBA(255, 165, 0, 255), // Orange
		}
	}
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
			PrinterName:      selectedPrinter,
			JobName:          printCmd.JobName,
			PrintOrientation: printCmd.PrintOrientation,
			Data:             pdfData,
			Token:            "test-print",
			Width:            printCmd.Width,
			Height:           printCmd.Height,
			JobID:            "test-print",
			Event:            "test-print",
			Barcode:          printCmd.Barcode,
			Mashul:           printCmd.Mashul,
			Weight:           printCmd.Weight,
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
	log.Println("Received Live Print command")
	//print full printCmd for debugging
	log.Println("Print Command: ", printCmd)
	selectedPrinter := printerList.Value
	pdfData, err := downloadPDF("print", printCmd.JobID, printCmd.JobToken)
	if err == nil {
		printJob := PrintJob{
			PrinterName:      selectedPrinter,
			JobName:          printCmd.JobName,
			PrintOrientation: printCmd.PrintOrientation,
			Data:             pdfData,
			Token:            "live-print",
			Width:            printCmd.Width,
			Height:           printCmd.Height,
			JobID:            printCmd.JobID,
			Event:            "live-print",
			Barcode:          printCmd.Barcode,
			Mashul:           printCmd.Mashul,
			Weight:           printCmd.Weight,
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
			PrinterName:      selectedPrinter,
			JobName:          printCmd.JobName,
			PrintOrientation: printCmd.PrintOrientation,
			Data:             pdfData,
			Token:            "specimen-print",
			Width:            printCmd.Width,
			Height:           printCmd.Height,
			JobID:            printCmd.JobID,
			Event:            "specimen-print",
			Barcode:          printCmd.Barcode,
			Mashul:           printCmd.Mashul,
			Weight:           printCmd.Weight,
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

// attachPrintQueueWithMonitoring binds print queue and starts progress monitoring goroutine
func (pm *PrintManager) attachPrintQueueWithMonitoring(last_print_event LastPrintEvent, console *Console, last_print_event_found bool, printerName string, totalPages int) {

	if !last_print_event_found {
		time.Sleep(3 * time.Second)
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Binding print queue for job: %s", last_print_event.JobID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}
	loop_count := 1
	event_found := false
	monitoringStarted := false

	for {
		time.Sleep(300 * time.Millisecond)

		log.Println("Binding Loop Count: ", loop_count)

		query_time := 3600000 * loop_count
		if loop_count > 10 {
			query_time = 360000000 * loop_count
		}

		// Generate a random integer between 0 and 9999 to not get cached query
		query_time += mathrand.Intn(1000)

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
					err := saveToEncryptedFile("data/evnts.bin", eck)
					if err != nil {
						log.Println("Error saving print event to file:", err)
					}
					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Print queue attached for job: %s, QueueID: %d", last_print_event.JobID, queue_id),
						Color: colorNRGBA(0, 255, 255, 255), // Cyan
					}

					// Start monitoring goroutine after spooling event found
					if !monitoringStarted {
						monitoringStarted = true
						go pm.monitorPrintProgress(printerName, queue_id, last_print_event.JobID, totalPages, console)
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

// monitorPrintProgress monitors Windows print queue and reports page progress
func (pm *PrintManager) monitorPrintProgress(printerName string, queueID int, jobID string, totalPages int, console *Console) {
	log.Printf("Starting print progress monitor for Queue ID %d, Job %s", queueID, jobID)

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Monitoring print progress for job %s (Queue ID: %d)", jobID, queueID),
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Open printer handle
	printerNamePtr, _ := syscall.UTF16PtrFromString(printerName)
	var hPrinter syscall.Handle
	ret, _, _ := procOpenPrinter.Call(
		uintptr(unsafe.Pointer(printerNamePtr)),
		uintptr(unsafe.Pointer(&hPrinter)),
		0)
	if ret == 0 {
		log.Printf("Failed to open printer for monitoring: %s", printerName)
		return
	}
	defer procClosePrinter.Call(uintptr(hPrinter))

	lastPagesPrinted := uint32(0)
	jobCompleted := false
	monitoringActive := true

	// Monitor loop - runs until job completes or fails
	// OPTIMIZED: Reduced from 150ms to 500ms to minimize spooler contention
	for monitoringActive {
		time.Sleep(500 * time.Millisecond) // Check every 500ms (was 150ms)

		// Check if job still exists in tracker
		if _, ok := printEventTracker.Load(strconv.Itoa(queueID)); !ok {
			log.Printf("Job %d removed from tracker, stopping monitor", queueID)
			break
		}

		// Query print job details
		var bytesNeeded uint32
		var jobCount uint32

		// First call to get required buffer size
		procEnumJobs.Call(
			uintptr(hPrinter),
			0,    // FirstJob
			1000, // NoJobs (query up to 1000 jobs)
			1,    // Level (JOB_INFO_1)
			0,    // pJob (NULL to get size)
			0,    // cbBuf
			uintptr(unsafe.Pointer(&bytesNeeded)),
			uintptr(unsafe.Pointer(&jobCount)))

		if bytesNeeded == 0 {
			continue
		}

		// Allocate buffer and get actual job data
		jobBuffer := make([]byte, bytesNeeded)
		ret, _, _ := procEnumJobs.Call(
			uintptr(hPrinter),
			0,
			1000,
			1,
			uintptr(unsafe.Pointer(&jobBuffer[0])),
			uintptr(bytesNeeded),
			uintptr(unsafe.Pointer(&bytesNeeded)),
			uintptr(unsafe.Pointer(&jobCount)))

		if ret == 0 {
			continue
		}

		// Parse job information
		jobInfoSize := unsafe.Sizeof(JOB_INFO_1{})
		for i := uint32(0); i < jobCount; i++ {
			offset := uintptr(i) * jobInfoSize
			jobInfo := (*JOB_INFO_1)(unsafe.Pointer(&jobBuffer[offset]))

			// Find our job by Queue ID
			if jobInfo.JobId == uint32(queueID) {
				pagesPrinted := jobInfo.PagesPrinted
				totalPagesInQueue := jobInfo.TotalPages

				// Update total pages if queue has more accurate info
				if totalPagesInQueue > 0 && totalPages == 0 {
					totalPages = int(totalPagesInQueue)
				}

				// Send update if pages printed changed
				if pagesPrinted != lastPagesPrinted {
					lastPagesPrinted = pagesPrinted

					progressPercent := 0
					if totalPages > 0 {
						progressPercent = int((float64(pagesPrinted) / float64(totalPages)) * 100)
					}

					log.Printf("Job %s progress: %d/%d pages (%d%%) - Status: 0x%X",
						jobID, pagesPrinted, totalPages, progressPercent, jobInfo.StatusCode)

					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Job %s: %d/%d pages printed (%d%%)", jobID, pagesPrinted, totalPages, progressPercent),
						Color: colorNRGBA(0, 255, 255, 255), // Cyan
					}

					// Send upstream progress update
					if jobID != "test-print" {
						progressMessage := fmt.Sprintf("Printing: %d/%d pages (%d%%)", pagesPrinted, totalPages, progressPercent)
						outgoingMessages <- OutGoingLog{
							JobID:   jobID,
							Event:   "job-progress",
							Message: progressMessage,
						}
					}
				}

				// Check job status for completion or errors
				if jobInfo.StatusCode&JOB_STATUS_PRINTED != 0 ||
					jobInfo.StatusCode&JOB_STATUS_DELETED != 0 {
					log.Printf("Job %d completed/deleted, stopping monitor", queueID)
					jobCompleted = true
					monitoringActive = false
					break
				}

				if jobInfo.StatusCode&JOB_STATUS_ERROR != 0 ||
					jobInfo.StatusCode&JOB_STATUS_USER_INTERVENTION != 0 {
					log.Printf("Job %d has error status: 0x%X, continuing to monitor", queueID, jobInfo.StatusCode)
					// Don't stop monitoring on errors, job might recover
				}

				break
			}
		}
	}

	if jobCompleted {
		console.MsgChan <- Message{
			Text:  fmt.Sprintf("Print monitoring completed for job %s", jobID),
			Color: colorNRGBA(0, 255, 0, 255), // Green
		}
	}

	log.Printf("Print progress monitor stopped for Queue ID %d, Job %s", queueID, jobID)
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
							err := saveToEncryptedFile("data/evnts.bin", eck)
							if err != nil {
								log.Println("Error saving print event to file:", err)
							}
						}

						if delete_event_flag {
							printEventTracker.Delete(strconv.Itoa(event.QueueID))
							err := saveToEncryptedFile("data/evnts.bin", eck)
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
	if len(cipherData) < aes.BlockSize {
		return nil, errors.New("cipherData buffer too small")
	}
	iv := cipherData[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	// Encrypt the data
	stream := cipher.NewCFBEncrypter(block, iv)
	if len(cipherData) < aes.BlockSize+len(data) {
		return nil, errors.New("cipherData buffer size mismatch")
	}
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
	user32   = syscall.NewLazyDLL("user32.dll")

	// GDI APIs for direct printing
	procCreateDC               = gdi32.NewProc("CreateDCW")
	procDeleteDC               = gdi32.NewProc("DeleteDC")
	procResetDC                = gdi32.NewProc("ResetDCW")
	procStretchDIBits          = gdi32.NewProc("StretchDIBits")
	procCreateCompatibleDC     = gdi32.NewProc("CreateCompatibleDC")
	procCreateCompatibleBitmap = gdi32.NewProc("CreateCompatibleBitmap")
	procSelectObject           = gdi32.NewProc("SelectObject")
	procDeleteObject           = gdi32.NewProc("DeleteObject")
	procBitBlt                 = gdi32.NewProc("BitBlt")
	procCreateDIBSection       = gdi32.NewProc("CreateDIBSection")
	procGetDC                  = user32.NewProc("GetDC")
	procReleaseDC              = user32.NewProc("ReleaseDC")

	// Page size and device capability APIs
	procGetDeviceCaps     = gdi32.NewProc("GetDeviceCaps")
	procSetViewportExtEx  = gdi32.NewProc("SetViewportExtEx")
	procSetWindowExtEx    = gdi32.NewProc("SetWindowExtEx")
	procSetMapMode        = gdi32.NewProc("SetMapMode")
	procSetStretchBltMode = gdi32.NewProc("SetStretchBltMode")
	procSetBrushOrgEx     = gdi32.NewProc("SetBrushOrgEx")
	procStartDoc          = gdi32.NewProc("StartDocW")
	procEndDoc            = gdi32.NewProc("EndDoc")
	procAbortDoc          = gdi32.NewProc("AbortDoc")
	procStartPage         = gdi32.NewProc("StartPage")
	procEndPage           = gdi32.NewProc("EndPage")
	procGdiFlush          = gdi32.NewProc("GdiFlush")

	// Winspool APIs for thermal printing and Brother cutting
	procOpenPrinter        = winspool.NewProc("OpenPrinterW")
	procClosePrinter       = winspool.NewProc("ClosePrinter")
	procWritePrinter       = winspool.NewProc("WritePrinter")
	procStartDocPrinter    = winspool.NewProc("StartDocPrinterW")
	procEndDocPrinter      = winspool.NewProc("EndDocPrinter")
	procStartPagePrinter   = winspool.NewProc("StartPagePrinter")
	procEndPagePrinter     = winspool.NewProc("EndPagePrinter")
	procDocumentProperties = winspool.NewProc("DocumentPropertiesW")

	// Print queue monitoring APIs
	procEnumJobs = winspool.NewProc("EnumJobsW")
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

// JOB_INFO_1 structure for Windows print queue monitoring
type JOB_INFO_1 struct {
	JobId        uint32
	PrinterName  *uint16
	MachineName  *uint16
	UserName     *uint16
	Document     *uint16
	Datatype     *uint16
	Status       *uint16
	StatusCode   uint32
	Priority     uint32
	Position     uint32
	TotalPages   uint32
	PagesPrinted uint32
	Submitted    syscall.Filetime
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
	SRCCOPY_STRETCH = 0x00CC0020 // Same value as SRCCOPY (already defined above)

	// Stretch mode constants
	HALFTONE = 4 // High-quality scaling with anti-aliasing

	// Conversion constants
	MM_PER_INCH      = 25.4
	PIXELS_PER_METER = 39.3701 // pixels per meter conversion

	// Windows GDI mapping modes for coordinate transformation
	MM_TEXT        = 1 // Each logical unit is mapped to one device pixel (default)
	MM_LOMETRIC    = 2 // 0.1mm units
	MM_HIMETRIC    = 3 // 0.01mm units
	MM_LOENGLISH   = 4 // 0.01 inch units
	MM_HIENGLISH   = 5 // 0.001 inch units
	MM_TWIPS       = 6 // 1/1440 inch units
	MM_ISOTROPIC   = 7 // Arbitrary units with equal X and Y scaling
	MM_ANISOTROPIC = 8 // Arbitrary units with independent X and Y scaling

	// Print job status codes
	JOB_STATUS_PAUSED            = 0x00000001
	JOB_STATUS_ERROR             = 0x00000002
	JOB_STATUS_DELETING          = 0x00000004
	JOB_STATUS_SPOOLING          = 0x00000008
	JOB_STATUS_PRINTING          = 0x00000010
	JOB_STATUS_OFFLINE           = 0x00000020
	JOB_STATUS_PAPEROUT          = 0x00000040
	JOB_STATUS_PRINTED           = 0x00000080
	JOB_STATUS_DELETED           = 0x00000100
	JOB_STATUS_BLOCKED_DEVQ      = 0x00000200
	JOB_STATUS_USER_INTERVENTION = 0x00000400
	JOB_STATUS_RESTART           = 0x00000800

	// DEVMODE field flags
	DM_ORIENTATION   = 0x00000001
	DM_PAPERSIZE     = 0x00000002
	DM_PAPERLENGTH   = 0x00000004
	DM_PAPERWIDTH    = 0x00000008
	DM_DEFAULTSOURCE = 0x00000200
	DM_COPIES        = 0x00000100
	DM_DUPLEX        = 0x00001000

	// Paper size constants (Windows DMPAPER_* values)
	DMPAPER_LETTER = 1   // 8.5 x 11 inches
	DMPAPER_A4     = 9   // 210 x 297 mm
	DMPAPER_USER   = 256 // Custom size

	// Orientation constants
	DMORIENT_PORTRAIT  = 1
	DMORIENT_LANDSCAPE = 2

	// Duplex constants
	DMDUP_SIMPLEX    = 1 // Single-sided printing
	DMDUP_VERTICAL   = 2 // Duplex on long edge
	DMDUP_HORIZONTAL = 3 // Duplex on short edge

	// Default tray source
	DMBIN_AUTO = 7 // Automatically select appropriate tray based on paper size
)

// DEVMODE structure for printer configuration (simplified version for Windows)
type DEVMODE struct {
	DeviceName       [32]uint16
	SpecVersion      uint16
	DriverVersion    uint16
	Size             uint16
	DriverExtra      uint16
	Fields           uint32
	Orientation      int16
	PaperSize        int16
	PaperLength      int16
	PaperWidth       int16
	Scale            int16
	Copies           int16
	DefaultSource    int16
	PrintQuality     int16
	Color            int16
	Duplex           int16
	YResolution      int16
	TTOption         int16
	Collate          int16
	FormName         [32]uint16
	LogPixels        uint16
	BitsPerPel       uint32
	PelsWidth        uint32
	PelsHeight       uint32
	DisplayFlags     uint32
	DisplayFrequency uint32
	ICMMethod        uint32
	ICMIntent        uint32
	MediaType        uint32
	DitherType       uint32
	Reserved1        uint32
	Reserved2        uint32
	PanningWidth     uint32
	PanningHeight    uint32
}

// resizeRGBA efficiently resizes an RGBA image using bilinear interpolation
// resizeRGBAFast uses nearest neighbor for maximum speed (3-5x faster than bilinear)
func resizeRGBAFast(src *image.RGBA, targetWidth, targetHeight int) *image.RGBA {
	if src == nil || targetWidth <= 0 || targetHeight <= 0 {
		return nil
	}

	srcBounds := src.Bounds()
	srcWidth := srcBounds.Dx()
	srcHeight := srcBounds.Dy()

	if srcWidth <= 0 || srcHeight <= 0 {
		return nil
	}

	dst := image.NewRGBA(image.Rect(0, 0, targetWidth, targetHeight))
	xRatio := float64(srcWidth) / float64(targetWidth)
	yRatio := float64(srcHeight) / float64(targetHeight)

	// Nearest neighbor - very fast, good enough for printing
	for y := 0; y < targetHeight; y++ {
		srcY := int(float64(y) * yRatio)
		if srcY >= srcHeight {
			srcY = srcHeight - 1
		}
		dstOffset := dst.PixOffset(0, y)
		srcOffset := src.PixOffset(srcBounds.Min.X, srcBounds.Min.Y+srcY)

		for x := 0; x < targetWidth; x++ {
			srcX := int(float64(x) * xRatio)
			if srcX >= srcWidth {
				srcX = srcWidth - 1
			}
			srcIdx := srcOffset + srcX*4
			dstIdx := dstOffset + x*4

			// Fast 4-byte copy (RGBA)
			dst.Pix[dstIdx] = src.Pix[srcIdx]
			dst.Pix[dstIdx+1] = src.Pix[srcIdx+1]
			dst.Pix[dstIdx+2] = src.Pix[srcIdx+2]
			dst.Pix[dstIdx+3] = src.Pix[srcIdx+3]
		}
	}

	return dst
}

func resizeRGBA(src *image.RGBA, targetWidth, targetHeight int) *image.RGBA {
	// CRITICAL: Validate inputs to prevent crashes
	if src == nil {
		log.Printf("ERROR: resizeRGBA called with nil source image")
		return nil
	}
	if targetWidth <= 0 || targetHeight <= 0 {
		log.Printf("ERROR: resizeRGBA called with invalid target dimensions: %dx%d", targetWidth, targetHeight)
		return nil
	}

	srcBounds := src.Bounds()
	srcWidth := srcBounds.Dx()
	srcHeight := srcBounds.Dy()

	// CRITICAL: Validate source dimensions
	if srcWidth <= 0 || srcHeight <= 0 {
		log.Printf("ERROR: resizeRGBA source image has invalid dimensions: %dx%d", srcWidth, srcHeight)
		return nil
	}

	// Create destination image
	dst := image.NewRGBA(image.Rect(0, 0, targetWidth, targetHeight))

	// Calculate scaling factors
	xScale := float64(srcWidth) / float64(targetWidth)
	yScale := float64(srcHeight) / float64(targetHeight)

	// Bilinear interpolation for better quality
	for y := 0; y < targetHeight; y++ {
		for x := 0; x < targetWidth; x++ {
			// Map destination pixel to source coordinates
			srcX := float64(x) * xScale
			srcY := float64(y) * yScale

			// Get integer parts
			x0 := int(srcX)
			y0 := int(srcY)
			x1 := x0 + 1
			y1 := y0 + 1

			// Clamp to bounds
			if x1 >= srcWidth {
				x1 = srcWidth - 1
			}
			if y1 >= srcHeight {
				y1 = srcHeight - 1
			}

			// Get fractional parts
			fx := srcX - float64(x0)
			fy := srcY - float64(y0)

			// Get four neighboring pixels
			p00 := src.RGBAAt(srcBounds.Min.X+x0, srcBounds.Min.Y+y0)
			p10 := src.RGBAAt(srcBounds.Min.X+x1, srcBounds.Min.Y+y0)
			p01 := src.RGBAAt(srcBounds.Min.X+x0, srcBounds.Min.Y+y1)
			p11 := src.RGBAAt(srcBounds.Min.X+x1, srcBounds.Min.Y+y1)

			// Bilinear interpolation for each channel
			r := interpolate(float64(p00.R), float64(p10.R), float64(p01.R), float64(p11.R), fx, fy)
			g := interpolate(float64(p00.G), float64(p10.G), float64(p01.G), float64(p11.G), fx, fy)
			b := interpolate(float64(p00.B), float64(p10.B), float64(p01.B), float64(p11.B), fx, fy)
			a := interpolate(float64(p00.A), float64(p10.A), float64(p01.A), float64(p11.A), fx, fy)

			// Set destination pixel
			dst.SetRGBA(x, y, color.RGBA{
				R: uint8(r + 0.5),
				G: uint8(g + 0.5),
				B: uint8(b + 0.5),
				A: uint8(a + 0.5),
			})
		}
	}

	return dst
}

// interpolate performs bilinear interpolation for a single channel
func interpolate(p00, p10, p01, p11, fx, fy float64) float64 {
	p0 := p00*(1-fx) + p10*fx
	p1 := p01*(1-fx) + p11*fx
	return p0*(1-fy) + p1*fy
}

// resizeGrayscale efficiently resizes a grayscale image using bilinear interpolation
func resizeGrayscale(src *image.Gray, targetWidth, targetHeight int) *image.Gray {
	srcBounds := src.Bounds()
	srcWidth := srcBounds.Dx()
	srcHeight := srcBounds.Dy()

	// Create destination image
	dst := image.NewGray(image.Rect(0, 0, targetWidth, targetHeight))

	// Calculate scaling factors
	xScale := float64(srcWidth) / float64(targetWidth)
	yScale := float64(srcHeight) / float64(targetHeight)

	// Bilinear interpolation for better quality
	for y := 0; y < targetHeight; y++ {
		for x := 0; x < targetWidth; x++ {
			// Map destination pixel to source coordinates
			srcX := float64(x) * xScale
			srcY := float64(y) * yScale

			// Get integer parts
			x0 := int(srcX)
			y0 := int(srcY)
			x1 := x0 + 1
			y1 := y0 + 1

			// Clamp to bounds
			if x1 >= srcWidth {
				x1 = srcWidth - 1
			}
			if y1 >= srcHeight {
				y1 = srcHeight - 1
			}

			// Get fractional parts
			fx := srcX - float64(x0)
			fy := srcY - float64(y0)

			// Get four neighboring pixels
			p00 := float64(src.GrayAt(srcBounds.Min.X+x0, srcBounds.Min.Y+y0).Y)
			p10 := float64(src.GrayAt(srcBounds.Min.X+x1, srcBounds.Min.Y+y0).Y)
			p01 := float64(src.GrayAt(srcBounds.Min.X+x0, srcBounds.Min.Y+y1).Y)
			p11 := float64(src.GrayAt(srcBounds.Min.X+x1, srcBounds.Min.Y+y1).Y)

			// Bilinear interpolation
			p0 := p00*(1-fx) + p10*fx
			p1 := p01*(1-fx) + p11*fx
			p := p0*(1-fy) + p1*fy

			// Set destination pixel
			dst.SetGray(x, y, color.Gray{Y: uint8(p + 0.5)})
		}
	}

	return dst
}
