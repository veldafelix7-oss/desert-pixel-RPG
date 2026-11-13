import { test, expect } from "@playwright/test";
test("cached production shell launches and plays offline on touch viewport", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#play")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.locator("#play").click();
  await page.locator("#create").click();
  for (let i = 0; i < 3; i++) await page.locator("#tutorial-next").click();
  await page.locator("#attack").tap();
  await expect(page.locator("#hp-text")).toContainText("100/100");
  expect(errors).toEqual([]);
});
