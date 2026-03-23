import { Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { App } from "../app/App";

const LobbyPage = lazy(async () => {
  const module = await import("../features/lobby/LobbyPage");
  return { default: module.LobbyPage };
});

const GamePage = lazy(async () => {
  const module = await import("../features/game/GamePage");
  return { default: module.GamePage };
});

const routeFallback = (
  <div className="shell">
    <header className="shell__header">
      <div>
        <p className="shell__eyebrow">Web-first multiplayer Monopoly</p>
        <h1>Da Fu Weng</h1>
      </div>
      <p className="shell__status">Loading room surface...</p>
    </header>
  </div>
);

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
