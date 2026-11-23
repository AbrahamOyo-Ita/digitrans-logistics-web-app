import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root element.');

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (root.dataset.ssr === '1' && root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}));
}
