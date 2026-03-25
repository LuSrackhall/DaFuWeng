import type { PendingPayment } from "@dafuweng/contracts";

export type DeficitControlMode = "hidden" | "readonly" | "actionable";

type DeficitControlModeInput = {
  isFallback: boolean;
  isLoading: boolean;
  isSubmittingCommand: boolean;
  roomState: string;
  turnState: string;
  pendingPayment: PendingPayment | null;
  currentTurnPlayerId: string;
  activePlayerId: string;
};

export function getDeficitControlMode(
  input: DeficitControlModeInput,
): DeficitControlMode {
  if (
    input.roomState !== "in-game" ||
    input.turnState !== "awaiting-deficit-resolution" ||
    input.pendingPayment === null
  ) {
    return "hidden";
  }

  if (input.activePlayerId !== input.currentTurnPlayerId) {
    return "readonly";
  }

  if (input.isFallback || input.isLoading || input.isSubmittingCommand) {
    return "readonly";
  }

  return "actionable";
}

export function sanitizeAuctionBidInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function parseAuctionBidInput(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function getAuctionBidValidation(
  value: string,
  nextMinimumBid: number | null,
) {
  const parsedAmount = parseAuctionBidInput(value);
  const minimumBid = nextMinimumBid ?? null;
  const isValid =
    parsedAmount !== null && minimumBid !== null && parsedAmount >= minimumBid;

  return {
    parsedAmount,
    minimumBid,
    isValid,
  };
}
