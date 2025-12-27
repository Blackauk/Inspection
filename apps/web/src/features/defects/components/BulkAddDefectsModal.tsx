import { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { showToast } from '../../../components/common/Toast';
import { useDefects } from '../context/DefectsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { mockSites } from '../../assets/services';

interface BulkAddDefectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkAddDefectsModal({ isOpen, onClose, onSuccess }: BulkAddDefectsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { createNewDefect } = useDefects();
  const { user } = useAuth();

  const handleDownloadTemplate = () => {
    // Generate CSV template for defects
    const headers = ['Title', 'Description', 'Asset ID', 'Site', 'Severity', 'Status'];
    const exampleRow = [
      'Hydraulic leak detected',
      'Hydraulic fluid leaking from main cylinder',
      'ASSET-001',
      'Site A',
      'High',
      'Open'
    ];
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'corecheck-defects-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template downloaded', 'success');
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx)$/i)) {
      showToast('Please select a CSV or Excel file', 'error');
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        showToast('File must contain at least a header row and one data row', 'error');
        setFile(null);
        return;
      }

      // For now, just show success - actual import will be handled in handleImport
      showToast(`Parsed ${rows.length - 1} defect(s) from file`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to parse file', 'error');
      setFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !user) {
      showToast('Please select a file and ensure you are logged in', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        showToast('File must contain at least a header row and one data row', 'error');
        setIsImporting(false);
        return;
      }

      // Skip header row
      const dataRows = rows.slice(1);
      let successCount = 0;
      let errorCount = 0;

      for (const row of dataRows) {
        try {
          const [title, description, assetId, siteName, severity, status] = row;
          
          if (!title || !description) {
            errorCount++;
            continue;
          }

          // Find site ID
          const site = mockSites.find(s => s.name === siteName || s.id === siteName);
          const siteId = site?.id || mockSites[0]?.id;

          await createNewDefect({
            title: title.trim(),
            description: description.trim(),
            assetId: assetId?.trim() || undefined,
            siteId,
            severityModel: 'LMH',
            severity: (severity?.trim() || 'Medium') as any,
            status: (status?.trim() || 'Open') as any,
            complianceTags: [],
            actions: [],
            attachments: [],
            beforeAfterRequired: false,
            reopenedCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: user.id,
            createdByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id,
            updatedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          } as any);
          
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (errorCount > 0) {
        showToast(`Imported ${successCount} defect(s). ${errorCount} failed.`, 'warning');
      } else {
        showToast(`Successfully imported ${successCount} defect(s)`, 'success');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to import defects', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Add Defects" size="xl">
      <div className="space-y-6">
        {/* Template Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Template</h3>
              <p className="text-xs text-gray-600 mb-3">
                Fill this in and upload to bulk add defects. Required columns: Title, Description.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        {!file && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              Drag & drop your Excel/CSV here
            </p>
            <p className="text-xs text-gray-500 mb-4">or</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileInputChange}
              className="hidden"
              id="defect-file-upload"
            />
            <label htmlFor="defect-file-upload" className="cursor-pointer">
              <span className="inline-block">
                <Button variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
                  Browse Files
                </Button>
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Accepted formats: .csv, .xlsx
            </p>
          </div>
        )}

        {/* File Info */}
        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Upload className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? 'Importing...' : 'Import Defects'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}



