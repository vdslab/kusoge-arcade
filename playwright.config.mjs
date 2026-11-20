import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: ["tests/**/*.spec.mjs", "games/**/e2e.spec.mjs"],
  testIgnore: ["games/_template/**"],
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/serve.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
