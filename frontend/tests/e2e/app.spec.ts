import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

function extractRoomId(url: string) {
  const match = url.match(/\/room\/(room-\d+)$/);
  return match?.[1] ?? "";
}

async function createRoomAsHost(page: Page, hostName: string) {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill(hostName);
  await page.getByRole("button", { name: "创建房间" }).click();
  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());
  expect(roomId).toMatch(/^room-\d+$/);
  return roomId;
}

async function joinRoomAsPlayer(page: Page, roomId: string, playerName: string) {
  await page.goto("/");
  await page.getByLabel("加入房间").fill(roomId);
  await page.getByLabel("玩家昵称").fill(playerName);
  await page.getByRole("button", { name: "加入房间" }).click();
  await expect(page).toHaveURL(new RegExp(`/room/${roomId}$`));
}

async function readPendingPropertyDecision(page: Page) {
  const boardHost = page.locator(".board__pixi-host");
  await expect(boardHost).toHaveAttribute("aria-label", /(?:可选择购买|可购买) .*价格 \d+。/, { timeout: 10000 });

  const ariaLabel = await boardHost.getAttribute("aria-label");
  expect(ariaLabel).not.toBeNull();

  const match = ariaLabel?.match(/(?:可选择购买|可购买) ([^，。]+)[\s\S]*?价格 (\d+)。/);
  expect(match).not.toBeNull();

  return {
    label: match?.[1] ?? "",
    price: match ? Number(match[2]) : 0,
  };
}

test("room route loading shell appears while the room chunk is delayed", async ({
  page,
}) => {
  const roomId = "room-slow-route";
  let chunkDelayed = false;

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

  await page.route("**/assets/GamePage-*.js", async (route) => {
    if (!chunkDelayed) {
      chunkDelayed = true;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    await route.continue();
  });

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await route.fulfill({
      json: {
        roomId,
        roomState: "lobby",
        hostId: "p1",
        snapshotVersion: 1,
        eventSequence: 1,
        turnState: "awaiting-roll",
        currentTurnPlayerId: "p1",
        pendingActionLabel: "等待房间准备完成",
        pendingProperty: null,
        pendingAuction: null,
        pendingPayment: null,
        pendingTrade: null,
        chanceDeck: { drawPile: [], discardPile: [] },
        communityDeck: { drawPile: [], discardPile: [] },
        lastRoll: [0, 0],
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
            ready: false,
          },
        ],
        recentEvents: [],
      },
    });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  const loadingShell = page.locator(".route-loading-shell");
  await expect(loadingShell.getByText(`正在进入 ${roomId}`)).toBeVisible();
  await expect(loadingShell.getByText("恢复玩家会话")).toBeVisible();
  await expect(loadingShell.getByText("打开房间页面")).toBeVisible();
  await expect(loadingShell.getByText("确认你当前的席位")).toBeVisible();

  await expect(page.getByRole("heading", { name: "等待开局" })).toBeVisible();
  await expect(loadingShell).toHaveCount(0);
});

test("room page data loading state appears after the route shell is gone", async ({
  page,
}) => {
  const roomId = "room-slow-data";

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.removeItem(`dafuweng-active-player:${currentRoomId}`);

    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {}
      addEventListener() {}
      close() {}
    }

    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      json: {
        roomId,
        roomState: "lobby",
        hostId: "p1",
        snapshotVersion: 1,
        eventSequence: 1,
        turnState: "awaiting-roll",
        currentTurnPlayerId: "p1",
        pendingActionLabel: "等待房间准备完成",
        pendingProperty: null,
        pendingAuction: null,
        pendingPayment: null,
        pendingTrade: null,
        chanceDeck: { drawPile: [], discardPile: [] },
        communityDeck: { drawPile: [], discardPile: [] },
        lastRoll: [0, 0],
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
            ready: false,
          },
        ],
        recentEvents: [],
      },
    });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".route-loading-shell")).toHaveCount(0);
  const syncShell = page.locator(".room-sync-shell");
  await expect(syncShell.getByText("正在接回 room-slow-data")).toBeVisible();
  await expect(syncShell.getByText("当前以观战视角查看")).toBeVisible();
  await expect(syncShell.getByText("先别急着操作，等这一局重新接上再继续。")).toBeVisible();
  await expect(page.getByRole("heading", { name: "等待开局" })).toBeVisible();
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
});

test("mobile room sync shell stays prioritized during slow data recovery without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-slow-data";

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

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({
      json: {
        roomId,
        roomState: "lobby",
        hostId: "p1",
        snapshotVersion: 1,
        eventSequence: 1,
        turnState: "awaiting-roll",
        currentTurnPlayerId: "p1",
        pendingActionLabel: "等待房间准备完成",
        pendingProperty: null,
        pendingAuction: null,
        pendingPayment: null,
        pendingTrade: null,
        chanceDeck: { drawPile: [], discardPile: [] },
        communityDeck: { drawPile: [], discardPile: [] },
        lastRoll: [0, 0],
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
            ready: false,
          },
        ],
        recentEvents: [],
      },
    });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  const syncShell = page.locator(".room-sync-shell");
  const boardPanel = page.locator(".panel--board");
  const roomStatePanel = page.locator(".panel--room-state");

  await expect(page.locator(".route-loading-shell")).toHaveCount(0);
  await expect(syncShell.getByText("正在接回 room-mobile-slow-data")).toBeVisible();
  await expect(syncShell.getByText("当前使用 房主甲 的席位")).toBeVisible();
  await expect(syncShell.getByText("先别急着操作，等这一局重新接上再继续。")).toBeVisible();
  await expect(syncShell).toBeInViewport();

  const syncBox = await syncShell.boundingBox();
  const boardBox = await boardPanel.boundingBox();
  const roomStateBox = await roomStatePanel.boundingBox();

  expect(syncBox?.y).toBeLessThan(boardBox?.y ?? Number.POSITIVE_INFINITY);
  expect(syncBox?.y).toBeLessThan(roomStateBox?.y ?? Number.POSITIVE_INFINITY);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("room sync shell shows reconnect guidance after realtime error and clears after catch-up recovery", async ({
  page,
}) => {
  const roomId = "room-reconnect-recovery";
  const initialSnapshot = {
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
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    currentTurnPlayerId: "p2",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-2",
        type: "turn-advanced",
        sequence: 2,
        snapshotVersion: 2,
        summary: "玩家乙 接过了当前回合。",
        playerId: "p1",
        nextPlayerId: "p2",
      },
    ],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".room-sync-shell")).toHaveCount(0);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const syncShell = page.locator(".room-sync-shell");
  await expect(syncShell.getByText("刚刚和房间断了一下线")).toBeVisible();
  await expect(syncShell.getByText("当前使用 房主甲 的席位")).toBeVisible();
  await expect(syncShell.getByText("先看住眼前这一步，等连接恢复后再确认关键操作。")).toBeVisible();
  await expect(syncShell.getByText("连接刚刚晃了一下，正在继续接回这一局")).toBeVisible();
  await expect(page.getByText("房主甲 开始了本局。").first()).toBeVisible();
  await expect(page.getByText("当前以 房主甲 身份加入此房间。").first()).toBeVisible();

  await expect(syncShell).toHaveCount(0, { timeout: 10000 });
  const playerRecoveryBar = page.locator(".room-reconnect-success");
  await expect(playerRecoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible();
  await expect(playerRecoveryBar.getByText("刚刚补回：玩家乙 接过了当前回合。 当前轮到 玩家乙 掷骰。")).toBeVisible();
  await expect(page.getByText("玩家乙 接过了当前回合。").last()).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".room-shell__pill").getByText("玩家乙")).toBeVisible();
});

test("spectator reconnect stays read-only after realtime error and catch-up recovery", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  const spectatorPage = await browser.newPage();
  await spectatorPage.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await spectatorPage.goto(`/room/${roomId}`);
  await expect(
    spectatorPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作."),
  ).toHaveCount(0);
  await expect(
    spectatorPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。"),
  ).toBeVisible();
  await expect(
    spectatorPage.locator(".stage-card--overview").getByText("当前以只读观战身份查看此房间。").first(),
  ).toBeVisible();
  await expect(spectatorPage.getByRole("button", { name: /以 .* 身份掷骰/ })).toHaveCount(0);

  await spectatorPage.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const spectatorSyncShell = spectatorPage.locator(".room-sync-shell");
  await expect(spectatorSyncShell.getByText("刚刚和房间断了一下线")).toBeVisible();
  await expect(spectatorSyncShell.getByText("当前以观战视角查看")).toBeVisible();
  await expect(spectatorSyncShell.getByText("先看住这局眼前的进度，等连接恢复后会继续刷新。")).toBeVisible();
  await expect(spectatorPage.getByRole("button", { name: /以 .* 身份掷骰/ })).toHaveCount(0);

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);

  await expect(spectatorSyncShell).toHaveCount(0, { timeout: 10000 });
  const spectatorRecoveryBar = spectatorPage.locator(".room-reconnect-success");
  await expect(spectatorRecoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible();
  await expect(spectatorRecoveryBar.locator(".room-reconnect-success__hint")).toContainText("刚刚补回：");
  await expect(spectatorRecoveryBar.locator(".room-reconnect-success__hint")).toContainText(`现在轮到 房主甲决定是否以 ${propertyDecision.price} 买下 ${propertyDecision.label}。`);
  await expect(spectatorPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  await expect(spectatorPage.getByRole("button", { name: "购买地产" })).toHaveCount(0);
  await expect(spectatorPage.getByRole("button", { name: /以 .* 身份掷骰/ })).toHaveCount(0);

  await spectatorPage.close();
  await guestPage.close();
});

test("mobile spectator reconnect shows recovery feedback and stays read-only without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-spectator-reconnect-overview";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-property-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "可购买 北城路，价格 130。",
    pendingProperty: {
      tileId: "tile-3",
      tileIndex: 3,
      label: "北城路",
      price: 130,
    },
    lastRoll: [2, 1],
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "property-offered", sequence: 2, snapshotVersion: 2, summary: "房主甲 可选择购买 北城路。", playerId: "p1", tileId: "tile-3", tileIndex: 3, tileLabel: "北城路", tilePrice: 130, lastRoll: [2, 1] },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();

  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const spectatorSyncShell = page.locator(".room-sync-shell");
  await expect(spectatorSyncShell.getByText("刚刚和房间断了一下线")).toBeVisible();
  await expect(spectatorSyncShell).toBeInViewport();
  await expect(spectatorSyncShell).toHaveCount(0, { timeout: 10000 });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible();
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("刚刚补回：");
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在轮到 房主甲决定是否以 130 买下 北城路。");
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "购买地产" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /以 .* 身份掷骰/ })).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile player reconnect keeps success feedback contextual and dismisses after recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-player-reconnect";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 1,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
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
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    currentTurnPlayerId: "p1",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-2",
        type: "turn-advanced",
        sequence: 2,
        snapshotVersion: 2,
        summary: "房主甲 接过了当前回合。",
        playerId: "p2",
        nextPlayerId: "p1",
      },
    ],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.locator(".room-sync-shell")).toHaveCount(0);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const syncShell = page.locator(".room-sync-shell");
  await expect(syncShell.getByText("刚刚和房间断了一下线")).toBeVisible();

  await expect(syncShell).toHaveCount(0, { timeout: 10000 });
  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible();
  await expect(recoveryBar.getByText("同步已恢复")).toBeVisible();
  await expect(recoveryBar.getByText("刚刚补回：房主甲 接过了当前回合。 现在轮到你继续掷骰。")).toBeVisible();
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeInViewport();
  await page.waitForTimeout(1800);
  await expect(recoveryBar).toBeVisible();
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("reconnect success falls back to current turn context when no latest event summary exists", async ({
  page,
}) => {
  const roomId = "room-reconnect-no-summary";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 0,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
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
    recentEvents: [],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 0,
    currentTurnPlayerId: "p1",
    recentEvents: [],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("系统已把这局追到最新进度。 现在轮到你继续掷骰。")).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });
  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("最近恢复")).toBeVisible();
  await expect(recapCard.getByText("系统已把这局追到最新进度。")).toBeVisible();
  await expect(recapCard.getByText("现在轮到你继续掷骰。")).toBeVisible();
  await expect(recapCard.getByText("你回来的位置是等待掷骰，系统刚把这一局追到眼前")).toBeVisible();
});

