import { expect, test } from "@playwright/test";

function extractRoomId(url: string) {
  const match = url.match(/\/room\/(room-\d+)$/);
  return match?.[1] ?? "";
}

test("two real players can create, join, start, buy, pay rent, and refresh the same authoritative room", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("房主昵称").fill("房主甲");
  await page.getByRole("button", { name: "创建房间" }).click();

  await expect(page).toHaveURL(/\/room\/room-\d+$/);
  const roomId = extractRoomId(page.url());
  expect(roomId).toMatch(/^room-\d+$/);
  await expect(page.getByRole("heading", { name: "Da Fu Weng" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "等待开局" })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "返回大厅" })).toBeVisible();
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();
  await expect(page.locator(".board__tile")).toHaveCount(0);
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  await expect(page.getByText("等待房间开始")).toBeVisible();
  await expect(guestPage.getByText("等待房间开始")).toBeVisible();
  await expect(page.getByText("当前主操作", { exact: true })).toBeVisible();
  await expect(page.locator(".room-primary-anchor").getByText("现在由房主推进开局")).toBeVisible();
  await expect(page.getByText("当前人数: 2")).toBeVisible();
  await expect(page.locator(".stage-card--overview").getByText("当前以 房主甲 身份加入此房间。").first()).toBeVisible();
  await expect(page.getByText(/这是服务端权威房间。刷新后会恢复同一房间快照/)).toBeVisible();
  await expect(page.getByText("房主: 房主甲")).toBeVisible();
  await expect(guestPage.locator(".stage-card--overview").getByText("当前以 玩家乙 身份加入此房间。").first()).toBeVisible();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /当前回合 房主甲，焦点 起点/);

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await expect(guestPage.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await expect(page.locator(".board__pixi-host")).toHaveAttribute("aria-label", /当前回合 房主甲，焦点 东湖路/);

  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.locator(".board__pixi-host canvas")).toBeVisible();
  await expect(page.getByText(/已同步权威买地结果/)).toBeVisible();
  await expect(page.getByText(/现金: 1340/)).toBeVisible();
  await expect(page.getByText(/地产: 1/)).toBeVisible();

  await expect(guestPage.getByText(/现金: 1340/)).toBeVisible();
  await expect(guestPage.getByText(/地产: 1/)).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰")).toBeVisible();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText(/现金: 1478/)).toBeVisible();
  await expect(page.getByText(/现金: 1362/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText(/现金: 1362/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await guestPage.close();
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
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();

  await page.getByRole("button", { name: "放弃购买" }).click();

  await expect(page.getByText("公开拍卖进行中")).toBeVisible();
  await expect(guestPage.getByText("公开拍卖进行中")).toBeVisible();
  await expect(page.getByText(/房主甲 放弃购买后，东湖路 进入公开拍卖。/)).toBeVisible();
  await expect(guestPage.locator(".room-primary-anchor").getByText(/你可以直接在这里提交出价或放弃竞拍，当前最低有效报价为 1。/)).toBeVisible();
  await expect(guestPage.locator(".room-primary-anchor").getByRole("button", { name: "提交出价" })).toBeVisible();
  await expect(guestPage.locator(".stage-card--auction").getByRole("button", { name: "提交出价" })).toHaveCount(0);
  await expect(page.locator(".stage-card--auction").getByText(/当前轮到 玩家乙 决策/)).toBeVisible();

  await guestPage.getByRole("button", { name: "出价 51" }).click();
  await guestPage.getByRole("button", { name: "提交出价" }).click();

  await expect(page.getByText(/玩家乙 · 51/)).toBeVisible();
  await expect(guestPage.getByText(/玩家乙 · 51/)).toBeVisible();

  await page.getByRole("button", { name: "放弃本轮竞拍" }).click();

  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText(/现金: 1449/)).toBeVisible();
  await expect(guestPage.getByText(/地产: 1/)).toBeVisible();

  await guestPage.close();
});

