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

const playerTokenHeader = "X-DaFuWeng-Player-Token"

var roomPlayerTokens = map[string]map[string]string{}

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

func rememberPlayerToken(roomID string, playerID string, token string) {
	if roomPlayerTokens[roomID] == nil {
		roomPlayerTokens[roomID] = map[string]string{}
	}
	roomPlayerTokens[roomID][playerID] = token
}

func playerToken(roomID string, playerID string) string {
	return roomPlayerTokens[roomID][playerID]
}

func decodeRoomEntryResponse(t *testing.T, recorder *httptest.ResponseRecorder) (map[string]any, map[string]any) {
	t.Helper()

	var response map[string]any
	_ = json.Unmarshal(recorder.Body.Bytes(), &response)
	snapshot := response["snapshot"].(map[string]any)
	session := response["session"].(map[string]any)
	return snapshot, session
}

func authorizedRequest(method string, path string, payload []byte, token string) *http.Request {
	request := httptest.NewRequest(method, path, bytes.NewReader(payload))
	if token != "" {
		request.Header.Set(playerTokenHeader, token)
	}
	return request
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

	created, hostSession := decodeRoomEntryResponse(t, createRecorder)
	roomID := created["roomId"].(string)
	hostID := created["hostId"].(string)
	rememberPlayerToken(roomID, hostID, hostSession["playerToken"].(string))

	joinPayload, _ := json.Marshal(map[string]string{"playerName": "第二位玩家"})
	joinRequest := httptest.NewRequest(http.MethodPost, "/api/rooms/"+roomID+"/join", bytes.NewReader(joinPayload))
	joinRecorder := httptest.NewRecorder()
	mux.ServeHTTP(joinRecorder, joinRequest)
	if joinRecorder.Code != http.StatusOK {
		t.Fatalf("expected join status 200, got %d", joinRecorder.Code)
	}

	joined, secondSession := decodeRoomEntryResponse(t, joinRecorder)
	players := joined["players"].([]any)
	secondPlayerID := players[len(players)-1].(map[string]any)["id"].(string)
	rememberPlayerToken(roomID, secondPlayerID, secondSession["playerToken"].(string))

	startPayload, _ := json.Marshal(map[string]string{"hostId": hostID})
	startRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/start", startPayload, playerToken(roomID, hostID))
	startRecorder := httptest.NewRecorder()
	mux.ServeHTTP(startRecorder, startRequest)
	if startRecorder.Code != http.StatusOK {
		t.Fatalf("expected start status 200, got %d", startRecorder.Code)
	}

	var started map[string]any
	_ = json.Unmarshal(startRecorder.Body.Bytes(), &started)
	return roomID, hostID, secondPlayerID, started
}

func TestRoomCreateReturnsSessionEnvelope(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	createPayload, _ := json.Marshal(map[string]string{"hostName": "测试房主"})
	request := httptest.NewRequest(http.MethodPost, "/api/rooms", bytes.NewReader(createPayload))
	recorder := httptest.NewRecorder()

	mux.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, recorder.Code)
	}

	snapshot, session := decodeRoomEntryResponse(t, recorder)
	if snapshot["roomId"] == "" {
		t.Fatalf("expected create response to include room snapshot")
	}
	if session["playerToken"] == "" {
		t.Fatalf("expected create response to include player token")
	}
}

