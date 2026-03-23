import { sampleBoard } from "@dafuweng/board-config";
import { useEffect, useState } from "react";
import type {
  PendingAuction,
  PendingTrade,
  PendingPayment,
  PlayerState,
  ProjectionEvent,
  ProjectionSnapshot,
  RoomEventCatchUpResponse,
  RoomEventStreamEnvelope,
} from "@dafuweng/contracts";
import { getRoom, getRoomEvents, subscribeRoomEventStream } from "../../network/roomApi";

type PlayerSummary = Pick<
  PlayerState,
  | "id"
  | "name"
  | "cash"
  | "position"
  | "properties"
  | "mortgagedProperties"
  | "propertyImprovements"
  | "inJail"
  | "jailTurnsServed"
  | "heldCardIds"
  | "isBankrupt"
>;

type WaitingRoomSeatSummary = {
  playerId: string;
  name: string;
  cash: number;
  propertyCount: number;
  isHost: boolean;
  isBankrupt: boolean;
};

type WaitingRoomSummary = {
  roomCode: string;
  hostName: string;
  minimumPlayers: number;
  playerCount: number;
  playersNeeded: number;
  canStart: boolean;
  blockerLabel: string;
  reconnectLabel: string;
  seats: WaitingRoomSeatSummary[];
};

type ResolutionSummary = {
  actorPlayerId: string;
  actorName: string;
  actorCash: number;
  creditorLabel: string;
  reasonLabel: string;
  sourceLabel: string;
  amount: number;
  shortfall: number;
  availableMortgageCount: number;
  consequenceLabel: string;
  sourceTileId: string | null;
};

type AuctionSummary = {
  lotTileId: string;
  lotLabel: string;
  lotPrice: number;
  initiatorPlayerName: string;
  actingBidderId: string;
  actingBidderName: string;
  highestBid: number;
  highestBidderName: string | null;
  nextMinimumBid: number;
  activeBidderNames: string[];
  passedPlayerNames: string[];
  activeBidderCount: number;
  passedBidderCount: number;
  triggerLabel: string;
  statusLabel: string;
};

type TradeSummary = {
  proposerPlayerId: string;
  proposerName: string;
  counterpartyPlayerId: string;
  counterpartyName: string;
  offeredCash: number;
  requestedCash: number;
  offeredTileLabels: string[];
  requestedTileLabels: string[];
  offeredCardLabels: string[];
  requestedCardLabels: string[];
  proposerNetCash: number;
  counterpartyNetCash: number;
  stageLabel: string;
  outcomePreviewLabel: string;
};

type SettlementSummary = {
  title: string;
  detail: string;
  nextStepLabel: string;
  tone: "danger" | "neutral";
  kind?: "trade-accepted" | "trade-rejected" | "auction-unsold" | "generic";
  tradeSettlement?: {
    proposerName: string;
    counterpartyName: string;
    proposerSummary: string;
    counterpartySummary: string;
    proposerGives: string[];
    proposerGets: string[];
    counterpartyGives: string[];
    counterpartyGets: string[];
    proposerCashAfter: number | null;
    counterpartyCashAfter: number | null;
  };
  tradeRejection?: {
    proposerName: string;
    counterpartyName: string;
    proposerOfferedSummary: string;
    proposerRequestedSummary: string;
    proposerOffered: string[];
    proposerRequested: string[];
    nextActorName: string;
  };
};

type ProjectionView = ProjectionSnapshot & {
  currentTurnPlayerName: string;
  hostPlayerName: string;
  players: PlayerSummary[];
  waitingRoomSummary: WaitingRoomSummary | null;
  auctionSummary: AuctionSummary | null;
  tradeSummary: TradeSummary | null;
  resolutionSummary: ResolutionSummary | null;
  latestSettlementSummary: SettlementSummary | null;
};

export type GameProjectionState = {
  projection: ProjectionView;
  isFallback: boolean;
  isLoading: boolean;
  error: string | null;
  applySnapshot: (snapshot: ProjectionSnapshot) => void;
  refreshProjection: () => Promise<void>;
};

function createEmptyProjection(roomId: string): ProjectionSnapshot {
  return {
    roomId,
    roomState: "lobby",
    hostId: undefined,
    snapshotVersion: 0,
    eventSequence: 0,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "",
    pendingActionLabel: "正在连接房间...",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [],
    recentEvents: [],
  };
}

function getPlayerName(players: PlayerState[], playerId: string | undefined) {
  return players.find((player) => player.id === playerId)?.name ?? "未知玩家";
}

const boardTileLabels = new Map(sampleBoard.map((tile) => [tile.id, tile.label]));

const cardLabels = new Map([
  ["chance-jail-card", "机会免狱卡"],
  ["community-jail-card", "命运免狱卡"],
]);

function getTileLabel(tileId: string) {
  return boardTileLabels.get(tileId) ?? tileId;
}

function getCardLabel(cardId: string) {
  return cardLabels.get(cardId) ?? cardId;
}