test("live trade response uses a dominant stage card and keeps diagnostics collapsible", async ({
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

  const spectatorPage = await browser.newPage();
  await spectatorPage.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await expect(page.getByRole("button", { name: "展开回合工具区" })).toBeVisible();
  await page.getByRole("button", { name: "展开回合工具区" }).click();
  await expect(page.getByText("发起双边交易报价", { exact: true })).toBeVisible();
  await expect(page.getByText("选对象", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "下一步：选择我给出的内容" }).click();

  await page.getByLabel("我出现金").fill("120");
  await page.getByRole("button", { name: "选择我出让的地产 东湖路" }).click();
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
  await expect(page.getByRole("button", { name: "选择我出让的地产 东湖路" })).toHaveClass(/asset-chip--selected/);
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await page.getByRole("button", { name: "确认并发起交易" }).click();

  await expect(page.getByText("双边交易待响应")).toBeVisible();
  await expect(page.getByText("报价已送达，等待对手回应", { exact: true })).toBeVisible();
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
  await expect(page.getByText(/快照 \d+ · 序列 \d+/)).toBeVisible();
  await expect(page.getByText(/awaiting-trade-response/)).toBeVisible();

  await guestPage.getByRole("button", { name: "接受交易" }).click();

  await expect(page.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/成交后现金:/).first()).toBeVisible();
  await expect(page.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(guestPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(guestPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(spectatorPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByText("双边交易待响应")).toHaveCount(0);

  await guestPage.reload();
  await expect(guestPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(guestPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText("双边交易待响应")).toHaveCount(0);

  await spectatorPage.reload();
  await expect(spectatorPage.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(spectatorPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  await expect(spectatorPage.getByText("双边交易待响应")).toHaveCount(0);

  await spectatorPage.close();
  await guestPage.close();
});

test("rejected trade shows a recovery card and restores the proposer's turn", async ({
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
  await spectatorPage.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await page.getByRole("button", { name: "购买地产" }).click();
  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();

  await page.getByRole("button", { name: "展开回合工具区" }).click();
  await page.getByText("发起双边交易报价", { exact: true }).isVisible();
  await page.getByRole("button", { name: "下一步：选择我给出的内容" }).click();
  await page.getByLabel("我出现金").fill("120");
  await page.getByRole("button", { name: "下一步：选择我索取的内容" }).click();
  await page.getByLabel("我索要现金").fill("30");
  await page.getByRole("button", { name: "下一步：确认报价摘要" }).click();
  await page.getByRole("button", { name: "确认并发起交易" }).click();

  await guestPage.getByRole("button", { name: "拒绝交易" }).click();

  await expect(page.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(page.getByText(/房主甲 继续这一回合/)).toBeVisible();
  await expect(page.getByText(/房主甲 原本想交出/)).toBeVisible();
  await expect(guestPage.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(page.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(page.getByText("双边交易待响应")).toHaveCount(0);

  await guestPage.reload();
  await expect(guestPage.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(guestPage.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();
  await expect(guestPage.getByText("双边交易待响应")).toHaveCount(0);

  await spectatorPage.reload();
  await expect(spectatorPage.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(spectatorPage.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(spectatorPage.getByText("当前是只读视角。请先从大厅创建或加入房间，才能作为玩家操作。")).toBeVisible();
  await expect(spectatorPage.getByText("双边交易待响应")).toHaveCount(0);

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

  await expect(settlementCard.getByText("交易已成交", { exact: true })).toBeVisible();
  await expect(settlementCard.getByText("玩家乙乙乙乙乙乙 接受了 房主甲甲甲甲甲甲 的交易报价")).toBeVisible();
  await expect(settlementCard.getByText(/成交后现金/).first()).toBeVisible();
  await expect(settlementCard.getByText("等待当前玩家掷骰")).toBeVisible();

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

  await expect(rejectionCard.getByText("交易未成交", { exact: true })).toBeVisible();
  await expect(rejectionCard.getByText(/没有发生任何现金、地产或卡牌转移/)).toBeVisible();
  await expect(rejectionCard.getByText(/房主甲甲甲甲甲甲 继续这一回合/)).toBeVisible();
  await expect(rejectionCard.getByText("等待当前玩家掷骰")).toBeVisible();

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
  await expect(page.getByText(/选择一种出狱方式后，当前回合才能继续推进/)).toBeVisible();
  await expect(page.getByText(/可用出狱卡: 1/)).toBeVisible();
  await expect(page.getByRole("button", { name: "尝试掷骰出狱" })).toBeVisible();
  await expect(page.getByRole("button", { name: "支付 50 罚金" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用出狱卡" })).toBeVisible();
  await expect(page.getByRole("button", { name: /以 房主甲 身份掷骰/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "购买地产" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "放弃购买" })).toHaveCount(0);
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
  await expect(page.getByRole("button", { name: "展开回合工具区" })).toBeVisible();
  await expect(page.getByText("发起双边交易报价", { exact: true })).toHaveCount(0);
  await expect(page.getByText("地产开发", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "展开回合工具区" }).click();

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

  await page.getByRole("button", { name: "展开回合工具区" }).click();
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