func TestPurchaseFlowCatchUpAndRestartRecovery(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, _, started := createStartedRoom(t, mux)
	startedSequence := int(started["eventSequence"].(float64))

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"})
	rollRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID))
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
	purchaseRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", purchasePayload, playerToken(roomID, hostID))
	purchaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(purchaseRecorder, purchaseRequest)
	if purchaseRecorder.Code != http.StatusOK {
		t.Fatalf("expected purchase status 200, got %d", purchaseRecorder.Code)
	}

	secondPurchaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(secondPurchaseRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", purchasePayload, playerToken(roomID, hostID)))
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
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))

	invalidDeclinePayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "decline-invalid"})
	invalidDeclineRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", invalidDeclinePayload, playerToken(roomID, secondPlayerID))
	invalidDeclineRecorder := httptest.NewRecorder()
	mux.ServeHTTP(invalidDeclineRecorder, invalidDeclineRequest)
	if invalidDeclineRecorder.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid player decline to fail, got %d", invalidDeclineRecorder.Code)
	}

	declinePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "decline-1"})
	declineRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", declinePayload, playerToken(roomID, hostID))
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
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	declinePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "decline-1"})
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/decline", declinePayload, playerToken(roomID, hostID)))

	bidPayload, _ := json.Marshal(map[string]any{"playerId": secondPlayerID, "idempotencyKey": "bid-1", "amount": 200})
	bidRecorder := httptest.NewRecorder()
	mux.ServeHTTP(bidRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/bid", bidPayload, playerToken(roomID, secondPlayerID)))
	if bidRecorder.Code != http.StatusOK {
		t.Fatalf("expected auction bid status 200, got %d", bidRecorder.Code)
	}

	passPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "pass-1"})
	passRecorder := httptest.NewRecorder()
	mux.ServeHTTP(passRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/pass", passPayload, playerToken(roomID, hostID)))
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
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	purchasePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "buy-1"})
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/purchase", purchasePayload, playerToken(roomID, hostID)))

	secondRollPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "roll-2"})
	secondRollRequest := authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", secondRollPayload, playerToken(roomID, secondPlayerID))
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

	postJSON(t, server.URL+"/api/rooms/"+roomID+"/roll", map[string]string{"playerId": hostID, "idempotencyKey": "roll-1"}, playerToken(roomID, hostID))
	purchased := postJSON(t, server.URL+"/api/rooms/"+roomID+"/purchase", map[string]string{"playerId": hostID, "idempotencyKey": "buy-1"}, playerToken(roomID, hostID))
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

	postJSON(t, server.URL+"/api/rooms/"+roomID+"/roll", map[string]string{"playerId": secondPlayerID, "idempotencyKey": "roll-2"}, playerToken(roomID, secondPlayerID))

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
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected card roll status 200, got %d", rollRecorder.Code)
	}

	var resolved map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &resolved)
	players := resolved["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1600) {
		t.Fatalf("expected host cash 1600 after first community deck card, got %v", host["cash"])
	}
	communityDeck := resolved["communityDeck"].(map[string]any)
	if len(communityDeck["drawPile"].([]any)) != 6 {
		t.Fatalf("expected community draw pile to shrink after card draw")
	}
}

func TestChanceRelativeMoveCardChainsIntoTargetTile(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{2, 2})
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Position = 3
		players[0].Cash = 1500
		return players
	})
	mutateRoomSnapshot(t, dataPath, roomID, func(snapshot *pocketbase.PersistedRoomSnapshot) {
		chanceDeck, _ := json.Marshal(map[string]any{"drawPile": []string{"chance-move-back-three"}, "discardPile": []string{}})
		snapshot.ChanceDeckJSON = chanceDeck
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{2, 2})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "chance-relative"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected relative move card roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if host["position"] != float64(4) {
		t.Fatalf("expected host to chain from chance card to tile 4, got %v", host["position"])
	}
	if host["cash"] != float64(1300) {
		t.Fatalf("expected host to pay tax after relative move chain, got %v", host["cash"])
	}
}

func TestChanceNearestRailwayCardOffersTargetTile(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{2, 2})
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Position = 3
		return players
	})
	mutateRoomSnapshot(t, dataPath, roomID, func(snapshot *pocketbase.PersistedRoomSnapshot) {
		chanceDeck, _ := json.Marshal(map[string]any{"drawPile": []string{"chance-nearest-railway"}, "discardPile": []string{}})
		snapshot.ChanceDeckJSON = chanceDeck
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{2, 2})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "chance-railway"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected nearest railway card roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if host["position"] != float64(15) {
		t.Fatalf("expected host to move to tile 15, got %v", host["position"])
	}
	if body["turnState"] != "awaiting-roll" {
		t.Fatalf("expected nearest railway card to finish the turn, got %v", body["turnState"])
	}
}

