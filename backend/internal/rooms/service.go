package rooms

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/pocketbase"
)

const (
	boardTileCount      = 40
	maxEventCatchUpSpan = 20
	jailTileIndex       = 10
	jailFine            = 50
	taxPaymentAmount    = 200
)

var boardLabels = []string{
	"起点",
	"南城路",
	"命运",
	"北城路",
	"税务局",
	"中央车站",
	"东湖路",
	"机会",
	"西街",
	"海湾路",
	"监狱",
	"学府街",
	"水电局",
	"商业街",
	"中央广场",
	"滨江车站",
	"剧院街",
	"命运",
	"花园路",
	"金融街",
	"免费停车",
	"工业路",
	"机会",
	"博物馆街",
	"山景路",
	"北港车站",
	"商业区",
	"中心银行",
	"星河路",
	"海景路",
	"去监狱",
	"乐园街",
	"科技园",
	"命运",
	"机场路",
	"东港车站",
	"税务抽查",
	"云顶路",
	"机会",
	"终章大道",
}

type DiceRoller interface {
	Roll() [2]int
}

type randomDiceRoller struct {
	mu     sync.Mutex
	random *rand.Rand
}

func newRandomDiceRoller() *randomDiceRoller {
	if fixedRoll, ok := loadFixedDiceRoll(); ok {
		return &randomDiceRoller{random: rand.New(rand.NewSource(int64(fixedRoll[0]*10 + fixedRoll[1])))}
	}
	return &randomDiceRoller{random: rand.New(rand.NewSource(time.Now().UnixNano()))}
}

func (roller *randomDiceRoller) Roll() [2]int {
	if fixedRoll, ok := loadFixedDiceRoll(); ok {
		return fixedRoll
	}

	roller.mu.Lock()
	defer roller.mu.Unlock()

	return [2]int{roller.random.Intn(6) + 1, roller.random.Intn(6) + 1}
}

func loadFixedDiceRoll() ([2]int, bool) {
	raw := strings.TrimSpace(os.Getenv("DAFUWENG_FIXED_DICE"))
	if raw == "" {
		return [2]int{}, false
	}

	parts := strings.Split(raw, ",")
	if len(parts) != 2 {
		return [2]int{}, false
	}
	left, leftErr := strconv.Atoi(strings.TrimSpace(parts[0]))
	right, rightErr := strconv.Atoi(strings.TrimSpace(parts[1]))
	if leftErr != nil || rightErr != nil || left < 1 || left > 6 || right < 1 || right > 6 {
		return [2]int{}, false
	}

	return [2]int{left, right}, true
}

type Player struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Cash       int      `json:"cash"`
	Position   int      `json:"position"`
	Properties []string `json:"properties"`
	MortgagedProperties []string `json:"mortgagedProperties,omitempty"`
	InJail     bool     `json:"inJail,omitempty"`
	IsBankrupt bool     `json:"isBankrupt,omitempty"`
	Ready      bool     `json:"ready,omitempty"`
}

type PendingProperty struct {
	TileID    string `json:"tileId"`
	TileIndex int    `json:"tileIndex"`
	Label     string `json:"label"`
	Price     int    `json:"price"`
}

type PendingAuction struct {
	TileID           string   `json:"tileId"`
	TileIndex        int      `json:"tileIndex"`
	Label            string   `json:"label"`
	Price            int      `json:"price"`
	InitiatorPlayerID string  `json:"initiatorPlayerId"`
	HighestBid       int      `json:"highestBid"`
	HighestBidderID  string   `json:"highestBidderId,omitempty"`
	PassedPlayerIDs  []string `json:"passedPlayerIds"`
}

type PendingPayment struct {
	Amount          int    `json:"amount"`
	Reason          string `json:"reason"`
	CreditorKind    string `json:"creditorKind"`
	CreditorPlayerID string `json:"creditorPlayerId,omitempty"`
	SourceTileID    string `json:"sourceTileId,omitempty"`
	SourceTileLabel string `json:"sourceTileLabel,omitempty"`
}

type Event struct {
	ID              string `json:"id"`
	Type            string `json:"type"`
	Sequence        int    `json:"sequence"`
	SnapshotVersion int    `json:"snapshotVersion"`
	Summary         string `json:"summary"`
	RoomState       string `json:"roomState,omitempty"`
	PlayerID        string `json:"playerId,omitempty"`
	OwnerPlayerID   string `json:"ownerPlayerId,omitempty"`
	NextPlayerID    string `json:"nextPlayerId,omitempty"`
	TileID          string `json:"tileId,omitempty"`
	TileIndex       int    `json:"tileIndex,omitempty"`
	TileLabel       string `json:"tileLabel,omitempty"`
	TilePrice       int    `json:"tilePrice,omitempty"`
	Amount          int    `json:"amount,omitempty"`
	PlayerPosition  int    `json:"playerPosition,omitempty"`
	CashAfter       int    `json:"cashAfter,omitempty"`
	OwnerCashAfter  int    `json:"ownerCashAfter,omitempty"`
	LastRoll        [2]int `json:"lastRoll,omitempty"`
}

type RoomResponse struct {
	RoomID              string           `json:"roomId"`
	State               string           `json:"roomState"`
	HostID              string           `json:"hostId"`
	SnapshotVersion     int              `json:"snapshotVersion"`
	EventSequence       int              `json:"eventSequence"`
	TurnState           string           `json:"turnState"`
	CurrentTurnPlayerID string           `json:"currentTurnPlayerId"`
	PendingAction       string           `json:"pendingActionLabel"`
	PendingProperty     *PendingProperty `json:"pendingProperty"`
	PendingAuction      *PendingAuction  `json:"pendingAuction"`
	PendingPayment      *PendingPayment  `json:"pendingPayment"`
	LastRoll            [2]int           `json:"lastRoll"`
	RecentEvents        []Event          `json:"recentEvents"`
	Players             []Player         `json:"players"`
}

type RoomEventCatchUpResponse struct {
	RoomID         string        `json:"roomId"`
	AfterSequence  int           `json:"afterSequence"`
	LatestSequence int           `json:"latestSequence"`
	Events         []Event       `json:"events"`
	Snapshot       *RoomResponse `json:"snapshot"`
}

type roomStreamEnvelope struct {
	Kind     string        `json:"kind"`
	Event    *Event        `json:"event,omitempty"`
	Snapshot *RoomResponse `json:"snapshot,omitempty"`
}

type CreateRoomRequest struct {
	HostName string `json:"hostName"`
}

type JoinRoomRequest struct {
	PlayerName string `json:"playerName"`
}

type StartGameRequest struct {
	HostID string `json:"hostId"`
}

type RollDiceRequest struct {
	PlayerID       string `json:"playerId"`
	IdempotencyKey string `json:"idempotencyKey"`
}

type PropertyDecisionRequest struct {
	PlayerID       string `json:"playerId"`
	IdempotencyKey string `json:"idempotencyKey"`
}

type AuctionBidRequest struct {
	PlayerID       string `json:"playerId"`
	IdempotencyKey string `json:"idempotencyKey"`
	Amount         int    `json:"amount"`
}

type MortgagePropertyRequest struct {
	PlayerID       string `json:"playerId"`
	IdempotencyKey string `json:"idempotencyKey"`
	TileID         string `json:"tileId"`
}

type tileDetails struct {
	ID          string
	Index       int
	Label       string
	Price       int
	Rent        int
	Purchasable bool
}

