import { describe, expect, test } from "vitest";
import {
  getAuctionBidValidation,
  getDeficitControlMode,
  sanitizeAuctionBidInput,
} from "./gameActionState";

describe("gameActionState", () => {
  test("returns actionable deficit controls only for the current debtor", () => {
    expect(
      getDeficitControlMode({
        isFallback: false,
        isLoading: false,
        isSubmittingCommand: false,
        roomState: "in-game",
        turnState: "awaiting-deficit-resolution",
        pendingPayment: {
          amount: 120,
          reason: "rent",
          creditorKind: "player",
          creditorPlayerId: "p1",
          sourceTileId: "tile-1",
          sourceTileLabel: "南城路",
        },
        currentTurnPlayerId: "p2",
        activePlayerId: "p2",
      }),
    ).toBe("actionable");

    expect(
      getDeficitControlMode({
        isFallback: false,
        isLoading: false,
        isSubmittingCommand: false,
        roomState: "in-game",
        turnState: "awaiting-deficit-resolution",
        pendingPayment: {
          amount: 120,
          reason: "rent",
          creditorKind: "player",
          creditorPlayerId: "p1",
          sourceTileId: "tile-1",
          sourceTileLabel: "南城路",
        },
        currentTurnPlayerId: "p2",
        activePlayerId: "p3",
      }),
    ).toBe("readonly");
  });

  test("hides deficit controls outside the authoritative recovery stage", () => {
    expect(
      getDeficitControlMode({
        isFallback: false,
        isLoading: false,
        isSubmittingCommand: false,
        roomState: "in-game",
        turnState: "awaiting-roll",
        pendingPayment: null,
        currentTurnPlayerId: "p2",
        activePlayerId: "p2",
      }),
    ).toBe("hidden");
  });

  test("sanitizes and validates auction bid input against the minimum bid", () => {
    expect(sanitizeAuctionBidInput(" 12a0 ")).toBe("120");
    expect(getAuctionBidValidation("", 51).isValid).toBe(false);
    expect(getAuctionBidValidation("50", 51).isValid).toBe(false);
    expect(getAuctionBidValidation("51", 51).parsedAmount).toBe(51);
    expect(getAuctionBidValidation("51", 51).isValid).toBe(true);
  });
});
