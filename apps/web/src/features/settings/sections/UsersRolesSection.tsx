import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { SortableTable } from '../../../components/common/SortableTable';
import { Tabs } from '../../../components/common/Tabs';
import { showToast } from '../../../components/common/Toast';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { 
  loadUsers, 
  saveUsers, 
  loadRoles, 
  saveRoles, 
  loadSites,
  type User, 
  type Role 
} from '../mock/settingsData';
import { useAuth } from '../../../contexts/AuthContext';

export function UsersRolesSection() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(loadUsers());
  const [roles, setRoles] = useState(loadRoles());
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const sites = loadSites();

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.firstName.toLowerCase().includes(searchLower) ||
        u.lastName.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterRole) {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus) {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    
    return filtered;
  }, [users, search, filterRole, filterStatus]);

  const handleAddUser = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Fitter',
      status: 'Active',
      siteIds: [],
    });
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setUserForm({ ...user });
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userForm.firstName || !userForm.lastName || !userForm.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (selectedUser) {
      // Update existing
      setUsers(prev => {
        const updated = prev.map(u => u.id === selectedUser.id ? { ...userForm, id: selectedUser.id } as User : u);
        saveUsers(updated);
        return updated;
      });
      showToast('User updated successfully', 'success');
    } else {
      // Create new
      const newUser: User = {
        id: `user-${Date.now()}`,
        firstName: userForm.firstName!,
        lastName: userForm.lastName!,
        email: userForm.email!,
        role: userForm.role || 'Fitter',
        status: userForm.status || 'Active',
        siteIds: userForm.siteIds || [],
      };
      setUsers(prev => {
        const updated = [...prev, newUser];
        saveUsers(updated);
        return updated;
      });
      showToast('User created successfully', 'success');
    }
    
    setShowUserModal(false);
    setUserForm({});
    setSelectedUser(null);
  };

  const handleDisableUser = (user: User) => {
    setSelectedUser(user);
    setShowDisableModal(true);
  };

  const confirmDisableUser = () => {
    if (!selectedUser) return;
    
    setUsers(prev => {
      const updated = prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' }
          : u
      );
      saveUsers(updated);
      return updated;
    });
    
    showToast(`User ${selectedUser.status === 'Active' ? 'disabled' : 'enabled'} successfully`, 'success');
    setShowDisableModal(false);
    setSelectedUser(null);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    
    setRoles(prev => {
      const updated = prev.map(r => r.id === selectedRole.id ? selectedRole : r);
      saveRoles(updated);
      return updated;
    });
    
    showToast('Role permissions updated successfully', 'success');
    setShowRoleModal(false);
    setSelectedRole(null);
  };

  const userColumns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_: any, row: User) => (
        <div>
          <div className="font-medium text-gray-900">{row.firstName} {row.lastName}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (_: any, row: User) => (
        <Badge variant="default">{row.role}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: User) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'sites',
      label: 'Sites',
      sortable: false,
      render: (_: any, row: User) => (
        <div className="text-sm text-gray-600">
          {row.siteIds.length > 0
            ? row.siteIds.map(id => sites.find(s => s.id === id)?.name).filter(Boolean).join(', ')
            : '—'}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (_: any, row: User) => (
        <div className="text-sm text-gray-600">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditUser(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDisableUser(row)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title={row.status === 'Active' ? 'Disable' : 'Enable'}
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const roleColumns = [
    {
      key: 'name',
      label: 'Role',
      sortable: true,
      render: (_: any, row: Role) => (
        <div className="font-medium text-gray-900">{row.name}</div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: false,
      render: (_: any, row: Role) => {
        const moduleCount = Object.keys(row.permissions).length;
        const totalPermissions = Object.values(row.permissions).reduce((sum, mod) => sum + Object.keys(mod).length, 0);
        return (
          <div className="text-sm text-gray-600">
            {moduleCount} modules, {totalPermissions} permissions
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Role) => (
        <button
          onClick={() => handleEditRole(row)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="Edit Permissions"
        >
          <Edit className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const canEdit = currentUser?.role === 'Admin';

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          {
            id: 'users',
            label: 'Users',
            content: (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    options={[
                      { value: '', label: 'All Roles' },
                      { value: 'Admin', label: 'Admin' },
                      { value: 'Manager', label: 'Manager' },
                      { value: 'Supervisor', label: 'Supervisor' },
                      { value: 'Fitter', label: 'Fitter' },
                      { value: 'Viewer', label: 'Viewer' },
                    ]}
                    className="w-40"
                  />
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'Active', label: 'Active' },
                      { value: 'Disabled', label: 'Disabled' },
                    ]}
                    className="w-40"
                  />
                  {canEdit && (
                    <Button onClick={handleAddUser}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  )}
                </div>

                <Card>
                  <div className="p-6">
                    <SortableTable
                      columns={userColumns}
                      data={filteredUsers}
                    />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            id: 'roles',
            label: 'Roles & Permissions',
            content: (
              <div className="mt-4 space-y-4">
                <Card>
                  <div className="p-6">
                    <SortableTable
                      columns={roleColumns}
                      data={roles}
                    />
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
        defaultTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      />

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setUserForm({});
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Edit User' : 'Add User'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={userForm.firstName || ''}
              onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={userForm.lastName || ''}
              onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
          
          <Input
            label="Email"
            type="email"
            value={userForm.email || ''}
            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          
          <Select
            label="Role"
            value={userForm.role || 'Fitter'}
            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as User['role'] }))}
            options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Manager', label: 'Manager' },
              { value: 'Supervisor', label: 'Supervisor' },
              { value: 'Fitter', label: 'Fitter' },
              { value: 'Viewer', label: 'Viewer' },
            ]}
          />
          
          <Select
            label="Status"
            value={userForm.status || 'Active'}
            onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value as User['status'] }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Disabled', label: 'Disabled' },
            ]}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Sites
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {sites.filter(s => s.status === 'Active').map(site => (
                <label key={site.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userForm.siteIds?.includes(site.id) || false}
                    onChange={(e) => {
                      const currentIds = userForm.siteIds || [];
                      const newIds = e.target.checked
                        ? [...currentIds, site.id]
                        : currentIds.filter(id => id !== site.id);
                      setUserForm(prev => ({ ...prev, siteIds: newIds }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{site.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSaveUser} className="flex-1">
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowUserModal(false);
                setUserForm({});
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable User Confirmation Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setSelectedUser(null);
        }}
        title={selectedUser?.status === 'Active' ? 'Disable User' : 'Enable User'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to {selectedUser?.status === 'Active' ? 'disable' : 'enable'}{' '}
            <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
          </p>
          <div className="flex gap-2 pt-4">
            <Button variant="primary" onClick={confirmDisableUser} className="flex-1">
              Confirm
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Permissions Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
        title={`Edit Permissions: ${selectedRole?.name}`}
        size="xl"
      >
        {selectedRole && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-gray-700">Module</th>
                    <th className="text-center p-2 font-semibold text-gray-700">View</th>
                    <th className="text-center p-2 font-semibold text-gray-700">Create</th>
                    <th className="text-center p-2 font-semibold text-gray-700">Edit</th>
                    <th className="text-center p-2 font-semibold text-gray-700">Delete/Close</th>
                    <th className="text-center p-2 font-semibold text-gray-700">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedRole.permissions).map(([module, actions]) => (
                    <tr key={module} className="border-b">
                      <td className="p-2 font-medium text-gray-900">{module}</td>
                      {['View', 'Create', 'Edit', 'Delete', 'Close', 'Export'].map(action => {
                        const actionKey = action === 'Delete' || action === 'Close' 
                          ? (module === 'Inspections' || module === 'Defects' || module === 'WorkOrders' ? 'Close' : 'Delete')
                          : action;
                        const hasPermission = actions[actionKey] || false;
                        return (
                          <td key={action} className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={(e) => {
                                const updatedRole = {
                                  ...selectedRole,
                                  permissions: {
                                    ...selectedRole.permissions,
                                    [module]: {
                                      ...actions,
                                      [actionKey]: e.target.checked,
                                    },
                                  },
                                };
                                setSelectedRole(updatedRole);
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="primary" onClick={handleSaveRole} className="flex-1">
                Save Permissions
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


