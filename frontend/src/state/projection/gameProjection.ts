import { useEffect, useState } from "react";
import type { PlayerState, ProjectionSnapshot } from "@dafuweng/contracts";
import { sampleProjection } from "@dafuweng/board-config";
import { getRoom } from "../../network/roomApi";

type PlayerSummary = Pick<PlayerState, "id" | "name" | "cash" | "position" | "properties">;

type ProjectionView = ProjectionSnapshot & {
  currentTurnPlayerName: string;
  players: PlayerSummary[];
};

export type GameProjectionState = {
  projection: ProjectionView;
  isFallback: boolean;
  isLoading: boolean;
  error: string | null;
};

export function toProjectionView(snapshot: ProjectionSnapshot): ProjectionView {
  const currentPlayer = snapshot.players.find(
    (player) => player.id === snapshot.currentTurnPlayerId
  );

  return {
    ...snapshot,
    currentTurnPlayerName: currentPlayer?.name ?? "未知玩家",
    players: snapshot.players
  };
}

export function useGameProjection(roomId: string): GameProjectionState {
  const [state, setState] = useState<GameProjectionState>({
    projection: toProjectionView(sampleProjection),
    isFallback: true,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null
    }));

    getRoom(roomId)
      .then((snapshot) => {
        if (!active) {
          return;
        }

        setState({
          projection: toProjectionView(snapshot),
          isFallback: false,
          isLoading: false,
          error: null
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState({
          projection: toProjectionView({
            ...sampleProjection,
            roomId
          }),
          isFallback: true,
          isLoading: false,
          error: error instanceof Error ? error.message : "无法读取房间状态"
        });
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  return state;
}