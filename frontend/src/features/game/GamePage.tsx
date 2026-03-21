import { sampleBoard } from "@dafuweng/board-config";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { rollDice } from "../../network/roomApi";
import { BoardScene } from "../../scene/board/BoardScene";
import { getActivePlayer } from "../../state/projection/activePlayer";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

export function GamePage() {
  const params = useParams();
  const roomId = params.roomId ?? "demo-room";
  const { projection, isFallback, isLoading, error, applySnapshot, refreshProjection } = useGameProjection(roomId);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const presentation = usePresentationState(projection.currentTurnPlayerId, projection.players);
  const activePlayer = getActivePlayer(roomId) ?? {
    playerId: projection.currentTurnPlayerId,
    playerName: projection.currentTurnPlayerName
  };
  const canRoll = !isFallback
    && !isLoading
    && !isRolling
    && projection.turnState === "awaiting-roll"
    && activePlayer.playerId === projection.currentTurnPlayerId;

  async function handleRollDice() {
    setIsRolling(true);
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
      setIsRolling(false);
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
            {isRolling ? "同步中..." : `以 ${activePlayer.playerName} 身份掷骰`}
          </button>
        </div>

        <h4 className="panel__title">资产一览</h4>
        <div className="asset-grid">
          {projection.players.map((player) => (
            <article className="tile-card" key={player.id}>
              <strong>{player.name}</strong>
              <span>现金: {player.cash}</span>
              <span>位置: {player.position}</span>
              <span>地产: {player.properties.length}</span>
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