test("mobile player reconnect narrates property decision recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-property-reconnect";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 1,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-property-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家决定是否买地",
    pendingProperty: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-2",
        type: "property-offered",
        sequence: 2,
        snapshotVersion: 2,
        summary: "房主甲 来到了 东湖路。",
        playerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        tilePrice: 160,
      },
    ],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("刚刚补回：房主甲 来到了 东湖路。 现在轮到你决定是否以 160 买下 东湖路。")).toBeVisible();
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "购买地产" })).toBeVisible();
  await expect(page.getByRole("button", { name: "放弃购买" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile player reconnect narrates deficit recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-deficit-reconnect";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 1,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 20, position: 1, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 3, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-deficit-resolution",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家处理欠款",
    pendingPayment: {
      amount: 120,
      reason: "rent",
      creditorKind: "player",
      creditorPlayerId: "p2",
      sourceTileId: "tile-1",
      sourceTileLabel: "东湖路",
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-2",
        type: "deficit-started",
        sequence: 2,
        snapshotVersion: 2,
        summary: "房主甲 需向 玩家乙 支付 120 租金。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 120,
        cashAfter: 20,
      },
    ],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("刚刚补回：房主甲 需向 玩家乙 支付 120 租金。 现在轮到你处理租金欠款，还差 100。")).toBeVisible();
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "下一步先抵押 南城路" })).toBeVisible();
  await expect(page.getByRole("button", { name: "宣告破产" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("four-player reconnect keeps rent deficit recovery actionable only for the debtor", async ({
  browser,
  page,
}) => {
  const roomId = "room-four-player-rent-deficit-reconnect";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 7,
    eventSequence: 7,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p4",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 1520,
        position: 1,
        properties: ["tile-1"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 20,
        position: 39,
        properties: ["tile-39"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p3",
        name: "玩家丙",
        cash: 1500,
        position: 8,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p4",
        name: "玩家丁",
        cash: 1500,
        position: 12,
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
      {
        id: "evt-7",
        type: "turn-advanced",
        sequence: 7,
        snapshotVersion: 7,
        summary: "轮到下一位玩家行动。",
        nextPlayerId: "p4",
      },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 8,
    eventSequence: 8,
    turnState: "awaiting-deficit-resolution",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家处理欠款",
    pendingPayment: {
      amount: 120,
      reason: "rent",
      creditorKind: "player",
      creditorPlayerId: "p1",
      sourceTileId: "tile-1",
      sourceTileLabel: "南城路",
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-8",
        type: "deficit-started",
        sequence: 8,
        snapshotVersion: 8,
        summary: "玩家乙 需向 房主甲 支付 120 租金。",
        playerId: "p2",
        ownerPlayerId: "p1",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "南城路",
        amount: 120,
        cashAfter: 20,
      },
    ],
  };

  async function openReconnectPlayerPage(
    targetPage: Page,
    session: { playerId: string; playerName: string; playerToken: string },
  ) {
    await targetPage.addInitScript(
      ({ currentRoomId, currentSession }) => {
        window.sessionStorage.setItem(
          `dafuweng-active-player:${currentRoomId}`,
          JSON.stringify(currentSession),
        );

        class FakeEventSource {
          onerror: (() => void) | null = null;

          constructor() {
            const instances =
              (
                window as typeof window & {
                  __testEventSources?: FakeEventSource[];
                }
              ).__testEventSources ?? [];
            instances.push(this);
            (
              window as typeof window & {
                __testEventSources?: FakeEventSource[];
              }
            ).__testEventSources = instances;
          }

          addEventListener() {}
          close() {}
          emitError() {
            this.onerror?.();
          }
        }

        (
          window as typeof window & { __testEventSources?: FakeEventSource[] }
        ).__testEventSources = [];
        window.EventSource = FakeEventSource as unknown as typeof EventSource;
      },
      { currentRoomId: roomId, currentSession: session },
    );

    let shouldRecover = false;
    let didRecover = false;

    await targetPage.route(`**/api/rooms/${roomId}`, async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ json: initialSnapshot });
        return;
      }

      await route.continue();
    });
    await targetPage.route(
      `**/api/rooms/${roomId}/events?afterSequence=*`,
      async (route) => {
        if (shouldRecover && !didRecover) {
          didRecover = true;
          await route.fulfill({
            json: { snapshot: recoveredSnapshot, events: [] },
          });
          return;
        }

        await route.fulfill({ json: { snapshot: null, events: [] } });
      },
    );

    await targetPage.goto(`/room/${roomId}`);
    await expect(
      targetPage
        .locator(".stage-card--overview")
        .getByText(`当前以 ${session.playerName} 身份加入此房间。`)
        .first(),
    ).toBeVisible();
    await expect(
      targetPage.getByText("等待当前玩家掷骰").first(),
    ).toBeVisible();

    return async () => {
      shouldRecover = true;
      await targetPage.evaluate(() => {
        const instances =
          (
            window as typeof window & {
              __testEventSources?: Array<{ emitError(): void }>;
            }
          ).__testEventSources ?? [];
        instances[0]?.emitError();
      });
    };
  }

  const thirdPage = await browser.newPage();
  const triggerDebtorRecovery = await openReconnectPlayerPage(page, {
    playerId: "p2",
    playerName: "玩家乙",
    playerToken: "debtor-token",
  });
  const triggerObserverRecovery = await openReconnectPlayerPage(thirdPage, {
    playerId: "p3",
    playerName: "玩家丙",
    playerToken: "observer-token",
  });

  await triggerDebtorRecovery();
  await triggerObserverRecovery();

  const debtorRecoveryBar = page.locator(".room-reconnect-success");
  await expect(
    debtorRecoveryBar.getByText("已重新连入牌局，当前进度已同步"),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    debtorRecoveryBar.locator(".room-reconnect-success__hint"),
  ).toContainText("玩家乙 需向 房主甲 支付 120 租金");
  await expect(
    debtorRecoveryBar.locator(".room-reconnect-success__hint"),
  ).toContainText("现在轮到你处理租金欠款，还差 100");
  await expect(
    page.getByRole("button", { name: "抵押 终章大道" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "宣告破产" })).toBeVisible();

  const observerRecoveryBar = thirdPage.locator(".room-reconnect-success");
  await expect(
    observerRecoveryBar.getByText("已重新连入牌局，当前进度已同步"),
  ).toBeVisible({ timeout: 10000 });
  await expect(
    observerRecoveryBar.locator(".room-reconnect-success__hint"),
  ).toContainText("玩家乙 需向 房主甲 支付 120 租金");
  await expect(
    observerRecoveryBar.locator(".room-reconnect-success__hint"),
  ).toContainText("现在由 玩家乙处理租金欠款，还差 100");
  await expect(
    thirdPage
      .locator(".room-primary-anchor")
      .getByText("当前由 玩家乙 处理欠款，其他人暂时只能等待。"),
  ).toBeVisible();
  await expect(
    thirdPage.getByRole("button", { name: /下一步先抵押/ }),
  ).toHaveCount(0);
  await expect(thirdPage.getByRole("button", { name: "宣告破产" })).toHaveCount(
    0,
  );
  await expect(
    thirdPage.getByText("若由 玩家乙 执行，本次可补足欠款"),
  ).toBeVisible();
  await expect(
    thirdPage.getByText(
      "当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。",
    ),
  ).toHaveCount(0);

  await thirdPage.close();
});

test("reconnect success narrates live auction recovery", async ({
  page,
}) => {
  const roomId = "room-reconnect-auction";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-declined", sequence: 2, snapshotVersion: 2, summary: "房主甲 放弃购买 东湖路。", playerId: "p1", tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路", tilePrice: 160 },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p2",
      passedPlayerIds: [],
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-3", type: "auction-bid-submitted", sequence: 3, snapshotVersion: 3, summary: "玩家乙 目前以 51 领先。", playerId: "p2", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p1", playerName: "房主甲", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("刚刚补回：玩家乙 目前以 51 领先。 现在轮到你决定是否至少以 52 继续竞拍 东湖路，当前最高价是 玩家乙 的 51。")).toBeVisible();
  await expect(page.getByRole("button", { name: "提交出价" })).toBeVisible();
  await expect(page.getByRole("button", { name: "放弃本轮竞拍" })).toBeVisible();
});

test("recent event feed defaults to eight items and persists local display settings", async ({
  page,
}) => {
  const roomId = "room-event-feed-settings";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 12,
    eventSequence: 12,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [2, 3],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 5, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: Array.from({ length: 12 }, (_, index) => ({
      id: `evt-${index + 1}`,
      type: "turn-advanced",
      sequence: index + 1,
      snapshotVersion: index + 1,
      summary: `事件 ${index + 1}`,
      nextPlayerId: index % 2 === 0 ? "p1" : "p2",
    })),
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p1",
        playerName: "房主甲",
        playerToken: "test-token",
      }),
    );
    if (!window.sessionStorage.getItem("dafuweng-event-feed-test-initialized")) {
      window.localStorage.removeItem("dafuweng-room-event-feed-preferences");
      window.sessionStorage.setItem("dafuweng-event-feed-test-initialized", "true");
    }

    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {}
      addEventListener() {}
      close() {}
    }

    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await route.fulfill({ json: snapshot });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  const eventFeed = page.locator(".board-event-feed");
  const items = eventFeed.locator(".board-event-feed__item");
  await expect(eventFeed.getByText("最近事件")).toBeVisible();
  await expect(items).toHaveCount(8);
  await expect(items.first()).toContainText("事件 5");
  await expect(items.first().locator(".board-event-feed__number")).toHaveText("8");
  await expect(items.last()).toContainText("事件 12");
  await expect(items.last().locator(".board-event-feed__number")).toHaveText("1");

  await eventFeed.getByRole("button", { name: "调整阅读方式" }).click();
  await eventFeed.getByLabel("我更想先看到").selectOption("top");
  await eventFeed.getByLabel("我想怎么认序号").selectOption("near-large");
  await eventFeed.getByLabel("一次先看多少条").selectOption("custom");
  await eventFeed.getByLabel("这次先看几条").fill("6");

  await expect(items).toHaveCount(6);
  await expect(items.first()).toContainText("事件 12");
  await expect(items.first().locator(".board-event-feed__number")).toHaveText("6");
  await expect(items.last()).toContainText("事件 7");
  await expect(items.last().locator(".board-event-feed__number")).toHaveText("1");

  await page.reload();

  const reloadedFeed = page.locator(".board-event-feed");
  const reloadedItems = reloadedFeed.locator(".board-event-feed__item");
  await expect(reloadedItems).toHaveCount(6);
  await expect(reloadedItems.first()).toContainText("事件 12");
  await expect(reloadedItems.last()).toContainText("事件 7");
});

