import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {

      provider: 'v8',
      reporter: ['lcov', 'text'],
      exclude: ['node_modules/', 'eslint.config.js', 'postcss.config.js', 'tailwind.config.js', 'vite.config.js'],
    },
  },
});
