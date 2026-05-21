import base from './stryker.conf.mjs';

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  ...base,
  vitest: {
    configFile: 'src/demo-booking-system/vitest.mutation-mirror.config.ts',
  },
  testRunnerNodeArgs: [],
  thresholds: { high: 100, low: 0, break: null },
  htmlReporter: {
    fileName: 'src/demo-booking-system/reports/mutation/mirror/index.html',
  },
};

export default config;
