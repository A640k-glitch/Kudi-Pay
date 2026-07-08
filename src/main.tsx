import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/Toast';

const migrateStorage = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('coda_')) {
      const newKey = key.replace('coda_', 'kudi_');
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, localStorage.getItem(key) || '');
      }
    }
  }
};
migrateStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
