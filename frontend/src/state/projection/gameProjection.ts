import { useEffect, useState } from "react";
import type { PlayerState, ProjectionEvent, ProjectionSnapshot, RoomEventCatchUpResponse, RoomEventStreamEnvelope } from "@dafuweng/contracts";
import { sampleProjection } from "@dafuweng/board-config";
import { getRoom, getRoomEvents, subscribeRoomEventStream } from "../../network/roomApi";

type PlayerSummary = Pick<PlayerState, "id" | "name" | "cash" | "position" | "properties" | "mortgagedProperties" | "inJail" | "jailTurnsServed" | "heldCardIds" | "isBankrupt">;

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

function updateDeck(snapshot: ProjectionSnapshot, deckKind: "chance" | "community", cardId: string | undefined, disposition: string | undefined) {
  if (!cardId) {
    return snapshot;
  }

  const key = deckKind === "chance" ? "chanceDeck" : "communityDeck";
  const deck = snapshot[key];
  const nextDrawPile = deck.drawPile.filter((candidate, index) => candidate !== cardId || index !== deck.drawPile.indexOf(cardId));
  const nextDiscardPile = disposition === "discarded" || disposition === "returned"
    ? [...deck.discardPile, cardId]
    : deck.discardPile;

  return {
    ...snapshot,
    [key]: {
      drawPile: nextDrawPile,
      discardPile: nextDiscardPile
    }
  };
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
          pendingAuction: null,
          pendingPayment: null,
          chanceDeck: nextSnapshot.chanceDeck,
          communityDeck: nextSnapshot.communityDeck,
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
          pendingAuction: null,
          pendingPayment: null,
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
          pendingAuction: null,
          pendingPayment: null,
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
          pendingProperty: null,
          pendingAuction: nextSnapshot.pendingAuction,
          pendingPayment: null
        };
        break;
      case "auction-started":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId: event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingProperty: null,
          pendingPayment: null,
          pendingAuction: event.tileId && event.tileLabel && event.tilePrice !== undefined && event.tileIndex !== undefined && event.playerId
            ? {
                tileId: event.tileId,
                tileIndex: event.tileIndex,
                label: event.tileLabel,
                price: event.tilePrice,
                initiatorPlayerId: event.playerId,
                highestBid: 0,
                highestBidderId: null,
                passedPlayerIds: []
              }
            : nextSnapshot.pendingAuction,
          pendingActionLabel: `拍卖 ${event.tileLabel}，轮到当前玩家出价或放弃。`
        };
        break;
      case "auction-bid-submitted":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId: event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingPayment: null,
          pendingAuction: nextSnapshot.pendingAuction
            ? {
                ...nextSnapshot.pendingAuction,
                highestBid: event.amount ?? nextSnapshot.pendingAuction.highestBid,
                highestBidderId: event.playerId ?? nextSnapshot.pendingAuction.highestBidderId
              }
            : nextSnapshot.pendingAuction,
          pendingActionLabel: `拍卖进行中，当前最高出价 ${event.amount ?? 0}。`
        };
        break;
      case "auction-pass-submitted":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId: event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingPayment: null,
          pendingAuction: nextSnapshot.pendingAuction && event.playerId
            ? {
                ...nextSnapshot.pendingAuction,
                passedPlayerIds: nextSnapshot.pendingAuction.passedPlayerIds.includes(event.playerId)
                  ? nextSnapshot.pendingAuction.passedPlayerIds
                  : [...nextSnapshot.pendingAuction.passedPlayerIds, event.playerId]
              }
            : nextSnapshot.pendingAuction
        };
        break;
      case "auction-settled":
        nextSnapshot = {
          ...nextSnapshot,
          pendingAuction: null,
          pendingProperty: null,
          pendingPayment: null,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash,
            properties: event.tileId && !player.properties.includes(event.tileId)
              ? [...player.properties, event.tileId]
              : player.properties
          }))
        };
        break;
      case "auction-ended-unsold":
        nextSnapshot = {
          ...nextSnapshot,
          pendingAuction: null,
          pendingProperty: null,
          pendingPayment: null
        };
        break;
      case "rent-charged":
        nextSnapshot = {
          ...nextSnapshot,
          pendingProperty: null,
          pendingPayment: null,
          players: nextSnapshot.players.map((player) => {
            if (player.id === event.playerId) {
              return {
                ...player,
                cash: event.cashAfter ?? player.cash
              };
            }
            if (player.id === event.ownerPlayerId) {
              return {
                ...player,
                cash: event.ownerCashAfter ?? player.cash
              };
            }
            return player;
          })
        };
        break;
      case "improvement-built":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash,
            propertyImprovements: event.tileId
              ? {
                  ...(player.propertyImprovements ?? {}),
                  [event.tileId]: event.improvementLevel ?? ((player.propertyImprovements ?? {})[event.tileId] ?? 0) + 1
                }
              : (player.propertyImprovements ?? {})
          }))
        };
        break;
      case "improvement-sold":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => {
            const nextImprovements = { ...(player.propertyImprovements ?? {}) };
            if (event.tileId) {
              const nextLevel = event.improvementLevel ?? 0;
              if (nextLevel > 0) {
                nextImprovements[event.tileId] = nextLevel;
              } else {
                delete nextImprovements[event.tileId];
              }
            }

            return {
              ...player,
              cash: event.cashAfter ?? player.cash,
              propertyImprovements: nextImprovements
            };
          })
        };
        break;
      case "card-resolved":
        nextSnapshot = updateDeck(nextSnapshot, (event.deckKind as "chance" | "community") ?? "chance", event.cardId, event.cardDisposition);
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash,
            position: event.playerPosition ?? player.position,
            heldCardIds: event.cardDisposition === "held" && event.cardId && !(player.heldCardIds ?? []).includes(event.cardId)
              ? [...(player.heldCardIds ?? []), event.cardId]
              : (player.heldCardIds ?? [])
          }))
        };
        break;
      case "tax-paid":
        nextSnapshot = {
          ...nextSnapshot,
          pendingPayment: null,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash
          }))
        };
        break;
      case "deficit-started":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-deficit-resolution",
          pendingProperty: null,
          pendingAuction: null,
          pendingPayment: event.amount !== undefined
            ? {
                amount: event.amount,
                reason: event.ownerPlayerId ? "rent" : event.tileLabel === "监狱" ? "jail" : "tax",
                creditorKind: "bank",
                creditorPlayerId: event.ownerPlayerId,
                sourceTileId: event.tileId,
                sourceTileLabel: event.tileLabel
              }
            : nextSnapshot.pendingPayment,
          pendingActionLabel: `当前玩家需补缴 ${event.amount ?? 0} 税费。`
        };
        break;
      case "property-mortgaged":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: event.cashAfter ?? player.cash,
            mortgagedProperties: event.tileId && !(player.mortgagedProperties ?? []).includes(event.tileId)
              ? [...(player.mortgagedProperties ?? []), event.tileId]
              : (player.mortgagedProperties ?? [])
          }))
        };
        break;
      case "bankruptcy-declared":
        nextSnapshot = {
          ...nextSnapshot,
          pendingPayment: null,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            cash: 0,
            properties: [],
            mortgagedProperties: [],
            isBankrupt: true,
            inJail: false
          }))
        };
        break;
      case "player-jailed":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            inJail: true,
            jailTurnsServed: 0,
            position: event.playerPosition ?? player.position
          }))
        };
        break;
      case "jail-roll-attempted":
        nextSnapshot = {
          ...nextSnapshot,
          lastRoll: event.lastRoll ?? nextSnapshot.lastRoll,
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            jailTurnsServed: event.releaseMethod === "roll" ? 0 : (event.failedAttemptCount ?? player.jailTurnsServed ?? 0)
          }))
        };
        break;
      case "jail-card-used":
        nextSnapshot = updateDeck(nextSnapshot, (event.deckKind as "chance" | "community") ?? "chance", event.cardId, event.cardDisposition);
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          pendingActionLabel: "等待当前玩家掷骰",
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            inJail: false,
            jailTurnsServed: 0,
            heldCardIds: event.cardId ? (player.heldCardIds ?? []).filter((cardId) => cardId !== event.cardId) : (player.heldCardIds ?? [])
          }))
        };
        break;
      case "jail-fine-paid":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          pendingPayment: null,
          pendingActionLabel: "等待当前玩家掷骰",
          players: updatePlayer(nextSnapshot.players, event.playerId, (player) => ({
            ...player,
            inJail: false,
            jailTurnsServed: 0,
            cash: event.cashAfter ?? player.cash
          }))
        };
        break;
      case "room-finished":
        nextSnapshot = {
          ...nextSnapshot,
          roomState: event.roomState ?? "finished",
          turnState: "post-roll-pending",
          pendingActionLabel: "房间已结束",
          pendingPayment: null,
          pendingAuction: null,
          pendingProperty: null
        };
        break;
      case "turn-advanced":
        nextSnapshot = {
          ...nextSnapshot,
          currentTurnPlayerId: event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          turnState: nextSnapshot.players.find((player) => player.id === (event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId))?.inJail ? "awaiting-jail-decision" : "awaiting-roll",
          pendingProperty: null,
          pendingAuction: null,
          pendingPayment: null,
          pendingActionLabel: nextSnapshot.players.find((player) => player.id === (event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId))?.inJail
            ? "当前玩家在监狱中，可尝试掷骰出狱、使用出狱卡或支付罚金。"
            : "等待当前玩家掷骰"
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

export function applyStreamEnvelope(snapshot: ProjectionSnapshot, envelope: RoomEventStreamEnvelope): ProjectionSnapshot {
  if (envelope.kind === "snapshot") {
    return envelope.snapshot;
  }

  return applyRoomEvents(snapshot, [envelope.event]);
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
    const unsubscribe = subscribeRoomEventStream(roomId, 0, {
      onEnvelope(envelope) {
        setProjection((current) => toProjectionView(applyStreamEnvelope(current, envelope)));
        setIsFallback(false);
        setIsLoading(false);
        setError(null);
      }
    });

    return () => {
      unsubscribe();
    };
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
