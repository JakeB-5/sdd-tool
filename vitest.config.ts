import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/cli/index.ts'],
      thresholds: {
        statements: 65,
        branches: 75,
        functions: 70,
        lines: 65,
      },
    },
    testTimeout: 10000,
  },
});
