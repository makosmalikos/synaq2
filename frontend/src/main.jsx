import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LangProvider } from './i18n.jsx';
import './styles.css';
import { activateFonts } from './fonts.js';

activateFonts(document.getElementById('synaq-fonts'));
createRoot(document.getElementById('root')).render(<LangProvider><App /></LangProvider>);
