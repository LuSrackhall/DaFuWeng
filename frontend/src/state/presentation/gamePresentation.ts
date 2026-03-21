type PresentationState = {
  highlightedTileId: string | null;
};

export function usePresentationState(): PresentationState {
  return {
    highlightedTileId: "property-06"
  };
}