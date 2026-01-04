package main

import (
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

// StatusXML represents the expected structure of status.xml
// StatusXML represents the structure of status.xml returned by the machine

// <input type="hidden" id="machine_weight" name="machine_weight" value="0.5 kg">
// <input type="hidden" id="machine_width" name="machine_width" value="5.80 cm">
// <input type="hidden" id="machine_height" name="machine_height" value="1.00 cm">
// <input type="hidden" id="machine_length" name="machine_length" value="7.62 cm">
// <input type="hidden" id="printer_id" name="printer_id" value="0c4c1cccf613c5950a">

type StatusXML struct {
	// Led0      int    `xml:"led0"`
	// Led1      int    `xml:"led1"`
	// Led2      int    `xml:"led2"`
	// Led3      int    `xml:"led3"`
	// Led4      int    `xml:"led4"`
	// Led5      int    `xml:"led5"`
	// Led6      int    `xml:"led6"`
	// Led7      int    `xml:"led7"`
	// Btn0      string `xml:"btn0"`
	// Btn1      string `xml:"btn1"`
	// Btn2      string `xml:"btn2"`
	// Btn3      string `xml:"btn3"`
	// Pot0      int    `xml:"pot0"`
	Tid       string `xml:"tid"`        // Assuming 'tid' is the Machine ID
	Length    string `xml:"length"`     // e.g., "0.0 cm" -> 7.62 cm
	Width     string `xml:"width"`      // e.g., "0.0 cm" -> 5.80 cm
	Height    string `xml:"height"`     // e.g., "0.0 cm" -> 1.00 cm
	VolWt     string `xml:"volWt"`      // e.g., "0.0 "
	GrossWt   string `xml:"grossWt"`    // e.g., "Gross Weight"
	NetWt     string `xml:"netWt"`      // e.g., "----" -> 0.5 kg
	TareWt    string `xml:"tareWt"`     // e.g., "Tare Weight"
	ChrgWt    string `xml:"chrgWt"`     // e.g., "----"
	FwVer     string `xml:"fwVer"`      // e.g., "2.5E"
	MachineID string `xml:"machine_id"` // e.g., "----"
	PrinterID string `xml:"printer_id"` // e.g., "----" -> "0c4c1cccf613c5950a"
	Event     string `xml:"job_id"`     // e.g., "----"
	Status    string `xml:"status"`     // e.g., "----"
}

// WeightDimMachineManager already defined
type WeightDimMachineManager struct {
	allowed_machine   AllowedMachine
	printer_client_id string
}

// Existing structs
type WeightDimMachine struct {
	MachineId string
	AccessUrl string
}

type AllowedMachine struct {
	MachineId   string
	MachineIP   string
	AccessUrl   string
	Isset       bool
	MachineLive bool
}

func NewWeightDimMachineManager() *WeightDimMachineManager {
	return &WeightDimMachineManager{
		allowed_machine:   AllowedMachine{Isset: false},
		printer_client_id: "",
	}
}

func (wdm *WeightDimMachineManager) SetPrinterClientID(client_id string) {
	wdm.printer_client_id = client_id
}

func (wdm *WeightDimMachineManager) SetAllowedMachine(machine_id string) {
	wdm.allowed_machine.MachineId = machine_id
	wdm.allowed_machine.AccessUrl = fmt.Sprintf("http://%s/status.xml", machine_id)
	wdm.allowed_machine.Isset = true
}

func (wdm *WeightDimMachineManager) UnsetAllowedMachine() {
	wdm.allowed_machine.Isset = false
	wdm.allowed_machine.MachineId = ""
	wdm.allowed_machine.AccessUrl = ""

}

func (wdm *WeightDimMachineManager) GetAllowedMachine() *AllowedMachine {
	return &wdm.allowed_machine
}

func (wdm *WeightDimMachineManager) GetAllowedMachineId() string {
	return wdm.allowed_machine.MachineId
}

// Start Machine
func (wdm *WeightDimMachineManager) StartMachine(console *Console) {

	//send machine data
	wt_mcn_id := appSettings.GetMachineID()
	if wt_mcn_id != "" {
		if wt_mcn_id != wdm.allowed_machine.MachineId {
			wdm.SetAllowedMachine(wt_mcn_id)
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Machine ID changed to: %s", wt_mcn_id),
				Color: colorNRGBA(0, 255, 0, 255), // Green
			}
		}
	}

	var (
		machine *WeightDimMachine
		err     error
	)
	if wdm.allowed_machine.Isset {
		machine, err = wdm.StartDiscovery(console)
		if err != nil {
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Error discovering machine:,  %v", err),
				Color: colorNRGBA(255, 0, 0, 255), // Red
			}

		} else {
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Discovered machine: ID=%s", machine.MachineId),
				Color: colorNRGBA(0, 255, 0, 255), // Green
			}

		}
	}

}

