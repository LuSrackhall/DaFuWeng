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

  const guestPage = await browser.newPage();
  await guestPage.goto("/");
  await guestPage.getByLabel("加入房间").fill(roomId);
  await guestPage.getByLabel("玩家昵称").fill("玩家乙");
  await guestPage.getByRole("button", { name: "加入房间" }).click();
  await expect(guestPage).toHaveURL(new RegExp(`/room/${roomId}$`));

  await expect(page.getByText("等待房间开始")).toBeVisible();
  await expect(guestPage.getByText("等待房间开始")).toBeVisible();
  await expect(page.getByText("当前人数: 2")).toBeVisible();
  await expect(page.locator(".stage-card--overview").getByText("当前以 房主甲 身份加入此房间。").first()).toBeVisible();
  await expect(page.getByText(/这是服务端权威房间。刷新后会恢复同一房间快照/)).toBeVisible();
  await expect(page.getByText("房主: 房主甲")).toBeVisible();
  await expect(guestPage.locator(".stage-card--overview").getByText("当前以 玩家乙 身份加入此房间。").first()).toBeVisible();

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await expect(page.getByText("等待当前玩家掷骰")).toBeVisible();
  await expect(guestPage.getByText("等待当前玩家掷骰")).toBeVisible();

  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await expect(guestPage.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();

  await page.getByRole("button", { name: "购买地产" }).click();
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
    viewerPage.getByRole("button", { name: "房主开始游戏" }),
  ).toBeDisabled();
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
  await expect(guestPage.getByText(/轮到你出价或放弃，下一口至少 1。/)).toBeVisible();
  await expect(page.getByText(/当前轮到 玩家乙 决策/)).toBeVisible();

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

  await page.getByRole("button", { name: "房主开始游戏" }).click();
  await page.getByRole("button", { name: /以 房主甲 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await guestPage.getByRole("button", { name: /以 玩家乙 身份掷骰/ }).click();
  await expect(guestPage.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await expect(page.getByText("发起双边交易报价")).toBeVisible();

  await page.getByLabel("我出现金").fill("120");
  await page.getByLabel("我索要现金").fill("30");
  await page.getByRole("button", { name: "选择我出让的地产 东湖路" }).click();
  await page.getByRole("button", { name: "发起交易" }).click();

  await expect(page.getByText("双边交易待响应")).toBeVisible();
  await expect(page.getByText(/报价已发出，当前等待 玩家乙 回复。/)).toBeVisible();
  await expect(page.getByText(/地产: 东湖路/)).toBeVisible();
  await expect(guestPage.getByText("双边交易待响应")).toBeVisible();
  await expect(guestPage.getByText(/轮到你决定是否接受 房主甲 的报价。/)).toBeVisible();
  await expect(guestPage.getByText(/地产: 东湖路/)).toBeVisible();

  await expect(page.getByRole("button", { name: "展开诊断抽屉" })).toBeVisible();
  await page.getByRole("button", { name: "展开诊断抽屉" }).click();
  await expect(page.getByText(/快照 \d+ · 序列 \d+/)).toBeVisible();
  await expect(page.getByText(/awaiting-trade-response/)).toBeVisible();

  await guestPage.getByRole("button", { name: "接受交易" }).click();

  await expect(page.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(guestPage.getByText(/接受了 房主甲 的交易报价/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰").first()).toBeVisible();

  await guestPage.close();
});
