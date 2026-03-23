import React, { useState } from 'react';
import { useHoliday } from '../context/HolidayContext';
import { ActivityCard } from './ActivityCard';
import { Plus } from 'lucide-react';
import { useDrop } from 'react-dnd';

export function ActivityPool() {
  const { getUnassignedActivities, categories, addActivity, deleteActivity, reorderActivities, moveActivity } = useHoliday();
  const [showForm, setShowForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');

  const unassignedActivities = getUnassignedActivities();

  const [{ isOverContainer }, dropContainer] = useDrop(() => ({
    accept: 'activity',
    drop: (item: { activityId: string, index?: number }, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      
      moveActivity(item.activityId, null, null, 0);
    },
    collect: (monitor) => ({
      isOverContainer: !!monitor.isOver({ shallow: true }),
    }),
  }), [moveActivity]);

  const handleReorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    
    const draggedIndex = unassignedActivities.findIndex(a => a.id === draggedId);
    const targetIndex = unassignedActivities.findIndex(a => a.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...unassignedActivities];
    const [draggedActivity] = newOrder.splice(draggedIndex, 1);
    
    // If moving down, the removal of the item at draggedIndex shifts the targetIndex back by 1
    const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newOrder.splice(adjustedTargetIndex, 0, draggedActivity);
    
    reorderActivities(newOrder.map(a => a.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivityName.trim() && selectedCategoryId) {
      addActivity(newActivityName.trim(), selectedCategoryId);
      setNewActivityName('');
      // setShowForm(false); // Keep the form open for consecutive additions
    }
  };

  return (
    <div 
      ref={dropContainer}
      className={`bg-white rounded-lg shadow-lg p-4 h-full flex flex-col transition-colors ${isOverContainer ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">Activity Pool</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          aria-label="Add activity"
          className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-2 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="Activity name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {unassignedActivities.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No unassigned activities.<br />Click + to add one.
          </div>
        ) : (
          unassignedActivities.map((activity) => (
            <ActivityPoolItem
              key={activity.id}
              activity={activity}
              category={categories.find(c => c.id === activity.categoryId)!}
              onDelete={() => deleteActivity(activity.id)}
              onReorder={handleReorder}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ActivityPoolItemProps {
  activity: any;
  category: any;
  onDelete: () => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

function ActivityPoolItem({ activity, category, onDelete, onReorder }: ActivityPoolItemProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'activity',
    drop: (item: { activityId: string }) => {
      onReorder(item.activityId, activity.id);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [activity.id, onReorder]);

  return (
    <div 
      ref={drop}
      className={`transition-all ${isOver ? 'border-t-4 border-blue-500 pt-2' : ''}`}
    >
      <ActivityCard
        activity={activity}
        category={category}
        onDelete={onDelete}
      />
    </div>
  );
}
