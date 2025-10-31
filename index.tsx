
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Register the PWA service worker (vite-plugin-pwa provides the virtual module)
try {
  // The virtual module is injected by the plugin at build/dev time.
  // If the plugin isn't installed yet this import will be ignored at runtime.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // no-op if pwa plugin not installed
  });
} catch (e) {
  // ignore
}

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
