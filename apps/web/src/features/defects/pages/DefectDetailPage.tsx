import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useDefects } from '../context/DefectsContext';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { DropdownMenu } from '../../../components/common/DropdownMenu';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CloseDefectModal } from '../components/CloseDefectModal';
import { ReopenDefectModal } from '../components/ReopenDefectModal';
import {
  canEditDefect,
  canCloseDefect,
  canReopenDefect,
  canDeleteDefect,
  validateCloseDefect,
} from '../lib/permissions';
import { getAllDefects } from '../db/repository';
import { getAssets, mockSites } from '../../assets/services';
import {
  ChevronRight,
  Edit,
  Save,
  X as XIcon,
  MoreVertical,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Download,
  Copy,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Defect, DefectStatus, DefectSeverity } from '../types';

const mockUsers = [
  { id: 'user-1', name: 'John Smith' },
  { id: 'user-2', name: 'Sarah Johnson' },
  { id: 'user-3', name: 'Mike Davis' },
  { id: 'user-4', name: 'Emma Wilson' },
  { id: 'user-5', name: 'Tom Brown' },
  { id: 'user-6', name: 'Lisa Anderson' },
  { id: 'user-7', name: 'David Lee' },
  { id: 'user-8', name: 'Rachel Green' },
];

export function DefectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentDefect,
    loading,
    loadDefect,
    updateDefectData,
    closeDefect,
    reopenDefect,
    addDefectComment,
    deleteDefectData,
    loadDefects,
  } = useDefects();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Defect>>({});
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [relatedDefects, setRelatedDefects] = useState<Defect[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const moreMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (id) {
      loadDefect(id);
    }
  }, [id, loadDefect]);

  // Load related defects (recurrences)
  useEffect(() => {
    if (currentDefect) {
      loadRelatedDefects();
      // Initialize edit form when defect loads
      if (!isEditing) {
        setEditForm({
          title: currentDefect.title,
          description: currentDefect.description,
          severity: currentDefect.severity,
          assignedToId: currentDefect.assignedToId,
          assignedToName: currentDefect.assignedToName,
          targetRectificationDate: currentDefect.targetRectificationDate,
          unsafeDoNotUse: currentDefect.unsafeDoNotUse,
        });
      }
    }
  }, [currentDefect]);

  const loadRelatedDefects = async () => {
    if (!currentDefect) return;
    
    try {
      const allDefects = await getAllDefects();
      const related = allDefects.filter(
        (d) =>
          (d.parentDefectId === currentDefect.id || d.id === currentDefect.parentDefectId) &&
          d.id !== currentDefect.id
      );
      setRelatedDefects(related);
    } catch (error) {
      console.error('Failed to load related defects:', error);
    }
  };

  const handleEdit = () => {
    if (currentDefect) {
      setEditForm({
        title: currentDefect.title,
        description: currentDefect.description,
        severity: currentDefect.severity,
        assignedToId: currentDefect.assignedToId,
        assignedToName: currentDefect.assignedToName,
        targetRectificationDate: currentDefect.targetRectificationDate,
        unsafeDoNotUse: currentDefect.unsafeDoNotUse,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!currentDefect) return;

    try {
      await updateDefectData(currentDefect.id, {
        ...editForm,
        updatedBy: user!.id,
        updatedByName: `${user!.firstName} ${user!.lastName}`,
      });
      setIsEditing(false);
      await loadDefect(currentDefect.id);
    } catch (error: any) {
      alert(`Error saving defect: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentDefect) {
      setEditForm({
        title: currentDefect.title,
        description: currentDefect.description,
        severity: currentDefect.severity,
        assignedToId: currentDefect.assignedToId,
        assignedToName: currentDefect.assignedToName,
        targetRectificationDate: currentDefect.targetRectificationDate,
        unsafeDoNotUse: currentDefect.unsafeDoNotUse,
      });
    }
  };

  const handleCloseDefect = async (data: {
    actionTaken: string;
    notes: string;
    attachments: any[];
    returnToService?: boolean;
  }) => {
    if (!currentDefect) return;
    await closeDefect(currentDefect.id, data, user!.id, `${user!.firstName} ${user!.lastName}`);
    await loadDefect(currentDefect.id);
    await loadDefects();
  };

  const handleReopenDefect = async (data: {
    isNewOccurrence: boolean;
    reason: string;
    attachments?: any[];
  }) => {
    if (!currentDefect) return;
    const newDefectId = await reopenDefect(
      currentDefect.id,
      data,
      user!.id,
      `${user!.firstName} ${user!.lastName}`
    );
    if (data.isNewOccurrence && typeof newDefectId === 'string') {
      navigate(`/defects/${newDefectId}`);
    } else {
      await loadDefect(currentDefect.id);
      await loadRelatedDefects();
      await loadDefects();
    }
  };

  const handleAddComment = async () => {
    if (!currentDefect || !newComment.trim()) return;

    try {
      await addDefectComment(currentDefect.id, {
        at: new Date().toISOString(),
        by: user!.id,
        byName: `${user!.firstName} ${user!.lastName}`,
        text: newComment,
      });
      setNewComment('');
      await loadDefect(currentDefect.id);
    } catch (error: any) {
      alert(`Error adding comment: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!currentDefect) return;
    if (!confirm(`Are you sure you want to delete defect ${currentDefect.defectCode}?`)) {
      return;
    }

    try {
      await deleteDefectData(currentDefect.id);
      navigate('/defects');
    } catch (error: any) {
      alert(`Error deleting defect: ${error.message}`);
    }
  };

  const handleDuplicate = () => {
    if (!currentDefect) return;
    navigate(`/defects/new?duplicate=${currentDefect.id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentDefect) return;

    try {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.startsWith('image/') ? 'photo' : 
                        file.type.startsWith('video/') ? 'video' : 'document';
        const uri = URL.createObjectURL(file);
        
        newAttachments.push({
          id: crypto.randomUUID(),
          type: fileType,
          filename: file.name,
          uri,
          createdAt: new Date().toISOString(),
          label: 'other' as const,
        });
      }

      await updateDefectData(currentDefect.id, {
        attachments: [...currentDefect.attachments, ...newAttachments],
        updatedBy: user!.id,
        updatedByName: `${user!.firstName} ${user!.lastName}`,
      });
      await loadDefect(currentDefect.id);
    } catch (error: any) {
      alert(`Error uploading files: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Loading defect...</div>
        </Card>
      </div>
    );
  }

  if (!currentDefect) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">Defect not found</div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/defects')}>
                Back to Defects
              </Button>
              <Button variant="primary" onClick={() => navigate('/defects/new')}>
                Create Defect
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const defect = currentDefect;
  const canEdit = canEditDefect(user?.role);
  const canClose = canCloseDefect(user?.role) && defect.status !== 'Closed';
  const canReopen = canReopenDefect(user?.role) && defect.status === 'Closed';
  const canDelete = canDeleteDefect(user?.role);
  const recurrenceCount = defect.recurrenceCount || 0;
  const hasRecurrences = relatedDefects.length > 0 || recurrenceCount > 0;

  // Get all sites for dropdown
  const sites = mockSites;
  const assets = getAssets();

  // Get status options
  const statusOptions: { value: DefectStatus; label: string }[] = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Open', label: 'Open' },
    { value: 'Acknowledged', label: 'Acknowledged' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Deferred', label: 'Deferred' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Overdue', label: 'Overdue' },
  ];

  // Get severity options based on model
  const severityOptions: { value: DefectSeverity; label: string }[] =
    defect.severityModel === 'LMH'
      ? [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
        ]
      : [
          { value: 'Minor', label: 'Minor' },
          { value: 'Major', label: 'Major' },
          { value: 'Critical', label: 'Critical' },
        ];

  // Sort history by date (newest first)
  const sortedHistory = useMemo(() => {
    return [...defect.history].sort((a, b) => 
      new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }, [defect.history]);

  // Sort comments by date (newest first)
  const sortedComments = useMemo(() => {
    return [...defect.comments].sort((a, b) => 
      new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }, [defect.comments]);

  return (
    <div className="pb-6">
      {/* Breadcrumb */}
      <div className="px-6 pt-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/defects" className="hover:text-gray-900">
            Defects
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{defect.defectCode}</span>
        </nav>
      </div>

      {/* Header */}
      <div className="px-6 pt-4 pb-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {defect.defectCode} – {defect.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={defect.status} />
              <SeverityBadge severity={defect.severity} severityModel={defect.severityModel} />
              {defect.unsafeDoNotUse && (
                <Badge variant="error" className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  UNSAFE - DO NOT USE
                </Badge>
              )}
              {!defect.unsafeDoNotUse && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Safe
                </Badge>
              )}
              {hasRecurrences && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  Recurrences: {recurrenceCount}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <XIcon className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddUpdateModal(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Update
                </Button>
                {canClose && (
                  <Button variant="primary" size="sm" onClick={() => setShowCloseModal(true)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Close Defect
                  </Button>
                )}
                {canReopen && (
                  <Button variant="primary" size="sm" onClick={() => setShowReopenModal(true)}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Reopen
                  </Button>
                )}
                <div className="relative">
                  <Button
                    ref={moreMenuRef}
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  <DropdownMenu
                    isOpen={showMoreMenu}
                    onClose={() => setShowMoreMenu(false)}
                    anchorRef={moreMenuRef}
                    align="right"
                    items={[
                      {
                        label: 'Duplicate',
                        icon: Copy,
                        onClick: () => {
                          handleDuplicate();
                          setShowMoreMenu(false);
                        },
                      },
                      {
                        label: 'Export PDF',
                        icon: FileText,
                        onClick: () => {
                          // TODO: Implement PDF export
                          alert('PDF export coming soon');
                          setShowMoreMenu(false);
                        },
                      },
                      {
                        label: 'Export Excel',
                        icon: Download,
                        onClick: () => {
                          // TODO: Implement Excel export
                          alert('Excel export coming soon');
                          setShowMoreMenu(false);
                        },
                      },
                      ...(canDelete
                        ? [
                            {
                              label: 'Delete',
                              icon: Trash2,
                              onClick: () => {
                                handleDelete();
                                setShowMoreMenu(false);
                              },
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Defect Code
                    </label>
                    <div className="font-mono font-medium text-gray-900">{defect.defectCode}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <Select
                        value={editForm.status || defect.status}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value as DefectStatus })
                        }
                        options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
                      />
                    ) : (
                      <StatusBadge status={defect.status} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    {isEditing ? (
                      <Select
                        value={editForm.severity || defect.severity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, severity: e.target.value as DefectSeverity })
                        }
                        options={severityOptions.map((s) => ({ value: s.value, label: s.label }))}
                      />
                    ) : (
                      <SeverityBadge severity={defect.severity} severityModel={defect.severityModel} />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unsafe / Do Not Use
                    </label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.unsafeDoNotUse || false}
                          onChange={(e) =>
                            setEditForm({ ...editForm, unsafeDoNotUse: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Mark as unsafe</span>
                      </div>
                    ) : (
                      <Badge variant={defect.unsafeDoNotUse ? 'error' : 'success'}>
                        {defect.unsafeDoNotUse ? 'UNSAFE - DO NOT USE' : 'Safe'}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                    <div className="text-gray-900">{defect.siteName || '—'}</div>
                  </div>

                  {defect.assetId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                      <button
                        onClick={() => navigate(`/assets/${defect.assetId}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                      >
                        {defect.assetId}
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    {isEditing ? (
                      <Select
                        value={editForm.assignedToId || ''}
                        onChange={(e) => {
                          const selectedUser = mockUsers.find((u) => u.id === e.target.value);
                          setEditForm({
                            ...editForm,
                            assignedToId: e.target.value || undefined,
                            assignedToName: selectedUser?.name,
                          });
                        }}
                        options={[
                          { value: '', label: 'Unassigned' },
                          ...mockUsers.map((u) => ({ value: u.id, label: u.name })),
                        ]}
                      />
                    ) : (
                      <div className="text-gray-900">{defect.assignedToName || 'Unassigned'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <div className="text-gray-900">
                      {new Date(defect.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">by {defect.createdByName}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Rectification Date
                    </label>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={
                          editForm.targetRectificationDate
                            ? new Date(editForm.targetRectificationDate).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            targetRectificationDate: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : undefined,
                          })
                        }
                      />
                    ) : (
                      <div
                        className={`text-gray-900 ${
                          defect.targetRectificationDate &&
                          new Date(defect.targetRectificationDate) < new Date() &&
                          defect.status !== 'Closed'
                            ? 'text-red-600 font-medium'
                            : ''
                        }`}
                      >
                        {defect.targetRectificationDate
                          ? new Date(defect.targetRectificationDate).toLocaleString()
                          : '—'}
                      </div>
                    )}
                  </div>

                  {defect.closedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closed Date</label>
                      <div className="text-gray-900">
                        {new Date(defect.closedAt).toLocaleString()}
                      </div>
                      {defect.closedByName && (
                        <div className="text-xs text-gray-500 mt-1">by {defect.closedByName}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  {isEditing ? (
                    <Input
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                    />
                  ) : (
                    <div className="text-gray-900 font-medium">{defect.title}</div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {isEditing ? (
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  ) : (
                    <div className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {defect.description || 'No description provided'}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions / Updates Timeline */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions / Updates Timeline
                </h2>
                <div className="space-y-4">
                  {sortedHistory.length > 0 ? (
                    sortedHistory.map((entry) => (
                      <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{entry.byName}</span>
                            <Badge variant="info" size="sm">
                              {entry.type.replace('_', ' ')}
                            </Badge>
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

            {/* Attachments */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
                  {!isEditing && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" size="sm" as="span">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </label>
                  )}
                </div>
                {defect.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {defect.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => {
                          if (attachment.type === 'photo') {
                            setPreviewImage(attachment.uri);
                          }
                        }}
                      >
                        {attachment.type === 'photo' ? (
                          <img
                            src={attachment.uri}
                            alt={attachment.filename}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="text-xs text-gray-600 truncate">{attachment.filename}</div>
                        {attachment.label && (
                          <div className="text-xs text-blue-600 mt-1">{attachment.label}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No attachments</div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - Secondary Content */}
          <div className="space-y-6">
            {/* Close-out / Resolution Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {defect.status === 'Closed' ? 'Resolution Summary' : 'Close-out'}
                </h2>
                {defect.status === 'Closed' ? (
                  <div className="space-y-4">
                    {defect.actionTaken && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Action Taken
                        </label>
                        <div className="text-gray-900">{defect.actionTaken}</div>
                      </div>
                    )}
                    {defect.closedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Closed Date
                        </label>
                        <div className="text-gray-900">
                          {new Date(defect.closedAt).toLocaleString()}
                        </div>
                        {defect.closedByName && (
                          <div className="text-xs text-gray-500 mt-1">by {defect.closedByName}</div>
                        )}
                      </div>
                    )}
                    {sortedComments
                      .filter((c) => c.text.toLowerCase().includes('closed') || c.text.toLowerCase().includes('action:'))
                      .map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-900">{comment.text}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.byName} • {new Date(comment.at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Close this defect when the issue has been resolved.
                    </p>
                    {defect.beforeAfterRequired && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Before and after photos are required for this defect.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Related Defects */}
            {hasRecurrences && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Defects</h2>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">
                      Recurrence count: {recurrenceCount}
                    </div>
                    {relatedDefects.length > 0 && (
                      <div className="space-y-2">
                        {relatedDefects.map((related) => (
                          <Link
                            key={related.id}
                            to={`/defects/${related.id}`}
                            className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{related.defectCode}</div>
                            <div className="text-sm text-gray-600 truncate">{related.title}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <StatusBadge status={related.status} />
                              <span className="text-xs text-gray-500">
                                {new Date(related.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
                <div className="mb-4">
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                  />
                  <Button onClick={handleAddComment} className="mt-2" size="sm" disabled={!newComment.trim()}>
                    Add Comment
                  </Button>
                </div>
                <div className="space-y-4">
                  {sortedComments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{comment.byName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</div>
                    </div>
                  ))}
                  {sortedComments.length === 0 && (
                    <div className="text-center py-4 text-gray-500">No comments yet</div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CloseDefectModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        defect={defect}
        onCloseDefect={handleCloseDefect}
      />

      <ReopenDefectModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        defect={defect}
        onReopen={handleReopenDefect}
      />

      {/* Add Update Modal (reuses ReopenDefectModal logic) */}
      <ReopenDefectModal
        isOpen={showAddUpdateModal}
        onClose={() => setShowAddUpdateModal(false)}
        defect={defect}
        title="Add Progress Update"
        isUpdateModal={true}
        onReopen={async (data) => {
          if (data.isNewOccurrence) {
            await handleReopenDefect(data);
          } else {
            // Same defect - add comment, attachments, and history entry
            const now = new Date().toISOString();
            const userName = `${user!.firstName} ${user!.lastName}`;
            
            // Add attachments if provided
            if (data.attachments && data.attachments.length > 0) {
              await updateDefectData(defect.id, {
                attachments: [...defect.attachments, ...data.attachments],
                updatedBy: user!.id,
                updatedByName: userName,
              });
            }
            
            // Add comment (which also adds history entry)
            await addDefectComment(defect.id, {
              at: now,
              by: user!.id,
              byName: userName,
              text: `Update: ${data.reason}`,
            });
            
            // If closed, reopen it
            if (defect.status === 'Closed') {
              await handleReopenDefect({ ...data, isNewOccurrence: false });
            } else {
              await loadDefect(defect.id);
            }
          }
          setShowAddUpdateModal(false);
        }}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="Image Preview"
          size="xl"
        >
          <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
        </Modal>
      )}
    </div>
  );
}
