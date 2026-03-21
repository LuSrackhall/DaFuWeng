import { sampleBoard } from "@dafuweng/board-config";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { declineProperty, passAuction, payJailFine, purchaseProperty, rollDice, submitAuctionBid } from "../../network/roomApi";
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
  const canPayJailFine = !isFallback
    && !isLoading
    && !isSubmittingCommand
    && projection.turnState === "awaiting-jail-release"
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
          <button className="button button--secondary" type="button" onClick={handleJailRelease} disabled={!canPayJailFine}>
            支付 50 罚金
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

        <h4 className="panel__title">资产一览</h4>
        <div className="asset-grid">
          {projection.players.map((player) => (
            <article className="tile-card" key={player.id}>
              <strong>{player.name}</strong>
              <span>现金: {player.cash}</span>
              <span>位置: {player.position}</span>
              <span>地产: {player.properties.length}</span>
              <span>{player.inJail ? "状态: 监狱中" : "状态: 自由"}</span>
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