type roomRecord struct {
	RoomID              string
	State               string
	HostID              string
	SnapshotVersion     int
	EventSequence       int
	TurnState           string
	CurrentTurnPlayerID string
	PendingAction       string
	PendingProperty     *PendingProperty
	PendingAuction      *PendingAuction
	PendingPayment      *PendingPayment
	LastRoll            [2]int
	Players             []Player
	RecentEvents        []Event
}

type eventDraft struct {
	Type           string
	Summary        string
	RoomState      string
	PlayerID       string
	OwnerPlayerID  string
	NextPlayerID   string
	TileID         string
	TileIndex      int
	TileLabel      string
	TilePrice      int
	Amount         int
	PlayerPosition int
	CashAfter      int
	OwnerCashAfter int
	LastRoll       [2]int
}

type Service struct {
	mu           sync.Mutex
	streamMu     sync.Mutex
	store        *pocketbase.Client
	diceRoller   DiceRoller
	nextRoomID   int
	nextPlayerID int
	nextStreamID int
	streamSubscribers map[string]map[int]chan roomStreamEnvelope
}

func NewService(store *pocketbase.Client) *Service {
	return NewServiceWithDependencies(store, newRandomDiceRoller())
}

func NewServiceWithDependencies(store *pocketbase.Client, diceRoller DiceRoller) *Service {
	service := &Service{
		store:        store,
		diceRoller:   diceRoller,
		nextRoomID:   1,
		nextPlayerID: 1,
		streamSubscribers: make(map[string]map[int]chan roomStreamEnvelope),
	}
	service.seedDemoRoom()
	service.syncCounters()
	return service
}

func (service *Service) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/rooms", service.HandleRooms)
	mux.HandleFunc("/api/rooms/", service.HandleRoomRoute)
}

func (service *Service) HandleRooms(writer http.ResponseWriter, request *http.Request) {
	if service.handlePreflight(writer, request, http.MethodPost) {
		return
	}

	if request.Method != http.MethodPost {
		writeError(writer, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var payload CreateRoomRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid room payload")
		return
	}

	hostName := strings.TrimSpace(payload.HostName)
	if hostName == "" {
		writeError(writer, http.StatusBadRequest, "hostName is required")
		return
	}

	room := service.createRoom(hostName)
	writeJSON(writer, http.StatusCreated, room.toResponse())
}

func (service *Service) HandleRoomRoute(writer http.ResponseWriter, request *http.Request) {
	if service.handlePreflight(writer, request, http.MethodGet, http.MethodPost) {
		return
	}

	trimmed := strings.TrimPrefix(request.URL.Path, "/api/rooms/")
	parts := strings.Split(strings.Trim(trimmed, "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeError(writer, http.StatusNotFound, "room not found")
		return
	}

	roomID := parts[0]
	if len(parts) == 1 && request.Method == http.MethodGet {
		room, ok := service.getRoom(roomID)
		if !ok {
			writeError(writer, http.StatusNotFound, "room not found")
			return
		}

		writeJSON(writer, http.StatusOK, room.toResponse())
		return
	}

	if len(parts) == 2 {
		switch {
		case parts[1] == "events" && request.Method == http.MethodGet:
			service.handleRoomEvents(writer, request, roomID)
			return
		case parts[1] == "stream" && request.Method == http.MethodGet:
			service.handleRoomStream(writer, request, roomID)
			return
		case parts[1] == "join" && request.Method == http.MethodPost:
			service.handleJoinRoom(writer, request, roomID)
			return
		case parts[1] == "start" && request.Method == http.MethodPost:
			service.handleStartRoom(writer, request, roomID)
			return
		case parts[1] == "roll" && request.Method == http.MethodPost:
			service.handleRollDice(writer, request, roomID)
			return
		case parts[1] == "purchase" && request.Method == http.MethodPost:
			service.handlePurchaseProperty(writer, request, roomID)
			return
		case parts[1] == "decline" && request.Method == http.MethodPost:
			service.handleDeclineProperty(writer, request, roomID)
			return
		case parts[1] == "bid" && request.Method == http.MethodPost:
			service.handleAuctionBid(writer, request, roomID)
			return
		case parts[1] == "pass" && request.Method == http.MethodPost:
			service.handleAuctionPass(writer, request, roomID)
			return
		case parts[1] == "jail-release" && request.Method == http.MethodPost:
			service.handleJailRelease(writer, request, roomID)
			return
		case parts[1] == "mortgage" && request.Method == http.MethodPost:
			service.handleMortgageProperty(writer, request, roomID)
			return
		case parts[1] == "bankruptcy" && request.Method == http.MethodPost:
			service.handleDeclareBankruptcy(writer, request, roomID)
			return
		}
	}

	writeError(writer, http.StatusMethodNotAllowed, "unsupported room route")
}

func (service *Service) handleRoomEvents(writer http.ResponseWriter, request *http.Request, roomID string) {
	afterSequence := 0
	if raw := strings.TrimSpace(request.URL.Query().Get("afterSequence")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			writeError(writer, http.StatusBadRequest, "afterSequence must be an integer")
			return
		}
		afterSequence = parsed
	}

	response, err := service.catchUpRoomEvents(roomID, afterSequence)
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, response)
}

func (service *Service) handleRoomStream(writer http.ResponseWriter, request *http.Request, roomID string) {
	writer.Header().Set("Access-Control-Allow-Origin", "*")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := writer.(http.Flusher)
	if !ok {
		writeError(writer, http.StatusInternalServerError, "streaming unsupported")
		return
	}

	afterSequence := 0
	if raw := strings.TrimSpace(request.URL.Query().Get("afterSequence")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			writeError(writer, http.StatusBadRequest, "afterSequence must be an integer")
			return
		}
		afterSequence = parsed
	}

	subscriberID, stream := service.addRoomStreamSubscriber(roomID)
	defer service.removeRoomStreamSubscriber(roomID, subscriberID)

	bootstrap, err := service.catchUpRoomEvents(roomID, afterSequence)
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	if bootstrap.Snapshot != nil {
		if err := writeSSE(writer, "snapshot", roomStreamEnvelope{Kind: "snapshot", Snapshot: bootstrap.Snapshot}); err != nil {
			return
		}
	}
	for _, event := range bootstrap.Events {
		streamEvent := event
		if err := writeSSE(writer, "room-event", roomStreamEnvelope{Kind: "event", Event: &streamEvent}); err != nil {
			return
		}
	}
	flusher.Flush()

	keepAliveTicker := time.NewTicker(15 * time.Second)
	defer keepAliveTicker.Stop()

	for {
		select {
		case <-request.Context().Done():
			return
		case envelope, ok := <-stream:
			if !ok {
				return
			}
			eventName := "room-event"
			if envelope.Kind == "snapshot" {
				eventName = "snapshot"
			}
			if err := writeSSE(writer, eventName, envelope); err != nil {
				return
			}
			flusher.Flush()
		case <-keepAliveTicker.C:
			if _, err := writer.Write([]byte(": keepalive\n\n")); err != nil {
				return
			}
			flusher.Flush()
		}
	}
}

