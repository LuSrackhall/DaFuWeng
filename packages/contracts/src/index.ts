export type RoomState = "lobby" | "starting" | "in-game" | "paused-recovery" | "finished";

export type TurnState = "awaiting-roll" | "post-roll-pending";

export type RoomEventType =
  | "room-created"
  | "player-joined"
  | "room-started"
  | "dice-rolled"
  | "player-moved";

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
  summary: string;
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

export type RollDiceCommand = {
  kind: "roll-dice";
  roomId: string;
  playerId: string;
  idempotencyKey: string;
};

export type GameCommand = CreateRoomCommand | JoinRoomCommand | StartGameCommand | RollDiceCommand;

export type RoomSummary = {
  roomId: string;
  roomState: RoomState;
  hostId: string;
  playerCount: number;
};
