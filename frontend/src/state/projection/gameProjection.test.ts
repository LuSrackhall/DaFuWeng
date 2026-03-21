import { describe, expect, test } from "vitest";
import { sampleProjection } from "@dafuweng/board-config";
import { applyRoomEvents, applyStreamEnvelope, toProjectionView } from "./gameProjection";

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

  test("applies rent settlement events from the realtime stream", () => {
    const updated = applyStreamEnvelope(sampleProjection, {
      kind: "event",
      event: {
        id: "evt-8",
        type: "rent-charged",
        sequence: 8,
        snapshotVersion: 8,
        summary: "玩家二 向 房主 支付了 22 租金。",
        playerId: "p2",
        ownerPlayerId: "p1",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        amount: 22,
        cashAfter: 1338,
        ownerCashAfter: 1522
      }
    });

    expect(updated.players[0]?.cash).toBe(1522);
    expect(updated.players[1]?.cash).toBe(1338);
    expect(updated.eventSequence).toBe(8);
  });

  test("applies auction lifecycle events from catch-up state", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-9",
        type: "auction-started",
        sequence: 9,
        snapshotVersion: 9,
        summary: "东湖路 进入拍卖。",
        playerId: "p1",
        nextPlayerId: "p2",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        tilePrice: 160
      },
      {
        id: "evt-10",
        type: "auction-bid-submitted",
        sequence: 10,
        snapshotVersion: 10,
        summary: "玩家二 出价 200。",
        playerId: "p2",
        nextPlayerId: "p1",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        tilePrice: 160,
        amount: 200
      }
    ]);

    expect(updated.turnState).toBe("awaiting-auction");
    expect(updated.currentTurnPlayerId).toBe("p1");
    expect(updated.pendingAuction?.highestBid).toBe(200);
    expect(updated.pendingAuction?.highestBidderId).toBe("p2");
  });

  test("applies jail and card events from authoritative updates", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-11",
        type: "player-jailed",
        sequence: 11,
        snapshotVersion: 11,
        summary: "房主 被送入监狱。",
        playerId: "p1",
        playerPosition: 10
      },
      {
        id: "evt-12",
        type: "jail-fine-paid",
        sequence: 12,
        snapshotVersion: 12,
        summary: "房主 支付了 50 罚金并离开监狱。",
        playerId: "p1",
        cashAfter: 1450
      },
      {
        id: "evt-13",
        type: "card-resolved",
        sequence: 13,
        snapshotVersion: 13,
        summary: "玩家二 抽到命运卡，获得 100。",
        playerId: "p2",
        cashAfter: 1460,
        amount: 100
      }
    ]);

    expect(updated.players[0]?.inJail).toBe(false);
    expect(updated.players[0]?.cash).toBe(1450);
    expect(updated.players[1]?.cash).toBe(1460);
  });
});
