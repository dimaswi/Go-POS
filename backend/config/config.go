package config

import (
	"os"
)

type Config struct {
	DatabaseDSN string
	JWTSecret   string
	ServerPort  string
	GinMode     string
	FrontendURL string
}

func Load() *Config {
	return &Config{
		DatabaseDSN: getEnv("DATABASE_DSN", "host=localhost user=postgres password=postgres123 dbname=go_pos port=5432 sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
