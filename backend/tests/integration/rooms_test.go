package integration

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

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
	return newServiceForTestWithDice(t, [2]int{3, 3})
}

func newServiceForTestWithDice(t *testing.T, dice [2]int) (*rooms.Service, *http.ServeMux, string) {
	t.Helper()
	dataPath := filepath.Join(t.TempDir(), "pocketbase-store.json")
	store := pocketbase.NewClient(pocketbase.ClientConfig{
		BaseURL:  "http://127.0.0.1:8090",
		DataPath: dataPath,
	})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: dice})
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
	if declined["turnState"] != "awaiting-auction" {
		t.Fatalf("expected room to enter awaiting-auction, got %v", declined["turnState"])
	}
	if declined["pendingProperty"] != nil {
		t.Fatalf("expected pending property to clear after decline")
	}
	if declined["pendingAuction"] == nil {
		t.Fatalf("expected pending auction after decline")
	}
	if declined["currentTurnPlayerId"] != secondPlayerID {
		t.Fatalf("expected first auction bidder to be the next player, got %v", declined["currentTurnPlayerId"])
	}
	players := declined["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1500) {
		t.Fatalf("expected host cash unchanged after decline, got %v", host["cash"])
	}
}

func TestAuctionBidAndPassSettlesWinner(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload)))
	declinePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "decline-1"})
	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", bytes.NewReader(declinePayload)))

	bidPayload, _ := json.Marshal(map[string]any{"playerId": secondPlayerID, "idempotencyKey": "bid-1", "amount": 200})
	bidRecorder := httptest.NewRecorder()
	mux.ServeHTTP(bidRecorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/bid", bytes.NewReader(bidPayload)))
	if bidRecorder.Code != http.StatusOK {
		t.Fatalf("expected auction bid status 200, got %d", bidRecorder.Code)
	}

	passPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "pass-1"})
	passRecorder := httptest.NewRecorder()
	mux.ServeHTTP(passRecorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/pass", bytes.NewReader(passPayload)))
	if passRecorder.Code != http.StatusOK {
		t.Fatalf("expected auction pass status 200, got %d", passRecorder.Code)
	}

	var settled map[string]any
	_ = json.Unmarshal(passRecorder.Body.Bytes(), &settled)
	if settled["turnState"] != "awaiting-roll" {
		t.Fatalf("expected room to return to awaiting-roll after auction, got %v", settled["turnState"])
	}
	if settled["pendingAuction"] != nil {
		t.Fatalf("expected pending auction to clear after settlement")
	}
	players := settled["players"].([]any)
	winner := players[1].(map[string]any)
	if winner["cash"] != float64(1300) {
		t.Fatalf("expected winner cash 1300 after auction, got %v", winner["cash"])
	}
	properties := winner["properties"].([]any)
	if len(properties) != 1 || properties[0] != "tile-6" {
		t.Fatalf("expected winner to own tile-6, got %v", properties)
	}
}

func TestOwnedTileRentSettlement(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload)))
	purchasePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "buy-1"})
	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", bytes.NewReader(purchasePayload)))

	secondRollPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "roll-2"})
	secondRollRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(secondRollPayload))
	secondRollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(secondRollRecorder, secondRollRequest)
	if secondRollRecorder.Code != http.StatusOK {
		t.Fatalf("expected rent roll status 200, got %d", secondRollRecorder.Code)
	}

	var settled map[string]any
	_ = json.Unmarshal(secondRollRecorder.Body.Bytes(), &settled)
	players := settled["players"].([]any)
	host := players[0].(map[string]any)
	second := players[1].(map[string]any)
	if host["cash"] != float64(1362) {
		t.Fatalf("expected host cash 1362 after rent, got %v", host["cash"])
	}
	if second["cash"] != float64(1478) {
		t.Fatalf("expected second player cash 1478 after rent, got %v", second["cash"])
	}
	events := settled["recentEvents"].([]any)
	foundRent := false
	for _, rawEvent := range events {
		event := rawEvent.(map[string]any)
		if event["type"] == "rent-charged" {
			foundRent = true
			if event["amount"] != float64(22) {
				t.Fatalf("expected rent amount 22, got %v", event["amount"])
			}
		}
	}
	if !foundRent {
		t.Fatalf("expected rent-charged event in recent events")
	}
}

