import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const sharedAlias = {
  '@': projectRoot,
};

// Stryker runs this config for `pnpm mutation:mirror` to demonstrate the
// anti-pattern: mirror tests pass against mutated code, producing many
// surviving mutants. That survivor list IS the teaching artefact.
export default defineConfig({
  root: projectRoot,
  resolve: { alias: sharedAlias },
  test: {
    include: ['**/*.mirror.test.{ts,tsx}'],
    environment: 'node',
  },
});
