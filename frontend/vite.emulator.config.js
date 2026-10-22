import { mergeConfig } from 'vite';
import base from './vite.config.js';

export default mergeConfig(base, {
  // Keep the local-only warning visible without covering mobile controls.
  plugins: [{ name: 'emulator-notice-layout', transformIndexHtml: () => [{
    tag: 'style', injectTo: 'head', children: '.firebase-emulator-warning{position:static!important;font:11px/1.4 system-ui;padding:8px;box-sizing:border-box}',
  }] }],
  define: { 'import.meta.env.VITE_FIREBASE_EMULATORS': JSON.stringify('1') },
  server: { host: '127.0.0.1', port: 5175, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4001' } },
});
