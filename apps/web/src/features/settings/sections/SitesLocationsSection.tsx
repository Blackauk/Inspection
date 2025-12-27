import { useState, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { SortableTable } from '../../../components/common/SortableTable';
import { Tabs } from '../../../components/common/Tabs';
import { showToast } from '../../../components/common/Toast';
import { Plus, Edit, Archive, FolderTree } from 'lucide-react';
import { 
  loadSites, 
  saveSites, 
  loadLocations, 
  saveLocations,
  loadUsers,
  type Site, 
  type Location 
} from '../mock/settingsData';
import { useAuth } from '../../../contexts/AuthContext';

export function SitesLocationsSection() {
  const { user: currentUser } = useAuth();
  const [sites, setSites] = useState(loadSites());
  const [locations, setLocations] = useState(loadLocations());
  const [activeTab, setActiveTab] = useState<'sites' | 'locations'>('sites');
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [siteForm, setSiteForm] = useState<Partial<Site>>({});
  const [locationForm, setLocationForm] = useState<Partial<Location>>({});
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState<string>('');
  const users = loadUsers();

  const filteredSites = useMemo(() => {
    let filtered = [...sites];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.address.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [sites, search]);

  const filteredLocations = useMemo(() => {
    let filtered = [...locations];
    if (filterSite) {
      filtered = filtered.filter(l => l.siteId === filterSite);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(l => l.name.toLowerCase().includes(searchLower));
    }
    return filtered;
  }, [locations, search, filterSite]);

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const handleAddSite = () => {
    setSiteForm({ name: '', address: '', status: 'Active' });
    setSelectedSite(null);
    setShowSiteModal(true);
  };

  const handleEditSite = (site: Site) => {
    setSiteForm({ ...site });
    setSelectedSite(site);
    setShowSiteModal(true);
  };

  const handleSaveSite = () => {
    if (!siteForm.name || !siteForm.address) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (selectedSite) {
      setSites(prev => {
        const updated = prev.map(s => s.id === selectedSite.id ? { ...siteForm, id: selectedSite.id } as Site : s);
        saveSites(updated);
        return updated;
      });
      showToast('Site updated successfully', 'success');
    } else {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        name: siteForm.name!,
        address: siteForm.address!,
        status: siteForm.status || 'Active',
        managerId: siteForm.managerId,
        managerName: siteForm.managerId ? users.find(u => u.id === siteForm.managerId)?.firstName + ' ' + users.find(u => u.id === siteForm.managerId)?.lastName : undefined,
      };
      setSites(prev => {
        const updated = [...prev, newSite];
        saveSites(updated);
        return updated;
      });
      showToast('Site created successfully', 'success');
    }
    
    setShowSiteModal(false);
    setSiteForm({});
    setSelectedSite(null);
  };

  const handleArchiveSite = (site: Site) => {
    setSelectedSite(site);
    setShowArchiveModal(true);
  };

  const confirmArchiveSite = () => {
    if (!selectedSite) return;
    
    setSites(prev => {
      const updated = prev.map(s =>
        s.id === selectedSite.id
          ? { ...s, status: s.status === 'Active' ? 'Archived' : 'Active' }
          : s
      );
      saveSites(updated);
      return updated;
    });
    
    showToast(`Site ${selectedSite.status === 'Active' ? 'archived' : 'restored'} successfully`, 'success');
    setShowArchiveModal(false);
    setSelectedSite(null);
  };

  const handleAddLocation = () => {
    setLocationForm({ name: '', siteId: filterSite || sites[0]?.id || '', type: 'Zone', status: 'Active' });
    setSelectedLocation(null);
    setShowLocationModal(true);
  };

  const handleEditLocation = (location: Location) => {
    setLocationForm({ ...location });
    setSelectedLocation(location);
    setShowLocationModal(true);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name || !locationForm.siteId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (selectedLocation) {
      setLocations(prev => {
        const updated = prev.map(l => l.id === selectedLocation.id ? { ...locationForm, id: selectedLocation.id } as Location : l);
        saveLocations(updated);
        return updated;
      });
      showToast('Location updated successfully', 'success');
    } else {
      const newLocation: Location = {
        id: `loc-${Date.now()}`,
        name: locationForm.name!,
        siteId: locationForm.siteId!,
        parentLocationId: locationForm.parentLocationId,
        type: locationForm.type || 'Zone',
        status: locationForm.status || 'Active',
      };
      setLocations(prev => {
        const updated = [...prev, newLocation];
        saveLocations(updated);
        return updated;
      });
      showToast('Location created successfully', 'success');
    }
    
    setShowLocationModal(false);
    setLocationForm({});
    setSelectedLocation(null);
  };

  const getLocationHierarchy = () => {
    const hierarchy: Array<Location & { level: number; path: string }> = [];
    const processed = new Set<string>();

    const addLocation = (loc: Location, level: number = 0, path: string = '') => {
      if (processed.has(loc.id)) return;
      processed.add(loc.id);
      hierarchy.push({ ...loc, level, path: path ? `${path} > ${loc.name}` : loc.name });
      
      locations
        .filter(l => l.parentLocationId === loc.id)
        .forEach(child => addLocation(child, level + 1, path ? `${path} > ${loc.name}` : loc.name));
    };

    locations
      .filter(l => !l.parentLocationId)
      .forEach(root => addLocation(root));

    return hierarchy;
  };

  const siteColumns = [
    {
      key: 'name',
      label: 'Site Name',
      sortable: true,
      render: (_: any, row: Site) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.address}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Site) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'manager',
      label: 'Manager',
      sortable: true,
      render: (_: any, row: Site) => (
        <div className="text-sm text-gray-600">{row.managerName || '—'}</div>
      ),
    },
    {
      key: 'assets',
      label: 'Assets',
      sortable: true,
      render: (_: any, row: Site) => (
        <div className="text-sm text-gray-600">{row.assetCount || 0}</div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Site) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => handleEditSite(row)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleArchiveSite(row)}
                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const locationColumns = [
    {
      key: 'name',
      label: 'Location',
      sortable: true,
      render: (_: any, row: Location & { level?: number; path?: string }) => (
        <div className="flex items-center gap-2">
          <div style={{ marginLeft: (row.level || 0) * 20 }}>
            <div className="font-medium text-gray-900">{row.name}</div>
            {row.path && row.path !== row.name && (
              <div className="text-xs text-gray-500">{row.path}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'site',
      label: 'Site',
      sortable: true,
      render: (_: any, row: Location) => {
        const site = sites.find(s => s.id === row.siteId);
        return <div className="text-sm text-gray-600">{site?.name || row.siteId}</div>;
      },
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (_: any, row: Location) => (
        <Badge variant="default">{row.type}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Location) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Location) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => handleEditLocation(row)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          {
            id: 'sites',
            label: 'Sites',
            content: (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search sites..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {canEdit && (
                    <Button onClick={handleAddSite}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Site
                    </Button>
                  )}
                </div>

                <Card>
                  <div className="p-6">
                    <SortableTable
                      columns={siteColumns}
                      data={filteredSites}
                    />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            id: 'locations',
            label: 'Locations',
            content: (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search locations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                    options={[
                      { value: '', label: 'All Sites' },
                      ...sites.filter(s => s.status === 'Active').map(site => ({ value: site.id, label: site.name })),
                    ]}
                    className="w-48"
                  />
                  {canEdit && (
                    <Button onClick={handleAddLocation} disabled={!filterSite && sites.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  )}
                </div>

                <Card>
                  <div className="p-6">
                    <SortableTable
                      columns={locationColumns}
                      data={getLocationHierarchy()}
                    />
                  </div>
                </Card>

                {canEdit && (
                  <Card>
                    <div className="p-6">
                      <Button variant="outline" disabled>
                        Bulk Import (Coming Soon)
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Import locations from Excel file (feature coming soon)
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            ),
          },
        ]}
        defaultTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      />

      {/* Add/Edit Site Modal */}
      <Modal
        isOpen={showSiteModal}
        onClose={() => {
          setShowSiteModal(false);
          setSiteForm({});
          setSelectedSite(null);
        }}
        title={selectedSite ? 'Edit Site' : 'Add Site'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Site Name"
            value={siteForm.name || ''}
            onChange={(e) => setSiteForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <Input
            label="Address"
            value={siteForm.address || ''}
            onChange={(e) => setSiteForm(prev => ({ ...prev, address: e.target.value }))}
            required
          />
          
          <Select
            label="Manager"
            value={siteForm.managerId || ''}
            onChange={(e) => setSiteForm(prev => ({ ...prev, managerId: e.target.value || undefined }))}
            options={[
              { value: '', label: 'No Manager' },
              ...users.filter(u => u.status === 'Active').map(user => ({
                value: user.id,
                label: `${user.firstName} ${user.lastName}`,
              })),
            ]}
          />
          
          <Select
            label="Status"
            value={siteForm.status || 'Active'}
            onChange={(e) => setSiteForm(prev => ({ ...prev, status: e.target.value as Site['status'] }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Archived', label: 'Archived' },
            ]}
          />
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSaveSite} className="flex-1">
              {selectedSite ? 'Update Site' : 'Create Site'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSiteModal(false);
                setSiteForm({});
                setSelectedSite(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setLocationForm({});
          setSelectedLocation(null);
        }}
        title={selectedLocation ? 'Edit Location' : 'Add Location'}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Site"
            value={locationForm.siteId || ''}
            onChange={(e) => setLocationForm(prev => ({ ...prev, siteId: e.target.value }))}
            options={sites.filter(s => s.status === 'Active').map(site => ({ value: site.id, label: site.name }))}
            required
          />
          
          <Input
            label="Location Name"
            value={locationForm.name || ''}
            onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <Select
            label="Type"
            value={locationForm.type || 'Zone'}
            onChange={(e) => setLocationForm(prev => ({ ...prev, type: e.target.value as Location['type'] }))}
            options={[
              { value: 'Zone', label: 'Zone' },
              { value: 'Area', label: 'Area' },
              { value: 'Bin', label: 'Bin' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          
          <Select
            label="Parent Location (optional)"
            value={locationForm.parentLocationId || ''}
            onChange={(e) => setLocationForm(prev => ({ ...prev, parentLocationId: e.target.value || undefined }))}
            options={[
              { value: '', label: 'None (Top Level)' },
              ...locations
                .filter(l => l.siteId === locationForm.siteId && l.id !== selectedLocation?.id && l.status === 'Active')
                .map(loc => ({ value: loc.id, label: loc.name })),
            ]}
          />
          
          <Select
            label="Status"
            value={locationForm.status || 'Active'}
            onChange={(e) => setLocationForm(prev => ({ ...prev, status: e.target.value as Location['status'] }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Archived', label: 'Archived' },
            ]}
          />
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSaveLocation} className="flex-1">
              {selectedLocation ? 'Update Location' : 'Create Location'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowLocationModal(false);
                setLocationForm({});
                setSelectedLocation(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Site Confirmation Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setSelectedSite(null);
        }}
        title={selectedSite?.status === 'Active' ? 'Archive Site' : 'Restore Site'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to {selectedSite?.status === 'Active' ? 'archive' : 'restore'}{' '}
            <strong>{selectedSite?.name}</strong>?
          </p>
          <div className="flex gap-2 pt-4">
            <Button variant="primary" onClick={confirmArchiveSite} className="flex-1">
              Confirm
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowArchiveModal(false);
                setSelectedSite(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


