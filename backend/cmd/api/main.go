package main

import (
	"log"
	"net/http"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/config"
	"github.com/LuSrackhall/DaFuWeng/backend/internal/pocketbase"
	"github.com/LuSrackhall/DaFuWeng/backend/internal/rooms"
)

func main() {
	cfg := config.Load()
	store := pocketbase.NewClient(pocketbase.ClientConfig{
		BaseURL: cfg.PocketBaseURL,
		DataPath: cfg.PocketBaseDataPath,
	})
	service := rooms.NewService(store)

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusOK)
		_, _ = writer.Write([]byte("ok"))
	})
	service.RegisterRoutes(mux)

	log.Printf("backend listening on %s", cfg.HTTPAddress)
	if err := http.ListenAndServe(cfg.HTTPAddress, mux); err != nil {
		log.Fatal(err)
	}
}
