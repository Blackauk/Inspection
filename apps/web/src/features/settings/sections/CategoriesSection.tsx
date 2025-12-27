import { useState, useMemo, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { SortableTable } from '../../../components/common/SortableTable';
import { showToast } from '../../../components/common/Toast';
import { Plus, Edit, X } from 'lucide-react';
import { 
  loadCategories, 
  saveCategories,
  type Category 
} from '../mock/settingsData';
import { useAuth } from '../../../contexts/AuthContext';

export function CategoriesSection() {
  const { user: currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  const [search, setSearch] = useState('');
  const [filterAppliesTo, setFilterAppliesTo] = useState<string>('');

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // Safe initialization with error handling
  useEffect(() => {
    try {
      const loaded = loadCategories();
      setCategories(loaded);
      setError(null);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Please try again.');
      setCategories([]);
    }
  }, []);

  const filteredCategories = useMemo(() => {
    let filtered = [...categories];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchLower));
    }
    
    if (filterAppliesTo) {
      filtered = filtered.filter(c => c.appliesTo.includes(filterAppliesTo as any));
    }
    
    return filtered;
  }, [categories, search, filterAppliesTo]);

  const handleAdd = () => {
    setCategoryForm({ name: '', appliesTo: [], color: '#3b82f6', status: 'Active' });
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryForm({ ...category });
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleSave = () => {
    try {
      if (!categoryForm.name || !categoryForm.appliesTo || categoryForm.appliesTo.length === 0) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      if (selectedCategory) {
        setCategories(prev => {
          const updated = prev.map(c => c.id === selectedCategory.id ? { 
            ...categoryForm, 
            id: selectedCategory.id,
            status: (categoryForm.status || 'Active') as Category['status']
          } as Category : c);
          saveCategories(updated);
          return updated;
        });
        showToast('Category updated successfully', 'success');
      } else {
        const newCategory: Category = {
          id: `cat-${Date.now()}`,
          name: categoryForm.name!,
          appliesTo: categoryForm.appliesTo!,
          color: categoryForm.color || '#3b82f6',
          status: categoryForm.status || 'Active',
        };
        setCategories(prev => {
          const updated = [...prev, newCategory];
          saveCategories(updated);
          return updated;
        });
        showToast('Category created successfully', 'success');
      }
      
      setShowModal(false);
      setCategoryForm({});
      setSelectedCategory(null);
      setError(null);
    } catch (err) {
      console.error('Failed to save category:', err);
      showToast('Failed to save category. Please try again.', 'error');
      setError('Failed to save category. Please try again.');
    }
  };

  const handleDeactivate = (category: Category) => {
    try {
      setCategories(prev => {
        const updated = prev.map(c =>
          c.id === category.id
            ? { ...c, status: (c.status === 'Active' ? 'Inactive' : 'Active') as Category['status'] }
            : c
        );
        saveCategories(updated);
        return updated;
      });
      showToast(`Category ${category.status === 'Active' ? 'deactivated' : 'activated'} successfully`, 'success');
      setError(null);
    } catch (err) {
      console.error('Failed to update category:', err);
      showToast('Failed to update category. Please try again.', 'error');
      setError('Failed to update category. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    try {
      const loaded = loadCategories();
      setCategories(loaded);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (_: any, row: Category) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: row.color }}
          />
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'appliesTo',
      label: 'Applies To',
      sortable: false,
      render: (_: any, row: Category) => (
        <div className="flex flex-wrap gap-1">
          {row.appliesTo.map(app => (
            <Badge key={app} variant="default" size="sm">{app}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Category) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      sortable: true,
      render: (_: any, row: Category) => (
        <div className="text-sm text-gray-600">{row.usageCount || 0}</div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Category) => (
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeactivate(row)}
                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Error state UI
  if (error && categories.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <Button onClick={handleRetry} variant="primary">
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-yellow-800">{error}</span>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterAppliesTo}
          onChange={(e) => setFilterAppliesTo(e.target.value)}
          options={[
            { value: '', label: 'All Types' },
            { value: 'Assets', label: 'Assets' },
            { value: 'Defects', label: 'Defects' },
            { value: 'Inspections', label: 'Inspections' },
            { value: 'WorkOrders', label: 'Work Orders' },
          ]}
          className="w-40"
        />
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      <Card>
        <div className="p-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          ) : (
            <SortableTable
              columns={columns}
              data={filteredCategories}
            />
          )}
        </div>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCategoryForm({});
          setSelectedCategory(null);
        }}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name || ''}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applies To <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3">
              {['Assets', 'Defects', 'Inspections', 'WorkOrders'].map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.appliesTo?.includes(type as any) || false}
                    onChange={(e) => {
                      const current = categoryForm.appliesTo || [];
                      const newAppliesTo = e.target.checked
                        ? [...current, type as any]
                        : current.filter(t => t !== type);
                      setCategoryForm(prev => ({ ...prev, appliesTo: newAppliesTo }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={categoryForm.color || '#3b82f6'}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 rounded border border-gray-300"
              />
              <Input
                value={categoryForm.color || '#3b82f6'}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          
          <Select
            label="Status"
            value={categoryForm.status || 'Active'}
            onChange={(e) => setCategoryForm(prev => ({ ...prev, status: e.target.value as Category['status'] }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {selectedCategory ? 'Update Category' : 'Create Category'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setCategoryForm({});
                setSelectedCategory(null);
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


