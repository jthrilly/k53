import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { applyTheme } from './lib/store';

applyTheme();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

// Offline support. Only where service workers are allowed (https or localhost, and not inside a sandboxed frame).
if ('serviceWorker' in navigator && import.meta.env.PROD && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
