
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { syncService } from './services/syncService';

// Expõe syncService globalmente para debug
(window as any).syncService = syncService;
console.log('🔄 SyncService disponível em window.syncService para debug');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