test("mobile recent event reading preferences stay readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-event-feed-settings";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 12,
    eventSequence: 12,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [4, 2],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 4, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: Array.from({ length: 10 }, (_, index) => ({
      id: `evt-mobile-${index + 1}`,
      type: "turn-advanced",
      sequence: index + 1,
      snapshotVersion: index + 1,
      summary: `移动事件 ${index + 1}`,
      nextPlayerId: index % 2 === 0 ? "p1" : "p2",
    })),
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p1",
        playerName: "房主甲",
        playerToken: "test-token",
      }),
    );
    window.localStorage.removeItem("dafuweng-room-event-feed-preferences");

    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {}
      addEventListener() {}
      close() {}
    }

    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await route.fulfill({ json: snapshot });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  const eventFeed = page.locator(".board-event-feed");
  await expect(eventFeed.getByRole("button", { name: "调整阅读方式" })).toBeVisible();
  await eventFeed.getByRole("button", { name: "调整阅读方式" }).click();

  await expect(eventFeed.getByLabel("我更想先看到")).toBeVisible();
  await expect(eventFeed.getByText("只会改变你扫读时间线的方向，不会改动真实事件顺序。")).toBeVisible();
  await expect(eventFeed.getByLabel("我想怎么认序号")).toBeVisible();
  await expect(eventFeed.getByText("序号只是你的阅读辅助，不是后台的真实事件编号。")).toBeVisible();
  await expect(eventFeed.getByLabel("一次先看多少条")).toBeVisible();

  await eventFeed.getByLabel("一次先看多少条").selectOption("custom");
  await expect(eventFeed.getByLabel("这次先看几条")).toBeVisible();
  await eventFeed.getByLabel("这次先看几条").fill("5");

  const mobileItems = eventFeed.locator(".board-event-feed__item");
  await expect(mobileItems).toHaveCount(5);
  await expect(eventFeed).toBeInViewport();
  await mobileItems.last().scrollIntoViewIfNeeded();
  await expect(mobileItems.last()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("auction input stays exclusive to the primary anchor and gives immediate minimum-bid feedback", async ({
  page,
}) => {
  const roomId = "room-auction-input-surface";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 6,
    eventSequence: 6,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingProperty: null,
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p1",
      passedPlayerIds: [],
    },
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-6", type: "auction-bid-submitted", sequence: 6, snapshotVersion: 6, summary: "房主甲 目前以 51 领先。", playerId: "p1", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p2",
        playerName: "玩家乙",
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

  await page.route(`**/api/rooms/${roomId}`, async (route) => {
    await route.fulfill({ json: snapshot });
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);

  const anchor = page.locator(".room-primary-anchor");
  const auctionStage = page.locator(".stage-card--auction");
  const bidInput = anchor.getByLabel("你的本轮报价");
  await expect(anchor.getByText(/最低有效价 52/)).toBeVisible();
  await expect(anchor.getByRole("button", { name: "提交出价" })).toBeVisible();
  await expect(auctionStage.getByLabel("你的本轮报价")).toHaveCount(0);
  await expect(auctionStage.getByRole("button", { name: "提交出价" })).toHaveCount(0);

  await bidInput.fill("5a0");
  await expect(bidInput).toHaveValue("50");
  await expect(anchor.getByText("请输入不低于 52 的整数报价。")).toBeVisible();
  await expect(anchor.getByRole("button", { name: "提交出价" })).toBeDisabled();

  await anchor.getByRole("button", { name: "出价 62" }).click();
  await expect(bidInput).toHaveValue("62");
  await expect(anchor.getByRole("button", { name: "提交出价" })).toBeEnabled();
});

test("reconnect success narrates trade response recovery", async ({
  page,
}) => {
  const roomId = "room-reconnect-trade-response";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家回应交易报价",
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 30,
      offeredTileIds: ["tile-1"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 2,
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "trade-proposed", sequence: 2, snapshotVersion: 2, summary: "房主甲 向 玩家乙 发出一笔交易报价。", playerId: "p1" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p2", playerName: "玩家乙", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("刚刚补回：房主甲 向 玩家乙 发出一笔交易报价。 现在轮到你决定是否接受 房主甲 递来的交易报价。")).toBeVisible();
  await expect(page.getByRole("button", { name: "接受交易" })).toBeVisible();
  await expect(page.getByRole("button", { name: "拒绝交易" })).toBeVisible();
});

test("reconnect success narrates jail decision recovery", async ({
  page,
}) => {
  const roomId = "room-reconnect-jail";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 10, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: ["card-jail"], jailTurnsServed: 1, inJail: true, isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "player-jailed", sequence: 1, snapshotVersion: 1, summary: "房主甲 进入监狱，下一回合必须先处理出狱决策。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家处理出狱决策",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "jail-roll-attempted", sequence: 2, snapshotVersion: 2, summary: "房主甲 仍在监狱中，当前需要继续处理出狱决策。", playerId: "p1", failedAttemptCount: 1 },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p1", playerName: "房主甲", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText(/监狱/).first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.getByText("刚刚补回：房主甲 仍在监狱中，当前需要继续处理出狱决策。 现在轮到你决定如何离开监狱，可选掷骰、支付 50 罚金或使用 1 张出狱卡。")).toBeVisible();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toBeVisible();
});

test("spectator reconnect keeps a lightweight recovery recap during live auction", async ({
  page,
}) => {
  const roomId = "room-spectator-reconnect-auction";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-declined", sequence: 2, snapshotVersion: 2, summary: "房主甲 放弃购买 东湖路。", playerId: "p1", tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路", tilePrice: 160 },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p2",
      passedPlayerIds: [],
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-3", type: "auction-bid-submitted", sequence: 3, snapshotVersion: 3, summary: "玩家乙 目前以 51 领先。", playerId: "p2", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const syncShell = page.locator(".room-sync-shell");
  await expect(syncShell.getByText("刚刚和房间断了一下线")).toBeVisible();
  await expect(syncShell).toHaveCount(0, { timeout: 10000 });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在轮到 房主甲 决定是否继续竞拍 东湖路");
  await expect(page.getByRole("button", { name: "提交出价" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "放弃本轮竞拍" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("最近恢复")).toBeVisible();
  await expect(recapCard.getByText("玩家乙 目前以 51 领先。")).toBeVisible();
  await expect(recapCard.getByText("现在轮到 房主甲 决定是否继续竞拍 东湖路，当前最高价是 玩家乙 的 51。")).toBeVisible();
  await expect(recapCard.getByText("你继续看到的是公开拍卖，刚接到第 3 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
});

test("spectator reconnect keeps a lightweight recovery recap during trade response", async ({
  page,
}) => {
  const roomId = "room-spectator-reconnect-trade";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家回应交易报价",
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 30,
      offeredTileIds: ["tile-1"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 2,
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "trade-proposed", sequence: 2, snapshotVersion: 2, summary: "房主甲 向 玩家乙 发出一笔交易报价。", playerId: "p1" },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在等待 玩家乙 回应 房主甲 的交易报价。");
  await expect(page.getByRole("button", { name: "接受交易" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "拒绝交易" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("最近恢复")).toBeVisible();
  await expect(recapCard.getByText("房主甲 向 玩家乙 发出一笔交易报价。")).toBeVisible();
  await expect(recapCard.getByText("现在等待 玩家乙 回应 房主甲 的交易报价。")).toBeVisible();
  await expect(recapCard.getByText("你继续看到的是等待交易答复，刚接到第 2 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
});

test("spectator reconnect keeps a lightweight recovery recap during jail decision", async ({
  page,
}) => {
  const roomId = "room-spectator-reconnect-jail";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 10, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: ["card-jail"], jailTurnsServed: 1, inJail: true, isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "player-jailed", sequence: 1, snapshotVersion: 1, summary: "房主甲 进入监狱，下一回合必须先处理出狱决策。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家处理出狱决策",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "jail-roll-attempted", sequence: 2, snapshotVersion: 2, summary: "房主甲 仍在监狱中，当前需要继续处理出狱决策。", playerId: "p1", failedAttemptCount: 1 },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在轮到 房主甲 决定如何离开监狱");
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("最近恢复")).toBeVisible();
  await expect(recapCard.getByText("房主甲 仍在监狱中，当前需要继续处理出狱决策。")).toBeVisible();
  await expect(recapCard.getByText(/现在轮到 房主甲 决定如何离开监狱/)).toBeVisible();
  await expect(recapCard.getByText("你继续看到的是监狱决策，刚接到第 2 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
});

test("recent recovery recap clears after authoritative progress advances beyond its anchor", async ({
  page,
}) => {
  const roomId = "room-recovery-recap-expiry";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 1,
    eventSequence: 0,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    recentEvents: [
      { id: "evt-2", type: "turn-advanced", sequence: 2, snapshotVersion: 2, summary: "房主甲 接过了当前回合。", playerId: "p2", nextPlayerId: "p1" },
    ],
  };
  const advancedSnapshot = {
    ...recoveredSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-property-decision",
    pendingActionLabel: "等待当前玩家决定是否买地",
    pendingProperty: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
    },
    recentEvents: [
      ...recoveredSnapshot.recentEvents,
      { id: "evt-3", type: "property-offered", sequence: 3, snapshotVersion: 3, summary: "房主甲 来到了 东湖路。", playerId: "p1", tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路", tilePrice: 160 },
    ],
  };

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

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  let shouldAdvance = false;
  let didAdvance = false;

  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }

    if (shouldAdvance && !didAdvance) {
      didAdvance = true;
      await route.fulfill({ json: { snapshot: advancedSnapshot, events: [] } });
      return;
    }

    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("你回来的位置是等待掷骰，刚接到第 2 条关键进展")).toBeVisible();

  shouldAdvance = true;
  await expect(page.getByRole("button", { name: "购买地产" })).toBeVisible({ timeout: 10000 });
  await expect(recapCard).toHaveCount(0, { timeout: 5000 });
});

test("mobile spectator reconnect keeps auction recovery readable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-spectator-reconnect-auction";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-declined", sequence: 2, snapshotVersion: 2, summary: "房主甲 放弃购买 东湖路。", playerId: "p1", tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路", tilePrice: 160 },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p2",
      passedPlayerIds: [],
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-3", type: "auction-bid-submitted", sequence: 3, snapshotVersion: 3, summary: "玩家乙 目前以 51 领先。", playerId: "p2", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在轮到 房主甲 决定是否继续竞拍 东湖路");
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "提交出价" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "放弃本轮竞拍" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("你继续看到的是公开拍卖，刚接到第 3 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile spectator reconnect keeps trade response recovery readable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-spectator-reconnect-trade";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家回应交易报价",
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 30,
      offeredTileIds: ["tile-1"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 2,
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "trade-proposed", sequence: 2, snapshotVersion: 2, summary: "房主甲 向 玩家乙 发出一笔交易报价。", playerId: "p1" },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在等待 玩家乙 回应 房主甲 的交易报价。");
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "接受交易" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "拒绝交易" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("你继续看到的是等待交易答复，刚接到第 2 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile spectator reconnect keeps jail decision recovery readable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-spectator-reconnect-jail";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 10, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: ["card-jail"], jailTurnsServed: 1, inJail: true, isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "player-jailed", sequence: 1, snapshotVersion: 1, summary: "房主甲 进入监狱，下一回合必须先处理出狱决策。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家处理出狱决策",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "jail-roll-attempted", sequence: 2, snapshotVersion: 2, summary: "房主甲 仍在监狱中，当前需要继续处理出狱决策。", playerId: "p1", failedAttemptCount: 1 },
    ],
  };

  await page.addInitScript(() => {
    class FakeEventSource {
      onerror: (() => void) | null = null;

      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }

      addEventListener() {}
      close() {}
      emitError() {
        this.onerror?.();
      }
    }

    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，可以继续旁观当前进展")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar.locator(".room-reconnect-success__hint")).toContainText("现在轮到 房主甲 决定如何离开监狱");
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });

  const recapCard = page.locator(".room-recovery-recap");
  await expect(recapCard.getByText("你继续看到的是监狱决策，刚接到第 2 条关键进展")).toBeVisible();
  await expect(recapCard.getByText("当前仍为只读观战")).toBeVisible();
});

