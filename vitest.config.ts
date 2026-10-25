import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
      '*.config.{ts,tsx}',
      'playwright.config.{ts,ts}',
    ],
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'tests/e2e/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.config.{ts,tsx}',
      ],
    },
  },
});
