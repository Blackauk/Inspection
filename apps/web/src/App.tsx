import { AppProviders } from './app/providers/AppProviders';
import { AppRoutes } from './app/routes';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:5',message:'App component render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

function App() {
  console.log('[APP] App component rendering...');

  try {
    console.log('[APP] Rendering AppProviders and AppRoutes...');
    return (
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    );
  } catch (error) {
    console.error('[APP] Render error caught:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    return (
      <div style={{ padding: '40px', background: '#1f2937', color: '#ef4444', minHeight: '100vh' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '20px' }}>🚨 APP RENDER ERROR</h1>
        <p style={{ color: '#ef4444', fontSize: '18px', marginBottom: '20px' }}>React is working but App component failed to render</p>
        <details>
          <summary style={{ color: '#fbbf24', cursor: 'pointer', fontSize: '16px', marginBottom: '10px' }}>Error Details (click to expand)</summary>
          <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', marginTop: '10px' }}>
            <pre style={{ color: '#10b981', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
              {errorMessage}
              {'\n\n'}
              {errorStack}
            </pre>
          </div>
        </details>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
        >
          Reload Page
        </button>
      </div>
    );
  }
}

export default App;


