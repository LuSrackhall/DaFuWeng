import { expect, test } from "@playwright/test";

test("purchase property and recover state through catch-up and refresh", async ({ browser, page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Da Fu Weng" })).toBeVisible();
  await expect(page.getByText("经典大富翁，多人房间先跑通")).toBeVisible();

  await page.getByLabel("房主昵称").fill("端到端房主");
  await page.getByRole("button", { name: "创建房间" }).click();
  await expect(page.getByText(/已创建房间 room-/)).toBeVisible();

  const headingText = await page.locator("h3.panel__title").first().textContent();
  const roomId = headingText?.replace("房间 ", "") ?? "";
  expect(roomId).toMatch(/^room-/);

  await page.getByLabel("加入房间").fill(roomId);
  await page.getByLabel("玩家昵称").fill("端到端玩家");
  await page.getByRole("button", { name: "加入房间" }).click();
  await expect(page.getByText("端到端玩家")).toBeVisible();

  await page.getByRole("button", { name: "开始当前房间" }).click();
  await expect(page).toHaveURL(new RegExp(`/room/${roomId}$`));
  await expect(page.getByText("等待当前玩家掷骰")).toBeVisible();

  const viewerPage = await browser.newPage();
  await viewerPage.goto(`/room/${roomId}`);
  await expect(viewerPage.getByText("等待当前玩家掷骰")).toBeVisible();

  await page.getByRole("button", { name: /以 .* 身份掷骰/ }).click();
  await expect(page.getByText(/权威掷骰结果已同步/)).toBeVisible();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await expect(page.getByText(/#\d+ .*可选择购买 东湖路/)).toBeVisible();

  await expect(viewerPage.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();

  await page.getByRole("button", { name: "购买地产" }).click();
  await expect(page.getByText(/已同步权威买地结果/)).toBeVisible();
  await expect(page.getByText("等待当前玩家掷骰")).toBeVisible();
  await expect(page.getByText(/现金: 1340/)).toBeVisible();
  await expect(page.getByText(/地产: 1/)).toBeVisible();
  await expect(page.getByText(/#\d+ .*购买了 东湖路/)).toBeVisible();

  await expect(viewerPage.getByText(/现金: 1340/)).toBeVisible();
  await expect(viewerPage.getByText(/地产: 1/)).toBeVisible();
  await expect(viewerPage.getByText(/#\d+ .*购买了 东湖路/)).toBeVisible();

  const versionBeforeRefresh = await page.locator(".status-card span").nth(4).textContent();
  await page.reload();

  await expect(page.getByText("等待当前玩家掷骰")).toBeVisible();
  await expect(page.getByText(/#\d+ .*购买了 东湖路/)).toBeVisible();
  await expect(page.locator(".status-card span").nth(4)).toHaveText(versionBeforeRefresh ?? "");

  await viewerPage.close();
});
