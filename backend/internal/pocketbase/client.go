package pocketbase

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type ClientConfig struct {
	BaseURL string
	DataPath string
}

type PersistedRoomSnapshot struct {
	RoomID              string
	RoomState           string
	HostID              string
	SnapshotVersion     int
	EventSequence       int
	TurnState           string
	CurrentTurnPlayerID string
	PendingActionLabel  string
	PendingPropertyJSON []byte
	PendingAuctionJSON  []byte
	PendingPaymentJSON  []byte
	LastRoll            [2]int
	PlayersJSON         []byte
}

type PersistedRoomEvent struct {
	ID       string
	RoomID   string
	Type     string
	Sequence int
	SnapshotVersion int
	Summary  string
	RoomState string
	PlayerID string
	OwnerPlayerID string
	NextPlayerID string
	TileID   string
	TileIndex int
	TileLabel string
	TilePrice int
	Amount int
	PlayerPosition int
	CashAfter int
	OwnerCashAfter int
	LastRoll [2]int
}

type PersistedCommandResult struct {
	RoomID          string
	PlayerID        string
	CommandKind     string
	IdempotencyKey  string
	Snapshot        PersistedRoomSnapshot
	RecentRoomEvent []PersistedRoomEvent
}

type Client struct {
	BaseURL        string
	DataPath       string
	mu             sync.RWMutex
	rooms          map[string]PersistedRoomSnapshot
	roomEvents     map[string][]PersistedRoomEvent
	idempotentRuns map[string]PersistedCommandResult
}

type diskState struct {
	Rooms          map[string]PersistedRoomSnapshot   `json:"rooms"`
	RoomEvents     map[string][]PersistedRoomEvent    `json:"roomEvents"`
	IdempotentRuns map[string]PersistedCommandResult  `json:"idempotentRuns"`
}

func NewClient(config ClientConfig) *Client {
	client := &Client{
		BaseURL:        config.BaseURL,
		DataPath:       config.DataPath,
		rooms:          make(map[string]PersistedRoomSnapshot),
		roomEvents:     make(map[string][]PersistedRoomEvent),
		idempotentRuns: make(map[string]PersistedCommandResult),
	}
	client.loadFromDisk()
	return client
}

func (client *Client) SaveRoomState(snapshot PersistedRoomSnapshot) {
	client.mu.Lock()
	defer client.mu.Unlock()

	client.rooms[snapshot.RoomID] = snapshot
	client.persistLocked()
}

func (client *Client) LoadRoomState(roomID string) (PersistedRoomSnapshot, bool) {
	client.mu.RLock()
	defer client.mu.RUnlock()

	snapshot, ok := client.rooms[roomID]
	return snapshot, ok
}

func (client *Client) AppendRoomEvents(roomID string, events []PersistedRoomEvent) {
	client.mu.Lock()
	defer client.mu.Unlock()

	client.roomEvents[roomID] = append(client.roomEvents[roomID], events...)
	client.persistLocked()
}

func (client *Client) ListRoomEvents(roomID string) []PersistedRoomEvent {
	client.mu.RLock()
	defer client.mu.RUnlock()

	events := client.roomEvents[roomID]
	copyOfEvents := make([]PersistedRoomEvent, len(events))
	copy(copyOfEvents, events)
	return copyOfEvents
}

func (client *Client) ListRoomEventsAfter(roomID string, afterSequence int) []PersistedRoomEvent {
	events := client.ListRoomEvents(roomID)
	filtered := make([]PersistedRoomEvent, 0, len(events))
	for _, event := range events {
		if event.Sequence > afterSequence {
			filtered = append(filtered, event)
		}
	}
	return filtered
}

func (client *Client) RoomsUnsafe() map[string]PersistedRoomSnapshot {
	client.mu.RLock()
	defer client.mu.RUnlock()

	copyOfRooms := make(map[string]PersistedRoomSnapshot, len(client.rooms))
	for roomID, snapshot := range client.rooms {
		copyOfRooms[roomID] = snapshot
	}
	return copyOfRooms
}

func (client *Client) SaveCommandResult(result PersistedCommandResult) {
	client.mu.Lock()
	defer client.mu.Unlock()

	client.idempotentRuns[buildIdempotentKey(result.RoomID, result.PlayerID, result.CommandKind, result.IdempotencyKey)] = result
	client.persistLocked()
}

func (client *Client) LoadCommandResult(roomID string, playerID string, commandKind string, idempotencyKey string) (PersistedCommandResult, bool) {
	client.mu.RLock()
	defer client.mu.RUnlock()

	result, ok := client.idempotentRuns[buildIdempotentKey(roomID, playerID, commandKind, idempotencyKey)]
	return result, ok
}

func buildIdempotentKey(roomID string, playerID string, commandKind string, idempotencyKey string) string {
	return roomID + "::" + playerID + "::" + commandKind + "::" + idempotencyKey
}

func (client *Client) loadFromDisk() {
	if client.DataPath == "" {
		return
	}

	raw, err := os.ReadFile(client.DataPath)
	if err != nil {
		return
	}

	var state diskState
	if err := json.Unmarshal(raw, &state); err != nil {
		return
	}

	if state.Rooms != nil {
		client.rooms = state.Rooms
	}
	if state.RoomEvents != nil {
		client.roomEvents = state.RoomEvents
	}
	if state.IdempotentRuns != nil {
		client.idempotentRuns = state.IdempotentRuns
	}
}

func (client *Client) persistLocked() {
	if client.DataPath == "" {
		return
	}

	state := diskState{
		Rooms: client.rooms,
		RoomEvents: client.roomEvents,
		IdempotentRuns: client.idempotentRuns,
	}
	raw, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(client.DataPath), 0o755)
	_ = os.WriteFile(client.DataPath, raw, 0o644)
}
