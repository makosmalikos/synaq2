import { mergeConfig } from 'vite';
import base from './vite.config.js';

export default mergeConfig(base, {
  define: { 'import.meta.env.VITE_FIREBASE_EMULATORS': JSON.stringify('1') },
  server: { host: '127.0.0.1', port: 5175, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4001' } },
});
