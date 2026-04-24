import React from 'react';
import { useDrop } from 'react-dnd';
import { useHoliday } from '../context/HolidayContext';
import { ActivityCard } from './ActivityCard';
import { TimeSlot } from '../types';

interface TimeSlotDropZoneProps {
  date: string;
  slot: TimeSlot;
  label?: string;
  slotSize?: number;
  resizeDirection?: 'vertical' | 'horizontal';
  className?: string;
  hideActivities?: boolean;
}

export function TimeSlotDropZone({ 
  date, 
  slot, 
  label, 
  slotSize = 100,
  resizeDirection = 'vertical',
  className = '',
  hideActivities = false,
}: TimeSlotDropZoneProps) {
  const { getActivitiesForSlot, categories, moveActivity, updateActivity } = useHoliday();
  const activities = getActivitiesForSlot(date, slot);

  const [{ isOver, canDrop, isDragging }, drop] = useDrop(
    () => ({
      accept: 'activity',
      drop: (item: { activityId: string }) => {
        const position = activities.length;
        moveActivity(item.activityId, date, slot, position);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        isDragging: !!monitor.getItem(), // Check if any item is being dragged
      }),
    }),
    [date, slot, activities.length, moveActivity]
  );

  const handleUnassign = (activityId: string) => {
    moveActivity(activityId, null, null);
  };

  const handleResize = (activityId: string, duration: number) => {
    updateActivity(activityId, { duration });
  };

  const timeSlotOrder: TimeSlot[] = ['morning', 'afternoon', 'night'];

  return (
    <div
      ref={drop}
      data-testid="drop-zone"
      className={`
        min-h-[80px] p-2 rounded-lg transition-all w-full relative overflow-visible
        ${isOver ? 'border-2 border-dashed border-blue-500 bg-blue-50' : (canDrop ? 'border-2 border-dashed border-gray-300 bg-gray-50' : 'border-2 border-transparent')}
        ${className}
      `}
    >
      {label && (
        <div className="text-xs font-medium text-gray-500 mb-2">{label}</div>
      )}

      {!hideActivities && (
        <div
          className={`gap-2 flex flex-col ${isDragging ? 'pointer-events-none' : ''}`}
        >
          <div className={isDragging ? 'pointer-events-auto' : ''}>
            {activities.map((activity, index) => {
              const category = categories.find(c => c.id === activity.categoryId);
              if (!category) return null;

              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  category={category}
                  onDelete={activity.isBase ? () => handleUnassign(activity.id) : undefined}
                  onResize={activity.isBase ? (duration) => handleResize(activity.id, duration) : undefined}
                  isResizable={activity.isBase}
                  resizeDirection={resizeDirection}
                  slotSize={slotSize}
                  index={index}
                  className={!activity.isBase ? 'opacity-75 border-dotted' : ''}
                />
              );
            })}
          </div>
          
          {isOver && canDrop && (
            <div className="h-12 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-lg mb-2 animate-pulse flex items-center justify-center">
              <span className="text-blue-400 text-xs font-medium">Drop here</span>
            </div>
          )}
        </div>
      )}

      {activities.length === 0 && canDrop && !isOver && (
        <div className="py-4" />
      )}
    </div>
  );
}