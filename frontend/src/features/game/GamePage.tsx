import { sampleBoard } from "@dafuweng/board-config";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { acceptTrade, attemptJailRoll, buildImprovement, declareBankruptcy, declineProperty, mortgageProperty, passAuction, payJailFine, proposeTrade, purchaseProperty, rejectTrade, rollDice, sellImprovement, startRoom, submitAuctionBid, useJailCard } from "../../network/roomApi";
import { BoardScene } from "../../scene/board/BoardScene";
import { getActivePlayer } from "../../state/projection/activePlayer";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

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
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
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
  const tradeStageViewerLabel = tradeSummary
    ? canResolveTrade
      ? `轮到你决定是否接受 ${tradeSummary.proposerName} 的报价。`
      : tradeSummary.proposerPlayerId === activePlayerId
        ? `报价已发出，当前等待 ${tradeSummary.counterpartyName} 回复。`
        : isSpectator
          ? "当前仅观战，你可以查看交易内容，但不能参与响应。"
          : `当前轮到 ${tradeSummary.counterpartyName} 决定，其他人保持只读。`
    : null;
  const diagnosticsEventLines = projection.recentEvents.slice(-5).reverse();
  const activeProjectionPlayer = projection.players.find((player) => player.id === activePlayerId);
  const resolutionActor = projection.players.find((player) => player.id === projection.currentTurnPlayerId);

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
  const deficitViewerLabel = projection.resolutionSummary
    ? canResolveDeficit
      ? `轮到你处理这笔${projection.resolutionSummary.reasonLabel}欠款。选择一项可抵押资产，或直接宣告破产。`
      : isSpectator
        ? `当前仅观战，等待 ${projection.resolutionSummary.actorName} 处理欠款。`
        : `当前由 ${projection.resolutionSummary.actorName} 处理欠款，其他人暂时只能等待。`
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
      setActionMessage("已同步权威交易报价。");
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
      setActionMessage(action === "accept" ? "已同步权威交易结果。" : "已同步权威拒绝结果。");
    } catch (requestError) {
      setActionMessage(requestError instanceof Error ? requestError.message : "交易处理失败");
      await refreshProjection();
    } finally {
      setIsSubmittingCommand(false);
    }
  }

  const developmentTiles = sampleBoard.filter((tile) => (activeProjectionPlayer?.properties ?? []).includes(tile.id) && tile.buildCost !== undefined);

  return (
    <main className="game">
      <section className="panel board">
        <p className="panel__meta">当前棋盘</p>
        {isLoading ? <p className="panel__subtitle">正在同步房间状态...</p> : null}
        {isFallback ? <p className="panel__subtitle">尚未成功同步到权威后端，请稍后重试。</p> : null}
        <BoardScene
          board={sampleBoard}
          currentTurnPlayerId={projection.currentTurnPlayerId}
          players={projection.players}
          highlightedTileId={presentation.highlightedTileId}
        />
      </section>
      <aside className="panel">
        <p className="panel__meta">当前房间态势</p>
        <h3 className="panel__title">房间 {projection.roomId}</h3>
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
            <div className="lobby__actions">
              <button className="button button--primary" type="button" onClick={handleStartRoom} disabled={!canStartRoom}>
                {isSubmittingCommand && canStartRoom ? "开始中..." : "房主开始游戏"}
              </button>
              <Link className="button button--secondary" to="/">
                返回大厅
              </Link>
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
            {canAuction ? (
              <>
                <div className="auction-quick-bids">
                  {auctionQuickBidOptions.map((amount) => (
                    <button
                      className="button button--secondary"
                      key={amount}
                      type="button"
                      onClick={() => setAuctionBid(String(amount))}
                    >
                      出价 {amount}
                    </button>
                  ))}
                </div>
                <label className="auction-stage__field">
                  <strong>自定义出价</strong>
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
            ) : null}
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
            <div className="lobby__actions">
              <button className="button button--primary" type="button" onClick={handleBankruptcy} disabled={!canResolveDeficit}>
                宣告破产
              </button>
            </div>
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && !projection.resolutionSummary && tradeSummary ? (
          <section className="stage-card stage-card--trade">
            <p className="shell__eyebrow">交易阶段</p>
            <strong>双边交易待响应</strong>
            <span>{tradeSummary.stageLabel}</span>
            <div className="trade-stage__grid">
              <article className="trade-side">
                <strong>{tradeSummary.proposerName} 给出</strong>
                <span>现金: {tradeSummary.offeredCash}</span>
                <span>地产: {tradeSummary.offeredTileLabels.join(" / ") || "无"}</span>
                <span>卡牌: {tradeSummary.offeredCardLabels.join(" / ") || "无"}</span>
              </article>
              <article className="trade-side">
                <strong>{tradeSummary.proposerName} 获得</strong>
                <span>现金: {tradeSummary.requestedCash}</span>
                <span>地产: {tradeSummary.requestedTileLabels.join(" / ") || "无"}</span>
                <span>卡牌: {tradeSummary.requestedCardLabels.join(" / ") || "无"}</span>
              </article>
            </div>
            <span>{tradeSummary.outcomePreviewLabel}</span>
            <span>{tradeStageViewerLabel}</span>
            <div className="lobby__actions">
              <button className="button button--primary" type="button" onClick={() => handleResolveTrade("accept")} disabled={!canResolveTrade}>
                接受交易
              </button>
              <button className="button button--secondary button--danger" type="button" onClick={() => handleResolveTrade("reject")} disabled={!canResolveTrade}>
                拒绝交易
              </button>
            </div>
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && !projection.resolutionSummary && !tradeSummary && canProposeTrade ? (
          <section className="stage-card stage-card--trade">
            <p className="shell__eyebrow">交易阶段</p>
            <strong>发起双边交易报价</strong>
            <span>
              {selectedCounterparty
                ? `当前由你决定是否向 ${selectedCounterparty.name} 发起一笔正式报价。`
                : "请选择一名仍在局内的玩家作为交易对象。"}
            </span>
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
            <div className="trade-editor__grid">
              <label className="player-card trade-editor__field">
                <strong>目标玩家</strong>
                <select value={tradeCounterpartyId} onChange={(event) => setTradeCounterpartyId(event.target.value)}>
                  {otherPlayers.map((player) => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
              </label>
              <label className="player-card trade-editor__field">
                <strong>我出现金</strong>
                <input value={tradeOfferedCash} onChange={(event) => setTradeOfferedCash(event.target.value)} />
              </label>
              <label className="player-card trade-editor__field">
                <strong>我索要现金</strong>
                <input value={tradeRequestedCash} onChange={(event) => setTradeRequestedCash(event.target.value)} />
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
            <div className="lobby__actions">
              <button className="button button--secondary" type="button" onClick={handleProposeTrade} disabled={!canProposeTrade || !tradeCounterpartyId}>
                发起交易
              </button>
            </div>
          </section>
        ) : null}

        {!projection.waitingRoomSummary && !auctionSummary && !projection.resolutionSummary && !tradeSummary && projection.latestSettlementSummary ? (
          <section className={`stage-card ${projection.latestSettlementSummary.tone === "danger" ? "stage-card--danger" : "stage-card--result"}`}>
            <p className="shell__eyebrow">最近结果</p>
            <strong>{projection.latestSettlementSummary.title}</strong>
            <span>{projection.latestSettlementSummary.detail}</span>
            <span>{projection.latestSettlementSummary.nextStepLabel}</span>
          </section>
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

        <section className="player-card section-card">
          <strong>当前操作</strong>
          <div className="lobby__actions">
            <button className="button button--primary" type="button" onClick={handleRollDice} disabled={!canRoll}>
              {isSubmittingCommand && canRoll ? "同步中..." : `以 ${activePlayerName} 身份掷骰`}
            </button>
            <button className="button button--secondary" type="button" onClick={handleJailRelease} disabled={!canResolveJail}>
              支付 50 罚金
            </button>
            <button className="button button--secondary" type="button" onClick={handleJailRoll} disabled={!canResolveJail}>
              尝试掷骰出狱
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={handleUseJailCard}
              disabled={!canResolveJail || (activeProjectionPlayer?.heldCardIds?.length ?? 0) === 0}
            >
              使用出狱卡
            </button>
          </div>
        </section>

        {projection.pendingProperty ? (
          <section className="player-card">
            <strong>待决策地产</strong>
            <span>{projection.pendingProperty.label}</span>
            <span>价格: {projection.pendingProperty.price}</span>
            <div className="lobby__actions">
              <button
                className="button button--primary"
                type="button"
                onClick={() => handleResolveProperty("purchase")}
                disabled={!canResolveProperty}
              >
                购买地产
              </button>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => handleResolveProperty("decline")}
                disabled={!canResolveProperty}
              >
                放弃购买
              </button>
            </div>
          </section>
        ) : null}

        {developmentTiles.length > 0 ? (
          <section className="player-card">
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

        <h4 className="panel__title">玩家资产</h4>
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
    </main>
  );
}
