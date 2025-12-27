import { ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string | ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  value?: string; // Controlled mode
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, value, onTabChange }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  // Use controlled value if provided, otherwise use internal state
  const activeTab = value !== undefined ? value : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (value === undefined) {
      // Only update internal state if not controlled
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{activeTabContent}</div>
    </div>
  );
}
