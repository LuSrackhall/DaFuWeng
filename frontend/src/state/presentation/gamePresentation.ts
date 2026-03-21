import type { PlayerState } from "@dafuweng/contracts";

type PresentationState = {
  highlightedTileId: string | null;
};

export function usePresentationState(currentTurnPlayerId: string, players: PlayerState[]): PresentationState {
  const currentPlayer = players.find((player) => player.id === currentTurnPlayerId);

  return {
    highlightedTileId: currentPlayer ? `tile-${currentPlayer.position}` : null
  };
}