func (wdm *WeightDimMachineManager) GetWeightDimData() (status_data *StatusXML, err error) {

	if !wdm.allowed_machine.Isset {
		return nil, errors.New("no machine is set")
	}

	// For development: Generate random values around the example values
	// status := StatusXML{
	// 	// Generate random length around 7.62 cm (±2 cm)
	// 	Length: fmt.Sprintf("%.2f cm", 7.62+(rand.Float64()-0.5)*4.0),

	// 	// Generate random width around 5.80 cm (±1.5 cm)
	// 	Width: fmt.Sprintf("%.2f cm", 5.80+(rand.Float64()-0.5)*3.0),

	// 	// Generate random height around 1.00 cm (±0.5 cm)
	// 	Height: fmt.Sprintf("%.2f cm", 1.00+(rand.Float64()-0.5)*1.0),

	// 	// Generate random weight between 1 to 30 kg
	// 	NetWt: fmt.Sprintf("%.1f kg", 1.0+rand.Float64()*29.0),

	// 	// Use a random-looking printer ID based on the example
	// 	PrinterID: wdm.printer_client_id,

	// 	// Standard development values
	// 	Tid:       "DEV001",
	// 	Event:     "weight-dim-data",
	// 	MachineID: wdm.allowed_machine.MachineId,
	// 	Status:    "success",
	// 	FwVer:     "2.5E",
	// 	VolWt:     "0.0",
	// 	GrossWt:   "Gross Weight",
	// 	TareWt:    "Tare Weight",
	// 	ChrgWt:    "----",
	// }

	// return &status, nil

	// Commented out actual machine communication for development

	// Get machine data
	url := fmt.Sprintf("http://%s:80/status.xml", wdm.allowed_machine.MachineIP)
	agent := fiber.Get(url)
	statusCode, body, errs := agent.Bytes()
	if len(errs) > 0 {
		return nil, fmt.Errorf("failed to get status: %v", errs)
	}

	if statusCode != fiber.StatusOK {
		return nil, fmt.Errorf("non-OK HTTP status: %d", statusCode)
	}

	// Parse XML
	var status StatusXML
	decoder := xml.NewDecoder(bytes.NewReader(body))
	if err := decoder.Decode(&status); err != nil {
		return nil, err
	}

	status.Event = "weight-dim-data"
	status.MachineID = wdm.allowed_machine.MachineId
	status.PrinterID = wdm.printer_client_id
	status.Status = "success"

	return &status, nil

}

// StartDiscovery discovers Weight/Dimension Machines in the local subnet
func (wdm *WeightDimMachineManager) StartDiscovery(console *Console) (machine *WeightDimMachine, err error) {
	console.MsgChan <- Message{
		Text:  "Starting Weight/Dimension Machine Discovery",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	machine_found := false
	if wdm.allowed_machine.Isset {
		weightdim_machine_ip, err := resolveIP(wdm.allowed_machine.MachineId)
		if err != nil {
			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Failed to resolve IP address for %s: %v", wdm.allowed_machine.MachineId, err),
				Color: colorNRGBA(255, 0, 0, 255), // Red
			}
			return nil, err
		}

		err = probeIP(weightdim_machine_ip, console, wdm.printer_client_id)
		if err == nil {
			wdm.allowed_machine.MachineIP = weightdim_machine_ip
			machine_found = true

			console.MsgChan <- Message{
				Text:  fmt.Sprintf("Machine %s found at %s", wdm.allowed_machine.MachineId, weightdim_machine_ip),
				Color: colorNRGBA(0, 255, 0, 255), // Green
			}
		}

	}

	console.MsgChan <- Message{
		Text:  "Discovery process completed.",
		Color: colorNRGBA(0, 255, 255, 255), // Cyan
	}

	// Return the first machine found
	if machine_found {
		return &WeightDimMachine{MachineId: wdm.allowed_machine.MachineId, AccessUrl: wdm.allowed_machine.AccessUrl}, nil
	}

	return nil, errors.New("no machine found")
}

// Helper function to probe a single IP for status.xml
func probeIP(ip string, console *Console, client_id string) error {
	log.Printf("Probing Machine %s for status", ip)
	url := fmt.Sprintf("http://%s/status.xml", ip)
	client := http.Client{
		Timeout: 10 * time.Second, // Timeout after 2 seconds
	}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("non-OK HTTP status: %s", resp.Status)
	}

	// Parse XML
	var status StatusXML
	decoder := xml.NewDecoder(resp.Body)
	if err := decoder.Decode(&status); err != nil {
		return err
	}

	if status.Tid == "" {
		return errors.New("no Machine ID found")
	}

	status.MachineID = ip
	status.Event = "weight-dim-data"
	status.PrinterID = client_id
	status.Status = "success"

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Found status at %s", ip),
		Color: colorNRGBA(0, 255, 0, 255), // Green
	}

	console.MsgChan <- Message{
		Text:  fmt.Sprintf("Parsed full status: %+v", status),
		Color: colorNRGBA(0, 180, 255, 255), // Light Blue
	}

	return nil
}

func resolveIP(domainOrIP string) (string, error) {
	// Try to resolve the IP address
	ips, err := net.LookupIP(domainOrIP)
	if err != nil {
		return "", fmt.Errorf("could not resolve IP address for %s: %v", domainOrIP, err)
	}

	// Return the first resolved IP address (IPv4)
	for _, ip := range ips {
		if ipv4 := ip.To4(); ipv4 != nil {
			return ipv4.String(), nil
		}
	}

	// If no IPv4 address found, return an error
	return "", fmt.Errorf("no valid IPv4 address found for %s", domainOrIP)
}
