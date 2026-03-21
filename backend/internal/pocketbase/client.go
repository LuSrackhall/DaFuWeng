package pocketbase

import "sync"

type ClientConfig struct {
	BaseURL string
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
	LastRoll            [2]int
	PlayersJSON         []byte
}

type PersistedRoomEvent struct {
	ID       string
	RoomID   string
	Type     string
	Sequence int
	Summary  string
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
	mu             sync.RWMutex
	rooms          map[string]PersistedRoomSnapshot
	roomEvents     map[string][]PersistedRoomEvent
	idempotentRuns map[string]PersistedCommandResult
}

func NewClient(config ClientConfig) *Client {
	return &Client{
		BaseURL:        config.BaseURL,
		rooms:          make(map[string]PersistedRoomSnapshot),
		roomEvents:     make(map[string][]PersistedRoomEvent),
		idempotentRuns: make(map[string]PersistedCommandResult),
	}
}

func (client *Client) SaveRoomState(snapshot PersistedRoomSnapshot) {
	client.mu.Lock()
	defer client.mu.Unlock()

	client.rooms[snapshot.RoomID] = snapshot
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
}

func (client *Client) ListRoomEvents(roomID string) []PersistedRoomEvent {
	client.mu.RLock()
	defer client.mu.RUnlock()

	events := client.roomEvents[roomID]
	copyOfEvents := make([]PersistedRoomEvent, len(events))
	copy(copyOfEvents, events)
	return copyOfEvents
}

func (client *Client) SaveCommandResult(result PersistedCommandResult) {
	client.mu.Lock()
	defer client.mu.Unlock()

	client.idempotentRuns[buildIdempotentKey(result.RoomID, result.PlayerID, result.CommandKind, result.IdempotencyKey)] = result
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