function formatPendingPaymentReason(reason: PendingPayment["reason"]) {
  switch (reason) {
    case "rent":
      return "租金";
    case "jail":
      return "监狱罚金";
    case "card":
      return "卡牌费用";
    case "tax":
      return "税费";
    default:
      return "待处理欠款";
  }
}

function buildWaitingRoomSummary(snapshot: ProjectionSnapshot): WaitingRoomSummary | null {
  if (snapshot.roomState !== "lobby") {
    return null;
  }

  const minimumPlayers = 2;
  const playerCount = snapshot.players.length;
  const playersNeeded = Math.max(0, minimumPlayers - playerCount);
  const canStart = playersNeeded === 0;

  return {
    roomCode: snapshot.roomId,
    hostName: getPlayerName(snapshot.players, snapshot.hostId),
    minimumPlayers,
    playerCount,
    playersNeeded,
    canStart,
    blockerLabel: canStart
      ? "已满足最少开局人数，房主可以开始本局。"
      : `至少还需要 ${playersNeeded} 名玩家加入，房主才能开始。`,
    reconnectLabel: "这是服务端权威房间。刷新后会恢复同一房间快照，并保持已加入身份。",
    seats: snapshot.players.map((player) => ({
      playerId: player.id,
      name: player.name,
      cash: player.cash,
      propertyCount: player.properties.length,
      isHost: player.id === snapshot.hostId,
      isBankrupt: player.isBankrupt ?? false,
    })),
  };
}

function buildResolutionSummary(snapshot: ProjectionSnapshot): ResolutionSummary | null {
  if (!snapshot.pendingPayment) {
    return null;
  }

  const actor = snapshot.players.find(
    (player) => player.id === snapshot.currentTurnPlayerId,
  );
  const amount = snapshot.pendingPayment.amount;
  const actorCash = actor?.cash ?? 0;

  return {
    actorPlayerId: snapshot.currentTurnPlayerId,
    actorName: actor?.name ?? "未知玩家",
    actorCash,
    creditorLabel:
      snapshot.pendingPayment.creditorKind === "player"
        ? `${getPlayerName(snapshot.players, snapshot.pendingPayment.creditorPlayerId)}（玩家债权人）`
        : "银行",
    reasonLabel: formatPendingPaymentReason(snapshot.pendingPayment.reason),
    sourceLabel: snapshot.pendingPayment.sourceTileLabel ?? "未知来源",
    amount,
    shortfall: Math.max(0, amount - actorCash),
    availableMortgageCount: Math.max(
      0,
      (actor?.properties.length ?? 0) - (actor?.mortgagedProperties?.length ?? 0),
    ),
    consequenceLabel:
      snapshot.pendingPayment.creditorKind === "player"
        ? "若仍无法补足，可宣告破产，剩余可转移资产会按玩家债权人结算。"
        : "若仍无法补足，可宣告破产，资产会按银行债权规则清空或回收。",
    sourceTileId: snapshot.pendingPayment.sourceTileId ?? null,
  };
}

function buildAuctionSummary(snapshot: ProjectionSnapshot): AuctionSummary | null {
  const auction = snapshot.pendingAuction;
  if (!auction) {
    return null;
  }

  const activeBidderNames = snapshot.players
    .filter(
      (player) =>
        !player.isBankrupt &&
        !auction.passedPlayerIds.includes(player.id),
    )
    .map((player) => player.name);

  const passedPlayerNames = auction.passedPlayerIds.map((playerId) =>
    getPlayerName(snapshot.players, playerId),
  );

  const highestBidderName = auction.highestBidderId
    ? getPlayerName(snapshot.players, auction.highestBidderId)
    : null;

  return {
    lotTileId: auction.tileId,
    lotLabel: auction.label,
    lotPrice: auction.price,
    initiatorPlayerName: getPlayerName(snapshot.players, auction.initiatorPlayerId),
    actingBidderId: snapshot.currentTurnPlayerId,
    actingBidderName: getPlayerName(snapshot.players, snapshot.currentTurnPlayerId),
    highestBid: auction.highestBid,
    highestBidderName,
    nextMinimumBid: Math.max(1, auction.highestBid + 1),
    activeBidderNames,
    passedPlayerNames,
    activeBidderCount: activeBidderNames.length,
    passedBidderCount: passedPlayerNames.length,
    triggerLabel: `${getPlayerName(snapshot.players, auction.initiatorPlayerId)} 放弃购买后，${auction.label} 进入公开拍卖。`,
    statusLabel:
      highestBidderName
        ? `${highestBidderName} 目前以 ${auction.highestBid} 领先，轮到 ${getPlayerName(snapshot.players, snapshot.currentTurnPlayerId)} 决策。`
        : `当前还没有领先者，轮到 ${getPlayerName(snapshot.players, snapshot.currentTurnPlayerId)} 开出第一口。`,
  };
}

