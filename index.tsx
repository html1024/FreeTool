
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initWebVitals } from './utils/webVitals';

// Handle dark mode
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
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

// 初始化 Web Vitals 性能监控
if (process.env.NODE_ENV === 'production') {
  initWebVitals();
}
