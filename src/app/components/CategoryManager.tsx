import React, { useState } from 'react';
import { useHoliday, ICON_MAP } from '../context/HolidayContext';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const AVAILABLE_ICONS = Object.keys(ICON_MAP);
const COLOR_PALETTE = [
  '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B',
  '#10B981', '#06B6D4', '#EF4444', '#F97316',
  '#84CC16', '#14B8A6', '#6366F1', '#A855F7',
];

export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useHoliday();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: COLOR_PALETTE[0],
    icon: AVAILABLE_ICONS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      if (editingId) {
        updateCategory(editingId, formData);
        setEditingId(null);
      } else {
        addCategory(formData.name.trim(), formData.color, formData.icon);
      }
      setFormData({ name: '', color: COLOR_PALETTE[0], icon: AVAILABLE_ICONS[0] });
      setShowForm(false);
    }
  };

  const handleEdit = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', color: COLOR_PALETTE[0], icon: AVAILABLE_ICONS[0] });
  };

  return (
    <div className="bg-white rounded-lg p-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Categories</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Category name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map(iconName => {
                const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] as LucideIcon;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconName })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      formData.icon === iconName
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-2">
        {categories.map(category => {
          const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] as LucideIcon;
          return (
            <div
              key={category.id}
              className="flex items-center gap-2 p-2 rounded-lg border"
              style={{ borderColor: category.color + '40', backgroundColor: category.color + '10' }}
            >
              <div
                className="p-1.5 rounded"
                style={{ backgroundColor: category.color }}
              >
                {IconComponent && <IconComponent className="w-4 h-4 text-white" />}
              </div>
              <span className="flex-1 text-sm font-medium truncate">{category.name}</span>
              <button
                onClick={() => handleEdit(category.id)}
                className="p-1 rounded hover:bg-black/10"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${category.name}"?`)) {
                    deleteCategory(category.id);
                  }
                }}
                className="p-1 rounded hover:bg-black/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
