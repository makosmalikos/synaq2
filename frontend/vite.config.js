import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Фронтенд обращается к бэкенду по /api (проксируется на :4000).
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore', 'react', 'react-dom'] },
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        // Стабильные библиотеки кэшируются отдельно от кода приложения.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /\/node_modules\/(firebase|@firebase)\// },
            { name: 'react', test: /\/node_modules\/(react|react-dom)\// },
            { name: 'question-bank', test: /\/src\/data\.js$/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
});
