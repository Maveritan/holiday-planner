import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Resizable } from 're-resizable';
import ReactMarkdown from 'react-markdown';
import { Activity, Category, TimeSlot } from '../types';
import { ICON_MAP, useHoliday } from '../context/HolidayContext';
import { X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { EditActivityDialog } from './EditActivityDialog';
import { useIsMobile } from './ui/use-mobile';

interface ActivityCardProps {
  activity: Activity;
  category: Category;
  onDelete?: () => void;
  onResize?: (duration: number) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
  isBase?: boolean; // Keep for non-timeline views if they use it for visual distinction
  resizeDirection?: 'vertical' | 'horizontal';
  className?: string;
  slotSize?: number;
  isContinuing?: boolean;
  willContinue?: boolean;
  useGradient?: boolean;
  isContinuingAcrossDay?: boolean;
  willContinueAcrossDay?: boolean;
  index?: number;
  style?: React.CSSProperties;
  showNotes?: boolean;
}

export function ActivityCard({
  activity,
  category,
  onDelete,
  onResize,
  isDraggable = true,
  isResizable = false,
  isBase = true,
  resizeDirection = 'vertical',
  className = '',
  slotSize = 100,
  isContinuing = false,
  willContinue = false,
  useGradient = true,
  isContinuingAcrossDay = false,
  willContinueAcrossDay = false,
  index,
  style,
  showNotes = false,
}: ActivityCardProps) {
  const isMobile = useIsMobile();
  const { moveActivity } = useHoliday();
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'activity',
      item: { activityId: activity.id, index },
      canDrag: isDraggable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [activity.id, isDraggable, index]
  );

  const [, drop] = useDrop({
    accept: 'activity',
    drop: (item: { activityId: string }) => {
      // If we're dropping onto a card, we want to move the activity to the same slot
      if (item.activityId !== activity.id) {
        moveActivity(item.activityId, activity.assignedDate, activity.slot, index);
      }
    },
  }, [activity.id, activity.assignedDate, activity.slot, index, moveActivity]);

  useEffect(() => {
    if (isMobile) {
      preview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [isMobile, preview]);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resizeSize, setResizeSize] = useState<{ width: number | string, height: number | string }>({ width: '100%', height: '100%' });

  const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] as LucideIcon;

  const handleResize = (_e: any, _direction: any, _ref: any, d: { height: number; width: number }) => {
    if (resizeDirection === 'vertical') {
      // Show full slot increments in the preview
      const durationDelta = Math.round(d.height / slotSize);
      setResizeSize({ width: '100%', height: slotSize + durationDelta * slotSize });
    } else if (resizeDirection === 'horizontal') {
      const durationDelta = Math.round(d.width / slotSize);
      setResizeSize({ width: slotSize + durationDelta * slotSize, height: '100%' });
    }
  };

  const handleResizeStop = (_e: any, _direction: any, _ref: any, d: { height: number; width: number }) => {
    setResizeSize({ width: '100%', height: '100%' });
    if (onResize) {
      const delta = resizeDirection === 'vertical' ? d.height : d.width;
      const durationDelta = Math.round(delta / slotSize);
      const newDuration = Math.max(1, activity.duration + durationDelta);
      if (newDuration !== activity.duration) {
        onResize(newDuration);
      }
    }
  };

  const isBaseSlot = (activity: Activity, date: string, slot: TimeSlot) => {
    return activity.assignedDate === date && activity.slot === slot;
  };

  const cardContent = (
    <div
      ref={isDraggable ? (node) => drag(drop(node)) : null}
      onDoubleClick={() => setIsEditDialogOpen(true)}
      className={`
        relative p-2 min-h-[56px] h-full
        shadow-sm border-2 transition-all
        ${isDragging ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${isDraggable ? 'cursor-move select-none' : ''}
        ${isDraggable && !isMobile ? 'active:scale-105 active:shadow-lg active:z-50' : ''}
        ${isContinuing ? (resizeDirection === 'vertical' ? 'rounded-t-none border-t-0' : 'rounded-l-none border-l-0') : (resizeDirection === 'vertical' ? 'rounded-t-lg' : 'rounded-l-lg')}
        ${willContinue ? (resizeDirection === 'vertical' ? 'rounded-b-none border-b-0' : 'rounded-r-none border-r-0') : (resizeDirection === 'vertical' ? 'rounded-b-lg' : 'rounded-r-lg')}
        ${className}
      `}
      style={{
        backgroundColor: category.color + '20',
        borderColor: category.color,
        backgroundImage: (useGradient && willContinueAcrossDay && resizeDirection === 'vertical') ? `linear-gradient(to bottom, ${category.color}20 80%, transparent)` : 
                         (useGradient && isContinuingAcrossDay && resizeDirection === 'vertical') ? `linear-gradient(to top, ${category.color}20 80%, transparent)` : 
                         (useGradient && willContinue && !willContinueAcrossDay && resizeDirection === 'vertical') ? `linear-gradient(to bottom, ${category.color}20, ${category.color}20)` :
                         (useGradient && isContinuing && !isContinuingAcrossDay && resizeDirection === 'vertical') ? `linear-gradient(to top, ${category.color}20, ${category.color}20)` :
                         (useGradient && willContinueAcrossDay && resizeDirection === 'horizontal') ? `linear-gradient(to right, ${category.color}20 80%, transparent)` :
                         (useGradient && isContinuingAcrossDay && resizeDirection === 'horizontal') ? `linear-gradient(to left, ${category.color}20 80%, transparent)` :
                         `linear-gradient(to bottom, ${category.color}20, ${category.color}20)`,
        ...style,
      }}
    >
      {!isContinuing && (
        <div className="pr-6">
          <div className="text-sm font-medium text-gray-900 leading-tight">
            {activity.name}
          </div>
          {showNotes && activity.notes && (
            <div className="text-xs text-gray-600 mt-1 prose prose-xs max-w-none prose-p:leading-tight prose-ul:list-disc prose-ul:ml-4">
              <ReactMarkdown>{activity.notes}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {IconComponent && !willContinue && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditDialogOpen(true);
          }}
          className="absolute bottom-1 right-1 p-1 rounded hover:scale-110 transition-transform shadow-sm"
          style={{ backgroundColor: category.color }}
          title="Edit activity"
        >
          <IconComponent className="w-3 h-3 text-white" />
        </button>
      )}

      {isEditDialogOpen && (
        <EditActivityDialog
          activity={activity}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
        />
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 p-1 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      )}
    </div>
  );

  if (isResizable && onResize) {
    return (
      <Resizable
        size={resizeSize}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        enable={{
          top: false,
          right: resizeDirection === 'horizontal',
          bottom: resizeDirection === 'vertical',
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        minHeight={isResizable && resizeDirection === 'vertical' ? 10 : (resizeDirection === 'vertical' ? slotSize : undefined)}
        minWidth={isResizable && resizeDirection === 'horizontal' ? 10 : (resizeDirection === 'horizontal' ? slotSize : undefined)}
        grid={resizeDirection === 'vertical' ? [1, slotSize] : [slotSize, 1]}
        handleStyles={{
          bottom: resizeDirection === 'vertical' ? {
            cursor: 'ns-resize',
            height: '16px',
            bottom: '-8px',
          } : undefined,
          right: resizeDirection === 'horizontal' ? {
            cursor: 'ew-resize',
            width: '16px',
            right: '-8px',
          } : undefined,
        }}
        handleClasses={{
          bottom: resizeDirection === 'vertical' ? 'hover:bg-blue-500 transition-colors' : '',
          right: resizeDirection === 'horizontal' ? 'hover:bg-blue-500 transition-colors' : '',
        }}
      >
        {cardContent}
      </Resizable>
    );
  }

  return cardContent;
}