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

  test("derives a clearer waiting-room summary from lobby state", () => {
    const projection = toProjectionView({
      ...sampleProjection,
      roomId: "room-101",
      roomState: "lobby",
      hostId: "p1",
      currentTurnPlayerId: "p1",
      pendingActionLabel: "等待更多玩家加入",
      players: sampleProjection.players.slice(0, 1),
      recentEvents: [],
    });

    expect(projection.waitingRoomSummary?.roomCode).toBe("room-101");
    expect(projection.waitingRoomSummary?.hostName).toBe("房主");
    expect(projection.waitingRoomSummary?.playerCount).toBe(1);
    expect(projection.waitingRoomSummary?.playersNeeded).toBe(1);
    expect(projection.waitingRoomSummary?.blockerLabel).toContain("至少还需要 1 名玩家加入");
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

    const projection = toProjectionView(updated);
    expect(projection.auctionSummary?.lotLabel).toBe("东湖路");
    expect(projection.auctionSummary?.highestBid).toBe(200);
    expect(projection.auctionSummary?.highestBidderName).toBe("玩家二");
    expect(projection.auctionSummary?.actingBidderName).toBe("房主");
    expect(projection.auctionSummary?.nextMinimumBid).toBe(201);
  });

  test("derives passed players and active bidders during auction", () => {
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
        tilePrice: 160,
      },
      {
        id: "evt-10",
        type: "auction-bid-submitted",
        sequence: 10,
        snapshotVersion: 10,
        summary: "玩家二 出价 51。",
        playerId: "p2",
        nextPlayerId: "p1",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
        tilePrice: 160,
        amount: 51,
      },
      {
        id: "evt-11",
        type: "auction-pass-submitted",
        sequence: 11,
        snapshotVersion: 11,
        summary: "房主 放弃竞拍。",
        playerId: "p1",
        nextPlayerId: "p2",
      },
    ]);

    const projection = toProjectionView(updated);
    expect(projection.auctionSummary?.passedPlayerNames).toContain("房主");
    expect(projection.auctionSummary?.activeBidderNames).toContain("玩家二");
    expect(projection.auctionSummary?.passedBidderCount).toBe(1);
  });

  test("derives a readable unsold auction result summary", () => {
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
        tilePrice: 160,
      },
      {
        id: "evt-10",
        type: "auction-pass-submitted",
        sequence: 10,
        snapshotVersion: 10,
        summary: "玩家二 放弃竞拍。",
        playerId: "p2",
        nextPlayerId: "p1",
      },
      {
        id: "evt-11",
        type: "auction-pass-submitted",
        sequence: 11,
        snapshotVersion: 11,
        summary: "房主 放弃竞拍。",
        playerId: "p1",
        nextPlayerId: "p1",
      },
      {
        id: "evt-12",
        type: "auction-ended-unsold",
        sequence: 12,
        snapshotVersion: 12,
        summary: "东湖路 流拍。",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
      },
    ]);

    const projection = toProjectionView(updated);
    expect(projection.auctionSummary).toBeNull();
    expect(projection.latestSettlementSummary?.title).toContain("流拍");
    expect(projection.latestSettlementSummary?.detail).toContain("产权保持未售出状态");
    expect(projection.latestSettlementSummary?.tone).toBe("neutral");
    expect(projection.latestSettlementSummary?.kind).toBe("auction-unsold");
  });

  test("prefers the latest formal result over an older unsold auction event", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-9",
        type: "auction-ended-unsold",
        sequence: 9,
        snapshotVersion: 9,
        summary: "东湖路 流拍。",
        tileId: "tile-6",
        tileIndex: 6,
        tileLabel: "东湖路",
      },
      {
        id: "evt-10",
        type: "trade-proposed",
        sequence: 10,
        snapshotVersion: 10,
        summary: "房主 向 玩家二 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 100,
        requestedCash: 50,
      },
      {
        id: "evt-11",
        type: "trade-accepted",
        sequence: 11,
        snapshotVersion: 11,
        summary: "玩家二 接受了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 100,
        requestedCash: 50,
        cashAfterByPlayer: { p1: 1450, p2: 1550 },
      },
    ]);

    const projection = toProjectionView(updated);
    expect(projection.latestSettlementSummary?.title).toContain("接受了");
    expect(projection.latestSettlementSummary?.title).not.toContain("流拍");
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
        id: "evt-11b",
        type: "jail-roll-attempted",
        sequence: 12,
        snapshotVersion: 12,
        summary: "房主 尝试掷骰出狱，结果 2 + 3。",
        playerId: "p1",
        failedAttemptCount: 1,
        lastRoll: [2, 3]
      },
      {
        id: "evt-12",
        type: "jail-fine-paid",
        sequence: 13,
        snapshotVersion: 13,
        summary: "房主 支付了 50 罚金并离开监狱。",
        playerId: "p1",
        cashAfter: 1450
      },
      {
        id: "evt-13",
        type: "card-resolved",
        sequence: 14,
        snapshotVersion: 14,
        summary: "玩家二 抽到命运卡，获得 100。",
        playerId: "p2",
        cashAfter: 1460,
        amount: 100,
        deckKind: "community",
        cardId: "community-bonus-100",
        cardTitle: "年终分红",
        cardDisposition: "discarded"
      }
    ]);

    expect(updated.players[0]?.inJail).toBe(false);
    expect(updated.players[0]?.cash).toBe(1450);
    expect(updated.players[1]?.cash).toBe(1460);
    expect(updated.communityDeck.discardPile).toContain("community-bonus-100");
  });

  test("applies held jail card and release card usage", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-18",
        type: "card-resolved",
        sequence: 18,
        snapshotVersion: 18,
        summary: "房主 抽到 免费出狱。",
        playerId: "p1",
        deckKind: "chance",
        cardId: "chance-jail-card",
        cardTitle: "保释特赦",
        cardDisposition: "held"
      },
      {
        id: "evt-19",
        type: "player-jailed",
        sequence: 19,
        snapshotVersion: 19,
        summary: "房主 被送入监狱。",
        playerId: "p1",
        playerPosition: 10
      },
      {
        id: "evt-20",
        type: "jail-card-used",
        sequence: 20,
        snapshotVersion: 20,
        summary: "房主 使用了 保释特赦。",
        playerId: "p1",
        deckKind: "chance",
        cardId: "chance-jail-card",
        cardTitle: "保释特赦",
        cardDisposition: "returned"
      }
    ]);

    expect(updated.players[0]?.heldCardIds).toEqual([]);
    expect(updated.players[0]?.inJail).toBe(false);
    expect(updated.chanceDeck.discardPile).toContain("chance-jail-card");
  });

  test("applies deficit, mortgage, and bankruptcy events", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-14",
        type: "deficit-started",
        sequence: 14,
        snapshotVersion: 14,
        summary: "房主 需补缴 200 税费。",
        playerId: "p1",
        tileId: "tile-4",
        tileIndex: 4,
        tileLabel: "税务局",
        amount: 200,
        cashAfter: 100
      },
      {
        id: "evt-15",
        type: "property-mortgaged",
        sequence: 15,
        snapshotVersion: 15,
        summary: "房主 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 245,
        cashAfter: 345
      },
      {
        id: "evt-16",
        type: "tax-paid",
        sequence: 16,
        snapshotVersion: 16,
        summary: "房主 补齐了税费。",
        playerId: "p1",
        amount: 200,
        cashAfter: 145
      },
      {
        id: "evt-17",
        type: "bankruptcy-declared",
        sequence: 17,
        snapshotVersion: 17,
        summary: "房主 宣告破产。",
        playerId: "p1",
        cashAfter: 0
      }
    ]);

    expect(updated.pendingPayment).toBeNull();
    expect(updated.players[0]?.mortgagedProperties).toEqual([]);
    expect(updated.players[0]?.isBankrupt).toBe(true);
    expect(updated.players[0]?.cash).toBe(0);

    const projection = toProjectionView(updated);
    expect(projection.latestSettlementSummary?.title).toContain("房主");
    expect(projection.latestSettlementSummary?.detail).toContain("银行");
  });

  test("derives readable deficit resolution summaries", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-23",
        type: "deficit-started",
        sequence: 23,
        snapshotVersion: 23,
        summary: "玩家二 需向 房主 支付 60 租金。",
        playerId: "p2",
        ownerPlayerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "南城路",
        amount: 60,
        cashAfter: 20,
      },
    ]);

    const projection = toProjectionView(updated);
    expect(projection.resolutionSummary?.actorName).toBe("玩家二");
    expect(projection.resolutionSummary?.creditorLabel).toContain("房主");
    expect(projection.resolutionSummary?.reasonLabel).toBe("租金");
    expect(projection.resolutionSummary?.shortfall).toBe(40);
    expect(projection.resolutionSummary?.sourceTileId).toBe("tile-1");
  });

  test("applies improvement build, sell, and rent deficit events", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-21",
        type: "improvement-built",
        sequence: 21,
        snapshotVersion: 21,
        summary: "房主 在 南城路 建造了等级 2。",
        playerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "南城路",
        cashAfter: 1445,
        improvementLevel: 2
      },
      {
        id: "evt-22",
        type: "improvement-sold",
        sequence: 22,
        snapshotVersion: 22,
        summary: "房主 卖掉了 南城路 的一层建筑。",
        playerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "南城路",
        cashAfter: 1472,
        improvementLevel: 1
      },
      {
        id: "evt-23",
        type: "deficit-started",
        sequence: 23,
        snapshotVersion: 23,
        summary: "玩家二 需向 房主 支付 60 租金。",
        playerId: "p2",
        ownerPlayerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "南城路",
        amount: 60,
        cashAfter: 20,
        improvementLevel: 1
      }
    ]);

    expect(updated.players[0]?.propertyImprovements?.["tile-1"]).toBe(1);
    expect(updated.players[0]?.cash).toBe(1472);
    expect(updated.pendingPayment?.reason).toBe("rent");
    expect(updated.pendingPayment?.creditorPlayerId).toBe("p1");
  });

  test("applies creditor-aware bankruptcy settlement", () => {
    const updated = applyRoomEvents(sampleProjection, [
      {
        id: "evt-24",
        type: "bankruptcy-declared",
        sequence: 24,
        snapshotVersion: 24,
        summary: "房主 向 玩家二 破产，资产已转移。",
        playerId: "p1",
        ownerPlayerId: "p2",
        ownerCashAfter: 1425,
        transferredPropertyIds: ["tile-1", "tile-6"],
        transferredMortgagedPropertyIds: ["tile-6"],
        transferredCardIds: ["chance-jail-card"],
        clearedImprovementTileIds: ["tile-1"],
      },
      {
        id: "evt-25",
        type: "bankruptcy-declared",
        sequence: 25,
        snapshotVersion: 25,
        summary: "玩家三 向银行破产，资产已清算。",
        playerId: "p3",
        returnedCardIds: ["community-jail-card"],
      },
    ]);

    expect(updated.players[0]?.isBankrupt).toBe(true);
    expect(updated.players[1]?.cash).toBe(1425);
    expect(updated.players[1]?.properties).toContain("tile-1");
    expect(updated.players[1]?.mortgagedProperties).toContain("tile-6");
    expect(updated.players[1]?.heldCardIds).toContain("chance-jail-card");
    expect(updated.communityDeck.discardPile).toContain("community-jail-card");
  });

  test("applies trade proposal, acceptance, and rejection", () => {
    const proposed = applyRoomEvents(sampleProjection, [
      {
        id: "evt-26",
        type: "trade-proposed",
        sequence: 26,
        snapshotVersion: 26,
        summary: "房主 向 玩家二 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 100,
        requestedCash: 50,
        tradeSnapshotVersion: 26,
      },
    ]);

    expect(proposed.turnState).toBe("awaiting-trade-response");
    expect(proposed.currentTurnPlayerId).toBe("p2");
    expect(proposed.pendingTrade?.offeredCash).toBe(100);

    const proposedProjection = toProjectionView(proposed);
    expect(proposedProjection.tradeSummary?.proposerName).toBe("房主");
    expect(proposedProjection.tradeSummary?.counterpartyName).toBe("玩家二");
    expect(proposedProjection.tradeSummary?.offeredCash).toBe(100);
    expect(proposedProjection.tradeSummary?.stageLabel).toContain("现在等 玩家二 表态");

    const accepted = applyRoomEvents(proposed, [
      {
        id: "evt-27",
        type: "trade-accepted",
        sequence: 27,
        snapshotVersion: 27,
        summary: "玩家二 接受了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 100,
        requestedCash: 50,
        cashAfterByPlayer: { p1: 1450, p2: 1550 },
      },
    ]);

    expect(accepted.pendingTrade).toBeNull();
    expect(accepted.currentTurnPlayerId).toBe("p1");
    expect(accepted.players[0]?.cash).toBe(1450);
    expect(accepted.players[1]?.cash).toBe(1550);

    const acceptedProjection = toProjectionView(accepted);
    expect(acceptedProjection.tradeSummary).toBeNull();
    expect(acceptedProjection.latestSettlementSummary?.title).toContain("接受了");
    expect(acceptedProjection.latestSettlementSummary?.kind).toBe("trade-accepted");
    expect(acceptedProjection.latestSettlementSummary?.tradeSettlement?.proposerName).toBe("房主");
    expect(acceptedProjection.latestSettlementSummary?.tradeSettlement?.counterpartyCashAfter).toBe(1550);
    expect(acceptedProjection.latestSettlementSummary?.tradeSettlement?.proposerSummary).toBe("交出 1 项 · 获得 1 项");
    expect(acceptedProjection.latestSettlementSummary?.tradeSettlement?.proposerGives).toEqual(["现金 100"]);
    expect(acceptedProjection.latestSettlementSummary?.tradeSettlement?.proposerGets).toEqual(["现金 50"]);

    const rejected = applyRoomEvents(proposed, [
      {
        id: "evt-28",
        type: "trade-rejected",
        sequence: 28,
        snapshotVersion: 28,
        summary: "玩家二 拒绝了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 100,
        requestedCash: 50,
      },
    ]);

    expect(rejected.pendingTrade).toBeNull();
    expect(rejected.turnState).toBe("awaiting-roll");
    expect(rejected.currentTurnPlayerId).toBe("p1");

    const rejectedProjection = toProjectionView(rejected);
    expect(rejectedProjection.latestSettlementSummary?.title).toContain("拒绝了");
    expect(rejectedProjection.latestSettlementSummary?.kind).toBe("trade-rejected");
    expect(rejectedProjection.latestSettlementSummary?.tone).toBe("neutral");
    expect(rejectedProjection.latestSettlementSummary?.tradeRejection?.nextActorName).toBe("房主");
    expect(rejectedProjection.latestSettlementSummary?.tradeRejection?.proposerOfferedSummary).toBe("原本想交出 1 项");
    expect(rejectedProjection.latestSettlementSummary?.tradeRejection?.proposerRequestedSummary).toBe("原本想获得 1 项");

    const replaySafeRejectedProjection = toProjectionView({
      ...rejected,
      recentEvents: rejected.recentEvents.filter((event) => event.type !== "trade-proposed"),
    });
    expect(replaySafeRejectedProjection.latestSettlementSummary?.title).toContain("拒绝了");
    expect(replaySafeRejectedProjection.latestSettlementSummary?.tradeRejection?.proposerRequested).toEqual(["现金 50"]);

    const oneSidedProposal = applyRoomEvents(sampleProjection, [
      {
        id: "evt-29",
        type: "trade-proposed",
        sequence: 29,
        snapshotVersion: 29,
        summary: "房主 向 玩家二 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 0,
        requestedCash: 50,
      },
      {
        id: "evt-30",
        type: "trade-rejected",
        sequence: 30,
        snapshotVersion: 30,
        summary: "玩家二 拒绝了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 0,
        requestedCash: 50,
      },
    ]);

    const oneSidedProjection = toProjectionView(oneSidedProposal);
    expect(oneSidedProjection.latestSettlementSummary?.tradeRejection?.proposerOfferedSummary).toBe("原本没有额外交出");
    expect(oneSidedProjection.latestSettlementSummary?.tradeRejection?.proposerRequestedSummary).toBe("原本想获得 1 项");
  });
});
