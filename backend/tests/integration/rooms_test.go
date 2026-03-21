package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
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

func newServiceForTest(t *testing.T) (*rooms.Service, *http.ServeMux, string) {
	t.Helper()
	dataPath := filepath.Join(t.TempDir(), "pocketbase-store.json")
	store := pocketbase.NewClient(pocketbase.ClientConfig{
		BaseURL:  "http://127.0.0.1:8090",
		DataPath: dataPath,
	})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: [2]int{3, 3}})
	mux := http.NewServeMux()
	service.RegisterRoutes(mux)
	return service, mux, dataPath
}

func createStartedRoom(t *testing.T, mux *http.ServeMux) (string, string, string, map[string]any) {
	t.Helper()

	createPayload, _ := json.Marshal(map[string]string{"hostName": "测试房主"})
	createRequest := httptest.NewRequest(http.MethodPost, "/api/rooms", bytes.NewReader(createPayload))
	createRecorder := httptest.NewRecorder()
	mux.ServeHTTP(createRecorder, createRequest)
	if createRecorder.Code != http.StatusCreated {
		t.Fatalf("expected created status, got %d", createRecorder.Code)
	}

	var created map[string]any
	_ = json.Unmarshal(createRecorder.Body.Bytes(), &created)
	roomID := created["roomId"].(string)
	hostID := created["hostId"].(string)

	joinPayload, _ := json.Marshal(map[string]string{"playerName": "第二位玩家"})
	joinRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/join", bytes.NewReader(joinPayload))
	joinRecorder := httptest.NewRecorder()
	mux.ServeHTTP(joinRecorder, joinRequest)
	if joinRecorder.Code != http.StatusOK {
		t.Fatalf("expected join status 200, got %d", joinRecorder.Code)
	}

	var joined map[string]any
	_ = json.Unmarshal(joinRecorder.Body.Bytes(), &joined)
	players := joined["players"].([]any)
	secondPlayerID := players[len(players)-1].(map[string]any)["id"].(string)

	startPayload, _ := json.Marshal(map[string]string{"hostId": hostID})
	startRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/start", bytes.NewReader(startPayload))
	startRecorder := httptest.NewRecorder()
	mux.ServeHTTP(startRecorder, startRequest)
	if startRecorder.Code != http.StatusOK {
		t.Fatalf("expected start status 200, got %d", startRecorder.Code)
	}

	var started map[string]any
	_ = json.Unmarshal(startRecorder.Body.Bytes(), &started)
	return roomID, hostID, secondPlayerID, started
}

