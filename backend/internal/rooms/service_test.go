package rooms

import (
	"path/filepath"
	"testing"

	"github.com/LuSrackhall/DaFuWeng/backend/internal/pocketbase"
)

type unitFixedDiceRoller struct {
	value [2]int
}

func (roller unitFixedDiceRoller) Roll() [2]int {
	return roller.value
}

func newUnitService(t *testing.T) *Service {
	t.Helper()
	dataPath := filepath.Join(t.TempDir(), "rooms-unit-store.json")
	store := pocketbase.NewClient(pocketbase.ClientConfig{
		BaseURL:  "http://127.0.0.1:8090",
		DataPath: dataPath,
	})
	return NewServiceWithDependencies(store, unitFixedDiceRoller{value: [2]int{1, 1}})
}

func testRoomRecord() roomRecord {
	return roomRecord{
		RoomID:              "room-unit",
		State:               "in-game",
		HostID:              "p1",
		SnapshotVersion:     1,
		EventSequence:       1,
		TurnState:           "awaiting-roll",
		CurrentTurnPlayerID: "p2",
		PendingAction:       "等待当前玩家掷骰",
		ChanceDeck:          newDeckState(chanceDeckOrder),
		CommunityDeck:       newDeckState(communityDeckOrder),
		Players: []Player{
			{ID: "p1", Name: "房主甲", Cash: 1500, Position: 0, Properties: []string{"tile-1"}, MortgagedProperties: []string{}, PropertyImprovements: map[string]int{}, HeldCardIDs: []string{}},
			{ID: "p2", Name: "玩家乙", Cash: 5, Position: 1, Properties: []string{}, MortgagedProperties: []string{}, PropertyImprovements: map[string]int{}, HeldCardIDs: []string{}},
		},
		PlayerSessions: map[string]string{},
		RecentEvents:   []Event{},
	}
}

func TestResolveLandingEntersPlayerCreditorRentDeficit(t *testing.T) {
	room := testRoomRecord()

	drafts := room.resolveLanding(1)

	if room.TurnState != "awaiting-deficit-resolution" {
		t.Fatalf("expected deficit turn state, got %s", room.TurnState)
	}
	if room.PendingPayment == nil {
		t.Fatalf("expected pending payment for rent deficit")
	}
	if room.PendingPayment.Reason != "rent" {
		t.Fatalf("expected rent pending payment, got %s", room.PendingPayment.Reason)
	}
	if room.PendingPayment.CreditorKind != "player" {
		t.Fatalf("expected player creditor kind, got %s", room.PendingPayment.CreditorKind)
	}
	if room.PendingPayment.CreditorPlayerID != "p1" {
		t.Fatalf("expected player creditor p1, got %s", room.PendingPayment.CreditorPlayerID)
	}
	if room.CurrentTurnPlayerID != "p2" {
		t.Fatalf("expected current turn to remain on debtor, got %s", room.CurrentTurnPlayerID)
	}
	if len(drafts) != 2 {
		t.Fatalf("expected move and deficit events, got %d drafts", len(drafts))
	}
	if drafts[1].Type != "deficit-started" {
		t.Fatalf("expected deficit-started draft, got %s", drafts[1].Type)
	}
	if drafts[1].OwnerPlayerID != "p1" {
		t.Fatalf("expected owner player id p1, got %s", drafts[1].OwnerPlayerID)
	}
}

