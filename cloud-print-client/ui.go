package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"

	"gioui.org/app"
	"gioui.org/font"
	"gioui.org/font/gofont"
	"gioui.org/font/opentype"
	"gioui.org/io/event"
	"gioui.org/layout"
	"gioui.org/op"
	"gioui.org/op/clip"
	"gioui.org/op/paint"
	"gioui.org/text"
	"gioui.org/unit"
	"gioui.org/widget"
	"gioui.org/widget/material"
	"github.com/skip2/go-qrcode"
	"github.com/srwiley/oksvg"
	"github.com/srwiley/rasterx"
	// "golang.org/x/exp/shiny/materialdesign/icons"
)

// Type aliases for convenience
type (
	C = layout.Context
	D = layout.Dimensions
)

// // loadImage loads an image from the specified file path and returns a paint.ImageOp
// func loadImage(filePath string) (paint.ImageOp, error) {
// 	file, err := os.Open(filePath)
// 	if err != nil {
// 		return paint.ImageOp{}, err
// 	}
// 	defer file.Close()

// 	img, _, err := image.Decode(file)
// 	if err != nil {
// 		return paint.ImageOp{}, err
// 	}

// 	return paint.NewImageOp(img), nil
// }

type PrintHistory struct {
	Barcode string
	Time    string
}

var printHistoryList = make([]PrintHistory, 0)

func addPrintHistory(history PrintHistory) {
	printHistoryList = append(printHistoryList, history)
}

func loadSVG(filePath string) (paint.ImageOp, error) {
	// Open the SVG file
	file, err := os.Open(filePath)
	if err != nil {
		return paint.ImageOp{}, err
	}
	defer file.Close()

	// Parse the SVG file
	icon, err := oksvg.ReadIconStream(file) // Use nil for default colors
	if err != nil {
		return paint.ImageOp{}, err
	}

	// Create an RGBA image for rendering
	width, height := int(icon.ViewBox.W), int(icon.ViewBox.H)
	rgba := image.NewRGBA(image.Rect(0, 0, width, height))

	// Create a rasterx.Dasher for rendering
	dasher := rasterx.NewDasher(width, height, rasterx.NewScannerGV(width, height, rgba, rgba.Bounds()))

	// Render the SVG
	icon.SetTarget(0, 0, float64(width), float64(height))
	icon.Draw(dasher, 1.0)

	// Convert the RGBA image to a Gio paint.ImageOp
	return paint.NewImageOp(rgba), nil
}

// Printer represents a printer with a name and status
type Printer struct {
	Name   string
	Status int
}

// bpoQRCode represents a QR code with content and size
type bpoQRCode struct {
	Content string
	Size    int
}

// Generate generates the QR code as a PNG byte slice
func (code *bpoQRCode) Generate() ([]byte, error) {
	qrCode, err := qrcode.Encode(code.Content, qrcode.Low, code.Size)
	if err != nil {
		return nil, fmt.Errorf("could not generate a QR code: %v", err)
	}
	return qrCode, nil
}

// drawLEDIndicator draws a circular LED-like indicator with the specified color
func drawLEDIndicator(gtx C, col color.NRGBA) D {
	size := gtx.Dp(15) // Size of the LED
	diameter := float32(size)

	// Create a circular path using clip.Ellipse
	ellipse := clip.Ellipse{
		Min: image.Point{X: 0, Y: 0},
		Max: image.Point{X: int(diameter), Y: int(diameter)},
	}.Op(gtx.Ops)

	// Paint the circular LED with the specified color
	paint.FillShape(gtx.Ops, col, ellipse)

	return D{Size: image.Point{X: size, Y: size}}
}

var printerList widget.Enum
var previousPrinterSelection string

