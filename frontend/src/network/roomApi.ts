import type {
  CreateRoomRequest,
  JoinRoomRequest,
  ProjectionSnapshot,
  StartGameRequest
} from "@dafuweng/contracts";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080";

function resolveApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

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