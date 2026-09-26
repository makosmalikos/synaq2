import test from 'node:test';
import assert from 'node:assert/strict';
import { firebaseSettings } from '../frontend/src/firebaseConfig.js';

test('demo Firebase is explicit, local, development-only and never falls back to production', () => {
  assert.equal(firebaseSettings().emulators, false);
  for (const host of ['127.0.0.1', 'localhost', '[::1]']) {
    const settings = firebaseSettings({ DEV: true, VITE_FIREBASE_EMULATORS: '1' }, host);
    assert.equal(settings.config.projectId, 'demo-synaq-tests');
    assert.equal(settings.emulators, true);
  }
  for (const [env, hostname] of [
    [{ DEV: true, VITE_FIREBASE_EMULATORS: 'true' }, 'localhost'],
    [{ DEV: true, VITE_FIREBASE_EMULATORS: '0' }, 'localhost'],
    [{ DEV: false, VITE_FIREBASE_EMULATORS: '1' }, 'localhost'],
    [{ DEV: true, VITE_FIREBASE_EMULATORS: '1' }, 'synaq.app'],
    [{ DEV: true, VITE_FIREBASE_EMULATORS: '1' }, 'localhost.evil.test'],
    [{ DEV: true, VITE_FIREBASE_EMULATORS: '1' }, ''],
  ]) assert.throws(() => firebaseSettings(env, hostname));
});
