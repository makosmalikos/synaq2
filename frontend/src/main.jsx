import React from 'react';
import { createRoot } from 'react-dom/client';
import './public.css';
import App from './App.jsx';
import { registerPwa } from './pwa.js';
import { LangProvider } from './i18n.jsx';


if (import.meta.env.PROD) registerPwa();

createRoot(document.getElementById('root')).render(<LangProvider><App /></LangProvider>);
