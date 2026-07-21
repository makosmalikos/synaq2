import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Фронтенд обращается к бэкенду по /api (проксируется на :4000).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Стабильные библиотеки кэшируются отдельно от кода приложения.
        manualChunks(id) {
          if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
            return 'firebase';
          }
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
