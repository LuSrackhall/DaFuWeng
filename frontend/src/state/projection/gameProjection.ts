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
  applySnapshot: (snapshot: ProjectionSnapshot) => void;
  refreshProjection: () => Promise<void>;
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
  const [projection, setProjection] = useState<ProjectionView>(toProjectionView(sampleProjection));
  const [isFallback, setIsFallback] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshProjection() {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await getRoom(roomId);
      setProjection(toProjectionView(snapshot));
      setIsFallback(false);
      setIsLoading(false);
    } catch (requestError: unknown) {
      setProjection(toProjectionView({
        ...sampleProjection,
        roomId
      }));
      setIsFallback(true);
      setIsLoading(false);
      setError(requestError instanceof Error ? requestError.message : "无法读取房间状态");
    }
  }

  useEffect(() => {
    void refreshProjection();
  }, [roomId]);

  return {
    projection,
    isFallback,
    isLoading,
    error,
    applySnapshot(snapshot) {
      setProjection(toProjectionView(snapshot));
      setIsFallback(false);
      setIsLoading(false);
      setError(null);
    },
    refreshProjection
  };
}
