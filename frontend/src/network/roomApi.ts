import type {
  AttemptJailRollRequest,
  BuildImprovementRequest,
  CreateRoomRequest,
  DeclareBankruptcyRequest,
  DeclinePropertyRequest,
  JoinRoomRequest,
  PassAuctionRequest,
  PayJailFineRequest,
  MortgagePropertyRequest,
  ProjectionSnapshot,
  ProposeTradeRequest,
  PurchasePropertyRequest,
  ResolveTradeRequest,
  RollDiceRequest,
  RoomEntryResponse,
  RoomEventCatchUpResponse,
  RoomEventStreamEnvelope,
  StartGameRequest,
  SubmitAuctionBidRequest,
  SellImprovementRequest,
  UseJailCardRequest,
} from "@dafuweng/contracts";
import { getActivePlayer } from "../state/projection/activePlayer";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080";
const PLAYER_TOKEN_HEADER = "X-DaFuWeng-Player-Token";
const REQUEST_TIMEOUT_MS = 5000;

function resolveApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

type StreamHandlers = {
  onEnvelope: (envelope: RoomEventStreamEnvelope) => void;
  onError?: () => void;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `request failed with ${response.status}`);
    }

    return await response.json() as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function withPlayerSession(roomId: string, init?: RequestInit): RequestInit {
  const activePlayer = getActivePlayer(roomId);
  const headers = {
    ...(init?.headers ?? {}),
    ...(activePlayer?.playerToken
      ? { [PLAYER_TOKEN_HEADER]: activePlayer.playerToken }
      : {}),
  };

  return {
    ...init,
    headers,
  };
}

export function getRoom(roomId: string) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}`);
}

export function getRoomEvents(roomId: string, afterSequence: number) {
  return requestJson<RoomEventCatchUpResponse>(`/api/rooms/${roomId}/events?afterSequence=${afterSequence}`);
}

export function createRoom(payload: CreateRoomRequest) {
  return requestJson<RoomEntryResponse>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function joinRoom(roomId: string, payload: JoinRoomRequest) {
  return requestJson<RoomEntryResponse>(`/api/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startRoom(roomId: string, payload: StartGameRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/start`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function rollDice(roomId: string, payload: RollDiceRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/roll`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function purchaseProperty(roomId: string, payload: PurchasePropertyRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/purchase`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function declineProperty(roomId: string, payload: DeclinePropertyRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/decline`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function submitAuctionBid(roomId: string, payload: SubmitAuctionBidRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/bid`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function passAuction(roomId: string, payload: PassAuctionRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/pass`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function payJailFine(roomId: string, payload: PayJailFineRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/jail-release`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function attemptJailRoll(roomId: string, payload: AttemptJailRollRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/jail-roll`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function useJailCard(roomId: string, payload: UseJailCardRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/jail-card`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function mortgageProperty(roomId: string, payload: MortgagePropertyRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/mortgage`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function declareBankruptcy(roomId: string, payload: DeclareBankruptcyRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/bankruptcy`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function buildImprovement(roomId: string, payload: BuildImprovementRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/build`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function sellImprovement(roomId: string, payload: SellImprovementRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/sell`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function proposeTrade(roomId: string, payload: ProposeTradeRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/trade/propose`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function acceptTrade(roomId: string, payload: ResolveTradeRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/trade/accept`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function rejectTrade(roomId: string, payload: ResolveTradeRequest) {
  return requestJson<ProjectionSnapshot>(
    `/api/rooms/${roomId}/trade/reject`,
    withPlayerSession(roomId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function subscribeRoomEventStream(roomId: string, afterSequence: number, handlers: StreamHandlers) {
  const eventSource = new EventSource(`${resolveApiBaseUrl()}/api/rooms/${roomId}/stream?afterSequence=${afterSequence}`);

  function parseEnvelope(event: MessageEvent<string>) {
    handlers.onEnvelope(JSON.parse(event.data) as RoomEventStreamEnvelope);
  }

  eventSource.addEventListener("room-event", (event) => {
    parseEnvelope(event as MessageEvent<string>);
  });
  eventSource.addEventListener("snapshot", (event) => {
    parseEnvelope(event as MessageEvent<string>);
  });
  eventSource.onerror = () => {
    handlers.onError?.();
  };

  return () => {
    eventSource.close();
  };
}
