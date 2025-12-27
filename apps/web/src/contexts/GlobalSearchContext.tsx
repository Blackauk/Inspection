import { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <GlobalSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return context;
}







