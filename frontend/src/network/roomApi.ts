import type {
  CreateRoomRequest,
  DeclareBankruptcyRequest,
  DeclinePropertyRequest,
  JoinRoomRequest,
  PassAuctionRequest,
  PayJailFineRequest,
  MortgagePropertyRequest,
  ProjectionSnapshot,
  PurchasePropertyRequest,
  RollDiceRequest,
  RoomEventCatchUpResponse,
  RoomEventStreamEnvelope,
  StartGameRequest,
  SubmitAuctionBidRequest
} from "@dafuweng/contracts";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080";

function resolveApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

type StreamHandlers = {
  onEnvelope: (envelope: RoomEventStreamEnvelope) => void;
  onError?: () => void;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1500);

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

export function getRoom(roomId: string) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}`);
}

export function getRoomEvents(roomId: string, afterSequence: number) {
  return requestJson<RoomEventCatchUpResponse>(`/api/rooms/${roomId}/events?afterSequence=${afterSequence}`);
}

export function createRoom(payload: CreateRoomRequest) {
  return requestJson<ProjectionSnapshot>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function joinRoom(roomId: string, payload: JoinRoomRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function startRoom(roomId: string, payload: StartGameRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/start`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function rollDice(roomId: string, payload: RollDiceRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/roll`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function purchaseProperty(roomId: string, payload: PurchasePropertyRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/purchase`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function declineProperty(roomId: string, payload: DeclinePropertyRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/decline`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function submitAuctionBid(roomId: string, payload: SubmitAuctionBidRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/bid`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function passAuction(roomId: string, payload: PassAuctionRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/pass`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function payJailFine(roomId: string, payload: PayJailFineRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/jail-release`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function mortgageProperty(roomId: string, payload: MortgagePropertyRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/mortgage`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function declareBankruptcy(roomId: string, payload: DeclareBankruptcyRequest) {
  return requestJson<ProjectionSnapshot>(`/api/rooms/${roomId}/bankruptcy`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
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
