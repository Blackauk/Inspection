import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSites } from '../context/SitesContext';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import { Select } from '../../../components/common/Select';
import {
  canCreateSite,
  canEditSite,
  canArchiveSite,
  canCreateLocation,
  canEditLocation,
  canArchiveLocation,
} from '../lib/permissions';
import type { SiteFilter, LocationFilter, SiteStatus, LocationStatus, LocationType } from '../types';

export function SitesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    sites,
    locations,
    sitesWithLocations,
    summary,
    viewMode,
    loading,
    loadSites,
    loadLocations,
    loadSitesWithLocations,
    setViewMode,
  } = useSites();

  const [search, setSearch] = useState('');
  const [siteFilters, setSiteFilters] = useState<SiteFilter>({});
  const [locationFilters, setLocationFilters] = useState<LocationFilter>({});
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSites();
    loadLocations();
    loadSitesWithLocations();
  }, [loadSites, loadLocations, loadSitesWithLocations]);

  const filteredSites = useMemo(() => {
    let filtered = [...sites];

    if (siteFilters.status) {
      filtered = filtered.filter((s) => s.status === siteFilters.status);
    }

    if (siteFilters.code) {
      filtered = filtered.filter((s) => s.code?.toLowerCase().includes(siteFilters.code!.toLowerCase()));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.code?.toLowerCase().includes(searchLower) ||
          s.address?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [sites, siteFilters, search]);

  const filteredLocations = useMemo(() => {
    let filtered = [...locations];

    if (locationFilters.siteId) {
      filtered = filtered.filter((l) => l.siteId === locationFilters.siteId);
    }

    if (locationFilters.type) {
      filtered = filtered.filter((l) => l.type === locationFilters.type);
    }

    if (locationFilters.status) {
      filtered = filtered.filter((l) => l.status === locationFilters.status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((l) => l.name.toLowerCase().includes(searchLower));
    }

    return filtered;
  }, [locations, locationFilters, search]);

  const canCreate = canCreateSite(user?.role);
  const canEdit = canEditSite(user?.role);
  const canArchive = canArchiveSite(user?.role);
  const canCreateLoc = canCreateLocation(user?.role);
  const canEditLoc = canEditLocation(user?.role);
  const canArchiveLoc = canArchiveLocation(user?.role);

  const getStatusBadge = (status: SiteStatus | LocationStatus) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Active: 'success',
      Inactive: 'warning',
      Closed: 'error',
      Archived: 'default',
      Restricted: 'warning',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Tree View Component
  const TreeView = () => (
    <Card>
      <div className="p-6">
        <div className="space-y-4">
          {sitesWithLocations
            .filter((s) => s.status !== 'Archived' || user?.role === 'Admin')
            .map((site) => (
              <div key={site.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.has(site.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedSiteIds);
                        if (e.target.checked) {
                          newSet.add(site.id);
                        } else {
                          newSet.delete(site.id);
                        }
                        setSelectedSiteIds(newSet);
                      }}
                      className="rounded"
                    />
                    <button
                      onClick={() => navigate(`/sites/${site.id}`)}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {site.name}
                    </button>
                    {site.code && (
                      <span className="text-sm text-gray-500 font-mono">({site.code})</span>
                    )}
                    {getStatusBadge(site.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/edit`)}>
                        Edit
                      </Button>
                    )}
                    {canCreateLoc && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/locations/new`)}>
                        + Add Location
                      </Button>
                    )}
                  </div>
                </div>
                {site.address && (
                  <div className="text-sm text-gray-600 mb-2">{site.address}</div>
                )}
                {site.siteManagerName && (
                  <div className="text-sm text-gray-600 mb-2">Manager: {site.siteManagerName}</div>
                )}

                {/* Zones */}
                {site.zones.length > 0 && (
                  <div className="ml-6 mt-3 space-y-2">
                    {site.zones.map((zone) => {
                      const zoneAreas = site.areas.filter((a) => a.parentLocationId === zone.id);
                      return (
                        <div key={zone.id} className="border-l-2 border-blue-300 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedLocationIds.has(zone.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedLocationIds);
                                  if (e.target.checked) {
                                    newSet.add(zone.id);
                                  } else {
                                    newSet.delete(zone.id);
                                  }
                                  setSelectedLocationIds(newSet);
                                }}
                                className="rounded"
                              />
                              <span className="font-medium text-gray-900">Zone: {zone.name}</span>
                              {getStatusBadge(zone.status)}
                            </div>
                            {canEditLoc && (
                              <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/locations/${zone.id}/edit`)}>
                                Edit
                              </Button>
                            )}
                          </div>
                          {/* Areas under Zone */}
                          {zoneAreas.length > 0 && (
                            <div className="ml-4 mt-2 space-y-1">
                              {zoneAreas.map((area) => (
                                <div key={area.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedLocationIds.has(area.id)}
                                      onChange={(e) => {
                                        const newSet = new Set(selectedLocationIds);
                                        if (e.target.checked) {
                                          newSet.add(area.id);
                                        } else {
                                          newSet.delete(area.id);
                                        }
                                        setSelectedLocationIds(newSet);
                                      }}
                                      className="rounded"
                                    />
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
                )}

                {/* Areas directly under Site (no Zone) */}
                {site.areas.filter((a) => !a.parentLocationId).length > 0 && (
                  <div className="ml-6 mt-3 space-y-2">
                    {site.areas
                      .filter((a) => !a.parentLocationId)
                      .map((area) => (
                        <div key={area.id} className="flex items-center justify-between text-sm border-l-2 border-green-300 pl-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedLocationIds.has(area.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedLocationIds);
                                if (e.target.checked) {
                                  newSet.add(area.id);
                                } else {
                                  newSet.delete(area.id);
                                }
                                setSelectedLocationIds(newSet);
                              }}
                              className="rounded"
                            />
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
            ))}
        </div>
      </div>
    </Card>
  );

  // Table View Component
  const TableView = () => (
    <div className="space-y-6">
      {/* Sites Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sites</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <input
                    type="checkbox"
                    checked={selectedSiteIds.size === filteredSites.length && filteredSites.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSiteIds(new Set(filteredSites.map((s) => s.id)));
                      } else {
                        setSelectedSiteIds(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Site Name</TableHeaderCell>
                <TableHeaderCell>Code</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Address</TableHeaderCell>
                <TableHeaderCell>Manager</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.has(site.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedSiteIds);
                        if (e.target.checked) {
                          newSet.add(site.id);
                        } else {
                          newSet.delete(site.id);
                        }
                        setSelectedSiteIds(newSet);
                      }}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => navigate(`/sites/${site.id}`)}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {site.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    {site.code ? (
                      <span className="font-mono text-sm">{site.code}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(site.status)}</TableCell>
                  <TableCell>
                    {site.address ? (
                      <span className="text-sm">{site.address}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {site.siteManagerName || <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${site.id}/edit`)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Locations Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.size === filteredLocations.length && filteredLocations.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLocationIds(new Set(filteredLocations.map((l) => l.id)));
                      } else {
                        setSelectedLocationIds(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Parent</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredLocations.map((location) => {
                const site = sites.find((s) => s.id === location.siteId);
                const parent = location.parentLocationId
                  ? locations.find((l) => l.id === location.parentLocationId)
                  : null;
                return (
                  <TableRow key={location.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedLocationIds.has(location.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedLocationIds);
                          if (e.target.checked) {
                            newSet.add(location.id);
                          } else {
                            newSet.delete(location.id);
                          }
                          setSelectedLocationIds(newSet);
                        }}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{location.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{location.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/sites/${location.siteId}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                      >
                        {site?.name || location.siteId}
                      </button>
                    </TableCell>
                    <TableCell>
                      {parent ? (
                        <span className="text-sm">{parent.name}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(location.status)}</TableCell>
                    <TableCell>
                      {canEditLoc && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/sites/${location.siteId}/locations/${location.id}/edit`)}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Command Bar */}
      <div className="flex items-center justify-end gap-2">
        <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Tree
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Table
          </button>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/sites/new')}>
            + New Site
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Sites</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Active Sites</div>
            <div className="text-2xl font-bold text-green-600">{summary.active}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Locations with Open Defects</div>
            <div className="text-2xl font-bold text-red-600">{summary.locationsWithOpenDefects}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-1">Locations with Overdue WOs</div>
            <div className="text-2xl font-bold text-orange-600">{summary.locationsWithOverdueWorkOrders}</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-6 space-y-4">
          <Input
            placeholder="Search by site name, code, address, or location name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Site Status"
              value={siteFilters.status || ''}
              onChange={(e) => setSiteFilters({ ...siteFilters, status: e.target.value as SiteStatus || undefined })}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />

            <Select
              label="Location Type"
              value={locationFilters.type || ''}
              onChange={(e) => setLocationFilters({ ...locationFilters, type: e.target.value as LocationType || undefined })}
              options={[
                { value: '', label: 'All Types' },
                { value: 'Zone', label: 'Zone' },
                { value: 'Area', label: 'Area' },
              ]}
            />

            <Select
              label="Location Status"
              value={locationFilters.status || ''}
              onChange={(e) => setLocationFilters({ ...locationFilters, status: e.target.value as LocationStatus || undefined })}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Restricted', label: 'Restricted' },
                { value: 'Closed', label: 'Closed' },
              ]}
            />

            <Select
              label="Site"
              value={locationFilters.siteId || ''}
              onChange={(e) => setLocationFilters({ ...locationFilters, siteId: e.target.value || undefined })}
              options={[
                { value: '', label: 'All Sites' },
                ...sites.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          {/* Bulk Actions */}
          {(selectedSiteIds.size > 0 || selectedLocationIds.size > 0) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedSiteIds.size} site(s) and {selectedLocationIds.size} location(s) selected
              </span>
              {canArchive && selectedSiteIds.size > 0 && (
                <Button size="sm" variant="outline">
                  Bulk Archive Sites
                </Button>
              )}
              {canArchiveLoc && selectedLocationIds.size > 0 && (
                <Button size="sm" variant="outline">
                  Bulk Archive Locations
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Card>
          <div className="p-8 text-center text-gray-500">Loading sites and locations...</div>
        </Card>
      ) : viewMode === 'tree' ? (
        <TreeView />
      ) : (
        <TableView />
      )}

      {!loading && filteredSites.length === 0 && (
        <Card>
          <div className="p-8 text-center text-gray-500">No sites found matching your criteria</div>
        </Card>
      )}
    </div>
  );
}
