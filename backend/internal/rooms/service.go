package rooms

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
)

type Player struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Cash       int      `json:"cash"`
	Position   int      `json:"position"`
	Properties []string `json:"properties"`
	Ready      bool     `json:"ready,omitempty"`
}

type Event struct {
	ID      string `json:"id"`
	Summary string `json:"summary"`
}

type RoomResponse struct {
	RoomID              string   `json:"roomId"`
	State               string   `json:"roomState"`
	HostID              string   `json:"hostId"`
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

type roomRecord struct {
	RoomID              string
	State               string
	HostID              string
	CurrentTurnPlayerID string
	PendingAction       string
	LastRoll            [2]int
	RecentEvents        []Event
	Players             []Player
}

type Service struct {
	mu           sync.RWMutex
	rooms        map[string]roomRecord
	nextRoomID   int
	nextPlayerID int
}

func NewService() *Service {
	service := &Service{
		rooms:        make(map[string]roomRecord),
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
		CurrentTurnPlayerID: hostPlayer.ID,
		PendingAction:       "等待更多玩家加入",
		LastRoll:            [2]int{0, 0},
		RecentEvents: []Event{{
			ID:      "evt-create",
			Summary: fmt.Sprintf("%s 创建了房间。", hostPlayer.Name),
		}},
		Players: []Player{hostPlayer},
	}

	service.rooms[roomID] = room
	return room
}

func (service *Service) getRoom(roomID string) (roomRecord, bool) {
	service.mu.RLock()
	defer service.mu.RUnlock()

	room, ok := service.rooms[roomID]
	return room, ok
}

func (service *Service) joinRoom(roomID string, playerName string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	if playerName == "" {
		return roomRecord{}, fmt.Errorf("playerName is required")
	}

	room, ok := service.rooms[roomID]
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
	room.RecentEvents = append(room.RecentEvents, Event{
		ID:      fmt.Sprintf("evt-join-%s", player.ID),
		Summary: fmt.Sprintf("%s 加入了房间。", player.Name),
	})

	service.rooms[roomID] = room
	return room, nil
}

func (service *Service) startRoom(roomID string, hostID string) (roomRecord, error) {
	service.mu.Lock()
	defer service.mu.Unlock()

	room, ok := service.rooms[roomID]
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
	room.PendingAction = "当前玩家掷骰"
	room.CurrentTurnPlayerID = room.Players[0].ID
	room.LastRoll = [2]int{4, 2}
	room.RecentEvents = append(room.RecentEvents,
		Event{ID: "evt-start", Summary: "房主开始了对局。"},
		Event{ID: "evt-roll", Summary: fmt.Sprintf("%s 掷出 4 + 2。", room.Players[0].Name)},
	)

	service.rooms[roomID] = room
	return room, nil
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
	host := service.newPlayer("房主")
	host.Ready = true
	second := service.newPlayer("玩家二")
	third := service.newPlayer("玩家三")
	service.rooms["demo-room"] = roomRecord{
		RoomID:              "demo-room",
		State:               "lobby",
		HostID:              host.ID,
		CurrentTurnPlayerID: host.ID,
		PendingAction:       "等待房主开始游戏",
		LastRoll:            [2]int{0, 0},
		RecentEvents:        []Event{{ID: "evt-demo", Summary: "演示房间已就绪。"}},
		Players:             []Player{host, second, third},
	}
	service.nextRoomID = 2
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

func (room roomRecord) toResponse() RoomResponse {
	return RoomResponse{
		RoomID:              room.RoomID,
		State:               room.State,
		HostID:              room.HostID,
		CurrentTurnPlayerID: room.CurrentTurnPlayerID,
		PendingAction:       room.PendingAction,
		LastRoll:            room.LastRoll,
		RecentEvents:        room.RecentEvents,
		Players:             room.Players,
	}
}

func writeJSON(writer http.ResponseWriter, statusCode int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(statusCode)
	_ = json.NewEncoder(writer).Encode(payload)
}

func writeError(writer http.ResponseWriter, statusCode int, message string) {
	writeJSON(writer, statusCode, map[string]string{"error": message})
}