function buildTradeSummaryFromPendingTrade(
  players: PlayerState[],
  pendingTrade: PendingTrade,
): TradeSummary {
  const proposerName = getPlayerName(players, pendingTrade.proposerPlayerId);
  const counterpartyName = getPlayerName(players, pendingTrade.counterpartyPlayerId);
  const proposerNetCash = pendingTrade.requestedCash - pendingTrade.offeredCash;
  const counterpartyNetCash = pendingTrade.offeredCash - pendingTrade.requestedCash;

  return {
    proposerPlayerId: pendingTrade.proposerPlayerId,
    proposerName,
    counterpartyPlayerId: pendingTrade.counterpartyPlayerId,
    counterpartyName,
    offeredCash: pendingTrade.offeredCash,
    requestedCash: pendingTrade.requestedCash,
    offeredTileLabels: pendingTrade.offeredTileIds.map(getTileLabel),
    requestedTileLabels: pendingTrade.requestedTileIds.map(getTileLabel),
    offeredCardLabels: pendingTrade.offeredCardIds.map(getCardLabel),
    requestedCardLabels: pendingTrade.requestedCardIds.map(getCardLabel),
    proposerNetCash,
    counterpartyNetCash,
    stageLabel: `${proposerName} 把一笔交换递给了 ${counterpartyName}，现在等 ${counterpartyName} 表态。`,
    outcomePreviewLabel:
      `${proposerName} 现金净变动 ${proposerNetCash >= 0 ? "+" : ""}${proposerNetCash}，` +
      `${counterpartyName} 现金净变动 ${counterpartyNetCash >= 0 ? "+" : ""}${counterpartyNetCash}。`,
  };
}

function buildTradeSummary(snapshot: ProjectionSnapshot): TradeSummary | null {
  if (!snapshot.pendingTrade) {
    return null;
  }

  return buildTradeSummaryFromPendingTrade(snapshot.players, snapshot.pendingTrade);
}

function buildTradeAssetLines(cash: number, tileLabels: string[], cardLabels: string[]) {
  const lines: string[] = [];

  if (cash > 0) {
    lines.push(`现金 ${cash}`);
  }
  if (tileLabels.length > 0) {
    lines.push(`地产 ${tileLabels.join(" / ")}`);
  }
  if (cardLabels.length > 0) {
    lines.push(`卡牌 ${cardLabels.join(" / ")}`);
  }

  return lines;
}

function countTradeAssetEntries(cash: number, tileLabels: string[], cardLabels: string[]) {
  return Number(cash > 0) + Number(tileLabels.length > 0) + Number(cardLabels.length > 0);
}

function buildTradeSideSummary(giveCount: number, getCount: number) {
  const giveLabel = giveCount > 0 ? `交出 ${giveCount} 项` : "没有额外交出";
  const getLabel = getCount > 0 ? `获得 ${getCount} 项` : "没有额外获得";
  return `${giveLabel} · ${getLabel}`;
}

function buildRejectedTradeSummary(count: number, verb: "交出" | "获得") {
  if (count === 0) {
    return verb === "交出" ? "原本没有额外交出" : "原本没有额外索要";
  }

  return `原本想${verb} ${count} 项`;
}

