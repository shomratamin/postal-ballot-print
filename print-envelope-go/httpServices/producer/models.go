package httpServices

type ServiceUserRequest struct {
	InternalIdentifier string `json:"internal_identifier"`
	RedirectURL        string `json:"redirect_url"`
	UserType           string `json:"user_type"`
}

type ServiceUserResponse struct {
	RedirectToken string `json:"redirect_token"`
}

type SendSMSRequest struct {
	PhoneNumber string `json:"phone_number"`
	SMSBody     string `json:"sms_body"`
}

type SendSMSResponse struct {
	Status  string `json:"status,omitempty"`
	Message string `json:"message,omitempty"`
}
