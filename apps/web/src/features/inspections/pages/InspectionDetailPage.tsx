import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { getInspectionById } from '../services';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Tabs } from '../../../components/common/Tabs';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import {
  canEditInspection,
  canSubmitInspection,
  canApproveInspection,
  canCloseInspection,
} from '../lib/permissions';
import type { ChecklistItemAnswer, ChecklistItemResult, Inspection } from '../types';

export function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentInspection,
    loading,
    loadInspection,
    updateInspectionData,
    submitInspectionData,
    approveInspectionData,
  } = useInspections();

  const [localAnswers, setLocalAnswers] = useState<ChecklistItemAnswer[]>([]);

  useEffect(() => {
    if (id) {
      loadInspection(id);
    }
  }, [id, loadInspection]);

  useEffect(() => {
    if (currentInspection) {
      setLocalAnswers([...currentInspection.answers]);
    }
  }, [currentInspection]);

  // Alias for convenience
  const inspection = currentInspection;

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Loading inspection...</div>
        </Card>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Inspection not found</div>
        </Card>
      </div>
    );
  }
  const canEdit = canEditInspection(user?.role, inspection);
  const canSubmit = canSubmitInspection(user?.role);
  const canApprove = canApproveInspection(user?.role);
  const canClose = canCloseInspection(user?.role);

  const handleAnswerChange = (itemId: string, result: ChecklistItemResult, value?: string | number) => {
    const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
    const item = inspection.items.find((i) => i.id === itemId);
    
    if (!item) return;

    const newAnswer: ChecklistItemAnswer = {
      id: existingIndex >= 0 ? localAnswers[existingIndex].id : crypto.randomUUID(),
      checklistItemId: itemId,
      result,
      ...(item.type === 'Number' && typeof value === 'number' && { numericValue: value }),
      ...(item.type === 'Text' && typeof value === 'string' && { textValue: value }),
    };

    if (existingIndex >= 0) {
      const updated = [...localAnswers];
      updated[existingIndex] = newAnswer;
      setLocalAnswers(updated);
    } else {
      setLocalAnswers([...localAnswers, newAnswer]);
    }
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
    if (existingIndex >= 0) {
      const updated = [...localAnswers];
      updated[existingIndex] = { ...updated[existingIndex], comment };
      setLocalAnswers(updated);
    }
  };

  const handleSaveAnswers = async () => {
    try {
      await updateInspectionData(inspection.id, {
        answers: localAnswers,
        status: inspection.status === 'Draft' ? 'InProgress' : inspection.status,
        startedAt: inspection.startedAt || new Date().toISOString(),
        updatedBy: user!.id,
        updatedByName: `${user!.firstName} ${user!.lastName}`,
      });
      await loadInspection(inspection.id);
    } catch (error: any) {
      alert(`Error saving answers: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this inspection? This will create defects for any failed items.')) {
      return;
    }

    try {
      await submitInspectionData(inspection.id, user!.id, `${user!.firstName} ${user!.lastName}`);
      await loadInspection(inspection.id);
    } catch (error: any) {
      alert(`Error submitting inspection: ${error.message}`);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this inspection?')) {
      return;
    }

    try {
      await approveInspectionData(inspection.id, user!.id, `${user!.firstName} ${user!.lastName}`);
      await loadInspection(inspection.id);
    } catch (error: any) {
      alert(`Error approving inspection: ${error.message}`);
    }
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

  // Group items by section
  const itemsBySection = inspection.sections.length > 0
    ? inspection.sections.map((section) => ({
        section,
        items: inspection.items.filter((i) => i.sectionId === section.id),
      }))
    : [{ section: null, items: inspection.items }];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-1">Result</div>
                <div className="text-2xl font-bold">{getResultBadge(inspection.result)}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-1">Defects Created</div>
                <div className="text-2xl font-bold text-red-600">{inspection.linkedDefectIds.length}</div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-1">Items Checked</div>
                <div className="text-2xl font-bold text-blue-600">
                  {inspection.answers.filter(a => a.result !== null).length} / {inspection.items.length}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Code</label>
                <div className="font-mono font-medium text-gray-900">{inspection.inspectionCode}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {getStatusBadge(inspection.status)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                {getResultBadge(inspection.result)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <div className="text-gray-900">{inspection.templateName} (v{inspection.templateVersion})</div>
              </div>
              {inspection.assetId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <button
                    onClick={() => navigate(`/assets/${inspection.assetId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                  >
                    {inspection.assetId}
                  </button>
                </div>
              )}
              {inspection.locationName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="text-gray-900">{inspection.locationName}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                <div className="text-gray-900">{inspection.inspectorName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                <div className="text-gray-900">{new Date(inspection.inspectionDate).toLocaleString()}</div>
              </div>
              {inspection.linkedDefectIds.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linked Defects ({inspection.linkedDefectIds.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {inspection.linkedDefectIds.map((defectId) => (
                      <button
                        key={defectId}
                        onClick={() => navigate(`/defects/${defectId}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-mono"
                      >
                        {defectId}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        </div>
      ),
    },
    {
      id: 'checklist',
      label: 'Checklist',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Checklist</h3>
            
            {canEdit && inspection.status !== 'Closed' && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Make your changes below, then click "Save Answers" to update the inspection.
                </p>
                <Button onClick={handleSaveAnswers} size="sm" variant="primary">
                  Save Answers
                </Button>
              </div>
            )}

            <div className="space-y-6">
              {itemsBySection.map(({ section, items }) => (
                <div key={section?.id || 'no-section'}>
                  {section && (
                    <h4 className="text-md font-semibold text-gray-900 mb-3">{section.title}</h4>
                  )}
                  <div className="space-y-4">
                    {items.map((item) => {
                      const answer = localAnswers.find((a) => a.checklistItemId === item.id);
                      const isReadOnly = !canEdit || inspection.status === 'Closed';

                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.question}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {item.required && (
                                  <Badge variant="error" size="sm">Required</Badge>
                                )}
                                {item.critical && (
                                  <Badge variant="error" size="sm">Critical</Badge>
                                )}
                                {item.photoRequiredOnFail && (
                                  <Badge variant="warning" size="sm">Photo on Fail</Badge>
                                )}
                              </div>
                            </div>
                            {answer && (
                              <div>{getResultBadge(answer.result || 'Pending')}</div>
                            )}
                          </div>

                          {!isReadOnly && (
                            <div className="mt-3 space-y-2">
                              {item.type === 'PassFail' || item.type === 'PassFailNA' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAnswerChange(item.id, 'Pass')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      answer?.result === 'Pass'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    Pass
                                  </button>
                                  <button
                                    onClick={() => handleAnswerChange(item.id, 'Fail')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      answer?.result === 'Fail'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    Fail
                                  </button>
                                  {item.type === 'PassFailNA' && (
                                    <button
                                      onClick={() => handleAnswerChange(item.id, 'NA')}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        answer?.result === 'NA'
                                          ? 'bg-gray-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      N/A
                                    </button>
                                  )}
                                </div>
                              ) : item.type === 'Number' ? (
                                <input
                                  type="number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={answer?.numericValue || ''}
                                  onChange={(e) => handleAnswerChange(item.id, null, parseFloat(e.target.value))}
                                  min={item.minValue}
                                  max={item.maxValue}
                                  placeholder={item.unit ? `Enter value (${item.unit})` : 'Enter number'}
                                />
                              ) : (
                                <textarea
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                  value={answer?.textValue || ''}
                                  onChange={(e) => handleAnswerChange(item.id, null, e.target.value)}
                                  placeholder="Enter text..."
                                />
                              )}

                              {(answer?.result === 'Fail' || item.type === 'Text' || item.type === 'Number') && (
                                <div className="mt-2">
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows={2}
                                    placeholder="Add comment (optional)..."
                                    value={answer?.comment || ''}
                                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {isReadOnly && answer && (
                            <div className="mt-3">
                              {answer.comment && (
                                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                  {answer.comment}
                                </div>
                              )}
                              {answer.numericValue !== undefined && (
                                <div className="text-sm text-gray-700">
                                  Value: {answer.numericValue} {item.unit || ''}
                                </div>
                              )}
                              {answer.textValue && (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {answer.textValue}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'history',
      label: 'Activity Log',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
            <div className="space-y-4">
              {inspection.history && inspection.history.length > 0 ? (
                inspection.history.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-gray-300 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{entry.byName}</span>
                        <Badge variant="info" size="sm">{entry.type}</Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{entry.summary}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No activity log entries</div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="text-sm text-gray-900">
                  {new Date(inspection.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">by {inspection.createdByName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="text-sm text-gray-900">
                  {new Date(inspection.updatedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">by {inspection.updatedByName}</div>
              </div>
              {inspection.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.completedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {inspection.submittedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.submittedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {inspection.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.approvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="text-sm text-gray-900">
                  {new Date(inspection.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">by {inspection.createdByName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="text-sm text-gray-900">
                  {new Date(inspection.updatedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">by {inspection.updatedByName}</div>
              </div>
              {inspection.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.completedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {inspection.submittedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.submittedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {inspection.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved</label>
                  <div className="text-sm text-gray-900">
                    {new Date(inspection.approvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="pb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold font-mono text-gray-900">{inspection.inspectionCode}</span>
                {getResultBadge(inspection.result)}
                {getStatusBadge(inspection.status)}
              </div>
              <div className="text-lg text-gray-700 mb-1">{inspection.templateName}</div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {inspection.assetId && (
                  <div>
                    Asset:{' '}
                    <button
                      onClick={() => navigate(`/assets/${inspection.assetId}`)}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                    >
                      {inspection.assetId}
                    </button>
                  </div>
                )}
                {inspection.siteName && <div>Site: {inspection.siteName}</div>}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Inspector: {inspection.inspectorName} • {new Date(inspection.inspectionDate).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {inspection.status === 'Draft' && canEdit && (
              <>
                <Button size="sm" variant="primary" onClick={() => navigate(`/inspections/${inspection.id}/edit`)}>
                  Continue Editing
                </Button>
                <Button size="sm" variant="outline" onClick={handleSubmit}>
                  Mark Complete
                </Button>
              </>
            )}
            {inspection.status === 'Submitted' && canApprove && (
              <Button size="sm" variant="primary" onClick={handleApprove}>
                Approve Inspection
              </Button>
            )}
            {inspection.status === 'InProgress' && canSubmit && (
              <Button size="sm" variant="primary" onClick={handleSubmit}>
                Submit Inspection
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate(`/inspections/new?duplicate=${inspection.id}`)}>
              Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={() => alert('Export PDF - placeholder')}>
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  );
}
