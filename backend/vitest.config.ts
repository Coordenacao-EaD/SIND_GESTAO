import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    sequence: { concurrent: false },
    testTimeout: 120_000,
    hookTimeout: 120_000,
    restoreMocks: true,
  },
});