func TestCommunityRepairFeeCanEnterCardDeficit(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{6, 6})
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Position = 5
		players[0].Cash = 40
		players[0].Properties = []string{"tile-1", "tile-3"}
		players[0].PropertyImprovements = map[string]int{"tile-1": 2, "tile-3": 1}
		return players
	})
	mutateRoomSnapshot(t, dataPath, roomID, func(snapshot *pocketbase.PersistedRoomSnapshot) {
		communityDeck, _ := json.Marshal(map[string]any{"drawPile": []string{"community-repair-fee"}, "discardPile": []string{}})
		snapshot.CommunityDeckJSON = communityDeck
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{6, 6})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "repair-deficit"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected repair fee card roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	if body["turnState"] != "awaiting-deficit-resolution" {
		t.Fatalf("expected repair fee to enter card deficit, got %v", body["turnState"])
	}
	pendingPayment := body["pendingPayment"].(map[string]any)
	if pendingPayment["reason"] != "card" {
		t.Fatalf("expected pending payment reason card, got %v", pendingPayment["reason"])
	}
	if pendingPayment["sourceTileLabel"] != "房屋维修" {
		t.Fatalf("expected card title as deficit source, got %v", pendingPayment["sourceTileLabel"])
	}
}

func TestGoToJailAndPayFineFlow(t *testing.T) {
	_, mux, _ := newServiceForTestWithDice(t, [2]int{6, 4})
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	rollFor := func(playerID string, key string) map[string]any {
		payload, _ := json.Marshal(map[string]string{"playerId": playerID, "idempotencyKey": key})
		recorder := httptest.NewRecorder()
		mux.ServeHTTP(recorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", payload, playerToken(roomID, playerID)))
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
	if jailed["turnState"] != "awaiting-jail-decision" {
		t.Fatalf("expected next jailed turn to require release, got %v", jailed["turnState"])
	}
	players := jailed["players"].([]any)
	host := players[0].(map[string]any)
	if host["inJail"] != true {
		t.Fatalf("expected host to be in jail")
	}

	releasePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "release-1"})
	releaseRecorder := httptest.NewRecorder()
	mux.ServeHTTP(releaseRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/jail-release", releasePayload, playerToken(roomID, hostID)))
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

func TestChanceDeckCanHoldAndUseJailCard(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{4, 3})
	roomID, hostID, _, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "chance-card"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected chance card roll status 200, got %d", rollRecorder.Code)
	}
	var drawn map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &drawn)
	players := drawn["players"].([]any)
	host := players[0].(map[string]any)
	if len(host["heldCardIds"].([]any)) != 1 {
		t.Fatalf("expected host to hold one jail card, got %v", host["heldCardIds"])
	}

	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].InJail = true
		players[0].Position = 10
		players[0].JailTurnsServed = 1
		return players
	})
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, ok := store.LoadRoomState(roomID)
	if !ok {
		t.Fatalf("expected room snapshot to exist")
	}
	snapshot.TurnState = "awaiting-jail-decision"
	snapshot.CurrentTurnPlayerID = hostID
	snapshot.PendingActionLabel = "测试用监狱状态"
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{4, 3})

	usePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "use-card"})
	useRecorder := httptest.NewRecorder()
	mux.ServeHTTP(useRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/jail-card", usePayload, playerToken(roomID, hostID)))
	if useRecorder.Code != http.StatusOK {
		t.Fatalf("expected jail card use status 200, got %d", useRecorder.Code)
	}
	var released map[string]any
	_ = json.Unmarshal(useRecorder.Body.Bytes(), &released)
	releasedHost := released["players"].([]any)[0].(map[string]any)
	if releasedHost["inJail"] == true {
		t.Fatalf("expected jail card to release host")
	}
	if rawHeldCards, ok := releasedHost["heldCardIds"]; ok && len(rawHeldCards.([]any)) != 0 {
		t.Fatalf("expected held card list to be cleared after use")
	}
}

