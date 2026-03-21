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
	Ready      bool     `json:"ready,omitempty"`
}

type PendingProperty struct {
	TileID    string `json:"tileId"`
	TileIndex int    `json:"tileIndex"`
	Label     string `json:"label"`
	Price     int    `json:"price"`
}

type Event struct {
	ID              string `json:"id"`
	Type            string `json:"type"`
	Sequence        int    `json:"sequence"`
	SnapshotVersion int    `json:"snapshotVersion"`
	Summary         string `json:"summary"`
	PlayerID        string `json:"playerId,omitempty"`
	NextPlayerID    string `json:"nextPlayerId,omitempty"`
	TileID          string `json:"tileId,omitempty"`
	TileIndex       int    `json:"tileIndex,omitempty"`
	TileLabel       string `json:"tileLabel,omitempty"`
	TilePrice       int    `json:"tilePrice,omitempty"`
	PlayerPosition  int    `json:"playerPosition,omitempty"`
	CashAfter       int    `json:"cashAfter,omitempty"`
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

type tileDetails struct {
	ID          string
	Index       int
	Label       string
	Price       int
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
	LastRoll            [2]int
	Players             []Player
	RecentEvents        []Event
}

type eventDraft struct {
	Type           string
	Summary        string
	PlayerID       string
	NextPlayerID   string
	TileID         string
	TileIndex      int
	TileLabel      string
	TilePrice      int
	PlayerPosition int
	CashAfter      int
	LastRoll       [2]int
}

type Service struct {
	mu           sync.Mutex
	store        *pocketbase.Client
	diceRoller   DiceRoller
	nextRoomID   int
	nextPlayerID int
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
	} else {
		drafts = append(drafts, eventDraft{
			Type:      "property-declined",
			Summary:   fmt.Sprintf("%s 放弃了 %s。", currentPlayer.Name, pending.Label),
			PlayerID:  currentPlayer.ID,
			TileID:    pending.TileID,
			TileIndex: pending.TileIndex,
			TileLabel: pending.Label,
			TilePrice: pending.Price,
		})
	}

	nextPlayerID := room.advanceTurn()
	drafts = append(drafts, eventDraft{
		Type:         "turn-advanced",
		Summary:      "轮到下一位玩家行动。",
		NextPlayerID: nextPlayerID,
	})

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
			PlayerID:        draft.PlayerID,
			NextPlayerID:    draft.NextPlayerID,
			TileID:          draft.TileID,
			TileIndex:       draft.TileIndex,
			TileLabel:       draft.TileLabel,
			TilePrice:       draft.TilePrice,
			PlayerPosition:  draft.PlayerPosition,
			CashAfter:       draft.CashAfter,
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
			PlayerID:        event.PlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
			LastRoll:        event.LastRoll,
		})
	}
	room.RecentEvents = tailEvents(room.RecentEvents, 10)
	service.store.SaveRoomState(room.toPersistedSnapshot())
	if len(persistedEvents) > 0 {
		service.store.AppendRoomEvents(room.RoomID, persistedEvents)
	}
}

func (service *Service) hydrateRoom(snapshot pocketbase.PersistedRoomSnapshot) roomRecord {
	var players []Player
	var pendingProperty *PendingProperty
	_ = json.Unmarshal(snapshot.PlayersJSON, &players)
	if len(snapshot.PendingPropertyJSON) > 0 && string(snapshot.PendingPropertyJSON) != "null" {
		var decoded PendingProperty
		if err := json.Unmarshal(snapshot.PendingPropertyJSON, &decoded); err == nil {
			pendingProperty = &decoded
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
	currentIndex := findPlayerIndex(room.Players, room.CurrentTurnPlayerID)
	nextIndex := 0
	if currentIndex >= 0 {
		nextIndex = (currentIndex + 1) % len(room.Players)
	}
	room.CurrentTurnPlayerID = room.Players[nextIndex].ID
	room.TurnState = "awaiting-roll"
	room.PendingAction = "等待当前玩家掷骰"
	room.PendingProperty = nil
	return room.CurrentTurnPlayerID
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
		LastRoll:            room.LastRoll,
		RecentEvents:        room.RecentEvents,
		Players:             room.Players,
	}
}

func tileForIndex(index int) tileDetails {
	label := boardLabels[index]
	price := 0
	purchasable := false
	if index > 0 && index%5 != 0 && !isSpecialTileLabel(label) {
		price = 100 + index*10
		purchasable = true
	}

	return tileDetails{
		ID:          fmt.Sprintf("tile-%d", index),
		Index:       index,
		Label:       label,
		Price:       price,
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
			PlayerID:        event.PlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
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
			PlayerID:        event.PlayerID,
			NextPlayerID:    event.NextPlayerID,
			TileID:          event.TileID,
			TileIndex:       event.TileIndex,
			TileLabel:       event.TileLabel,
			TilePrice:       event.TilePrice,
			PlayerPosition:  event.PlayerPosition,
			CashAfter:       event.CashAfter,
			LastRoll:        event.LastRoll,
		})
	}
	return roomEvents
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

func writeJSON(writer http.ResponseWriter, statusCode int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(statusCode)
	_ = json.NewEncoder(writer).Encode(payload)
}

func writeError(writer http.ResponseWriter, statusCode int, message string) {
	writeJSON(writer, statusCode, map[string]string{"error": message})
}