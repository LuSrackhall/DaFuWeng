import type { PendingPayment, PlayerState, RoomState } from "@dafuweng/contracts";

type PresentationState = {
  highlightedTileId: string | null;
};

export function usePresentationState(
  currentTurnPlayerId: string,
  players: PlayerState[],
  roomState: RoomState,
  pendingPayment: PendingPayment | null,
): PresentationState {
  if (roomState === "in-game" && pendingPayment?.sourceTileId) {
    return {
      highlightedTileId: pendingPayment.sourceTileId,
    };
  }

  const currentPlayer = players.find((player) => player.id === currentTurnPlayerId);

  return {
    highlightedTileId: currentPlayer ? `tile-${currentPlayer.position}` : null
  };
}