func TestJailRollAttemptFailureIncrementsCounter(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{2, 3})
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].InJail = true
		players[0].Position = 10
		players[0].JailTurnsServed = 0
		return players
	})
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, _ := store.LoadRoomState(roomID)
	snapshot.TurnState = "awaiting-jail-decision"
	snapshot.CurrentTurnPlayerID = hostID
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{2, 3})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "jail-roll-1"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/jail-roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected jail roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if host["jailTurnsServed"] != float64(1) {
		t.Fatalf("expected failed jail roll to increment counter, got %v", host["jailTurnsServed"])
	}
	if body["currentTurnPlayerId"] != secondPlayerID {
		t.Fatalf("expected turn to advance after failed jail roll, got %v", body["currentTurnPlayerId"])
	}
}

func postJSON(t *testing.T, url string, payload map[string]string, token string) map[string]any {
	t.Helper()
	raw, _ := json.Marshal(payload)
	request, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		t.Fatalf("expected request construction to succeed: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")
	if token != "" {
		request.Header.Set(playerTokenHeader, token)
	}
	response, err := http.DefaultClient.Do(request)
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

func reloadMuxWithDice(t *testing.T, dataPath string, dice [2]int) *http.ServeMux {
	t.Helper()
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	service := rooms.NewServiceWithDependencies(store, fixedDiceRoller{value: dice})
	mux := http.NewServeMux()
	service.RegisterRoutes(mux)
	return mux
}

func mutateRoomPlayers(t *testing.T, dataPath string, roomID string, mutate func(players []rooms.Player) []rooms.Player) {
	t.Helper()
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, ok := store.LoadRoomState(roomID)
	if !ok {
		t.Fatalf("expected room snapshot to exist")
	}
	var players []rooms.Player
	if err := json.Unmarshal(snapshot.PlayersJSON, &players); err != nil {
		t.Fatalf("expected valid players json: %v", err)
	}
	players = mutate(players)
	playersJSON, err := json.Marshal(players)
	if err != nil {
		t.Fatalf("expected players to marshal: %v", err)
	}
	snapshot.PlayersJSON = playersJSON
	store.SaveRoomState(snapshot)
}

func mutateRoomSnapshot(t *testing.T, dataPath string, roomID string, mutate func(snapshot *pocketbase.PersistedRoomSnapshot)) {
	t.Helper()
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, ok := store.LoadRoomState(roomID)
	if !ok {
		t.Fatalf("expected room snapshot to exist")
	}
	mutate(&snapshot)
	store.SaveRoomState(snapshot)
}

func TestTaxTileDeductsCashWhenAffordable(t *testing.T) {
	_, mux, _ := newServiceForTestWithDice(t, [2]int{2, 2})
	roomID, hostID, _, _ := createStartedRoom(t, mux)

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "tax-roll"})
	recorder := httptest.NewRecorder()
	mux.ServeHTTP(recorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected tax roll status 200, got %d", recorder.Code)
	}

	var body map[string]any
	_ = json.Unmarshal(recorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(1300) {
		t.Fatalf("expected host cash 1300 after tax, got %v", host["cash"])
	}
	if body["turnState"] != "awaiting-roll" {
		t.Fatalf("expected room to continue after affordable tax, got %v", body["turnState"])
	}
}

