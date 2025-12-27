import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Select } from '../../../components/common/Select';
import { Checkbox } from '../../../components/common/Checkbox';
import { showToast } from '../../../components/common/Toast';
import { generateReportPDF, generateReportCSV } from '../utils/reportGenerator';
import type { ReportFilters } from '../types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ReportFilters;
  reportData: {
    kpis: any;
    inspectionsChartData: any[];
    defectsChartData: any[];
    defectsBySeverityData: any[];
    tableData: any[];
    filteredDefects: any[];
    filteredWorkOrders: any[];
    filteredInspections: any[];
    allPMSchedules?: any[];
  };
  siteName?: string;
}

type ReportType = 'summary' | 'inspections' | 'defects' | 'workOrders' | 'assets';
type ReportFormat = 'PDF' | 'CSV';
type ReportSection = 'KPIs' | 'Charts' | 'Tables';

export function GenerateReportModal({
  isOpen,
  onClose,
  filters,
  reportData,
  siteName,
}: GenerateReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>(['KPIs', 'Charts', 'Tables']);
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReportType('summary');
      setSelectedSections(['KPIs', 'Charts', 'Tables']);
      setFormat('PDF');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!reportType) {
      errors.reportType = 'Report type is required';
    }
    
    if (selectedSections.length === 0) {
      errors.sections = 'At least one section must be selected';
    }
    
    if (!format) {
      errors.format = 'Format is required';
    }
    
    return errors;
  }, [reportType, selectedSections, format]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Handle section checkbox changes
  const handleSectionToggle = (section: ReportSection) => {
    setSelectedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
    setError(null);
  };

  const handleSelectAllSections = () => {
    setSelectedSections(['KPIs', 'Charts', 'Tables']);
    setError(null);
  };

  const handleClearAllSections = () => {
    setSelectedSections([]);
    setError(null);
  };

  // Generate report
  const handleGenerate = async () => {
    if (!isValid) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reportName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`;
      
      if (format === 'PDF') {
        await generateReportPDF({
          reportType,
          sections: selectedSections,
          filters,
          reportData,
          siteName,
          reportName,
        });
        showToast('Report generated and downloaded successfully', 'success');
      } else if (format === 'CSV') {
        generateReportCSV({
          reportType,
          sections: selectedSections,
          reportData,
          reportName,
        });
        showToast('Report generated and downloaded successfully', 'success');
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error generating report:', err);
      const errorMessage = err.message || 'Failed to generate report. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while loading
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Generate Report"
        size="lg"
      >
        <div className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Report Type */}
          <div>
            <Select
              label="Report Type *"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as ReportType);
                setError(null);
              }}
              options={[
                { value: 'summary', label: 'Summary Report' },
                { value: 'inspections', label: 'Inspections Report' },
                { value: 'defects', label: 'Defects Report' },
                { value: 'workOrders', label: 'Work Orders Report' },
                { value: 'assets', label: 'Assets Report' },
              ]}
            />
            {validationErrors.reportType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.reportType}</p>
            )}
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Sections *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAllSections}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="space-y-2 border border-gray-200 rounded-md p-3">
              {(['KPIs', 'Charts', 'Tables'] as ReportSection[]).map((section) => (
                <Checkbox
                  key={section}
                  label={section}
                  checked={selectedSections.includes(section)}
                  onChange={(e) => handleSectionToggle(section)}
                />
              ))}
            </div>
            {validationErrors.sections && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.sections}</p>
            )}
          </div>

          {/* Format */}
          <div>
            <Select
              label="Format *"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as ReportFormat);
                setError(null);
              }}
              options={[
                { value: 'PDF', label: 'PDF' },
                { value: 'CSV', label: 'CSV' },
              ]}
            />
            {validationErrors.format && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.format}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading || !isValid}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

