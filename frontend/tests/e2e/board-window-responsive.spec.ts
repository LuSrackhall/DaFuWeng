import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

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

async function longPressDrag(page: Page, selector: string, deltaX: number, deltaY: number) {
  const box = await page.locator(selector).boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + Math.min(72, box.width * 0.28);
  const startY = box.y + Math.min(28, box.height * 0.55);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 20 });
  await page.mouse.up();
}

async function readCanvasMetrics(page: Page) {
  return page.locator(".board__pixi-host canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      clientWidth: rect.width,
      clientHeight: rect.height,
      renderWidth: canvas.width,
      renderHeight: canvas.height,
    };
  });
}

test("board window keeps full board visible while maximizing canvas area and supports 8-direction resizing", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 980 });

  const roomId = "room-board-responsive";
  const snapshot = buildInteractiveSnapshot(roomId);

  await installFakeEventSource(page, roomId);
  await mockRoomSnapshot(page, roomId, snapshot);
  await page.goto(`/room/${roomId}`);

  const boardWindow = page.locator(".board-resizable-wrap").first();
  const boardCanvas = page.locator(".board-window__canvas").first();
  const boardHost = page.locator(".board__pixi-host").first();

  await expect(boardWindow).toBeVisible();
  await expect(boardHost).toBeVisible();
  await expect(page.getByTestId("board-window-toggle-details")).toContainText("展开信息");

  await page.getByTestId("board-window-settings-toggle").click();
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("third-party-hold");

  const beforeLongPressDrag = await boardWindow.boundingBox();
  await longPressDrag(page, '[data-testid="board-window-drag-hotspot"]', 120, 80);
  const afterLongPressDrag = await boardWindow.boundingBox();
  expect(afterLongPressDrag && beforeLongPressDrag ? afterLongPressDrag.x > beforeLongPressDrag.x + 80 : false).toBe(true);
  expect(afterLongPressDrag && beforeLongPressDrag ? afterLongPressDrag.y > beforeLongPressDrag.y + 40 : false).toBe(true);

  await page.getByTestId("board-window-drag-mode").selectOption("native");
  await expect(page.getByTestId("board-window-drag-mode")).toHaveValue("native");
  await dragHandle(page, '[data-testid="board-window-drag-hotspot"]', 60, 40);
  const afterNativeDrag = await boardWindow.boundingBox();
  expect(afterNativeDrag && afterLongPressDrag ? afterNativeDrag.x > afterLongPressDrag.x + 40 : false).toBe(true);
  expect(afterNativeDrag && afterLongPressDrag ? afterNativeDrag.y > afterLongPressDrag.y + 20 : false).toBe(true);
  await page.getByTestId("board-window-settings-toggle").click();

  const canvasBeforeExpand = await boardCanvas.boundingBox();
  const metricsBeforeExpand = await readCanvasMetrics(page);
  expect(metricsBeforeExpand.clientWidth).toBeGreaterThan(300);
  expect(metricsBeforeExpand.clientHeight).toBeGreaterThan(300);
  expect(metricsBeforeExpand.renderWidth).toBeGreaterThan(300);
  expect(metricsBeforeExpand.renderHeight).toBeGreaterThan(300);

  await page.getByTestId("board-window-toggle-details").click();
  await expect(page.getByTestId("board-window-toggle-details")).toContainText("收起信息");
  const canvasExpanded = await boardCanvas.boundingBox();
  expect(canvasExpanded && canvasBeforeExpand ? canvasExpanded.height < canvasBeforeExpand.height : false).toBe(true);

  await page.getByTestId("board-window-toggle-details").click();
  await expect(page.getByTestId("board-window-toggle-details")).toContainText("展开信息");
  const canvasCollapsed = await boardCanvas.boundingBox();
  expect(canvasCollapsed && canvasBeforeExpand ? canvasCollapsed.height > canvasBeforeExpand.height - 4 : false).toBe(true);

  const boxBefore = await boardWindow.boundingBox();
  expect(boxBefore).not.toBeNull();

  for (const selector of [
    '.board-window-resize-handle--top',
    '.board-window-resize-handle--right',
    '.board-window-resize-handle--bottom',
    '.board-window-resize-handle--left',
    '.board-window-resize-handle--top-left',
    '.board-window-resize-handle--top-right',
    '.board-window-resize-handle--bottom-left',
    '.board-window-resize-handle--bottom-right',
  ]) {
    await expect(page.locator(selector)).toBeVisible();
  }

  await dragHandle(page, '.board-window-resize-handle--right', 140, 0);
  const afterRight = await boardWindow.boundingBox();
  expect(afterRight && boxBefore ? afterRight.width > boxBefore.width + 100 : false).toBe(true);

  await dragHandle(page, '.board-window-resize-handle--bottom', 0, 120);
  const afterBottom = await boardWindow.boundingBox();
  expect(afterBottom && afterRight ? afterBottom.height > afterRight.height + 80 : false).toBe(true);

  await dragHandle(page, '.board-window-resize-handle--left', -120, 0);
  const afterLeft = await boardWindow.boundingBox();
  expect(afterLeft && afterBottom ? afterLeft.x < afterBottom.x - 80 : false).toBe(true);
  expect(afterLeft && afterBottom ? afterLeft.width > afterBottom.width + 80 : false).toBe(true);

  await dragHandle(page, '.board-window-resize-handle--top', 0, -120);
  const afterTop = await boardWindow.boundingBox();
  expect(afterTop && afterLeft ? afterTop.y < afterLeft.y - 80 : false).toBe(true);
  expect(afterTop && afterLeft ? afterTop.height > afterLeft.height + 80 : false).toBe(true);

  await dragHandle(page, '.board-window-resize-handle--top-left', -40, -40);
  await dragHandle(page, '.board-window-resize-handle--top-right', 40, -40);
  await dragHandle(page, '.board-window-resize-handle--bottom-left', -40, 40);
  await dragHandle(page, '.board-window-resize-handle--bottom-right', 40, 40);

  const metricsAfterResize = await readCanvasMetrics(page);
  expect(metricsAfterResize.clientWidth).toBeGreaterThan(metricsBeforeExpand.clientWidth);
  expect(metricsAfterResize.clientHeight).toBeGreaterThan(metricsBeforeExpand.clientHeight);
  expect(metricsAfterResize.renderWidth).toBeGreaterThan(metricsBeforeExpand.renderWidth);
  expect(metricsAfterResize.renderHeight).toBeGreaterThan(metricsBeforeExpand.renderHeight);

  const canvasAfterResize = await boardCanvas.boundingBox();
  const hostAfterResize = await boardHost.boundingBox();
  expect(canvasAfterResize).not.toBeNull();
  expect(hostAfterResize).not.toBeNull();
  expect(hostAfterResize && canvasAfterResize ? hostAfterResize.width <= canvasAfterResize.width + 1 : false).toBe(true);
  expect(hostAfterResize && canvasAfterResize ? hostAfterResize.height <= canvasAfterResize.height + 1 : false).toBe(true);
});