func TestTaxDeficitCanBeResolvedByMortgage(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{2, 2})
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Cash = 100
		players[0].Properties = []string{"tile-39"}
		return players
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{2, 2})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "deficit-roll"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected deficit roll status 200, got %d", rollRecorder.Code)
	}
	var deficit map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &deficit)
	if deficit["turnState"] != "awaiting-deficit-resolution" {
		t.Fatalf("expected deficit state, got %v", deficit["turnState"])
	}
	if deficit["pendingPayment"] == nil {
		t.Fatalf("expected pending payment after unaffordable tax")
	}

	mortgagePayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "mortgage-1", "tileId": "tile-39"})
	mortgageRecorder := httptest.NewRecorder()
	mux.ServeHTTP(mortgageRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/mortgage", mortgagePayload, playerToken(roomID, hostID)))
	if mortgageRecorder.Code != http.StatusOK {
		t.Fatalf("expected mortgage status 200, got %d", mortgageRecorder.Code)
	}
	var settled map[string]any
	_ = json.Unmarshal(mortgageRecorder.Body.Bytes(), &settled)
	if settled["turnState"] != "awaiting-roll" {
		t.Fatalf("expected deficit to resolve back to awaiting-roll, got %v", settled["turnState"])
	}
	if settled["pendingPayment"] != nil {
		t.Fatalf("expected pending payment cleared after mortgage settlement")
	}
	players := settled["players"].([]any)
	host := players[0].(map[string]any)
	if host["cash"] != float64(145) {
		t.Fatalf("expected host cash 145 after mortgage and tax settlement, got %v", host["cash"])
	}
	mortgaged := host["mortgagedProperties"].([]any)
	if len(mortgaged) != 1 || mortgaged[0] != "tile-39" {
		t.Fatalf("expected tile-39 to be mortgaged, got %v", mortgaged)
	}
}

func TestTaxDeficitCanEndInBankruptcy(t *testing.T) {
	_, mux, dataPath := newServiceForTestWithDice(t, [2]int{2, 2})
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Cash = 100
		players[0].Properties = []string{}
		return players
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{2, 2})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "bankrupt-roll"})
	mux.ServeHTTP(httptest.NewRecorder(), authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, hostID)))

	bankruptcyPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "bankrupt-1"})
	bankruptcyRecorder := httptest.NewRecorder()
	mux.ServeHTTP(bankruptcyRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/bankruptcy", bankruptcyPayload, playerToken(roomID, hostID)))
	if bankruptcyRecorder.Code != http.StatusOK {
		t.Fatalf("expected bankruptcy status 200, got %d", bankruptcyRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(bankruptcyRecorder.Body.Bytes(), &body)
	if body["roomState"] != "finished" {
		t.Fatalf("expected room to finish when one active player remains, got %v", body["roomState"])
	}
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if host["isBankrupt"] != true {
		t.Fatalf("expected host to be bankrupt")
	}
	if host["cash"] != float64(0) {
		t.Fatalf("expected bankrupt host cash to be 0, got %v", host["cash"])
	}
}

func TestBuildImprovementAndImprovedRent(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Properties = []string{"tile-1", "tile-3"}
		players[0].PropertyImprovements = map[string]int{}
		players[1].Position = 35
		return players
	})
	mux = reloadMuxWithDice(t, dataPath, [2]int{3, 3})

	buildPayload1, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "build-1", "tileId": "tile-1"})
	buildRecorder1 := httptest.NewRecorder()
	mux.ServeHTTP(buildRecorder1, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/build", buildPayload1, playerToken(roomID, hostID)))
	if buildRecorder1.Code != http.StatusOK {
		t.Fatalf("expected first build status 200, got %d", buildRecorder1.Code)
	}

	buildPayload2, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "build-2", "tileId": "tile-3"})
	buildRecorder2 := httptest.NewRecorder()
	mux.ServeHTTP(buildRecorder2, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/build", buildPayload2, playerToken(roomID, hostID)))
	if buildRecorder2.Code != http.StatusOK {
		t.Fatalf("expected second build status 200, got %d", buildRecorder2.Code)
	}

	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, _ := store.LoadRoomState(roomID)
	snapshot.CurrentTurnPlayerID = secondPlayerID
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{3, 3})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "rent-1"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, secondPlayerID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected improved rent roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	second := players[1].(map[string]any)
	if host["cash"] != float64(1440) {
		t.Fatalf("expected host cash 1440 after improved rent, got %v", host["cash"])
	}
	if second["cash"] != float64(1440) {
		t.Fatalf("expected second cash 1440 after improved rent, got %v", second["cash"])
	}
	if body["turnState"] != "awaiting-roll" {
		t.Fatalf("expected room to continue after improved rent, got %v", body["turnState"])
	}
}

