import { test, expect } from "@playwright/test";

test("tap-panic: start, play via button/space, mute toggle, and mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/tap-panic/index.html");

  await expect(page.locator("#score")).toHaveText("0");
  await page.getByRole("button", { name: "スタート" }).click();

  const tapBtn = page.getByRole("button", { name: "連打！！" });
  await expect(tapBtn).toBeVisible();
  await tapBtn.click();
  await tapBtn.click();
  await page.keyboard.press("Space");
  await expect(page.locator("#score")).toHaveText("3");

  const muteBtn = page.locator("#mute-btn");
  await muteBtn.click();
  await expect(muteBtn).toHaveAttribute("aria-pressed", "true");
});
