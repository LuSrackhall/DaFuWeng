import { Suspense, lazy } from "react";
import { createBrowserRouter, useLocation } from "react-router-dom";
import { App } from "../app/App";
import { getActivePlayer } from "../state/projection/activePlayer";

const LobbyPage = lazy(async () => {
  const module = await import("../features/lobby/LobbyPage");
  return { default: module.LobbyPage };
});

const GamePage = lazy(async () => {
  const module = await import("../features/game/GamePage");
  return { default: module.GamePage };
});

function RouteLoadingShell() {
  const location = useLocation();
  const roomMatch = location.pathname.match(/^\/room\/([^/]+)$/);
  const roomId = roomMatch?.[1] ?? "未知房间";
  const activePlayer = roomMatch?.[1] ? getActivePlayer(roomMatch[1]) : null;
  const identityLabel = activePlayer
    ? `即将以 ${activePlayer.playerName} 身份回到房间`
    : "即将以只读方式进入房间";
  const permissionLabel = activePlayer
    ? "进房后会把你的席位和当前轮次一起接回来。"
    : "进房后你可以继续旁观这一局，但不能替玩家操作。";

  return (
    <main className="route-loading-shell">
      <section className="panel route-loading-shell__panel">
        <div className="route-loading-shell__hero">
          <p className="shell__eyebrow">房间入口过渡</p>
          <h1 className="route-loading-shell__title">正在进入 {roomId}</h1>
          <p className="panel__subtitle">{identityLabel}</p>
        </div>
        <div className="route-loading-shell__grid">
          <article className="route-loading-shell__card">
            <strong>房间编号</strong>
            <span>{roomId}</span>
          </article>
          <article className="route-loading-shell__card">
            <strong>进入方式</strong>
            <span>{activePlayer ? "恢复玩家会话" : "只读观战进入"}</span>
          </article>
          <article className="route-loading-shell__card">
            <strong>房间阶段</strong>
            <span>正在把这一局接回来</span>
          </article>
          <article className="route-loading-shell__card">
            <strong>进入后权限</strong>
            <span>{activePlayer ? "可继续当前房间操作" : "仅可查看当前房间进度"}</span>
          </article>
        </div>
        <div className="route-loading-shell__stages">
          <article className="route-loading-shell__stage route-loading-shell__stage--active">
            <strong>步骤 1</strong>
            <span>打开房间页面</span>
          </article>
          <article className="route-loading-shell__stage">
            <strong>步骤 2</strong>
            <span>确认你当前的席位</span>
          </article>
          <article className="route-loading-shell__stage">
            <strong>步骤 3</strong>
            <span>接回这局最新进展</span>
          </article>
        </div>
        <p className="route-loading-shell__hint">{permissionLabel}</p>
      </section>
    </main>
  );
}

const routeFallback = <RouteLoadingShell />;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={routeFallback}>
            <LobbyPage />
          </Suspense>
        ),
      }
    ]
  },
  {
    path: "/room/:roomId",
    element: (
      <Suspense fallback={routeFallback}>
        <GamePage />
      </Suspense>
    ),
  }
]);
