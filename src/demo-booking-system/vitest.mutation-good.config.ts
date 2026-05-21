import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const sharedAlias = {
  '@': projectRoot,
};

// Stryker runs Vitest for each mutant. Use this config (good suite only) for
// the default mutation run. The mirror suite has its own config so it can be
// mutation-run separately for the good-vs-mirror side-by-side demo.
export default defineConfig({
  root: projectRoot,
  resolve: { alias: sharedAlias },
  test: {
    projects: [
      {
        resolve: { alias: sharedAlias },
        test: {
          name: 'good-node',
          include: ['domain/**/*.test.ts', 'api/**/*.test.ts', 'web/**/*.test.ts'],
          exclude: ['**/*.mirror.test.*'],
          environment: 'node',
          setupFiles: ['./test/msw.setup.ts'],
        },
      },
      {
        plugins: [react(), tailwindcss()],
        resolve: { alias: sharedAlias },
        test: {
          name: 'good-browser',
          include: ['web/**/*.test.tsx'],
          exclude: ['**/*.mirror.test.*'],
          setupFiles: ['./test/setup.browser.ts', './test/msw.browser.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
