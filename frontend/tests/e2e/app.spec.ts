import { expect, test } from "@playwright/test";

test("purchase property, settle rent, and recover through streaming plus refresh", async ({ browser, page }) => {
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

  await viewerPage.getByRole("button", { name: /以 .* 身份掷骰/ }).click();
  await expect(viewerPage.getByText(/权威掷骰结果已同步/)).toBeVisible();
  await expect(viewerPage.getByText(/#\d+ .*支付了 22 租金/)).toBeVisible();
  await expect(viewerPage.getByText(/现金: 1478/)).toBeVisible();

  await expect(page.getByText(/#\d+ .*支付了 22 租金/)).toBeVisible();
  await expect(page.getByText(/现金: 1362/)).toBeVisible();

  const versionBeforeRefresh = await page.locator(".status-card span").nth(4).textContent();
  await page.reload();

  await expect(page.getByText("等待当前玩家掷骰")).toBeVisible();
  await expect(page.getByText(/#\d+ .*支付了 22 租金/)).toBeVisible();
  await expect(page.locator(".status-card span").nth(4)).toHaveText(versionBeforeRefresh ?? "");

  await viewerPage.close();
});

test("decline property enters auction and settles through bid plus pass", async ({ browser, page }) => {
  await page.goto("/");

  await page.getByLabel("房主昵称").fill("拍卖房主");
  await page.getByRole("button", { name: "创建房间" }).click();
  await expect(page.getByText(/已创建房间 room-/)).toBeVisible();
  const headingText = await page.locator("h3.panel__title").first().textContent();
  const roomId = headingText?.replace("房间 ", "") ?? "";
  expect(roomId).toMatch(/^room-/);

  await page.getByLabel("加入房间").fill(roomId);
  await page.getByLabel("玩家昵称").fill("拍卖玩家");
  await page.getByRole("button", { name: "加入房间" }).click();
  await page.getByRole("button", { name: "开始当前房间" }).click();
  await expect(page).toHaveURL(new RegExp(`/room/${roomId}$`));

  const viewerPage = await browser.newPage();
  await viewerPage.goto(`/room/${roomId}`);

  await page.getByRole("button", { name: /以 .* 身份掷骰/ }).click();
  await expect(page.getByText(/可购买 东湖路，价格 160。/)).toBeVisible();
  await page.getByRole("button", { name: "放弃购买" }).click();
  await expect(page.getByText(/已同步权威放弃结果/)).toBeVisible();
  await expect(page.getByText(/待结算拍卖/)).toBeVisible();

  await expect(viewerPage.getByText(/待结算拍卖/)).toBeVisible();
  await viewerPage.getByRole("button", { name: "提交出价" }).click();
  await expect(viewerPage.getByText(/已同步权威拍卖出价/)).toBeVisible();
  await expect(viewerPage.getByText(/当前最高出价: 200/)).toBeVisible();

  await page.evaluate(async ({ currentRoomId, hostName }) => {
    const response = await fetch(`http://127.0.0.1:8080/api/rooms/${currentRoomId}`);
    const snapshot = await response.json();
    const host = snapshot.players.find((player: { id: string; name: string; }) => player.id === snapshot.hostId) ??
      snapshot.players.find((player: { id: string; name: string; }) => player.name === hostName);
    if (host) {
      window.sessionStorage.setItem(
        `dafuweng-active-player:${currentRoomId}`,
        JSON.stringify({ playerId: host.id, playerName: host.name })
      );
    }
  }, { currentRoomId: roomId, hostName: "拍卖房主" });
  const passStatus = await page.evaluate(async (currentRoomId) => {
    const snapshotResponse = await fetch(`http://127.0.0.1:8080/api/rooms/${currentRoomId}`);
    const snapshot = await snapshotResponse.json();
    const response = await fetch(`http://127.0.0.1:8080/api/rooms/${currentRoomId}/pass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: snapshot.currentTurnPlayerId,
        idempotencyKey: crypto.randomUUID()
      })
    });
    return {
      status: response.status,
      body: await response.text()
    };
  }, roomId);
  expect(passStatus.status, passStatus.body).toBe(200);
  await page.reload();
  await expect(page.getByText(/现金: 1300/)).toBeVisible();
  await expect(page.getByText(/地产: 1/)).toBeVisible();

  await viewerPage.reload();
  await expect(viewerPage.getByText(/现金: 1300/)).toBeVisible();
  await expect(viewerPage.getByText(/地产: 1/)).toBeVisible();
  await viewerPage.close();
});