// loop is the main event loop for the application
func loop(w *app.Window, console *Console, printManager *PrintManager, printersChan <-chan []PrinterStatus, client_id string) error {
	var testPrintBtn widget.Clickable
	var enableLoggingBtn widget.Clickable
	var machineIdSaveButton widget.Clickable
	var machineIdEditor widget.Editor

	// Load Roboto Mono font
	robotoMonoFace := loadRobotoMono()
	kalpurushFace := loadKalpurush()

	// Create a material theme with the default Go fonts
	th := material.NewTheme()
	table_header_th := material.NewTheme()
	table_header_th.TextSize = unit.Sp(11)
	table_header_th.Shaper = text.NewShaper(text.WithCollection(append(gofont.Collection(), robotoMonoFace)))

	table_body_th := material.NewTheme()
	table_body_th.TextSize = unit.Sp(13)
	table_body_th.Shaper = text.NewShaper(text.WithCollection(append(gofont.Collection(), robotoMonoFace)))

	small_th := material.NewTheme()
	small_th.TextSize = unit.Sp(12)
	small_th.Shaper = text.NewShaper(text.WithCollection(append(gofont.Collection(), robotoMonoFace)))

	// saveIcon, _ := widget.NewIcon(icons.ContentSave)

	// Add Roboto Mono to the text shaper's collection
	th.Shaper = text.NewShaper(text.WithCollection(
		append(gofont.Collection(), robotoMonoFace, kalpurushFace), // Combine default fonts with Roboto Mono
	))

	qr := bpoQRCode{Content: client_id, Size: 128} // QR code content and size
	qrImageBytes, err := qr.Generate()
	if err != nil {
		log.Fatalf("Failed to generate QR code: %v", err)
	}

	// Decode the QR code image from bytes
	qrImage, _, err := image.Decode(bytes.NewReader(qrImageBytes))
	if err != nil {
		log.Fatalf("Failed to decode QR code image: %v", err)
	}

	// Load the SVG logo
	logoImageOp, err := loadSVG("bpo.svg")
	if err != nil {
		log.Fatalf("Failed to load SVG logo: %v", err)
	}
	if err != nil {
		log.Fatalf("Failed to load logo: %v", err)
	}

	events := make(chan event.Event)
	acks := make(chan struct{})

	// Event Loop Goroutine
	go func() {
		for {
			ev := w.Event()
			events <- ev
			<-acks
			if _, ok := ev.(app.DestroyEvent); ok {
				return
			}
		}
	}()

	var ops op.Ops

	// Internal Printers list maintained within the UI loop
	var printers []PrinterStatus
	var printersMu sync.Mutex // Mutex to protect printers slice

	// Initialize a response channel for print job responses
	// printResponseCh := make(chan Message, 10) // Buffered to prevent blocking

	// Goroutine to listen to printersChan and update printers list
	go func() {
		for newPrinters := range printersChan {
			printersMu.Lock()
			printers = newPrinters
			printersMu.Unlock()
			// Optionally, log or display a message about the updated printer list
			console.MsgChan <- Message{
				Text:  "Printer list updated.",
				Color: colorNRGBA(0, 255, 255, 255), // Cyan
			}
			// Trigger a UI redraw
			w.Invalidate()
		}
	}()
	// for i := 0; i < 40; i++ {
	// 	printHistoryList = append(printHistoryList, PrintHistory{
	// 		Barcode: "1234567890   ",
	// 		Mashul:  "0.0   ",
	// 		Weight:  "১০০   ",
	// 		Time:    "14:32 AM   ",
	// 	})
	// }

	var list widget.List

	testPrintBtnClicked := false
	enableLoggingBtnClicked := false
	machineIdBtnClicked := false

	list = widget.List{List: layout.List{Axis: layout.Vertical}}
	// Main Event Loop
	for e := range events {

		switch e := e.(type) {

		case app.DestroyEvent:
			acks <- struct{}{}
			return e.Err

		case app.FrameEvent:
			gtx := app.NewContext(&ops, e)
			inset := layout.UniformInset(unit.Dp(10)) // Padding around all UI elements
			layout.Flex{Axis: layout.Vertical}.Layout(gtx,
				// Header
				layout.Rigid(func(gtx C) D {
					paint.FillShape(gtx.Ops, color.NRGBA{R: 0, G: 68, B: 45, A: 255}, clip.Rect{
						Min: image.Point{X: 0, Y: 0},
						Max: image.Point{X: gtx.Constraints.Max.X, Y: gtx.Dp(80)}, // Adjust Y for height as needed
					}.Op())

					return layout.Inset{Top: unit.Dp(5), Bottom: unit.Dp(5), Left: unit.Dp(16), Right: unit.Dp(16)}.Layout(gtx, func(gtx C) D {

						return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Middle}.Layout(gtx,
							// 1st cell (50% width) - Logo and Title
							layout.Flexed(0.5, func(gtx C) D {
								return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Middle}.Layout(gtx,
									layout.Rigid(func(gtx C) D {

										img := widget.Image{
											Src:   logoImageOp,
											Scale: 0.25, // Adjust the scale as needed

										}

										return img.Layout(gtx)
									}),
									layout.Rigid(func(gtx C) D {
										gtx.Constraints.Min.X = gtx.Dp(20) // Add a small gap between the logo and title
										h6 := material.H6(th, "ডাক যন্ত্র (Ballot Envelope)")
										h6.TextSize = unit.Sp(35) // Adjust the size as needed
										h6.Font.Typeface = "Kalpurush"
										h6.Color = color.NRGBA{R: 255, G: 255, B: 255, A: 255}

										return layout.Flex{Axis: layout.Vertical, Alignment: layout.Middle}.Layout(gtx,
											layout.Rigid(func(gtx C) D {
												// Apply padding to the left and right of the text
												inset := layout.Inset{
													Left:  unit.Dp(16), // Adjust the left padding as needed
													Right: unit.Dp(16), // Adjust the right padding as needed
													Top:   unit.Dp(12), // Adjust the top padding as needed
												}
												return inset.Layout(gtx, h6.Layout)
											}),
										)
									}),
								)
							}),

							// 2nd cell (30% width) - Status text
							layout.Flexed(0.3, func(gtx C) D {
								return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Middle}.Layout(gtx,
									layout.Rigid(func(gtx C) D {
										inset := layout.Inset{
											Left:  unit.Dp(16), // Adjust the left padding as needed
											Right: unit.Dp(16), // Adjust the right padding as needed
										}
										return inset.Layout(gtx, func(gtx C) D {
											body := material.Body1(th, "")
											body.Color = color.NRGBA{R: 255, G: 255, B: 255, A: 255} // Set the text color to white
											return body.Layout(gtx)
										})
									}),
								)
							}),
						)
					})
				}),

				// Col 1: Print History
				layout.Rigid(func(gtx C) D {
					gtx.Constraints.Max.Y = gtx.Dp(220) // Adjust the height as needed
					return inset.Layout(gtx, func(gtx C) D {
						return layout.Flex{Axis: layout.Horizontal, Spacing: layout.SpaceBetween}.Layout(gtx,

							//last prints table
							layout.Flexed(.55, func(gtx C) D {
								return layout.Flex{
									Axis:      layout.Vertical,
									Alignment: layout.Start,
								}.Layout(gtx,
									// Table Header
									layout.Rigid(func(gtx C) D {
										return layout.Inset{Bottom: unit.Dp(8)}.Layout(gtx, func(gtx C) D {
											return layout.Flex{
												Axis:      layout.Horizontal,
												Alignment: layout.Middle,
											}.Layout(gtx,

												layout.Rigid(func(gtx C) D {
													h6 := material.H6(table_header_th, "ID")
													//o
													h6.Color = color.NRGBA{R: 0, G: 51, B: 102, A: 255}
													h6.Font.Weight = font.Bold
													return h6.Layout(gtx)
												}),
												layout.Rigid(func(gtx C) D {
													h6 := material.H6(table_header_th, "                          Time")
													h6.Color = color.NRGBA{R: 0, G: 51, B: 102, A: 255}
													h6.Font.Weight = font.Bold
													return h6.Layout(gtx)
												}),
												layout.Rigid(func(gtx C) D {
													h6 := material.H6(table_header_th, "                  Batch ID")
													h6.Color = color.NRGBA{R: 0, G: 51, B: 102, A: 255}
													h6.Font.Weight = font.Bold
													return h6.Layout(gtx)
												}),
											)
										})
									}),
									// Table Body
									layout.Rigid(func(gtx C) D {
										// Use layout.Flex to layout rows of history dynamically

										if len(printHistoryList) > 10 {
											list.ScrollToEnd = true
										}

										return list.Layout(gtx, len(printHistoryList), func(gtx C, index int) D {
											history := printHistoryList[index]
											body_color := color.NRGBA{R: 255, G: 255, B: 255, A: 255}
											if ((index + 1) % 2) == 0 {
												body_color = color.NRGBA{R: 10, G: 10, B: 10, A: 255}
											} else {
												body_color = color.NRGBA{R: 50, G: 50, B: 50, A: 255}
											}

											return layout.Flex{
												Axis:      layout.Horizontal,
												Alignment: layout.Middle, // Center items vertically
											}.Layout(gtx,
												layout.Rigid(func(gtx C) D {
													_space := strings.Repeat(" ", func() int {
														if index+1 > 99999 {
															return 9 - 6
														} else if index+1 > 9999 {
															return 9 - 5
														} else if index+1 > 999 {
															return 9 - 4
														} else if index+1 > 99 {
															return 9 - 3
														} else if index+1 > 9 {
															return 9 - 2
														}

														return 9
													}())

													body := material.Body1(table_body_th, strconv.Itoa(index+1)+_space)
													body.Color = body_color
													if (index+1)%2 == 0 {
														body.Font.Weight = font.Bold
													}
													return body.Layout(gtx)
												}),
												layout.Rigid(func(gtx C) D {
													body := material.Body1(table_body_th, history.Time+"      ")
													body.Color = body_color
													if (index+1)%2 == 0 {
														body.Font.Weight = font.Bold
													}
													return body.Layout(gtx)
												}),
												layout.Rigid(func(gtx C) D {
													body := material.Body1(table_body_th, history.Barcode)
													body.Color = body_color
													if (index+1)%2 == 0 {
														body.Font.Weight = font.Bold
													}

													return body.Layout(gtx)
												}),
											)

										})
									}),
								)
							}),

							// Printer selection (50% width)
							layout.Flexed(0.15, func(gtx C) D {
								return layout.Flex{Axis: layout.Vertical}.Layout(gtx,
									layout.Rigid(material.H6(small_th, "  Select Printer:").Layout),
									layout.Rigid(func(gtx C) D {
										printersMu.Lock()
										defer printersMu.Unlock()

										if len(printers) == 0 {
											// No printers available
											return material.Body1(small_th, "No printers found.").Layout(gtx)
										}

										// Set the first printer as the default if not already set
										if printerList.Value == "" && len(printers) > 0 {
											printerList.Value = printers[0].Name
										}

										children := make([]layout.FlexChild, len(printers))
										for i, printer := range printers {
											p := printer // Capture the printer variable
											children[i] = layout.Rigid(func(gtx C) D {
												return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Middle}.Layout(gtx,
													layout.Rigid(material.RadioButton(small_th, &printerList, p.Name, p.Name).Layout),
													layout.Rigid(func(gtx C) D {
														// Adding space between printer name and LED indicator
														return layout.Spacer{Width: unit.Dp(10)}.Layout(gtx)
													}),
													layout.Rigid(func(gtx C) D {
														// Determine LED color based on printer status
														var ledColor color.NRGBA
														switch p.Status {
														case PRINTER_STATUS_IDLE:
															ledColor = color.NRGBA{R: 255, G: 140, B: 0, A: 255} // Orange for idle(255, 140, 0, 255)
														case PRINTER_STATUS_PRINTING:
															ledColor = color.NRGBA{R: 0, G: 255, B: 0, A: 255} // Green for printing
														case PRINTER_STATUS_WARMING_UP:
															ledColor = color.NRGBA{R: 255, G: 255, B: 0, A: 255} // Yellow for warming up
														case PRINTER_STATUS_OFFLINE:
															ledColor = color.NRGBA{R: 255, G: 40, B: 0, A: 255} // Red for offline colorNRGBA(255, 40, 0, 255)
														default:
															ledColor = color.NRGBA{R: 128, G: 128, B: 128, A: 255} // Gray for unknown
														}
														return drawLEDIndicator(gtx, ledColor)
													}),
												)
											})
										}
										return layout.Flex{Axis: layout.Vertical}.Layout(gtx, children...)
									}),
								)
							}),

							// QR code machine identifier (50% width)
							layout.Flexed(0.30, func(gtx C) D {
								return layout.Flex{
									Axis:      layout.Vertical,
									Alignment: layout.Middle, // Center-aligns the children vertically
								}.Layout(gtx,
									layout.Rigid(func(gtx C) D {
										// QR code layout logic
										return layout.Center.Layout(gtx, func(gtx C) D {
											return widget.Image{
												Src:   paint.NewImageOp(qrImage),
												Scale: 1,
											}.Layout(gtx)
										})
									}),
									layout.Rigid(func(gtx C) D {
										// Center the H6 text and add a copy icon beside it
										return layout.Center.Layout(gtx, func(gtx C) D {
											return layout.Flex{
												Axis:      layout.Horizontal,
												Alignment: layout.Middle,
											}.Layout(gtx,

												// Wt Mcn ID text
												layout.Rigid(func(gtx C) D {
													h6 := material.H6(small_th, client_id)
													h6.Color = color.NRGBA{R: 0, G: 0, B: 139, A: 255} // Blue color
													h6.TextSize = unit.Sp(13)                          // Adjust text size as needed
													h6.Font.Typeface = "RobotoMonoBold"                // Use Roboto Mono font
													h6.Font.Weight = 700

													return h6.Layout(gtx)
												}),
												// Text input field for machine ID
												// layout.Rigid(func(gtx C) D {
												// 	editor := material.Editor(th, &machineIdEditor, "Wt-Dim Mcn. ID")
												// 	editor.TextSize = unit.Sp(13)                                  // Adjust text size
												// 	editor.Color = color.NRGBA{R: 0, G: 0, B: 0, A: 255}           // Black text
												// 	editor.HintColor = color.NRGBA{R: 128, G: 128, B: 128, A: 255} // Grey hint text
												// 	editor.Font.Typeface = "RobotoMono"                            // Use Roboto Mono font
												// 	if weightdimensionMachineManager.allowed_machine.Isset {
												// 		if machineIdEditor.Text() == "" {
												// 			machineIdEditor.SetText(weightdimensionMachineManager.allowed_machine.MachineId)
												// 		}
												// 	}
												// 	return editor.Layout(gtx)
												// }),
												// // Save machine id icon button
												// layout.Rigid(func(gtx C) D {
												// 	btn := material.IconButton(th, &machineIdSaveButton, saveIcon, "")
												// 	btn.Size = unit.Dp(20) // Adjust the icon size
												// 	// btn.Inset = layout.Inset{
												// 	// 	Left: unit.Dp(5), // Add space between text and button
												// 	// }
												// 	btn.Background = color.NRGBA{R: 0, G: 0, B: 0, A: 0} // Transparent background
												// 	btn.Color = colorNRGBA(34, 139, 34, 255)             // ForestGreen color

												// 	return btn.Layout(gtx)
												// }),
											)
										})
									}),
								)
							}),
						)
					})
				}),

				// Row 3: Print button (centered)
				layout.Rigid(func(gtx C) D {
					return inset.Layout(gtx, func(gtx C) D {
						// Check current logging status
						loggingEnabled, _ := IsPrintServiceLoggingEnabled()

						if loggingEnabled {
							// If logging is enabled, only show Test Print button
							return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Start, Spacing: layout.SpaceAround}.Layout(gtx,
								layout.Rigid(material.Button(th, &testPrintBtn, "Test Print").Layout),
							)
						} else {
							// If logging is disabled, show both buttons with red Enable Logging button
							return layout.Flex{Axis: layout.Horizontal, Alignment: layout.Start, Spacing: layout.SpaceAround}.Layout(gtx,
								layout.Rigid(material.Button(th, &testPrintBtn, "Test Print").Layout),
								layout.Rigid(func(gtx C) D {
									return layout.Inset{Left: unit.Dp(10)}.Layout(gtx, func(gtx C) D {
										// Create a red button for Enable Print Logging
										btn := material.Button(th, &enableLoggingBtn, "Enable Print Logging")
										btn.Background = color.NRGBA{R: 220, G: 53, B: 69, A: 255} // Bootstrap danger red
										btn.Color = color.NRGBA{R: 255, G: 255, B: 255, A: 255}    // White text
										return btn.Layout(gtx)
									})
								}),
							)
						}
					})
				}),

				// Row 4: Console Display Box (100% width)
				layout.Rigid(func(gtx C) D {
					// Calculate dynamic height for the console
					appHeight := gtx.Constraints.Max.Y // Total app height
					consoleHeight := appHeight

					// Ensure console height is non-negative
					if consoleHeight < gtx.Dp(100) { // Minimum console height
						consoleHeight = gtx.Dp(100)
					}

					// Stack background and list
					return layout.Stack{}.Layout(gtx,
						layout.Expanded(func(gtx C) D {
							// Draw the console background
							paint.FillShape(gtx.Ops, color.NRGBA{R: 0, G: 0, B: 0, A: 255}, clip.Rect{
								Min: image.Point{X: 0, Y: 0},
								Max: image.Point{X: gtx.Constraints.Max.X, Y: consoleHeight},
							}.Op())
							return D{Size: gtx.Constraints.Max}
						}),
						layout.Expanded(func(gtx C) D {
							// Clip the content to the console box
							op := clip.Rect{
								Min: image.Point{X: 0, Y: 0},
								Max: image.Point{X: gtx.Constraints.Max.X, Y: consoleHeight},
							}.Push(gtx.Ops)
							defer op.Pop()

							// Automatically scroll to the end of the list if a new message is added
							if len(console.messages) > 0 {
								console.list.Position.First = len(console.messages) - 1
								console.list.Position.Offset = 0
							}

							// Layout the list with the blank line adjustment
							return console.list.Layout(gtx, len(console.messages)+1, func(gtx C, i int) D {
								if i < len(console.messages) {
									// Render console messages
									msg := console.messages[i]
									msgText := fmt.Sprintf("[%d] %s", i+1, msg.Text) // Format message
									lbl := material.Body1(th, msgText)
									lbl.Color = msg.Color
									lbl.TextSize = unit.Sp(14)       // Adjust text size as needed
									lbl.Font.Typeface = "RobotoMono" // Use Roboto Mono font
									return lbl.Layout(gtx)
								}
								// Render the blank line
								return layout.Spacer{Height: unit.Dp(20)}.Layout(gtx)
							})
						}),
					)
				}),
			)

			if machineIdSaveButton.Pressed() {
				if !machineIdBtnClicked {
					machineIdBtnClicked = true
					machine_id := machineIdEditor.Text()
					if machine_id != "" {
						appSettings.SetMachineID(machine_id)
						go weightdimensionMachineManager.StartMachine(console)

						console.MsgChan <- Message{
							Text:  fmt.Sprintf("Weight and Dimension Machine is set to: %s", machine_id),
							Color: color.NRGBA{R: 0, G: 255, B: 0, A: 255}, // Green color
						}
					} else {
						console.MsgChan <- Message{
							Text:  "Machine ID cannot be empty!",
							Color: color.NRGBA{R: 255, G: 0, B: 0, A: 255}, // Red color
						}
					}
				}
			} else {
				machineIdBtnClicked = false
			}
			// Detect printer selection change and send to server
			if printerList.Value != "" && printerList.Value != previousPrinterSelection {
				previousPrinterSelection = printerList.Value

				// Log to console
				console.MsgChan <- Message{
					Text:  fmt.Sprintf("Printer selected: %s", printerList.Value),
					Color: color.NRGBA{R: 0, G: 255, B: 255, A: 255}, // Cyan
				}

				// Send printer selection event to server via websocket
				printerSelectedMsg := OutGoingLog{
					Event:   "printer-selected",
					JobID:   client_id,
					Message: printerList.Value,
				}

				// Queue message for sending
				outgoingMessages <- printerSelectedMsg

				log.Printf("Printer selection event sent: %s", printerList.Value)
			}
			// Handle Test Print button click
			if testPrintBtn.Pressed() {
				if !testPrintBtnClicked {
					testPrintBtnClicked = true
					selectedPrinter := printerList.Value
					fmt.Printf("Selected printer: %s\n", selectedPrinter)
					log.Println("Test Print button clicked!") // Debugging statement

					// Send messages to the console
					console.MsgChan <- Message{
						Text:  fmt.Sprintf("Initiating test print on %s...", selectedPrinter),
						Color: color.NRGBA{R: 255, G: 255, B: 255, A: 255}, // White color
					}

					printCommand := PrintCommand{
						Command:   "test-print",
						JobName:   "Test Print 8.5x7.75 inch",
						Width:     8.5,
						Height:    7.75,
						Unit:      "inch",
						JobID:     "test-print",
						JobToken:  "test-print",
						PrinterID: selectedPrinter,
						Barcode:   "DL1587895478BD",
						Mashul:    "12.0",
						Weight:    "1582.0",
					}

					go testPrint(console, printManager, &printCommand)

					w.Invalidate()
				}
			} else {
				testPrintBtnClicked = false
			}

			// Handle Enable Print Logging button click
			if enableLoggingBtn.Pressed() {
				if !enableLoggingBtnClicked {
					enableLoggingBtnClicked = true

					// Add immediate feedback to console
					console.AddMessage(Message{
						Text:  "🔄 Starting Print Service logging enablement...",
						Color: color.NRGBA{R: 0, G: 255, B: 255, A: 255}, // Cyan
					}, w)

					// Run in a goroutine to avoid blocking the UI
					go func() {
						err := EnablePrintLoggingWithUserConsent(console)
						if err != nil {
							console.MsgChan <- Message{
								Text:  fmt.Sprintf("❌ Enable logging process completed with error: %v", err),
								Color: color.NRGBA{R: 255, G: 40, B: 0, A: 255}, // Red
							}
						} else {
							console.MsgChan <- Message{
								Text:  "✅ Enable logging process completed successfully",
								Color: color.NRGBA{R: 0, G: 255, B: 0, A: 255}, // Green
							}
							// Trigger UI refresh to hide the button
							w.Invalidate()
						}
					}()

					w.Invalidate()
				}
			} else {
				enableLoggingBtnClicked = false
			}

			e.Frame(gtx.Ops)
		}
		acks <- struct{}{}
	}
	return nil
}

