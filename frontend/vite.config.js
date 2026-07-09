import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В деве проксируем /api на локальный Express (порт 4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  build: { outDir: 'dist' },
});
