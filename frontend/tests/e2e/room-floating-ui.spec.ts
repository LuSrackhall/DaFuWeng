import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

function buildInteractiveSnapshot(roomId: string) {
  return {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 6,
    eventSequence: 6,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待你掷骰",
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
        cash: 1360,
        position: 6,
        properties: ["tile-3"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1410,
        position: 4,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "dice-rolled", sequence: 2, snapshotVersion: 2, summary: "房主甲 掷出 3 + 3。", playerId: "p1", lastRoll: [3, 3] as [number, number] },
      { id: "evt-3", type: "player-moved", sequence: 3, snapshotVersion: 3, summary: "房主甲 前进到 北城路。", playerId: "p1", tileId: "tile-6", tileIndex: 6, tileLabel: "北城路", playerPosition: 6, lastRoll: [3, 3] as [number, number] },
      { id: "evt-4", type: "property-purchased", sequence: 4, snapshotVersion: 4, summary: "房主甲 买下 北城路。", playerId: "p1", tileId: "tile-6", tileIndex: 6, tileLabel: "北城路", tilePrice: 130, amount: 130, cashAfter: 1370 },
      { id: "evt-5", type: "turn-advanced", sequence: 5, snapshotVersion: 5, summary: "轮到 玩家乙 行动。", playerId: "p1", nextPlayerId: "p2" },
      { id: "evt-6", type: "turn-advanced", sequence: 6, snapshotVersion: 6, summary: "轮到 房主甲 继续行动。", playerId: "p2", nextPlayerId: "p1" },
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

async function mockRoomSnapshot(page: Page, roomId: string, snapshot: ReturnType<typeof buildInteractiveSnapshot>) {
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

async function dragLocator(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + Math.min(72, box.width * 0.26);
  const startY = box.y + Math.min(28, box.height * 0.5);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 18 });
  await page.mouse.up();
}

async function dragBottomRightCorner(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  await page.mouse.move(box.x + box.width - 8, box.y + box.height - 8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8 + deltaX, box.y + box.height - 8 + deltaY, { steps: 18 });
  await page.mouse.up();
}

async function beginPointerDrag(page: Page, selector: string, anchor: "toolbar" | "bottom-right" = "toolbar") {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const point = anchor === "bottom-right"
    ? { x: box.x + box.width - 8, y: box.y + box.height - 8 }
    : { x: box.x + Math.min(72, box.width * 0.26), y: box.y + Math.min(28, box.height * 0.5) };

  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
}

async function movePointerBy(page: Page, deltaX: number, deltaY: number) {
  await page.mouse.move(deltaX, deltaY, { steps: 18 });
}

async function releasePointer(page: Page) {
  await page.mouse.up();
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

test("desktop room floating surfaces drag resize and guidance interactions stay usable", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-desktop";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);

  await page.goto(`/room/${roomId}`);

  const boardWindow = page.locator(".board-resizable-wrap").first();
  const eventFeedWindow = page.locator(".floating-event-feed-shell").first();
  const eventFeedSurface = page.getByTestId("floating-event-feed-surface");
  const guidanceBanner = page.getByTestId("room-guidance-banner");

  await expect(boardWindow).toBeVisible();
  await expect(eventFeedWindow).toBeVisible();
  await expect(guidanceBanner).toBeVisible();

  const boardBefore = await boardWindow.boundingBox();
  const placeholderBefore = await page.locator(".board__stage-placeholder").boundingBox();
  expect(boardBefore).not.toBeNull();
  expect(placeholderBefore).not.toBeNull();
  expect(boardBefore?.x ?? 0).toBeLessThan(120);
  expect(boardBefore?.y ?? 0).toBeLessThan(160);

  await beginPointerDrag(page, '[data-testid="board-window-handle"]');
  await page.mouse.move((boardBefore?.x ?? 0) + 32, (boardBefore?.y ?? 0) + 18, { steps: 8 });
  await expect(page.getByTestId("board-window-hud")).toBeVisible();
  await expect(page.getByTestId("board-window-hud")).toContainText(/吸附到/);
  await releasePointer(page);

  await dragLocator(page, '.board-window__toolbar', 180, 96);
  await dragBottomRightCorner(page, '[data-testid="board-window-resize-bottom-right"]', 120, 140);

  const boardAfter = await boardWindow.boundingBox();
  expect(boardAfter).not.toBeNull();
  expect(boardAfter && boardBefore ? boardAfter.x - boardBefore.x : 0).toBeGreaterThan(120);
  expect(boardAfter && boardBefore ? boardAfter.y - boardBefore.y : 0).toBeGreaterThan(60);
  expect(boardAfter && boardBefore ? boardAfter.width - boardBefore.width : 0).toBeGreaterThan(80);
  expect(boardAfter && boardBefore ? boardAfter.height - boardBefore.height : 0).toBeGreaterThan(100);
  const boardEscapesDockBounds = Boolean(
    boardAfter && placeholderBefore
    && (
      boardAfter.x < placeholderBefore.x - 20
      || boardAfter.y < placeholderBefore.y - 20
      || boardAfter.x + boardAfter.width > placeholderBefore.x + placeholderBefore.width + 20
      || boardAfter.y + boardAfter.height > placeholderBefore.y + placeholderBefore.height + 20
    ),
  );
  expect(boardEscapesDockBounds).toBe(true);
  await beginPointerDrag(page, '[data-testid="board-window-resize-bottom-right"]', "bottom-right");
  await page.mouse.move((boardAfter?.x ?? 0) + (boardAfter?.width ?? 0) + 520, (boardAfter?.y ?? 0) + (boardAfter?.height ?? 0) + 280, { steps: 16 });
  await expect(page.getByTestId("board-window-hud")).toBeVisible();
  await expect(page.getByTestId("board-window-hud")).toContainText("已越出右侧");
  await releasePointer(page);
  const boardAfterOversize = await boardWindow.boundingBox();
  expect(boardAfterOversize ? boardAfterOversize.width : 0).toBeGreaterThan(1440);
  await dragBottomRightCorner(page, '[data-testid="board-window-resize-bottom-right"]', -2000, -2000);
  const boardAfterShrink = await boardWindow.boundingBox();
  expect(boardAfterShrink).not.toBeNull();
  expect(boardAfterShrink ? boardAfterShrink.width : 0).toBeGreaterThanOrEqual(520);
  expect(boardAfterShrink ? boardAfterShrink.height : 0).toBeGreaterThanOrEqual(420);

  const feedBefore = await eventFeedWindow.boundingBox();
  expect(feedBefore?.x ?? 0).toBeGreaterThan(760);
  expect(feedBefore?.y ?? 0).toBeLessThan(180);
  await beginPointerDrag(page, '[data-testid="floating-event-feed-handle"]');
  await page.mouse.move((feedBefore?.x ?? 0) - 8, (feedBefore?.y ?? 0) + 18, { steps: 8 });
  await expect(page.getByTestId("floating-event-feed-hud")).toBeVisible();
  await expect(page.getByTestId("floating-event-feed-hud")).toContainText(/吸附到/);
  await releasePointer(page);
  await dragLocator(page, '[data-testid="floating-event-feed-handle"]', -220, 72);
  await dragBottomRightCorner(page, '[data-testid="event-feed-resize-bottom-right"]', 120, 120);
  const feedAfterResize = await eventFeedWindow.boundingBox();
  expect(feedAfterResize).not.toBeNull();
  expect(feedAfterResize && feedBefore ? feedAfterResize.x - feedBefore.x : 0).toBeLessThan(-150);
  expect(feedAfterResize && feedBefore ? feedAfterResize.y - feedBefore.y : 0).toBeGreaterThan(40);
  expect(feedAfterResize && feedBefore ? feedAfterResize.width - feedBefore.width : 0).toBeGreaterThan(80);
  expect(feedAfterResize && feedBefore ? feedAfterResize.height - feedBefore.height : 0).toBeGreaterThan(80);

  await page.getByTestId("floating-event-feed-intro-toggle").click();
  await expect(page.getByTestId("floating-event-feed-intro")).toBeVisible();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-settings")).toBeVisible();
  const listExpanded = await page.locator(".floating-scroll-list").boundingBox();
  await page.getByTestId("floating-event-feed-intro-toggle").click();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-intro")).toHaveCount(0);
  await expect(page.getByTestId("floating-event-feed-settings")).toHaveCount(0);
  const listCollapsed = await page.locator(".floating-scroll-list").boundingBox();
  expect(listExpanded).not.toBeNull();
  expect(listCollapsed).not.toBeNull();
  expect(listCollapsed && listExpanded ? listExpanded.y - listCollapsed.y : 0).toBeGreaterThan(20);

  await beginPointerDrag(page, '[data-testid="event-feed-resize-bottom-right"]', "bottom-right");
  await page.mouse.move((feedAfterResize?.x ?? 0) + (feedAfterResize?.width ?? 0) + 420, (feedAfterResize?.y ?? 0) + (feedAfterResize?.height ?? 0) + 220, { steps: 16 });
  await expect(page.getByTestId("floating-event-feed-hud")).toBeVisible();
  await expect(page.getByTestId("floating-event-feed-hud")).toContainText("已越出右侧");
  await releasePointer(page);
  const feedAfterOversize = await eventFeedWindow.boundingBox();
  expect(feedAfterOversize ? feedAfterOversize.width : 0).toBeGreaterThan(900);
  await dragBottomRightCorner(page, '[data-testid="event-feed-resize-bottom-right"]', -2000, -2000);
  const feedAfterShrink = await eventFeedWindow.boundingBox();
  expect(feedAfterShrink).not.toBeNull();
  expect(feedAfterShrink ? feedAfterShrink.width : 0).toBeGreaterThanOrEqual(340);
  expect(feedAfterShrink ? feedAfterShrink.height : 0).toBeGreaterThanOrEqual(390);

  await expect(eventFeedSurface).toHaveAttribute("data-density", /compact|normal|large/);

  await page.getByTestId("open-rules-guide").click();
  await expect(page.getByTestId("rules-guide-panel")).toBeVisible();
  await expect(page.getByText("基础回合")).toBeVisible();
  await expect(page.getByText("自由布局")).toBeVisible();

  await attachScreenshot(page, testInfo, "room-floating-desktop");
});

test("mobile room guidance panel remains readable with floating surfaces enabled", async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });

  const roomId = "room-floating-mobile";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);

  await page.goto(`/room/${roomId}`);

  await expect(page.getByTestId("room-guidance-banner")).toBeVisible();
  await page.getByTestId("open-rules-guide").click();
  await expect(page.getByTestId("rules-guide-panel")).toBeVisible();
  await expect(page.getByText("交易、拍卖与欠款")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);

  await attachScreenshot(page, testInfo, "room-floating-mobile");
});
