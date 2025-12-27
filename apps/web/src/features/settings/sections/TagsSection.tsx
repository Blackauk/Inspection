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
  loadTags, 
  saveTags,
  type Tag 
} from '../mock/settingsData';
import { useAuth } from '../../../contexts/AuthContext';

export function TagsSection() {
  const { user: currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagForm, setTagForm] = useState<Partial<Tag>>({});
  const [search, setSearch] = useState('');

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // Safe initialization with error handling
  useEffect(() => {
    try {
      const loaded = loadTags();
      setTags(loaded);
      setError(null);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags. Please try again.');
      setTags([]);
    }
  }, []);

  const filteredTags = useMemo(() => {
    if (!search) return tags;
    const searchLower = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(searchLower));
  }, [tags, search]);

  const handleAdd = () => {
    setTagForm({ name: '', color: '#3b82f6', status: 'Active' });
    setSelectedTag(null);
    setShowModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setTagForm({ ...tag });
    setSelectedTag(tag);
    setShowModal(true);
  };

  const handleSave = () => {
    try {
      if (!tagForm.name) {
        showToast('Please fill in the tag name', 'error');
        return;
      }

      if (selectedTag) {
        setTags(prev => {
          const updated = prev.map(t => t.id === selectedTag.id ? { 
            ...tagForm, 
            id: selectedTag.id,
            status: (tagForm.status || 'Active') as Tag['status']
          } as Tag : t);
          saveTags(updated);
          return updated;
        });
        showToast('Tag updated successfully', 'success');
      } else {
        const newTag: Tag = {
          id: `tag-${Date.now()}`,
          name: tagForm.name!,
          color: tagForm.color || '#3b82f6',
          status: tagForm.status || 'Active',
        };
        setTags(prev => {
          const updated = [...prev, newTag];
          saveTags(updated);
          return updated;
        });
        showToast('Tag created successfully', 'success');
      }
      
      setShowModal(false);
      setTagForm({});
      setSelectedTag(null);
      setError(null);
    } catch (err) {
      console.error('Failed to save tag:', err);
      showToast('Failed to save tag. Please try again.', 'error');
      setError('Failed to save tag. Please try again.');
    }
  };

  const handleDeactivate = (tag: Tag) => {
    try {
      setTags(prev => {
        const updated = prev.map(t =>
          t.id === tag.id
            ? { ...t, status: (t.status === 'Active' ? 'Inactive' : 'Active') as Tag['status'] }
            : t
        );
        saveTags(updated);
        return updated;
      });
      showToast(`Tag ${tag.status === 'Active' ? 'deactivated' : 'activated'} successfully`, 'success');
      setError(null);
    } catch (err) {
      console.error('Failed to update tag:', err);
      showToast('Failed to update tag. Please try again.', 'error');
      setError('Failed to update tag. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    try {
      const loaded = loadTags();
      setTags(loaded);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags. Please try again.');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tag Name',
      sortable: true,
      render: (_: any, row: Tag) => (
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
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: Tag) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      sortable: true,
      render: (_: any, row: Tag) => (
        <div className="text-sm text-gray-600">{row.usageCount || 0}</div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_: any, row: Tag) => (
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
  if (error && tags.length === 0) {
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
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        )}
      </div>

      <Card>
        <div className="p-6">
          {filteredTags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tags found
            </div>
          ) : (
            <SortableTable
              columns={columns}
              data={filteredTags}
            />
          )}
        </div>
      </Card>

      {/* Add/Edit Tag Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTagForm({});
          setSelectedTag(null);
        }}
        title={selectedTag ? 'Edit Tag' : 'Add Tag'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tag Name"
            value={tagForm.name || ''}
            onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={tagForm.color || '#3b82f6'}
                onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 rounded border border-gray-300"
              />
              <Input
                value={tagForm.color || '#3b82f6'}
                onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          
          <Select
            label="Status"
            value={tagForm.status || 'Active'}
            onChange={(e) => setTagForm(prev => ({ ...prev, status: e.target.value as Tag['status'] }))}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {selectedTag ? 'Update Tag' : 'Create Tag'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setTagForm({});
                setSelectedTag(null);
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


