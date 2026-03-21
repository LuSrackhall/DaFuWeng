package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/pocketbase"
	"github.com/LuSrackhall/DaFuWeng/backend/internal/rooms"
)

type fixedDiceRoller struct {
	value [2]int
}

func (roller fixedDiceRoller) Roll() [2]int {
	return roller.value
}

func TestDemoRoomSnapshotReturnsOK(t *testing.T) {
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090"})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: [2]int{3, 4}})
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
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090"})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: [2]int{3, 4}})
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
	if started["turnState"] != "awaiting-roll" {
		t.Fatalf("expected room to await roll, got %v", started["turnState"])
	}
}

func TestRollDiceFlowRejectsWrongPlayerAndReplaysByIdempotencyKey(t *testing.T) {
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090"})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: [2]int{3, 4}})
	mux := http.NewServeMux()
	service.RegisterRoutes(mux)

	createPayload, _ := json.Marshal(map[string]string{"hostName": "测试房主"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/rooms", bytes.NewReader(createPayload))
	createRecorder := httptest.NewRecorder()
	mux.ServeHTTP(createRecorder, createRequest)

	var created map[string]any
	_ = json.Unmarshal(createRecorder.Body.Bytes(), &created)
	roomID := created["roomId"].(string)
	hostID := created["hostId"].(string)

	joinPayload, _ := json.Marshal(map[string]string{"playerName": "第二位玩家"})
	joinRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/join", bytes.NewReader(joinPayload))
	joinRecorder := httptest.NewRecorder()
	mux.ServeHTTP(joinRecorder, joinRequest)

	var joined map[string]any
	_ = json.Unmarshal(joinRecorder.Body.Bytes(), &joined)
	players := joined["players"].([]any)
	wrongPlayerID := players[len(players)-1].(map[string]any)["id"].(string)

	startPayload, _ := json.Marshal(map[string]string{"hostId": hostID})
	startRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/start", bytes.NewReader(startPayload))
	startRecorder := httptest.NewRecorder()
	mux.ServeHTTP(startRecorder, startRequest)

	rejectPayload, _ := json.Marshal(map[string]string{"playerId": wrongPlayerID, "idempotencyKey": "bad-attempt"})
	rejectRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rejectPayload))
	rejectRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rejectRecorder, rejectRequest)
	if rejectRecorder.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid player roll to fail, got %d", rejectRecorder.Code)
	}

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	firstRollRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload))
	firstRollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(firstRollRecorder, firstRollRequest)
	if firstRollRecorder.Code != http.StatusOK {
		t.Fatalf("expected valid roll to succeed, got %d", firstRollRecorder.Code)
	}

	secondRollRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload))
	secondRollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(secondRollRecorder, secondRollRequest)
	if secondRollRecorder.Code != http.StatusOK {
		t.Fatalf("expected idempotent replay to succeed, got %d", secondRollRecorder.Code)
	}

	var firstResponse map[string]any
	var secondResponse map[string]any
	_ = json.Unmarshal(firstRollRecorder.Body.Bytes(), &firstResponse)
	_ = json.Unmarshal(secondRollRecorder.Body.Bytes(), &secondResponse)

	if firstResponse["snapshotVersion"] != secondResponse["snapshotVersion"] {
		t.Fatalf("expected idempotent replay to keep snapshot version, got %v and %v", firstResponse["snapshotVersion"], secondResponse["snapshotVersion"])
	}
	if firstResponse["eventSequence"] != secondResponse["eventSequence"] {
		t.Fatalf("expected idempotent replay to keep event sequence, got %v and %v", firstResponse["eventSequence"], secondResponse["eventSequence"])
	}
	if firstResponse["turnState"] != "post-roll-pending" {
		t.Fatalf("expected post-roll turn state, got %v", firstResponse["turnState"])
	}
	playersAfterRoll := firstResponse["players"].([]any)
	hostPlayer := playersAfterRoll[0].(map[string]any)
	if hostPlayer["position"] != float64(7) {
		t.Fatalf("expected host to move to position 7, got %v", hostPlayer["position"])
	}
}
