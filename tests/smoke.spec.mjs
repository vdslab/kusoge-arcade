import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const manifestPath = path.join(process.cwd(), "games-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const screenshotDir = path.join(process.cwd(), "test-results", "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
];

async function attachErrorCollectors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

test.describe("Hub smoke tests", () => {
  for (const vp of VIEWPORTS) {
    test(`hub renders cleanly on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const errors = await attachErrorCollectors(page);
      await page.goto("/");

      for (const game of manifest.games) {
        await expect(page.locator(`[data-game-slug="${game.slug}"]`)).toBeVisible();
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(2);
      expect(errors).toEqual([]);

      await page.screenshot({
        path: path.join(screenshotDir, `hub-${vp.name}.png`),
        fullPage: true,
      });
    });
  }
});

for (const game of manifest.games) {
  test.describe(`Game smoke: ${game.slug}`, () => {
    for (const vp of VIEWPORTS) {
      test(`loads cleanly on ${vp.name} without errors or horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = await attachErrorCollectors(page);
        await page.goto(`/${game.path}`);

        const backLink = page.locator("a[href=\"../../\"], a[href=\"../../index.html\"]");
        await expect(backLink.first()).toBeVisible();

        const hasCanvasOrMain = await page.evaluate(() => {
          const canvas = document.querySelector("canvas");
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }
          const main = document.querySelector("main");
          if (main) {
            const rect = main.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }
          return false;
        });
        expect(hasCanvasOrMain).toBe(true);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(2);
        expect(errors).toEqual([]);

        await page.screenshot({
          path: path.join(screenshotDir, `${game.slug}-${vp.name}.png`),
          fullPage: true,
        });
      });
    }
  });
}
