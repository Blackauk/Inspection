import { createContext, useContext, useState, ReactNode } from 'react';
import { AddAssetFormModal } from '../features/assets/components/AddAssetFormModal';
import { BulkAddAssetsModal } from '../features/assets/components/BulkAddAssetsModal';

interface AssetModalContextType {
  openAddAssetModal: () => void;
  openBulkAddModal: () => void;
  openAddAssetDropdown: () => void; // Opens a dropdown to choose between single/bulk
  closeModals: () => void;
}

const AssetModalContext = createContext<AssetModalContextType | undefined>(undefined);

export function AssetModalProvider({ children }: { children: ReactNode }) {
  const [isSingleFormOpen, setIsSingleFormOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const openAddAssetModal = () => {
    setIsSingleFormOpen(true);
    setShowDropdown(false);
  };

  const openBulkAddModal = () => {
    setIsBulkAddOpen(true);
    setShowDropdown(false);
  };

  const openAddAssetDropdown = () => {
    setShowDropdown(true);
  };

  const closeModals = () => {
    setIsSingleFormOpen(false);
    setIsBulkAddOpen(false);
    setShowDropdown(false);
  };

  const handleSingleSuccess = () => {
    closeModals();
  };

  const handleBulkSuccess = () => {
    closeModals();
  };

  return (
    <AssetModalContext.Provider value={{ openAddAssetModal, openBulkAddModal, openAddAssetDropdown, closeModals }}>
      {children}
      <AddAssetFormModal
        isOpen={isSingleFormOpen}
        onClose={closeModals}
        onSuccess={handleSingleSuccess}
      />
      <BulkAddAssetsModal
        isOpen={isBulkAddOpen}
        onClose={closeModals}
        onSuccess={handleBulkSuccess}
      />
      {/* Dropdown menu for choosing between single/bulk */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-64" style={{ right: '16px', top: '72px' }}>
            <button
              onClick={() => {
                openAddAssetModal();
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <div className="font-medium">Add 1 Asset</div>
                <div className="text-xs text-gray-500">Create a single asset using the form</div>
              </div>
            </button>
            <button
              onClick={() => {
                openBulkAddModal();
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg flex items-center gap-3 border-t border-gray-200"
            >
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span className="text-green-600 font-semibold">+</span>
              </div>
              <div>
                <div className="font-medium">Bulk Add</div>
                <div className="text-xs text-gray-500">Upload a spreadsheet to add multiple assets</div>
              </div>
            </button>
          </div>
        </>
      )}
    </AssetModalContext.Provider>
  );
}

export function useAssetModal() {
  const context = useContext(AssetModalContext);
  if (context === undefined) {
    throw new Error('useAssetModal must be used within an AssetModalProvider');
  }
  return context;
}

