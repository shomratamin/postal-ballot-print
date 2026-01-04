package types

// BatchOrderRequest represents the request payload for creating a batch of orders
type BatchOrderRequest struct {
	StartSequence int `json:"start_sequence" validate:"required"`
	EndSequence   int `json:"end_sequence" validate:"required"`
}
