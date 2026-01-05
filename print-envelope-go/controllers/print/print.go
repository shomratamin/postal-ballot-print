package print

import (
	"bytes"
	"fmt"
	"log"
	"strconv"
	"strings"

	"printenvelope/logger"
	"printenvelope/models/order"
	"printenvelope/models/print"
	"printenvelope/types"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/signintech/gopdf"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PrintController struct {
	db             *gorm.DB
	loggerInstance *logger.AsyncLogger
}

func NewPrintController(db *gorm.DB, async_logger *logger.AsyncLogger) *PrintController {
	return &PrintController{db: db, loggerInstance: async_logger}
}

// PrintBatch creates a print batch job from a batch number
func (pc *PrintController) PrintBatch(c *fiber.Ctx) error {
	// Parse request body
	var req struct {
		BatchNumber string `json:"batch_number" validate:"required"`
		PrinterID   string `json:"printer_id" validate:"required"`
		Command     string `json:"command" validate:"required"`
		JobType     string `json:"job_type" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		logger.Error("Failed to parse print batch request", err)
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Invalid request payload",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Validate input
	if req.BatchNumber == "" {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Batch number is required",
			Status:  fiber.StatusBadRequest,
		})
	}

	if req.PrinterID == "" || req.Command == "" || req.JobType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(types.ErrorResponse{
			Message: "Printer ID, command, and job type are required",
			Status:  fiber.StatusBadRequest,
		})
	}

	// Generate UUID for job
	jobUuid := uuid.New().String()

	// Get user UUID from context
	userUUIDInterface := c.Locals("user_id")
	if userUUIDInterface == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(types.ErrorResponse{
			Message: "User not authenticated",
			Status:  fiber.StatusUnauthorized,
		})
	}
	userUUID := userUUIDInterface.(string)

	// Look up user by UUID to get their ID
	var user struct {
		ID uint
	}
	if err := pc.db.Table("users").Select("id").Where("uuid = ?", userUUID).First(&user).Error; err != nil {
		logger.Error("Failed to find user by UUID", err)
		return c.Status(fiber.StatusUnauthorized).JSON(types.ErrorResponse{
			Message: "Invalid user",
			Status:  fiber.StatusUnauthorized,
		})
	}
	userID := user.ID

	// Start transaction
	tx := pc.db.Begin()
	if tx.Error != nil {
		logger.Error("Failed to begin transaction", tx.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find the order batch
	var orderBatch order.OrderBatch
	if err := tx.Where("batch_number = ?", req.BatchNumber).First(&orderBatch).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(types.ErrorResponse{
				Message: fmt.Sprintf("Batch number '%s' not found", req.BatchNumber),
				Status:  fiber.StatusNotFound,
			})
		}
		logger.Error("Failed to fetch order batch", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch order batch",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Check if print batch job already exists for this batch
	var existingPrintBatch print.PrintBatchJob
	if err := tx.Where("order_batch_id = ?", orderBatch.ID).First(&existingPrintBatch).Error; err == nil {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(types.ErrorResponse{
			Message: fmt.Sprintf("Print batch job already exists for batch '%s'", req.BatchNumber),
			Status:  fiber.StatusConflict,
			Data: fiber.Map{
				"print_batch_job_id": existingPrintBatch.ID,
				"status":             existingPrintBatch.Status,
			},
		})
	}

	// Get all orders in the batch with their full details
	var batchItems []order.OrderBatchItem
	if err := tx.Preload("Order.Address").Preload("Order.ReturningAddress").
		Where("order_batch_id = ?", orderBatch.ID).
		Find(&batchItems).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to fetch batch items", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to fetch orders for printing",
			Status:  fiber.StatusInternalServerError,
		})
	}

	if len(batchItems) == 0 {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(types.ErrorResponse{
			Message: "No orders found in this batch",
			Status:  fiber.StatusNotFound,
		})
	}

	// Create PrintBatchJob
	printBatchJob := print.PrintBatchJob{
		BatchNumber:  req.BatchNumber,
		OrderBatchID: orderBatch.ID,
		Status:       print.PrintJobPending,
		TotalJobs:    len(batchItems),
		CreatedByID:  userID,
		PrinterID:    req.PrinterID,
		Command:      req.Command,
		JobType:      req.JobType,
		JobUuid:      jobUuid,
	}

	if err := tx.Create(&printBatchJob).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to create print batch job", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to create print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Create PrintSingleJob and PrintJobData for each order
	var printSingleJobs []print.PrintSingleJob
	var printJobDataList []print.PrintJobData

	for _, item := range batchItems {
		// Create PrintSingleJob
		printSingleJob := print.PrintSingleJob{
			PrintBatchJobID: printBatchJob.ID,
			OrderID:         item.Order.ID,
			Sequence:        item.Order.Sequence,
			Status:          print.PrintJobPending,
			PrinterID:       req.PrinterID,
			Command:         req.Command,
			JobType:         req.JobType,
			JobUuid:         jobUuid,
		}

		if err := tx.Create(&printSingleJob).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create print single job", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create print jobs",
				Status:  fiber.StatusInternalServerError,
			})
		}

		printSingleJobs = append(printSingleJobs, printSingleJob)

		// Create PrintJobData with flattened order data
		printJobData := print.PrintJobData{
			PrintSingleJobID:       printSingleJob.ID,
			OrderID:                item.Order.ID,
			Sequence:               item.Order.Sequence,
			RecipientForeName:      item.Order.Address.RecipientForeName,
			RecipientOtherName:     item.Order.Address.RecipientOtherName,
			PostalAddress:          item.Order.Address.PostalAddress,
			ZipCode:                item.Order.Address.ZipCode,
			City:                   item.Order.Address.City,
			PhoneNo:                item.Order.Address.PhoneNo,
			QrID:                   item.Order.Address.QrID,
			CountryCode:            item.Order.Address.CountryCode,
			DistrictHeadPostOffice: item.Order.ReturningAddress.DistrictHeadPostOffice,
			ReturningZipCode:       item.Order.ReturningAddress.ZipCode,
			District:               item.Order.ReturningAddress.District,
		}

		if err := tx.Create(&printJobData).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create print job data", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create print job data",
				Status:  fiber.StatusInternalServerError,
			})
		}

		printJobDataList = append(printJobDataList, printJobData)

		// Fire OrderPrinted event
		orderEvent := order.OrderEvent{
			OrderID: item.Order.ID,
			Status:  order.OrderPrintStarted,
			Message: fmt.Sprintf("Order %d queued for printing in batch %s", item.Order.Sequence, req.BatchNumber),
		}

		if err := tx.Create(&orderEvent).Error; err != nil {
			tx.Rollback()
			logger.Error("Failed to create order event", err)
			return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
				Message: "Failed to create order event",
				Status:  fiber.StatusInternalServerError,
			})
		}
	}

	// Update print batch job start time
	now := time.Now()
	printBatchJob.StartedAt = &now
	if err := tx.Save(&printBatchJob).Error; err != nil {
		tx.Rollback()
		logger.Error("Failed to update print batch job", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to update print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		logger.Error("Failed to commit transaction", err)
		return c.Status(fiber.StatusInternalServerError).JSON(types.ErrorResponse{
			Message: "Failed to finalize print batch job",
			Status:  fiber.StatusInternalServerError,
		})
	}

	// Log the activity
	logger.Success(fmt.Sprintf("Created print batch job for batch %s with %d orders", req.BatchNumber, len(batchItems)))

	// Return success response
	return c.Status(fiber.StatusCreated).JSON(types.ApiResponse{
		Message: "Print batch job created successfully",
		Status:  fiber.StatusCreated,
		Data: fiber.Map{
			"print_batch_job": fiber.Map{
				"id":           printBatchJob.ID,
				"batch_number": printBatchJob.BatchNumber,
				"status":       printBatchJob.Status,
				"total_jobs":   printBatchJob.TotalJobs,
				"started_at":   printBatchJob.StartedAt,
			},
			"total_print_jobs": len(printSingleJobs),
		},
	})
}

func (pc *PrintController) PrintEnvelope(c *fiber.Ctx) error {
	var internalJob types.InternalJob
	if err := c.BodyParser(&internalJob); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input data"})
	}

	// var (
	// 	pageWidth  = internalJob.InternalJobData.PrintWidthInch * 72.0  // Convert inches to points (1 inch = 72 points)
	// 	pageHeight = internalJob.InternalJobData.PrintHeightInch * 72.0 // Convert inches to points (1 inch = 72 points)
	// )

	pageWidth := 8.5 * 72.0
	pageHeight := 7.75 * 72.0

	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: gopdf.Rect{W: pageWidth, H: pageHeight}})
	pdf.AddPage()

	// Load font
	if err := pdf.AddTTFFont("english", "fonts/roboto_mono.ttf"); err != nil {
		log.Println("Failed to load english font:", err)
	}
	if err := pdf.SetFont("english", "", 26); err != nil {
		log.Println("Failed to set font:", err)
	}

	// Load background image
	imgHolder, err := gopdf.ImageHolderByPath("assets/Outbound-v-4.png")
	if err != nil {
		log.Println("Failed to load background image:", err)
	}

	// Draw background image
	imgX := 0.0
	imgY := 0.0
	imgW := 612.0
	imgH := 558.0
	if err == nil {
		pdf.ImageByHolder(imgHolder, imgX, imgY, &gopdf.Rect{W: imgW, H: imgH})
	}

	// Heading
	// heading := "BANGLADESH POST OFFICE"
	// // if err := pdf.SetFont("english-bold", "", 24); err != nil {
	// // 	log.Println("Failed to set bold font:", err)
	// // }
	// headingWidth, _ := pdf.MeasureTextWidth(heading)
	// headingX := (pageWidth - headingWidth) / 2
	// pdf.SetX(headingX)
	// pdf.SetY(30)
	// if err := pdf.CellWithOption(&gopdf.Rect{W: headingWidth, H: 30}, heading, gopdf.CellOption{Align: gopdf.Left}); err != nil {
	// 	log.Println("Failed to draw text:", err)
	// }

	// Barcode logic
	// var textY float64
	// if internalJob.InternalJobData.Barcode != "" {
	// 	bar, err := code128.Encode(internalJob.InternalJobData.Barcode)
	// 	if err != nil {
	// 		log.Println("Barcode encoding failed:", err)
	// 		return c.Status(500).JSON(fiber.Map{"error": "Failed to encode barcode"})
	// 	}
	// 	scaledBar, err := barcode.Scale(bar, 500, 50)
	// 	if err != nil {
	// 		log.Println("Barcode scaling failed:", err)
	// 		return c.Status(500).JSON(fiber.Map{"error": "Failed to scale barcode"})
	// 	}

	// 	rgba := image.NewRGBA(scaledBar.Bounds())
	// 	for y := scaledBar.Bounds().Min.Y; y < scaledBar.Bounds().Max.Y; y++ {
	// 		for x := scaledBar.Bounds().Min.X; x < scaledBar.Bounds().Max.X; x++ {
	// 			rgba.Set(x, y, scaledBar.At(x, y))
	// 		}
	// 	}

	// 	var imgBuf bytes.Buffer
	// 	if err := png.Encode(&imgBuf, rgba); err != nil {
	// 		log.Println("Failed to encode PNG:", err)
	// 		return c.Status(500).JSON(fiber.Map{"error": "Failed to encode barcode image"})
	// 	}

	// 	holder, err := gopdf.ImageHolderByBytes(imgBuf.Bytes())
	// 	if err != nil {
	// 		log.Println("Failed to create image holder:", err)
	// 		return c.Status(500).JSON(fiber.Map{"error": "Invalid barcode image"})
	// 	}

	// 	imgW := 550.0
	// 	imgH := 70.0
	// 	imgX := (pageWidth - imgW) / 2
	// 	imgY := 90.0

	// 	if err := pdf.ImageByHolder(holder, imgX, imgY, &gopdf.Rect{W: imgW, H: imgH}); err != nil {
	// 		log.Println("Image draw failed:", err)
	// 	}

	// 	if err := pdf.SetFont("english", "", 36); err != nil {
	// 		log.Println("Failed to set font for barcode text:", err)
	// 	}

	// 	text := internalJob.InternalJobData.Barcode
	// 	textWidth, _ := pdf.MeasureTextWidth(text)
	// 	textX := (pageWidth - textWidth) / 2
	// 	textY = imgY + imgH

	// 	pdf.SetX(textX)
	// 	pdf.SetY(textY)
	// 	pdf.Cell(nil, text)
	// }

	// Layout vars
	// y := textY + 50
	// x := 35.0
	// lineHeight := 30.0
	// fontSize := 24.0
	// maxTextWidth := pageWidth - x*2

	// // pdf.SetFont("english", "", fontSize)

	// // Draw content
	// // Set font size for recipient
	// if err := pdf.SetFont("english", "", fontSize); err != nil {
	// 	log.Println("Failed to set font:", err)
	// }
	// recipient := fmt.Sprintf("Recipient: %s (%s), %s, %s",
	// 	internalJob.InternalJobData.RecipientName,
	// 	internalJob.InternalJobData.RecipientPhone,
	// 	internalJob.InternalJobData.RecipientAddress,
	// 	internalJob.InternalJobData.RecipientDistrict,
	// )
	// y = drawPrintInternalWrappedText(&pdf, recipient, x, y, maxTextWidth, lineHeight, "english", fontSize)
	// y += 20 // Add extra space after recipient

	// // Set font size for sender
	// if err := pdf.SetFont("english", "", fontSize); err != nil {
	// 	log.Println("Failed to set font:", err)
	// }
	// sender := fmt.Sprintf("Sender: %s (%s), %s, %s",
	// 	internalJob.InternalJobData.SenderName,
	// 	internalJob.InternalJobData.SenderPhone,
	// 	internalJob.InternalJobData.SenderAddress,
	// 	internalJob.InternalJobData.SenderDistrict,
	// )
	// y = drawPrintInternalWrappedText(&pdf, sender, x, y, maxTextWidth, lineHeight, "english", fontSize)
	// y += 10 // Add extra space after sender

	// weight, _ := strconv.ParseFloat(internalJob.InternalJobData.Weight, 64)
	// mashul, _ := strconv.ParseFloat(internalJob.InternalJobData.Mashul, 64)

	// formatedAdditionalItems := FormatAdditionalItems(
	// 	internalJob.InternalJobData.AdditionalServiceText,
	// 	weight,
	// 	mashul,
	// )

	// for _, line := range formatedAdditionalItems {
	// 	y = drawPrintInternalWrappedText(&pdf, line, x, y, maxTextWidth, lineHeight, "english", 18.0)
	// }

	// registryText := strings.ToUpper(internalJob.InternalJobData.AdditionalServiceText)
	// _ = drawPrintInternalWrappedText(&pdf, registryText, x, y, maxTextWidth, lineHeight, "english", fontSize)

	// Output PDF
	var pdfBuf bytes.Buffer
	if err := pdf.Write(&pdfBuf); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate PDF")
	}

	// tempFile := "simple_output.pdf"
	// err = os.WriteFile(tempFile, pdfBuf.Bytes(), 0644)
	// if err != nil {
	// 	return fmt.Errorf("failed to save PDF file: %w", err)
	// }

	// absPath, _ := filepath.Abs(tempFile)

	// // 3. Print using PowerShell
	// cmd := exec.Command("powershell", "-Command", fmt.Sprintf(`
	// 	$shell = New-Object -ComObject Shell.Application
	// 	$shell.ShellExecute("%s", "", "", "printto", "%s")
	// `, absPath, "TSC TX300"))

	// err = cmd.Run()
	// if err != nil {
	// 	return fmt.Errorf("failed to print file: %w", err)
	// }

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", "inline; filename=label.pdf")
	return c.Send(pdfBuf.Bytes())
}

func drawPrintInternalWrappedText(pdf *gopdf.GoPdf, text string, x, y, maxWidth, lineHeight float64, font string, size float64) float64 {

	if err := pdf.SetFont(font, "", size); err != nil {
		log.Println("Failed to set font in wrapped text:", err)
	}
	words := bytes.Fields([]byte(text)) // ensures clean whitespace
	line := ""

	for _, word := range words {
		testLine := line
		if testLine != "" {
			testLine += " "
		}
		testLine += string(word)

		width, _ := pdf.MeasureTextWidth(testLine)
		if width > maxWidth {
			// Draw current line
			pdf.SetX(x)
			pdf.SetY(y)
			pdf.Cell(nil, line)
			y += lineHeight
			line = string(word)
		} else {
			line = testLine
		}
	}

	if line != "" {
		pdf.SetX(x)
		pdf.SetY(y)
		pdf.Cell(nil, line)
		y += lineHeight
	}

	return y
}

func FormatAdditionalItems(text string, jobWeight float64, jobMashul float64) []string {
	if text == "" {
		return []string{}
	}

	var formattedItems []string
	items := strings.Split(text, ",")

	for _, item := range items {
		formattedItems = append(formattedItems, formatServiceItem(item))
	}

	// Group into lines of 2 items per line
	var lines []string
	for i := 0; i < len(formattedItems); i += 2 {
		end := i + 2
		if end > len(formattedItems) {
			end = len(formattedItems)
		}
		lines = append(lines, strings.Join(formattedItems[i:end], ", "))
	}

	// Add weight and mashul at the end
	weightLine := fmt.Sprintf("Weight: %s gm, Mashul: %s tk", formatNumber(jobWeight), formatNumber(jobMashul))
	lines = append(lines, weightLine)

	return lines
}

func formatServiceItem(item string) string {
	item = strings.TrimSpace(item)
	switch {
	case item == "registry":
		return "Registry"
	case item == "ad_pod":
		return "AD_POD"
	case strings.HasPrefix(item, "insurance:"):
		val := strings.TrimPrefix(item, "insurance:")
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return fmt.Sprintf("INSURANCE: %s", val)
		}
		return fmt.Sprintf("INSURANCE: %s", formatNumber(f))
	case strings.HasPrefix(item, "vp:"):
		val := strings.TrimPrefix(item, "vp:")
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return fmt.Sprintf("VP: %s", val)
		}
		return fmt.Sprintf("VP: %s", formatNumber(f))
	case item == "postal_service":
		return "Postal Service"
	case item == "blind_literature":
		return "Blind Literature"
	default:
		return item // fallback
	}
}

func formatNumber(input float64) string {
	return commaSeparated(input)
}

func commaSeparated(f float64) string {
	s := fmt.Sprintf("%.2f", f)
	intPart, fracPart := s[:len(s)-3], s[len(s)-3:]
	n := len(intPart)
	if n <= 3 {
		return intPart + fracPart
	}
	var b strings.Builder
	pre := n % 3
	if pre > 0 {
		b.WriteString(intPart[:pre])
		b.WriteString(",")
	}
	for i := pre; i < n; i += 3 {
		b.WriteString(intPart[i : i+3])
		if i+3 < n {
			b.WriteString(",")
		}
	}
	b.WriteString(fracPart)
	return b.String()
}