func TestSettlePendingPaymentForRentPaysCreditorAndAdvancesTurn(t *testing.T) {
	room := roomRecord{
		RoomID:              "room-unit",
		State:               "in-game",
		TurnState:           "awaiting-deficit-resolution",
		CurrentTurnPlayerID: "p2",
		PendingAction:       "等待当前玩家处理欠款",
		PendingPayment:      &PendingPayment{Amount: 12, Reason: "rent", CreditorKind: "player", CreditorPlayerID: "p1", SourceTileID: "tile-1", SourceTileLabel: "南城路"},
		Players: []Player{
			{ID: "p1", Name: "房主甲", Cash: 1500},
			{ID: "p2", Name: "玩家乙", Cash: 30},
		},
	}

	drafts := room.settlePendingPayment(1)

	if room.PendingPayment != nil {
		t.Fatalf("expected pending payment to clear after settlement")
	}
	if room.Players[1].Cash != 18 {
		t.Fatalf("expected debtor cash 18 after settlement, got %d", room.Players[1].Cash)
	}
	if room.Players[0].Cash != 1512 {
		t.Fatalf("expected creditor cash 1512 after settlement, got %d", room.Players[0].Cash)
	}
	if room.TurnState != "awaiting-roll" {
		t.Fatalf("expected room to advance back to awaiting-roll, got %s", room.TurnState)
	}
	if room.CurrentTurnPlayerID != "p1" {
		t.Fatalf("expected next turn to advance to p1, got %s", room.CurrentTurnPlayerID)
	}
	if len(drafts) != 2 {
		t.Fatalf("expected rent charge and turn advanced drafts, got %d", len(drafts))
	}
	if drafts[0].Type != "rent-charged" {
		t.Fatalf("expected first draft rent-charged, got %s", drafts[0].Type)
	}
	if drafts[1].Type != "turn-advanced" {
		t.Fatalf("expected second draft turn-advanced, got %s", drafts[1].Type)
	}
}

func TestMortgagePropertyKeepsRentDeficitPendingUntilFullyCovered(t *testing.T) {
	service := newUnitService(t)
	room := roomRecord{
		RoomID:              "room-unit",
		State:               "in-game",
		TurnState:           "awaiting-deficit-resolution",
		CurrentTurnPlayerID: "p2",
		PendingAction:       "等待当前玩家处理欠款",
		PendingPayment:      &PendingPayment{Amount: 100, Reason: "rent", CreditorKind: "player", CreditorPlayerID: "p1", SourceTileID: "tile-1", SourceTileLabel: "南城路"},
		Players: []Player{
			{ID: "p1", Name: "房主甲", Cash: 1500, Properties: []string{"tile-1"}, MortgagedProperties: []string{}, PropertyImprovements: map[string]int{}},
			{ID: "p2", Name: "玩家乙", Cash: 20, Properties: []string{"tile-3"}, MortgagedProperties: []string{}, PropertyImprovements: map[string]int{}},
		},
		PlayerSessions: map[string]string{},
	}
	service.store.SaveRoomState(room.toPersistedSnapshot())

	updated, err := service.mortgageProperty(room.RoomID, "p2", "mortgage-partial", "tile-3")
	if err != nil {
		t.Fatalf("expected mortgage property to succeed, got error %v", err)
	}

	if updated.PendingPayment == nil {
		t.Fatalf("expected pending payment to remain after partial mortgage")
	}
	if updated.PendingPayment.Amount != 100 {
		t.Fatalf("expected pending amount to remain 100, got %d", updated.PendingPayment.Amount)
	}
	if updated.Players[1].Cash != 85 {
		t.Fatalf("expected debtor cash 85 after partial mortgage, got %d", updated.Players[1].Cash)
	}
	if updated.Players[0].Cash != 1500 {
		t.Fatalf("expected creditor cash to remain unchanged before settlement, got %d", updated.Players[0].Cash)
	}
	if updated.TurnState != "awaiting-deficit-resolution" {
		t.Fatalf("expected room to stay in deficit resolution, got %s", updated.TurnState)
	}
	if !containsPlayer(updated.Players[1].MortgagedProperties, "tile-3") {
		t.Fatalf("expected tile-3 to be marked as mortgaged")
	}
	if updated.PendingAction == "等待当前玩家处理欠款" {
		t.Fatalf("expected pending action to update remaining shortfall")
	}
}