import { createContext, useContext, useState, ReactNode } from 'react';
import { CreateWorkOrderModal } from '../features/work-orders/components/CreateWorkOrderModal';

interface WorkOrderModalContextType {
  openCreateModal: (prefillAssetId?: string) => void;
  closeCreateModal: () => void;
}

const WorkOrderModalContext = createContext<WorkOrderModalContextType | undefined>(undefined);

export function WorkOrderModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefillAssetId, setPrefillAssetId] = useState<string | undefined>(undefined);

  const openCreateModal = (assetId?: string) => {
    setPrefillAssetId(assetId);
    setIsOpen(true);
  };

  const closeCreateModal = () => {
    setIsOpen(false);
    setPrefillAssetId(undefined);
  };

  const handleSuccess = (workOrderId: string) => {
    // Can be extended to trigger refresh callbacks if needed
    closeCreateModal();
  };

  return (
    <WorkOrderModalContext.Provider value={{ openCreateModal, closeCreateModal }}>
      {children}
      <CreateWorkOrderModal
        isOpen={isOpen}
        onClose={closeCreateModal}
        onSuccess={handleSuccess}
        prefillAssetId={prefillAssetId}
      />
    </WorkOrderModalContext.Provider>
  );
}

export function useWorkOrderModal() {
  const context = useContext(WorkOrderModalContext);
  if (context === undefined) {
    throw new Error('useWorkOrderModal must be used within a WorkOrderModalProvider');
  }
  return context;
}



