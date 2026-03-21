import { sampleBoard } from "@dafuweng/board-config";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { attemptJailRoll, buildImprovement, declareBankruptcy, declineProperty, mortgageProperty, passAuction, payJailFine, purchaseProperty, rollDice, sellImprovement, submitAuctionBid, useJailCard } from "../../network/roomApi";
import { BoardScene } from "../../scene/board/BoardScene";
import { getActivePlayer } from "../../state/projection/activePlayer";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

export function GamePage() {
  const params = useParams();
  const roomId = params.roomId ?? "demo-room";
  const { projection, isFallback, isLoading, error, applySnapshot, refreshProjection } = useGameProjection(roomId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [auctionBid, setAuctionBid] = useState("200");
  const [mortgageBusyTileId, setMortgageBusyTileId] = useState<string | null>(null);
  const [isSubmittingCommand, setIsSubmittingCommand] = useState(false);
  const presentation = usePresentationState(projection.currentTurnPlayerId, projection.players);
  const activePlayer = getActivePlayer(roomId) ?? {
    playerId: projection.currentTurnPlayerId,
    playerName: projection.currentTurnPlayerName
  };
  const canRoll = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-roll"
    && activePlayer.playerId === projection.currentTurnPlayerId;
  const canResolveProperty = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-property-decision"
    && projection.pendingProperty !== null
    && activePlayer.playerId === projection.currentTurnPlayerId;
  const canAuction = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-auction"
    && projection.pendingAuction !== null
    && activePlayer.playerId === projection.currentTurnPlayerId;
  const canResolveJail = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-jail-decision"
    && activePlayer.playerId === projection.currentTurnPlayerId;
  const canResolveDeficit = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-deficit-resolution"
    && projection.pendingPayment !== null
    && activePlayer.playerId === projection.currentTurnPlayerId;
  const canManageImprovements = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-roll"
    && activePlayer.playerId === projection.currentTurnPlayerId;

  async function handleRollDice() {
    setIsSubmittingCommand(true);
    setActionMessage(null);

    try {
      const snapshot = await rollDice(roomId, {
        playerId: activePlayer.playerId,
        idempotencyKey: crypto.randomUUID()
      });
      applySnapshot(snapshot);
      setActionMessage(`${activePlayer.playerName} 的权威掷骰结果已同步。`);
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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
        playerId: activePlayer.playerId,
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

  const activeProjectionPlayer = projection.players.find((player) => player.id === activePlayer.playerId);
  const mortgageCandidates = (activeProjectionPlayer?.properties ?? []).filter(
    (tileId) => !(activeProjectionPlayer?.mortgagedProperties ?? []).includes(tileId)
  );
  const developmentTiles = sampleBoard.filter((tile) => (activeProjectionPlayer?.properties ?? []).includes(tile.id) && tile.buildCost !== undefined);

  return (
    <main className="game">
      <section className="panel board">
        <p className="panel__meta">Authoritative board projection</p>
        {isLoading ? <p className="panel__subtitle">正在同步房间状态...</p> : null}
        {isFallback ? <p className="panel__subtitle">当前显示本地回退投影，后端连接尚未建立。</p> : null}
        <BoardScene
          board={sampleBoard}
          currentTurnPlayerId={projection.currentTurnPlayerId}
          players={projection.players}
          highlightedTileId={presentation.highlightedTileId}
        />
      </section>
      <aside className="panel">
        <p className="panel__meta">Current room state</p>
        <h3 className="panel__title">房间 {projection.roomId}</h3>
        {error ? <p className="panel__subtitle">{error}</p> : null}
        {actionMessage ? <p className="panel__subtitle">{actionMessage}</p> : null}
        <div className="status-grid">
          <article className="status-card">
            <strong>当前回合</strong>
            <span>{projection.currentTurnPlayerName}</span>
          </article>
          <article className="status-card">
            <strong>最近骰子</strong>
            <span>{projection.lastRoll.join(" + ")}</span>
          </article>
          <article className="status-card">
            <strong>房间状态</strong>
            <span>{projection.roomState}</span>
          </article>
          <article className="status-card">
            <strong>待处理动作</strong>
            <span>{projection.pendingActionLabel}</span>
          </article>
          <article className="status-card">
            <strong>快照版本</strong>
            <span>{projection.snapshotVersion}</span>
          </article>
          <article className="status-card">
            <strong>事件序列</strong>
            <span>{projection.eventSequence}</span>
          </article>
        </div>

        <div className="lobby__actions">
          <button className="button button--primary" type="button" onClick={handleRollDice} disabled={!canRoll}>
            {isSubmittingCommand && canRoll ? "同步中..." : `以 ${activePlayer.playerName} 身份掷骰`}
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

        {projection.pendingAuction ? (
          <section className="player-card">
            <strong>待结算拍卖</strong>
            <span>{projection.pendingAuction.label}</span>
            <span>当前最高出价: {projection.pendingAuction.highestBid}</span>
            <span>已放弃玩家: {projection.pendingAuction.passedPlayerIds.length}</span>
            <label className="player-card">
              <strong>出价金额</strong>
              <input value={auctionBid} onChange={(event) => setAuctionBid(event.target.value)} />
            </label>
            <div className="lobby__actions">
              <button className="button button--primary" type="button" onClick={() => handleAuction("bid")} disabled={!canAuction}>
                提交出价
              </button>
              <button className="button button--secondary" type="button" onClick={() => handleAuction("pass")} disabled={!canAuction}>
                放弃竞拍
              </button>
            </div>
          </section>
        ) : null}

        {projection.pendingPayment ? (
          <section className="player-card">
            <strong>待化解欠款</strong>
            <span>原因: {projection.pendingPayment.reason}</span>
            <span>金额: {projection.pendingPayment.amount}</span>
            <span>来源: {projection.pendingPayment.sourceTileLabel ?? "未知来源"}</span>
            <div className="lobby__actions">
              {mortgageCandidates.map((tileId) => (
                <button
                  className="button button--secondary"
                  key={tileId}
                  type="button"
                  onClick={() => handleMortgage(tileId)}
                  disabled={!canResolveDeficit || mortgageBusyTileId === tileId}
                >
                  {mortgageBusyTileId === tileId ? `抵押 ${tileId}...` : `抵押 ${tileId}`}
                </button>
              ))}
              <button className="button button--primary" type="button" onClick={handleBankruptcy} disabled={!canResolveDeficit}>
                宣告破产
              </button>
            </div>
          </section>
        ) : null}

        <section className="player-card">
          <strong>牌堆状态</strong>
          <span>机会牌堆: 抽牌 {projection.chanceDeck.drawPile.length} / 弃牌 {projection.chanceDeck.discardPile.length}</span>
          <span>命运牌堆: 抽牌 {projection.communityDeck.drawPile.length} / 弃牌 {projection.communityDeck.discardPile.length}</span>
        </section>

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

        <h4 className="panel__title">资产一览</h4>
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

        <h4 className="panel__title">事件记录</h4>
        <ol className="event-log">
          {projection.recentEvents.map((event) => (
            <li key={event.id}>#{event.sequence} {event.summary}</li>
          ))}
        </ol>
      </aside>
    </main>
  );
}
