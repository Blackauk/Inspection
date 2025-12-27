import { AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { Asset, OperationalStatus, LifecycleStatus } from '../types';
import { formatOperationalStatus } from '../../../lib/formatters';
import { useAuth } from '../../../contexts/AuthContext';

interface OverviewCardsProps {
  asset: Asset;
  onChangeLocation?: () => void;
  onChangeStatus?: () => void;
  onUpdateHours?: () => void;
}

export function OverviewCards({
  asset,
  onChangeLocation,
  onChangeStatus,
  onUpdateHours,
}: OverviewCardsProps) {
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

  const canChangeLocation = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canChangeStatus = ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canUpdateHours = ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Card 1: Asset Details */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Asset Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Asset ID</label>
                <div className="font-mono font-medium text-gray-900">{asset.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Asset Type</label>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{asset.assetTypeCode}</Badge>
                  <span className="text-gray-900">{asset.assetTypeName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Client Asset No</label>
                <div className="text-gray-900">{asset.internalClientAssetNumber || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Make / Model</label>
                <div className="text-gray-900">{asset.make} {asset.model}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Manufacturer Model No</label>
                <div className="text-gray-900">{asset.manufacturerModelNumber || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Supplier Serial No</label>
                <div className="text-gray-900">{asset.supplierSerialNumber || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Location & Ownership */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Location & Ownership</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Site</label>
                <div className="text-gray-900">{asset.siteName}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                <div className="flex items-center gap-2">
                  <div className="text-gray-900 flex-1">{asset.location || 'N/A'}</div>
                  {canChangeLocation && (
                    <Button size="sm" variant="outline" onClick={onChangeLocation}>
                      Change Location
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ownership</label>
                <div className="text-gray-900">{asset.ownership}</div>
              </div>
              {asset.ownership === 'Hired' && asset.hireCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Hire Company</label>
                  <div className="text-gray-900">{asset.hireCompany}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Responsible Team</label>
                <div className="text-gray-900">{asset.responsibleTeam || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Notes & Known Issues */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes & Known Issues</h3>
            <div className="space-y-3">
              {asset.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <div className="text-gray-900 whitespace-pre-wrap text-sm">{asset.notes}</div>
                </div>
              )}
              {asset.knownIssues && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Known Issues</label>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-amber-700 whitespace-pre-wrap text-sm">{asset.knownIssues}</div>
                  </div>
                </div>
              )}
              {!asset.notes && !asset.knownIssues && (
                <div className="text-sm text-gray-500">No notes or known issues</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Card 4: Status & Lifecycle */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Status & Lifecycle</h3>
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(asset.operationalStatus)}
              {getLifecycleBadge(asset.lifecycleStatus)}
              <Badge variant={asset.criticality === 'High' ? 'error' : asset.criticality === 'Medium' ? 'warning' : 'default'}>
                {asset.criticality}
              </Badge>
              {canChangeStatus && (
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={onChangeStatus}>
                    Change Status
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Card 5: Dates & Usage */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates & Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Commissioned</label>
                <div className="text-gray-900">
                  {asset.commissionDate ? new Date(asset.commissionDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date Brought to Site</label>
                <div className="text-gray-900">
                  {asset.dateBroughtToSite ? new Date(asset.dateBroughtToSite).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Service</label>
                <div className="text-gray-900">
                  {asset.lastServiceCompletedDate
                    ? new Date(asset.lastServiceCompletedDate).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Inspection</label>
                <div className="text-gray-900">
                  {asset.lastInspectionPassedDate
                    ? new Date(asset.lastInspectionPassedDate).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Hours / Mileage</label>
                <div className="flex items-center gap-2">
                  <div className="text-gray-900 flex-1">
                    {asset.hours !== undefined && `${asset.hours} hours`}
                    {asset.mileage !== undefined && `${asset.mileage} miles`}
                    {asset.hours === undefined && asset.mileage === undefined && 'N/A'}
                  </div>
                  {canUpdateHours && (
                    <Button size="sm" variant="outline" onClick={onUpdateHours}>
                      Update Hours
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


