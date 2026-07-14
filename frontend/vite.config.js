import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Фронтенд обращается к бэкенду по /api (проксируется на :4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
