package pocketbase

type ClientConfig struct {
	BaseURL string
}

type Client struct {
	BaseURL string
}

func NewClient(config ClientConfig) *Client {
	return &Client{BaseURL: config.BaseURL}
}