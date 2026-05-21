/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'pnpm',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'src/demo-booking-system/vitest.mutation-good.config.ts',
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/demo-booking-system/**/*.ts',
    'src/demo-booking-system/**/*.tsx',
    '!src/demo-booking-system/**/*.test.ts',
    '!src/demo-booking-system/**/*.test.tsx',
    '!src/demo-booking-system/**/*.mirror.test.ts',
    '!src/demo-booking-system/**/*.mirror.test.tsx',
    '!src/demo-booking-system/**/*.stories.ts',
    '!src/demo-booking-system/**/*.stories.tsx',
    '!src/demo-booking-system/**/*.d.ts',
    '!src/demo-booking-system/test/**',
    '!src/demo-booking-system/types/**',
    '!src/demo-booking-system/api/main.ts',
    '!src/demo-booking-system/web/main.tsx',
  ],
  thresholds: { high: 100, low: 100, break: 100 },
  incremental: false,
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: {
    fileName: 'src/demo-booking-system/reports/mutation/good/index.html',
  },
  timeoutMS: 20_000,
  concurrency: 4,
  ignoreStatic: true,
  checkers: [],
  disableTypeChecks: 'src/demo-booking-system/**/*.{ts,tsx}',
  tempDirName: '.stryker-tmp',
};

export default config;
