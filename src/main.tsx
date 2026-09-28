import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA capabilities & offline caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de MultiOficios disponible');
  },
  onOfflineReady() {
    console.log('MultiOficios está lista para trabajar sin conexión');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
