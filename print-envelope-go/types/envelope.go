package types

type InternalJobData struct {
	Id                     int     `json:"id"`
	AccountUserUuid        string  `json:"account_user_uuid"`
	Weight                 string  `json:"weight"`
	ServiceName            string  `json:"service_name"`
	Vas                    *string `json:"vas"`
	DeliveryOfficeCode     *string `json:"delivery_office_code"`
	BookedOfficeCode       *string `json:"booked_office_code"`
	Insurance              *string `json:"insurance"`
	BookedDate             *string `json:"booked_date"`
	BookedTime             *string `json:"booked_time"`
	OrderId                string  `json:"order_id"`
	OrderItemId            string  `json:"order_item_id"`
	Barcode                string  `json:"barcode"`
	AdpodBarcode           *string `json:"adpod_barcode"`
	VpAmount               *string `json:"vp_amount"`
	OrigBarcode            string  `json:"orig_barcode"`
	BarcodeWidth           float64 `json:"barcode_width"`
	BarcodeHeight          float64 `json:"barcode_height"`
	BarcodePositionLeft    float64 `json:"barcode_position_left"`
	BarcodePositionTop     float64 `json:"barcode_position_top"`
	Cash                   string  `json:"cash"`
	Paid                   bool    `json:"paid"`
	Mashul                 string  `json:"mashul"`
	MasulCode              string  `json:"mashul_code"`
	AdditionalServiceText  string  `json:"additional_service_text"`
	MerchantName           *string `json:"merchant_name"`
	TrackingNumber         *string `json:"tracking_number"`
	SenderPositionLeft     float64 `json:"sender_position_left"`
	SenderPositionTop      float64 `json:"sender_position_top"`
	SenderFontSize         float64 `json:"sender_font_size"`
	RecipientPositionLeft  float64 `json:"recipient_position_left"`
	RecipientPositionTop   float64 `json:"recipient_position_top"`
	RecipientFontSize      float64 `json:"recipient_font_size"`
	PrintWidthInch         float64 `json:"print_width_inch"`
	PrintHeightInch        float64 `json:"print_height_inch"`
	PrintType              string  `json:"print_type"`
	SenderName             string  `json:"sender_name"`
	SenderAddress          string  `json:"sender_address"`
	SenderPostoffice       string  `json:"sender_postoffice"`
	SenderPolicestation    string  `json:"sender_policestation"`
	SenderPostcode         string  `json:"sender_postcode"`
	SenderDistrict         string  `json:"sender_district"`
	SenderPhone            string  `json:"sender_phone"`
	RecipientName          string  `json:"recipient_name"`
	RecipientAddress       string  `json:"recipient_address"`
	RecipientPostoffice    string  `json:"recipient_postoffice"`
	RecipientPostcode      string  `json:"recipient_postcode"`
	RecipientPolicestation string  `json:"recipient_policestation"`
	RecipientDistrict      string  `json:"recipient_district"`
	RecipientPhone         string  `json:"recipient_phone"`
}

type InternalJob struct {
	PrinterId       string          `json:"printer_id"`
	JobType         string          `json:"job_type"`
	Command         string          `json:"command"`
	Status          string          `json:"status"`
	InternalJobData InternalJobData `json:"job_data"`
}

type PrintJob struct {
	PrinterID string  `json:"printer_id"`
	JobID     string  `json:"job_id"`
	JobToken  string  `json:"job_token"`
	Command   string  `json:"command"`
	Width     float64 `json:"width"`
	Height    float64 `json:"height"`
	Unit      string  `json:"unit"`
	Barcode   string  `json:"barcode"`
	Mashul    string  `json:"mashul"`
	Weight    string  `json:"weight"`
}
