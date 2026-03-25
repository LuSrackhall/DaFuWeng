import { sampleBoard } from "@dafuweng/board-config";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { acceptTrade, attemptJailRoll, buildImprovement, declareBankruptcy, declineProperty, mortgageProperty, passAuction, payJailFine, proposeTrade, purchaseProperty, rejectTrade, rollDice, sellImprovement, startRoom, submitAuctionBid, useJailCard } from "../../network/roomApi";
import { BoardScene } from "../../scene/board/BoardScene";
import { getActivePlayer } from "../../state/projection/activePlayer";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

type TradeComposerStep = "counterparty" | "offered" | "requested" | "review";
type PrimaryAnchorTone = "default" | "warning" | "danger" | "success";
type BoardResultFeedbackTone = PrimaryAnchorTone | "neutral";

type BoardResultFeedback = {
  eyebrowLabel: string;
  title: string;
  metaLabel: string;
  detail: string;
  nextLabel: string;
  diceLabel: string | null;
  chipLabel: string;
  chipValue: string;
  tone: BoardResultFeedbackTone;
};

type BoardStageCue = {
  eyebrowLabel: string;
  title: string;
  detail: string;
  diceLabel: string | null;
  accentTone: BoardResultFeedbackTone;
};

type BoardSceneTransitionHint = {
  transitionKey: string;
  eventSequence: number;
  snapshotVersion: number;
  eventType: string;
  actingPlayerId: string | null;
  diceLabel: string | null;
  diceTotal: number | null;
};

type BoardConsequenceCue = {
  key: string;
  eventType: "property-purchased" | "rent-charged" | "tax-paid" | "player-jailed";
  tone: BoardResultFeedbackTone;
  headline: string;
  amountLabel: string | null;
  spectatorLabel: string;
  anchorTileId: string | null;
  ariaSummary: string;
  primaryPlayerId: string | null;
  secondaryPlayerId: string | null;
};

type BoardTurnHandoffCue = {
  key: string;
  playerId: string;
  playerName: string;
  stageLabel: string;
  stageDetail: string;
  ariaSummary: string;
};

type BoardPhaseFocusCue = {
  key: string;
  phaseKind: "auction" | "trade-response" | "deficit";
  tone: BoardResultFeedbackTone;
  phaseLabel: string;
  headline: string;
  detail: string;
  pressureLabel: string;
  ariaSummary: string;
  primaryPlayerId: string | null;
  secondaryPlayerId: string | null;
  anchorTileId: string | null;
};

function buildBoardTurnHandoffStage(turnState: string, playerName: string, pendingActionLabel: string) {
  switch (turnState) {
    case "awaiting-roll":
      return {
        stageLabel: "等待掷骰",
        stageDetail: `现在轮到 ${playerName} 掷骰。`,
      };
    case "awaiting-jail-decision":
      return {
        stageLabel: "监狱决策",
        stageDetail: `现在轮到 ${playerName} 决定如何离开监狱。`,
      };
    case "awaiting-property-decision":
      return {
        stageLabel: "地产决策",
        stageDetail: `现在轮到 ${playerName} 决定是否处理当前地产。`,
      };
    default:
      return {
        stageLabel: "当前舞台",
        stageDetail: pendingActionLabel,
      };
  }
}

function buildPaymentReasonLabel(reason: "tax" | "jail" | "rent" | "card") {
  if (reason === "tax") {
    return "税费";
  }
  if (reason === "jail") {
    return "监狱罚金";
  }
  if (reason === "rent") {
    return "租金";
  }
  return "卡牌欠款";
}

type RecoveryRecapSnapshot = {
  token: number;
  title: string;
  detail: string;
  anchorLabel: string;
  eventSequence: number;
  meta: string;
};

function buildRecoveryRecapDetail(context: string) {
  const dividerIndex = context.indexOf("。 ");
  if (dividerIndex >= 0) {
    return context.slice(dividerIndex + 2).trim();
  }

  return context.trim();
}

function buildRecoveryAnchorPhaseLabel(roomState: string, turnState: string, hasWaitingRoomSummary: boolean) {
  if (hasWaitingRoomSummary || roomState === "lobby") {
    return "等待房间";
  }

  if (roomState === "finished") {
    return "对局结束";
  }

  switch (turnState) {
    case "awaiting-auction":
      return "公开拍卖";
    case "awaiting-trade-response":
      return "等待交易答复";
    case "awaiting-deficit-resolution":
      return "补齐欠款";
    case "awaiting-property-decision":
      return "地产决策";
    case "awaiting-jail-decision":
      return "监狱决策";
    case "awaiting-roll":
      return "等待掷骰";
    default:
      return "对局进行中";
  }
}

function buildRecoveryAnchorCopy(phaseLabel: string, eventSequence: number, isSpectator: boolean) {
  const phasePrefix = isSpectator ? "你继续看到的是" : "你回来的位置是";
  const progressLabel = eventSequence > 0
    ? `刚接到第 ${eventSequence} 条关键进展`
    : "系统刚把这一局追到眼前";
  return `${phasePrefix}${phaseLabel}，${progressLabel}`;
}

function buildReconnectRecoveryNarrative(options: {
  activePlayerId: string;
  currentTurnPlayerId: string;
  currentTurnPlayerName: string;
  isSpectator: boolean;
  latestSummary: string | null;
  pendingActionLabel: string;
  auctionSummary: {
    actingBidderId: string;
    actingBidderName: string;
    highestBid: number;
    highestBidderName: string | null;
    nextMinimumBid: number;
    lotLabel: string;
  } | null;
  tradeSummary: {
    proposerPlayerId: string;
    proposerName: string;
    counterpartyPlayerId: string;
    counterpartyName: string;
  } | null;
  activeJailCardCount: number;
  currentTurnJailCardCount: number;
  currentTurnJailAttempts: number;
  pendingProperty: { label: string; price: number } | null;
  resolutionSummary: { actorPlayerId: string; actorName: string; reasonLabel: string; shortfall: number } | null;
  turnState: string;
}) {
  const intro = options.latestSummary
    ? `刚刚补回：${options.latestSummary}`
    : "系统已把这局追到最新进度。";

  if (options.resolutionSummary) {
    const deficitActorLabel = !options.isSpectator && options.resolutionSummary.actorPlayerId === options.activePlayerId
      ? "现在轮到你"
      : `现在由 ${options.resolutionSummary.actorName}`;
    return `${intro} ${deficitActorLabel}处理${options.resolutionSummary.reasonLabel}欠款，还差 ${options.resolutionSummary.shortfall}。`;
  }

  if (options.pendingProperty) {
    const propertyActorLabel = !options.isSpectator && options.currentTurnPlayerId === options.activePlayerId
      ? "现在轮到你"
      : `现在轮到 ${options.currentTurnPlayerName}`;
    return `${intro} ${propertyActorLabel}决定是否以 ${options.pendingProperty.price} 买下 ${options.pendingProperty.label}。`;
  }

  if (options.auctionSummary) {
    const auctionActorLabel = !options.isSpectator && options.auctionSummary.actingBidderId === options.activePlayerId
      ? `现在轮到你决定是否至少以 ${options.auctionSummary.nextMinimumBid} 继续竞拍 ${options.auctionSummary.lotLabel}`
      : `现在轮到 ${options.auctionSummary.actingBidderName} 决定是否继续竞拍 ${options.auctionSummary.lotLabel}`;
    const highestBidLabel = options.auctionSummary.highestBidderName
      ? `，当前最高价是 ${options.auctionSummary.highestBidderName} 的 ${options.auctionSummary.highestBid}`
      : "，当前还没有领先报价";
    return `${intro} ${auctionActorLabel}${highestBidLabel}。`;
  }

  if (options.tradeSummary) {
    if (!options.isSpectator && options.tradeSummary.counterpartyPlayerId === options.activePlayerId) {
      return `${intro} 现在轮到你决定是否接受 ${options.tradeSummary.proposerName} 递来的交易报价。`;
    }

    if (!options.isSpectator && options.tradeSummary.proposerPlayerId === options.activePlayerId) {
      return `${intro} 你的报价已经送到 ${options.tradeSummary.counterpartyName} 面前，现在等待对方表态。`;
    }

    return `${intro} 现在等待 ${options.tradeSummary.counterpartyName} 回应 ${options.tradeSummary.proposerName} 的交易报价。`;
  }

  if (options.turnState === "awaiting-jail-decision") {
    const jailActorLabel = !options.isSpectator && options.currentTurnPlayerId === options.activePlayerId
      ? "现在轮到你决定如何离开监狱"
      : `现在轮到 ${options.currentTurnPlayerName} 决定如何离开监狱`;
    const jailOptions = !options.isSpectator && options.currentTurnPlayerId === options.activePlayerId
      ? `可选掷骰、支付 50 罚金${options.activeJailCardCount > 0 ? `或使用 ${options.activeJailCardCount} 张出狱卡` : ""}`
      : `${options.currentTurnPlayerName} 已有 ${options.currentTurnJailAttempts} 次尝试记录${options.currentTurnJailCardCount > 0 ? `，手上还有 ${options.currentTurnJailCardCount} 张出狱卡` : ""}`;
    return `${intro} ${jailActorLabel}，${jailOptions}。`;
  }

  if (options.turnState === "awaiting-roll") {
    const rollActorLabel = !options.isSpectator && options.currentTurnPlayerId === options.activePlayerId
      ? "现在轮到你继续掷骰。"
      : `当前轮到 ${options.currentTurnPlayerName} 掷骰。`;
    return `${intro} ${rollActorLabel}`;
  }

  if (!options.latestSummary) {
    return `${intro} ${options.pendingActionLabel}`;
  }

  return `${intro} 当前轮到 ${options.currentTurnPlayerName}。`;
}

