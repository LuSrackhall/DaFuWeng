import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

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

async function installFakeEventSource(page: Page, roomId: string) {
  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p1",
        playerName: "房主甲",
        playerToken: "test-token",
      }),
    );

    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {}
      addEventListener() {}
      close() {}
    }

    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });
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

async function dragHandle(page: Page, selector: string, deltaX: number, deltaY: number) {
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

async function dragToolbar(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + Math.min(72, box.width * 0.2);
  const startY = box.y + Math.min(26, box.height * 0.5);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 20 });
  await page.mouse.up();
}

async function longPressDrag(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + Math.min(72, box.width * 0.28);
  const startY = box.y + Math.min(26, box.height * 0.55);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 20 });
  await page.mouse.up();
}

test("event feed window supports all-history and custom-max retention with native resize handles", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-event-feed-window";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId);
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  const eventFeedWindow = page.locator(".floating-event-feed-shell").first();
  const eventItems = page.locator(".floating-scroll-list > li");

  await expect(eventFeedWindow).toBeVisible();
  await expect(eventItems).toHaveCount(12);

  const beforeDrag = await eventFeedWindow.boundingBox();
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', -180, 80);
  const afterDrag = await eventFeedWindow.boundingBox();
  expect(afterDrag && beforeDrag ? afterDrag.x < beforeDrag.x - 120 : false).toBe(true);
  expect(afterDrag && beforeDrag ? afterDrag.y > beforeDrag.y + 40 : false).toBe(true);

  await expect(page.locator(".event-feed-resize-handle--top")).toBeVisible();
  await expect(page.locator(".event-feed-resize-handle--right")).toBeVisible();
  await expect(page.locator(".event-feed-resize-handle--bottom-right")).toBeVisible();

  const beforeResize = await eventFeedWindow.boundingBox();
  await dragHandle(page, ".event-feed-resize-handle--right", 140, 0);
  await dragHandle(page, ".event-feed-resize-handle--top", 0, -100);
  await dragHandle(page, ".event-feed-resize-handle--bottom-right", 80, 100);
  const afterResize = await eventFeedWindow.boundingBox();
  expect(afterResize && beforeResize ? afterResize.width > beforeResize.width + 160 : false).toBe(true);
  expect(afterResize && beforeResize ? afterResize.height > beforeResize.height + 120 : false).toBe(true);
  expect(afterResize && beforeResize ? afterResize.y < beforeResize.y - 60 : false).toBe(true);

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-settings")).toBeVisible();
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("当前展示 12 / 累计 12 条");

  await page.getByTestId("floating-event-feed-history-mode").selectOption("custom");
  await page.getByTestId("floating-event-feed-custom-max-count").fill("3");
  await page.getByTestId("floating-event-feed-custom-max-count").blur();
  await expect(eventItems).toHaveCount(3);
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("当前展示 3 / 累计 12 条");
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("已折叠更早 9 条历史事件");

  await page.getByTestId("floating-event-feed-history-mode").selectOption("all");
  await expect(eventItems).toHaveCount(12);
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("当前保留全部历史事件");

  await page.getByTestId("floating-event-feed-drag-mode").selectOption("native");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("native");
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  const beforeNativeDrag = await eventFeedWindow.boundingBox();
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', 80, 40);
  const afterNativeDrag = await eventFeedWindow.boundingBox();
  expect(afterNativeDrag && beforeNativeDrag ? afterNativeDrag.x > beforeNativeDrag.x + 40 : false).toBe(true);
  expect(afterNativeDrag && beforeNativeDrag ? afterNativeDrag.y > beforeNativeDrag.y + 20 : false).toBe(true);
});
