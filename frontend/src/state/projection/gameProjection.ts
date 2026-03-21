import { useEffect, useState } from "react";
import type { PlayerState, ProjectionEvent, ProjectionSnapshot, RoomEventCatchUpResponse } from "@dafuweng/contracts";
import { sampleProjection } from "@dafuweng/board-config";
import { getRoom, getRoomEvents } from "../../network/roomApi";

type PlayerSummary = Pick<PlayerState, "id" | "name" | "cash" | "position" | "properties">;

type ProjectionView = ProjectionSnapshot & {
  currentTurnPlayerName: string;
  players: PlayerSummary[];
};

export type GameProjectionState = {
  projection: ProjectionView;
  isFallback: boolean;
  isLoading: boolean;
  error: string | null;
  applySnapshot: (snapshot: ProjectionSnapshot) => void;
  refreshProjection: () => Promise<void>;
};

export function toProjectionView(snapshot: ProjectionSnapshot): ProjectionView {
  const currentPlayer = snapshot.players.find(
    (player) => player.id === snapshot.currentTurnPlayerId
  );

  return {
    ...snapshot,
    currentTurnPlayerName: currentPlayer?.name ?? "未知玩家",
    players: snapshot.players
  };
}

function mergeRecentEvents(existingEvents: ProjectionEvent[], nextEvents: ProjectionEvent[]) {
  const byId = new Map<string, ProjectionEvent>();

  for (const event of [...existingEvents, ...nextEvents]) {
    byId.set(event.id, event);
  }

  return [...byId.values()]
    .sort((left, right) => left.sequence - right.sequence)
    .slice(-10);
}

function updatePlayer(
  players: ProjectionSnapshot["players"],
  playerId: string | undefined,
  updater: (player: ProjectionSnapshot["players"][number]) => ProjectionSnapshot["players"][number]
) {
  return players.map((player) => (player.id === playerId ? updater(player) : player));
}

export function applyRoomEvents(snapshot: ProjectionSnapshot, events: ProjectionEvent[]): ProjectionSnapshot {
  let nextSnapshot: ProjectionSnapshot = {
    ...snapshot,
    players: snapshot.players.map((player) => ({ ...player })),
    recentEvents: [...snapshot.recentEvents]
  };

  for (const event of events) {
    nextSnapshot = {
      ...nextSnapshot,
      snapshotVersion: Math.max(nextSnapshot.snapshotVersion, event.snapshotVersion),
      eventSequence: Math.max(nextSnapshot.eventSequence, event.sequence),
      recentEvents: mergeRecentEvents(nextSnapshot.recentEvents, [event])
    };

    switch (event.type) {
      case "room-started":
        nextSnapshot = {
          ...nextSnapshot,
          roomState: "in-game",
          turnState: "awaiting-roll",
          pendingProperty: null,
          pendingActionLabel: "等待当前玩家掷骰"
        };
        break;
      case "dice-rolled":
        nextSnapshot = {
          ...nextSnapshot,
          lastRoll: event.lastRoll ?? nextSnapshot.lastRoll
        };
        break;
      case "player-moved":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            position: event.playerPosition ?? player.position
          }))
        };
        break;
      case "property-offered":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-property-decision",
          pendingActionLabel: `可购买 ${event.tileLabel}，价格 ${event.tilePrice}。`,
          pendingProperty: event.tileId && event.tileLabel && event.tilePrice !== undefined && event.tileIndex !== undefined
            ? {
                tileId: event.tileId,
                tileIndex: event.tileIndex,
                label: event.tileLabel,
                price: event.tilePrice
              }
            : nextSnapshot.pendingProperty
        };
        break;
      case "property-purchased":
        nextSnapshot = {
          ...nextSnapshot,
          pendingProperty: null,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash,
            properties: event.tileId && !player.properties.includes(event.tileId)
              ? [...player.properties, event.tileId]
              : player.properties
          }))
        };
        break;
      case "property-declined":
        nextSnapshot = {
          ...nextSnapshot,
          pendingProperty: null
        };
        break;
      case "turn-advanced":
        nextSnapshot = {
          ...nextSnapshot,
          currentTurnPlayerId: event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          turnState: "awaiting-roll",
          pendingProperty: null,
          pendingActionLabel: "等待当前玩家掷骰"
        };
        break;
    }
  }

  return nextSnapshot;
}

export function applyCatchUpResponse(snapshot: ProjectionSnapshot, response: RoomEventCatchUpResponse): ProjectionSnapshot {
  if (response.snapshot) {
    return response.snapshot;
  }

  return applyRoomEvents(snapshot, response.events);
}

export function useGameProjection(roomId: string): GameProjectionState {
  const [projection, setProjection] = useState<ProjectionView>(toProjectionView(sampleProjection));
  const [isFallback, setIsFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshProjection() {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await getRoom(roomId);
      setProjection(toProjectionView(snapshot));
      setIsFallback(false);
      setIsLoading(false);
    } catch (requestError: unknown) {
      setProjection(toProjectionView({
        ...sampleProjection,
        roomId
      }));
      setIsFallback(true);
      setIsLoading(false);
      setError(requestError instanceof Error ? requestError.message : "无法读取房间状态");
    }
  }

  async function syncProjection() {
    if (isFallback) {
      return;
    }

    try {
      const response = await getRoomEvents(roomId, projection.eventSequence);
      if (!response.snapshot && response.events.length === 0) {
        return;
      }

      setProjection((current) => toProjectionView(applyCatchUpResponse(current, response)));
      setError(null);
    } catch {
      // Polling failures should not replace the current authoritative view.
    }
  }

  useEffect(() => {
    void refreshProjection();
  }, [roomId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void syncProjection();
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [roomId, projection.eventSequence, isFallback]);

  return {
    projection,
    isFallback,
    isLoading,
    error,
    applySnapshot(snapshot) {
      setProjection(toProjectionView(snapshot));
      setIsFallback(false);
      setIsLoading(false);
      setError(null);
    },
    refreshProjection
  };
}
