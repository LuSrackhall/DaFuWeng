import type { PendingAuction, PendingPayment, PlayerState, RoomState } from "@dafuweng/contracts";

type PresentationState = {
  highlightedTileId: string | null;
};

export function usePresentationState(
  currentTurnPlayerId: string,
  players: PlayerState[],
  roomState: RoomState,
  pendingAuction: PendingAuction | null,
  pendingPayment: PendingPayment | null,
): PresentationState {
  if (roomState === "in-game" && pendingAuction?.tileId) {
    return {
      highlightedTileId: pendingAuction.tileId,
    };
  }

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
