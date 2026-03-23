import { sampleBoard } from "@dafuweng/board-config";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { acceptTrade, attemptJailRoll, buildImprovement, declareBankruptcy, declineProperty, mortgageProperty, passAuction, payJailFine, proposeTrade, purchaseProperty, rejectTrade, rollDice, sellImprovement, startRoom, submitAuctionBid, useJailCard } from "../../network/roomApi";
import { BoardScene } from "../../scene/board/BoardScene";
import { getActivePlayer } from "../../state/projection/activePlayer";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

type TradeComposerStep = "counterparty" | "offered" | "requested" | "review";
type PrimaryAnchorTone = "default" | "warning" | "danger" | "success";

export function GamePage() {
  const params = useParams();
  const roomId = params.roomId ?? "";
  const { projection, isFallback, isLoading, error, applySnapshot, refreshProjection } = useGameProjection(roomId);
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
          ? "交易响应"
        : projection.turnState === "awaiting-deficit-resolution"
          ? "资金结算"
          : "对局进行中";
          const roomShellTitle = projection.waitingRoomSummary ? "等待开局" : roomPhaseLabel;
  const latestEventSummary = projection.recentEvents.at(-1)?.summary ?? "暂无最新事件。";
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
        ? `轮到你处理这笔${projection.resolutionSummary.reasonLabel}欠款。这次恢复需要连续几步，锚点会在每次权威抵押后继续刷新下一步。`
        : `轮到你处理这笔${projection.resolutionSummary.reasonLabel}欠款。选择一项可抵押资产，或直接宣告破产。`
      : isSpectator
        ? `当前仅观战，等待 ${projection.resolutionSummary.actorName} 处理欠款。`
        : `当前由 ${projection.resolutionSummary.actorName} 处理欠款，其他人暂时只能等待。`
    : null;

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
      setActionMessage("房主已开始本局。所有玩家现在会看到同一权威对局。");
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
      setActionMessage(`${activePlayerName} 的权威掷骰结果已同步。`);
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
      setActionMessage(decision === "purchase" ? "已同步权威买地结果。" : "已同步权威放弃结果。");
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
      setActionMessage(action === "bid" ? "已同步权威拍卖出价。" : "已同步权威拍卖放弃。");
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
      setActionMessage("已同步权威出狱结果。");
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
      setActionMessage("已同步权威出狱掷骰结果。");
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
      setActionMessage("已同步权威出狱卡结果。");
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
      setActionMessage("已同步权威抵押结果。");
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
      setActionMessage("已同步权威破产结果。");
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
      setActionMessage(action === "build" ? "已同步权威建房结果。" : "已同步权威卖房结果。");
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
      const isAwaitingRoll = projection.turnState === "awaiting-roll";
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
          <div className="lobby__actions">
            <button className="button button--primary" type="button" onClick={handleRollDice} disabled={!canRoll}>
              {isSubmittingCommand && canRoll ? "同步中..." : `以 ${activePlayerName} 身份掷骰`}
            </button>
          </div>
        ) : null;
      }
    }

    return (
      <section className={`player-card room-primary-anchor room-primary-anchor--${tone}`}>
        <p className="shell__eyebrow">当前主操作</p>
        <strong>{title}</strong>
        <p className="action-surface__summary">{summary}</p>
        <p className="action-surface__hint">{hint}</p>
        <p className="action-surface__meta">{consequence}</p>
        {actions}
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
            <strong>回合工具区</strong>
            <p className="turn-tools-shelf__summary">{summaryParts.join(" · ")}</p>
            <p className="turn-tools-shelf__hint">这些是当前回合可选的经营动作，不会替代主动作。</p>
          </div>
          <button
            className="turn-tools-shelf__toggle"
            type="button"
            onClick={() => setIsTurnToolsOpen((current) => !current)}
          >
            {isTurnToolsOpen ? "收起回合工具区" : "展开回合工具区"}
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

      <div className="room-shell__layout">
      <section className="panel panel--board board room-shell__board">
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
        {isLoading ? <p className="panel__subtitle">正在同步房间状态...</p> : null}
        {isFallback ? <p className="panel__subtitle">尚未成功同步到权威后端，请稍后重试。</p> : null}
        <BoardScene
          board={sampleBoard}
          currentTurnPlayerId={projection.currentTurnPlayerId}
          players={projection.players}
          highlightedTileId={presentation.highlightedTileId}
        />
      </section>
      <aside className="panel panel--room-state room-shell__rail">
        <p className="panel__meta">当前阶段与操作</p>
        <h2 className="panel__title">对局侧栏</h2>
        {error ? <p className="panel__subtitle">{error}</p> : null}
        {actionMessage ? <p className="panel__subtitle">{actionMessage}</p> : null}
        {isSpectator ? <p className="panel__subtitle">当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。</p> : null}
        {isFallback ? <p className="panel__subtitle">房间尚未成功连接到权威后端，当前仅显示加载或失败状态。</p> : null}

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
              <span>{latestEventSummary}</span>
            </article>
          </div>
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
                <span>{mortgageablePropertyOptions.length > 0 ? "选择一处地产执行权威抵押。" : "当前没有可立即抵押的地产。"}</span>
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
                  <p className="asset-picker__empty">当前只剩破产退出这一条权威路径。</p>
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
              <span>{projection.latestSettlementSummary.nextStepLabel}</span>
            </section>
          ) : projection.latestSettlementSummary.kind === "trade-rejected" && projection.latestSettlementSummary.tradeRejection ? (
            <section className="stage-card stage-card--result trade-rejection-card">
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
              <span>{projection.latestSettlementSummary.nextStepLabel}</span>
            </section>
          ) : (
            <section className={`stage-card ${projection.latestSettlementSummary.tone === "danger" ? "stage-card--danger" : "stage-card--result"}`}>
              <p className="shell__eyebrow">最近结果</p>
              <strong>{projection.latestSettlementSummary.title}</strong>
              <span>{projection.latestSettlementSummary.detail}</span>
              <span>{projection.latestSettlementSummary.nextStepLabel}</span>
            </section>
          )
        ) : null}

        <div className="status-grid status-grid--support">
          <article className="status-card">
            <strong>最近骰子</strong>
            <span>{projection.lastRoll.join(" + ")}</span>
          </article>
          <article className="status-card">
            <strong>下一步</strong>
            <span>{projection.pendingActionLabel}</span>
          </article>
        </div>

        {renderPrimaryActionAnchor()}
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
                  <strong>房间同步</strong>
                  <span>快照 {projection.snapshotVersion} · 序列 {projection.eventSequence}</span>
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
              <p className="panel__subtitle">当前权威说明: {projection.pendingActionLabel}</p>
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
    </main>
  );
}
