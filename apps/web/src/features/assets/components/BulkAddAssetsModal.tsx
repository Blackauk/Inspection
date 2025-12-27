import { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import { Badge } from '../../../components/common/Badge';
import { getAssetTypes, mockSites, createAssets } from '../services';
import { generateTemplate, parseCSV, validateAssetRow, type ParsedAssetRow, type ValidationError } from '../utils/csvParser';
import { showToast } from '../../../components/common/Toast';

interface BulkAddAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkAddAssetsModal({ isOpen, onClose, onSuccess }: BulkAddAssetsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedAssetRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = () => {
    const csv = generateTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'corecheck-assets-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template downloaded', 'success');
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx)$/i)) {
      showToast('Please select a CSV or Excel file', 'error');
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);

      // Validate all rows
      const errors: ValidationError[] = [];
      parsed.forEach((row, index) => {
        const rowErrors = validateAssetRow(row, index + 1);
        errors.push(...rowErrors);
      });
      setValidationErrors(errors);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to parse file', 'error');
      setFile(null);
      setParsedData([]);
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
    if (validationErrors.length > 0) {
      showToast('Please fix validation errors before importing', 'error');
      return;
    }

    setIsImporting(true);
    try {
      // Map asset type code to ID if needed
      const assetTypes = getAssetTypes();
      const assetsToCreate = parsedData.map((row) => {
        // Find asset type by code or ID
        let assetTypeId = row.assetType || '';
        if (assetTypeId) {
          const assetType = assetTypes.find(
            (t) => t.code.toUpperCase() === assetTypeId.toUpperCase() || t.id === assetTypeId
          );
          if (assetType) {
            assetTypeId = assetType.id;
          }
        }

        // Map site name to ID if needed
        const sites = mockSites;
        let siteId = row.site || '';
        if (siteId) {
          const site = sites.find((s) => s.name === siteId || s.id === siteId);
          if (site) {
            siteId = site.id;
          }
        }

        return {
          id: row.assetId || undefined,
          assetTypeId,
          make: row.make || '',
          model: row.model || '',
          supplierSerialNumber: row.serialNumber || undefined,
          siteId,
          operationalStatus: (row.operationalStatus || 'InUse') as any,
          lifecycleStatus: (row.lifecycleStatus || 'Active') as any,
          ownership: (row.ownership || 'Owned') as any,
          responsibleTeam: row.responsibleTeam || '',
          criticality: (row.criticality || 'Medium') as any,
          complianceRAG: (row.complianceRag || 'Green') as any,
          notes: row.notes || undefined,
          lastOnSiteAt: row.lastOnSiteAt || new Date().toISOString().split('T')[0],
        };
      });

      const result = createAssets(assetsToCreate);

      if (result.errors.length > 0) {
        showToast(`Imported ${result.created.length} assets. ${result.errors.length} failed.`, 'warning');
      } else {
        showToast(`Successfully imported ${result.created.length} assets`, 'success');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to import assets', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const validRows = parsedData.length - validationErrors.length;
  const hasErrors = validationErrors.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Add Assets" size="xl">
      <div className="space-y-6">
        {/* Template Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Template</h3>
              <p className="text-xs text-gray-600 mb-3">
                Fill this in and upload to bulk add assets.
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
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
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

        {/* File Info & Preview */}
        {file && (
          <div className="space-y-4">
            {/* File Info */}
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
                  setParsedData([]);
                  setValidationErrors([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Total Rows</p>
                <p className="text-lg font-semibold text-gray-900">{parsedData.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Valid Rows</p>
                <p className="text-lg font-semibold text-green-700">{validRows}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Rows with Errors</p>
                <p className="text-lg font-semibold text-red-700">{validationErrors.length}</p>
              </div>
            </div>

            {/* Validation Errors */}
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      Validation Errors
                    </h4>
                    <p className="text-xs text-red-700">
                      Please fix these errors before importing
                    </p>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-xs text-red-800 bg-white p-2 rounded">
                      <span className="font-medium">Row {error.row}</span>
                      {error.column && <span> - {error.column}</span>}
                      {': '}
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            {parsedData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Preview (first {Math.min(10, parsedData.length)} rows)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Row</TableHeaderCell>
                          <TableHeaderCell>Asset ID</TableHeaderCell>
                          <TableHeaderCell>Type</TableHeaderCell>
                          <TableHeaderCell>Make</TableHeaderCell>
                          <TableHeaderCell>Model</TableHeaderCell>
                          <TableHeaderCell>Site</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <tbody>
                        {parsedData.slice(0, 10).map((row, index) => {
                          const rowErrors = validationErrors.filter((e) => e.row === index + 1);
                          return (
                            <TableRow
                              key={index}
                              className={rowErrors.length > 0 ? 'bg-red-50' : ''}
                            >
                              <TableCell>
                                {index + 1}
                                {rowErrors.length > 0 && (
                                  <Badge variant="error" size="sm" className="ml-2">
                                    {rowErrors.length} error{rowErrors.length !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{row.assetId || '(auto)'}</TableCell>
                              <TableCell>{row.assetType || '-'}</TableCell>
                              <TableCell>{row.make || '-'}</TableCell>
                              <TableCell>{row.model || '-'}</TableCell>
                              <TableCell>{row.site || '-'}</TableCell>
                              <TableCell>{row.operationalStatus || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || parsedData.length === 0 || hasErrors || isImporting}
          >
            {isImporting ? 'Importing...' : `Import ${validRows} Asset${validRows !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
