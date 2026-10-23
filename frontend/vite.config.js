import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';

// These offline reference diagrams are kept for editorial checks, not deployment.
// Vite otherwise copies every public/ file even when no screen imports it.
function omitSourceArchive() {
  let outDir, publicDir;
  return {
    name: 'omit-offline-source-archive', apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      publicDir = config.publicDir;
    },
    async closeBundle() {
      if (!publicDir) return;
      await fs.cp(publicDir, outDir, {
        recursive: true,
        filter(source) {
          const relative = path.relative(publicDir, source).split(path.sep).join('/');
          return !/^(?:figures\/zerek|figures\/zerek-courses)(?:\/|$)/.test(relative);
        },
      });
    },
  };
}

// Фронтенд обращается к бэкенду по /api (проксируется на :4000).
export default defineConfig({
  plugins: [react(), omitSourceArchive()],
  resolve: { dedupe: ['firebase', '@firebase/app', '@firebase/auth', '@firebase/firestore', 'react', 'react-dom'] },
  build: {
    // Copy through the filtered plugin instead of first duplicating the archive.
    copyPublicDir: false,
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
