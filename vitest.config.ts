import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary"],
      include: ["src/core/**/*.ts"],
      exclude: ["src/core/__tests__/**", "src/core/**/index.ts"],
      thresholds: {
        // Current baseline — raise to 50% as tests are added
        statements: 30,
        branches: 24,
        functions: 26,
        lines: 30,
      },
    },
  },
});
