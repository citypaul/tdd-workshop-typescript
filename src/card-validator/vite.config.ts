import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: projectRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  test: {
    coverage: {
      include: ["**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "app/main.tsx", "app/test-setup.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["*.test.ts", "*.property.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["app/**/*.test.{ts,tsx}"],
          setupFiles: ["./app/test-setup.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
