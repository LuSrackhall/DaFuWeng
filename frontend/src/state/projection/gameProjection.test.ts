import { describe, expect, test } from "vitest";
import { sampleProjection } from "@dafuweng/board-config";
import { applyRoomEvents, toProjectionView } from "./gameProjection";

describe("toProjectionView", () => {
  test("returns the current turn player name from the authoritative projection", () => {
    const projection = toProjectionView(sampleProjection);

    expect(projection.roomId).toBe("demo-room");
    expect(projection.currentTurnPlayerName).toBe("房主");
    expect(projection.players).toHaveLength(4);
    expect(projection.snapshotVersion).toBe(4);
  });

  test("applies property offer, purchase, and turn advance events as catch-up state", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-5",
        type: "property-offered",
        sequence: 5,
        snapshotVersion: 5,
        summary: "房主可选择购买东湖路。",
        playerId: "p1",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        tilePrice: 160
      },
      {
        id: "evt-6",
        type: "property-purchased",
        sequence: 6,
        snapshotVersion: 6,
        summary: "房主购买了东湖路。",
        playerId: "p1",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        tilePrice: 160,
        cashAfter: 1340
      },
      {
        id: "evt-7",
        type: "turn-advanced",
        sequence: 7,
        snapshotVersion: 6,
        summary: "轮到下一位玩家行动。",
        nextPlayerId: "p2"
      }
    ]);

    expect(updated.pendingProperty).toBeNull();
    expect(updated.currentTurnPlayerId).toBe("p2");
    expect(updated.turnState).toBe("awaiting-roll");
    expect(updated.players[0]?.cash).toBe(1340);
    expect(updated.players[0]?.properties).toContain("tile-6");
  });
});