test("mobile player reconnect keeps auction recovery actionable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-player-reconnect-auction";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 1, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
      { id: "evt-2", type: "property-declined", sequence: 2, snapshotVersion: 2, summary: "房主甲 放弃购买 东湖路。", playerId: "p1", tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路", tilePrice: 160 },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p2",
      passedPlayerIds: [],
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-3", type: "auction-bid-submitted", sequence: 3, snapshotVersion: 3, summary: "玩家乙 目前以 51 领先。", playerId: "p2", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p1", playerName: "房主甲", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "提交出价" })).toBeVisible();
  await expect(page.getByRole("button", { name: "放弃本轮竞拍" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile player reconnect keeps trade response actionable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-player-reconnect-trade";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家回应交易报价",
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 30,
      offeredTileIds: ["tile-1"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 2,
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "trade-proposed", sequence: 2, snapshotVersion: 2, summary: "房主甲 向 玩家乙 发出一笔交易报价。", playerId: "p1" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p2", playerName: "玩家乙", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "接受交易" })).toBeVisible();
  await expect(page.getByRole("button", { name: "拒绝交易" })).toBeVisible();
  await expect(page.getByRole("button", { name: "接受交易" })).toBeInViewport();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile player reconnect keeps jail decision actionable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-player-reconnect-jail";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 10, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: ["card-jail"], jailTurnsServed: 1, inJail: true, isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "player-jailed", sequence: 1, snapshotVersion: 1, summary: "房主甲 进入监狱，下一回合必须先处理出狱决策。", playerId: "p1" },
    ],
  };
  const recoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家处理出狱决策",
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "jail-roll-attempted", sequence: 2, snapshotVersion: 2, summary: "房主甲 仍在监狱中，当前需要继续处理出狱决策。", playerId: "p1", failedAttemptCount: 1 },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p1", playerName: "房主甲", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let shouldRecover = false;
  let didRecover = false;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (shouldRecover && !didRecover) {
      didRecover = true;
      await route.fulfill({ json: { snapshot: recoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText(/监狱/).first()).toBeVisible();
  shouldRecover = true;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("已重新连入牌局，当前进度已同步")).toBeVisible({ timeout: 10000 });
  await expect(recoveryBar).toBeInViewport();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toBeVisible();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeInViewport();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("second reconnect replaces the previous reconnect narrative context", async ({
  page,
}) => {
  const roomId = "room-reconnect-repeat";
  const initialSnapshot = {
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
    lastRoll: [0, 0],
    players: [
      { id: "p1", name: "房主甲", cash: 1500, position: 0, properties: ["tile-1"], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
      { id: "p2", name: "玩家乙", cash: 1500, position: 0, properties: [], mortgagedProperties: [], propertyImprovements: {}, heldCardIds: [], isBankrupt: false },
    ],
    recentEvents: [
      { id: "evt-1", type: "room-started", sequence: 1, snapshotVersion: 1, summary: "房主甲 开始了本局。", playerId: "p1" },
    ],
  };
  const firstRecoveredSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 2,
    eventSequence: 2,
    turnState: "awaiting-auction",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家完成竞拍动作",
    pendingAuction: {
      tileId: "tile-1",
      tileIndex: 1,
      label: "东湖路",
      price: 160,
      initiatorPlayerId: "p1",
      highestBid: 51,
      highestBidderId: "p2",
      passedPlayerIds: [],
    },
    recentEvents: [
      ...initialSnapshot.recentEvents,
      { id: "evt-2", type: "auction-bid-submitted", sequence: 2, snapshotVersion: 2, summary: "玩家乙 目前以 51 领先。", playerId: "p2", amount: 51, tileId: "tile-1", tileIndex: 1, tileLabel: "东湖路" },
    ],
  };
  const secondRecoveredSnapshot = {
    ...firstRecoveredSnapshot,
    snapshotVersion: 3,
    eventSequence: 3,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家回应交易报价",
    pendingAuction: null,
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 80,
      requestedCash: 20,
      offeredTileIds: ["tile-1"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 3,
    },
    recentEvents: [
      ...firstRecoveredSnapshot.recentEvents,
      { id: "evt-3", type: "trade-proposed", sequence: 3, snapshotVersion: 3, summary: "房主甲 向 玩家乙 发出一笔交易报价。", playerId: "p1" },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(`dafuweng-active-player:${currentRoomId}`, JSON.stringify({ playerId: "p2", playerName: "玩家乙", playerToken: "test-token" }));
    class FakeEventSource {
      onerror: (() => void) | null = null;
      constructor() {
        const instances = (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources ?? [];
        instances.push(this);
        (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = instances;
      }
      addEventListener() {}
      close() {}
      emitError() { this.onerror?.(); }
    }
    (window as typeof window & { __testEventSources?: FakeEventSource[] }).__testEventSources = [];
    window.EventSource = FakeEventSource as unknown as typeof EventSource;
  }, { currentRoomId: roomId });

  let recoveryStep = 0;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: initialSnapshot });
      return;
    }
    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    if (recoveryStep === 1) {
      recoveryStep = 0;
      await route.fulfill({ json: { snapshot: firstRecoveredSnapshot, events: [] } });
      return;
    }
    if (recoveryStep === 2) {
      recoveryStep = 0;
      await route.fulfill({ json: { snapshot: secondRecoveredSnapshot, events: [] } });
      return;
    }
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });

  await page.goto(`/room/${roomId}`);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  recoveryStep = 1;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  const recoveryBar = page.locator(".room-reconnect-success");
  await expect(recoveryBar.getByText("刚刚补回：玩家乙 目前以 51 领先。 现在轮到 房主甲 决定是否继续竞拍 东湖路，当前最高价是 玩家乙 的 51。")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "提交出价" })).toHaveCount(0);

  recoveryStep = 2;
  await page.evaluate(() => {
    const instances = (window as typeof window & { __testEventSources?: Array<{ emitError(): void }> }).__testEventSources ?? [];
    instances[0]?.emitError();
  });

  await expect(recoveryBar.getByText("刚刚补回：房主甲 向 玩家乙 发出一笔交易报价。 现在轮到你决定是否接受 房主甲 递来的交易报价。")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2500);
  await expect(recoveryBar).toBeVisible();
  await expect(recoveryBar.getByText(/竞拍 东湖路/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "接受交易" })).toBeVisible();
  await expect(page.getByRole("button", { name: "拒绝交易" })).toBeVisible();
  await expect(page.getByRole("button", { name: "提交出价" })).toHaveCount(0);
  await expect(recoveryBar).toHaveCount(0, { timeout: 5000 });
});

test("two real players can create, join, start, buy, pay rent, and refresh the same authoritative room", async ({
  browser,
  page,
}) => {
  const roomId = await createRoomAsHost(page, "房主甲");
  await expect(page.getByRole("heading", { name: "Da Fu Weng" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "等待开局" })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "返回大厅" })).toBeVisible();
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();
  await expect(page.locator(".board__tile")).toHaveCount(0);
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();

  const guestPage = await browser.newPage();
  await joinRoomAsPlayer(guestPage, roomId, "玩家乙");

  await expect(page.getByText("等待房间开始")).toBeVisible();
  await expect(guestPage.getByText("等待房间开始")).toBeVisible();
  await expect(page.getByText("现在该做什么", { exact: true })).toBeVisible();
  await expect(page.locator(".room-primary-anchor").getByText("现在由房主推进开局")).toBeVisible();
  await expect(page.getByText("当前人数: 2")).toBeVisible();
  await expect(page.locator(".stage-card--overview").getByText("当前以 房主甲 身份加入此房间。").first()).toBeVisible();
  await expect(page.getByText(/刷新后会回到这同一局，并继续保留你刚才的身份/)).toBeVisible();
  await expect(page.getByText("房主: 房主甲")).toBeVisible();
  await expect(guestPage.locator(".stage-card--overview").getByText("当前以 玩家乙 身份加入此房间。").first()).toBeVisible();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /当前回合 房主甲，焦点 起点/);

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`当前回合 房主甲，焦点 ${propertyDecision.label}`));

  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();
  await expect(page.getByText(/这次买地结果已经记下/)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`棋盘后果 房主甲 买下 ${propertyDecision.label}，支付 ${propertyDecision.price}，归属已确认`));
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);
  await expect(page.getByText(/现金: 1340/)).toBeVisible();
  await expect(page.getByText(/地产: 1/)).toBeVisible();

  await expect(guestPage.getByText(/现金: 1340/)).toBeVisible();
  await expect(guestPage.getByText(/地产: 1/)).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰")).toBeVisible();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText(/现金: 1478/)).toBeVisible();
  await expect(page.getByText(/现金: 1362/)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 玩家乙 向 房主甲 支付租金 22/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText(/现金: 1362/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible({ timeout: 10000 });

  await guestPage.close();
});

