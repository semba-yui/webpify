import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.test.ts',
        'src/types/**',
        'src/index.ts', // エントリポイント（E2E テストでカバー）
        'src/adapters/index.ts', // エクスポートのみ
        'src/cli/index.ts', // エクスポートのみ
        'src/core/index.ts', // エクスポートのみ
        'src/ports/**', // 型定義のみ
      ],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
