import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

function buildInteractiveSnapshot(roomId: string) {
  return {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 12,
    eventSequence: 12,
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
    recentEvents: Array.from({ length: 12 }, (_, index) => ({
      id: `evt-${index + 1}`,
      type: "turn-advanced",
      sequence: index + 1,
      snapshotVersion: index + 1,
      summary: `事件 ${index + 1}`,
      playerId: index % 2 === 0 ? "p1" : "p2",
      nextPlayerId: index % 2 === 0 ? "p2" : "p1",
    })),
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

async function longPressDrag(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + Math.min(72, box.width * 0.24);
  const startY = box.y + Math.min(36, box.height * 0.28);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 20 });
  await page.mouse.up();
}

async function dragResizeHandle(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 20 });
  await page.mouse.up();
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

async function getZIndex(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => Number.parseInt(window.getComputedStyle(element).zIndex || "0", 10));
}

test("desktop room floating surfaces follow whole-window long-press drag and shared drag-mode settings", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-desktop";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  const boardWindow = page.locator(".board-resizable-wrap").first();
  const eventFeedWindow = page.locator(".floating-event-feed-shell").first();
  const eventItems = page.locator(".floating-scroll-list > li");

  await expect(boardWindow).toBeVisible();
  await expect(eventFeedWindow).toBeVisible();
  await expect(page.getByTestId("room-guidance-banner")).toBeVisible();
  await expect(eventItems).toHaveCount(12);

  expect(await getZIndex(page, ".floating-event-feed-shell")).toBeGreaterThan(await getZIndex(page, ".board-resizable-wrap"));
  await page.getByTestId("board-window-bring-front").click();
  expect(await getZIndex(page, ".board-resizable-wrap")).toBeGreaterThan(await getZIndex(page, ".floating-event-feed-shell"));
  await page.getByTestId("floating-event-feed-bring-front").click();
  expect(await getZIndex(page, ".floating-event-feed-shell")).toBeGreaterThan(await getZIndex(page, ".board-resizable-wrap"));

  const boardBefore = await boardWindow.boundingBox();
  await page.getByTestId("board-window-settings-toggle").click();
  await expect(page.getByTestId("board-window-settings")).toBeVisible();
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("third-party-hold");
  await longPressDrag(page, '[data-testid="board-window-surface"]', 140, 90);
  const boardAfterThirdParty = await boardWindow.boundingBox();
  expect(boardAfterThirdParty && boardBefore ? boardAfterThirdParty.x > boardBefore.x + 100 : false).toBe(true);
  expect(boardAfterThirdParty && boardBefore ? boardAfterThirdParty.y > boardBefore.y + 50 : false).toBe(true);

  await page.getByTestId("board-window-drag-mode").selectOption("native");
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();
  await page.getByTestId("board-window-settings-toggle").click();
  await expect(page.getByTestId("board-window-settings")).toHaveCount(0);
  await longPressDrag(page, '[data-testid="board-window-surface"]', 70, 50);
  const boardAfterNative = await boardWindow.boundingBox();
  expect(boardAfterNative && boardAfterThirdParty ? boardAfterNative.x > boardAfterThirdParty.x + 40 : false).toBe(true);
  expect(boardAfterNative && boardAfterThirdParty ? boardAfterNative.y > boardAfterThirdParty.y + 20 : false).toBe(true);
  await dragResizeHandle(page, ".board-window-resize-handle--bottom-right", 120, 140);
  const boardAfterResize = await boardWindow.boundingBox();
  expect(boardAfterResize && boardAfterNative ? boardAfterResize.width > boardAfterNative.width + 80 : false).toBe(true);
  expect(boardAfterResize && boardAfterNative ? boardAfterResize.height > boardAfterNative.height + 100 : false).toBe(true);

  const feedBefore = await eventFeedWindow.boundingBox();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("floating-event-feed-drag-mode").selectOption("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', -180, 70);
  const feedAfterNative = await eventFeedWindow.boundingBox();
  expect(feedAfterNative && feedBefore ? feedAfterNative.x < feedBefore.x - 120 : false).toBe(true);
  expect(feedAfterNative && feedBefore ? feedAfterNative.y > feedBefore.y + 40 : false).toBe(true);

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("floating-event-feed-drag-mode").selectOption("native");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("native");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', 90, 50);
  const feedAfterThirdParty = await eventFeedWindow.boundingBox();
  expect(feedAfterThirdParty && feedAfterNative ? feedAfterThirdParty.x > feedAfterNative.x + 50 : false).toBe(true);
  expect(feedAfterThirdParty && feedAfterNative ? feedAfterThirdParty.y > feedAfterNative.y + 20 : false).toBe(true);
  await dragResizeHandle(page, ".event-feed-resize-handle--bottom-right", 120, 120);
  const feedAfterResize = await eventFeedWindow.boundingBox();
  expect(feedAfterResize && feedAfterThirdParty ? feedAfterResize.width > feedAfterThirdParty.width + 80 : false).toBe(true);
  expect(feedAfterResize && feedAfterThirdParty ? feedAfterResize.height > feedAfterThirdParty.height + 80 : false).toBe(true);

  await page.getByTestId("floating-event-feed-intro-toggle").click();
  await expect(page.getByTestId("floating-event-feed-intro")).toBeVisible();
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("floating-event-feed-history-mode").selectOption("custom");
  await page.getByTestId("floating-event-feed-custom-max-count").fill("4");
  await page.getByTestId("floating-event-feed-custom-max-count").blur();
  await expect(eventItems).toHaveCount(4);
  await page.getByTestId("floating-event-feed-history-mode").selectOption("all");
  await expect(eventItems).toHaveCount(12);
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("当前展示 12 / 累计 12 条");
  await page.getByTestId("floating-event-feed-intro-toggle").click();
  await expect(page.getByTestId("floating-event-feed-intro")).toHaveCount(0);
  await page.getByTestId("floating-event-feed-settings-toggle").click();

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
