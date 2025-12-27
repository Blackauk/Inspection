import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import App from './App';
import './index.css';

// Boot logging
console.log('[APP BOOT] Starting application initialization...');

try {
  console.log('[APP BOOT] Checking for root element...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    const errorMsg = 'Root element not found - check index.html has <div id="root"></div>';
    console.error('[APP BOOT] FATAL:', errorMsg);
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: monospace; background: #1f2937; color: #ef4444; min-height: 100vh;">
        <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">🚨 APP BOOT ERROR</h1>
        <p style="color: #ef4444; font-size: 18px; margin-bottom: 10px;">${errorMsg}</p>
        <pre style="background: #111827; padding: 20px; border-radius: 8px; overflow: auto; color: #10b981;">Check index.html for: &lt;div id="root"&gt;&lt;/div&gt;</pre>
      </div>
    `;
    throw new Error(errorMsg);
  }

  console.log('[APP BOOT] Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);

  console.log('[APP BOOT] Rendering React app with ErrorBoundary...');
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <HashRouter>
          <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <App />
          </div>
        </HashRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  
  console.log('[APP BOOT] ✅ App rendered successfully');
} catch (error) {
  console.error('[APP BOOT] FATAL ERROR:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : 'No stack trace';
  
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: monospace; background: #1f2937; color: #ef4444; min-height: 100vh;">
      <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">🚨 APP BOOT ERROR</h1>
      <p style="color: #ef4444; font-size: 18px; margin-bottom: 20px;">Failed to initialize application</p>
      <details style="margin-bottom: 20px;">
        <summary style="color: #fbbf24; cursor: pointer; font-size: 16px; margin-bottom: 10px;">Error Details (click to expand)</summary>
        <div style="background: #111827; padding: 20px; border-radius: 8px; margin-top: 10px;">
          <pre style="color: #10b981; white-space: pre-wrap; word-break: break-word; margin: 0;">${errorMessage}\n\n${errorStack}</pre>
        </div>
      </details>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Reload Page</button>
    </div>
  `;
}