func (service *Service) handleJoinRoom(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload JoinRoomRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid join payload")
		return
	}

	room, err := service.joinRoom(roomID, strings.TrimSpace(payload.PlayerName))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleStartRoom(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload StartGameRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid start payload")
		return
	}

	room, err := service.startRoom(roomID, strings.TrimSpace(payload.HostID))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleRollDice(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload RollDiceRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid roll payload")
		return
	}

	room, err := service.rollDice(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handlePurchaseProperty(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload PropertyDecisionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid purchase payload")
		return
	}

	room, err := service.purchaseProperty(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleDeclineProperty(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload PropertyDecisionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid decline payload")
		return
	}

	room, err := service.declineProperty(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleAuctionBid(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload AuctionBidRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid bid payload")
		return
	}

	room, err := service.submitAuctionBid(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey), payload.Amount)
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleAuctionPass(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload PropertyDecisionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid auction pass payload")
		return
	}

	room, err := service.passAuction(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleJailRelease(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload PropertyDecisionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid jail release payload")
		return
	}

	room, err := service.payJailFine(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleMortgageProperty(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload MortgagePropertyRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid mortgage payload")
		return
	}

	room, err := service.mortgageProperty(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey), strings.TrimSpace(payload.TileID))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) handleDeclareBankruptcy(writer http.ResponseWriter, request *http.Request, roomID string) {
	var payload PropertyDecisionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "invalid bankruptcy payload")
		return
	}

	room, err := service.declareBankruptcy(roomID, strings.TrimSpace(payload.PlayerID), strings.TrimSpace(payload.IdempotencyKey))
	if err != nil {
		writeError(writer, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(writer, http.StatusOK, room.toResponse())
}

func (service *Service) createRoom(hostName string) roomRecord {
	service.mu.Lock()
	defer service.mu.Unlock()

	roomID := fmt.Sprintf("room-%03d", service.nextRoomID)
	service.nextRoomID++
	hostPlayer := service.newPlayer(hostName)
	hostPlayer.Ready = true

	room := roomRecord{
		RoomID:              roomID,
		State:               "lobby",
		HostID:              hostPlayer.ID,
		SnapshotVersion:     0,
		EventSequence:       0,
		TurnState:           "awaiting-roll",
		CurrentTurnPlayerID: hostPlayer.ID,
		PendingAction:       "等待更多玩家加入",
		PendingProperty:     nil,
		PendingAuction:      nil,
		PendingPayment:      nil,
		LastRoll:            [2]int{0, 0},
		Players:             []Player{hostPlayer},
	}

	service.commitRoomMutation(&room, []eventDraft{{Type: "room-created", Summary: fmt.Sprintf("%s 创建了房间。", hostPlayer.Name)}})
	return room
}

func (service *Service) getRoom(roomID string) (roomRecord, bool) {
	snapshot, ok := service.store.LoadRoomState(roomID)
	if !ok {
		return roomRecord{}, false
	}

	return service.hydrateRoom(snapshot), true
}

func (service *Service) catchUpRoomEvents(roomID string, afterSequence int) (RoomEventCatchUpResponse, error) {
	room, ok := service.getRoom(roomID)
	if !ok {
		return RoomEventCatchUpResponse{}, fmt.Errorf("room not found")
	}
	if afterSequence < 0 {
		return RoomEventCatchUpResponse{}, fmt.Errorf("afterSequence must be positive")
	}

	response := RoomEventCatchUpResponse{
		RoomID:         roomID,
		AfterSequence:  afterSequence,
		LatestSequence: room.EventSequence,
		Events:         []Event{},
		Snapshot:       nil,
	}

	if afterSequence > room.EventSequence || room.EventSequence-afterSequence > maxEventCatchUpSpan {
		snapshot := room.toResponse()
		response.Snapshot = &snapshot
		return response, nil
	}

	response.Events = toRoomEvents(service.store.ListRoomEventsAfter(roomID, afterSequence))
	return response, nil
}

func (service *Service) joinRoom(roomID string, playerName string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerName == "" {
		return roomRecord{}, fmt.Errorf("playerName is required")
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.State != "lobby" {
		return roomRecord{}, fmt.Errorf("room is not joinable")
	}
	if len(room.Players) >= 4 {
		return roomRecord{}, fmt.Errorf("room is full")
	}
	for _, player := range room.Players {
		if player.Name == playerName {
			return roomRecord{}, fmt.Errorf("player name already exists in room")
		}
	}

	player := service.newPlayer(playerName)
	room.Players = append(room.Players, player)
	room.PendingAction = "房主可在准备完成后开始游戏"
	service.commitRoomMutation(&room, []eventDraft{{Type: "player-joined", Summary: fmt.Sprintf("%s 加入了房间。", player.Name)}})

	return room, nil
}

func (service *Service) startRoom(roomID string, hostID string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.HostID != hostID {
		return roomRecord{}, fmt.Errorf("only host can start the room")
	}
	if len(room.Players) < 2 {
		return roomRecord{}, fmt.Errorf("at least two players are required")
	}
	if room.State != "lobby" {
		return roomRecord{}, fmt.Errorf("room is already started")
	}

	for index := range room.Players {
		room.Players[index].Ready = true
	}

	room.State = "in-game"
	room.TurnState = "awaiting-roll"
	room.PendingAction = "等待当前玩家掷骰"
	room.PendingProperty = nil
	room.PendingAuction = nil
	room.PendingPayment = nil
	room.CurrentTurnPlayerID = room.Players[0].ID
	room.LastRoll = [2]int{0, 0}
	service.commitRoomMutation(&room, []eventDraft{{Type: "room-started", Summary: "房主开始了对局。"}})

	return room, nil
}

func (service *Service) rollDice(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}

	if result, ok := service.store.LoadCommandResult(roomID, playerID, "roll-dice", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.State != "in-game" {
		return roomRecord{}, fmt.Errorf("room is not in-game")
	}
	if room.TurnState != "awaiting-roll" {
		return roomRecord{}, fmt.Errorf("room is not waiting for a roll")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current turn player can roll")
	}

	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}

	dice := service.diceRoller.Roll()
	total := dice[0] + dice[1]
	room.Players[playerIndex].Position = (room.Players[playerIndex].Position + total) % boardTileCount
	room.LastRoll = dice
	player := room.Players[playerIndex]
	tile := tileForIndex(player.Position)
	drafts := []eventDraft{
		{Type: "dice-rolled", Summary: fmt.Sprintf("%s 掷出 %d + %d。", player.Name, dice[0], dice[1]), PlayerID: player.ID, LastRoll: dice},
		{Type: "player-moved", Summary: fmt.Sprintf("%s 移动到 %s。", player.Name, tile.Label), PlayerID: player.ID, TileID: tile.ID, TileIndex: tile.Index, TileLabel: tile.Label, PlayerPosition: player.Position},
	}

	if handled, handledDrafts := room.resolveSpecialTile(playerIndex, tile); handled {
		drafts = append(drafts, handledDrafts...)
		service.commitRoomMutation(&room, drafts)
		service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
			RoomID:          room.RoomID,
			PlayerID:        playerID,
			CommandKind:     "roll-dice",
			IdempotencyKey:  idempotencyKey,
			Snapshot:        room.toPersistedSnapshot(),
			RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
		})
		return room, nil
	}

	if tile.Purchasable && !room.tileIsOwned(tile.ID) {
		room.TurnState = "awaiting-property-decision"
		room.PendingAction = fmt.Sprintf("可购买 %s，价格 %d。", tile.Label, tile.Price)
		room.PendingProperty = &PendingProperty{TileID: tile.ID, TileIndex: tile.Index, Label: tile.Label, Price: tile.Price}
		drafts = append(drafts, eventDraft{
			Type:      "property-offered",
			Summary:   fmt.Sprintf("%s 可选择购买 %s。", player.Name, tile.Label),
			PlayerID:  player.ID,
			TileID:    tile.ID,
			TileIndex: tile.Index,
			TileLabel: tile.Label,
			TilePrice: tile.Price,
		})
	} else if ownerIndex := findPropertyOwnerIndex(room.Players, tile.ID); ownerIndex != -1 && room.Players[ownerIndex].ID != player.ID {
		rent := tile.Rent
		room.Players[playerIndex].Cash -= rent
		room.Players[ownerIndex].Cash += rent
		payer := room.Players[playerIndex]
		owner := room.Players[ownerIndex]
		drafts = append(drafts, eventDraft{
			Type:           "rent-charged",
			Summary:        fmt.Sprintf("%s 向 %s 支付了 %d 租金。", payer.Name, owner.Name, rent),
			PlayerID:       payer.ID,
			OwnerPlayerID:  owner.ID,
			TileID:         tile.ID,
			TileIndex:      tile.Index,
			TileLabel:      tile.Label,
			TilePrice:      tile.Price,
			Amount:         rent,
			CashAfter:      payer.Cash,
			OwnerCashAfter: owner.Cash,
		})
		nextPlayerID := room.advanceTurn()
		drafts = append(drafts, eventDraft{
			Type:         "turn-advanced",
			Summary:      "轮到下一位玩家行动。",
			NextPlayerID: nextPlayerID,
		})
	} else {
		nextPlayerID := room.advanceTurn()
		drafts = append(drafts, eventDraft{
			Type:         "turn-advanced",
			Summary:      "轮到下一位玩家行动。",
			NextPlayerID: nextPlayerID,
		})
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "roll-dice",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) payJailFine(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, "pay-jail-fine", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.TurnState != "awaiting-jail-release" {
		return roomRecord{}, fmt.Errorf("room is not waiting for jail release")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current jailed player can pay the fine")
	}
	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}
	if !room.Players[playerIndex].InJail {
		return roomRecord{}, fmt.Errorf("player is not in jail")
	}
	room.Players[playerIndex].Cash -= jailFine
	room.Players[playerIndex].InJail = false
	room.TurnState = "awaiting-roll"
	room.PendingAction = "等待当前玩家掷骰"

	service.commitRoomMutation(&room, []eventDraft{{
		Type:      "jail-fine-paid",
		Summary:   fmt.Sprintf("%s 支付了 %d 罚金并离开监狱。", room.Players[playerIndex].Name, jailFine),
		PlayerID:  playerID,
		Amount:    jailFine,
		CashAfter: room.Players[playerIndex].Cash,
	}})
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "pay-jail-fine",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) mortgageProperty(roomID string, playerID string, idempotencyKey string, tileID string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if tileID == "" {
		return roomRecord{}, fmt.Errorf("tileId is required")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, "mortgage-property", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.TurnState != "awaiting-deficit-resolution" || room.PendingPayment == nil {
		return roomRecord{}, fmt.Errorf("room is not waiting for deficit resolution")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current deficit player can mortgage property")
	}
	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}
	if !containsPlayer(room.Players[playerIndex].Properties, tileID) {
		return roomRecord{}, fmt.Errorf("player does not own the target property")
	}
	if containsPlayer(room.Players[playerIndex].MortgagedProperties, tileID) {
		return roomRecord{}, fmt.Errorf("property is already mortgaged")
	}
	tile, ok := tileForID(tileID)
	if !ok || tile.Price <= 0 {
		return roomRecord{}, fmt.Errorf("property cannot be mortgaged")
	}
	mortgageValue := tile.Price / 2
	room.Players[playerIndex].MortgagedProperties = append(room.Players[playerIndex].MortgagedProperties, tileID)
	room.Players[playerIndex].Cash += mortgageValue
	drafts := []eventDraft{{
		Type:      "property-mortgaged",
		Summary:   fmt.Sprintf("%s 抵押了 %s。", room.Players[playerIndex].Name, tile.Label),
		PlayerID:  playerID,
		TileID:    tile.ID,
		TileIndex: tile.Index,
		TileLabel: tile.Label,
		TilePrice: tile.Price,
		Amount:    mortgageValue,
		CashAfter: room.Players[playerIndex].Cash,
	}}

	if room.Players[playerIndex].Cash >= room.PendingPayment.Amount {
		room.Players[playerIndex].Cash -= room.PendingPayment.Amount
		drafts = append(drafts, eventDraft{
			Type:      "tax-paid",
			Summary:   fmt.Sprintf("%s 补齐了税费。", room.Players[playerIndex].Name),
			PlayerID:  playerID,
			TileID:    room.PendingPayment.SourceTileID,
			TileLabel: room.PendingPayment.SourceTileLabel,
			Amount:    room.PendingPayment.Amount,
			CashAfter: room.Players[playerIndex].Cash,
		})
		room.PendingPayment = nil
		nextPlayerID := room.advanceTurnFromPlayer(playerID)
		drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
	} else {
		room.PendingAction = fmt.Sprintf("仍需支付 %d 税费，请继续抵押或宣告破产。", room.PendingPayment.Amount-room.Players[playerIndex].Cash)
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "mortgage-property",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) declareBankruptcy(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, "declare-bankruptcy", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.TurnState != "awaiting-deficit-resolution" || room.PendingPayment == nil {
		return roomRecord{}, fmt.Errorf("room is not waiting for deficit resolution")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current deficit player can declare bankruptcy")
	}
	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}

	room.Players[playerIndex].Cash = 0
	room.Players[playerIndex].Properties = []string{}
	room.Players[playerIndex].MortgagedProperties = []string{}
	room.Players[playerIndex].InJail = false
	room.Players[playerIndex].IsBankrupt = true
	room.PendingPayment = nil
	drafts := []eventDraft{{
		Type:      "bankruptcy-declared",
		Summary:   fmt.Sprintf("%s 宣告破产。", room.Players[playerIndex].Name),
		PlayerID:  playerID,
		CashAfter: 0,
	}}

	if room.countActivePlayers() <= 1 {
		room.State = "finished"
		room.TurnState = "post-roll-pending"
		room.PendingAction = "房间已结束"
		room.PendingProperty = nil
		room.PendingAuction = nil
		drafts = append(drafts, eventDraft{Type: "room-finished", Summary: "对局已结束。", RoomState: room.State})
	} else {
		nextPlayerID := room.advanceTurnFromPlayer(playerID)
		drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "declare-bankruptcy",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) purchaseProperty(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	return service.resolvePropertyDecision(roomID, playerID, idempotencyKey, true)
}

func (service *Service) declineProperty(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	return service.resolvePropertyDecision(roomID, playerID, idempotencyKey, false)
}

func (service *Service) resolvePropertyDecision(roomID string, playerID string, idempotencyKey string, shouldPurchase bool) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	commandKind := "decline-property"
	if shouldPurchase {
		commandKind = "purchase-property"
	}

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, commandKind, idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.State != "in-game" {
		return roomRecord{}, fmt.Errorf("room is not in-game")
	}
	if room.TurnState != "awaiting-property-decision" || room.PendingProperty == nil {
		return roomRecord{}, fmt.Errorf("room is not waiting for a property decision")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current turn player can resolve the pending property")
	}
	if room.tileIsOwned(room.PendingProperty.TileID) {
		return roomRecord{}, fmt.Errorf("property is already owned")
	}

	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}

	currentPlayer := room.Players[playerIndex]
	pending := *room.PendingProperty
	drafts := []eventDraft{}
	if shouldPurchase {
		if currentPlayer.Cash < pending.Price {
			return roomRecord{}, fmt.Errorf("player cannot afford the pending property")
		}
		room.Players[playerIndex].Cash -= pending.Price
		room.Players[playerIndex].Properties = append(room.Players[playerIndex].Properties, pending.TileID)
		currentPlayer = room.Players[playerIndex]
		drafts = append(drafts, eventDraft{
			Type:      "property-purchased",
			Summary:   fmt.Sprintf("%s 购买了 %s。", currentPlayer.Name, pending.Label),
			PlayerID:  currentPlayer.ID,
			TileID:    pending.TileID,
			TileIndex: pending.TileIndex,
			TileLabel: pending.Label,
			TilePrice: pending.Price,
			CashAfter: currentPlayer.Cash,
		})
		nextPlayerID := room.advanceTurn()
		drafts = append(drafts, eventDraft{
			Type:         "turn-advanced",
			Summary:      "轮到下一位玩家行动。",
			NextPlayerID: nextPlayerID,
		})
	} else {
		room.startAuction(pending, currentPlayer.ID)
		drafts = append(drafts, eventDraft{
			Type:      "property-declined",
			Summary:   fmt.Sprintf("%s 放弃了 %s。", currentPlayer.Name, pending.Label),
			PlayerID:  currentPlayer.ID,
			TileID:    pending.TileID,
			TileIndex: pending.TileIndex,
			TileLabel: pending.Label,
			TilePrice: pending.Price,
		})
		drafts = append(drafts, eventDraft{
			Type:         "auction-started",
			Summary:      fmt.Sprintf("%s 进入拍卖。", pending.Label),
			PlayerID:     currentPlayer.ID,
			NextPlayerID: room.CurrentTurnPlayerID,
			TileID:       pending.TileID,
			TileIndex:    pending.TileIndex,
			TileLabel:    pending.Label,
			TilePrice:    pending.Price,
		})
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     commandKind,
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) submitAuctionBid(roomID string, playerID string, idempotencyKey string, amount int) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if amount <= 0 {
		return roomRecord{}, fmt.Errorf("amount must be positive")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, "submit-auction-bid", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.TurnState != "awaiting-auction" || room.PendingAuction == nil {
		return roomRecord{}, fmt.Errorf("room is not waiting for an auction bid")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current auction player can bid")
	}
	playerIndex := findPlayerIndex(room.Players, playerID)
	if playerIndex == -1 {
		return roomRecord{}, fmt.Errorf("player not found")
	}
	if room.Players[playerIndex].Cash < amount {
		return roomRecord{}, fmt.Errorf("player cannot afford the bid")
	}
	if amount <= room.PendingAuction.HighestBid {
		return roomRecord{}, fmt.Errorf("bid must exceed current highest bid")
	}

	room.PendingAuction.HighestBid = amount
	room.PendingAuction.HighestBidderID = playerID
	drafts := []eventDraft{{
		Type:         "auction-bid-submitted",
		Summary:      fmt.Sprintf("%s 出价 %d。", room.Players[playerIndex].Name, amount),
		PlayerID:     playerID,
		NextPlayerID: room.nextAuctionPlayerID(playerID),
		TileID:       room.PendingAuction.TileID,
		TileIndex:    room.PendingAuction.TileIndex,
		TileLabel:    room.PendingAuction.Label,
		TilePrice:    room.PendingAuction.Price,
		Amount:       amount,
	}}

	if room.auctionShouldSettle() {
		room.finalizeAuction(&drafts)
	} else {
		room.CurrentTurnPlayerID = room.nextAuctionPlayerID(playerID)
		room.PendingAction = fmt.Sprintf("拍卖进行中，当前最高出价 %d。", room.PendingAuction.HighestBid)
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "submit-auction-bid",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) passAuction(roomID string, playerID string, idempotencyKey string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerID == "" {
		return roomRecord{}, fmt.Errorf("playerId is required")
	}
	if idempotencyKey == "" {
		return roomRecord{}, fmt.Errorf("idempotencyKey is required")
	}
	if result, ok := service.store.LoadCommandResult(roomID, playerID, "pass-auction", idempotencyKey); ok {
		return service.hydrateRoom(result.Snapshot), nil
	}

	room, ok := service.getRoom(roomID)
	if !ok {
		return roomRecord{}, fmt.Errorf("room not found")
	}
	if room.TurnState != "awaiting-auction" || room.PendingAuction == nil {
		return roomRecord{}, fmt.Errorf("room is not waiting for an auction pass")
	}
	if room.CurrentTurnPlayerID != playerID {
		return roomRecord{}, fmt.Errorf("only current auction player can pass")
	}
	if containsPlayer(room.PendingAuction.PassedPlayerIDs, playerID) {
		return roomRecord{}, fmt.Errorf("player already passed the auction")
	}

	room.PendingAuction.PassedPlayerIDs = append(room.PendingAuction.PassedPlayerIDs, playerID)
	nextPlayerID := room.nextAuctionPlayerID(playerID)
	drafts := []eventDraft{{
		Type:         "auction-pass-submitted",
		Summary:      fmt.Sprintf("%s 放弃继续出价。", room.playerName(playerID)),
		PlayerID:     playerID,
		NextPlayerID: nextPlayerID,
		TileID:       room.PendingAuction.TileID,
		TileIndex:    room.PendingAuction.TileIndex,
		TileLabel:    room.PendingAuction.Label,
		TilePrice:    room.PendingAuction.Price,
	}}

	if room.auctionShouldSettle() || nextPlayerID == "" {
		room.finalizeAuction(&drafts)
	} else {
		room.CurrentTurnPlayerID = nextPlayerID
		room.PendingAction = fmt.Sprintf("拍卖进行中，当前最高出价 %d。", room.PendingAuction.HighestBid)
	}

	service.commitRoomMutation(&room, drafts)
	service.store.SaveCommandResult(pocketbase.PersistedCommandResult{
		RoomID:          room.RoomID,
		PlayerID:        playerID,
		CommandKind:     "pass-auction",
		IdempotencyKey:  idempotencyKey,
		Snapshot:        room.toPersistedSnapshot(),
		RecentRoomEvent: toPersistedEvents(room.RoomID, room.RecentEvents),
	})

	return room, nil
}

func (service *Service) commitRoomMutation(room *roomRecord, drafts []eventDraft) {
	room.SnapshotVersion++
	persistedEvents := make([]pocketbase.PersistedRoomEvent, 0, len(drafts))
	for _, draft := range drafts {
		room.EventSequence++
		event := Event{
			ID:              fmt.Sprintf("evt-%s-%03d", room.RoomID, room.EventSequence),
			Type:            draft.Type,
			Sequence:        room.EventSequence,
			SnapshotVersion: room.SnapshotVersion,
			Summary:         draft.Summary,
			RoomState:       draft.RoomState,
			PlayerID:        draft.PlayerID,
			OwnerPlayerID:   draft.OwnerPlayerID,
			NextPlayerID:    draft.NextPlayerID,
			TileID:          draft.TileID,
			TileIndex:       draft.TileIndex,
			TileLabel:       draft.TileLabel,
			TilePrice:       draft.TilePrice,
			Amount:          draft.Amount,
			PlayerPosition:  draft.PlayerPosition,
			CashAfter:       draft.CashAfter,
			OwnerCashAfter:  draft.OwnerCashAfter,
			LastRoll:        draft.LastRoll,
		}
		room.RecentEvents = append(room.RecentEvents, event)
		persistedEvents = append(persistedEvents, pocketbase.PersistedRoomEvent{
			ID:              event.ID,
			RoomID:          room.RoomID,
			Type:            event.Type,
			Sequence:        event.Sequence,
			SnapshotVersion: event.SnapshotVersion,
			Summary:         event.Summary,
			RoomState:       event.RoomState,
			PlayerID:        event.PlayerID,
			OwnerPlayerID:   event.OwnerPlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			Amount:          event.Amount,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
			OwnerCashAfter:  event.OwnerCashAfter,
			LastRoll:        event.LastRoll,
		})
	}
	room.RecentEvents = tailEvents(room.RecentEvents, 10)
	service.store.SaveRoomState(room.toPersistedSnapshot())
	if len(persistedEvents) > 0 {
		service.store.AppendRoomEvents(room.RoomID, persistedEvents)
	}
	service.broadcastRoomEvents(persistedEvents)
}

func (service *Service) hydrateRoom(snapshot pocketbase.PersistedRoomSnapshot) roomRecord {
	var players []Player
	var pendingProperty *PendingProperty
	var pendingAuction *PendingAuction
	var pendingPayment *PendingPayment
	_ = json.Unmarshal(snapshot.PlayersJSON, &players)
	if len(snapshot.PendingPropertyJSON) > 0 && string(snapshot.PendingPropertyJSON) != "null" {
		var decoded PendingProperty
		if err := json.Unmarshal(snapshot.PendingPropertyJSON, &decoded); err == nil {
			pendingProperty = &decoded
		}
	}
	if len(snapshot.PendingAuctionJSON) > 0 && string(snapshot.PendingAuctionJSON) != "null" {
		var decoded PendingAuction
		if err := json.Unmarshal(snapshot.PendingAuctionJSON, &decoded); err == nil {
			pendingAuction = &decoded
		}
	}
	if len(snapshot.PendingPaymentJSON) > 0 && string(snapshot.PendingPaymentJSON) != "null" {
		var decoded PendingPayment
		if err := json.Unmarshal(snapshot.PendingPaymentJSON, &decoded); err == nil {
			pendingPayment = &decoded
		}
	}

	events := toRoomEvents(service.store.ListRoomEvents(snapshot.RoomID))
	return roomRecord{
		RoomID:              snapshot.RoomID,
		State:               snapshot.RoomState,
		HostID:              snapshot.HostID,
		SnapshotVersion:     snapshot.SnapshotVersion,
		EventSequence:       snapshot.EventSequence,
		TurnState:           snapshot.TurnState,
		CurrentTurnPlayerID: snapshot.CurrentTurnPlayerID,
		PendingAction:       snapshot.PendingActionLabel,
		PendingProperty:     pendingProperty,
		PendingAuction:      pendingAuction,
		PendingPayment:      pendingPayment,
		LastRoll:            snapshot.LastRoll,
		Players:             players,
		RecentEvents:        tailEvents(events, 10),
	}
}

func (service *Service) newPlayer(name string) Player {
	playerID := fmt.Sprintf("p%d", service.nextPlayerID)
	service.nextPlayerID++

	return Player{
		ID:         playerID,
		Name:       name,
		Cash:       1500,
		Position:   0,
		Properties: []string{},
		MortgagedProperties: []string{},
	}
}

func (service *Service) seedDemoRoom() {
	if _, ok := service.store.LoadRoomState("demo-room"); ok {
		return
	}

	host := service.newPlayer("房主")
	host.Ready = true
	second := service.newPlayer("玩家二")
	third := service.newPlayer("玩家三")
	room := roomRecord{
		RoomID:              "demo-room",
		State:               "lobby",
		HostID:              host.ID,
		SnapshotVersion:     0,
		EventSequence:       0,
		TurnState:           "awaiting-roll",
		CurrentTurnPlayerID: host.ID,
		PendingAction:       "等待房主开始游戏",
		PendingProperty:     nil,
		PendingAuction:      nil,
		PendingPayment:      nil,
		LastRoll:            [2]int{0, 0},
		Players:             []Player{host, second, third},
	}
	service.commitRoomMutation(&room, []eventDraft{{Type: "room-created", Summary: "演示房间已就绪。"}})
	service.commitRoomMutation(&room, []eventDraft{{Type: "player-joined", Summary: "玩家二加入了演示房间。"}})
	service.commitRoomMutation(&room, []eventDraft{{Type: "player-joined", Summary: "玩家三加入了演示房间。"}})
	service.syncCounters()
}

func (service *Service) syncCounters() {
	for roomID, snapshot := range service.store.RoomsUnsafe() {
		if strings.HasPrefix(roomID, "room-") {
			var roomNumber int
			_, _ = fmt.Sscanf(roomID, "room-%03d", &roomNumber)
			if roomNumber >= service.nextRoomID {
				service.nextRoomID = roomNumber + 1
			}
		}

		var players []Player
		_ = json.Unmarshal(snapshot.PlayersJSON, &players)
		for _, player := range players {
			if strings.HasPrefix(player.ID, "p") {
				var playerNumber int
				_, _ = fmt.Sscanf(player.ID, "p%d", &playerNumber)
				if playerNumber >= service.nextPlayerID {
					service.nextPlayerID = playerNumber + 1
				}
			}
		}
	}
}

func (service *Service) handlePreflight(writer http.ResponseWriter, request *http.Request, methods ...string) bool {
	writer.Header().Set("Access-Control-Allow-Origin", "*")
	writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	writer.Header().Set("Access-Control-Allow-Methods", strings.Join(append(methods, http.MethodOptions), ", "))
	if request.Method == http.MethodOptions {
		writer.WriteHeader(http.StatusNoContent)
		return true
	}

	return false
}

func (room *roomRecord) advanceTurn() string {
	return room.advanceTurnFromPlayer(room.CurrentTurnPlayerID)
}

func (room *roomRecord) advanceTurnFromPlayer(playerID string) string {
	currentIndex := findPlayerIndex(room.Players, playerID)
	nextIndex := 0
	if currentIndex >= 0 {
		nextIndex = (currentIndex + 1) % len(room.Players)
	}
	for room.Players[nextIndex].IsBankrupt {
		nextIndex = (nextIndex + 1) % len(room.Players)
	}
	room.CurrentTurnPlayerID = room.Players[nextIndex].ID
	if room.Players[nextIndex].InJail {
		room.TurnState = "awaiting-jail-release"
		room.PendingAction = fmt.Sprintf("%s 在监狱中，需支付 %d 罚金后再掷骰。", room.Players[nextIndex].Name, jailFine)
	} else {
		room.TurnState = "awaiting-roll"
		room.PendingAction = "等待当前玩家掷骰"
	}
	room.PendingProperty = nil
	room.PendingAuction = nil
	room.PendingPayment = nil
	return room.CurrentTurnPlayerID
}

func (room *roomRecord) resolveSpecialTile(playerIndex int, tile tileDetails) (bool, []eventDraft) {
	player := room.Players[playerIndex]
	if tile.Label == "去监狱" {
		room.Players[playerIndex].Position = jailTileIndex
		room.Players[playerIndex].InJail = true
		drafts := []eventDraft{{
			Type:           "player-jailed",
			Summary:        fmt.Sprintf("%s 被送入监狱。", player.Name),
			PlayerID:       player.ID,
			TileID:         fmt.Sprintf("tile-%d", jailTileIndex),
			TileIndex:      jailTileIndex,
			TileLabel:      boardLabels[jailTileIndex],
			PlayerPosition: jailTileIndex,
		}}
		nextPlayerID := room.advanceTurnFromPlayer(player.ID)
		drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
		return true, drafts
	}
	if strings.Contains(tile.Label, "税") {
		if room.Players[playerIndex].Cash >= taxPaymentAmount {
			room.Players[playerIndex].Cash -= taxPaymentAmount
			drafts := []eventDraft{{
				Type:      "tax-paid",
				Summary:   fmt.Sprintf("%s 支付了 %d 税费。", player.Name, taxPaymentAmount),
				PlayerID:  player.ID,
				TileID:    tile.ID,
				TileIndex: tile.Index,
				TileLabel: tile.Label,
				Amount:    taxPaymentAmount,
				CashAfter: room.Players[playerIndex].Cash,
			}}
			nextPlayerID := room.advanceTurnFromPlayer(player.ID)
			drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
			return true, drafts
		}
		room.TurnState = "awaiting-deficit-resolution"
		room.PendingPayment = &PendingPayment{Amount: taxPaymentAmount, Reason: "tax", CreditorKind: "bank", SourceTileID: tile.ID, SourceTileLabel: tile.Label}
		room.PendingAction = fmt.Sprintf("%s 现金不足以支付 %d 税费，请抵押地产或宣告破产。", player.Name, taxPaymentAmount)
		return true, []eventDraft{{
			Type:      "deficit-started",
			Summary:   fmt.Sprintf("%s 需补缴 %d 税费。", player.Name, taxPaymentAmount),
			PlayerID:  player.ID,
			TileID:    tile.ID,
			TileIndex: tile.Index,
			TileLabel: tile.Label,
			Amount:    taxPaymentAmount,
			CashAfter: room.Players[playerIndex].Cash,
		}}
	}
	if strings.Contains(tile.Label, "命运") {
		room.Players[playerIndex].Cash += 100
		drafts := []eventDraft{{
			Type:      "card-resolved",
			Summary:   fmt.Sprintf("%s 抽到命运卡，获得 100。", player.Name),
			PlayerID:  player.ID,
			TileID:    tile.ID,
			TileIndex: tile.Index,
			TileLabel: tile.Label,
			Amount:    100,
			CashAfter: room.Players[playerIndex].Cash,
		}}
		nextPlayerID := room.advanceTurnFromPlayer(player.ID)
		drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
		return true, drafts
	}
	if strings.Contains(tile.Label, "机会") {
		room.Players[playerIndex].Cash -= 50
		drafts := []eventDraft{{
			Type:      "card-resolved",
			Summary:   fmt.Sprintf("%s 抽到机会卡，支付 50。", player.Name),
			PlayerID:  player.ID,
			TileID:    tile.ID,
			TileIndex: tile.Index,
			TileLabel: tile.Label,
			Amount:    -50,
			CashAfter: room.Players[playerIndex].Cash,
		}}
		nextPlayerID := room.advanceTurnFromPlayer(player.ID)
		drafts = append(drafts, eventDraft{Type: "turn-advanced", Summary: "轮到下一位玩家行动。", NextPlayerID: nextPlayerID})
		return true, drafts
	}
	return false, nil
}

func (room roomRecord) tileIsOwned(tileID string) bool {
	for _, player := range room.Players {
		for _, property := range player.Properties {
			if property == tileID {
				return true
			}
		}
	}
	return false
}

func (room roomRecord) toPersistedSnapshot() pocketbase.PersistedRoomSnapshot {
	playersJSON, _ := json.Marshal(room.Players)
	pendingPropertyJSON, _ := json.Marshal(room.PendingProperty)
	pendingAuctionJSON, _ := json.Marshal(room.PendingAuction)
	pendingPaymentJSON, _ := json.Marshal(room.PendingPayment)
	return pocketbase.PersistedRoomSnapshot{
		RoomID:              room.RoomID,
		RoomState:           room.State,
		HostID:              room.HostID,
		SnapshotVersion:     room.SnapshotVersion,
		EventSequence:       room.EventSequence,
		TurnState:           room.TurnState,
		CurrentTurnPlayerID: room.CurrentTurnPlayerID,
		PendingActionLabel:  room.PendingAction,
		PendingPropertyJSON: pendingPropertyJSON,
		PendingAuctionJSON:  pendingAuctionJSON,
		PendingPaymentJSON:  pendingPaymentJSON,
		LastRoll:            room.LastRoll,
		PlayersJSON:         playersJSON,
	}
}

func (room roomRecord) toResponse() RoomResponse {
	return RoomResponse{
		RoomID:              room.RoomID,
		State:               room.State,
		HostID:              room.HostID,
		SnapshotVersion:     room.SnapshotVersion,
		EventSequence:       room.EventSequence,
		TurnState:           room.TurnState,
		CurrentTurnPlayerID: room.CurrentTurnPlayerID,
		PendingAction:       room.PendingAction,
		PendingProperty:     room.PendingProperty,
		PendingAuction:      room.PendingAuction,
		PendingPayment:      room.PendingPayment,
		LastRoll:            room.LastRoll,
		RecentEvents:        room.RecentEvents,
		Players:             room.Players,
	}
}

func tileForIndex(index int) tileDetails {
	label := boardLabels[index]
	price := 0
	rent := 0
	purchasable := false
	if index > 0 && index%5 != 0 && !isSpecialTileLabel(label) {
		price = 100 + index*10
		rent = 10 + index*2
		purchasable = true
	}

	return tileDetails{
		ID:          fmt.Sprintf("tile-%d", index),
		Index:       index,
		Label:       label,
		Price:       price,
		Rent:        rent,
		Purchasable: purchasable,
	}
}

func isSpecialTileLabel(label string) bool {
	return label == "起点" ||
		label == "监狱" ||
		label == "免费停车" ||
		label == "去监狱" ||
		strings.Contains(label, "机会") ||
		strings.Contains(label, "命运") ||
		strings.Contains(label, "税")
}

func toPersistedEvents(roomID string, events []Event) []pocketbase.PersistedRoomEvent {
	persisted := make([]pocketbase.PersistedRoomEvent, 0, len(events))
	for _, event := range events {
		persisted = append(persisted, pocketbase.PersistedRoomEvent{
			ID:              event.ID,
			RoomID:          roomID,
			Type:            event.Type,
			Sequence:        event.Sequence,
			SnapshotVersion: event.SnapshotVersion,
			Summary:         event.Summary,
			RoomState:       event.RoomState,
			PlayerID:        event.PlayerID,
			OwnerPlayerID:   event.OwnerPlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			Amount:          event.Amount,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
			OwnerCashAfter:  event.OwnerCashAfter,
			LastRoll:        event.LastRoll,
		})
	}
	return persisted
}

func toRoomEvents(events []pocketbase.PersistedRoomEvent) []Event {
	roomEvents := make([]Event, 0, len(events))
	for _, event := range events {
		roomEvents = append(roomEvents, Event{
			ID:              event.ID,
			Type:            event.Type,
			Sequence:        event.Sequence,
			SnapshotVersion: event.SnapshotVersion,
			Summary:         event.Summary,
			RoomState:       event.RoomState,
			PlayerID:        event.PlayerID,
			OwnerPlayerID:   event.OwnerPlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			Amount:          event.Amount,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
			OwnerCashAfter:  event.OwnerCashAfter,
			LastRoll:        event.LastRoll,
		})
	}
	return roomEvents
}

func (service *Service) addRoomStreamSubscriber(roomID string) (int, chan roomStreamEnvelope) {
	service.streamMu.Lock()
	defer service.streamMu.Unlock()

	service.nextStreamID++
	streamID := service.nextStreamID
	stream := make(chan roomStreamEnvelope, 32)
	if service.streamSubscribers[roomID] == nil {
		service.streamSubscribers[roomID] = make(map[int]chan roomStreamEnvelope)
	}
	service.streamSubscribers[roomID][streamID] = stream
	return streamID, stream
}

func (service *Service) removeRoomStreamSubscriber(roomID string, streamID int) {
	service.streamMu.Lock()
	defer service.streamMu.Unlock()

	subscribers := service.streamSubscribers[roomID]
	if subscribers == nil {
		return
	}
	stream, ok := subscribers[streamID]
	if !ok {
		return
	}
	delete(subscribers, streamID)
	close(stream)
	if len(subscribers) == 0 {
		delete(service.streamSubscribers, roomID)
	}
}

func (service *Service) broadcastRoomEvents(events []pocketbase.PersistedRoomEvent) {
	if len(events) == 0 {
		return
	}

	service.streamMu.Lock()
	defer service.streamMu.Unlock()

	for _, persistedEvent := range events {
		subscribers := service.streamSubscribers[persistedEvent.RoomID]
		if len(subscribers) == 0 {
			continue
		}
		event := toRoomEvents([]pocketbase.PersistedRoomEvent{persistedEvent})[0]
		envelope := roomStreamEnvelope{Kind: "event", Event: &event}
		for _, subscriber := range subscribers {
			select {
			case subscriber <- envelope:
			default:
			}
		}
	}
}

func tailEvents(events []Event, limit int) []Event {
	if len(events) <= limit {
		return events
	}
	return events[len(events)-limit:]
}

func findPlayerIndex(players []Player, playerID string) int {
	for index, player := range players {
		if player.ID == playerID {
			return index
		}
	}
	return -1
}

func findPropertyOwnerIndex(players []Player, tileID string) int {
	for index, player := range players {
		if player.IsBankrupt || containsPlayer(player.MortgagedProperties, tileID) {
			continue
		}
		for _, property := range player.Properties {
			if property == tileID {
				return index
			}
		}
	}
	return -1
}

func tileForID(tileID string) (tileDetails, bool) {
	var index int
	if _, err := fmt.Sscanf(tileID, "tile-%d", &index); err != nil || index < 0 || index >= boardTileCount {
		return tileDetails{}, false
	}
	return tileForIndex(index), true
}

func containsPlayer(playerIDs []string, playerID string) bool {
	for _, candidate := range playerIDs {
		if candidate == playerID {
			return true
		}
	}
	return false
}

func (room *roomRecord) playerName(playerID string) string {
	index := findPlayerIndex(room.Players, playerID)
	if index == -1 {
		return "未知玩家"
	}
	return room.Players[index].Name
}

func (room *roomRecord) startAuction(pending PendingProperty, initiatorPlayerID string) {
	room.PendingProperty = nil
	room.PendingAuction = &PendingAuction{
		TileID:            pending.TileID,
		TileIndex:         pending.TileIndex,
		Label:             pending.Label,
		Price:             pending.Price,
		InitiatorPlayerID: initiatorPlayerID,
		HighestBid:        0,
		HighestBidderID:   "",
		PassedPlayerIDs:   []string{},
	}
	room.TurnState = "awaiting-auction"
	room.CurrentTurnPlayerID = room.nextPlayerIDAfter(initiatorPlayerID)
	room.PendingAction = fmt.Sprintf("%s 进入拍卖，轮到 %s 出价或放弃。", pending.Label, room.playerName(room.CurrentTurnPlayerID))
}

func (room *roomRecord) nextPlayerIDAfter(playerID string) string {
	currentIndex := findPlayerIndex(room.Players, playerID)
	if currentIndex == -1 {
		for _, player := range room.Players {
			if !player.IsBankrupt {
				return player.ID
			}
		}
		return room.Players[0].ID
	}
	for offset := 1; offset <= len(room.Players); offset++ {
		candidate := room.Players[(currentIndex+offset)%len(room.Players)]
		if !candidate.IsBankrupt {
			return candidate.ID
		}
	}
	return room.Players[currentIndex].ID
}

func (room *roomRecord) activeAuctionPlayerIDs() []string {
	if room.PendingAuction == nil {
		return nil
	}
	active := make([]string, 0, len(room.Players))
	for _, player := range room.Players {
		if !player.IsBankrupt && !containsPlayer(room.PendingAuction.PassedPlayerIDs, player.ID) {
			active = append(active, player.ID)
		}
	}
	return active
}

func (room roomRecord) countActivePlayers() int {
	count := 0
	for _, player := range room.Players {
		if !player.IsBankrupt {
			count++
		}
	}
	return count
}

func (room *roomRecord) nextAuctionPlayerID(afterPlayerID string) string {
	active := room.activeAuctionPlayerIDs()
	if len(active) == 0 {
		return ""
	}
	for offset := 1; offset <= len(room.Players); offset++ {
		candidate := room.nextPlayerIDAfterN(afterPlayerID, offset)
		if containsPlayer(active, candidate) {
			return candidate
		}
	}
	return ""
}

func (room *roomRecord) nextPlayerIDAfterN(playerID string, distance int) string {
	currentIndex := findPlayerIndex(room.Players, playerID)
	if currentIndex == -1 {
		return room.Players[0].ID
	}
	return room.Players[(currentIndex+distance)%len(room.Players)].ID
}

func (room *roomRecord) auctionShouldSettle() bool {
	if room.PendingAuction == nil {
		return false
	}
	active := room.activeAuctionPlayerIDs()
	if room.PendingAuction.HighestBidderID == "" {
		return len(active) == 0
	}
	return len(active) == 1 && active[0] == room.PendingAuction.HighestBidderID
}

func (room *roomRecord) finalizeAuction(drafts *[]eventDraft) {
	if room.PendingAuction == nil {
		return
	}
	auction := *room.PendingAuction
	if auction.HighestBidderID != "" {
		winnerIndex := findPlayerIndex(room.Players, auction.HighestBidderID)
		if winnerIndex != -1 {
			room.Players[winnerIndex].Cash -= auction.HighestBid
			room.Players[winnerIndex].Properties = append(room.Players[winnerIndex].Properties, auction.TileID)
			*drafts = append(*drafts, eventDraft{
				Type:      "auction-settled",
				Summary:   fmt.Sprintf("%s 以 %d 拍得 %s。", room.Players[winnerIndex].Name, auction.HighestBid, auction.Label),
				PlayerID:  auction.HighestBidderID,
				TileID:    auction.TileID,
				TileIndex: auction.TileIndex,
				TileLabel: auction.Label,
				TilePrice: auction.Price,
				Amount:    auction.HighestBid,
				CashAfter: room.Players[winnerIndex].Cash,
			})
		}
	} else {
		*drafts = append(*drafts, eventDraft{
			Type:      "auction-ended-unsold",
			Summary:   fmt.Sprintf("%s 本轮无人竞拍。", auction.Label),
			PlayerID:  auction.InitiatorPlayerID,
			TileID:    auction.TileID,
			TileIndex: auction.TileIndex,
			TileLabel: auction.Label,
			TilePrice: auction.Price,
		})
	}
	nextPlayerID := room.advanceTurnFromPlayer(auction.InitiatorPlayerID)
	*drafts = append(*drafts, eventDraft{
		Type:         "turn-advanced",
		Summary:      "轮到下一位玩家行动。",
		NextPlayerID: nextPlayerID,
	})
}

func writeJSON(writer http.ResponseWriter, statusCode int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(statusCode)
	_ = json.NewEncoder(writer).Encode(payload)
}

func writeError(writer http.ResponseWriter, statusCode int, message string) {
	writeJSON(writer, statusCode, map[string]string{"error": message})
}

func writeSSE(writer http.ResponseWriter, eventName string, payload roomStreamEnvelope) error {
	raw, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if _, err := writer.Write([]byte("event: " + eventName + "\n")); err != nil {
		return err
	}
	if _, err := writer.Write([]byte("data: " + string(raw) + "\n\n")); err != nil {
		return err
	}
	return nil
}