function buildLatestSettlementSummary(snapshot: ProjectionSnapshot): SettlementSummary | null {
  const latestFormalEvent = [...snapshot.recentEvents]
    .filter((event) =>
      event.type === "bankruptcy-declared"
      || event.type === "trade-accepted"
      || event.type === "trade-rejected"
      || event.type === "auction-ended-unsold",
    )
    .sort((left, right) => right.sequence - left.sequence)[0];

  if (!latestFormalEvent) {
    return null;
  }

  if (latestFormalEvent.type === "bankruptcy-declared" && latestFormalEvent.playerId) {
    const debtorName = getPlayerName(snapshot.players, latestFormalEvent.playerId);

    if (latestFormalEvent.ownerPlayerId) {
      const creditorName = getPlayerName(snapshot.players, latestFormalEvent.ownerPlayerId);
      const transferredPropertyCount = latestFormalEvent.transferredPropertyIds?.length ?? 0;
      const transferredCardCount = latestFormalEvent.transferredCardIds?.length ?? 0;

      return {
        title: `${debtorName} 已向 ${creditorName} 破产结算`,
        detail: `${creditorName} 接收了 ${transferredPropertyCount} 处地产、${transferredCardCount} 张卡牌及剩余现金。`,
        nextStepLabel:
          snapshot.roomState === "finished"
            ? "本局已结束，只剩最后一名未破产玩家。"
            : snapshot.pendingActionLabel,
        tone: snapshot.roomState === "finished" ? "danger" : "neutral",
        kind: "generic",
      };
    }

    return {
      title: `${debtorName} 已向银行破产结算`,
      detail: "该玩家的资产、抵押和持有卡牌已按银行债权规则清空或回收给银行。",
      nextStepLabel:
        snapshot.roomState === "finished"
          ? "本局已结束，只剩最后一名未破产玩家。"
          : snapshot.pendingActionLabel,
      tone: snapshot.roomState === "finished" ? "danger" : "neutral",
      kind: "generic",
    };
  }

  if (latestFormalEvent.type === "auction-ended-unsold") {
    return {
      title: `${latestFormalEvent.tileLabel ?? "当前拍品"} 本轮流拍`,
      detail: `没有玩家赢得 ${latestFormalEvent.tileLabel ?? "该地产"}，产权保持未售出状态，也没有任何现金结算。`,
      nextStepLabel: snapshot.pendingActionLabel,
      tone: "neutral",
      kind: "auction-unsold",
    };
  }

  if (
    (latestFormalEvent.type === "trade-accepted" || latestFormalEvent.type === "trade-rejected")
    && latestFormalEvent.playerId
    && latestFormalEvent.ownerPlayerId
  ) {
    const recentTradeProposal = [...snapshot.recentEvents]
      .filter(
        (event) =>
          event.type === "trade-proposed"
          && event.sequence <= latestFormalEvent.sequence,
      )
      .sort((left, right) => right.sequence - left.sequence)[0];

    const tradeSourceEvent = latestFormalEvent.offeredCash !== undefined
      || latestFormalEvent.requestedCash !== undefined
      || (latestFormalEvent.offeredTileIds?.length ?? 0) > 0
      || (latestFormalEvent.requestedTileIds?.length ?? 0) > 0
      || (latestFormalEvent.offeredCardIds?.length ?? 0) > 0
      || (latestFormalEvent.requestedCardIds?.length ?? 0) > 0
      ? latestFormalEvent
      : recentTradeProposal;

    if (!tradeSourceEvent?.playerId || !tradeSourceEvent.ownerPlayerId) {
      return null;
    }

    const tradeSummary = buildTradeSummaryFromPendingTrade(snapshot.players, {
      proposerPlayerId: tradeSourceEvent.playerId,
      counterpartyPlayerId: tradeSourceEvent.ownerPlayerId,
      offeredCash: tradeSourceEvent.offeredCash ?? 0,
      requestedCash: tradeSourceEvent.requestedCash ?? 0,
      offeredTileIds: tradeSourceEvent.offeredTileIds ?? [],
      requestedTileIds: tradeSourceEvent.requestedTileIds ?? [],
      offeredCardIds: tradeSourceEvent.offeredCardIds ?? [],
      requestedCardIds: tradeSourceEvent.requestedCardIds ?? [],
      snapshotVersion:
        tradeSourceEvent.tradeSnapshotVersion ?? snapshot.snapshotVersion,
    });

    if (latestFormalEvent.type === "trade-accepted") {
      const proposerCashAfter = latestFormalEvent.cashAfterByPlayer?.[tradeSummary.proposerPlayerId] ?? null;
      const counterpartyCashAfter = latestFormalEvent.cashAfterByPlayer?.[tradeSummary.counterpartyPlayerId] ?? null;
      const proposerGives = buildTradeAssetLines(
        tradeSummary.offeredCash,
        tradeSummary.offeredTileLabels,
        tradeSummary.offeredCardLabels,
      );
      const proposerGiveCount = countTradeAssetEntries(
        tradeSummary.offeredCash,
        tradeSummary.offeredTileLabels,
        tradeSummary.offeredCardLabels,
      );
      const proposerGets = buildTradeAssetLines(
        tradeSummary.requestedCash,
        tradeSummary.requestedTileLabels,
        tradeSummary.requestedCardLabels,
      );
      const proposerGetCount = countTradeAssetEntries(
        tradeSummary.requestedCash,
        tradeSummary.requestedTileLabels,
        tradeSummary.requestedCardLabels,
      );
      const counterpartyGives = buildTradeAssetLines(
        tradeSummary.requestedCash,
        tradeSummary.requestedTileLabels,
        tradeSummary.requestedCardLabels,
      );
      const counterpartyGiveCount = countTradeAssetEntries(
        tradeSummary.requestedCash,
        tradeSummary.requestedTileLabels,
        tradeSummary.requestedCardLabels,
      );
      const counterpartyGets = buildTradeAssetLines(
        tradeSummary.offeredCash,
        tradeSummary.offeredTileLabels,
        tradeSummary.offeredCardLabels,
      );
      const counterpartyGetCount = countTradeAssetEntries(
        tradeSummary.offeredCash,
        tradeSummary.offeredTileLabels,
        tradeSummary.offeredCardLabels,
      );
      return {
        title: `${tradeSummary.counterpartyName} 接受了 ${tradeSummary.proposerName} 的交易报价`,
        detail: "这笔交换已经成交，双方的钱和资产都已经换手。",
        nextStepLabel: snapshot.pendingActionLabel,
        tone: "neutral",
        kind: "trade-accepted",
        tradeSettlement: {
          proposerName: tradeSummary.proposerName,
          counterpartyName: tradeSummary.counterpartyName,
          proposerSummary: buildTradeSideSummary(proposerGiveCount, proposerGetCount),
          counterpartySummary: buildTradeSideSummary(counterpartyGiveCount, counterpartyGetCount),
          proposerGives,
          proposerGets,
          counterpartyGives,
          counterpartyGets,
          proposerCashAfter,
          counterpartyCashAfter,
        },
      };
    }

    const proposerOffered = buildTradeAssetLines(
      tradeSummary.offeredCash,
      tradeSummary.offeredTileLabels,
      tradeSummary.offeredCardLabels,
    );
    const proposerOfferedCount = countTradeAssetEntries(
      tradeSummary.offeredCash,
      tradeSummary.offeredTileLabels,
      tradeSummary.offeredCardLabels,
    );
    const proposerRequested = buildTradeAssetLines(
      tradeSummary.requestedCash,
      tradeSummary.requestedTileLabels,
      tradeSummary.requestedCardLabels,
    );
    const proposerRequestedCount = countTradeAssetEntries(
      tradeSummary.requestedCash,
      tradeSummary.requestedTileLabels,
      tradeSummary.requestedCardLabels,
    );

    return {
      title: `${tradeSummary.counterpartyName} 拒绝了 ${tradeSummary.proposerName} 的交易报价`,
      detail: "这笔交换没有谈成，现金、地产和卡牌都没有变化，房间也回到了正常节奏。",
      nextStepLabel: snapshot.pendingActionLabel,
      tone: "neutral",
      kind: "trade-rejected",
      tradeRejection: {
        proposerName: tradeSummary.proposerName,
        counterpartyName: tradeSummary.counterpartyName,
        proposerOfferedSummary: buildRejectedTradeSummary(proposerOfferedCount, "交出"),
        proposerRequestedSummary: buildRejectedTradeSummary(proposerRequestedCount, "获得"),
        proposerOffered,
        proposerRequested,
        nextActorName: getPlayerName(snapshot.players, snapshot.currentTurnPlayerId),
      },
    };
  }

  return null;
}