test("three real players stay synchronized across create, join, start, and sequential rent turns", async ({
  browser,
  page,
}) => {
  test.slow();

  const roomId = await createRoomAsHost(page, "房主甲");

  const secondPage = await browser.newPage();
  await joinRoomAsPlayer(secondPage, roomId, "玩家乙");

  const thirdPage = await browser.newPage();
  await joinRoomAsPlayer(thirdPage, roomId, "玩家丙");

  await expect(page.getByText("当前人数: 3")).toBeVisible();
  await expect(secondPage.getByText("当前人数: 3")).toBeVisible();
  await expect(thirdPage.getByText("当前人数: 3")).toBeVisible();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(secondPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(thirdPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);
  await page.getByRole("button", { name: "购买地产" }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);
  await expect(thirdPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);

  await secondPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 玩家乙 向 房主甲 支付租金 22/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);
  await expect(thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ })).toBeVisible();

  await thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ }).click();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 玩家丙 向 房主甲 支付租金 22/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(page.getByText(/现金: 1384/).first()).toBeVisible();
  await expect(secondPage.getByText(/现金: 1478/).first()).toBeVisible();
  await expect(thirdPage.getByText(/现金: 1478/).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${propertyDecision.label}`))).toBeVisible();

  await thirdPage.close();
  await secondPage.close();
});

test("four real players can fill a room and reject a fifth joiner", async ({
  browser,
  page,
}) => {
  test.slow();

  const roomId = await createRoomAsHost(page, "房主甲");

  const secondPage = await browser.newPage();
  await joinRoomAsPlayer(secondPage, roomId, "玩家乙");

  const thirdPage = await browser.newPage();
  await joinRoomAsPlayer(thirdPage, roomId, "玩家丙");

  const fourthPage = await browser.newPage();
  await joinRoomAsPlayer(fourthPage, roomId, "玩家丁");

  await expect(page.getByText("当前人数: 4")).toBeVisible();
  await expect(secondPage.getByText("当前人数: 4")).toBeVisible();
  await expect(thirdPage.getByText("当前人数: 4")).toBeVisible();
  await expect(fourthPage.getByText("当前人数: 4")).toBeVisible();

  const rejectedPage = await browser.newPage();
  await rejectedPage.goto("/");
  await rejectedPage.getByLabel("加入房间").fill(roomId);
  await rejectedPage.getByLabel("玩家昵称").fill("玩家戊");
  await rejectedPage.getByRole("button", { name: "加入房间" }).click();
  await expect(rejectedPage.getByText("room is full")).toBeVisible();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(secondPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(thirdPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(fourthPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await page.getByRole("button", { name: "购买地产" }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家乙 接过当前回合，现在轮到 玩家乙 掷骰。/);

  await secondPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);
  await expect(thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ })).toBeVisible();
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);

  await rejectedPage.close();
  await fourthPage.close();
  await thirdPage.close();
  await secondPage.close();
});

test("four real players can refresh a seated page and keep the same authoritative room state", async ({
  browser,
  page,
}) => {
  test.slow();

  const roomId = await createRoomAsHost(page, "房主甲");

  const secondPage = await browser.newPage();
  await joinRoomAsPlayer(secondPage, roomId, "玩家乙");

  const thirdPage = await browser.newPage();
  await joinRoomAsPlayer(thirdPage, roomId, "玩家丙");

  const fourthPage = await browser.newPage();
  await joinRoomAsPlayer(fourthPage, roomId, "玩家丁");

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(secondPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(thirdPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(fourthPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await page.getByRole("button", { name: "购买地产" }).click();

  await secondPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/);

  await fourthPage.reload();
  await expect(fourthPage.locator(".stage-card--overview").getByText("当前以 玩家丁 身份加入此房间。").first()).toBeVisible({ timeout: 10000 });
  await expect(fourthPage.getByText("等待当前玩家掷骰").first()).toBeVisible({ timeout: 10000 });
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丙 接过当前回合，现在轮到 玩家丙 掷骰。/, { timeout: 10000 });

  await thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 玩家丙 向 房主甲 支付租金 22/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(fourthPage.getByRole("button", { name: /以 玩家丁 身份掷骰/ })).toBeVisible();

  await fourthPage.close();
  await thirdPage.close();
  await secondPage.close();
});

test("four real players can refresh the active player page and continue the same authoritative turn", async ({
  browser,
  page,
}) => {
  test.slow();

  const roomId = await createRoomAsHost(page, "房主甲");

  const secondPage = await browser.newPage();
  await joinRoomAsPlayer(secondPage, roomId, "玩家乙");

  const thirdPage = await browser.newPage();
  await joinRoomAsPlayer(thirdPage, roomId, "玩家丙");

  const fourthPage = await browser.newPage();
  await joinRoomAsPlayer(fourthPage, roomId, "玩家丁");

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(secondPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(thirdPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(fourthPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await page.getByRole("button", { name: "购买地产" }).click();

  await secondPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(thirdPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/);
  await expect(fourthPage.getByRole("button", { name: /以 玩家丁 身份掷骰/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toHaveCount(0);
  await expect(secondPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ })).toHaveCount(0);
  await expect(thirdPage.getByRole("button", { name: /以 玩家丙 身份掷骰/ })).toHaveCount(0);

  await fourthPage.reload();

  await expect(fourthPage.locator(".stage-card--overview").getByText("当前以 玩家丁 身份加入此房间。").first()).toBeVisible({ timeout: 10000 });
  await expect(fourthPage.getByText("等待当前玩家掷骰").first()).toBeVisible({ timeout: 10000 });
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 玩家丁 接过当前回合，现在轮到 玩家丁 掷骰。/, { timeout: 10000 });
  await expect(fourthPage.getByRole("button", { name: /以 玩家丁 身份掷骰/ })).toBeVisible({ timeout: 10000 });
  await expect(fourthPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toHaveCount(0);

  await fourthPage.getByRole("button", { name: /以 玩家丁 身份掷骰/ }).click();

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 玩家丁 向 房主甲 支付租金 22/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(secondPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(thirdPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(fourthPage.locator(".board__pixi-host")).toHaveAttribute("aria-label", /回合接管 房主甲 接过当前回合，现在轮到 房主甲 掷骰。/);
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();

  await fourthPage.close();
  await thirdPage.close();
  await secondPage.close();
});

test("viewer without a joined room session stays read-only instead of inheriting the current turn", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());
  expect(roomId).toMatch(/^room-\d+$/);

  const viewerPage = await browser.newPage();
  await viewerPage.goto(`/room/${roomId}`);

  await expect(
    viewerPage.getByText(
      "当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。",
    ),
  ).toBeVisible();
  await expect(viewerPage.locator(".stage-card--overview").getByText("当前以只读观战身份查看此房间。").first()).toBeVisible();
  await expect(
    viewerPage.locator(".room-primary-anchor").getByText("等待房间准备完成"),
  ).toBeVisible();
  await expect(viewerPage.getByText("等待房间开始")).toBeVisible();

  await viewerPage.close();
});

test("declined property enters a readable live auction stage across two pages", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());
  expect(roomId).toMatch(/^room-\d+$/);

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);

  await page.getByRole("button", { name: "放弃购买" }).click();

  await expect(page.getByText("公开拍卖进行中")).toBeVisible();
  await expect(guestPage.getByText("公开拍卖进行中")).toBeVisible();
  await expect(page.getByText(new RegExp(`房主甲 放弃购买后，${propertyDecision.label} 进入公开拍卖。`))).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`阶段焦点 公开拍卖，当前轮到 玩家乙 决定 ${propertyDecision.label}`));
  await expect(guestPage.locator(".room-primary-anchor").getByText(/你可以直接在这里提交出价或放弃竞拍，当前最低有效报价为 1。/)).toBeVisible();
  await expect(guestPage.locator(".room-primary-anchor").getByRole("button", { name: "提交出价" })).toBeVisible();
  await expect(guestPage.locator(".stage-card--auction").getByRole("button", { name: "提交出价" })).toHaveCount(0);
  await expect(page.locator(".stage-card--auction").getByText("当前轮到")).toBeVisible();
  await expect(page.locator(".stage-card--auction .status-card").filter({ hasText: "当前轮到" }).getByText("玩家乙")).toBeVisible();

  await guestPage.getByRole("button", { name: "出价 51" }).click();
  await guestPage.getByRole("button", { name: "提交出价" }).click();

  await expect(page.getByText(/玩家乙 · 51/)).toBeVisible();
  await expect(guestPage.getByText(/玩家乙 · 51/)).toBeVisible();

  await page.getByRole("button", { name: "放弃本轮竞拍" }).click();

  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`阶段收束 公开拍卖已结束，玩家乙 竞得 ${propertyDecision.label}`));
  await expect(guestPage.getByText(/现金: 1449/)).toBeVisible();
  await expect(guestPage.getByText(/地产: 1/)).toBeVisible();

  await guestPage.close();
});

test("unsold auction uses a neutral result card and board semantics", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);

  await page.getByRole("button", { name: "放弃购买" }).click();
  await guestPage.getByRole("button", { name: "放弃本轮竞拍" }).click();
  await page.getByRole("button", { name: "放弃本轮竞拍" }).click();

  await expect(page.getByText("拍卖未成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/没有玩家接手这块地产，产权仍保持未售出状态。/)).toBeVisible();
  await expect(page.locator(".stage-card--neutral").getByText(`${propertyDecision.label} 本轮流拍`)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`最近结果 ${propertyDecision.label} 本轮流拍`));
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`阶段收束 公开拍卖已结束，${propertyDecision.label} 本轮流拍`));
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("拍卖未成交", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/没有玩家接手这块地产，产权仍保持未售出状态。/)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", new RegExp(`最近结果 ${propertyDecision.label} 本轮流拍`));

  await guestPage.close();
});

test("live trade response uses a dominant stage card and keeps diagnostics collapsible", async ({
  browser,
  page,
}) => {
  test.slow();

  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());
  expect(roomId).toMatch(/^room-\d+$/);

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  const spectatorPage = await browser.newPage();
  await spectatorPage.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);
  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "展开本回合可选动作" })).toBeVisible();

  await page.getByRole("button", { name: "展开本回合可选动作" }).click();
  await expect(page.getByText("发起双边交易报价", { exact: true })).toBeVisible();
  await expect(page.getByText("选对象", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一步：选择我给出的内容" }).click();

  await page.getByLabel("我出现金").fill("120");
  await page.getByRole("button", { name: `选择我出让的地产 ${propertyDecision.label}` }).click();
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await page.getByLabel("我索要现金").fill("30");
  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await expect(page.getByText("高风险交易确认面", { exact: true })).toBeVisible();
  await expect(page.getByText("最高优先后果", { exact: true })).toBeVisible();
  await expect(page.getByText("先看这些风险与后果", { exact: true })).toBeVisible();
  await expect(page.getByText("再看交换明细", { exact: true })).toBeVisible();
  await expect(page.getByText(/现金净流向: 你净支付 90 给 玩家乙/)).toBeVisible();
  await expect(page.getByText(/交易后现金: 你 \d+ · 玩家乙 \d+/)).toBeVisible();
  await expect(page.getByText(/点下确认后，这笔报价就会送到 玩家乙 面前。房间会停下来等对方表态/)).toBeVisible();
  await page.getByRole("button", { name: "返回继续编辑草案" }).click();
  await expect(page.getByLabel("我索要现金")).toHaveValue("30");
  await page.getByRole("button", { name: "返回选择我给出的内容" }).click();
  await expect(page.getByLabel("我出现金")).toHaveValue("120");
  await expect(page.getByRole("button", { name: `选择我出让的地产 ${propertyDecision.label}` })).toHaveClass(/asset-chip--selected/);
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await page.getByRole("button", { name: "确认并发起交易" }).click();

  await expect(page.getByText("双边交易待响应")).toBeVisible();
  await expect(page.getByText("报价已送达，等待对手回应", { exact: true })).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段焦点 交易回应，当前轮到 玩家乙 回应 房主甲 的报价/);
  await expect(page.getByText(/现在先别操作: 等对方给答复/).first()).toBeVisible();
  await expect(page.locator(".room-primary-anchor").getByText(/你的报价已经送达 玩家乙，当前主动作已转到对方。/)).toBeVisible();
  await expect(page.getByText(/房主甲 交出/)).toBeVisible();
  await expect(guestPage.getByText("双边交易待响应")).toBeVisible();
  await expect(guestPage.getByText("轮到你决定是否接受这笔报价", { exact: true })).toBeVisible();
  await expect(guestPage.locator(".room-primary-anchor").getByText(/现在由你拍板: 接受或拒绝这笔交易/)).toBeVisible();
  await expect(guestPage.locator(".room-primary-anchor").getByText("现在由你拍板这笔交易")).toBeVisible();
  await expect(guestPage.getByText(/轮到你决定是否接受 房主甲 的报价。/)).toBeVisible();
  await expect(guestPage.getByText(/接下来会怎样/)).toBeVisible();
  await expect(spectatorPage.getByText("双边交易待响应")).toBeVisible();
  await expect(spectatorPage.getByText("房间暂停在交易回应阶段", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText(/你当前不能操作: 此阶段仅可查看交易内容/).first()).toBeVisible();
  await expect(spectatorPage.locator(".room-primary-anchor").getByText("房间暂停在交易回应上")).toBeVisible();

  await expect(page.getByRole("button", { name: "展开诊断抽屉" })).toBeVisible();
  await page.getByRole("button", { name: "展开诊断抽屉" }).click();
  await expect(page.getByText(/第 \d+ 次更新 · 第 \d+ 条进展/)).toBeVisible();
  await expect(page.getByText(/awaiting-trade-response/)).toBeVisible();

  await guestPage.getByRole("button", { name: "接受交易" }).click();

  await expect(page.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/成交后现金:/).first()).toBeVisible();
  await expect(page.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /最近结果 玩家乙 接受了 房主甲 的交易报价/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 交易回应已结束，玩家乙 接受了 房主甲 的交易报价/);
  await expect(guestPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(guestPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(spectatorPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("交易已成交", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/接受了 房主甲 的交易报价/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /最近结果 玩家乙 接受了 房主甲 的交易报价/, { timeout: 10000 });
  await expect(page.getByText("双边交易待响应")).toHaveCount(0);

  await spectatorPage.close();
  await guestPage.close();
});

test("rejected trade shows a recovery card and restores the proposer's turn", async ({
  browser,
  page,
}) => {
  test.slow();

  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  const spectatorPage = await browser.newPage();
  await spectatorPage.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  const propertyDecision = await readPendingPropertyDecision(page);
  await page.getByRole("button", { name: "购买地产" }).click();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "展开本回合可选动作" })).toBeVisible();

  await page.getByRole("button", { name: "展开本回合可选动作" }).click();
  await page.getByText("发起双边交易报价", { exact: true }).isVisible();
  await page.getByRole("button", { name: "下一步：选择我给出的内容" }).click();
  await page.getByLabel("我出现金").fill("120");
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await page.getByLabel("我索要现金").fill("30");
  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await page.getByRole("button", { name: "确认并发起交易" }).click();

  await guestPage.getByRole("button", { name: "拒绝交易" }).click();

  await expect(page.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(page.locator(".trade-rejection-card")).toHaveClass(/stage-card--neutral/);
  await expect(page.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /最近结果 玩家乙 拒绝了 房主甲 的交易报价/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 交易回应已结束，玩家乙 拒绝了 房主甲 的交易报价/);
  await expect(page.getByText(/房主甲 继续这一回合/)).toBeVisible();
  await expect(page.getByText(/房主甲 原本想交出/)).toBeVisible();
  await expect(guestPage.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText("交易未成交", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("交易未成交", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByText("双边交易待响应")).toHaveCount(0);

  await guestPage.reload();
  await expect(guestPage.getByText("交易未成交", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(guestPage.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible({ timeout: 10000 });
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible({ timeout: 10000 });
  await expect(guestPage.getByText("双边交易待响应")).toHaveCount(0);

  await spectatorPage.close();
  await guestPage.close();
});

test("deficit recovery panel shows mortgage impact and resolves through the recovery action", async ({
  page,
}) => {
  const roomId = "room-deficit";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 12,
    eventSequence: 12,
    turnState: "awaiting-deficit-resolution",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "房主甲 现金不足以支付 200 税费，请抵押地产或宣告破产。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: {
      amount: 200,
      reason: "tax",
      creditorKind: "bank",
      sourceTileId: "tile-4",
      sourceTileLabel: "税务局",
    },
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 100,
        position: 4,
        properties: ["tile-39", "tile-6"],
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
        id: "evt-12",
        type: "deficit-started",
        sequence: 12,
        snapshotVersion: 12,
        summary: "房主甲 需补缴 200 税费。",
        playerId: "p1",
        tileId: "tile-4",
        tileIndex: 4,
        tileLabel: "税务局",
        amount: 200,
        cashAfter: 100,
      },
    ],
  };
  const settledSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 14,
    eventSequence: 14,
    turnState: "awaiting-roll",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingPayment: null,
    players: [
      {
        ...initialSnapshot.players[0],
        cash: 145,
        mortgagedProperties: ["tile-39"],
      },
      initialSnapshot.players[1],
    ],
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-13",
        type: "property-mortgaged",
        sequence: 13,
        snapshotVersion: 13,
        summary: "房主甲 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 245,
        cashAfter: 345,
      },
      {
        id: "evt-14",
        type: "tax-paid",
        sequence: 14,
        snapshotVersion: 14,
        summary: "房主甲 补齐了税费。",
        playerId: "p1",
        tileId: "tile-4",
        tileLabel: "税务局",
        amount: 200,
        cashAfter: 145,
      },
    ],
  };

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

  let currentSnapshot: typeof initialSnapshot | typeof settledSnapshot = initialSnapshot;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: currentSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });
  await page.route(`**/api/rooms/${roomId}/mortgage`, async (route) => {
    currentSnapshot = settledSnapshot;
    await route.fulfill({ json: settledSnapshot });
  });

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".room-primary-anchor").getByText("当前轮到你完成欠款恢复")).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段焦点 欠款恢复，当前轮到 房主甲 处理 200 税费欠款/);
  await expect(page.locator(".room-primary-anchor").getByRole("button", { name: /抵押/ })).toBeVisible();
  await expect(page.locator(".room-primary-anchor").getByRole("button", { name: "宣告破产" })).toBeVisible();
  await expect(page.locator(".stage-card--danger").getByRole("button", { name: "宣告破产" })).toHaveCount(0);
  const recoveryButton = page.locator(".room-primary-anchor").getByRole("button", { name: "抵押 终章大道" });
  await expect(page.getByText("房主甲 正在处理 税费")).toBeVisible();
  await expect(page.getByText(/仍差: 100/)).toBeVisible();
  await expect(recoveryButton).toBeVisible();
  await expect(page.getByText(/可回收 245/)).toBeVisible();
  await expect(page.getByText(/本次抵押后将补足欠款/)).toBeVisible();

  await recoveryButton.click();

  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 房主甲 向银行支付税费 200/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 欠款阶段已结束，.*房主甲 已补齐 200 税费/);
  await expect(page.getByText(/现金: 145/)).toBeVisible();
  await expect(page.getByText(/抵押: 1/)).toBeVisible();
});

test("stepwise deficit anchor guidance refreshes after each mortgage", async ({
  page,
}) => {
  const roomId = "room-deficit-stepwise";
  const initialSnapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 20,
    eventSequence: 20,
    turnState: "awaiting-deficit-resolution",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "房主甲 现金不足以支付 500 税费，请连续抵押地产或宣告破产。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: {
      amount: 500,
      reason: "tax",
      creditorKind: "bank",
      sourceTileId: "tile-36",
      sourceTileLabel: "税务抽查",
    },
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 180,
        position: 36,
        properties: ["tile-39", "tile-28"],
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
        id: "evt-20",
        type: "deficit-started",
        sequence: 20,
        snapshotVersion: 20,
        summary: "房主甲 需补缴 500 税费。",
        playerId: "p1",
        tileId: "tile-36",
        tileIndex: 36,
        tileLabel: "税务抽查",
        amount: 500,
        cashAfter: 180,
      },
    ],
  };
  const secondStepSnapshot = {
    ...initialSnapshot,
    snapshotVersion: 21,
    eventSequence: 21,
    pendingActionLabel: "房主甲 仍需继续抵押地产以补足税费。",
    players: [
      {
        ...initialSnapshot.players[0],
        cash: 425,
        mortgagedProperties: ["tile-39"],
      },
      initialSnapshot.players[1],
    ],
    recentEvents: [
      ...initialSnapshot.recentEvents,
      {
        id: "evt-21",
        type: "property-mortgaged",
        sequence: 21,
        snapshotVersion: 21,
        summary: "房主甲 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 245,
        cashAfter: 425,
      },
    ],
  };
  const settledSnapshot = {
    ...secondStepSnapshot,
    snapshotVersion: 22,
    eventSequence: 22,
    turnState: "awaiting-roll",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingPayment: null,
    players: [
      {
        ...secondStepSnapshot.players[0],
        cash: 615,
        mortgagedProperties: ["tile-39", "tile-28"],
      },
      secondStepSnapshot.players[1],
    ],
    recentEvents: [
      ...secondStepSnapshot.recentEvents,
      {
        id: "evt-22",
        type: "property-mortgaged",
        sequence: 22,
        snapshotVersion: 22,
        summary: "房主甲 抵押了 星河路。",
        playerId: "p1",
        tileId: "tile-28",
        tileIndex: 28,
        tileLabel: "星河路",
        amount: 190,
        cashAfter: 615,
      },
      {
        id: "evt-23",
        type: "tax-paid",
        sequence: 23,
        snapshotVersion: 22,
        summary: "房主甲 补齐了税费。",
        playerId: "p1",
        tileId: "tile-36",
        tileLabel: "税务抽查",
        amount: 500,
        cashAfter: 115,
      },
    ],
  };

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

  let currentSnapshot: typeof initialSnapshot | typeof secondStepSnapshot | typeof settledSnapshot = initialSnapshot;
  let mortgageCount = 0;
  await page.route(`**/api/rooms/${roomId}`, async (route, request) => {
    if (request.method() === "GET") {
      await route.fulfill({ json: currentSnapshot });
      return;
    }

    await route.continue();
  });
  await page.route(`**/api/rooms/${roomId}/events?afterSequence=*`, async (route) => {
    await route.fulfill({ json: { snapshot: null, events: [] } });
  });
  await page.route(`**/api/rooms/${roomId}/mortgage`, async (route) => {
    mortgageCount += 1;
    currentSnapshot = mortgageCount === 1 ? secondStepSnapshot : settledSnapshot;
    await route.fulfill({ json: currentSnapshot });
  });

  await page.goto(`/room/${roomId}`);

  const anchor = page.locator(".room-primary-anchor");
  await expect(anchor.getByText(/这次恢复需要连续几步/)).toBeVisible();
  await expect(anchor.getByText(/下一步建议：先抵押 终章大道，完成后仍差 75/)).toBeVisible();
  await expect(anchor.getByRole("button", { name: "下一步先抵押 终章大道" })).toBeVisible();

  await anchor.getByRole("button", { name: "下一步先抵押 终章大道" }).click();

  await expect(anchor.getByText(/下一步建议：抵押 星河路 后即可补足当前欠款/)).toBeVisible();
  await expect(anchor.getByRole("button", { name: "抵押 星河路" })).toBeVisible();
  await expect(page.getByText(/仍差: 75/)).toBeVisible();

  await page.reload();
  await expect(anchor.getByText(/下一步建议：抵押 星河路 后即可补足当前欠款/)).toBeVisible();
  await expect(anchor.getByRole("button", { name: "抵押 星河路" })).toBeVisible();

  await anchor.getByRole("button", { name: "抵押 星河路" }).click();

  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByText(/抵押: 2/)).toBeVisible();
});

test("mobile room page prioritizes the current stage before overview without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-trade";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 22,
    eventSequence: 22,
    turnState: "awaiting-trade-response",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待 玩家乙 响应交易。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 30,
      offeredTileIds: ["tile-6"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 22,
    },
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [3, 3],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 1380,
        position: 6,
        properties: ["tile-6"],
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
        id: "evt-22",
        type: "trade-proposed",
        sequence: 22,
        snapshotVersion: 22,
        summary: "房主甲 向 玩家乙 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 120,
        requestedCash: 30,
        offeredTileIds: ["tile-6"],
        requestedTileIds: [],
        offeredCardIds: [],
        requestedCardIds: [],
        tradeSnapshotVersion: 22,
      },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p2",
        playerName: "玩家乙",
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

  await page.goto(`/room/${roomId}`);

  const tradeStage = page.locator(".stage-card--trade");
  const overviewStage = page.locator(".stage-card--overview");
  const supportGrid = page.locator(".status-grid--support");
  const roomStatePanel = page.locator(".panel--room-state");
  const boardPanel = page.locator(".panel--board");
  const tradePanels = page.locator(".stage-card--trade .trade-stage__grid > .trade-side");
  const mobileAnchor = page.locator(".room-primary-anchor");

  await expect(tradeStage.getByText("双边交易待响应")).toBeVisible();
  await expect(overviewStage.getByText("房间总览")).toBeVisible();
  await expect(supportGrid.getByText("最近骰子")).toBeVisible();
  await expect(boardPanel.getByText("当前棋盘")).toBeVisible();
  await expect(mobileAnchor.getByRole("button", { name: "接受交易" })).toBeVisible();

  const roomStateBox = await roomStatePanel.boundingBox();
  const boardBox = await boardPanel.boundingBox();
  const tradeBox = await tradeStage.boundingBox();
  const overviewBox = await overviewStage.boundingBox();
  const supportBox = await supportGrid.boundingBox();
  const firstTradePanel = await tradePanels.nth(0).boundingBox();
  const secondTradePanel = await tradePanels.nth(1).boundingBox();

  expect(roomStateBox?.y).toBeLessThan(boardBox?.y ?? Number.POSITIVE_INFINITY);
  expect(tradeBox?.y).toBeLessThan(overviewBox?.y ?? Number.POSITIVE_INFINITY);
  expect(tradeBox?.y).toBeLessThan(boardBox?.y ?? Number.POSITIVE_INFINITY);
  expect(tradeBox?.y).toBeLessThan(supportBox?.y ?? Number.POSITIVE_INFINITY);
  expect(secondTradePanel?.y).toBeGreaterThan(firstTradePanel?.y ?? 0);

  await expect(mobileAnchor).toBeInViewport();

  await page.evaluate(() => window.scrollTo({ top: 480, behavior: "auto" }));
  await expect(mobileAnchor).toBeInViewport();
  await mobileAnchor.getByRole("button", { name: "接受交易" }).click({ trial: true });

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile accepted trade result stays readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-trade-accepted";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 34,
    eventSequence: 34,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [4, 2],
    players: [
      {
        id: "p1",
        name: "房主甲甲甲甲甲甲",
        cash: 1710,
        position: 6,
        properties: ["tile-6", "tile-39"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["chance-jail-card"],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙乙乙乙乙乙",
        cash: 1290,
        position: 0,
        properties: ["tile-24"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["community-jail-card"],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-33",
        type: "trade-proposed",
        sequence: 33,
        snapshotVersion: 33,
        summary: "房主甲甲甲甲甲甲 向 玩家乙乙乙乙乙乙 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 250,
        requestedCash: 40,
        offeredTileIds: ["tile-6", "tile-39"],
        requestedTileIds: ["tile-24"],
        offeredCardIds: ["chance-jail-card"],
        requestedCardIds: ["community-jail-card"],
        tradeSnapshotVersion: 33,
      },
      {
        id: "evt-34",
        type: "trade-accepted",
        sequence: 34,
        snapshotVersion: 34,
        summary: "玩家乙乙乙乙乙乙 接受了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 250,
        requestedCash: 40,
        offeredTileIds: ["tile-6", "tile-39"],
        requestedTileIds: ["tile-24"],
        offeredCardIds: ["chance-jail-card"],
        requestedCardIds: ["community-jail-card"],
        cashAfterByPlayer: { p1: 1710, p2: 1290 },
      },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p1",
        playerName: "房主甲甲甲甲甲甲",
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

  await page.goto(`/room/${roomId}`);

  const settlementCard = page.locator(".trade-settlement-card");
  const settlementSides = settlementCard.locator(".trade-side");
  const supportGrid = page.locator(".status-grid--support");

  await expect(settlementCard.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(settlementCard.getByText("玩家乙乙乙乙乙乙 接受了 房主甲甲甲甲甲甲 的交易报价")).toBeVisible();
  await expect(settlementCard.getByText(/成交后现金/).first()).toBeVisible();
  await expect(supportGrid.getByText("等待当前玩家掷骰")).toBeVisible();

  const firstSide = await settlementSides.nth(0).boundingBox();
  const secondSide = await settlementSides.nth(1).boundingBox();
  expect(secondSide?.y).toBeGreaterThan(firstSide?.y ?? 0);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile rejected trade result stays readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const roomId = "room-mobile-trade-rejected";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 41,
    eventSequence: 41,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [2, 2],
    players: [
      {
        id: "p1",
        name: "房主甲甲甲甲甲甲",
        cash: 1460,
        position: 6,
        properties: ["tile-6", "tile-39"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["chance-jail-card"],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙乙乙乙乙乙",
        cash: 1540,
        position: 0,
        properties: ["tile-24"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["community-jail-card"],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-40",
        type: "trade-proposed",
        sequence: 40,
        snapshotVersion: 40,
        summary: "房主甲甲甲甲甲甲 向 玩家乙乙乙乙乙乙 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 250,
        requestedCash: 40,
        offeredTileIds: ["tile-6", "tile-39"],
        requestedTileIds: ["tile-24"],
        offeredCardIds: ["chance-jail-card"],
        requestedCardIds: ["community-jail-card"],
        tradeSnapshotVersion: 40,
      },
      {
        id: "evt-41",
        type: "trade-rejected",
        sequence: 41,
        snapshotVersion: 41,
        summary: "玩家乙乙乙乙乙乙 拒绝了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p1",
        offeredCash: 250,
        requestedCash: 40,
        offeredTileIds: ["tile-6", "tile-39"],
        requestedTileIds: ["tile-24"],
        offeredCardIds: ["chance-jail-card"],
        requestedCardIds: ["community-jail-card"],
        tradeSnapshotVersion: 40,
      },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p1",
        playerName: "房主甲甲甲甲甲甲",
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

  await page.goto(`/room/${roomId}`);

  const rejectionCard = page.locator(".trade-rejection-card");
  const rejectionSides = rejectionCard.locator(".trade-side");
  const supportGrid = page.locator(".status-grid--support");

  await expect(rejectionCard.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(rejectionCard.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(rejectionCard.getByText(/房主甲甲甲甲甲甲 继续这一回合/)).toBeVisible();
  await expect(supportGrid.getByText("等待当前玩家掷骰")).toBeVisible();

  const firstSide = await rejectionSides.nth(0).boundingBox();
  const secondSide = await rejectionSides.nth(1).boundingBox();
  expect(secondSide?.y).toBeGreaterThan(firstSide?.y ?? 0);

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

test("contextual action surface only shows jail decisions without unrelated generic actions", async ({
  page,
}) => {
  const roomId = "room-jail-decision";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 31,
    eventSequence: 31,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "房主甲 需要先完成监狱决策。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 880,
        position: 10,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["chance-jail-card"],
        inJail: true,
        jailTurnsServed: 1,
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1500,
        position: 4,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-31",
        type: "player-jailed",
        sequence: 31,
        snapshotVersion: 31,
        summary: "房主甲 进入了监狱。",
        playerId: "p1",
        tileId: "tile-10",
        tileIndex: 10,
        tileLabel: "监狱",
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".room-primary-anchor").getByText("现在由你决定如何离开监狱")).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /棋盘后果 房主甲 已进入监狱，后续等待监狱决策/);
  await expect(page.getByText(/选择一种出狱方式后，当前回合才能继续推进/)).toBeVisible();
  await expect(page.getByText(/可用出狱卡: 1/)).toBeVisible();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "购买地产" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "放弃购买" })).toHaveCount(0);
});

test("jail release closure restores a single next-step guidance", async ({
  page,
}) => {
  const roomId = "room-jail-release-closure";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 34,
    eventSequence: 34,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 830,
        position: 10,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        inJail: false,
        jailTurnsServed: 0,
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1500,
        position: 4,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-33",
        type: "player-jailed",
        sequence: 33,
        snapshotVersion: 33,
        summary: "房主甲 进入了监狱。",
        playerId: "p1",
        tileId: "tile-10",
        tileIndex: 10,
        tileLabel: "监狱",
      },
      {
        id: "evt-34",
        type: "jail-fine-paid",
        sequence: 34,
        snapshotVersion: 34,
        summary: "房主甲 支付罚金后离开监狱。",
        playerId: "p1",
        amount: 50,
        cashAfter: 830,
        releaseMethod: "fine",
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 监狱决策已结束，房主甲 支付 50 罚金后离开了监狱。 当前恢复为 房主甲 的等待掷骰。下一步由 房主甲 掷骰继续当前回合/);
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toHaveCount(0);
});

test("failed jail attempt keeps the jailed player as the visible takeover owner", async ({
  page,
}) => {
  const roomId = "room-jail-hold-takeover";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 35,
    eventSequence: 35,
    turnState: "awaiting-jail-decision",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "房主甲 需要继续处理监狱决策。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [2, 3],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 880,
        position: 10,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: ["chance-jail-card"],
        inJail: true,
        jailTurnsServed: 2,
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1500,
        position: 4,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-34",
        type: "player-jailed",
        sequence: 34,
        snapshotVersion: 34,
        summary: "房主甲 进入了监狱。",
        playerId: "p1",
        tileId: "tile-10",
        tileIndex: 10,
        tileLabel: "监狱",
      },
      {
        id: "evt-35",
        type: "jail-roll-attempted",
        sequence: 35,
        snapshotVersion: 35,
        summary: "房主甲 仍在监狱中，当前需要继续处理出狱决策。",
        playerId: "p1",
        releaseMethod: "fine",
        failedAttemptCount: 2,
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /行动接管 房主甲 正在接管当前监狱决策，本次尝试失败 2 次后仍需继续处理/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段焦点 监狱决策，当前轮到 房主甲 继续处理留狱结果，这次已失败 2 次/);
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toBeVisible();
});

test("player-creditor deficit closure names the payee and next step", async ({
  page,
}) => {
  const roomId = "room-player-creditor-deficit-closure";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 23,
    eventSequence: 23,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 145,
        position: 1,
        properties: ["tile-39"],
        mortgagedProperties: ["tile-39"],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1620,
        position: 3,
        properties: ["tile-1"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-21",
        type: "deficit-started",
        sequence: 21,
        snapshotVersion: 21,
        summary: "房主甲 需向 玩家乙 支付 120 租金。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 120,
        cashAfter: 20,
      },
      {
        id: "evt-22",
        type: "property-mortgaged",
        sequence: 22,
        snapshotVersion: 22,
        summary: "房主甲 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 245,
        cashAfter: 265,
      },
      {
        id: "evt-23",
        type: "rent-charged",
        sequence: 23,
        snapshotVersion: 23,
        summary: "房主甲 向 玩家乙 支付租金 120。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 120,
        cashAfter: 145,
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 欠款阶段已结束，房主甲 已向 玩家乙 补齐 120 租金，这条玩家债务链已经收束。 当前恢复为 房主甲 的等待掷骰。下一步由 房主甲 掷骰继续当前回合/);
  await expect(page.getByText(/现金: 145/)).toBeVisible();
  await expect(page.getByText(/现金: 1620/)).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "宣告破产" })).toHaveCount(0);
});

test("economic chain closure explains bankruptcy and end-state guidance", async ({
  page,
}) => {
  const roomId = "room-economic-chain-closure";
  const snapshot = {
    roomId,
    roomState: "finished",
    hostId: "p1",
    snapshotVersion: 52,
    eventSequence: 52,
    turnState: "post-roll-pending",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "房间已结束",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 0,
        position: 1,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: true,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1860,
        position: 3,
        properties: ["tile-1", "tile-39"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-50",
        type: "deficit-started",
        sequence: 50,
        snapshotVersion: 50,
        summary: "房主甲 需向 玩家乙 支付 300 租金。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 300,
        cashAfter: 20,
      },
      {
        id: "evt-51",
        type: "property-mortgaged",
        sequence: 51,
        snapshotVersion: 51,
        summary: "房主甲 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 245,
        cashAfter: 265,
      },
      {
        id: "evt-52",
        type: "bankruptcy-declared",
        sequence: 52,
        snapshotVersion: 52,
        summary: "房主甲 向 玩家乙 宣告破产。",
        playerId: "p1",
        ownerPlayerId: "p2",
        transferredPropertyIds: ["tile-39"],
        transferredCardIds: [],
      },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p2",
        playerName: "玩家乙",
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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 复杂经济链条已收束，房主甲 已向 玩家乙 破产结算。本局已结束/);
  await expect(page.getByText(/房间已结束/).first()).toBeVisible();
  await expect(page.getByText(/状态: 已破产/)).toBeVisible();
  await expect(page.getByText(/现金: 1860/)).toBeVisible();
});

test("unfinished economic chain keeps the debtor takeover and brief visible", async ({
  page,
}) => {
  const roomId = "room-economic-chain-open";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 43,
    eventSequence: 43,
    turnState: "awaiting-deficit-resolution",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "房主甲 仍需继续处理欠款恢复。",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: {
      amount: 180,
      reason: "rent",
      creditorKind: "player",
      creditorPlayerId: "p2",
      sourceTileId: "tile-1",
      sourceTileLabel: "东湖路",
    },
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 65,
        position: 1,
        properties: ["tile-39"],
        mortgagedProperties: ["tile-39"],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1500,
        position: 3,
        properties: ["tile-1"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-41",
        type: "deficit-started",
        sequence: 41,
        snapshotVersion: 41,
        summary: "房主甲 需向 玩家乙 支付 180 租金。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 180,
        cashAfter: 20,
      },
      {
        id: "evt-42",
        type: "property-mortgaged",
        sequence: 42,
        snapshotVersion: 42,
        summary: "房主甲 抵押了 终章大道。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 45,
        cashAfter: 65,
      },
      {
        id: "evt-43",
        type: "improvement-sold",
        sequence: 43,
        snapshotVersion: 43,
        summary: "房主甲 卖掉了一处建筑继续补款。",
        playerId: "p1",
        tileId: "tile-39",
        tileIndex: 39,
        tileLabel: "终章大道",
        amount: 0,
        cashAfter: 65,
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /行动接管 房主甲 正在接管未收束的经济链路，已完成 2 步恢复，仍需继续处理对 玩家乙 的义务/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段焦点 欠款恢复，当前轮到 房主甲 继续处理未收束的 租金链路，已完成 2 步恢复/);
  await expect(page.getByRole("button", { name: "宣告破产" })).toBeVisible();
});

test("player-creditor bankruptcy transfer makes the receiver the takeover focus", async ({
  page,
}) => {
  const roomId = "room-bankruptcy-transfer-takeover";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 61,
    eventSequence: 61,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p2",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 0,
        position: 1,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: true,
      },
      {
        id: "p2",
        name: "玩家乙",
        cash: 1780,
        position: 3,
        properties: ["tile-1", "tile-39"],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
      {
        id: "p3",
        name: "玩家丙",
        cash: 1500,
        position: 5,
        properties: [],
        mortgagedProperties: [],
        propertyImprovements: {},
        heldCardIds: [],
        isBankrupt: false,
      },
    ],
    recentEvents: [
      {
        id: "evt-60",
        type: "deficit-started",
        sequence: 60,
        snapshotVersion: 60,
        summary: "房主甲 需向 玩家乙 支付 300 租金。",
        playerId: "p1",
        ownerPlayerId: "p2",
        tileId: "tile-1",
        tileIndex: 1,
        tileLabel: "东湖路",
        amount: 300,
        cashAfter: 20,
      },
      {
        id: "evt-61",
        type: "bankruptcy-declared",
        sequence: 61,
        snapshotVersion: 61,
        summary: "房主甲 向 玩家乙 宣告破产。",
        playerId: "p1",
        ownerPlayerId: "p2",
        transferredPropertyIds: ["tile-39"],
        transferredCardIds: [],
      },
    ],
  };

  await page.addInitScript(({ currentRoomId }) => {
    window.sessionStorage.setItem(
      `dafuweng-active-player:${currentRoomId}`,
      JSON.stringify({
        playerId: "p2",
        playerName: "玩家乙",
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

  await page.goto(`/room/${roomId}`);

  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /行动接管 玩家乙 正在接管 房主甲 的破产移交结果/);
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /阶段收束 复杂经济链条已收束，房主甲 已向 玩家乙 破产结算。当前恢复为 玩家乙 的等待掷骰/);
  await expect(page.getByRole("button", { name: /以 玩家乙 身份掷骰/ })).toBeVisible();
});

test("turn tools shelf stays collapsed by default and reveals optional tools on demand", async ({
  page,
}) => {
  const roomId = "room-turn-tools";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 41,
    eventSequence: 41,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 1320,
        position: 6,
        properties: ["tile-6"],
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
        id: "evt-41",
        type: "turn-started",
        sequence: 41,
        snapshotVersion: 41,
        summary: "轮到房主甲掷骰。",
        playerId: "p1",
      },
    ],
  };

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

  await page.goto(`/room/${roomId}`);

  await expect(page.getByText(/可发起交易/)).toBeVisible();
  await expect(page.getByText(/可开发地产 1 处/)).toBeVisible();
  await expect(page.getByRole("button", { name: "展开本回合可选动作" })).toBeVisible();
  await expect(page.getByText("发起双边交易报价", { exact: true })).toHaveCount(0);
  await expect(page.getByText("地产开发", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "展开本回合可选动作" }).click();

  await expect(page.getByText("发起双边交易报价", { exact: true })).toBeVisible();
  await expect(page.getByText("地产开发", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "下一步：选择我给出的内容" })).toBeVisible();
  await expect(page.getByRole("button", { name: "建房" })).toBeVisible();
});

test("stepwise trade composer guides the draft before entering pending trade response", async ({
  page,
}) => {
  const roomId = "room-stepwise-trade";
  const snapshot = {
    roomId,
    roomState: "in-game",
    hostId: "p1",
    snapshotVersion: 51,
    eventSequence: 51,
    turnState: "awaiting-roll",
    currentTurnPlayerId: "p1",
    pendingActionLabel: "等待当前玩家掷骰",
    pendingProperty: null,
    pendingAuction: null,
    pendingPayment: null,
    pendingTrade: null,
    chanceDeck: { drawPile: [], discardPile: [] },
    communityDeck: { drawPile: [], discardPile: [] },
    lastRoll: [0, 0],
    players: [
      {
        id: "p1",
        name: "房主甲",
        cash: 1320,
        position: 6,
        properties: ["tile-6"],
        mortgagedProperties: ["tile-6"],
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
        id: "evt-51",
        type: "turn-started",
        sequence: 51,
        snapshotVersion: 51,
        summary: "轮到房主甲准备本回合行动。",
        playerId: "p1",
      },
    ],
  };
  const proposedSnapshot = {
    ...snapshot,
    snapshotVersion: 52,
    eventSequence: 52,
    turnState: "awaiting-trade-response",
    pendingActionLabel: "等待 玩家乙 响应交易。",
    pendingTrade: {
      proposerPlayerId: "p1",
      counterpartyPlayerId: "p2",
      offeredCash: 120,
      requestedCash: 0,
      offeredTileIds: ["tile-6"],
      requestedTileIds: [],
      offeredCardIds: [],
      requestedCardIds: [],
      snapshotVersion: 52,
    },
    recentEvents: [
      ...snapshot.recentEvents,
      {
        id: "evt-52",
        type: "trade-proposed",
        sequence: 52,
        snapshotVersion: 52,
        summary: "房主甲 向 玩家乙 发起了交易报价。",
        playerId: "p1",
        ownerPlayerId: "p2",
        nextPlayerId: "p2",
        offeredCash: 120,
        requestedCash: 0,
        offeredTileIds: ["tile-6"],
        requestedTileIds: [],
        offeredCardIds: [],
        requestedCardIds: [],
        tradeSnapshotVersion: 52,
      },
    ],
  };

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
  await page.route(`**/api/rooms/${roomId}/trade/propose`, async (route) => {
    await route.fulfill({ json: proposedSnapshot });
  });

  await page.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: "展开本回合可选动作" }).click();
  await expect(page.getByText("选对象", { exact: true })).toBeVisible();
  await expect(page.getByLabel("我出现金")).toHaveCount(0);

  await page.getByRole("button", { name: "下一步：选择我给出的内容" }).click();
  await expect(page.getByLabel("我出现金")).toBeVisible();
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await expect(page.getByLabel("我索要现金")).toBeVisible();
  await expect(page.getByText(/当前还没有可成交内容/)).toBeVisible();
  await expect(page.getByRole("button", { name: "下一步：确认报价摘要" })).toBeDisabled();

  await page.getByRole("button", { name: "返回选择我给出的内容" }).click();
  await page.getByLabel("我出现金").fill("120");
  await page.getByRole("button", { name: "选择我出让的地产 东湖路" }).click();
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();

  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await expect(page.getByText("高风险交易确认面", { exact: true })).toBeVisible();
  await expect(page.getByText("最高优先后果", { exact: true })).toBeVisible();
  await expect(page.getByText(/现金净流向: 你净支付 120 给 玩家乙/)).toBeVisible();
  await expect(page.getByText(/东湖路 · 已抵押/)).toBeVisible();
  await expect(page.getByText(/你将让出已抵押资产: 东湖路/)).toBeVisible();
  await expect(page.getByText(/返回上一步继续编辑不会丢失当前草案/)).toBeVisible();
  await page.getByRole("button", { name: "确认并发起交易" }).click();

  await expect(page.getByText("双边交易待响应")).toBeVisible();
  await expect(page.getByText(/等待 玩家乙 响应交易/)).toBeVisible();
});
