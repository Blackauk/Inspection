import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { OfflineProvider } from '../../contexts/OfflineContext';
import { GlobalSearchProvider } from '../../contexts/GlobalSearchContext';
import { TestModeProvider } from '../../contexts/TestModeContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { DefectsProvider } from '../../features/defects/context/DefectsContext';
import { InspectionsProvider } from '../../features/inspections/context/InspectionsContext';
import { SitesProvider } from '../../features/sites/context/SitesContext';
import { WorkOrderModalProvider } from '../../contexts/WorkOrderModalContext';
import { AssetModalProvider } from '../../contexts/AssetModalContext';
import { DefectModalProvider } from '../../contexts/DefectModalContext';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppProviders.tsx:8',message:'AppProviders render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

export function AppProviders({ children }: { children: ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppProviders.tsx:11',message:'AppProviders function body',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  try {
    return (
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <GlobalSearchProvider>
              <TestModeProvider>
                <DefectsProvider>
                  <InspectionsProvider>
                    <SitesProvider>
                      <WorkOrderModalProvider>
                        <AssetModalProvider>
                          <DefectModalProvider>
                            {children}
                          </DefectModalProvider>
                        </AssetModalProvider>
                      </WorkOrderModalProvider>
                    </SitesProvider>
                  </InspectionsProvider>
                </DefectsProvider>
              </TestModeProvider>
            </GlobalSearchProvider>
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppProviders.tsx:28',message:'AppProviders render error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('AppProviders render error:', error);
    return <div>AppProviders Error: {error instanceof Error ? error.message : String(error)}</div>;
  }
}
