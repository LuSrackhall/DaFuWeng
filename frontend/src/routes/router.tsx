import { createBrowserRouter } from "react-router-dom";
import { App } from "../app/App";
import { LobbyPage } from "../features/lobby/LobbyPage";
import { GamePage } from "../features/game/GamePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LobbyPage />
      },
      {
        path: "room/:roomId",
        element: <GamePage />
      }
    ]
  }
]);