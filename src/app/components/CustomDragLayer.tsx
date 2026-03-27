import React from 'react';
import { useDragLayer } from 'react-dnd';
import { ActivityCard } from './ActivityCard';
import { useHoliday } from '../context/HolidayContext';

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(initialOffset: any, currentOffset: any) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export const CustomDragLayer: React.FC = () => {
  const { activities, categories } = useHoliday();
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'activity') {
    return null;
  }

  const activity = activities.find((a) => a.id === item.activityId);
  const category = activity ? categories.find((c) => c.id === activity.categoryId) : null;

  if (!activity || !category) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        <div style={{ width: '150px' }}>
            <ActivityCard
                activity={activity}
                category={category}
                isDraggable={false}
                isBase={true}
                className="opacity-100 shadow-xl scale-105"
            />
        </div>
      </div>
    </div>
  );
};
