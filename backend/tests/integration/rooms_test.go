package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/rooms"
)

func TestDemoRoomSnapshotReturnsOK(t *testing.T) {
	service := rooms.NewService()
	mux := http.NewServeMux()
	service.RegisterRoutes(mux)
	request := httptest.NewRequest(http.MethodGet, "/api/rooms/demo-room", nil)
	recorder := httptest.NewRecorder()

	mux.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestCreateJoinAndStartRoomFlow(t *testing.T) {
	service := rooms.NewService()
	mux := http.NewServeMux()
	service.RegisterRoutes(mux)

	createPayload, _ := json.Marshal(map[string]string{"hostName": "测试房主"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/rooms", bytes.NewReader(createPayload))
	createRecorder := httptest.NewRecorder()
	mux.ServeHTTP(createRecorder, createRequest)

	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected created status, got %d", createRecorder.Code)
	}

	var created map[string]any
	if err := json.Unmarshal(createRecorder.Body.Bytes(), &created); err != nil {
		t.Fatalf("expected valid create room response: %v", err)
	}
	roomID := created["roomId"].(string)
	hostID := created["hostId"].(string)

	joinPayload, _ := json.Marshal(map[string]string{"playerName": "第二位玩家"})
	joinRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/join", bytes.NewReader(joinPayload))
	joinRecorder := httptest.NewRecorder()
	mux.ServeHTTP(joinRecorder, joinRequest)
	if joinRecorder.Code != http.StatusOK {
		t.Fatalf("expected join status 200, got %d", joinRecorder.Code)
	}

	startPayload, _ := json.Marshal(map[string]string{"hostId": hostID})
	startRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/start", bytes.NewReader(startPayload))
	startRecorder := httptest.NewRecorder()
	mux.ServeHTTP(startRecorder, startRequest)
	if startRecorder.Code != http.StatusOK {
		t.Fatalf("expected start status 200, got %d", startRecorder.Code)
	}

	var started map[string]any
	if err := json.Unmarshal(startRecorder.Body.Bytes(), &started); err != nil {
		t.Fatalf("expected valid start response: %v", err)
	}
	if started["roomState"] != "in-game" {
		t.Fatalf("expected room to be in-game, got %v", started["roomState"])
	}
}