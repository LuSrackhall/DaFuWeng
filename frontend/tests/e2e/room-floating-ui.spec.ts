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

async function readFrame(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return null;
  }

  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
}

test("desktop room floating surfaces follow whole-window long-press drag and independent drag-mode settings", async ({ page }, testInfo) => {
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
  await page.getByTestId("board-window-drag-hotspot").click();
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
  await page.getByTestId("floating-event-feed-numbering-order").selectOption("desc");
  await expect(page.getByTestId("floating-event-feed-numbering-order")).toHaveValue("desc");
  await expect(page.getByTestId("floating-event-feed-numbering-order")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-drag-hotspot").click();
  await expect(page.getByTestId("floating-event-feed-numbering-order")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-drag-mode").selectOption("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-drag-hotspot").click();
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
  await page.getByTestId("floating-event-feed-drag-hotspot").click();
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
  await expect(page.getByTestId("floating-event-feed-history-mode")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-drag-hotspot").click();
  await expect(page.getByTestId("floating-event-feed-history-mode")).not.toBeFocused();
  await page.getByTestId("floating-event-feed-custom-max-count").fill("4");
  await page.getByTestId("floating-event-feed-custom-max-count").blur();
  await expect(eventItems).toHaveCount(4);
  await page.getByTestId("floating-event-feed-history-mode").selectOption("all");
  await expect(eventItems).toHaveCount(12);
  await expect(page.getByTestId("floating-event-feed-metrics")).toContainText("当前展示 12 / 累计 12 条");
  await page.getByTestId("floating-event-feed-intro-toggle").click();
  await expect(page.getByTestId("floating-event-feed-intro")).toHaveCount(0);
  await page.getByTestId("floating-event-feed-settings-toggle").click();

  await expect(page.getByTestId("board-window-drag-hotspot")).toContainText("棋盘工作台");
  await expect(page.getByTestId("board-window-drag-hotspot")).not.toContainText("自由拖拽与八向缩放");
  await page.getByTestId("board-window-toggle-details").evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("board-window-drag-hotspot")).toContainText("自由拖拽与八向缩放");
  await page.getByTestId("board-window-toggle-details").evaluate((element: HTMLButtonElement) => element.click());

  await page.getByTestId("open-rules-guide").click();
  await expect(page.getByTestId("rules-guide-panel")).toBeVisible();
  await expect(page.getByText("基础回合")).toBeVisible();
  await expect(page.getByText("自由布局")).toBeVisible();

  await attachScreenshot(page, testInfo, "room-floating-desktop");
});

test("drag mode preferences persist independently after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-drag-persistence";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  await page.getByTestId("board-window-settings-toggle").click();
  await page.getByTestId("board-window-drag-mode").selectOption("native");
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await page.getByTestId("board-window-settings-toggle").click();

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("floating-event-feed-drag-mode").selectOption("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await page.getByTestId("floating-event-feed-settings-toggle").click();

  await page.reload();

  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await page.getByTestId("floating-event-feed-settings-toggle").click();
});

test("window frames and drag modes restore independently after repeated changes and reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-frame-persistence";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  await page.getByTestId("board-window-settings-toggle").click();
  await page.getByTestId("board-window-drag-mode").selectOption("native");
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await page.getByTestId("board-window-settings-toggle").click();

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await page.getByTestId("floating-event-feed-drag-mode").selectOption("third-party-hold");
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await page.getByTestId("floating-event-feed-settings-toggle").click();

  await longPressDrag(page, '[data-testid="board-window-surface"]', 150, 80);
  await dragResizeHandle(page, ".board-window-resize-handle--bottom-right", 110, 130);
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', -140, 60);
  await dragResizeHandle(page, ".event-feed-resize-handle--bottom-right", 90, 110);

  const boardFrameBeforeReload = await readFrame(page, ".board-resizable-wrap");
  const feedFrameBeforeReload = await readFrame(page, ".floating-event-feed-shell");

  await page.reload();

  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await page.getByTestId("board-window-settings-toggle").evaluate((element: HTMLButtonElement) => element.click());

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-drag-mode")).toHaveValue("third-party-hold");
  await page.getByTestId("floating-event-feed-settings-toggle").click();

  const boardFrameAfterReload = await readFrame(page, ".board-resizable-wrap");
  const feedFrameAfterReload = await readFrame(page, ".floating-event-feed-shell");

  expect(boardFrameAfterReload).not.toBeNull();
  expect(feedFrameAfterReload).not.toBeNull();
  expect(boardFrameBeforeReload).not.toBeNull();
  expect(feedFrameBeforeReload).not.toBeNull();

  expect(Math.abs((boardFrameAfterReload?.x ?? 0) - (boardFrameBeforeReload?.x ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((boardFrameAfterReload?.y ?? 0) - (boardFrameBeforeReload?.y ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((boardFrameAfterReload?.width ?? 0) - (boardFrameBeforeReload?.width ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((boardFrameAfterReload?.height ?? 0) - (boardFrameBeforeReload?.height ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((feedFrameAfterReload?.x ?? 0) - (feedFrameBeforeReload?.x ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((feedFrameAfterReload?.y ?? 0) - (feedFrameBeforeReload?.y ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((feedFrameAfterReload?.width ?? 0) - (feedFrameBeforeReload?.width ?? 0))).toBeLessThanOrEqual(2);
  expect(Math.abs((feedFrameAfterReload?.height ?? 0) - (feedFrameBeforeReload?.height ?? 0))).toBeLessThanOrEqual(2);
});

test("event-feed all four settings selects release focus after change and intercept simulated browser-refocus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-select-focus-guard";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  await page.getByTestId("floating-event-feed-settings-toggle").click();
  await expect(page.getByTestId("floating-event-feed-settings")).toBeVisible();

  // Each select: (1) change → not focused; (2) simulate browser returning focus (macOS Chromium
  // refocuses the <select> after the native OS picker closes) → still not focused.
  const selectCases: Array<{ testId: string; value: string }> = [
    { testId: "floating-event-feed-numbering-order", value: "desc" },
    { testId: "floating-event-feed-sorting-order", value: "desc" },
    { testId: "floating-event-feed-history-mode", value: "custom" },
    { testId: "floating-event-feed-drag-mode", value: "native" },
  ];

  for (const { testId, value } of selectCases) {
    await page.getByTestId(testId).selectOption(value);
    await expect(page.getByTestId(testId)).not.toBeFocused();
    // Simulate macOS Chromium refocusing the element. Because the guard is now a WeakSet with no
    // TTL (stays dismissed indefinitely until the user explicitly clicks the select again),
    // this refocus must be blocked no matter how late it arrives.
    await page.getByTestId(testId).evaluate((el: HTMLSelectElement) => el.focus());
    await expect(page.getByTestId(testId)).not.toBeFocused();
  }

  // Cover the click-away path too: if the select was blurred because the user clicked elsewhere,
  // any later browser refocus must still be blocked.
  await page.getByTestId("floating-event-feed-sorting-order").click();
  await expect(page.getByTestId("floating-event-feed-sorting-order")).toBeFocused();
  await page.getByTestId("floating-event-feed-drag-hotspot").click();
  await expect(page.getByTestId("floating-event-feed-sorting-order")).not.toBeFocused();
  await page.waitForTimeout(250);
  await page.getByTestId("floating-event-feed-sorting-order").evaluate((el: HTMLSelectElement) => el.focus());
  await expect(page.getByTestId("floating-event-feed-sorting-order")).not.toBeFocused();

  // Close settings; drag must still work normally — no lingering focus state should
  // interfere with the long-press drag detection in the underlying surface.
  await page.getByTestId("floating-event-feed-settings-toggle").click();
  const feedBefore = await page.locator(".floating-event-feed-shell").boundingBox();
  await longPressDrag(page, '[data-testid="floating-event-feed-surface"]', 60, 40);
  const feedAfter = await page.locator(".floating-event-feed-shell").boundingBox();
  expect(
    feedAfter && feedBefore
      ? Math.abs(feedAfter.x - feedBefore.x) + Math.abs(feedAfter.y - feedBefore.y) > 30
      : false,
  ).toBe(true);
});

test("board-window drag-mode select releases focus and intercepts simulated browser-refocus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-floating-board-select-guard";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId, { playerId: "p1", playerName: "房主甲" });
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  await page.getByTestId("board-window-settings-toggle").click();
  await expect(page.getByTestId("board-window-settings")).toBeVisible();

  // (1) Change value → must not be focused immediately after.
  await page.getByTestId("board-window-drag-mode").selectOption("native");
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();

  // (2) Simulate macOS Chromium asynchronously restoring focus (no-TTL guard should block any
  // refocus that arrives late, not just ones within 150 ms).
  await page.getByTestId("board-window-drag-mode").evaluate((el: HTMLSelectElement) => el.focus());
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();

  // (3) Simulate a delayed second refocus attempt (> 150 ms after change) — the previous
  // TTL-based implementation would have missed this; the WeakSet guard must catch it.
  await page.waitForTimeout(200);
  await page.getByTestId("board-window-drag-mode").evaluate((el: HTMLSelectElement) => el.focus());
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();

  // (3b) Cover the click-away path too: a select blurred by clicking elsewhere must still reject
  // any delayed browser refocus.
  await page.getByTestId("board-window-drag-mode").click();
  await expect(page.getByTestId("board-window-drag-mode")).toBeFocused();
  await page.getByTestId("board-window-drag-hotspot").click();
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();
  await page.waitForTimeout(250);
  await page.getByTestId("board-window-drag-mode").evaluate((el: HTMLSelectElement) => el.focus());
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();

  // (4) Clicking on the select (pointerdown) must un-dismiss it so the user can change it again.
  await page.getByTestId("board-window-drag-mode").click();
  // After an explicit click the picker opens — in Playwright headless the select may not open a
  // native OS picker; instead check that the select can receive focus from a click without the
  // guard immediately blurring it.
  // We restore the expected value and re-verify dismiss works once more.
  await page.getByTestId("board-window-drag-mode").selectOption("third-party-hold");
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();
  await page.getByTestId("board-window-drag-mode").evaluate((el: HTMLSelectElement) => el.focus());
  await expect(page.getByTestId("board-window-drag-mode")).not.toBeFocused();

  // (5) Close settings; long-press drag must still work normally.
  await page.getByTestId("board-window-settings-toggle").click();
  const boardBefore = await page.locator(".board-resizable-wrap").boundingBox();
  await longPressDrag(page, '[data-testid="board-window-surface"]', 80, 50);
  const boardAfter = await page.locator(".board-resizable-wrap").boundingBox();
  expect(
    boardAfter && boardBefore
      ? Math.abs(boardAfter.x - boardBefore.x) + Math.abs(boardAfter.y - boardBefore.y) > 30
      : false,
  ).toBe(true);
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
