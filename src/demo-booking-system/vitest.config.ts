import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const sharedAlias = {
  '@': projectRoot,
};

export default defineConfig({
  root: projectRoot,
  resolve: {
    alias: sharedAlias,
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'reports/coverage',
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.mirror.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/*.d.ts',
        'test/**',
        'types/**',
        'api/main.ts',
        'web/main.tsx',
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
    projects: [
      {
        resolve: {
          alias: sharedAlias,
        },
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
        resolve: {
          alias: sharedAlias,
        },
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
      {
        resolve: {
          alias: sharedAlias,
        },
        test: {
          name: 'mirror',
          include: ['**/*.mirror.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(projectRoot, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
