const PRODUCTION_CONFIG = {
  apiKey: 'AIzaSyATdVvMsNkN0F66XipkShtFe0wKizu2r6o',
  authDomain: 'synaq-88779.firebaseapp.com',
  projectId: 'synaq-88779',
  storageBucket: 'synaq-88779.firebasestorage.app',
  messagingSenderId: '592299512879',
  appId: '1:592299512879:web:b87d2fe2d2e67f6f99e2da',
};

export function firebaseSettings(env = {}, hostname = '') {
  if (!env.VITE_FIREBASE_EMULATORS) return { config: PRODUCTION_CONFIG, emulators: false };
  if (env.VITE_FIREBASE_EMULATORS !== '1') throw new Error('Invalid Firebase emulator opt-in');
  // Invalid opt-ins must throw, never quietly fall back to the real project.
  if (env.DEV !== true || !['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) {
    throw new Error('Firebase emulators require a local development server');
  }
  return {
    emulators: true,
    config: { apiKey: 'demo-synaq-key', authDomain: 'demo-synaq-tests.firebaseapp.com',
      projectId: 'demo-synaq-tests', appId: 'demo-synaq-app' },
  };
}
