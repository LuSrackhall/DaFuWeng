import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const reviewDir = join(process.cwd(), "test-results", "ui-review");

function ensureScreenshotPath(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function buildBaseSnapshot(roomId: string) {
  return {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 1,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [3, 3],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 1500,
        position: 0,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1500,
        position: 0,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-1",
        type: "room-started",
        sequence: 1,
        snapshotVersion: 1,
        summary: "房主甲 开始了本局。",
        playerId: "p1",
      },
    ],
  };
}

async function installFakeEventSource(page: Page, roomId: string, activePlayer: { playerId: string; playerName: string } | null) {
  await page.addInitScript(({ currentRoomId, currentPlayer }) => {
    if (currentPlayer) {
      window.sessionStorage.setItem(
        `dafuweng-active-player:${currentRoomId}`,
        JSON.stringify({
          playerId: currentPlayer.playerId,
          playerName: currentPlayer.playerName,
          playerToken: "test-token",
        }),
      );
    } else {
      window.sessionStorage.removeItem(`dafuweng-active-player:${currentRoomId}`);
    }

    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {}
      addEventListener() {}
      close() {}
    }

    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId, currentPlayer: activePlayer });
}

async function mockRoomSnapshot(page: Page, roomId: string, snapshot: ReturnType<typeof buildBaseSnapshot>) {
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: snapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });
}

test("captures desktop active-turn player evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-ui-review-active-turn";
  const snapshot = buildBaseSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".route-loading-shell")).toHaveCount(0);
  await expect(page.locator(".room-sync-shell")).toHaveCount(0);
  await expect(page.getByText("现在先完成本回合掷骰")).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();

  const screenshotPath = join(reviewDir, "room-active-turn-desktop.png");
  ensureScreenshotPath(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
});

test("captures desktop property-decision player evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-ui-review-property-decision";
  const snapshot = {
    ...buildBaseSnapshot(roomId),
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-property-decision",
    pendingActionLabel: "等待当前玩家决定是否买地",
    pendingProperty: {
      tileId: "tile-3",
      tileIndex: 3,
      label: "北城路",
      price: 130,
    },
    lastRoll: [2, 1],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-offered", sequence: 2, snapshotVersion: 2, summary: "房主甲 可选择购买 北城路。", playerId: "p1", tileId: "tile-3", tileIndex: 3, tileLabel: "北城路", tilePrice: 130, lastRoll: [2, 1] },
    ],
  };

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);

  await page.goto(`/room/${roomId}`);

  await expect(page.getByRole("button", { name: "购买地产" })).toBeVisible();
  await expect(page.getByRole("button", { name: "放弃购买" })).toBeVisible();
  await expect(page.getByText("现在由你决定是否买下地产")).toBeVisible();
  await expect(page.getByText("北城路 · 价格 130")).toBeVisible();

  const screenshotPath = join(reviewDir, "room-property-decision-desktop.png");
  ensureScreenshotPath(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
});

test("captures mobile spectator in-game evidence without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const roomId = "room-ui-review-mobile-spectator";
  const snapshot = {
    ...buildBaseSnapshot(roomId),
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-property-decision",
    pendingActionLabel: "可购买 北城路，价格 130。",
    pendingProperty: {
      tileId: "tile-3",
      tileIndex: 3,
      label: "北城路",
      price: 130,
    },
    lastRoll: [2, 1],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-offered", sequence: 2, snapshotVersion: 2, summary: "房主甲 可选择购买 北城路。", playerId: "p1", tileId: "tile-3", tileIndex: 3, tileLabel: "北城路", tilePrice: 130, lastRoll: [2, 1] },
    ],
  };

  await installFakeEventSource(page, roomId, null);
  await mockRoomSnapshot(page, roomId, snapshot);

  await page.goto(`/room/${roomId}`);

  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  await expect(page.getByText("等待 房主甲 决定是否买地")).toBeVisible();
  await expect(page.getByText("北城路 · 价格 130")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);

  const screenshotPath = join(reviewDir, "room-mobile-spectator.png");
  ensureScreenshotPath(screenshotPath);
  await page.screenshot({ path: screenshotPath, fullPage: true });
});