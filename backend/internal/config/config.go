package config

import "os"

type Config struct {
	HTTPAddress string
	PocketBaseURL string
}

func Load() Config {
	return Config{
		HTTPAddress: envOrDefault("DAFUWENG_HTTP_ADDR", ":8080"),
		PocketBaseURL: envOrDefault("DAFUWENG_POCKETBASE_URL", "http://127.0.0.1:8090"),
	}
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}