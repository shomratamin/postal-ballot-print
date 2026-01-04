package httpServices

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type KafkaProducerHttpClient struct {
	httpClient *http.Client
	baseURL    string
	authToken  string
}

func NewKafkaProducerHttpClient(baseURL string) *KafkaProducerHttpClient {
	token := os.Getenv("MESSAGE_BROKER_TOKEN")
	return &KafkaProducerHttpClient{
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
		baseURL:   baseURL,
		authToken: token,
	}
}

func (c *KafkaProducerHttpClient) EkdakSendSMS(ctx context.Context, phone, text string) (*SendSMSResponse, error) {
	if phone == "" || text == "" {
		return nil, errors.New("phone and text are required")
	}

	payload := SendSMSRequest{
		PhoneNumber: phone,
		SMSBody:     text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/message-broker/send-sms/", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Token "+c.authToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("sms send failed: status=%d body=%s", resp.StatusCode, string(bodyBytes))
	}

	var apiResp SendSMSResponse
	if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
		return nil, err
	}

	if apiResp.Status == "" {
		apiResp.Status = "ok"
	}

	return &apiResp, nil
}
