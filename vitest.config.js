import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: ["tests/unit/**/*.test.js"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/domain/**/*.js", "src/services/**/*.js", "src/utils/redaction.js"],
    },
  },
});