export function GamePage() {
  const params = useParams();
  const roomId = params.roomId ?? "";
  const { projection, isFallback, isLoading, error, recoveryNotice, applySnapshot, refreshProjection } = useGameProjection(roomId);
  const [isMobileAnchorTray, setIsMobileAnchorTray] = useState(() => typeof window !== "undefined"
    ? window.matchMedia("(max-width: 960px)").matches
    : false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [auctionBid, setAuctionBid] = useState("200");
  const [tradeCounterpartyId, setTradeCounterpartyId] = useState("");
  const [tradeOfferedCash, setTradeOfferedCash] = useState("0");
  const [tradeRequestedCash, setTradeRequestedCash] = useState("0");
  const [tradeOfferedTileIds, setTradeOfferedTileIds] = useState<string[]>([]);
  const [tradeRequestedTileIds, setTradeRequestedTileIds] = useState<string[]>([]);
  const [tradeOfferedCardIds, setTradeOfferedCardIds] = useState<string[]>([]);
  const [tradeRequestedCardIds, setTradeRequestedCardIds] = useState<string[]>([]);
  const [tradeComposerStep, setTradeComposerStep] = useState<TradeComposerStep>("counterparty");
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isTurnToolsOpen, setIsTurnToolsOpen] = useState(false);
  const [mortgageBusyTileId, setMortgageBusyTileId] = useState<string | null>(null);
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);
  const [lastRecoveryRecap, setLastRecoveryRecap] = useState<RecoveryRecapSnapshot | null>(null);
  const [dismissingRecoveryRecapToken, setDismissingRecoveryRecapToken] = useState<number | null>(null);
  const recoveryRecapDismissTimerRef = useRef<number | null>(null);
  const presentation = usePresentationState(
    projection.currentTurnPlayerId,
    projection.players,
    projection.roomState,
    projection.pendingAuction,
    projection.pendingPayment,
  );
  const activePlayer = getActivePlayer(roomId);
  const activePlayerId = activePlayer?.playerId ?? "";
  const activePlayerName = activePlayer?.playerName ?? "观战者";
  const isSpectator = !activePlayer;
  const activeIdentityLabel = isSpectator
    ? "当前以只读观战身份查看此房间。"
    : `当前以 ${activePlayerName} 身份加入此房间。`;
  const canStartRoom = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "lobby"
    && activePlayerId === projection.hostId
    && projection.players.length >= 2;
  const canRoll = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-roll"
    && activePlayerId === projection.currentTurnPlayerId;
  const canResolveProperty = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-property-decision"
    && projection.pendingProperty !== null
    && activePlayerId === projection.currentTurnPlayerId;
  const canAuction = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-auction"
    && projection.pendingAuction !== null
    && activePlayerId === projection.currentTurnPlayerId;
  const canResolveJail = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-jail-decision"
    && activePlayerId === projection.currentTurnPlayerId;
  const canResolveDeficit = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-deficit-resolution"
    && projection.pendingPayment !== null
    && activePlayerId === projection.currentTurnPlayerId;
  const canManageImprovements = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-roll"
    && activePlayerId === projection.currentTurnPlayerId;
  const canProposeTrade = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-roll"
    && projection.pendingTrade === null
    && activePlayerId === projection.currentTurnPlayerId;
  const canResolveTrade = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.roomState === "in-game"
    && projection.turnState === "awaiting-trade-response"
    && projection.pendingTrade !== null
    && activePlayerId === projection.pendingTrade.counterpartyPlayerId;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 960px)");
    const updateMobileAnchorTray = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileAnchorTray(event.matches);
    };

    updateMobileAnchorTray(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMobileAnchorTray);

      return () => {
        mediaQuery.removeEventListener("change", updateMobileAnchorTray);
      };
    }

    mediaQuery.addListener(updateMobileAnchorTray);

    return () => {
      mediaQuery.removeListener(updateMobileAnchorTray);
    };
  }, []);

  const otherPlayers = projection.players.filter((player) => player.id !== activePlayerId && !player.isBankrupt);
  const boardTileById = new Map(sampleBoard.map((tile) => [tile.id, tile]));
  const boardTileLabels = new Map(sampleBoard.map((tile) => [tile.id, tile.label]));
  const cardLabels = new Map([
    ["chance-jail-card", "机会免狱卡"],
    ["community-jail-card", "命运免狱卡"],
  ]);
  const roomPhaseLabel = projection.roomState === "lobby"
    ? "等待房间"
    : projection.roomState === "finished"
      ? "对局结束"
      : projection.turnState === "awaiting-auction"
        ? "公开拍卖"
        : projection.turnState === "awaiting-trade-response"
          ? "等待交易答复"
        : projection.turnState === "awaiting-deficit-resolution"
          ? "补齐欠款"
          : "对局进行中";
  const recoveryAnchorPhaseLabel = buildRecoveryAnchorPhaseLabel(
    projection.roomState,
    projection.turnState,
    Boolean(projection.waitingRoomSummary),
  );
          const roomShellTitle = projection.waitingRoomSummary ? "等待开局" : roomPhaseLabel;
  const latestEventSummary = projection.recentEvents.at(-1)?.summary ?? "暂无最新事件。";
  const latestProjectionEvent = projection.recentEvents.at(-1) ?? null;
  const latestBoardConsequenceEvent = [...projection.recentEvents].reverse().find((event) =>
    event.type === "property-purchased"
    || event.type === "rent-charged"
    || event.type === "tax-paid"
    || event.type === "player-jailed",
  ) ?? null;
    const syncShellState = (() => {
      if (!isLoading && !isFallback && !error) {
        return null;
      }

      const tone = isFallback ? "danger" : isLoading ? "warning" : "default";
      const statusLabel = isFallback
        ? isLoading
          ? "还在接回这一局"
          : "这局暂时还没接上"
        : isLoading
          ? "正在把进度补到最新"
          : "连接刚刚晃了一下";
      const title = isFallback
        ? isLoading
          ? `正在接回 ${projection.roomId}`
          : "这局暂时还没恢复好"
        : isLoading
          ? "正在把这一局补到最新"
          : "刚刚和房间断了一下线";
      const summary = isFallback
        ? isLoading
          ? "房间页面已经打开，系统还在把你刚才那一局接回来。等会儿会继续补上你的身份和最新进展。"
          : "这一局的最新进度还没拿到，所以页面先只保留最基础的房间外壳。"
        : isLoading
          ? "你已经回到房间，牌局正在把最新进展接到眼前。"
          : "你眼前这份局面还是刚才最后一次成功接到的进度，系统正在继续把最新变化接回来。";
      const identityStatus = isSpectator
        ? "当前以观战视角查看"
        : `当前使用 ${activePlayerName} 的席位`;
      const actionStatus = isFallback
        ? "先别急着操作，等这一局重新接上再继续。"
        : isLoading
          ? "先等牌局补齐，马上就会回到当前轮次。"
          : isSpectator
            ? "先看住这局眼前的进度，等连接恢复后会继续刷新。"
            : "先看住眼前这一步，等连接恢复后再确认关键操作。";
      const stageCards = [
        { label: "步骤 1", value: "已经回到房间页面", active: !isFallback || isLoading },
        { label: "步骤 2", value: isFallback ? "继续找回这局最新进度" : "把这局补到最新", active: isLoading || isFallback },
        { label: "步骤 3", value: "继续接收最新变化", active: !isLoading && !!error },
      ];

      return {
        tone,
        statusLabel,
        title,
        summary,
        identityStatus,
        actionStatus,
        stageCards,
        freshnessLabel: "眼前这份就是目前接到的最新局面",
        latestLabel: isFallback ? "还在等这局的最新进度" : latestEventSummary,
        connectionLabel: error ?? statusLabel,
      };
    })();
  const reconnectSuccessMessage = recoveryNotice
    ? isSpectator
      ? "已重新连入牌局，可以继续旁观当前进展"
      : "已重新连入牌局，当前进度已同步"
    : null;
  const auctionSummary = projection.auctionSummary;
  const tradeSummary = projection.tradeSummary;
  const auctionQuickBidOptions = auctionSummary
    ? Array.from(new Set([
        auctionSummary.nextMinimumBid,
        auctionSummary.nextMinimumBid + 10,
        auctionSummary.nextMinimumBid + 50,
      ]))
    : [];
  const auctionViewerLabel = auctionSummary
    ? canAuction
      ? `轮到你出价或放弃，下一口至少 ${auctionSummary.nextMinimumBid}。`
      : isSpectator
        ? "当前仅观战，你可以看到完整拍卖过程，但不能参与出价。"
        : projection.pendingAuction?.passedPlayerIds.includes(activePlayerId)
          ? "你已放弃本轮竞拍，等待其余玩家完成拍卖。"
          : `当前轮到 ${auctionSummary.actingBidderName} 决策，你暂时只能等待。`
    : null;
  const selectedCounterparty = otherPlayers.find((player) => player.id === tradeCounterpartyId) ?? otherPlayers[0] ?? null;
  const draftTradeOfferedTileLabels = tradeOfferedTileIds.map((tileId) => boardTileLabels.get(tileId) ?? tileId);
  const draftTradeRequestedTileLabels = tradeRequestedTileIds.map((tileId) => boardTileLabels.get(tileId) ?? tileId);
  const draftTradeOfferedCardLabels = tradeOfferedCardIds.map((cardId) => cardLabels.get(cardId) ?? cardId);
  const draftTradeRequestedCardLabels = tradeRequestedCardIds.map((cardId) => cardLabels.get(cardId) ?? cardId);
  const tradeComposerSteps: Array<{ key: TradeComposerStep; label: string }> = [
    { key: "counterparty", label: "选对象" },
    { key: "offered", label: "选我给出" },
    { key: "requested", label: "选我索取" },
    { key: "review", label: "确认摘要" },
  ];
  const tradeStageViewerLabel = tradeSummary
    ? canResolveTrade
      ? `轮到你决定是否接受 ${tradeSummary.proposerName} 的报价。`
      : tradeSummary.proposerPlayerId === activePlayerId
        ? `报价已发出，当前等待 ${tradeSummary.counterpartyName} 回复。`
        : isSpectator
          ? "当前仅观战，你可以查看交易内容，但不能参与响应。"
          : `当前轮到 ${tradeSummary.counterpartyName} 决定，其他人保持只读。`
    : null;
  const isTradeProposerView = tradeSummary?.proposerPlayerId === activePlayerId;
  const isTradeCounterpartyView = canResolveTrade;
  const tradeWaitingHeadline = tradeSummary
    ? isTradeCounterpartyView
      ? "轮到你决定是否接受这笔报价"
      : isTradeProposerView
        ? "报价已送达，等待对手回应"
        : "房间暂停在交易回应阶段"
    : null;
  const tradeWaitingPrimarySummary = tradeSummary
    ? isTradeCounterpartyView
      ? `${tradeSummary.proposerName} 向你递来一笔交换，现在请你决定要不要答应。`
      : isTradeProposerView
        ? `你已经把这笔交换递给 ${tradeSummary.counterpartyName}，现在等对方表态。`
        : `当前正在等待 ${tradeSummary.counterpartyName} 回应 ${tradeSummary.proposerName} 的报价。`
    : null;
  const tradeWaitingCapabilityLabel = tradeSummary
    ? isTradeCounterpartyView
      ? "现在由你拍板: 接受或拒绝这笔交易"
      : isTradeProposerView
        ? "现在先别操作: 等对方给答复"
        : "你当前不能操作: 此阶段仅可查看交易内容"
    : null;
  const tradeWaitingOutcomeSummary = tradeSummary
    ? isTradeCounterpartyView
      ? "如果你点头，这笔交换会立刻生效；如果你摇头，对局会回到报价方继续行动。"
      : "如果对方点头，这笔交换会立刻生效；如果对方摇头，就会轮到你继续这一回合。"
    : null;
  const diagnosticsEventLines = projection.recentEvents.slice(-5).reverse();
  const activeProjectionPlayer = projection.players.find((player) => player.id === activePlayerId);
  const currentTurnProjectionPlayer = projection.players.find((player) => player.id === projection.currentTurnPlayerId);
  const resolutionActor = projection.players.find((player) => player.id === projection.currentTurnPlayerId);
  const activeJailCardCount = activeProjectionPlayer?.heldCardIds?.length ?? 0;
  const currentTurnJailCardCount = currentTurnProjectionPlayer?.heldCardIds?.length ?? 0;
  const reconnectSuccessContext = buildReconnectRecoveryNarrative({
    activePlayerId,
    currentTurnPlayerId: projection.currentTurnPlayerId,
    currentTurnPlayerName: projection.currentTurnPlayerName,
    isSpectator,
    latestSummary: latestProjectionEvent?.summary ?? null,
    pendingActionLabel: projection.pendingActionLabel,
    auctionSummary: auctionSummary
      ? {
        actingBidderId: auctionSummary.actingBidderId,
        actingBidderName: auctionSummary.actingBidderName,
        highestBid: auctionSummary.highestBid,
        highestBidderName: auctionSummary.highestBidderName,
        nextMinimumBid: auctionSummary.nextMinimumBid,
        lotLabel: auctionSummary.lotLabel,
      }
      : null,
    tradeSummary: tradeSummary
      ? {
        proposerPlayerId: tradeSummary.proposerPlayerId,
        proposerName: tradeSummary.proposerName,
        counterpartyPlayerId: tradeSummary.counterpartyPlayerId,
        counterpartyName: tradeSummary.counterpartyName,
      }
      : null,
    activeJailCardCount,
    currentTurnJailCardCount,
    currentTurnJailAttempts: currentTurnProjectionPlayer?.jailTurnsServed ?? 0,
    pendingProperty: projection.pendingProperty,
    resolutionSummary: projection.resolutionSummary
      ? {
        actorPlayerId: projection.resolutionSummary.actorPlayerId,
        actorName: projection.resolutionSummary.actorName,
        reasonLabel: projection.resolutionSummary.reasonLabel,
        shortfall: projection.resolutionSummary.shortfall,
      }
      : null,
    turnState: projection.turnState,
  });
  useEffect(() => {
    if (recoveryRecapDismissTimerRef.current !== null) {
      window.clearTimeout(recoveryRecapDismissTimerRef.current);
      recoveryRecapDismissTimerRef.current = null;
    }

    setDismissingRecoveryRecapToken(null);

    if (!recoveryNotice) {
      return;
    }

    setLastRecoveryRecap({
      token: recoveryNotice.token,
      title: latestProjectionEvent?.summary ?? "系统已把这局追到最新进度。",
      detail: buildRecoveryRecapDetail(reconnectSuccessContext),
      anchorLabel: buildRecoveryAnchorCopy(recoveryAnchorPhaseLabel, projection.eventSequence, isSpectator),
      eventSequence: projection.eventSequence,
      meta: isSpectator ? "当前仍为只读观战" : projection.pendingActionLabel,
    });
  }, [
    recoveryNotice?.token,
    latestProjectionEvent?.summary,
    reconnectSuccessContext,
    recoveryAnchorPhaseLabel,
    projection.eventSequence,
    isSpectator,
    projection.pendingActionLabel,
  ]);
  useEffect(() => {
    if (!lastRecoveryRecap || recoveryNotice) {
      return;
    }

    if (
      projection.eventSequence > lastRecoveryRecap.eventSequence
      && dismissingRecoveryRecapToken !== lastRecoveryRecap.token
    ) {
      setDismissingRecoveryRecapToken(lastRecoveryRecap.token);
      recoveryRecapDismissTimerRef.current = window.setTimeout(() => {
        setLastRecoveryRecap((current) => current?.token === lastRecoveryRecap.token ? null : current);
        setDismissingRecoveryRecapToken((current) => current === lastRecoveryRecap.token ? null : current);
        recoveryRecapDismissTimerRef.current = null;
      }, 220);
    }
  }, [projection.eventSequence, lastRecoveryRecap, recoveryNotice, dismissingRecoveryRecapToken]);
  useEffect(() => () => {
    if (recoveryRecapDismissTimerRef.current !== null) {
      window.clearTimeout(recoveryRecapDismissTimerRef.current);
    }
  }, []);
  const tradeNetCash = Number(tradeOfferedCash) - Number(tradeRequestedCash);
  const tradeNetCashLabel = tradeNetCash === 0
    ? "现金净流向: 无净变化"
    : tradeNetCash > 0
      ? `现金净流向: 你净支付 ${tradeNetCash} 给 ${selectedCounterparty?.name ?? "对手"}`
      : `现金净流向: ${selectedCounterparty?.name ?? "对手"} 净支付 ${Math.abs(tradeNetCash)} 给你`;

  function clearTradeDraft() {
    setTradeComposerStep("counterparty");
    setTradeOfferedCash("0");
    setTradeRequestedCash("0");
    setTradeOfferedTileIds([]);
    setTradeRequestedTileIds([]);
    setTradeOfferedCardIds([]);
    setTradeRequestedCardIds([]);
  }

  function getTradeBlockReason(tileId: string) {
    const tile = boardTileById.get(tileId);
    if (!tile?.colorGroup) {
      return null;
    }

    const blocked = projection.players.some((player) =>
      player.properties.some((propertyId) => {
        const propertyTile = boardTileById.get(propertyId);
        return propertyTile?.colorGroup === tile.colorGroup && (player.propertyImprovements?.[propertyId] ?? 0) > 0;
      }),
    );

    return blocked ? "同色组仍有建筑，当前不可交易" : null;
  }

  function describeProperty(tileId: string, playerId: string) {
    const labels: string[] = [];
    const player = projection.players.find((candidate) => candidate.id === playerId);
    if (player?.mortgagedProperties?.includes(tileId)) {
      labels.push("已抵押");
    }
    const level = player?.propertyImprovements?.[tileId] ?? 0;
    if (level > 0) {
      labels.push(`建筑 ${level}`);
    }
    return labels.join(" · ");
  }

  function toggleTradeSelection(assetId: string, selectedIds: string[], setSelectedIds: (next: string[]) => void, disabled: boolean) {
    if (disabled) {
      return;
    }

    setSelectedIds(
      selectedIds.includes(assetId)
        ? selectedIds.filter((currentId) => currentId !== assetId)
        : [...selectedIds, assetId],
    );
  }

  const offeredPropertyOptions = (activeProjectionPlayer?.properties ?? []).map((tileId) => ({
    id: tileId,
    label: boardTileLabels.get(tileId) ?? tileId,
    detail: describeProperty(tileId, activePlayerId),
    disabledReason: getTradeBlockReason(tileId),
  }));
  const requestedPropertyOptions = (selectedCounterparty?.properties ?? []).map((tileId) => ({
    id: tileId,
    label: boardTileLabels.get(tileId) ?? tileId,
    detail: describeProperty(tileId, selectedCounterparty.id),
    disabledReason: getTradeBlockReason(tileId),
  }));
  const offeredCardOptions = (activeProjectionPlayer?.heldCardIds ?? []).map((cardId) => ({
    id: cardId,
    label: cardLabels.get(cardId) ?? cardId,
    detail: "已持有卡牌",
    disabledReason: null as string | null,
  }));
  const requestedCardOptions = (selectedCounterparty?.heldCardIds ?? []).map((cardId) => ({
    id: cardId,
    label: cardLabels.get(cardId) ?? cardId,
    detail: "对手持有卡牌",
    disabledReason: null as string | null,
  }));
  const selectedOfferedProperties = offeredPropertyOptions.filter((option) => tradeOfferedTileIds.includes(option.id));
  const selectedRequestedProperties = requestedPropertyOptions.filter((option) => tradeRequestedTileIds.includes(option.id));
  const selectedOfferedCards = offeredCardOptions.filter((option) => tradeOfferedCardIds.includes(option.id));
  const selectedRequestedCards = requestedCardOptions.filter((option) => tradeRequestedCardIds.includes(option.id));
  const activePlayerCashAfterTrade = (activeProjectionPlayer?.cash ?? 0) - (Number(tradeOfferedCash) || 0) + (Number(tradeRequestedCash) || 0);
  const counterpartyCashAfterTrade = (selectedCounterparty?.cash ?? 0) - (Number(tradeRequestedCash) || 0) + (Number(tradeOfferedCash) || 0);
  const colorGroupTotals = new Map<string, number>();
  sampleBoard.forEach((tile) => {
    if (!tile.colorGroup) {
      return;
    }

    colorGroupTotals.set(tile.colorGroup, (colorGroupTotals.get(tile.colorGroup) ?? 0) + 1);
  });
  const activeCurrentProperties = new Set(activeProjectionPlayer?.properties ?? []);
  const counterpartyCurrentProperties = new Set(selectedCounterparty?.properties ?? []);
  const activeAfterTradeProperties = new Set(activeCurrentProperties);
  const counterpartyAfterTradeProperties = new Set(counterpartyCurrentProperties);
  tradeOfferedTileIds.forEach((tileId) => {
    activeAfterTradeProperties.delete(tileId);
    counterpartyAfterTradeProperties.add(tileId);
  });
  tradeRequestedTileIds.forEach((tileId) => {
    counterpartyAfterTradeProperties.delete(tileId);
    activeAfterTradeProperties.add(tileId);
  });
  const relevantTradeColorGroups = Array.from(new Set(
    [...tradeOfferedTileIds, ...tradeRequestedTileIds]
      .map((tileId) => boardTileById.get(tileId)?.colorGroup)
      .filter((colorGroup): colorGroup is string => Boolean(colorGroup)),
  ));
  const tradeRiskNotes = [
    ...relevantTradeColorGroups.flatMap((colorGroup) => {
      const total = colorGroupTotals.get(colorGroup) ?? 0;
      const activeBefore = Array.from(activeCurrentProperties).filter((tileId) => boardTileById.get(tileId)?.colorGroup === colorGroup).length === total;
      const activeAfter = Array.from(activeAfterTradeProperties).filter((tileId) => boardTileById.get(tileId)?.colorGroup === colorGroup).length === total;
      const counterpartyBefore = Array.from(counterpartyCurrentProperties).filter((tileId) => boardTileById.get(tileId)?.colorGroup === colorGroup).length === total;
      const counterpartyAfter = Array.from(counterpartyAfterTradeProperties).filter((tileId) => boardTileById.get(tileId)?.colorGroup === colorGroup).length === total;
      const label = `${colorGroup} 地段组`;
      const notes: string[] = [];

      if (!activeBefore && activeAfter) {
        notes.push(`成交后你将凑齐 ${label}`);
      }
      if (activeBefore && !activeAfter) {
        notes.push(`成交后你将失去 ${label}`);
      }
      if (!counterpartyBefore && counterpartyAfter) {
        notes.push(`成交后 ${selectedCounterparty?.name ?? "对手"} 将凑齐 ${label}`);
      }
      if (counterpartyBefore && !counterpartyAfter) {
        notes.push(`成交后 ${selectedCounterparty?.name ?? "对手"} 将失去 ${label}`);
      }

      return notes;
    }),
    ...(selectedRequestedProperties.filter((option) => option.detail.includes("已抵押")).length > 0
      ? [`你将收到已抵押资产: ${selectedRequestedProperties.filter((option) => option.detail.includes("已抵押")).map((option) => option.label).join(" / ")}`]
      : []),
    ...(selectedOfferedProperties.filter((option) => option.detail.includes("已抵押")).length > 0
      ? [`你将让出已抵押资产: ${selectedOfferedProperties.filter((option) => option.detail.includes("已抵押")).map((option) => option.label).join(" / ")}`]
      : []),
  ];
  const tradeCriticalConsequence = (Number(tradeOfferedCash) > 0
    || Number(tradeRequestedCash) > 0
    || tradeOfferedTileIds.length > 0
    || tradeRequestedTileIds.length > 0
    || tradeOfferedCardIds.length > 0
    || tradeRequestedCardIds.length > 0)
    ? `点下确认后，这笔报价就会送到 ${selectedCounterparty?.name ?? "对手"} 面前。房间会停下来等对方表态，这一步里你不能反悔。`
    : null;
  const resolutionPropertyOptions = (resolutionActor?.properties ?? []).map((tileId) => {
    const tile = boardTileById.get(tileId);
    const price = tile?.price ?? 0;
    const mortgageValue = price > 0 ? Math.floor(price / 2) : 0;
    const isMortgaged = resolutionActor?.mortgagedProperties?.includes(tileId) ?? false;
    const canMortgage = !isMortgaged && price > 0;
    const disabledReason = isMortgaged ? "已抵押" : price > 0 ? null : "当前不可抵押";
    const currentShortfall = projection.resolutionSummary?.shortfall ?? 0;
    const nextShortfall = Math.max(0, currentShortfall - mortgageValue);

    return {
      id: tileId,
      label: boardTileLabels.get(tileId) ?? tileId,
      mortgageValue,
      canMortgage,
      disabledReason,
      nextShortfall,
      settlesDeficit: canMortgage && nextShortfall === 0,
      detail: [describeProperty(tileId, resolutionActor?.id ?? ""), price > 0 ? `可回收 ${mortgageValue}` : ""]
        .filter(Boolean)
        .join(" · "),
    };
  });
  const mortgageablePropertyOptions = resolutionPropertyOptions.filter((option) => option.canMortgage);
  const blockedRecoveryPropertyOptions = resolutionPropertyOptions.filter((option) => !option.canMortgage);
  const bestRecoveryOption = mortgageablePropertyOptions.find((option) => option.settlesDeficit)
    ?? [...mortgageablePropertyOptions].sort((left, right) => right.mortgageValue - left.mortgageValue)[0]
    ?? null;
  const needsStepwiseRecovery = Boolean(bestRecoveryOption && !bestRecoveryOption.settlesDeficit);
  const deficitAnchorActionLabel = bestRecoveryOption
    ? needsStepwiseRecovery
      ? `下一步先抵押 ${bestRecoveryOption.label}`
      : `抵押 ${bestRecoveryOption.label}`
    : null;
  const deficitViewerLabel = projection.resolutionSummary
    ? canResolveDeficit
      ? needsStepwiseRecovery
        ? `轮到你处理这笔${projection.resolutionSummary.reasonLabel}欠款。这次恢复需要连续几步，锚点会在每次抵押后继续刷新下一步。`
        : `轮到你处理这笔${projection.resolutionSummary.reasonLabel}欠款。选择一项可抵押资产，或直接宣告破产。`
      : isSpectator
        ? `当前仅观战，等待 ${projection.resolutionSummary.actorName} 处理欠款。`
        : `当前由 ${projection.resolutionSummary.actorName} 处理欠款，其他人暂时只能等待。`
    : null;
  const boardResultFeedback: BoardResultFeedback | null = (() => {
    if (projection.latestSettlementSummary) {
      const settlement = projection.latestSettlementSummary;
      const chipValue = settlement.kind === "trade-accepted"
        ? "现金与资产已换手"
        : settlement.kind === "trade-rejected"
          ? "未发生资产转移"
          : settlement.kind === "auction-unsold"
            ? "产权仍未售出"
          : settlement.tone === "danger"
            ? "高压结果已生效"
            : "正式结果已落地";

      return {
        eyebrowLabel: settlement.kind === "trade-accepted"
          ? "结果达成"
          : settlement.tone === "danger"
            ? "危险结果"
            : "结果确认",
        title: settlement.title,
        metaLabel: settlement.kind === "trade-accepted"
          ? "收益与交换结果已落地"
          : settlement.kind === "trade-rejected"
            ? "报价失效 · 回合已交还"
            : settlement.kind === "auction-unsold"
              ? "拍卖未成交 · 产权仍未售出"
              : settlement.tone === "danger"
                ? "高压结果已生效"
                : "正式结果已记录",
        detail: settlement.detail,
        nextLabel: settlement.nextStepLabel,
        diceLabel: projection.lastRoll[0] || projection.lastRoll[1] ? `${projection.lastRoll[0]} + ${projection.lastRoll[1]}` : null,
        chipLabel: settlement.kind === "trade-accepted" ? "完成结果" : "确认结果",
        chipValue,
        tone: settlement.kind === "trade-accepted"
          ? "success"
          : settlement.tone === "danger"
            ? "danger"
            : "neutral",
      };
    }

    if (!latestProjectionEvent) {
      return null;
    }

    const actorName = latestProjectionEvent.playerId
      ? projection.players.find((player) => player.id === latestProjectionEvent.playerId)?.name ?? "当前玩家"
      : projection.currentTurnPlayerName;
    const ownerName = latestProjectionEvent.ownerPlayerId
      ? projection.players.find((player) => player.id === latestProjectionEvent.ownerPlayerId)?.name ?? "对手"
      : null;
    const diceLabel = latestProjectionEvent.lastRoll
      ? `${latestProjectionEvent.lastRoll[0]} + ${latestProjectionEvent.lastRoll[1]}`
      : projection.lastRoll[0] || projection.lastRoll[1]
        ? `${projection.lastRoll[0]} + ${projection.lastRoll[1]}`
        : null;

    switch (latestProjectionEvent.type) {
      case "property-purchased":
        return {
          eyebrowLabel: "结果达成",
          title: `${actorName} 买下 ${latestProjectionEvent.tileLabel ?? "地产"}`,
          metaLabel: "买地结果已落地",
          detail: `支付 ${latestProjectionEvent.amount ?? 0}，归属已经确认。`,
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "地产成交",
          chipValue: `现金 -${latestProjectionEvent.amount ?? 0}`,
          tone: "success" as const,
        };
      case "rent-charged":
        return {
          eyebrowLabel: "即时后果",
          title: `${actorName} 支付租金`,
          metaLabel: "现金结果已确认",
          detail: `${ownerName ?? "收租方"} 收到 ${latestProjectionEvent.amount ?? 0}，当前回合已继续推进。`,
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "现金后果",
          chipValue: `支出 ${latestProjectionEvent.amount ?? 0}`,
          tone: "warning" as const,
        };
      case "tax-paid":
        return {
          eyebrowLabel: "即时后果",
          title: `${actorName} 支付税费`,
          metaLabel: "税费结果已确认",
          detail: `向银行支付 ${latestProjectionEvent.amount ?? 0}，税费结算已完成。`,
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "现金后果",
          chipValue: `支出 ${latestProjectionEvent.amount ?? 0}`,
          tone: "warning" as const,
        };
      case "auction-settled":
        return {
          eyebrowLabel: "结果达成",
          title: `${actorName} 竞得 ${latestProjectionEvent.tileLabel ?? "拍品"}`,
          metaLabel: "拍卖成交已落地",
          detail: "本轮拍卖已经成交，产权与资金结果都已写入房间。",
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "拍卖结果",
          chipValue: `成交 ${latestProjectionEvent.amount ?? latestProjectionEvent.tilePrice ?? 0}`,
          tone: "success" as const,
        };
      case "property-mortgaged":
        return {
          eyebrowLabel: "即时后果",
          title: `${actorName} 抵押 ${latestProjectionEvent.tileLabel ?? "地产"}`,
          metaLabel: "恢复动作已生效",
          detail: "本次恢复动作已生效，房间会按新的缺口继续推进。",
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "现金回收",
          chipValue: `+${latestProjectionEvent.amount ?? 0}`,
          tone: "warning" as const,
        };
      case "improvement-built":
        return {
          eyebrowLabel: "结果达成",
          title: `${actorName} 开发 ${latestProjectionEvent.tileLabel ?? "地产"}`,
          metaLabel: "地产状态已升级",
          detail: `建筑等级已提升到 ${latestProjectionEvent.improvementLevel ?? 0}，后续租金也会跟着提高。`,
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "地产状态",
          chipValue: `建筑 ${latestProjectionEvent.improvementLevel ?? 0}`,
          tone: "success" as const,
        };
      case "player-jailed":
        return {
          eyebrowLabel: "危险结果",
          title: `${actorName} 进入监狱`,
          metaLabel: "高压状态已成立",
          detail: "本回合落点结果已经成立，后续将等待监狱决策。",
          nextLabel: projection.pendingActionLabel,
          diceLabel,
          chipLabel: "落点后果",
          chipValue: "监狱状态",
          tone: "danger" as const,
        };
      default:
        return diceLabel
          ? {
              eyebrowLabel: "最近结果",
              title: latestProjectionEvent.summary,
              metaLabel: "结果已经落到棋盘上",
              detail: `焦点地块 ${boardTileLabels.get(presentation.highlightedTileId ?? "") ?? latestProjectionEvent.tileLabel ?? "已更新"}，这一步已经落到当前棋盘。`,
              nextLabel: projection.pendingActionLabel,
              diceLabel,
              chipLabel: "最近骰子",
              chipValue: diceLabel,
              tone: "default" as const,
            }
          : null;
    }
  })();
  const boardStageCue: BoardStageCue | null = (() => {
    const diceLabel = projection.lastRoll[0] || projection.lastRoll[1]
      ? `${projection.lastRoll[0]} + ${projection.lastRoll[1]}`
      : null;

    if (projection.turnState === "awaiting-roll") {
      return {
        eyebrowLabel: activePlayerId === projection.currentTurnPlayerId && !isSpectator ? "回合骰台" : "等待掷骰",
        title: activePlayerId === projection.currentTurnPlayerId && !isSpectator
          ? `${activePlayerName} 的回合即将开启`
          : `等待 ${projection.currentTurnPlayerName} 掷骰`,
        detail: activePlayerId === projection.currentTurnPlayerId && !isSpectator
          ? "骰子落定后，棋局会立即揭示买地、事件结算或下一步高压决策。"
          : `${projection.currentTurnPlayerName} 完成掷骰后，当前棋盘才会正式揭晓下一步。`,
        diceLabel,
        accentTone: activePlayerId === projection.currentTurnPlayerId && !isSpectator ? "success" : "default",
      };
    }

    if (presentation.highlightedTileId) {
      return {
        eyebrowLabel: "棋盘焦点",
        title: boardTileLabels.get(presentation.highlightedTileId) ?? presentation.highlightedTileId,
        detail: projection.pendingActionLabel,
        diceLabel,
        accentTone: "default",
      };
    }

    return {
      eyebrowLabel: "对局进行中",
      title: projection.currentTurnPlayerName,
      detail: projection.pendingActionLabel,
      diceLabel,
      accentTone: "default",
    };
  })();
  const boardSceneTransitionHint: BoardSceneTransitionHint | null = latestProjectionEvent
    ? {
        transitionKey: `${projection.snapshotVersion}:${projection.eventSequence}:${latestProjectionEvent.type}`,
        eventSequence: projection.eventSequence,
        snapshotVersion: projection.snapshotVersion,
        eventType: latestProjectionEvent.type,
        actingPlayerId: latestProjectionEvent.playerId ?? null,
        diceLabel: latestProjectionEvent.lastRoll
          ? `${latestProjectionEvent.lastRoll[0]} + ${latestProjectionEvent.lastRoll[1]}`
          : projection.lastRoll[0] || projection.lastRoll[1]
            ? `${projection.lastRoll[0]} + ${projection.lastRoll[1]}`
            : null,
        diceTotal: latestProjectionEvent.lastRoll
          ? latestProjectionEvent.lastRoll[0] + latestProjectionEvent.lastRoll[1]
          : projection.lastRoll[0] || projection.lastRoll[1]
            ? projection.lastRoll[0] + projection.lastRoll[1]
            : null,
      }
    : null;
  const boardConsequenceCue: BoardConsequenceCue | null = (() => {
    if (!latestBoardConsequenceEvent) {
      return null;
    }

    const actorName = latestBoardConsequenceEvent.playerId
      ? projection.players.find((player) => player.id === latestBoardConsequenceEvent.playerId)?.name ?? "当前玩家"
      : projection.currentTurnPlayerName;
    const ownerName = latestBoardConsequenceEvent.ownerPlayerId
      ? projection.players.find((player) => player.id === latestBoardConsequenceEvent.ownerPlayerId)?.name ?? "对手"
      : null;
    const anchorTileId = latestBoardConsequenceEvent.tileId ?? presentation.highlightedTileId ?? null;

    switch (latestBoardConsequenceEvent.type) {
      case "property-purchased": {
        const tileLabel = latestBoardConsequenceEvent.tileLabel ?? "地产";
        const amount = latestBoardConsequenceEvent.amount
          ?? (anchorTileId ? boardTileById.get(anchorTileId)?.price ?? 0 : 0);
        return {
          key: `${latestBoardConsequenceEvent.sequence}:${latestBoardConsequenceEvent.type}`,
          eventType: "property-purchased",
          tone: "success",
          headline: `买下 ${tileLabel}`,
          amountLabel: `支出 ${amount}`,
          spectatorLabel: `${actorName} 已取得 ${tileLabel}`,
          anchorTileId,
          ariaSummary: `${actorName} 买下 ${tileLabel}，支付 ${amount}，归属已确认`,
          primaryPlayerId: latestBoardConsequenceEvent.playerId ?? null,
          secondaryPlayerId: null,
        };
      }
      case "rent-charged": {
        const amount = latestBoardConsequenceEvent.amount ?? 0;
        return {
          key: `${latestBoardConsequenceEvent.sequence}:${latestBoardConsequenceEvent.type}`,
          eventType: "rent-charged",
          tone: "warning",
          headline: "支付租金",
          amountLabel: `${ownerName ?? "收租方"} +${amount}`,
          spectatorLabel: `${actorName} 向 ${ownerName ?? "收租方"} 支付租金 ${amount}`,
          anchorTileId,
          ariaSummary: `${actorName} 向 ${ownerName ?? "收租方"} 支付租金 ${amount}`,
          primaryPlayerId: latestBoardConsequenceEvent.playerId ?? null,
          secondaryPlayerId: latestBoardConsequenceEvent.ownerPlayerId ?? null,
        };
      }
      case "tax-paid": {
        const amount = latestBoardConsequenceEvent.amount ?? 0;
        return {
          key: `${latestBoardConsequenceEvent.sequence}:${latestBoardConsequenceEvent.type}`,
          eventType: "tax-paid",
          tone: "warning",
          headline: "支付税费",
          amountLabel: `银行 +${amount}`,
          spectatorLabel: `${actorName} 已向银行支付税费 ${amount}`,
          anchorTileId,
          ariaSummary: `${actorName} 向银行支付税费 ${amount}`,
          primaryPlayerId: latestBoardConsequenceEvent.playerId ?? null,
          secondaryPlayerId: null,
        };
      }
      case "player-jailed": {
        return {
          key: `${latestBoardConsequenceEvent.sequence}:${latestBoardConsequenceEvent.type}`,
          eventType: "player-jailed",
          tone: "danger",
          headline: "进入监狱",
          amountLabel: "行动受限",
          spectatorLabel: `${actorName} 已进入监狱，等待后续监狱决策`,
          anchorTileId,
          ariaSummary: `${actorName} 已进入监狱，后续等待监狱决策`,
          primaryPlayerId: latestBoardConsequenceEvent.playerId ?? null,
          secondaryPlayerId: null,
        };
      }
      default:
        return null;
    }
  })();
  const boardTurnHandoffCue: BoardTurnHandoffCue | null = latestProjectionEvent?.type === "turn-advanced"
    ? (() => {
        const nextPlayerId = latestProjectionEvent.nextPlayerId ?? projection.currentTurnPlayerId;
        const nextPlayerName = projection.players.find((player) => player.id === nextPlayerId)?.name ?? projection.currentTurnPlayerName;
        const handoffStage = buildBoardTurnHandoffStage(projection.turnState, nextPlayerName, projection.pendingActionLabel);

        return {
          key: `${latestProjectionEvent.sequence}:${latestProjectionEvent.type}`,
          playerId: nextPlayerId,
          playerName: nextPlayerName,
          stageLabel: handoffStage.stageLabel,
          stageDetail: handoffStage.stageDetail,
          ariaSummary: `${nextPlayerName} 接过当前回合，${handoffStage.stageDetail}`,
        };
      })()
    : null;
  const boardPhaseFocusCue: BoardPhaseFocusCue | null = (() => {
    if (projection.turnState === "awaiting-auction" && projection.pendingAuction) {
      const pendingAuction = projection.pendingAuction;
      const activeBidderId = projection.currentTurnPlayerId;
      const activeBidderName = projection.players.find((player) => player.id === activeBidderId)?.name ?? projection.currentTurnPlayerName;
      const highestBidderName = pendingAuction.highestBidderId
        ? projection.players.find((player) => player.id === pendingAuction.highestBidderId)?.name ?? "领先玩家"
        : null;
      const hasLeadingBid = pendingAuction.highestBidderId !== null;

      return {
        key: `${projection.snapshotVersion}:${projection.eventSequence}:auction-focus`,
        phaseKind: "auction",
        tone: "warning",
        phaseLabel: "公开拍卖",
        headline: pendingAuction.label,
        detail: hasLeadingBid
          ? `当前轮到 ${activeBidderName} 决定是否继续竞拍，${highestBidderName} 以 ${pendingAuction.highestBid} 领先。`
          : `当前轮到 ${activeBidderName} 为 ${pendingAuction.label} 开出第一口价。`,
        pressureLabel: hasLeadingBid
          ? `当前领先 ${highestBidderName} · ${pendingAuction.highestBid}`
          : "当前最低 1",
        ariaSummary: hasLeadingBid
          ? `公开拍卖，当前轮到 ${activeBidderName} 决定 ${pendingAuction.label}，${highestBidderName} 以 ${pendingAuction.highestBid} 领先`
          : `公开拍卖，当前轮到 ${activeBidderName} 为 ${pendingAuction.label} 开价`,
        primaryPlayerId: activeBidderId,
        secondaryPlayerId: pendingAuction.highestBidderId,
        anchorTileId: pendingAuction.tileId,
      };
    }

    if (projection.turnState === "awaiting-trade-response" && projection.pendingTrade) {
      const responderId = projection.pendingTrade.counterpartyPlayerId;
      const proposerId = projection.pendingTrade.proposerPlayerId;
      const responderName = projection.players.find((player) => player.id === responderId)?.name ?? "对手";
      const proposerName = projection.players.find((player) => player.id === proposerId)?.name ?? "提议方";
      const offeredAssetCount = projection.pendingTrade.offeredTileIds.length + projection.pendingTrade.offeredCardIds.length;
      const requestedAssetCount = projection.pendingTrade.requestedTileIds.length + projection.pendingTrade.requestedCardIds.length;
      const pressureLabel = projection.pendingTrade.offeredCash || projection.pendingTrade.requestedCash
        ? `现金差 ${projection.pendingTrade.offeredCash} / ${projection.pendingTrade.requestedCash}`
        : `资产交换 ${offeredAssetCount} / ${requestedAssetCount}`;
      const anchorTileId = projection.pendingTrade.offeredTileIds[0]
        ?? projection.pendingTrade.requestedTileIds[0]
        ?? null;

      return {
        key: `${projection.snapshotVersion}:${projection.eventSequence}:trade-focus`,
        phaseKind: "trade-response",
        tone: "warning",
        phaseLabel: "交易回应",
        headline: `${responderName} 等待拍板`,
        detail: `${responderName} 正在回应 ${proposerName} 的报价，房间暂停等待这一次双边表态。`,
        pressureLabel,
        ariaSummary: `交易回应，当前轮到 ${responderName} 回应 ${proposerName} 的报价`,
        primaryPlayerId: responderId,
        secondaryPlayerId: proposerId,
        anchorTileId,
      };
    }

    if (projection.turnState === "awaiting-deficit-resolution" && projection.pendingPayment) {
      const pendingPayment = projection.pendingPayment;
      const debtorId = projection.currentTurnPlayerId;
      const debtorName = projection.players.find((player) => player.id === debtorId)?.name ?? projection.currentTurnPlayerName;
      const creditorName = pendingPayment.creditorKind === "player" && pendingPayment.creditorPlayerId
        ? projection.players.find((player) => player.id === pendingPayment.creditorPlayerId)?.name ?? "债权方"
        : "银行";
      const reasonLabel = buildPaymentReasonLabel(pendingPayment.reason);

      return {
        key: `${projection.snapshotVersion}:${projection.eventSequence}:deficit-focus`,
        phaseKind: "deficit",
        tone: "danger",
        phaseLabel: "补齐欠款",
        headline: `${debtorName} 正在补款`,
        detail: `${debtorName} 需要先向 ${creditorName} 补齐 ${pendingPayment.amount} ${reasonLabel}，当前回合会停在恢复步骤。`,
        pressureLabel: `仍需 ${pendingPayment.amount}`,
        ariaSummary: `欠款恢复，当前轮到 ${debtorName} 处理 ${pendingPayment.amount} ${reasonLabel}欠款`,
        primaryPlayerId: debtorId,
        secondaryPlayerId: pendingPayment.creditorKind === "player" ? (pendingPayment.creditorPlayerId ?? null) : null,
        anchorTileId: pendingPayment.sourceTileId ?? null,
      };
    }

    return null;
  })();
  const mobilePrimaryAnchorStyle = isMobileAnchorTray
    ? {
        position: "fixed" as const,
        left: "18px",
        right: "18px",
        bottom: "12px",
        zIndex: 12,
        margin: 0,
        maxHeight: "min(42vh, 320px)",
        overflowY: "auto" as const,
        overscrollBehavior: "contain" as const,
        boxShadow: "0 26px 44px rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(18px)",
      }
    : undefined;
  const overviewProgressLabel = projection.latestSettlementSummary
    ? "当前正式结果见下方最近结果卡。"
    : latestEventSummary;

  useEffect(() => {
    if (!tradeCounterpartyId && otherPlayers.length > 0) {
      setTradeCounterpartyId(otherPlayers[0].id);
    }
  }, [otherPlayers, tradeCounterpartyId]);

  useEffect(() => {
    const selectableOfferedTileIds = new Set(
      offeredPropertyOptions
        .filter((option) => !option.disabledReason)
        .map((option) => option.id),
    );
    setTradeOfferedTileIds((current) => current.filter((tileId) => selectableOfferedTileIds.has(tileId)));
    const selectableRequestedTileIds = new Set(
      requestedPropertyOptions
        .filter((option) => !option.disabledReason)
        .map((option) => option.id),
    );
    setTradeRequestedTileIds((current) => current.filter((tileId) => selectableRequestedTileIds.has(tileId)));
    const selectableOfferedCardIds = new Set(offeredCardOptions.map((option) => option.id));
    setTradeOfferedCardIds((current) => current.filter((cardId) => selectableOfferedCardIds.has(cardId)));
    const selectableRequestedCardIds = new Set(requestedCardOptions.map((option) => option.id));
    setTradeRequestedCardIds((current) => current.filter((cardId) => selectableRequestedCardIds.has(cardId)));
  }, [offeredPropertyOptions, requestedPropertyOptions, offeredCardOptions, requestedCardOptions]);

  useEffect(() => {
    if (!auctionSummary) {
      return;
    }

    const nextMinimumBid = auctionSummary.nextMinimumBid;
    if (Number(auctionBid) < nextMinimumBid) {
      setAuctionBid(String(nextMinimumBid));
    }
  }, [auctionSummary?.lotTileId, auctionSummary?.nextMinimumBid, auctionBid]);

  async function handleStartRoom() {
    if (!projection.hostId) {
      setActionMessage("当前房间缺少房主信息。");
      return;
    }

    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await startRoom(roomId, { hostId: projection.hostId });
      applySnapshot(snapshot);
      setActionMessage("房主已开始本局。所有玩家现在都会看到同一局面。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "开始房间失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleRollDice() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await rollDice(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage(`${activePlayerName} 的掷骰结果已经记下。`);
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "掷骰失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleResolveProperty(decision: "purchase" | "decline") {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const request = {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      };
      const snapshot = decision === "purchase"
        ? await purchaseProperty(roomId, request)
        : await declineProperty(roomId, request);
      applySnapshot(snapshot);
      setActionMessage(decision === "purchase" ? "这次买地结果已经记下。" : "这次放弃买地已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "地产决策失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleAuction(action: "bid" | "pass") {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const request = {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      };
      const snapshot = action === "bid"
        ? await submitAuctionBid(roomId, { ...request, amount: Number(auctionBid) })
        : await passAuction(roomId, request);
      applySnapshot(snapshot);
      setActionMessage(action === "bid" ? "这次出价已经送到房间里。" : "你已放弃这一轮竞拍。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "拍卖操作失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleJailRelease() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await payJailFine(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage("这次出狱结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "出狱失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleJailRoll() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await attemptJailRoll(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage("这次出狱掷骰结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "出狱掷骰失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleUseJailCard() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await useJailCard(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage("这次出狱卡结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "使用出狱卡失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleMortgage(tileId: string) {
    setIsSubmittingCommand(true);
    setMortgageBusyTileId(tileId);
    setActionMessage(null);

    try {
      const snapshot = await mortgageProperty(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID(),
        tileId
      });
      applySnapshot(snapshot);
      setActionMessage("这次抵押结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "抵押失败");
      await refreshProjection();
    } finally {
      setMortgageBusyTileId(null);
      setIsSubmittingCommand(false);
    }
  }

  async function handleBankruptcy() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await declareBankruptcy(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage("这次破产结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "宣告破产失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleImprovement(action: "build" | "sell", tileId: string) {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const request = {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID(),
        tileId
      };
      const snapshot = action === "build"
        ? await buildImprovement(roomId, request)
        : await sellImprovement(roomId, request);
      applySnapshot(snapshot);
      setActionMessage(action === "build" ? "这次建房结果已经记下。" : "这次卖房结果已经记下。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : action === "build" ? "建房失败" : "卖房失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleProposeTrade() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await proposeTrade(roomId, {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID(),
        counterpartyPlayerId: tradeCounterpartyId,
        offeredCash: Number(tradeOfferedCash) || 0,
        requestedCash: Number(tradeRequestedCash) || 0,
        offeredTileIds: tradeOfferedTileIds,
        requestedTileIds: tradeRequestedTileIds,
        offeredCardIds: tradeOfferedCardIds,
        requestedCardIds: tradeRequestedCardIds
      });
      applySnapshot(snapshot);
      clearTradeDraft();
      setIsTurnToolsOpen(false);
      setActionMessage("报价已经送到对方面前。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "交易报价失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  async function handleResolveTrade(action: "accept" | "reject") {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const payload = {
        playerId: activePlayerId,
        idempotencyKey: crypto.randomUUID()
      };
      const snapshot = action === "accept"
        ? await acceptTrade(roomId, payload)
        : await rejectTrade(roomId, payload);
      applySnapshot(snapshot);
      setActionMessage(action === "accept" ? "这笔交换已经成交。" : "这笔交换没有谈成。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "交易处理失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  const developmentTiles = sampleBoard.filter((tile) => (activeProjectionPlayer?.properties ?? []).includes(tile.id) && tile.buildCost !== undefined);
  const hasDevelopmentTools = canManageImprovements && developmentTiles.length > 0;
  const hasTradeTool = canProposeTrade;
  const hasTurnTools = !projection.waitingRoomSummary
    && !auctionSummary
    && !projection.resolutionSummary
    && !tradeSummary
    && projection.turnState === "awaiting-roll"
    && (hasDevelopmentTools || hasTradeTool);
  const hasTradeDraft = Number(tradeOfferedCash) > 0
    || Number(tradeRequestedCash) > 0
    || tradeOfferedTileIds.length > 0
    || tradeRequestedTileIds.length > 0
    || tradeOfferedCardIds.length > 0
    || tradeRequestedCardIds.length > 0;

  useEffect(() => {
    if (!hasTurnTools) {
      setIsTurnToolsOpen(false);
    }
  }, [hasTurnTools]);

  useEffect(() => {
    if (!hasTradeTool) {
      setTradeComposerStep("counterparty");
    }
  }, [hasTradeTool]);

  function renderPrimaryActionAnchor() {
    let title = "等待房间推进";
    let summary = projection.pendingActionLabel;
    let hint = isSpectator
      ? "当前仅观战，你可以查看房间推进状态，但不能替玩家操作。"
      : `当前由 ${projection.currentTurnPlayerName} 行动，你暂时只能等待。`;
    let consequence = "完成当前主动作后，房间会推进到下一步。";
    let tone: PrimaryAnchorTone = "default";
    let actions: ReactNode = null;
    const isAwaitingRoll = projection.turnState === "awaiting-roll";

    if (projection.waitingRoomSummary) {
      title = canStartRoom ? "现在由房主推进开局" : "等待房间准备完成";
      summary = projection.waitingRoomSummary.canStart
        ? "玩家已就位，开始后会一起进入第一回合。"
        : projection.waitingRoomSummary.blockerLabel;
      hint = isSpectator
        ? "当前仅观战，你可以查看席位和房间准备状态。"
        : activePlayerId === projection.hostId
          ? projection.waitingRoomSummary.canStart
            ? "这是当前唯一需要推进房间的动作。"
            : "先满足人数或席位条件，房间才能开始。"
          : `等待 ${projection.waitingRoomSummary.hostName} 在条件满足后开始本局。`;
      consequence = "开始后，房间会立即切入首个行动回合。";
      tone = projection.waitingRoomSummary.canStart ? "success" : "warning";
      actions = canStartRoom ? (
        <div className="lobby__actions">
          <button className="button button--primary" type="button" onClick={handleStartRoom} disabled={!canStartRoom}>
            {isSubmittingCommand && canStartRoom ? "开始中..." : "房主开始游戏"}
          </button>
        </div>
      ) : null;
    } else if (tradeSummary) {
      title = canResolveTrade
        ? "现在由你拍板这笔交易"
        : isTradeProposerView
          ? "当前等待对手回应交易"
          : "房间暂停在交易回应上";
      summary = canResolveTrade
        ? `报价来自 ${tradeSummary.proposerName}，现在需要你明确接受或拒绝。`
        : isTradeProposerView
          ? `你的报价已经送达 ${tradeSummary.counterpartyName}，当前主动作已转到对方。`
          : `当前正在等待 ${tradeSummary.counterpartyName} 回复这笔报价。`;
      hint = tradeWaitingCapabilityLabel ?? tradeStageViewerLabel ?? "当前先查看交易细节。";
      consequence = tradeWaitingOutcomeSummary ?? tradeSummary.outcomePreviewLabel;
      tone = canResolveTrade ? "warning" : "default";
      actions = canResolveTrade ? (
        <div className="lobby__actions">
          <button className="button button--primary" type="button" onClick={() => handleResolveTrade("accept")} disabled={!canResolveTrade}>
            接受交易
          </button>
          <button className="button button--secondary button--danger" type="button" onClick={() => handleResolveTrade("reject")} disabled={!canResolveTrade}>
            拒绝交易
          </button>
        </div>
      ) : null;
    } else if (auctionSummary) {
      title = canAuction ? "当前轮到你完成竞拍动作" : `等待 ${auctionSummary.actingBidderName} 决定竞拍`;
      summary = auctionSummary.statusLabel;
      hint = canAuction
        ? `你可以直接在这里提交出价或放弃竞拍，当前最低有效报价为 ${auctionSummary.nextMinimumBid}。`
        : auctionViewerLabel ?? "请先查看下方拍卖面板。";
      consequence = auctionSummary.highestBidderName
        ? `当前最高报价为 ${auctionSummary.highestBid}，完成本轮后拍卖会继续推进。`
        : `下一口至少 ${auctionSummary.nextMinimumBid}，完成本轮后拍卖会继续推进。`;
      tone = canAuction ? "warning" : "default";
      actions = canAuction ? (
        <>
          <div className="auction-quick-bids room-primary-anchor__quick-bids">
            {auctionQuickBidOptions.map((amount) => (
              <button
                className="button button--secondary"
                key={`anchor-auction-${amount}`}
                type="button"
                onClick={() => setAuctionBid(String(amount))}
              >
                出价 {amount}
              </button>
            ))}
          </div>
          <label className="auction-stage__field room-primary-anchor__field">
            <strong>当前出价</strong>
            <input value={auctionBid} onChange={(event) => setAuctionBid(event.target.value)} />
          </label>
          <div className="lobby__actions">
            <button className="button button--primary" type="button" onClick={() => handleAuction("bid")} disabled={!canAuction}>
              提交出价
            </button>
            <button className="button button--secondary button--danger" type="button" onClick={() => handleAuction("pass")} disabled={!canAuction}>
              放弃本轮竞拍
            </button>
          </div>
        </>
      ) : null;
    } else if (projection.resolutionSummary) {
      title = canResolveDeficit ? "当前轮到你完成欠款恢复" : `等待 ${projection.resolutionSummary.actorName} 处理欠款`;
      summary = projection.resolutionSummary.consequenceLabel;
      hint = deficitViewerLabel ?? "请先查看下方恢复面板中的可执行动作。";
      consequence = bestRecoveryOption
        ? bestRecoveryOption.settlesDeficit
          ? `下一步建议：抵押 ${bestRecoveryOption.label} 后即可补足当前欠款。`
          : `下一步建议：先抵押 ${bestRecoveryOption.label}，完成后仍差 ${bestRecoveryOption.nextShortfall}，锚点会继续刷新后续恢复动作。`
        : `当前仍差 ${projection.resolutionSummary.shortfall}，请在下方恢复面板完成抵押或破产决定。`;
      tone = "danger";
      actions = canResolveDeficit ? (
        <div className="lobby__actions room-primary-anchor__critical-actions">
          {bestRecoveryOption && deficitAnchorActionLabel ? (
            <button
              className="button button--primary"
              type="button"
              onClick={() => handleMortgage(bestRecoveryOption.id)}
              disabled={!canResolveDeficit || mortgageBusyTileId === bestRecoveryOption.id}
            >
              {mortgageBusyTileId === bestRecoveryOption.id ? `抵押 ${bestRecoveryOption.label}...` : deficitAnchorActionLabel}
            </button>
          ) : null}
          <button className="button button--secondary button--danger" type="button" onClick={handleBankruptcy} disabled={!canResolveDeficit}>
            宣告破产
          </button>
        </div>
      ) : null;
    } else {
      const isAwaitingProperty = projection.turnState === "awaiting-property-decision" && projection.pendingProperty !== null;
      const isAwaitingJail = projection.turnState === "awaiting-jail-decision";
      const isActiveTurnPlayer = activePlayerId === projection.currentTurnPlayerId;

      if (isAwaitingProperty && projection.pendingProperty) {
        title = canResolveProperty ? "现在由你决定是否买下地产" : `等待 ${projection.currentTurnPlayerName} 决定是否买地`;
        summary = `${projection.pendingProperty.label} · 价格 ${projection.pendingProperty.price}`;
        hint = canResolveProperty
          ? "这一步会直接决定这块地产是被你买下，还是进入后续公开处置。"
          : `当前由 ${projection.currentTurnPlayerName} 决定是否购买这块地产。`;
        consequence = canResolveProperty
          ? "买下后所有权会立刻归你；放弃后房间会继续推进到下一处理。"
          : "等待当前玩家拍板后，房间会进入下一步。";
        tone = canResolveProperty ? "warning" : "default";
        actions = canResolveProperty ? (
          <div className="lobby__actions">
            <button className="button button--primary" type="button" onClick={() => handleResolveProperty("purchase")} disabled={!canResolveProperty}>
              购买地产
            </button>
            <button className="button button--secondary" type="button" onClick={() => handleResolveProperty("decline")} disabled={!canResolveProperty}>
              放弃购买
            </button>
          </div>
        ) : null;
      } else if (isAwaitingJail) {
        title = canResolveJail ? "现在由你决定如何离开监狱" : `等待 ${projection.currentTurnPlayerName} 处理监狱决策`;
        summary = canResolveJail
          ? "选择一种出狱方式后，当前回合才能继续推进。"
          : `${projection.currentTurnPlayerName} 正在处理出狱决策。`;
        hint = canResolveJail
          ? "你可以支付罚金、尝试掷骰，或使用现有出狱卡。"
          : isSpectator
            ? `当前仅观战，等待 ${projection.currentTurnPlayerName} 处理出狱决策。`
            : `当前由 ${projection.currentTurnPlayerName} 决定如何离开监狱。`;
        consequence = currentTurnJailCardCount > 0 ? `当前可用出狱卡: ${currentTurnJailCardCount}` : "当前没有可用出狱卡。";
        tone = canResolveJail ? "warning" : "default";
        actions = canResolveJail ? (
          <div className="lobby__actions">
            <button className="button button--primary" type="button" onClick={handleJailRoll} disabled={!canResolveJail}>
              尝试掷骰出狱
            </button>
            <button className="button button--secondary" type="button" onClick={handleJailRelease} disabled={!canResolveJail}>
              支付 50 罚金
            </button>
            {activeJailCardCount > 0 ? (
              <button className="button button--secondary" type="button" onClick={handleUseJailCard} disabled={!canResolveJail}>
                使用出狱卡
              </button>
            ) : null}
          </div>
        ) : null;
      } else if (isAwaitingRoll) {
        title = isActiveTurnPlayer ? "现在先完成本回合掷骰" : `等待 ${projection.currentTurnPlayerName} 先掷骰`;
        summary = isActiveTurnPlayer
          ? "这是当前唯一必须先完成的主操作。"
          : `${projection.currentTurnPlayerName} 仍未完成本回合的掷骰。`;
        hint = isActiveTurnPlayer
          ? canProposeTrade
            ? "完成掷骰后，你再决定是否进入交易或经营动作。"
            : "完成掷骰后，房间才会揭示下一步的正式决策。"
          : isSpectator
            ? `当前仅观战，等待 ${projection.currentTurnPlayerName} 先完成掷骰。`
            : `当前由 ${projection.currentTurnPlayerName} 行动，你暂时只能等待。`;
        consequence = isActiveTurnPlayer
          ? "掷骰后，房间会继续进入买地、事件结算或其他下一步。"
          : "等待当前玩家掷骰后，房间会继续推进。";
        tone = isActiveTurnPlayer ? "success" : "default";
        actions = canRoll ? (
          <div className="lobby__actions room-primary-anchor__actions">
            <button className="button button--primary" type="button" onClick={handleRollDice} disabled={!canRoll}>
              {isSubmittingCommand && canRoll ? "进行中..." : `以 ${activePlayerName} 身份掷骰`}
            </button>
          </div>
        ) : null;
      }
    }

    return (
      <section
        className={`player-card room-primary-anchor room-primary-anchor--${tone}${isMobileAnchorTray ? " room-primary-anchor--mobile-tray" : ""}${isAwaitingRoll ? " room-primary-anchor--roll-stage" : ""}`}
        style={mobilePrimaryAnchorStyle}
      >
        <p className="shell__eyebrow">现在该做什么</p>
        <strong>{title}</strong>
        {isMobileAnchorTray && isAwaitingRoll ? actions : null}
        {isAwaitingRoll ? (
          <div className={`room-primary-anchor__dice-stage${canRoll ? " room-primary-anchor__dice-stage--active" : ""}`}>
            <div className="room-primary-anchor__dice-pair" aria-hidden="true">
              <span className="room-primary-anchor__die">●</span>
              <span className="room-primary-anchor__die room-primary-anchor__die--offset">◆</span>
            </div>
            <div className="room-primary-anchor__dice-copy">
              <p className="shell__eyebrow">回合骰台</p>
              <strong>{canRoll ? "掷骰会立刻揭示这一手" : `${projection.currentTurnPlayerName} 即将掷出这一手`}</strong>
              <span>{projection.lastRoll[0] || projection.lastRoll[1] ? `上一手结果 ${projection.lastRoll[0]} + ${projection.lastRoll[1]}` : "骰子落定后，房间会把下一步结果直接推到棋盘中央。"}</span>
            </div>
          </div>
        ) : null}
        {isMobileAnchorTray ? (
          <div className="room-primary-anchor__impact-block">
            <span className="room-primary-anchor__impact-label">执行后果</span>
            <strong className="room-primary-anchor__impact-value">{consequence}</strong>
          </div>
        ) : null}
        {isMobileAnchorTray && !isAwaitingRoll ? actions : null}
        <p className="action-surface__summary">{summary}</p>
        <p className="action-surface__hint">{hint}</p>
        {!isMobileAnchorTray ? <p className="action-surface__meta">{consequence}</p> : null}
        {!isMobileAnchorTray ? actions : null}
      </section>
    );
  }

  function renderTurnToolsShelf() {
    if (!hasTurnTools) {
      return null;
    }

    const summaryParts: string[] = [];
    if (hasTradeTool) {
      summaryParts.push("可发起交易");
    }
    if (hasDevelopmentTools) {
      summaryParts.push(`可开发地产 ${developmentTiles.length} 处`);
    }

    return (
      <section className="player-card turn-tools-shelf section-card">
        <div className="turn-tools-shelf__header">
          <div className="turn-tools-shelf__copy">
            <strong>本回合可选动作</strong>
            <p className="turn-tools-shelf__summary">{summaryParts.join(" · ")}</p>
            <p className="turn-tools-shelf__hint">这些是当前回合可选的经营动作，不会替代主动作。</p>
          </div>
          <button
            className="turn-tools-shelf__toggle"
            type="button"
            onClick={() => setIsTurnToolsOpen((current) => !current)}
          >
            {isTurnToolsOpen ? "收起本回合可选动作" : "展开本回合可选动作"}
          </button>
        </div>
        {isTurnToolsOpen ? (
          <div className="turn-tools-shelf__body">
            {hasDevelopmentTools ? (
              <section className="player-card turn-tools-shelf__card">
                <strong>地产开发</strong>
                {developmentTiles.map((tile) => {
                  const level = activeProjectionPlayer?.propertyImprovements?.[tile.id] ?? 0;

                  return (
                    <div className="lobby__actions" key={tile.id}>
                      <span>{tile.label} 等级 {level}</span>
                      <button className="button button--secondary" type="button" onClick={() => handleImprovement("build", tile.id)} disabled={!canManageImprovements}>
                        建房
                      </button>
                      <button className="button button--secondary" type="button" onClick={() => handleImprovement("sell", tile.id)} disabled={!canManageImprovements || level === 0}>
                        卖房
                      </button>
                    </div>
                  );
                })}
              </section>
            ) : null}

            {hasTradeTool ? (
              <section className="stage-card stage-card--trade turn-tools-shelf__card">
                <p className="shell__eyebrow">交易阶段</p>
                <strong>发起双边交易报价</strong>
                <span>
                  {selectedCounterparty
                    ? `轮到你决定，要不要把这笔交换提给 ${selectedCounterparty.name}。`
                    : "请选择一名仍在局内的玩家作为交易对象。"}
                </span>
                <div className="trade-composer__steps" aria-label="交易报价步骤">
                  {tradeComposerSteps.map((step) => (
                    <span
                      key={step.key}
                      className={`trade-composer__step${tradeComposerStep === step.key ? " trade-composer__step--active" : ""}`}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
                <div className="trade-stage__grid">
                  <article className="trade-side">
                    <strong>你给出</strong>
                    <span>现金: {Number(tradeOfferedCash) || 0}</span>
                    <span>地产: {draftTradeOfferedTileLabels.join(" / ") || "无"}</span>
                    <span>卡牌: {draftTradeOfferedCardLabels.join(" / ") || "无"}</span>
                  </article>
                  <article className="trade-side">
                    <strong>你获得</strong>
                    <span>现金: {Number(tradeRequestedCash) || 0}</span>
                    <span>地产: {draftTradeRequestedTileLabels.join(" / ") || "无"}</span>
                    <span>卡牌: {draftTradeRequestedCardLabels.join(" / ") || "无"}</span>
                  </article>
                </div>
                <span>
                  这笔报价提交后会暂停房间，等待 {selectedCounterparty?.name ?? "对手"} 明确接受或拒绝。
                </span>
                {tradeComposerStep === "counterparty" ? (
                  <div className="trade-composer__panel">
                    <div className="trade-editor__grid">
                      <label className="player-card trade-editor__field">
                        <strong>目标玩家</strong>
                        <select value={tradeCounterpartyId} onChange={(event) => setTradeCounterpartyId(event.target.value)}>
                          {otherPlayers.map((player) => (
                            <option key={player.id} value={player.id}>{player.name}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="lobby__actions">
                      <button className="button button--primary" type="button" onClick={() => setTradeComposerStep("offered")} disabled={!tradeCounterpartyId}>
                        下一步：选择我给出的内容
                      </button>
                    </div>
                  </div>
                ) : null}

                {tradeComposerStep === "offered" ? (
                  <div className="trade-composer__panel">
                    <div className="trade-editor__grid">
                      <label className="player-card trade-editor__field">
                        <strong>我出现金</strong>
                        <input value={tradeOfferedCash} onChange={(event) => setTradeOfferedCash(event.target.value)} />
                      </label>
                    </div>
                    <div className="asset-picker">
                      <section className="asset-picker__section">
                        <div className="asset-picker__header">
                          <strong>我可出让的地产</strong>
                          <span>{offeredPropertyOptions.length > 0 ? "点击选择要放进报价的地产" : "当前没有可出让地产"}</span>
                        </div>
                        {offeredPropertyOptions.length > 0 ? (
                          <div className="asset-chip-list">
                            {offeredPropertyOptions.map((option) => {
                              const selected = tradeOfferedTileIds.includes(option.id);
                              const disabled = Boolean(option.disabledReason);
                              return (
                                <button
                                  key={option.id}
                                  className={`asset-chip${selected ? " asset-chip--selected" : ""}${disabled ? " asset-chip--disabled" : ""}`}
                                  type="button"
                                  aria-label={`选择我出让的地产 ${option.label}`}
                                  onClick={() => toggleTradeSelection(option.id, tradeOfferedTileIds, setTradeOfferedTileIds, disabled)}
                                  disabled={disabled}
                                >
                                  <strong>{option.label}</strong>
                                  <span>{option.disabledReason ?? (option.detail || "可加入报价")}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="asset-picker__empty">当前没有可出让地产。</p>
                        )}
                      </section>

                      <section className="asset-picker__section">
                        <div className="asset-picker__header">
                          <strong>我可出让的卡牌</strong>
                          <span>{offeredCardOptions.length > 0 ? "点击选择要附带的卡牌" : "当前没有可出让卡牌"}</span>
                        </div>
                        {offeredCardOptions.length > 0 ? (
                          <div className="asset-chip-list">
                            {offeredCardOptions.map((option) => {
                              const selected = tradeOfferedCardIds.includes(option.id);
                              return (
                                <button
                                  key={option.id}
                                  className={`asset-chip${selected ? " asset-chip--selected" : ""}`}
                                  type="button"
                                  aria-label={`选择我出让的卡牌 ${option.label}`}
                                  onClick={() => toggleTradeSelection(option.id, tradeOfferedCardIds, setTradeOfferedCardIds, false)}
                                >
                                  <strong>{option.label}</strong>
                                  <span>{option.detail}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="asset-picker__empty">当前没有可出让卡牌。</p>
                        )}
                      </section>
                    </div>
                    <div className="lobby__actions">
                      <button className="button button--secondary" type="button" onClick={() => setTradeComposerStep("counterparty")}>
                        返回选择对象
                      </button>
                      <button className="button button--primary" type="button" onClick={() => setTradeComposerStep("requested")}>
                        下一步：选择我索取的内容
                      </button>
                    </div>
                  </div>
                ) : null}

                {tradeComposerStep === "requested" ? (
                  <div className="trade-composer__panel">
                    <div className="trade-editor__grid">
                      <label className="player-card trade-editor__field">
                        <strong>我索要现金</strong>
                        <input value={tradeRequestedCash} onChange={(event) => setTradeRequestedCash(event.target.value)} />
                      </label>
                    </div>
                    <div className="asset-picker">
                      <section className="asset-picker__section">
                        <div className="asset-picker__header">
                          <strong>{selectedCounterparty?.name ?? "对手"} 可让出的地产</strong>
                          <span>{selectedCounterparty ? "点击选择你想请求的地产" : "请先选择交易对象"}</span>
                        </div>
                        {requestedPropertyOptions.length > 0 ? (
                          <div className="asset-chip-list">
                            {requestedPropertyOptions.map((option) => {
                              const selected = tradeRequestedTileIds.includes(option.id);
                              const disabled = Boolean(option.disabledReason);
                              return (
                                <button
                                  key={option.id}
                                  className={`asset-chip${selected ? " asset-chip--selected" : ""}${disabled ? " asset-chip--disabled" : ""}`}
                                  type="button"
                                  aria-label={`选择索要的地产 ${option.label}`}
                                  onClick={() => toggleTradeSelection(option.id, tradeRequestedTileIds, setTradeRequestedTileIds, disabled)}
                                  disabled={disabled}
                                >
                                  <strong>{option.label}</strong>
                                  <span>{option.disabledReason ?? (option.detail || "可请求")}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="asset-picker__empty">{selectedCounterparty ? "对手当前没有可请求地产。" : "请先选择交易对象。"}</p>
                        )}
                      </section>

                      <section className="asset-picker__section">
                        <div className="asset-picker__header">
                          <strong>{selectedCounterparty?.name ?? "对手"} 可让出的卡牌</strong>
                          <span>{selectedCounterparty ? "点击选择你想索要的卡牌" : "请先选择交易对象"}</span>
                        </div>
                        {requestedCardOptions.length > 0 ? (
                          <div className="asset-chip-list">
                            {requestedCardOptions.map((option) => {
                              const selected = tradeRequestedCardIds.includes(option.id);
                              return (
                                <button
                                  key={option.id}
                                  className={`asset-chip${selected ? " asset-chip--selected" : ""}`}
                                  type="button"
                                  aria-label={`选择索要的卡牌 ${option.label}`}
                                  onClick={() => toggleTradeSelection(option.id, tradeRequestedCardIds, setTradeRequestedCardIds, false)}
                                >
                                  <strong>{option.label}</strong>
                                  <span>{option.detail}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="asset-picker__empty">{selectedCounterparty ? "对手当前没有可请求卡牌。" : "请先选择交易对象。"}</p>
                        )}
                      </section>
                    </div>
                    {!hasTradeDraft ? <p className="trade-composer__validation">当前还没有可成交内容，至少加入一项现金、地产或卡牌后才能进入审核。</p> : null}
                    <div className="lobby__actions">
                      <button className="button button--secondary" type="button" onClick={() => setTradeComposerStep("offered")}>
                        返回选择我给出的内容
                      </button>
                      <button className="button button--primary" type="button" onClick={() => setTradeComposerStep("review")} disabled={!hasTradeDraft}>
                        下一步：确认报价摘要
                      </button>
                    </div>
                  </div>
                ) : null}

                {tradeComposerStep === "review" ? (
                  <div className="trade-composer__panel">
                    <div className="trade-composer__review trade-review-card trade-review-card--risk">
                      <div className="trade-review-card__hero">
                        <p className="shell__eyebrow">发起前最后确认</p>
                        <strong>高风险交易确认面</strong>
                        <span>{selectedCounterparty ? `报价对象: ${selectedCounterparty.name}` : "尚未选择报价对象"}</span>
                        <span>{tradeNetCashLabel}</span>
                        <span>{`交易后现金: 你 ${activePlayerCashAfterTrade} · ${selectedCounterparty?.name ?? "对手"} ${counterpartyCashAfterTrade}`}</span>
                        <span>{hasTradeDraft ? "返回上一步继续编辑不会丢失当前草案。请先看清后果，再核对交换明细。" : "当前草案仍为空，请先返回前一步补充报价内容。"}</span>
                      </div>
                      {tradeCriticalConsequence ? (
                        <div className="trade-review-card__critical">
                          <strong>最高优先后果</strong>
                          <span>{tradeCriticalConsequence}</span>
                        </div>
                      ) : null}
                      <div className="trade-review-card__consequences">
                        <strong>先看这些风险与后果</strong>
                        {tradeRiskNotes.length > 0 ? tradeRiskNotes.map((note) => (
                          <span className="trade-review-card__note" key={note}>{note}</span>
                        )) : <span className="trade-review-card__note">当前没有额外风险提示。</span>}
                      </div>
                      <div className="trade-review-card__details">
                        <strong>再看交换明细</strong>
                        <div className="trade-review-card__grid">
                        <article className="trade-side">
                          <strong>你给出</strong>
                          <span>现金: {Number(tradeOfferedCash) || 0}</span>
                          <span>地产: {draftTradeOfferedTileLabels.join(" / ") || "无"}</span>
                          {selectedOfferedProperties.map((option) => (
                            <span className="trade-review-card__tag" key={`offered-property-${option.id}`}>{option.label}{option.detail ? ` · ${option.detail}` : ""}</span>
                          ))}
                          <span>卡牌: {draftTradeOfferedCardLabels.join(" / ") || "无"}</span>
                          {selectedOfferedCards.map((option) => (
                            <span className="trade-review-card__tag" key={`offered-card-${option.id}`}>{option.label} · {option.detail}</span>
                          ))}
                        </article>
                        <article className="trade-side">
                          <strong>你获得</strong>
                          <span>现金: {Number(tradeRequestedCash) || 0}</span>
                          <span>地产: {draftTradeRequestedTileLabels.join(" / ") || "无"}</span>
                          {selectedRequestedProperties.map((option) => (
                            <span className="trade-review-card__tag" key={`requested-property-${option.id}`}>{option.label}{option.detail ? ` · ${option.detail}` : ""}</span>
                          ))}
                          <span>卡牌: {draftTradeRequestedCardLabels.join(" / ") || "无"}</span>
                          {selectedRequestedCards.map((option) => (
                            <span className="trade-review-card__tag" key={`requested-card-${option.id}`}>{option.label} · {option.detail}</span>
                          ))}
                        </article>
                      </div>
                      </div>
                    </div>
                    <div className="lobby__actions">
                      <button className="button button--secondary" type="button" onClick={() => setTradeComposerStep("requested")}>
                        返回继续编辑草案
                      </button>
                      <button className="button button--secondary button--danger" type="button" onClick={clearTradeDraft}>
                        放弃当前草案
                      </button>
                      <button className="button button--primary" type="button" onClick={handleProposeTrade} disabled={!canProposeTrade || !tradeCounterpartyId || !hasTradeDraft}>
                        确认并发起交易
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <main className="room-shell">
      <header className="room-shell__topbar">
        <div className="room-shell__identity">
          <div className="room-shell__title-group">
            <p className="shell__eyebrow">房间 {projection.roomId}</p>
            <h1 className="room-shell__title">{roomShellTitle}</h1>
            <p className="panel__subtitle">{activeIdentityLabel}</p>
          </div>
          <Link className="button button--secondary room-shell__back" to="/">
            返回大厅
          </Link>
        </div>
        <div className="room-shell__meta">
          <article className="room-shell__pill">
            <strong>当前回合</strong>
            <span>{projection.currentTurnPlayerName}</span>
          </article>
          <article className="room-shell__pill">
            <strong>当前阶段</strong>
            <span>{roomPhaseLabel}</span>
          </article>
          <article className="room-shell__pill">
            <strong>房内玩家</strong>
            <span>{projection.players.length} 人</span>
          </article>
        </div>
      </header>

      {reconnectSuccessMessage ? (
        <section
          key={recoveryNotice?.token}
          className="panel room-reconnect-success room-reconnect-success--active"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="room-reconnect-success__status">
            <span className="room-reconnect-success__pulse" aria-hidden="true" />
            <p className="shell__eyebrow">同步已恢复</p>
          </div>
          <strong className="room-reconnect-success__title">{reconnectSuccessMessage}</strong>
          <span className="room-reconnect-success__hint">{reconnectSuccessContext}</span>
        </section>
      ) : null}

      {syncShellState ? (
        <section className={`panel room-sync-shell room-sync-shell--${syncShellState.tone}`}>
          <div className="room-sync-shell__hero">
            <div className="room-sync-shell__copy">
              <p className="shell__eyebrow">房间同步</p>
              <strong>{syncShellState.title}</strong>
              <p className="panel__subtitle">{syncShellState.summary}</p>
            </div>
            <div className="room-sync-shell__status-pill">
              <strong>{syncShellState.statusLabel}</strong>
              <span>{syncShellState.freshnessLabel}</span>
            </div>
          </div>
          <div className="room-sync-shell__grid">
            <article className="room-sync-shell__card">
              <strong>当前身份</strong>
              <span>{syncShellState.identityStatus}</span>
              <span>{activeIdentityLabel}</span>
            </article>
            <article className="room-sync-shell__card">
              <strong>当前阶段</strong>
              <span>{roomPhaseLabel}</span>
              <span>{projection.currentTurnPlayerName}</span>
            </article>
            <article className="room-sync-shell__card">
              <strong>实时连接</strong>
              <span>{syncShellState.connectionLabel}</span>
              <span>{syncShellState.latestLabel}</span>
            </article>
            <article className="room-sync-shell__card">
              <strong>操作状态</strong>
              <span>{syncShellState.actionStatus}</span>
              <span>{projection.pendingActionLabel}</span>
            </article>
          </div>
          <div className="room-sync-shell__stages">
            {syncShellState.stageCards.map((stage) => (
              <article className={`room-sync-shell__stage${stage.active ? " room-sync-shell__stage--active" : ""}`} key={stage.label}>
                <strong>{stage.label}</strong>
                <span>{stage.value}</span>
              </article>
            ))}
          </div>
          <div className="room-sync-shell__actions">
            <button className="button button--secondary" type="button" onClick={() => void refreshProjection()} disabled={isLoading}>
              {isLoading ? "还在更新..." : "马上再试一次"}
            </button>
            <span className="room-sync-shell__actions-copy">接回完成后，页面会自动回到当前阶段和主操作。</span>
          </div>
        </section>
      ) : null}

      <div className="room-shell__layout">
      <section className={`panel panel--board board room-shell__board${projection.turnState === "awaiting-roll" ? " room-shell__board--roll-ready" : ""}`}>
        <div className="board__hero">
          <div className="board__hero-copy">
            <p className="shell__eyebrow">当前棋盘</p>
            <strong>{roomPhaseLabel}</strong>
            <span>
              {presentation.highlightedTileId
                ? `焦点地块：${boardTileLabels.get(presentation.highlightedTileId) ?? presentation.highlightedTileId}`
                : "棋盘会在这里突出当前地块与玩家位置。"}
            </span>
          </div>
          <div className="board__hero-copy">
            <strong>{projection.currentTurnPlayerName}</strong>
            <span>{isSpectator ? "当前只读观战" : `当前身份：${activePlayerName}`}</span>
          </div>
        </div>
        <BoardScene
          board={sampleBoard}
          currentTurnPlayerId={projection.currentTurnPlayerId}
          players={projection.players}
          highlightedTileId={presentation.highlightedTileId}
          resultFeedback={boardResultFeedback}
          stageCue={boardStageCue}
          transitionHint={boardSceneTransitionHint}
          consequenceHint={boardConsequenceCue}
          handoffHint={boardTurnHandoffCue}
          phaseFocusHint={boardPhaseFocusCue}
        />
      </section>
      <aside className="panel panel--room-state room-shell__rail">
        <p className="panel__meta">当前阶段与操作</p>
        <h2 className="panel__title">对局侧栏</h2>
        {error ? <p className="panel__subtitle">{error}</p> : null}
        {actionMessage ? <p className="panel__subtitle">{actionMessage}</p> : null}
        {isSpectator ? <p className="panel__subtitle">当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。</p> : null}
        {isFallback ? <p className="panel__subtitle">这局还没重新接上，当前只保留加载或失败状态。</p> : null}

        <section className="stage-card stage-card--overview">
          <p className="shell__eyebrow">房间总览</p>
          <strong>{activeIdentityLabel}</strong>
          <div className="room-overview__grid">
            <article className="status-card">
              <strong>当前阶段</strong>
              <span>{roomPhaseLabel}</span>
            </article>
            <article className="status-card">
              <strong>当前回合</strong>
              <span>{projection.currentTurnPlayerName}</span>
            </article>
            <article className="status-card">
              <strong>房主</strong>
              <span>{projection.hostPlayerName}</span>
            </article>
            <article className="status-card">
              <strong>最新进展</strong>
              <span>{overviewProgressLabel}</span>
            </article>
          </div>
          {!reconnectSuccessMessage && lastRecoveryRecap ? (
            <article
              className={`room-recovery-recap${dismissingRecoveryRecapToken === lastRecoveryRecap.token ? " room-recovery-recap--dismissing" : ""}`}
              key={lastRecoveryRecap.token}
            >
              <p className="shell__eyebrow">最近恢复</p>
              <strong>{lastRecoveryRecap.title}</strong>
              <span>{lastRecoveryRecap.detail}</span>
              <span className="room-recovery-recap__anchor">{lastRecoveryRecap.anchorLabel}</span>
              <span className="room-recovery-recap__meta">{lastRecoveryRecap.meta}</span>
            </article>
          ) : null}
          <div className="room-overview__roster">
            {projection.players.map((player) => (
              <article className="room-chip" key={player.id}>
                <strong>{player.name}</strong>
                <span>
                  {player.id === projection.hostId ? "房主" : "玩家"}
                  {player.id === projection.currentTurnPlayerId ? " · 当前行动" : ""}
                  {player.id === activePlayerId ? " · 你" : ""}
                </span>
              </article>
            ))}
          </div>
        </section>

        {projection.waitingRoomSummary ? (
          <section className="stage-card stage-card--waiting">
            <p className="shell__eyebrow">等待阶段</p>
            <strong>等待房间开始</strong>
            <span>{projection.waitingRoomSummary.canStart ? "玩家已就位，房主现在可以开始本局。" : "仍有条件未满足，请先完成房间准备。"}</span>
            <span>{activeIdentityLabel}</span>
            <span>房间码: {projection.waitingRoomSummary.roomCode}</span>
            <span>房主: {projection.waitingRoomSummary.hostName}</span>
            <span>当前人数: {projection.waitingRoomSummary.playerCount} / 最少 {projection.waitingRoomSummary.minimumPlayers}</span>
            <span>{projection.waitingRoomSummary.blockerLabel}</span>
            <span>{projection.waitingRoomSummary.reconnectLabel}</span>
            <div className="stage-card__seat-list">
              {projection.waitingRoomSummary.seats.map((seat) => (
                <article className="stage-card__seat" key={seat.playerId}>
                  <strong>{seat.name}</strong>
                  <span>
                    {seat.isHost ? "房主" : "玩家"}
                    {seat.playerId === activePlayerId ? " · 你" : ""}
                  </span>
                  <span>起始现金: {seat.cash}</span>
                  <span>已持有地产: {seat.propertyCount}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!projection.waitingRoomSummary && auctionSummary ? (
          <section className="stage-card stage-card--auction">
            <p className="shell__eyebrow">拍卖阶段</p>
            <strong>公开拍卖进行中</strong>
            <span>{auctionSummary.triggerLabel}</span>
            <div className="auction-stage__grid">
              <article className="status-card">
                <strong>拍品</strong>
                <span>{auctionSummary.lotLabel}</span>
              </article>
              <article className="status-card">
                <strong>面价</strong>
                <span>{auctionSummary.lotPrice}</span>
              </article>
              <article className="status-card">
                <strong>当前轮到</strong>
                <span>{auctionSummary.actingBidderName}</span>
              </article>
              <article className="status-card">
                <strong>当前领跑</strong>
                <span>{auctionSummary.highestBidderName ? `${auctionSummary.highestBidderName} · ${auctionSummary.highestBid}` : "暂无领先者"}</span>
              </article>
            </div>
            <span>{auctionSummary.statusLabel}</span>
            <span>{auctionViewerLabel}</span>
            <span>仍在竞拍: {auctionSummary.activeBidderNames.join(" / ")}</span>
            <span>已退出: {auctionSummary.passedPlayerNames.join(" / ") || "暂无"}</span>
            {canAuction ? <span>主动作已提升到顶部锚点；这里保留拍卖上下文与结果阅读。</span> : null}
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && projection.resolutionSummary ? (
          <section className="stage-card stage-card--danger">
            <p className="shell__eyebrow">强制结算</p>
            <strong>{projection.resolutionSummary.actorName} 正在处理 {projection.resolutionSummary.reasonLabel}</strong>
            <span>债权人: {projection.resolutionSummary.creditorLabel}</span>
            <span>欠款来源: {projection.resolutionSummary.sourceLabel}</span>
            <span>应支付: {projection.resolutionSummary.amount}</span>
            <span>当前现金: {projection.resolutionSummary.actorCash}</span>
            <span>仍差: {projection.resolutionSummary.shortfall}</span>
            <span>可抵押资产: {projection.resolutionSummary.availableMortgageCount} 处</span>
            <span>{projection.resolutionSummary.consequenceLabel}</span>
            <span>{deficitViewerLabel}</span>
            {needsStepwiseRecovery ? <span>这笔欠款无法一步补足；顶部锚点会在每次抵押后继续给出下一步建议。</span> : null}
            <div className="deficit-stage__grid">
              <article className="trade-side">
                <strong>可立即恢复的资产</strong>
                <span>{mortgageablePropertyOptions.length > 0 ? "选择一处地产执行抵押。" : "当前没有可立即抵押的地产。"}</span>
                {mortgageablePropertyOptions.length > 0 ? (
                  <div className="asset-picker deficit-picker">
                    {mortgageablePropertyOptions.map((option) => (
                      <button
                        key={option.id}
                        className="asset-chip asset-chip--recovery"
                        type="button"
                        onClick={() => handleMortgage(option.id)}
                        disabled={!canResolveDeficit || mortgageBusyTileId === option.id}
                      >
                        <strong>{mortgageBusyTileId === option.id ? `抵押 ${option.label}...` : option.label}</strong>
                        <span>{option.detail || `可回收 ${option.mortgageValue}`}</span>
                        <span>{option.settlesDeficit ? "本次抵押后将补足欠款" : `抵押后仍差 ${option.nextShortfall}`}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="asset-picker__empty">当前只剩破产退出这一条路。</p>
                )}
              </article>
              <article className="trade-side">
                <strong>暂不可作为恢复动作的资产</strong>
                <span>{blockedRecoveryPropertyOptions.length > 0 ? "这些地产仍会显示，但当前不能作为抵押动作。" : "当前没有被阻塞的地产。"}</span>
                {blockedRecoveryPropertyOptions.length > 0 ? (
                  <div className="asset-picker deficit-picker">
                    {blockedRecoveryPropertyOptions.map((option) => (
                      <div key={option.id} className="asset-chip asset-chip--disabled asset-chip--static">
                        <strong>{option.label}</strong>
                        <span>{option.detail || "资产状态已变更"}</span>
                        <span>{option.disabledReason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="asset-picker__empty">当前所有名下地产都可直接用于恢复。</p>
                )}
              </article>
            </div>
            {canResolveDeficit ? <span>主动作已提升到顶部锚点；下方继续保留所有可比较的恢复路径。</span> : null}
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && !projection.resolutionSummary && tradeSummary ? (
          <section className="stage-card stage-card--trade">
            <p className="shell__eyebrow">交易阶段</p>
            <strong>双边交易待响应</strong>
            <span>{tradeSummary.stageLabel}</span>
            <div className="trade-response-stage__hero">
              <strong>{tradeWaitingHeadline}</strong>
              <span>{tradeWaitingPrimarySummary}</span>
              <span>{tradeWaitingCapabilityLabel}</span>
            </div>
            <div className="trade-response-stage__outcome">
              <strong>接下来会怎样</strong>
              <span>{tradeSummary.outcomePreviewLabel}</span>
              <span>{tradeWaitingOutcomeSummary}</span>
            </div>
            <div className="trade-stage__grid">
              <article className="trade-side">
                <strong>{tradeSummary.proposerName} 交出</strong>
                <span>现金: {tradeSummary.offeredCash}</span>
                <span>地产: {tradeSummary.offeredTileLabels.join(" / ") || "无"}</span>
                <span>卡牌: {tradeSummary.offeredCardLabels.join(" / ") || "无"}</span>
              </article>
              <article className="trade-side">
                <strong>{tradeSummary.counterpartyName} 交出</strong>
                <span>现金: {tradeSummary.requestedCash}</span>
                <span>地产: {tradeSummary.requestedTileLabels.join(" / ") || "无"}</span>
                <span>卡牌: {tradeSummary.requestedCardLabels.join(" / ") || "无"}</span>
              </article>
            </div>
            <span>{tradeStageViewerLabel}</span>
            <div className="trade-response-stage__readonly">
              <strong>当前处理内容</strong>
              <span>{tradeWaitingCapabilityLabel}</span>
            </div>
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && !projection.resolutionSummary && !tradeSummary && projection.latestSettlementSummary ? (
          projection.latestSettlementSummary.kind === "trade-accepted" && projection.latestSettlementSummary.tradeSettlement ? (
            <section className="stage-card stage-card--result trade-settlement-card">
              <p className="shell__eyebrow">交易已成交</p>
              <strong>{projection.latestSettlementSummary.title}</strong>
              <span>{projection.latestSettlementSummary.detail}</span>
              <div className="trade-settlement-card__grid">
                <article className="trade-side">
                  <strong>{projection.latestSettlementSummary.tradeSettlement.proposerName}</strong>
                  <span className="trade-side__summary">{projection.latestSettlementSummary.tradeSettlement.proposerSummary}</span>
                  {projection.latestSettlementSummary.tradeSettlement.proposerGives.map((line) => (
                    <span className="trade-side__detail" key={`proposer-gives-${line}`}>交出: {line}</span>
                  ))}
                  {projection.latestSettlementSummary.tradeSettlement.proposerGets.map((line) => (
                    <span className="trade-side__detail" key={`proposer-gets-${line}`}>获得: {line}</span>
                  ))}
                  <span className="trade-side__detail">{`成交后现金: ${projection.latestSettlementSummary.tradeSettlement.proposerCashAfter ?? "未知"}`}</span>
                </article>
                <article className="trade-side">
                  <strong>{projection.latestSettlementSummary.tradeSettlement.counterpartyName}</strong>
                  <span className="trade-side__summary">{projection.latestSettlementSummary.tradeSettlement.counterpartySummary}</span>
                  {projection.latestSettlementSummary.tradeSettlement.counterpartyGives.map((line) => (
                    <span className="trade-side__detail" key={`counterparty-gives-${line}`}>交出: {line}</span>
                  ))}
                  {projection.latestSettlementSummary.tradeSettlement.counterpartyGets.map((line) => (
                    <span className="trade-side__detail" key={`counterparty-gets-${line}`}>获得: {line}</span>
                  ))}
                  <span className="trade-side__detail">{`成交后现金: ${projection.latestSettlementSummary.tradeSettlement.counterpartyCashAfter ?? "未知"}`}</span>
                </article>
              </div>
            </section>
          ) : projection.latestSettlementSummary.kind === "trade-rejected" && projection.latestSettlementSummary.tradeRejection ? (
            <section className="stage-card stage-card--neutral trade-rejection-card">
              <p className="shell__eyebrow">交易未成交</p>
              <strong>{projection.latestSettlementSummary.title}</strong>
              <span>{projection.latestSettlementSummary.detail}</span>
              <div className="trade-response-stage__readonly trade-rejection-card__hero">
                <strong>这笔报价已失效</strong>
                <span>没有发生任何现金、地产或卡牌转移。</span>
                <span>{`${projection.latestSettlementSummary.tradeRejection.nextActorName} 继续这一回合。`}</span>
              </div>
              <div className="trade-settlement-card__grid">
                <article className="trade-side">
                  <strong>{projection.latestSettlementSummary.tradeRejection.proposerName} 原本想交出</strong>
                  <span className="trade-side__summary">{projection.latestSettlementSummary.tradeRejection.proposerOfferedSummary}</span>
                  {projection.latestSettlementSummary.tradeRejection.proposerOffered.map((line) => (
                    <span className="trade-side__detail" key={`rejected-offered-${line}`}>{line}</span>
                  ))}
                </article>
                <article className="trade-side">
                  <strong>{projection.latestSettlementSummary.tradeRejection.proposerName} 原本想获得</strong>
                  <span className="trade-side__summary">{projection.latestSettlementSummary.tradeRejection.proposerRequestedSummary}</span>
                  {projection.latestSettlementSummary.tradeRejection.proposerRequested.map((line) => (
                    <span className="trade-side__detail" key={`rejected-requested-${line}`}>{line}</span>
                  ))}
                </article>
              </div>
            </section>
          ) : projection.latestSettlementSummary.kind === "auction-unsold" ? (
            <section className="stage-card stage-card--neutral trade-rejection-card">
              <p className="shell__eyebrow">拍卖未成交</p>
              <strong>{projection.latestSettlementSummary.title}</strong>
              <span>{projection.latestSettlementSummary.detail}</span>
              <div className="trade-response-stage__readonly trade-rejection-card__hero">
                <strong>这轮拍卖已经结束</strong>
                <span>没有玩家接手这块地产，产权仍保持未售出状态。</span>
                <span>{projection.latestSettlementSummary.nextStepLabel}</span>
              </div>
            </section>
          ) : (
            <section className={`stage-card ${projection.latestSettlementSummary.tone === "danger" ? "stage-card--danger" : "stage-card--neutral"}`}>
              <p className="shell__eyebrow">最近结果</p>
              <strong>{projection.latestSettlementSummary.title}</strong>
              <span>{projection.latestSettlementSummary.detail}</span>
            </section>
          )
        ) : null}

        <div className="status-grid status-grid--support">
          <article className="status-card">
            <strong>最近骰子</strong>
            <span>{projection.lastRoll.join(" + ")}</span>
          </article>
          <article className="status-card">
            <strong>{projection.latestSettlementSummary ? "当前责任" : "下一步"}</strong>
            <span>{projection.latestSettlementSummary?.nextStepLabel ?? projection.pendingActionLabel}</span>
          </article>
        </div>

        {!isMobileAnchorTray ? renderPrimaryActionAnchor() : null}
        {renderTurnToolsShelf()}

        <h4 className="panel__title panel__title--assets">玩家资产</h4>
        <div className="asset-grid">
          {projection.players.map((player) => (
            <article className="tile-card" key={player.id}>
              <strong>{player.name}</strong>
              <span>现金: {player.cash}</span>
              <span>位置: {player.position}</span>
              <span>地产: {player.properties.length}</span>
              <span>抵押: {player.mortgagedProperties?.length ?? 0}</span>
              <span>建筑: {Object.values(player.propertyImprovements ?? {}).reduce((total, level) => total + level, 0)}</span>
              <span>出狱卡: {player.heldCardIds?.length ?? 0}</span>
              <span>监狱尝试: {player.jailTurnsServed ?? 0}</span>
              <span>{player.isBankrupt ? "状态: 已破产" : player.inJail ? "状态: 监狱中" : "状态: 自由"}</span>
            </article>
          ))}
        </div>

        <section className="diagnostics-drawer">
          <button
            className="diagnostics-drawer__toggle"
            type="button"
            onClick={() => setIsDiagnosticsOpen((current) => !current)}
          >
            {isDiagnosticsOpen ? "收起诊断抽屉" : "展开诊断抽屉"}
          </button>
          {isDiagnosticsOpen ? (
            <div className="diagnostics-drawer__body">
              <div className="diagnostics-grid">
                <article className="status-card">
                  <strong>房间上下文</strong>
                  <span>{projection.roomState} / {projection.turnState}</span>
                </article>
                <article className="status-card">
                  <strong>房间进度</strong>
                  <span>第 {projection.snapshotVersion} 次更新 · 第 {projection.eventSequence} 条进展</span>
                </article>
                <article className="status-card">
                  <strong>牌堆状态</strong>
                  <span>机会 {projection.chanceDeck.drawPile.length}/{projection.chanceDeck.discardPile.length} · 命运 {projection.communityDeck.drawPile.length}/{projection.communityDeck.discardPile.length}</span>
                </article>
                <article className="status-card">
                  <strong>挂起交易版本</strong>
                  <span>{projection.pendingTrade?.snapshotVersion ?? "当前无挂起交易"}</span>
                </article>
              </div>
              <p className="panel__subtitle">当前说明: {projection.pendingActionLabel}</p>
              <h4 className="panel__title">最近事件</h4>
              <ol className="event-log">
                {diagnosticsEventLines.map((event) => (
                  <li key={event.id}>#{event.sequence} {event.summary}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      </aside>
      </div>
      {isMobileAnchorTray ? renderPrimaryActionAnchor() : null}
    </main>
  );
}
