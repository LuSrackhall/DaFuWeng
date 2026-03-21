export type RoomState = "lobby" | "starting" | "in-game" | "paused-recovery" | "finished";

export type TurnState = "awaiting-roll" | "awaiting-property-decision" | "post-roll-pending";

export type RoomEventType =
  | "room-created"
  | "player-joined"
  | "room-started"
  | "dice-rolled"
  | "player-moved"
  | "property-offered"
  | "property-purchased"
  | "property-declined"
  | "turn-advanced";

export type PendingPropertyDecision = {
  tileId: string;
  tileIndex: number;
  label: string;
  price: number;
};

export type TileType = "corner" | "property" | "chance" | "community" | "tax" | "jail" | "utility" | "railway";

export type BoardTile = {
  id: string;
  index: number;
  label: string;
  type: TileType;
  rent?: number;
  price?: number;
};

export type PlayerState = {
  id: string;
  name: string;
  cash: number;
  position: number;
  properties: string[];
  ready?: boolean;
};

export type ProjectionEvent = {
  id: string;
  type: RoomEventType;
  sequence: number;
  snapshotVersion: number;
  summary: string;
  playerId?: string;
  nextPlayerId?: string;
  tileId?: string;
  tileIndex?: number;
  tileLabel?: string;
  tilePrice?: number;
  playerPosition?: number;
  cashAfter?: number;
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

export type GameCommand =
  | CreateRoomCommand
  | JoinRoomCommand
  | StartGameCommand
  | RollDiceCommand
  | PurchasePropertyCommand
  | DeclinePropertyCommand;

export type RoomEventCatchUpResponse = {
  roomId: string;
  afterSequence: number;
  latestSequence: number;
  events: ProjectionEvent[];
  snapshot: ProjectionSnapshot | null;
};

export type RoomSummary = {
  roomId: string;
  roomState: RoomState;
  hostId: string;
  playerCount: number;
};
