const storageKeyPrefix = "dafuweng-active-player:";

type ActivePlayerRecord = {
  playerId: string;
  playerName: string;
  playerToken: string;
};

function getStorageKey(roomId: string) {
  return `${storageKeyPrefix}${roomId}`;
}

export function setActivePlayer(
  roomId: string,
  playerId: string,
  playerName: string,
  playerToken: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getStorageKey(roomId),
    JSON.stringify({
      playerId,
      playerName,
      playerToken,
    } satisfies ActivePlayerRecord),
  );
}

export function clearActivePlayer(roomId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getStorageKey(roomId));
}

export function getActivePlayer(roomId: string): ActivePlayerRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(getStorageKey(roomId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ActivePlayerRecord;
  } catch {
    return null;
  }
}
