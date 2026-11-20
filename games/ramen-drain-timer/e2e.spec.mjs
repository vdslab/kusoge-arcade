import { test, expect } from "@playwright/test";

test("ramen-drain-timer: start, play, stop via button/space, and mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/ramen-drain-timer/index.html");

  // Initial state
  await expect(page.locator("#current-time")).toHaveText("0.00");
  await expect(page.locator("#target-time")).toHaveText(/^\d+\.\d{2}$/);
  
  // Start game
  await page.getByRole("button", { name: "スタート" }).click();
  
  // Should be playing
  const stopBtn = page.getByRole("button", { name: "ストップ！！" });
  await expect(stopBtn).toBeVisible();
  
  // Wait a bit for timer to advance
  await page.waitForTimeout(1000);
  
  // Stop via button
  await stopBtn.click();
  
  // Should show result
  await expect(page.locator("#result-banner")).toContainText(/成功|爆発/);
  
  // Test space key
  await page.getByRole("button", { name: "もう一回" }).click();
  await page.waitForTimeout(800);
  await page.keyboard.press("Space");
  await expect(page.locator("#result-banner")).toContainText(/成功|爆発/);
  
  // Test mute toggle
  const muteBtn = page.locator("#mute-btn");
  await muteBtn.click();
  await expect(muteBtn).toHaveAttribute("aria-pressed", "true");
});
