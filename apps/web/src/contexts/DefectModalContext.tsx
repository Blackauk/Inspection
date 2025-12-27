import { createContext, useContext, useState, ReactNode } from 'react';
import { ReportDefectModal } from '../features/defects/components/ReportDefectModal';
import { BulkAddDefectsModal } from '../features/defects/components/BulkAddDefectsModal';

interface DefectModalContextType {
  openReportModal: (prefillAssetId?: string) => void;
  openBulkAddModal: () => void;
  openReportDefectDropdown: (prefillAssetId?: string) => void; // Opens dropdown to choose between single/bulk
  closeReportModal: () => void;
}

const DefectModalContext = createContext<DefectModalContextType | undefined>(undefined);

export function DefectModalProvider({ children }: { children: ReactNode }) {
  const [isSingleFormOpen, setIsSingleFormOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prefillAssetId, setPrefillAssetId] = useState<string | undefined>(undefined);

  const openReportModal = (assetId?: string) => {
    setPrefillAssetId(assetId);
    setIsSingleFormOpen(true);
    setShowDropdown(false);
  };

  const openBulkAddModal = () => {
    setIsBulkAddOpen(true);
    setShowDropdown(false);
  };

  const openReportDefectDropdown = (assetId?: string) => {
    setPrefillAssetId(assetId);
    setShowDropdown(true);
  };

  const closeReportModal = () => {
    setIsSingleFormOpen(false);
    setIsBulkAddOpen(false);
    setShowDropdown(false);
    setPrefillAssetId(undefined);
  };

  const handleSingleSuccess = (defectId: string) => {
    // Can be extended to trigger refresh callbacks if needed
    // Note: If "Submit & Add Another" was used, modal stays open (handled in modal)
  };

  const handleBulkSuccess = () => {
    closeReportModal();
  };

  return (
    <DefectModalContext.Provider value={{ openReportModal, openBulkAddModal, openReportDefectDropdown, closeReportModal }}>
      {children}
      <ReportDefectModal
        isOpen={isSingleFormOpen}
        onClose={closeReportModal}
        onSuccess={handleSingleSuccess}
        prefillAssetId={prefillAssetId}
        onCloseWithoutSubmit={closeReportModal}
      />
      <BulkAddDefectsModal
        isOpen={isBulkAddOpen}
        onClose={closeReportModal}
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
                openReportModal(prefillAssetId);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <div className="font-medium">Report Single Defect</div>
                <div className="text-xs text-gray-500">Report one defect using the form</div>
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
                <div className="font-medium">Bulk Add Defects</div>
                <div className="text-xs text-gray-500">Upload a spreadsheet to add multiple defects</div>
              </div>
            </button>
          </div>
        </>
      )}
    </DefectModalContext.Provider>
  );
}

export function useDefectModal() {
  const context = useContext(DefectModalContext);
  if (context === undefined) {
    throw new Error('useDefectModal must be used within a DefectModalProvider');
  }
  return context;
}

