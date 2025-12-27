import { useState, useRef } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from './Button';
import { DropdownMenu } from './DropdownMenu';

interface ExportButtonProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  selectedCount: number;
  totalCount: number;
  tableName: string;
  disabled?: boolean;
}

export function ExportButton({
  onExportExcel,
  onExportPDF,
  selectedCount,
  totalCount,
  tableName,
  disabled = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasSelection = selectedCount > 0;
  const exportLabel = hasSelection
    ? `Export Selected (${selectedCount})`
    : `Export All (${totalCount})`;

  const tooltipText = hasSelection
    ? `Export ${selectedCount} selected ${tableName.toLowerCase()}`
    : `Export all ${totalCount} filtered ${tableName.toLowerCase()}`;

  return (
    <div className="relative" ref={buttonRef as any}>
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || totalCount === 0}
        title={tooltipText}
      >
        <Download className="w-4 h-4 mr-2" />
        Export
        {hasSelection && (
          <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {selectedCount}
          </span>
        )}
      </Button>
      <DropdownMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={buttonRef}
        align="left"
        items={[
          {
            label: `Export ${hasSelection ? 'Selected' : 'All'} → Excel`,
            icon: FileSpreadsheet,
            onClick: () => {
              onExportExcel();
              setIsOpen(false);
            },
          },
          {
            label: `Export ${hasSelection ? 'Selected' : 'All'} → PDF`,
            icon: FileText,
            onClick: () => {
              onExportPDF();
              setIsOpen(false);
            },
          },
        ]}
      />
    </div>
  );
}