func TestImprovedRentCanEnterDeficitRecovery(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Properties = []string{"tile-1", "tile-3"}
		players[0].PropertyImprovements = map[string]int{"tile-1": 1, "tile-3": 1}
		players[1].Position = 35
		players[1].Cash = 20
		return players
	})
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, _ := store.LoadRoomState(roomID)
	snapshot.CurrentTurnPlayerID = secondPlayerID
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{3, 3})

	rollPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "rent-deficit"})
	rollRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rollRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/roll", rollPayload, playerToken(roomID, secondPlayerID)))
	if rollRecorder.Code != http.StatusOK {
		t.Fatalf("expected improved rent deficit roll status 200, got %d", rollRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(rollRecorder.Body.Bytes(), &body)
	if body["turnState"] != "awaiting-deficit-resolution" {
		t.Fatalf("expected improved rent to enter deficit recovery, got %v", body["turnState"])
	}
	pendingPayment := body["pendingPayment"].(map[string]any)
	if pendingPayment["reason"] != "rent" {
		t.Fatalf("expected pending payment reason rent, got %v", pendingPayment["reason"])
	}
	if pendingPayment["creditorPlayerId"] != hostID {
		t.Fatalf("expected host to be rent creditor, got %v", pendingPayment["creditorPlayerId"])
	}
}

func TestBankruptcyTransfersAssetsToPlayerCreditor(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Cash = 65
		players[0].Properties = []string{"tile-1", "tile-3"}
		players[0].MortgagedProperties = []string{"tile-3"}
		players[0].PropertyImprovements = map[string]int{"tile-1": 2}
		players[0].HeldCardIDs = []string{"chance-jail-card"}
		players[1].Cash = 900
		return players
	})
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, _ := store.LoadRoomState(roomID)
	snapshot.TurnState = "awaiting-deficit-resolution"
	snapshot.CurrentTurnPlayerID = hostID
	pendingPayment, _ := json.Marshal(map[string]any{"amount": 140, "reason": "rent", "creditorKind": "player", "creditorPlayerId": secondPlayerID, "sourceTileId": "tile-6", "sourceTileLabel": "东湖路"})
	snapshot.PendingPaymentJSON = pendingPayment
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{1, 1})

	bankruptcyPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "player-creditor-bankruptcy"})
	bankruptcyRecorder := httptest.NewRecorder()
	mux.ServeHTTP(bankruptcyRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/bankruptcy", bankruptcyPayload, playerToken(roomID, hostID)))
	if bankruptcyRecorder.Code != http.StatusOK {
		t.Fatalf("expected player creditor bankruptcy status 200, got %d", bankruptcyRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(bankruptcyRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	creditor := players[1].(map[string]any)
	if host["isBankrupt"] != true {
		t.Fatalf("expected bankrupt player flag")
	}
	if len(host["properties"].([]any)) != 0 {
		t.Fatalf("expected bankrupt player properties cleared")
	}
	if creditor["cash"] != float64(965) {
		t.Fatalf("expected creditor cash 965 after receiving remaining cash, got %v", creditor["cash"])
	}
	creditorProperties := creditor["properties"].([]any)
	if len(creditorProperties) < 2 {
		t.Fatalf("expected creditor to receive transferred properties, got %v", creditorProperties)
	}
	creditorCards := creditor["heldCardIds"].([]any)
	if len(creditorCards) != 1 || creditorCards[0] != "chance-jail-card" {
		t.Fatalf("expected creditor to receive held jail card, got %v", creditorCards)
	}
	creditorMortgages := creditor["mortgagedProperties"].([]any)
	if len(creditorMortgages) != 1 || creditorMortgages[0] != "tile-3" {
		t.Fatalf("expected creditor to inherit mortgaged property, got %v", creditorMortgages)
	}
	if body["turnState"] != "post-roll-pending" {
		t.Fatalf("expected room to finish after player-creditor bankruptcy leaves one active player, got %v", body["turnState"])
	}
	if body["roomState"] != "finished" {
		t.Fatalf("expected room to finish when one active player remains, got %v", body["roomState"])
	}
}

func TestBankruptcyReturnsHeldCardsToDeckForBankCreditor(t *testing.T) {
	_, mux, dataPath := newServiceForTest(t)
	roomID, hostID, _, _ := createStartedRoom(t, mux)
	mutateRoomPlayers(t, dataPath, roomID, func(players []rooms.Player) []rooms.Player {
		players[0].Cash = 0
		players[0].Properties = []string{"tile-1"}
		players[0].PropertyImprovements = map[string]int{"tile-1": 1}
		players[0].HeldCardIDs = []string{"chance-jail-card", "community-jail-card"}
		return players
	})
	store := pocketbase.NewClient(pocketbase.ClientConfig{BaseURL: "http://127.0.0.1:8090", DataPath: dataPath})
	snapshot, _ := store.LoadRoomState(roomID)
	snapshot.TurnState = "awaiting-deficit-resolution"
	snapshot.CurrentTurnPlayerID = hostID
	pendingPayment, _ := json.Marshal(map[string]any{"amount": 200, "reason": "tax", "creditorKind": "bank", "sourceTileId": "tile-4", "sourceTileLabel": "税务局"})
	snapshot.PendingPaymentJSON = pendingPayment
	store.SaveRoomState(snapshot)
	mux = reloadMuxWithDice(t, dataPath, [2]int{1, 1})

	bankruptcyPayload, _ := json.Marshal(map[string]string{"playerId": hostID, "idempotencyKey": "bank-creditor-bankruptcy"})
	bankruptcyRecorder := httptest.NewRecorder()
	mux.ServeHTTP(bankruptcyRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/bankruptcy", bankruptcyPayload, playerToken(roomID, hostID)))
	if bankruptcyRecorder.Code != http.StatusOK {
		t.Fatalf("expected bank creditor bankruptcy status 200, got %d", bankruptcyRecorder.Code)
	}
	var body map[string]any
	_ = json.Unmarshal(bankruptcyRecorder.Body.Bytes(), &body)
	players := body["players"].([]any)
	host := players[0].(map[string]any)
	if rawHeldCards, ok := host["heldCardIds"]; ok && len(rawHeldCards.([]any)) != 0 {
		t.Fatalf("expected bankrupt player held cards cleared")
	}
	chanceDeck := body["chanceDeck"].(map[string]any)
	communityDeck := body["communityDeck"].(map[string]any)
	if len(chanceDeck["discardPile"].([]any)) == 0 || chanceDeck["discardPile"].([]any)[len(chanceDeck["discardPile"].([]any))-1] != "chance-jail-card" {
		t.Fatalf("expected chance jail card returned to discard pile, got %v", chanceDeck["discardPile"])
	}
	if len(communityDeck["discardPile"].([]any)) == 0 || communityDeck["discardPile"].([]any)[len(communityDeck["discardPile"].([]any))-1] != "community-jail-card" {
		t.Fatalf("expected community jail card returned to discard pile, got %v", communityDeck["discardPile"])
	}
}

func TestCashTradeProposalAndAcceptance(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	proposalPayload, _ := json.Marshal(map[string]any{
		"playerId": hostID,
		"idempotencyKey": "trade-1",
		"counterpartyPlayerId": secondPlayerID,
		"offeredCash": 100,
		"requestedCash": 50,
		"offeredTileIds": []string{},
		"requestedTileIds": []string{},
		"offeredCardIds": []string{},
		"requestedCardIds": []string{},
	})
	proposalRecorder := httptest.NewRecorder()
	mux.ServeHTTP(proposalRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/trade/propose", proposalPayload, playerToken(roomID, hostID)))
	if proposalRecorder.Code != http.StatusOK {
		t.Fatalf("expected trade proposal status 200, got %d", proposalRecorder.Code)
	}
	var proposed map[string]any
	_ = json.Unmarshal(proposalRecorder.Body.Bytes(), &proposed)
	if proposed["turnState"] != "awaiting-trade-response" {
		t.Fatalf("expected room to await trade response, got %v", proposed["turnState"])
	}
	if proposed["currentTurnPlayerId"] != secondPlayerID {
		t.Fatalf("expected counterparty to become current responder, got %v", proposed["currentTurnPlayerId"])
	}

	acceptPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "trade-accept-1"})
	acceptRecorder := httptest.NewRecorder()
	mux.ServeHTTP(acceptRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/trade/accept", acceptPayload, playerToken(roomID, secondPlayerID)))
	if acceptRecorder.Code != http.StatusOK {
		t.Fatalf("expected trade acceptance status 200, got %d", acceptRecorder.Code)
	}
	var accepted map[string]any
	_ = json.Unmarshal(acceptRecorder.Body.Bytes(), &accepted)
	if accepted["turnState"] != "awaiting-roll" {
		t.Fatalf("expected accepted trade to restore awaiting-roll, got %v", accepted["turnState"])
	}
	if accepted["currentTurnPlayerId"] != hostID {
		t.Fatalf("expected proposer to resume turn after trade, got %v", accepted["currentTurnPlayerId"])
	}
	players := accepted["players"].([]any)
	host := players[0].(map[string]any)
	second := players[1].(map[string]any)
	if host["cash"] != float64(1450) {
		t.Fatalf("expected host cash 1450 after trade, got %v", host["cash"])
	}
	if second["cash"] != float64(1550) {
		t.Fatalf("expected second player cash 1550 after trade, got %v", second["cash"])
	}
}

func TestCashTradeProposalAndRejection(t *testing.T) {
	_, mux, _ := newServiceForTest(t)
	roomID, hostID, secondPlayerID, _ := createStartedRoom(t, mux)

	proposalPayload, _ := json.Marshal(map[string]any{
		"playerId": hostID,
		"idempotencyKey": "trade-reject-1",
		"counterpartyPlayerId": secondPlayerID,
		"offeredCash": 100,
		"requestedCash": 50,
		"offeredTileIds": []string{},
		"requestedTileIds": []string{},
		"offeredCardIds": []string{},
		"requestedCardIds": []string{},
	})
	proposalRecorder := httptest.NewRecorder()
	mux.ServeHTTP(proposalRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/trade/propose", proposalPayload, playerToken(roomID, hostID)))
	if proposalRecorder.Code != http.StatusOK {
		t.Fatalf("expected trade proposal status 200, got %d", proposalRecorder.Code)
	}

	rejectPayload, _ := json.Marshal(map[string]string{"playerId": secondPlayerID, "idempotencyKey": "trade-reject-accept-1"})
	rejectRecorder := httptest.NewRecorder()
	mux.ServeHTTP(rejectRecorder, authorizedRequest(http.MethodPost, "/api/rooms/"+roomID+"/trade/reject", rejectPayload, playerToken(roomID, secondPlayerID)))
	if rejectRecorder.Code != http.StatusOK {
		t.Fatalf("expected trade rejection status 200, got %d", rejectRecorder.Code)
	}
	var rejected map[string]any
	_ = json.Unmarshal(rejectRecorder.Body.Bytes(), &rejected)
	if rejected["turnState"] != "awaiting-roll" {
		t.Fatalf("expected rejected trade to restore awaiting-roll, got %v", rejected["turnState"])
	}
	if rejected["currentTurnPlayerId"] != hostID {
		t.Fatalf("expected proposer to resume turn after rejection, got %v", rejected["currentTurnPlayerId"])
	}
	recentEvents := rejected["recentEvents"].([]any)
	latestEvent := recentEvents[len(recentEvents)-1].(map[string]any)
	if latestEvent["type"] != "trade-rejected" {
		t.Fatalf("expected latest event trade-rejected, got %v", latestEvent["type"])
	}
	if latestEvent["offeredCash"] != float64(100) || latestEvent["requestedCash"] != float64(50) {
		t.Fatalf("expected rejected trade event to keep trade cash snapshot, got %v / %v", latestEvent["offeredCash"], latestEvent["requestedCash"])
	}
}
