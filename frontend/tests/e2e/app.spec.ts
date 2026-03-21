import { expect, test } from "@playwright/test";

test("create join start roll and recover room state", async ({ page }) => {
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

  await page.getByRole("button", { name: /以 .* 身份掷骰/ }).click();
  await expect(page.getByText(/权威掷骰结果已同步/)).toBeVisible();
  await expect(page.getByText(/等待后续规则切片处理/)).toBeVisible();
  await expect(page.getByText(/#\d+ .*掷出/)).toBeVisible();

  const versionBeforeRefresh = await page.locator(".status-card span").nth(4).textContent();
  await page.reload();

  await expect(page.getByText(/等待后续规则切片处理/)).toBeVisible();
  await expect(page.getByText(/#\d+ .*掷出/)).toBeVisible();
  await expect(page.locator(".status-card span").nth(4)).toHaveText(versionBeforeRefresh ?? "");
});
