export type RoomState = "lobby" | "starting" | "in-game" | "paused-recovery" | "finished";

export type TurnState = "awaiting-roll" | "awaiting-property-decision" | "awaiting-auction" | "awaiting-jail-decision" | "awaiting-deficit-resolution" | "post-roll-pending";

export type DeckKind = "chance" | "community";

export type CardDisposition = "discarded" | "held" | "returned";

export type RoomEventType =
  | "room-created"
  | "player-joined"
  | "room-started"
  | "dice-rolled"
  | "player-moved"
  | "property-offered"
  | "property-purchased"
  | "property-declined"
  | "rent-charged"
  | "auction-started"
  | "auction-bid-submitted"
  | "auction-pass-submitted"
  | "auction-settled"
  | "auction-ended-unsold"
  | "card-resolved"
  | "player-jailed"
  | "jail-roll-attempted"
  | "jail-card-used"
  | "jail-fine-paid"
  | "tax-paid"
  | "deficit-started"
  | "property-mortgaged"
  | "improvement-built"
  | "improvement-sold"
  | "bankruptcy-declared"
  | "room-finished"
  | "turn-advanced";

export type PendingPropertyDecision = {
  tileId: string;
  tileIndex: number;
  label: string;
  price: number;
};

export type PendingAuction = {
  tileId: string;
  tileIndex: number;
  label: string;
  price: number;
  initiatorPlayerId: string;
  highestBid: number;
  highestBidderId: string | null;
  passedPlayerIds: string[];
};

export type PendingPayment = {
  amount: number;
  reason: "tax" | "jail" | "rent";
  creditorKind: "bank" | "player";
  creditorPlayerId?: string;
  sourceTileId?: string;
  sourceTileLabel?: string;
  resumeRoll?: [number, number];
  releaseFromJail?: boolean;
};

export type CardDeckState = {
  drawPile: string[];
  discardPile: string[];
};

export type TileType = "corner" | "property" | "chance" | "community" | "tax" | "jail" | "utility" | "railway";

export type BoardTile = {
  id: string;
  index: number;
  label: string;
  type: TileType;
  colorGroup?: string;
  buildCost?: number;
  rentByLevel?: number[];
  rent?: number;
  price?: number;
};

export type PlayerState = {
  id: string;
  name: string;
  cash: number;
  position: number;
  properties: string[];
  mortgagedProperties?: string[];
  propertyImprovements?: Record<string, number>;
  inJail?: boolean;
  jailTurnsServed?: number;
  heldCardIds?: string[];
  isBankrupt?: boolean;
  ready?: boolean;
};

export type ProjectionEvent = {
  id: string;
  type: RoomEventType;
  sequence: number;
  snapshotVersion: number;
  summary: string;
  playerId?: string;
  ownerPlayerId?: string;
  nextPlayerId?: string;
  tileId?: string;
  tileIndex?: number;
  tileLabel?: string;
  tilePrice?: number;
  amount?: number;
  playerPosition?: number;
  cashAfter?: number;
  ownerCashAfter?: number;
  roomState?: RoomState;
  deckKind?: DeckKind;
  cardId?: string;
  cardTitle?: string;
  cardDisposition?: CardDisposition;
  releaseMethod?: "roll" | "fine" | "card";
  failedAttemptCount?: number;
  improvementLevel?: number;
  lastRoll?: [number, number];
};

export type ProjectionSnapshot = {
  roomId: string;
  roomState: RoomState;
  hostId?: string;
  snapshotVersion: number;
  eventSequence: number;
  turnState: TurnState;
  currentTurnPlayerId: string;
  pendingActionLabel: string;
  pendingProperty: PendingPropertyDecision | null;
  pendingAuction: PendingAuction | null;
  pendingPayment: PendingPayment | null;
  chanceDeck: CardDeckState;
  communityDeck: CardDeckState;
  lastRoll: [number, number];
  players: PlayerState[];
  recentEvents: ProjectionEvent[];
};

export type CreateRoomCommand = {
  kind: "create-room";
  hostName: string;
};

export type CreateRoomRequest = {
  hostName: string;
};

export type JoinRoomCommand = {
  kind: "join-room";
  roomId: string;
  playerName: string;
};

export type JoinRoomRequest = {
  playerName: string;
};

export type StartGameCommand = {
  kind: "start-game";
  roomId: string;
  hostId: string;
};

export type StartGameRequest = {
  hostId: string;
};

export type RollDiceRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type PurchasePropertyRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type DeclinePropertyRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type SubmitAuctionBidRequest = {
  playerId: string;
  idempotencyKey: string;
  amount: number;
};

export type PassAuctionRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type PayJailFineRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type AttemptJailRollRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type UseJailCardRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type MortgagePropertyRequest = {
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type DeclareBankruptcyRequest = {
  playerId: string;
  idempotencyKey: string;
};

export type BuildImprovementRequest = {
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type SellImprovementRequest = {
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type RollDiceCommand = {
  kind: "roll-dice";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type PurchasePropertyCommand = {
  kind: "purchase-property";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type DeclinePropertyCommand = {
  kind: "decline-property";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type SubmitAuctionBidCommand = {
  kind: "submit-auction-bid";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
  amount: number;
};

export type PassAuctionCommand = {
  kind: "pass-auction";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type PayJailFineCommand = {
  kind: "pay-jail-fine";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type AttemptJailRollCommand = {
  kind: "attempt-jail-roll";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type UseJailCardCommand = {
  kind: "use-jail-card";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type MortgagePropertyCommand = {
  kind: "mortgage-property";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type DeclareBankruptcyCommand = {
  kind: "declare-bankruptcy";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type BuildImprovementCommand = {
  kind: "build-improvement";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type SellImprovementCommand = {
  kind: "sell-improvement";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
  tileId: string;
};

export type GameCommand =
  | CreateRoomCommand
  | JoinRoomCommand
  | StartGameCommand
  | RollDiceCommand
  | PurchasePropertyCommand
  | DeclinePropertyCommand
  | SubmitAuctionBidCommand
  | PassAuctionCommand
  | PayJailFineCommand
  | AttemptJailRollCommand
  | UseJailCardCommand
  | MortgagePropertyCommand
  | DeclareBankruptcyCommand
  | BuildImprovementCommand
  | SellImprovementCommand;

export type RoomEventCatchUpResponse = {
  roomId: string;
  afterSequence: number;
  latestSequence: number;
  events: ProjectionEvent[];
  snapshot: ProjectionSnapshot | null;
};

export type RoomEventStreamEnvelope =
  | {
      kind: "event";
      event: ProjectionEvent;
    }
  | {
      kind: "snapshot";
      snapshot: ProjectionSnapshot;
    };

export type RoomSummary = {
  roomId: string;
  roomState: RoomState;
  hostId: string;
  playerCount: number;
};
