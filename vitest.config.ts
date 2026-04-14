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
        statements: 20,
        branches: 15,
        functions: 18,
        lines: 20,
      },
    },
  },
});
// test
