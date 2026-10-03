import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // jsdom replaces Event while Node's worker BroadcastChannel is active;
    // parallel workers then produce partial ESM exports. Keep isolated files,
    // but execute this browser-like persistence harness serially.
    fileParallelism: false,
    pool: 'forks',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: { reporter: ['text', 'json', 'html'] },
  },
});
