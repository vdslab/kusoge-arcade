import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["games/**/*.test.{js,mjs,ts}"],
    exclude: ["games/_template/**", "**/node_modules/**"],
  },
});
