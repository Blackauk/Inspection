import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileText, Upload, Clock, Settings, Edit } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { Asset, OperationalStatus, LifecycleStatus, ComplianceRAG } from '../types';
import { formatOperationalStatus } from '../../../lib/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface AssetSummaryHeaderProps {
  asset: Asset;
  onStartInspection?: () => void;
  onCreateWorkOrder?: () => void;
  onChangeStatus?: () => void;
  onUploadDocs?: () => void;
  onUpdateHours?: () => void;
  onEditAsset?: () => void;
}

export function AssetSummaryHeader({
  asset,
  onStartInspection,
  onCreateWorkOrder,
  onChangeStatus,
  onUploadDocs,
  onUpdateHours,
  onEditAsset,
}: AssetSummaryHeaderProps) {
  const { user } = useAuth();

  const getStatusBadge = (status: OperationalStatus) => {
    const variants: Record<OperationalStatus, 'default' | 'success' | 'warning' | 'error'> = {
      InUse: 'success',
      OutOfUse: 'warning',
      OffHirePending: 'warning',
      OffHired: 'default',
      Quarantined: 'error',
      Archived: 'default',
    };
    return <Badge variant={variants[status]}>{formatOperationalStatus(status)}</Badge>;
  };

  const getLifecycleBadge = (status: LifecycleStatus) => {
    const variants: Record<LifecycleStatus, 'default' | 'success' | 'warning'> = {
      Active: 'success',
      Expected: 'warning',
      Decommissioned: 'warning',
      Disposed: 'default',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getRAGBadge = (rag: ComplianceRAG) => {
    const variants = {
      Red: 'error' as const,
      Amber: 'warning' as const,
      Green: 'success' as const,
    };
    return <Badge variant={variants[rag]}>{rag}</Badge>;
  };

  const getCriticalityBadge = (criticality: string) => {
    const variants: Record<string, 'default' | 'warning' | 'error'> = {
      Low: 'default',
      Medium: 'warning',
      High: 'error',
    };
    return <Badge variant={variants[criticality]}>{criticality} Criticality</Badge>;
  };

  const canPerformActions = ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '');

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Zone 1: Asset Summary Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="info" size="md">{asset.assetTypeCode}</Badge>
              <span className="text-2xl font-bold font-mono text-gray-900">{asset.id}</span>
              <span className="text-2xl font-semibold text-gray-700">—</span>
              <span className="text-2xl font-semibold text-gray-900">{asset.make} {asset.model}</span>
            </div>
            <div className="text-sm text-gray-600">
              {asset.siteName} • {asset.location || 'N/A'}
            </div>
          </div>
          
          {/* Status Pills Group */}
          <div className="flex items-center gap-2">
            {getStatusBadge(asset.operationalStatus)}
            {getLifecycleBadge(asset.lifecycleStatus)}
            {getRAGBadge(asset.complianceRAG)}
            {getCriticalityBadge(asset.criticality)}
          </div>
        </div>

        {/* Quarantine Banner */}
        {asset.isQuarantined && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-semibold">⚠️ QUARANTINED</span>
              <span className="text-sm text-red-700">{asset.knownIssues}</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        {canPerformActions && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onStartInspection}
              className="inline-flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              Start Inspection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateWorkOrder}
              className="inline-flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Create Work Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onEditAsset}
              className="inline-flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Asset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onChangeStatus}
              className="inline-flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Change Status
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onUploadDocs}
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Docs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onUpdateHours}
              className="inline-flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Update Hours
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

