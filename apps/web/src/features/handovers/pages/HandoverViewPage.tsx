import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Textarea } from '../../../components/common/Textarea';
import { ArrowLeft, CheckCircle, XCircle, Edit, FileText, Send } from 'lucide-react';
import {
  getFitterHandoverById,
  approveFitterHandover,
  requestChanges,
  submitFitterHandover,
  getAuditLog,
} from '../services';
import { showToast } from '../../../components/common/Toast';
import { CreateHandoverModal } from '../components/CreateHandoverModal';
import type { FitterHandover } from '../types';

export function HandoverViewPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [handover, setHandover] = useState<FitterHandover | null>(null);
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  
  const isEditMode = location.pathname.includes('/edit');

  useEffect(() => {
    if (id) {
      const found = getFitterHandoverById(id);
      setHandover(found || null);
      if (found) {
        const auditEntries = getAuditLog(id);
        setStatusHistory(auditEntries);
      }
      if (isEditMode) {
        setIsEditModalOpen(true);
      }
    }
  }, [id, isEditMode]);

  if (!handover) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Handover not found</p>
          <Button onClick={() => navigate('/handovers')} className="mt-4">
            Back to Handovers
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = handover.fitterUserId === user?.id;
  const canEdit = isOwner && (handover.status === 'Draft' || handover.status === 'ChangesRequested');
  const canSubmit = isOwner && handover.status === 'Draft';
  const canApprove = ['Supervisor', 'Admin'].includes(user?.role || '') && handover.status === 'Submitted';
  const canRequestChanges = ['Supervisor', 'Admin'].includes(user?.role || '') && handover.status === 'Submitted';

  const handleApprove = () => {
    if (!user) return;
    const result = approveFitterHandover(handover.id, user.id, `${user.firstName} ${user.lastName}`);
    if (result) {
      setHandover(result);
      showToast('Handover approved', 'success');
    }
  };

  const handleRequestChanges = () => {
    if (!user || !changesNotes.trim()) {
      showToast('Please provide notes for requested changes', 'error');
      return;
    }
    const result = requestChanges(handover.id, user.id, `${user.firstName} ${user.lastName}`, changesNotes);
    if (result) {
      setHandover(result);
      setIsRequestChangesModalOpen(false);
      setChangesNotes('');
      showToast('Changes requested', 'success');
    }
  };

  const handleSubmit = () => {
    const result = submitFitterHandover(handover.id);
    if (result) {
      setHandover(result);
      showToast('Handover submitted successfully', 'success');
    }
  };

  const getStatusBadge = (status: FitterHandover['status']) => {
    const variants: Record<FitterHandover['status'], 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Draft: 'default',
      Submitted: 'info',
      ChangesRequested: 'warning',
      Approved: 'success',
      IncludedInMaster: 'default',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/handovers')} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{handover.id}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {handover.siteName} • {new Date(handover.date).toLocaleDateString()} • {handover.shiftType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(handover.status)}
          {canEdit && (
            <Button onClick={() => setIsEditModalOpen(true)} size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canSubmit && (
            <Button onClick={handleSubmit} size="sm">
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} variant="primary" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {canRequestChanges && (
            <Button onClick={() => setIsRequestChangesModalOpen(true)} variant="outline" size="sm">
              <XCircle className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Fitter</label>
                  <p className="text-sm text-gray-900 mt-1">{handover.fitterName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Shift Pattern</label>
                  <p className="text-sm text-gray-900 mt-1">{handover.shiftPattern}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Locations</label>
                  <p className="text-sm text-gray-900 mt-1">{handover.locations.join(', ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(handover.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Shift Comments */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Shift Comments</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{handover.shiftComments}</p>
            </div>
          </Card>

          {/* Tasks Completed */}
          {handover.tasksCompleted && handover.tasksCompleted.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Tasks / Work Carried Out</h2>
                <div className="space-y-3">
                  {handover.tasksCompleted.map((task, idx) => (
                    <div key={task.id || idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            {task.location && <span>Location: {task.location}</span>}
                            {task.assetReference && <span>Asset: {task.assetReference}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={task.status === 'Completed' ? 'success' : 'warning'} size="sm">
                            {task.status}
                          </Badge>
                          {task.requiresFollowUp && (
                            <Badge variant="error" size="sm">Follow-up Required</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Personnel */}
          {handover.personnel && handover.personnel.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Personnel</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Name</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Occupation</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Location</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {handover.personnel.map((person, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-sm">{person.name}</td>
                          <td className="py-2 px-3 text-sm">{person.occupation}</td>
                          <td className="py-2 px-3 text-sm">{person.location || '—'}</td>
                          <td className="py-2 px-3 text-sm">{person.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Materials Used */}
          {handover.materialsUsed.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Materials Used</h2>
                <div className="space-y-2">
                  {handover.materialsUsed.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{material.item}</span>
                        {material.qty && <span className="text-sm text-gray-600 ml-2">({material.qty})</span>}
                      </div>
                      {material.notes && <span className="text-xs text-gray-500">{material.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Materials Required */}
          {handover.materialsRequired.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Materials Required Next Shift</h2>
                <div className="space-y-2">
                  {handover.materialsRequired.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{material.item}</span>
                        {material.qty && <span className="text-sm text-gray-600 ml-2">({material.qty})</span>}
                      </div>
                      {material.notes && <span className="text-xs text-gray-500">{material.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Next Shift Notes */}
          {handover.nextShiftNotes && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Next Shift Notes</h2>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{handover.nextShiftNotes}</p>
              </div>
            </Card>
          )}

          {/* Attachments / Photos */}
          {handover.attachments.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {handover.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-600 text-center">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supervisor Notes */}
          {handover.supervisorNotes && (
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-2">Supervisor Notes</h3>
                <p className="text-sm text-gray-600">{handover.supervisorNotes}</p>
              </div>
            </Card>
          )}

          {/* Linked Entities */}
          {handover.linkedEntities && handover.linkedEntities.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-2">Linked Entities</h3>
                <div className="space-y-2">
                  {handover.linkedEntities.map((entity, idx) => (
                    <div key={idx} className="text-sm">
                      <Badge variant="info" size="sm">{entity.type}</Badge>
                      <span className="ml-2 text-gray-600">{entity.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Status History / Approvals */}
          {statusHistory.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-3">Status History</h3>
                <div className="space-y-3">
                  {statusHistory.map((entry, idx) => (
                    <div key={entry.id || idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">{entry.action}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.userName} • {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        {entry.notes && (
                          <div className="text-xs text-gray-600 mt-1 italic">{entry.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-2">Metadata</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Created: {new Date(handover.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(handover.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Request Changes Modal */}
      <Modal
        isOpen={isRequestChangesModalOpen}
        onClose={() => {
          setIsRequestChangesModalOpen(false);
          setChangesNotes('');
        }}
        title="Request Changes"
      >
        <div className="space-y-4">
          <Textarea
            label="Notes"
            value={changesNotes}
            onChange={(e) => setChangesNotes(e.target.value)}
            placeholder="Enter notes for requested changes..."
            rows={4}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestChangesModalOpen(false);
                setChangesNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestChanges} disabled={!changesNotes.trim()}>
              Request Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {handover && (
        <CreateHandoverModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            if (isEditMode) {
              navigate(`/handovers/${handover.id}`);
            }
          }}
          editId={handover.id}
          onSuccess={() => {
            // Refresh handover data
            const updated = getFitterHandoverById(handover.id);
            if (updated) {
              setHandover(updated);
            }
            setIsEditModalOpen(false);
            if (isEditMode) {
              navigate(`/handovers/${handover.id}`);
            }
          }}
        />
      )}
    </div>
  );
}

