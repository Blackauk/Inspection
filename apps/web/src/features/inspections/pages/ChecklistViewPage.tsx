import { useParams, useNavigate } from 'react-router-dom';
import { useInspections } from '../context/InspectionsContext';
import { getInspectionById } from '../services';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { CheckCircle, XCircle, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Inspection, ChecklistItemAnswer } from '../types';

export function ChecklistViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadInspection, currentInspection } = useInspections();
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    if (id) {
      const found = getInspectionById(id);
      if (found) {
        setInspection(found);
        loadInspection(id);
      }
    }
  }, [id, loadInspection]);

  const inspectionData = inspection || currentInspection;

  if (!inspectionData) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Inspection not found</div>
        </Card>
      </div>
    );
  }

  const isReadOnly = inspectionData.status === 'Closed';
  
  // Group items by section
  const itemsBySection = inspectionData.sections.length > 0
    ? inspectionData.sections.map((section) => ({
        section,
        items: inspectionData.items.filter((i) => i.sectionId === section.id),
      }))
    : [{ section: null, items: inspectionData.items }];

  const getResultIcon = (result: string | null) => {
    if (result === 'Pass') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (result === 'Fail') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (result === 'NA') {
      return <Minus className="w-5 h-5 text-gray-400" />;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Draft: 'default',
      InProgress: 'warning',
      Submitted: 'info',
      Approved: 'success',
      Closed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getResultBadge = (result: string) => {
    const variants: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
      Pass: 'success',
      Fail: 'error',
      NA: 'default',
      Pending: 'warning',
    };
    return <Badge variant={variants[result] || 'default'}>{result}</Badge>;
  };

  return (
    <div className="pb-6">
      <PageHeader
        title={inspectionData.templateName}
        subtitle={`Inspection ID: ${inspectionData.inspectionCode}`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/inspections')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to List
            </button>
            <button
              onClick={() => navigate(`/inspections/${inspectionData.id}`)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Inspection Summary */}
        <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection ID</label>
                <div className="font-mono font-medium text-gray-900">{inspectionData.inspectionCode}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {getStatusBadge(inspectionData.status)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                {getResultBadge(inspectionData.result)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="text-gray-900">{inspectionData.inspectionType}</div>
              </div>
              {inspectionData.assetId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <button
                    onClick={() => navigate(`/assets/${inspectionData.assetId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                  >
                    {inspectionData.assetId}
                  </button>
                </div>
              )}
              {inspectionData.siteName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site / Location</label>
                  <div className="text-gray-900">{inspectionData.siteName}</div>
                  {inspectionData.locationName && (
                    <div className="text-sm text-gray-600">{inspectionData.locationName}</div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                <div className="text-gray-900">{inspectionData.inspectorName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                <div className="text-gray-900">{new Date(inspectionData.inspectionDate).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Checklist Sections */}
        <div className="space-y-4">
          {itemsBySection.map(({ section, items }) => (
            <CollapsibleCard
              key={section?.id || 'no-section'}
              title={section?.title || 'General'}
              defaultExpanded={true}
            >
              <div className="space-y-4">
                {items.map((item) => {
                  const answer = inspectionData.answers.find((a) => a.checklistItemId === item.id);
                  // For closed inspections, show all as Pass if no answer exists
                  const displayResult = isReadOnly && !answer ? 'Pass' : (answer?.result || null);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getResultIcon(displayResult)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{item.question}</span>
                          {item.required && (
                            <Badge variant="error" size="sm">Required</Badge>
                          )}
                          {(item.safetyCritical || (item as any).critical) && (
                            <Badge variant="error" size="sm">Safety Critical</Badge>
                          )}
                        </div>
                        {answer?.comment && (
                          <div className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                            {answer.comment}
                          </div>
                        )}
                        {answer?.numericValue !== undefined && (
                          <div className="text-sm text-gray-600 mt-1">
                            Value: {answer.numericValue} {item.unit || ''}
                          </div>
                        )}
                        {answer?.textValue && (
                          <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {answer.textValue}
                          </div>
                        )}
                      </div>
                      {displayResult && (
                        <div className="flex-shrink-0">
                          {getResultBadge(displayResult)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleCard>
          ))}
        </div>

        {/* Inspector Notes */}
        {inspectionData.notes && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspector Notes</h3>
              <div className="text-gray-700 whitespace-pre-wrap">{inspectionData.notes}</div>
            </div>
          </Card>
        )}

        {/* Overall Result */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Result</h3>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${inspectionData.result === 'Pass' ? 'text-green-600' : inspectionData.result === 'Fail' ? 'text-red-600' : 'text-gray-400'}`}>
                {inspectionData.result === 'Pass' && <CheckCircle className="w-6 h-6" />}
                {inspectionData.result === 'Fail' && <XCircle className="w-6 h-6" />}
                <span className="text-xl font-semibold">{inspectionData.result}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


