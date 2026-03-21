import { sampleBoard } from "@dafuweng/board-config";
import { useParams } from "react-router-dom";
import { BoardScene } from "../../scene/board/BoardScene";
import { useGameProjection } from "../../state/projection/gameProjection";
import { usePresentationState } from "../../state/presentation/gamePresentation";

export function GamePage() {
  const params = useParams();
  const roomId = params.roomId ?? "demo-room";
  const { projection, isFallback, isLoading, error } = useGameProjection(roomId);
  const presentation = usePresentationState();

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
            <li key={event.id}>{event.summary}</li>
          ))}
        </ol>
      </aside>
    </main>
  );
}