func TestRoomStreamPublishesRentSettlement(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	server := httptest.NewServer(mux)
	defer server.Close()

	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	postJSON(t, server.URL+"/api/rooms/"+roomID+"/roll", map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	purchased := postJSON(t, server.URL+"/api/rooms/"+roomID+"/purchase", map[string]string{"playerId": hostID, "idempotencyKey": "buy-1"})
	afterSequence := int(purchased["eventSequence"].(float64))

	streamResponse, err := http.Get(server.URL + "/api/rooms/" + roomID + "/stream?afterSequence=" + strconv.Itoa(afterSequence))
	if err != nil {
		t.Fatalf("expected stream request to succeed: %v", err)
	}
	defer streamResponse.Body.Close()

	streamEvent := make(chan map[string]any, 1)
	streamError := make(chan error, 1)
	go func() {
		scanner := bufio.NewScanner(streamResponse.Body)
		currentEvent := ""
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "event: ") {
				currentEvent = strings.TrimPrefix(line, "event: ")
				continue
			}
			if !strings.HasPrefix(line, "data: ") || currentEvent != "room-event" {
				continue
			}
			var envelope map[string]any
			if err := json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &envelope); err != nil {
				streamError <- err
				return
			}
			event := envelope["event"].(map[string]any)
			if event["type"] == "rent-charged" {
				streamEvent <- event
				return
			}
		}
		if err := scanner.Err(); err != nil {
			streamError <- err
			return
		}
		streamError <- fmt.Errorf("stream closed before rent event")
	}()

	postJSON(t, server.URL+"/api/rooms/"+roomID+"/roll", map[string]string{"playerId": secondPlayerID, "idempotencyKey": "roll-2"})

	select {
	case event := <-streamEvent:
		if event["amount"] != float64(22) {
			t.Fatalf("expected streamed rent amount 22, got %v", event["amount"])
		}
		if event["ownerCashAfter"] != float64(1362) {
			t.Fatalf("expected streamed owner cash 1362, got %v", event["ownerCashAfter"])
		}
	case err := <-streamError:
		t.Fatalf("expected rent event from stream, got error: %v", err)
	case <-time.After(5 * time.Second):
		t.Fatalf("timed out waiting for rent event from stream")
	}
}

func TestCommunityTileResolvesDeterministicCardEffect(t *testing.T) {
	_, mux, _ := newServiceForTestWithDice(t, [2]int{1, 1})
	roomID, hostID, _, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-card"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(rollPayload)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected card roll status 200, got %d", rollRecorder.Code)
	}

	var resolved map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &resolved)
	players := resolved["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1600) {
		t.Fatalf("expected host cash 1600 after community card, got %v", host["cash"])
	}
}

func TestGoToJailAndPayFineFlow(t *testing.T) {
	_, mux, _ := newServiceForTestWithDice(t, [2]int{6, 4})
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	rollFor := func(playerID string, key string) map[string]any {
		payload, _ := json.Marshal(map[string]string{"playerId": playerID, "idempotencyKey": key})
		recorder := httptest.NewRecorder()
		mux.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", bytes.NewReader(payload)))
		if recorder.Code != http.StatusOK {
			t.Fatalf("expected roll status 200, got %d", recorder.Code)
		}
		var body map[string]any
		_ = json.Unmarshal(recorder.Body.Bytes(), &body)
		return body
	}

	rollFor(hostID, "h1")
	rollFor(secondPlayerID, "s1")
	rollFor(hostID, "h2")
	rollFor(secondPlayerID, "s2")
	rollFor(hostID, "h3")
	jailed := rollFor(secondPlayerID, "s3")
	if jailed["turnState"] != "awaiting-jail-release" {
		t.Fatalf("expected next jailed turn to require release, got %v", jailed["turnState"])
	}
	players := jailed["players"].([]any)
	host := players[0].(map[string]any)
	if host["inJail"] != true {
		t.Fatalf("expected host to be in jail")
	}

	releasePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "release-1"})
	releaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(releaseRecorder, httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/jail-release", bytes.NewReader(releasePayload)))
	if releaseRecorder.Code != http.StatusOK {
		t.Fatalf("expected jail release status 200, got %d", releaseRecorder.Code)
	}
	var released map[string]any
	_ = json.Unmarshal(releaseRecorder.Body.Bytes(), &released)
	if released["turnState"] != "awaiting-roll" {
		t.Fatalf("expected released player to return to awaiting-roll, got %v", released["turnState"])
	}
	releasedPlayers := released["players"].([]any)
	releasedHost := releasedPlayers[0].(map[string]any)
	if releasedHost["inJail"] == true {
		t.Fatalf("expected host to leave jail")
	}
	if releasedHost["cash"] != float64(1450) {
		t.Fatalf("expected host cash 1450 after paying jail fine, got %v", releasedHost["cash"])
	}
}

func postJSON(t *testing.T, url string, payload map[string]string) map[string]any {
	t.Helper()
	raw, _ := json.Marshal(payload)
	response, err := http.Post(url, "application/json", bytes.NewReader(raw))
	if err != nil {
		t.Fatalf("expected post request to succeed: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		t.Fatalf("expected successful response, got %d", response.StatusCode)
	}
	var body map[string]any
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("expected valid json response: %v", err)
	}
	return body
}
