package rooms

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/pocketbase"
)

const boardTileCount = 40

type DiceRoller interface {
	Roll() [2]int
}

type randomDiceRoller struct {
	mu     sync.Mutex
	random *rand.Rand
}

func newRandomDiceRoller() *randomDiceRoller {
	return &randomDiceRoller{random: rand.New(rand.NewSource(time.Now().UnixNano()))}
}

func (roller *randomDiceRoller) Roll() [2]int {
	roller.mu.Lock()
	defer roller.mu.Unlock()

	return [2]int{roller.random.Intn(6) + 1, roller.random.Intn(6) + 1}
}

type Player struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Cash       int      `json:"cash"`
	Position   int      `json:"position"`
	Properties []string `json:"properties"`
	Ready      bool     `json:"ready,omitempty"`
}

type Event struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Sequence int    `json:"sequence"`
	Summary  string `json:"summary"`
}

type RoomResponse struct {
	RoomID              string   `json:"roomId"`
	State               string   `json:"roomState"`
	HostID              string   `json:"hostId"`
	SnapshotVersion     int      `json:"snapshotVersion"`
	EventSequence       int      `json:"eventSequence"`
	TurnState           string   `json:"turnState"`
	CurrentTurnPlayerID string   `json:"currentTurnPlayerId"`
	PendingAction       string   `json:"pendingActionLabel"`
	LastRoll            [2]int   `json:"lastRoll"`
	RecentEvents        []Event  `json:"recentEvents"`
	Players             []Player `json:"players"`
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

type roomRecord struct {
	RoomID              string
	State               string
	HostID              string
	SnapshotVersion     int
	EventSequence       int
	TurnState           string
	CurrentTurnPlayerID string
	PendingAction       string
	LastRoll            [2]int
	Players             []Player
	RecentEvents        []Event
}

type eventDraft struct {
	Type    string
	Summary string
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

	if len(parts) == 2 && request.Method == http.MethodPost {
		switch parts[1] {
		case "join":
			service.handleJoinRoom(writer, request, roomID)
			return
		case "start":
			service.handleStartRoom(writer, request, roomID)
			return
		case "roll":
			service.handleRollDice(writer, request, roomID)
			return
		}
	}

	writeError(writer, http.StatusMethodNotAllowed, "unsupported room route")
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
	room.TurnState = "post-roll-pending"
	room.PendingAction = "等待后续规则切片处理"
	playerName := room.Players[playerIndex].Name
	service.commitRoomMutation(&room, []eventDraft{
		{Type: "dice-rolled", Summary: fmt.Sprintf("%s 掷出 %d + %d。", playerName, dice[0], dice[1])},
		{Type: "player-moved", Summary: fmt.Sprintf("%s 前进到第 %d 格。", playerName, room.Players[playerIndex].Position)},
	})

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

func (service *Service) commitRoomMutation(room *roomRecord, drafts []eventDraft) {
	room.SnapshotVersion++
	persistedEvents := make([]pocketbase.PersistedRoomEvent, 0, len(drafts))
	for _, draft := range drafts {
		room.EventSequence++
		event := Event{
			ID:       fmt.Sprintf("evt-%s-%03d", room.RoomID, room.EventSequence),
			Type:     draft.Type,
			Sequence: room.EventSequence,
			Summary:  draft.Summary,
		}
		room.RecentEvents = append(room.RecentEvents, event)
		persistedEvents = append(persistedEvents, pocketbase.PersistedRoomEvent{
			ID:       event.ID,
			RoomID:   room.RoomID,
			Type:     event.Type,
			Sequence: event.Sequence,
			Summary:  event.Summary,
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
	_ = json.Unmarshal(snapshot.PlayersJSON, &players)

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
		LastRoll:            [2]int{0, 0},
		Players:             []Player{host, second, third},
	}
	service.commitRoomMutation(&room, []eventDraft{{Type: "room-created", Summary: "演示房间已就绪。"}})
	service.commitRoomMutation(&room, []eventDraft{{Type: "player-joined", Summary: "玩家二加入了演示房间。"}})
	service.commitRoomMutation(&room, []eventDraft{{Type: "player-joined", Summary: "玩家三加入了演示房间。"}})
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

func (room roomRecord) toPersistedSnapshot() pocketbase.PersistedRoomSnapshot {
	playersJSON, _ := json.Marshal(room.Players)
	return pocketbase.PersistedRoomSnapshot{
		RoomID:              room.RoomID,
		RoomState:           room.State,
		HostID:              room.HostID,
		SnapshotVersion:     room.SnapshotVersion,
		EventSequence:       room.EventSequence,
		TurnState:           room.TurnState,
		CurrentTurnPlayerID: room.CurrentTurnPlayerID,
		PendingActionLabel:  room.PendingAction,
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
		LastRoll:            room.LastRoll,
		RecentEvents:        room.RecentEvents,
		Players:             room.Players,
	}
}

func toPersistedEvents(roomID string, events []Event) []pocketbase.PersistedRoomEvent {
	persisted := make([]pocketbase.PersistedRoomEvent, 0, len(events))
	for _, event := range events {
		persisted = append(persisted, pocketbase.PersistedRoomEvent{
			ID:       event.ID,
			RoomID:   roomID,
			Type:     event.Type,
			Sequence: event.Sequence,
			Summary:  event.Summary,
		})
	}
	return persisted
}

func toRoomEvents(events []pocketbase.PersistedRoomEvent) []Event {
	roomEvents := make([]Event, 0, len(events))
	for _, event := range events {
		roomEvents = append(roomEvents, Event{
			ID:       event.ID,
			Type:     event.Type,
			Sequence: event.Sequence,
			Summary:  event.Summary,
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