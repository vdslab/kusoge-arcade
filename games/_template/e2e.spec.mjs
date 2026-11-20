import { test, expect } from "@playwright/test";

test("template-game basic flow", async ({ page }) => {
  await page.goto("/games/_template/index.html");
  await page.getByRole("button", { name: "スタート" }).click();
  await page.locator("#game-canvas").click();
  await expect(page.locator("#score")).toHaveText("1");
});