export function toProjectionView(snapshot: ProjectionSnapshot): ProjectionView {
  const currentPlayer = snapshot.players.find(
    (player) => player.id === snapshot.currentTurnPlayerId
  );

  return {
    ...snapshot,
    currentTurnPlayerName: currentPlayer?.name ?? "未知玩家",
    hostPlayerName: getPlayerName(snapshot.players, snapshot.hostId),
    players: snapshot.players,
    waitingRoomSummary: buildWaitingRoomSummary(snapshot),
    auctionSummary: buildAuctionSummary(snapshot),
    tradeSummary: buildTradeSummary(snapshot),
    resolutionSummary: buildResolutionSummary(snapshot),
    latestSettlementSummary: buildLatestSettlementSummary(snapshot),
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

function requiresSnapshotRefresh(events: ProjectionEvent[]) {
  return events.some(
    (event) => event.type === "room-created" || event.type === "player-joined",
  );
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

function updateDecksForCardIds(
  snapshot: ProjectionSnapshot,
  cardIds: string[] | undefined,
  disposition: "returned",
) {
  if (!cardIds || cardIds.length === 0) {
    return snapshot;
  }

  return cardIds.reduce<ProjectionSnapshot>((current, cardId) => {
    const deckKind = cardId.startsWith("community-") ? "community" : "chance";
    return updateDeck(current, deckKind, cardId, disposition);
  }, snapshot);
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
          pendingActionLabel: "等待当前玩家掷骰",
        };
        break;
      case "dice-rolled":
        nextSnapshot = {
          ...nextSnapshot,
          lastRoll: event.lastRoll ?? nextSnapshot.lastRoll,
        };
        break;
      case "player-moved":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              position: event.playerPosition ?? player.position,
            }),
          ),
        };
        break;
      case "property-offered":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-property-decision",
          pendingAuction: null,
          pendingPayment: null,
          pendingActionLabel: `可购买 ${event.tileLabel}，价格 ${event.tilePrice}。`,
          pendingProperty:
            event.tileId &&
            event.tileLabel &&
            event.tilePrice !== undefined &&
            event.tileIndex !== undefined
              ? {
                  tileId: event.tileId,
                  tileIndex: event.tileIndex,
                  label: event.tileLabel,
                  price: event.tilePrice,
                }
              : nextSnapshot.pendingProperty,
        };
        break;
      case "property-purchased":
        nextSnapshot = {
          ...nextSnapshot,
          pendingProperty: null,
          pendingAuction: null,
          pendingPayment: null,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
              properties:
                event.tileId && !player.properties.includes(event.tileId)
                  ? [...player.properties, event.tileId]
                  : player.properties,
            }),
          ),
        };
        break;
      case "property-declined":
        nextSnapshot = {
          ...nextSnapshot,
          pendingProperty: null,
          pendingAuction: nextSnapshot.pendingAuction,
          pendingPayment: null,
        };
        break;
      case "auction-started":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingProperty: null,
          pendingPayment: null,
          pendingAuction:
            event.tileId &&
            event.tileLabel &&
            event.tilePrice !== undefined &&
            event.tileIndex !== undefined &&
            event.playerId
              ? {
                  tileId: event.tileId,
                  tileIndex: event.tileIndex,
                  label: event.tileLabel,
                  price: event.tilePrice,
                  initiatorPlayerId: event.playerId,
                  highestBid: 0,
                  highestBidderId: null,
                  passedPlayerIds: [],
                }
              : nextSnapshot.pendingAuction,
          pendingActionLabel: `拍卖 ${event.tileLabel}，轮到当前玩家出价或放弃。`,
        };
        break;
      case "auction-bid-submitted":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingPayment: null,
          pendingAuction: nextSnapshot.pendingAuction
            ? {
                ...nextSnapshot.pendingAuction,
                highestBid:
                  event.amount ?? nextSnapshot.pendingAuction.highestBid,
                highestBidderId:
                  event.playerId ?? nextSnapshot.pendingAuction.highestBidderId,
              }
            : nextSnapshot.pendingAuction,
          pendingActionLabel: `拍卖进行中，当前最高出价 ${event.amount ?? 0}。`,
        };
        break;
      case "auction-pass-submitted":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-auction",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingPayment: null,
          pendingAuction:
            nextSnapshot.pendingAuction && event.playerId
              ? {
                  ...nextSnapshot.pendingAuction,
                  passedPlayerIds:
                    nextSnapshot.pendingAuction.passedPlayerIds.includes(
                      event.playerId,
                    )
                      ? nextSnapshot.pendingAuction.passedPlayerIds
                      : [
                          ...nextSnapshot.pendingAuction.passedPlayerIds,
                          event.playerId,
                        ],
                }
              : nextSnapshot.pendingAuction,
        };
        break;
      case "auction-settled":
        nextSnapshot = {
          ...nextSnapshot,
          pendingAuction: null,
          pendingProperty: null,
          pendingPayment: null,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
              properties:
                event.tileId && !player.properties.includes(event.tileId)
                  ? [...player.properties, event.tileId]
                  : player.properties,
            }),
          ),
        };
        break;
      case "auction-ended-unsold":
        nextSnapshot = {
          ...nextSnapshot,
          pendingAuction: null,
          pendingProperty: null,
          pendingPayment: null,
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
                cash: event.cashAfter ?? player.cash,
              };
            }
            if (player.id === event.ownerPlayerId) {
              return {
                ...player,
                cash: event.ownerCashAfter ?? player.cash,
              };
            }
            return player;
          }),
        };
        break;
      case "improvement-built":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
              propertyImprovements: event.tileId
                ? {
                    ...(player.propertyImprovements ?? {}),
                    [event.tileId]:
                      event.improvementLevel ??
                      ((player.propertyImprovements ?? {})[event.tileId] ?? 0) +
                        1,
                  }
                : (player.propertyImprovements ?? {}),
            }),
          ),
        };
        break;
      case "improvement-sold":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => {
              const nextImprovements = {
                ...(player.propertyImprovements ?? {}),
              };
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
                propertyImprovements: nextImprovements,
              };
            },
          ),
        };
        break;
      case "trade-proposed":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-trade-response",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingTrade:
            event.playerId && event.ownerPlayerId
              ? {
                  proposerPlayerId: event.playerId,
                  counterpartyPlayerId: event.ownerPlayerId,
                  offeredCash: event.offeredCash ?? 0,
                  requestedCash: event.requestedCash ?? 0,
                  offeredTileIds: event.offeredTileIds ?? [],
                  requestedTileIds: event.requestedTileIds ?? [],
                  offeredCardIds: event.offeredCardIds ?? [],
                  requestedCardIds: event.requestedCardIds ?? [],
                  snapshotVersion:
                    event.tradeSnapshotVersion ?? nextSnapshot.snapshotVersion,
                }
              : nextSnapshot.pendingTrade,
          pendingActionLabel: event.summary,
        };
        break;
      case "trade-accepted": {
        const pendingTrade =
          nextSnapshot.pendingTrade ??
          (event.playerId && event.ownerPlayerId
            ? {
                proposerPlayerId: event.playerId,
                counterpartyPlayerId: event.ownerPlayerId,
                offeredCash: event.offeredCash ?? 0,
                requestedCash: event.requestedCash ?? 0,
                offeredTileIds: event.offeredTileIds ?? [],
                requestedTileIds: event.requestedTileIds ?? [],
                offeredCardIds: event.offeredCardIds ?? [],
                requestedCardIds: event.requestedCardIds ?? [],
                snapshotVersion:
                  event.tradeSnapshotVersion ?? nextSnapshot.snapshotVersion,
              }
            : null);

        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingTrade: null,
          pendingActionLabel: "等待当前玩家掷骰",
          players: nextSnapshot.players.map((player) => {
            if (!pendingTrade) {
              return player;
            }

            const nextCash =
              event.cashAfterByPlayer?.[player.id] ?? player.cash;
            if (player.id === pendingTrade.proposerPlayerId) {
              return {
                ...player,
                cash: nextCash,
                properties: [
                  ...player.properties.filter(
                    (tileId) =>
                      !(pendingTrade.offeredTileIds ?? []).includes(tileId),
                  ),
                  ...(pendingTrade.requestedTileIds ?? []).filter(
                    (tileId) => !player.properties.includes(tileId),
                  ),
                ],
                mortgagedProperties: [
                  ...(player.mortgagedProperties ?? []).filter(
                    (tileId) =>
                      !(pendingTrade.offeredTileIds ?? []).includes(tileId),
                  ),
                  ...(pendingTrade.requestedTileIds ?? []).filter(
                    (tileId) =>
                      !(player.mortgagedProperties ?? []).includes(tileId) &&
                      (
                        nextSnapshot.players.find(
                          (candidate) =>
                            candidate.id === pendingTrade.counterpartyPlayerId,
                        )?.mortgagedProperties ?? []
                      ).includes(tileId),
                  ),
                ],
                heldCardIds: [
                  ...(player.heldCardIds ?? []).filter(
                    (cardId) =>
                      !(pendingTrade.offeredCardIds ?? []).includes(cardId),
                  ),
                  ...(pendingTrade.requestedCardIds ?? []).filter(
                    (cardId) => !(player.heldCardIds ?? []).includes(cardId),
                  ),
                ],
              };
            }
            if (player.id === pendingTrade.counterpartyPlayerId) {
              return {
                ...player,
                cash: nextCash,
                properties: [
                  ...player.properties.filter(
                    (tileId) =>
                      !(pendingTrade.requestedTileIds ?? []).includes(tileId),
                  ),
                  ...(pendingTrade.offeredTileIds ?? []).filter(
                    (tileId) => !player.properties.includes(tileId),
                  ),
                ],
                mortgagedProperties: [
                  ...(player.mortgagedProperties ?? []).filter(
                    (tileId) =>
                      !(pendingTrade.requestedTileIds ?? []).includes(tileId),
                  ),
                  ...(pendingTrade.offeredTileIds ?? []).filter(
                    (tileId) =>
                      !(player.mortgagedProperties ?? []).includes(tileId) &&
                      (
                        nextSnapshot.players.find(
                          (candidate) =>
                            candidate.id === pendingTrade.proposerPlayerId,
                        )?.mortgagedProperties ?? []
                      ).includes(tileId),
                  ),
                ],
                heldCardIds: [
                  ...(player.heldCardIds ?? []).filter(
                    (cardId) =>
                      !(pendingTrade.requestedCardIds ?? []).includes(cardId),
                  ),
                  ...(pendingTrade.offeredCardIds ?? []).filter(
                    (cardId) => !(player.heldCardIds ?? []).includes(cardId),
                  ),
                ],
              };
            }

            return player;
          }),
        };
        break;
      }
      case "trade-rejected":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          pendingTrade: null,
          pendingActionLabel: "等待当前玩家掷骰",
        };
        break;
      case "card-resolved":
        nextSnapshot = updateDeck(
          nextSnapshot,
          (event.deckKind as "chance" | "community") ?? "chance",
          event.cardId,
          event.cardDisposition,
        );
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash:
                event.cashAfterByPlayer?.[player.id] ??
                event.cashAfter ??
                player.cash,
              position: event.playerPosition ?? player.position,
              heldCardIds:
                event.cardDisposition === "held" &&
                event.cardId &&
                !(player.heldCardIds ?? []).includes(event.cardId)
                  ? [...(player.heldCardIds ?? []), event.cardId]
                  : (player.heldCardIds ?? []),
            }),
          ),
        };
        break;
      case "tax-paid":
        nextSnapshot = {
          ...nextSnapshot,
          pendingPayment: null,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
            }),
          ),
        };
        break;
      case "deficit-started": {
        const deficitReason = event.cardId
          ? "card"
          : event.ownerPlayerId
            ? "rent"
            : event.tileLabel === "监狱"
              ? "jail"
              : "tax";

        const pendingActionLabel =
          deficitReason === "rent"
            ? `当前玩家需补缴 ${event.amount ?? 0} 租金。`
            : deficitReason === "jail"
              ? `当前玩家需补缴 ${event.amount ?? 0} 监狱罚金。`
              : deficitReason === "card"
                ? `当前玩家需补缴 ${event.amount ?? 0} 卡牌费用。`
                : `当前玩家需补缴 ${event.amount ?? 0} 税费。`;

        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-deficit-resolution",
          currentTurnPlayerId: event.playerId ?? nextSnapshot.currentTurnPlayerId,
          pendingProperty: null,
          pendingAuction: null,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
            }),
          ),
          pendingPayment:
            event.amount !== undefined
              ? {
                  amount: event.amount,
                  reason: deficitReason,
                  creditorKind: event.ownerPlayerId ? "player" : "bank",
                  creditorPlayerId: event.ownerPlayerId,
                  sourceTileId: event.tileId,
                  sourceTileLabel: event.tileLabel,
                }
              : nextSnapshot.pendingPayment,
          pendingActionLabel,
        };
        break;
      }
      case "property-mortgaged":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              cash: event.cashAfter ?? player.cash,
              mortgagedProperties:
                event.tileId &&
                !(player.mortgagedProperties ?? []).includes(event.tileId)
                  ? [...(player.mortgagedProperties ?? []), event.tileId]
                  : (player.mortgagedProperties ?? []),
            }),
          ),
        };
        break;
      case "bankruptcy-declared":
        nextSnapshot = updateDecksForCardIds(
          nextSnapshot,
          event.returnedCardIds,
          "returned",
        );
        nextSnapshot = {
          ...nextSnapshot,
          pendingPayment: null,
          players: nextSnapshot.players.map((player) => {
            if (player.id === event.playerId) {
              return {
                ...player,
                cash: 0,
                properties: [],
                mortgagedProperties: [],
                propertyImprovements: {},
                heldCardIds: [],
                isBankrupt: true,
                inJail: false,
                jailTurnsServed: 0,
              };
            }

            if (player.id === event.ownerPlayerId) {
              const nextImprovements = {
                ...(player.propertyImprovements ?? {}),
              };
              for (const tileId of event.clearedImprovementTileIds ?? []) {
                delete nextImprovements[tileId];
              }

              return {
                ...player,
                cash: event.ownerCashAfter ?? player.cash,
                properties: [
                  ...player.properties,
                  ...(event.transferredPropertyIds ?? []).filter(
                    (tileId) => !player.properties.includes(tileId),
                  ),
                ],
                mortgagedProperties: [
                  ...(player.mortgagedProperties ?? []),
                  ...(event.transferredMortgagedPropertyIds ?? []).filter(
                    (tileId) =>
                      !(player.mortgagedProperties ?? []).includes(tileId),
                  ),
                ],
                heldCardIds: [
                  ...(player.heldCardIds ?? []),
                  ...(event.transferredCardIds ?? []).filter(
                    (cardId) => !(player.heldCardIds ?? []).includes(cardId),
                  ),
                ],
                propertyImprovements: nextImprovements,
              };
            }

            return player;
          }),
        };
        break;
      case "player-jailed":
        nextSnapshot = {
          ...nextSnapshot,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              inJail: true,
              jailTurnsServed: 0,
              position: event.playerPosition ?? player.position,
            }),
          ),
        };
        break;
      case "jail-roll-attempted":
        nextSnapshot = {
          ...nextSnapshot,
          lastRoll: event.lastRoll ?? nextSnapshot.lastRoll,
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              jailTurnsServed:
                event.releaseMethod === "roll"
                  ? 0
                  : (event.failedAttemptCount ?? player.jailTurnsServed ?? 0),
            }),
          ),
        };
        break;
      case "jail-card-used":
        nextSnapshot = updateDeck(
          nextSnapshot,
          (event.deckKind as "chance" | "community") ?? "chance",
          event.cardId,
          event.cardDisposition,
        );
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          pendingActionLabel: "等待当前玩家掷骰",
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              inJail: false,
              jailTurnsServed: 0,
              heldCardIds: event.cardId
                ? (player.heldCardIds ?? []).filter(
                    (cardId) => cardId !== event.cardId,
                  )
                : (player.heldCardIds ?? []),
            }),
          ),
        };
        break;
      case "jail-fine-paid":
        nextSnapshot = {
          ...nextSnapshot,
          turnState: "awaiting-roll",
          pendingPayment: null,
          pendingActionLabel: "等待当前玩家掷骰",
          players: updatePlayer(
            nextSnapshot.players,
            event.playerId,
            (player) => ({
              ...player,
              inJail: false,
              jailTurnsServed: 0,
              cash: event.cashAfter ?? player.cash,
            }),
          ),
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
          pendingProperty: null,
        };
        break;
      case "turn-advanced":
        nextSnapshot = {
          ...nextSnapshot,
          currentTurnPlayerId:
            event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId,
          turnState: nextSnapshot.players.find(
            (player) =>
              player.id ===
              (event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId),
          )?.inJail
            ? "awaiting-jail-decision"
            : "awaiting-roll",
          pendingProperty: null,
          pendingAuction: null,
          pendingPayment: null,
          pendingActionLabel: nextSnapshot.players.find(
            (player) =>
              player.id ===
              (event.nextPlayerId ?? nextSnapshot.currentTurnPlayerId),
          )?.inJail
            ? "当前玩家在监狱中，可尝试掷骰出狱、使用出狱卡或支付罚金。"
            : "等待当前玩家掷骰",
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
  const [projection, setProjection] = useState<ProjectionView>(
    toProjectionView(createEmptyProjection(roomId)),
  );
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
      setProjection(toProjectionView(createEmptyProjection(roomId)));
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

      if (!response.snapshot && requiresSnapshotRefresh(response.events)) {
        await refreshProjection();
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
        if (
          envelope.kind === "event" &&
          requiresSnapshotRefresh([envelope.event])
        ) {
          void refreshProjection();
          return;
        }

        setProjection((current) => toProjectionView(applyStreamEnvelope(current, envelope)));
        setIsFallback(false);
        setIsLoading(false);
        setError(null);
      },
      onError() {
        setError((current) => current ?? "实时同步中断，正在尝试恢复房间状态");
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
