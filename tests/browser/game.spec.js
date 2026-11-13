import { test, expect } from "@playwright/test";
import { freshSave, SAVE_KEY } from "../../src/core.js";
async function newGame(page) {
  await page.goto("/");
  await page.locator("#play").click();
  await page.locator("#char-name").fill("Nara");
  await page.locator("#create").click();
  for (let i = 0; i < 3; i++) await page.locator("#tutorial-next").click();
}
async function seed(page, overrides = {}) {
  await page.addInitScript(
    ({ data, key }) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key, JSON.stringify(data));
        sessionStorage.setItem("seeded", "1");
      }
    },
    { data: { ...freshSave("Tester"), ...overrides }, key: SAVE_KEY },
  );
  await page.goto("/");
  await page.locator("#play").click();
}
async function saveAndRead(page) {
  await page.locator("#pause").click();
  await page.locator("#to-menu").click();
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    SAVE_KEY,
  );
}
test("new game, keyboard movement, autosave, resume and English settings", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await newGame(page);
  await expect(page.locator(".player-title")).toContainText("Nara");
  await page.keyboard.down("s");
  await page.waitForTimeout(500);
  await page.keyboard.up("s");
  const saved = await saveAndRead(page);
  expect(saved.y).toBeGreaterThan(750);
  await page.reload();
  await expect(page.locator("#play")).toContainText("LANJUTKAN");
  await page.locator("#settings").click();
  await page.locator("#language").selectOption("en");
  await page.locator("#fps").selectOption("30");
  await page.locator("#close-modal").click();
  await expect(page.locator("#play")).toContainText("CONTINUE");
  expect(errors).toEqual([]);
});
test("menus pause world and potion heals without hunger", async ({ page }) => {
  await seed(page, { hp: 45 });
  await page.locator("#bag").click();
  await page.locator("#bag-heal").click();
  await expect(page.locator(".modal")).toContainText("90/100");
  await page.waitForTimeout(250);
  await page.locator("#close-modal").click();
  const s = await saveAndRead(page);
  expect(s.hp).toBe(90);
  expect(s.potions).toBe(2);
  expect(s).not.toHaveProperty("hunger");
});
test("facing attack kills nearby scorpion and grants coins", async ({
  page,
}) => {
  await seed(page, { x: 1100, y: 900 });
  await page.keyboard.down("j");
  await page.waitForTimeout(2200);
  await page.keyboard.up("j");
  const s = await saveAndRead(page);
  expect(s.kills).toBeGreaterThanOrEqual(1);
  expect(s.coins).toBeGreaterThanOrEqual(38);
});
test("NPC repairs equipment and quest reward is single-use", async ({
  page,
}) => {
  await seed(page, { x: 630, y: 800, durability: 70, kills: 3 });
  await page.locator("#interact").click();
  await page.locator("#repair").click();
  await expect(page.locator(".modal")).toContainText("100%");
  await page.locator("#claim").click();
  await expect(page.locator("#claim")).toHaveCount(0);
  await page.locator("#close-modal").click();
  const s = await saveAndRead(page);
  expect(s.durability).toBe(100);
  expect(s.coins).toBe(60);
  expect(s.quest).toBe(true);
});
test("shop blocks unsafe purchases", async ({ page }) => {
  await seed(page, { x: 1550, y: 1100 });
  await page.locator("#pause").click();
  await page.locator("#open-shop").click();
  await page.locator("#buy-potion").click();
  await expect(page.locator("#toast")).toContainText("Kembali ke permukiman");
});
test("mobile landscape controls, HUD edit, and quest collapse", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await newGame(page);
  await page.locator("#quest-fold").click();
  await expect(page.locator("#quest-panel")).toHaveClass(/collapsed/);
  const b = await page.locator("#joystick").boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + b.height / 2 + 20);
  await page.waitForTimeout(350);
  await page.mouse.up();
  await page.locator("#pause").click();
  await page.locator("#open-settings").click();
  await page.locator("#custom-hud").click();
  const a = await page.locator("#attack").boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(710, 320);
  await page.mouse.up();
  await page.locator("#hud-done").click();
  const layout = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("desert-hud")),
  );
  expect(layout.attack.x).toBeGreaterThan(70);
  await expect(page.locator(".hud-edit-banner")).toHaveCount(0);
});
test("backup recovery after primary save corruption", async ({ page }) => {
  await page.addInitScript(
    ({ key, data }) => {
      localStorage.setItem(key, "corrupt");
      localStorage.setItem(key + "-backup", JSON.stringify(data));
    },
    { key: SAVE_KEY, data: freshSave("Recovered") },
  );
  await page.goto("/");
  await expect(page.locator(".resume-detail")).toContainText("Recovered");
  await page.locator("#play").click();
  await expect(page.locator(".player-title")).toContainText("Recovered");
});
