import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TestModeContextType {
  testModeEnabled: boolean;
  setTestModeEnabled: (enabled: boolean) => void;
  toggleTestMode: () => void;
}

const TestModeContext = createContext<TestModeContextType | undefined>(undefined);

export function TestModeProvider({ children }: { children: ReactNode }) {
  const [testModeEnabled, setTestModeEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('test-mode-enabled');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('test-mode-enabled', String(testModeEnabled));
  }, [testModeEnabled]);

  const setTestModeEnabled = (enabled: boolean) => {
    setTestModeEnabledState(enabled);
  };

  const toggleTestMode = () => {
    setTestModeEnabledState((prev) => !prev);
  };

  return (
    <TestModeContext.Provider value={{ testModeEnabled, setTestModeEnabled, toggleTestMode }}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode() {
  const context = useContext(TestModeContext);
  if (context === undefined) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
}