func TestDemoRoomSnapshotReturnsOK(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	request := httptest.NewRequest(http.MethodGet, "/api/rooms/demo-room", nil)
	recorder := httptest.NewRecorder()

	mux.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestPurchaseFlowCatchUpAndRestartRecovery(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, _, started := createStartedRoom(t, mux)
	startedSequence := int(started["eventSequence"].(float64))

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	rollRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload))
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, rollRequest)
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected roll status 200, got %d", rollRecorder.Code)
	}

	var rolled map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &rolled)
	if rolled["turnState"] != "awaiting-property-decision" {
		t.Fatalf("expected pending property decision, got %v", rolled["turnState"])
	}
	pendingProperty := rolled["pendingProperty"].(map[string]any)
	if pendingProperty["tileId"] != "tile-6" {
		t.Fatalf("expected pending property tile-6, got %v", pendingProperty["tileId"])
	}

	purchasePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "buy-1"})
	purchaseRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", bytes.NewReader(purchasePayload))
	purchaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(purchaseRecorder, purchaseRequest)
	if purchaseRecorder.Code != http.StatusOK {
		t.Fatalf("expected purchase status 200, got %d", purchaseRecorder.Code)
	}

	secondPurchaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(secondPurchaseRecorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", bytes.NewReader(purchasePayload)))
	if secondPurchaseRecorder.Code != http.StatusOK {
		t.Fatalf("expected purchase replay status 200, got %d", secondPurchaseRecorder.Code)
	}

	var purchased map[string]any
	var replayed map[string]any
	_ = json.Unmarshal(purchaseRecorder.Body.Bytes(), &purchased)
	_ = json.Unmarshal(secondPurchaseRecorder.Body.Bytes(), &replayed)
	if purchased["snapshotVersion"] != replayed["snapshotVersion"] {
		t.Fatalf("expected idempotent purchase replay to keep snapshot version, got %v and %v", purchased["snapshotVersion"], replayed["snapshotVersion"])
	}
	players := purchased["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1340) {
		t.Fatalf("expected host cash 1340 after purchase, got %v", host["cash"])
	}
	properties := host["properties"].([]any)
	if len(properties) != 1 || properties[0] != "tile-6" {
		t.Fatalf("expected host to own tile-6, got %v", properties)
	}

	eventsRequest := httptest.NewRequest(http.MethodGet, "/api/rooms/"+roomID+"/events?afterSequence="+strconv.Itoa(startedSequence), nil)
	eventsRecorder := httptest.NewRecorder()
	mux.ServeHTTP(eventsRecorder, eventsRequest)
	if eventsRecorder.Code != http.StatusOK {
		t.Fatalf("expected events status 200, got %d", eventsRecorder.Code)
	}

	var catchUp map[string]any
	_ = json.Unmarshal(eventsRecorder.Body.Bytes(), &catchUp)
	events := catchUp["events"].([]any)
	if len(events) < 5 {
		t.Fatalf("expected catch-up events after room start, got %d", len(events))
	}
	if catchUp["snapshot"] != nil {
		t.Fatalf("expected incremental catch-up without snapshot fallback")
	}

	reloadedStore := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	reloadedService := rooms.NewServiceWithDependencies(reloadedStore, fixedDiceRoller{value: [2]int{3, 3}})
	reloadedMux := http.NewServeMux()
	reloadedService.RegisterRoutes(reloadedMux)
	reloadRequest := httptest.NewRequest(http.MethodGet, "/api/rooms/"+roomID, nil)
	reloadRecorder := httptest.NewRecorder()
	reloadedMux.ServeHTTP(reloadRecorder, reloadRequest)
	if reloadRecorder.Code != http.StatusOK {
		t.Fatalf("expected restarted service to load room, got %d", reloadRecorder.Code)
	}

	var reloaded map[string]any
	_ = json.Unmarshal(reloadRecorder.Body.Bytes(), &reloaded)
	reloadedPlayers := reloaded["players"].([]any)
	reloadedHost := reloadedPlayers[0].(map[string]any)
	if reloadedHost["cash"] != float64(1340) {
		t.Fatalf("expected recovered host cash 1340, got %v", reloadedHost["cash"])
	}
}

func TestDeclineFlowRejectsWrongPlayer(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload)))

	invalidDeclinePayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "decline-invalid"})
	invalidDeclineRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", bytes.NewReader(invalidDeclinePayload))
	invalidDeclineRecorder := httptest.NewRecorder()
	mux.ServeHTTP(invalidDeclineRecorder, invalidDeclineRequest)
	if invalidDeclineRecorder.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid player decline to fail, got %d", invalidDeclineRecorder.Code)
	}

	declinePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "decline-1"})
	declineRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", bytes.NewReader(declinePayload))
	declineRecorder := httptest.NewRecorder()
	mux.ServeHTTP(declineRecorder, declineRequest)
	if declineRecorder.Code != http.StatusOK {
		t.Fatalf("expected decline status 200, got %d", declineRecorder.Code)
	}

	var declined map[string]any
	_ = json.Unmarshal(declineRecorder.Body.Bytes(), &declined)
	if declined["turnState"] != "awaiting-roll" {
		t.Fatalf("expected room to return to awaiting-roll, got %v", declined["turnState"])
	}
	if declined["pendingProperty"] != nil {
		t.Fatalf("expected pending property to clear after decline")
	}
	if declined["currentTurnPlayerId"] != secondPlayerID {
		t.Fatalf("expected turn to advance to the next player, got %v", declined["currentTurnPlayerId"])
	}
	players := declined["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1500) {
		t.Fatalf("expected host cash unchanged after decline, got %v", host["cash"])
	}
}