// loadRobotoMono loads the Roboto Mono font and returns a `text.FontFace`.
func loadRobotoMono() text.FontFace {
	// Define the path to the Roboto Mono font file
	robotoMonoPath := "fonts/RobotoMono-VariableFont_wght.ttf"

	// Attempt to read the font file
	fontData, err := os.ReadFile(robotoMonoPath)
	if err != nil {
		log.Fatalf("Failed to load Roboto Mono font: %v", err)
	}

	// Parse the font using opentype
	face, err := opentype.Parse(fontData)
	if err != nil {
		log.Fatalf("Failed to parse Roboto Mono font: %v", err)
	}

	// Return the FontFace with a Typeface name
	return text.FontFace{
		Font: font.Font{
			Typeface: "RobotoMono", // Typeface name
		},
		Face: face,
	}
}

// loadRobotoMono loads the Roboto Mono font and returns a `text.FontFace`.
func loadKalpurush() text.FontFace {
	// Define the path to the Roboto Mono font file
	kalpurushPath := "fonts/kalpurush.ttf"

	// Attempt to read the font file
	fontData, err := os.ReadFile(kalpurushPath)
	if err != nil {
		log.Fatalf("Failed to load Kalpurush font: %v", err)
	}

	// Parse the font using opentype
	face, err := opentype.Parse(fontData)
	if err != nil {
		log.Fatalf("Failed to parse Kalpurush font: %v", err)
	}

	// Return the FontFace with a Typeface name
	return text.FontFace{
		Font: font.Font{
			Typeface: "Kalpurush", // Typeface name
		},
		Face: face,
	}
}
