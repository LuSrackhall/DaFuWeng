import { expect, test } from "@playwright/test";

test("lobby renders the foundational room screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Da Fu Weng" })).toBeVisible();
  await expect(page.getByText("经典大富翁，多人房间先跑通")).toBeVisible();
});