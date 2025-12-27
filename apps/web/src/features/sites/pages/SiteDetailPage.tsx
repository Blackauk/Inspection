import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSites } from '../context/SitesContext';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Tabs } from '../../../components/common/Tabs';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import {
  canEditSite,
  canArchiveSite,
  canCreateLocation,
  canEditLocation,
} from '../lib/permissions';
import type { Location } from '../types';

export function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentSite,
    locations,
    loading,
    loadSite,
    loadLocations,
    archiveSiteData,
    reactivateSiteData,
  } = useSites();

  useEffect(() => {
    if (id) {
      loadSite(id);
      loadLocations({ siteId: id });
    }
  }, [id, loadSite, loadLocations]);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Loading site...</div>
        </Card>
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Site not found</div>
        </Card>
      </div>
    );
  }

  const site = currentSite;
  const siteLocations = locations.filter((l) => l.siteId === site.id);
  const zones = siteLocations.filter((l) => l.type === 'Zone');
  const areas = siteLocations.filter((l) => l.type === 'Area');

  const canEdit = canEditSite(user?.role);
  const canArchive = canArchiveSite(user?.role);
  const canCreateLoc = canCreateLocation(user?.role);
  const canEditLoc = canEditLocation(user?.role);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Active: 'success',
      Inactive: 'warning',
      Closed: 'error',
      Archived: 'default',
      Restricted: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive "${site.name}"?`)) {
      return;
    }
    try {
      await archiveSiteData(site.id);
    } catch (error: any) {
      alert(`Error archiving site: ${error.message}`);
    }
  };

  const handleReactivate = async () => {
    if (!confirm(`Are you sure you want to reactivate "${site.name}"?`)) {
      return;
    }
    try {
      await reactivateSiteData(site.id);
    } catch (error: any) {
      alert(`Error reactivating site: ${error.message}`);
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <div className="font-medium text-gray-900">{site.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {getStatusBadge(site.status)}
              </div>
              {site.code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Code</label>
                  <div className="font-mono text-gray-900">{site.code}</div>
                </div>
              )}
              {site.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="text-gray-900">{site.address}</div>
                </div>
              )}
              {site.siteManagerName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Manager</label>
                  <div className="text-gray-900">{site.siteManagerName}</div>
                </div>
              )}
              {site.notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <div className="text-gray-900 whitespace-pre-wrap">{site.notes}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="text-sm text-gray-900">
                  {new Date(site.createdAt).toLocaleString()} by {site.createdByName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="text-sm text-gray-900">
                  {new Date(site.updatedAt).toLocaleString()} by {site.updatedByName}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ),
    },
    {
      id: 'locations',
      label: 'Locations',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
              {canCreateLoc && (
                <Button size="sm" onClick={() => navigate(`/sites/${site.id}/locations/new`)}>
                  + Add Location
                </Button>
              )}
            </div>

            {/* Zones */}
            {zones.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Zones</h4>
                <div className="space-y-2">
                  {zones.map((zone) => {
                    const zoneAreas = areas.filter((a) => a.parentLocationId === zone.id);
                    return (
                      <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{zone.name}</span>
                            {getStatusBadge(zone.status)}
                          </div>
                          {canEditLoc && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/locations/${zone.id}/edit`)}>
                              Edit
                            </Button>
                          )}
                        </div>
                        {zoneAreas.length > 0 && (
                          <div className="ml-4 mt-2 space-y-1">
                            {zoneAreas.map((area) => (
                              <div key={area.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700">Area: {area.name}</span>
                                  {getStatusBadge(area.status)}
                                </div>
                                {canEditLoc && (
                                  <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/locations/${area.id}/edit`)}>
                                    Edit
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Areas directly under Site */}
            {areas.filter((a) => !a.parentLocationId).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Areas</h4>
                <div className="space-y-2">
                  {areas
                    .filter((a) => !a.parentLocationId)
                    .map((area) => (
                      <div key={area.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{area.name}</span>
                            {getStatusBadge(area.status)}
                          </div>
                          {canEditLoc && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/locations/${area.id}/edit`)}>
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {siteLocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">No locations defined for this site</div>
            )}
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
              {site.history.map((entry) => (
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
              ))}
              {site.history.length === 0 && (
                <div className="text-center py-8 text-gray-500">No activity log entries</div>
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
                <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
                {getStatusBadge(site.status)}
                {site.code && (
                  <span className="text-sm text-gray-500 font-mono">({site.code})</span>
                )}
              </div>
              {site.address && (
                <div className="text-sm text-gray-600">{site.address}</div>
              )}
              {site.siteManagerName && (
                <div className="text-sm text-gray-600 mt-1">Manager: {site.siteManagerName}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/edit`)}>
                Edit Site
              </Button>
            )}
            {canCreateLoc && (
              <Button size="sm" variant="primary" onClick={() => navigate(`/sites/${site.id}/locations/new`)}>
                + Add Location
              </Button>
            )}
            {canArchive && site.status !== 'Archived' && (
              <Button size="sm" variant="outline" onClick={handleArchive}>
                Archive Site
              </Button>
            )}
            {canArchive && site.status === 'Archived' && (
              <Button size="sm" variant="primary" onClick={handleReactivate}>
                Reactivate Site
              </Button>
            )}
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
