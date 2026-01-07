package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image/color"
	"image/png"
	"io"
	"log"
	"net/http"
	"os"
	"sync"

	"gioui.org/app"
	"gioui.org/layout"
	"gioui.org/widget"
	"golang.org/x/image/bmp"
)

// colorNRGBA is a helper function to create a color.NRGBA
func colorNRGBA(r, g, b, a uint8) color.NRGBA {
	return color.NRGBA{R: r, G: g, B: b, A: a}
}

// Console holds the state and messages for the console display
type Console struct {
	messages []Message
	mu       sync.Mutex
	// Buffered channel to receive messages
	MsgChan chan Message
	// Scrollable list
	list widget.List
}

// NewConsole initializes a new Console
func NewConsole(bufferSize int) *Console {
	return &Console{
		messages: make([]Message, 0, bufferSize),
		MsgChan:  make(chan Message, bufferSize),
		list:     widget.List{List: layout.List{Axis: layout.Vertical}},
	}
}

// Message represents a single console message with text and color
type Message struct {
	Text  string
	Color color.NRGBA
}

// AddMessage adds a new message to the console
func (c *Console) AddMessage(msg Message, w *app.Window) {
	c.mu.Lock()
	defer c.mu.Unlock()
	// Maintain the buffer size
	if len(c.messages) >= cap(c.messages) {
		c.messages = c.messages[1:]
	}
	c.messages = append(c.messages, msg)

	// Ensure the window is not nil before calling Invalidate
	if w != nil {
		w.Invalidate()
	} else {
		log.Println("Window is nil; unable to invalidate")
	}

}

// LoadMessages continuously listens on the MsgChan and adds messages to the console
func (c *Console) LoadMessages(w *app.Window) {
	for msg := range c.MsgChan {
		c.AddMessage(msg, w)
	}
}

// ConvertPNGToBMPBytes reads a PNG file, converts it to BMP format, and returns the BMP data as []byte
func ConvertPNGToBMPBytes(pngPath string) ([]byte, error) {
	// Open the PNG file
	pngFile, err := os.Open(pngPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open PNG file '%s': %v", pngPath, err)
	}
	defer func() {
		if err := pngFile.Close(); err != nil {
			log.Printf("Error closing PNG file: %v", err)
		}
	}()

	log.Printf("Opened PNG file '%s' successfully.", pngPath)

	// Decode the PNG image
	img, err := png.Decode(pngFile)
	if err != nil {
		return nil, fmt.Errorf("failed to decode PNG file '%s': %v", pngPath, err)
	}

	log.Printf("Decoded PNG file '%s' successfully.", pngPath)

	// Encode the image to BMP format
	var buf bytes.Buffer
	err = bmp.Encode(&buf, img)
	if err != nil {
		return nil, fmt.Errorf("failed to encode image to BMP: %v", err)
	}

	log.Printf("Encoded image to BMP successfully. BMP size: %d bytes.", buf.Len())

	return buf.Bytes(), nil
}

// downloadPDF downloads a PDF from a given API and returns its data
func downloadPDF(command string, job_id string, job_token string) ([]byte, error) {
	url := appSettings.LIVE_PDf_URL
	test_url := appSettings.TEST_PDF_URL
	specimen_url := appSettings.SPECIMEN_PDF_URL
	internal_url := appSettings.INTERNAL_PDF_URL
	http_method := "POST"

	if command == "test-print" {
		url = test_url
		http_method = "GET"
	}
	if command == "specimen-print" {
		url = specimen_url
	}
	if command == "internal-print" {
		url = internal_url
	}

	bodyData := map[string]string{
		"job_id":    job_id,
		"job_token": job_token,
	}

	body, err := json.Marshal(bodyData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %v", err)
	}

	request, err := http.NewRequest(http_method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set the Content-Type header to application/json
	request.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}

	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download PDF: received status code %d", response.StatusCode)
	}

	data, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read PDF data: %v", err)
	}
	//save pdf to out folder for testing
	err = os.WriteFile("out/downloaded.pdf", data, 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to save downloaded PDF: %v", err)
	}

	return data, nil
}
