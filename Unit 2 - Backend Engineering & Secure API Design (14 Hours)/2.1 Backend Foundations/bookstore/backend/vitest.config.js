import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/data/**'], // process entry + seed data aren't unit-testable logic
      reporter: ['text', 'html'],
      // The test run FAILS if coverage drops below these numbers.
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
