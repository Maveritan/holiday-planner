import React from 'react';
import { useDrop } from 'react-dnd';
import { useHoliday } from '../context/HolidayContext';
import { ActivityCard } from '../components/ActivityCard';
import { TimeSlot } from '../types';

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

const SLOT_HEIGHT = 100;

export function TimelineView() {
  const { dateRange, categories, moveActivity, reorderAssignedActivities, updateActivity, activities, getActivitiesForSlot } = useHoliday();

  const getDatesInRange = () => {
    const dates: string[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  const dates = getDatesInRange();
  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'night'];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Build grid structure
  const rows: { type: 'slot'; date: string; slot: TimeSlot; id: string }[] = [];
  dates.forEach(date => {
    timeSlots.forEach(slot => {
      const rowId = `slot-${date}-${slot}`;
      // Check if ID already exists to prevent duplicates
      if (!rows.find(r => r.id === rowId)) {
        rows.push({ type: 'slot', date, slot, id: rowId });
      }
    });
  });

  const rowMap = new Map(rows.map((row, index) => [row.id, index + 1]));

  const getAssignedActivities = () => {
    return activities.filter(a => a.assignedDate && a.slot);
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div 
          className="grid gap-x-0 relative"
          style={{ 
            gridTemplateColumns: '100px 120px 1fr',
            gridTemplateRows: `repeat(${rows.length}, minmax(${SLOT_HEIGHT}px, auto))`
          }}
        >
          {/* Grid background and labels */}
          {rows.map((row, rowIndex) => {
            const isMorning = row.slot === 'morning';
            const slotActivities = getActivitiesForSlot(row.date, row.slot);

            return (
              <React.Fragment key={row.id}>
                {/* Date label - only shown for morning slot */}
                {isMorning && (
                  <div 
                    key={`date-${row.id}`}
                    className={`flex items-start justify-end pr-4 z-10 border-b-4 border-gray-400`}
                    style={{ 
                      gridRow: `${rowIndex + 1} / span 3`, 
                      gridColumn: 1,
                      minHeight: SLOT_HEIGHT * 3,
                      paddingTop: '12px'
                    }}
                  >
                    <div className="text-right whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                        {new Date(row.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-lg font-black text-gray-900 leading-none">
                        {new Date(row.date).toLocaleDateString('en-US', { day: 'numeric' })}
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase">
                        {new Date(row.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Time slot label - No background/square */}
                <div 
                  key={`time-${row.id}`}
                  className={`flex items-start justify-center z-10`}
                  style={{ gridRow: rowIndex + 1, gridColumn: 2, minHeight: SLOT_HEIGHT, paddingTop: '12px' }}
                >
                  <span className="text-xs font-semibold text-center leading-tight text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                    {TIME_SLOT_LABELS[row.slot]}
                  </span>
                </div>

                {/* Drop zone for this slot - With divider */}
                <div 
                  key={`divider-${row.id}`}
                  className={`border-b h-0 ${row.slot === 'night' ? 'border-gray-400 border-b-4' : 'border-gray-200'}`}
                  style={{ gridRow: rowIndex + 1, gridColumn: '1 / -1', pointerEvents: 'none', alignSelf: 'end', position: 'relative', zIndex: 5 }}
                />
                
                <TimelineDropZone
                  key={`dropzone-${row.id}`}
                  date={row.date}
                  slot={row.slot}
                  rowIndex={rowIndex + 1}
                  moveActivity={moveActivity}
                  reorderAssignedActivities={reorderAssignedActivities}
                  getActivitiesForSlot={getActivitiesForSlot}
                />

                {/* Activity stacking container for this slot */}
                {(() => {
                  return (
                    <div
                      className="z-20 flex flex-col pointer-events-none"
                      style={{
                        gridRow: rowIndex + 1,
                        gridColumn: 3,
                        alignSelf: 'stretch',
                      }}
                    >
                      {slotActivities.map((activity, activityIndex) => {
                        const category = categories.find(c => c.id === activity.categoryId);
                        if (!category) return null;

                        return (
                          <div key={`${activity.id}-${activity.offset}`} data-testid={`activity-placeholder-${activity.id}-${activity.offset}`} className="w-full pointer-events-auto flex-1 relative">
                            {activity.isBase && (
                              <ActivityPositionedDropZone 
                                date={row.date}
                                slot={row.slot}
                                index={activityIndex}
                                moveActivity={moveActivity}
                                reorderAssignedActivities={reorderAssignedActivities}
                                activities={slotActivities}
                              />
                            )}
                            <ActivityCard
                              activity={activity}
                              category={category}
                              isDraggable={true}
                              isResizable={activity.isLast}
                              onResize={(duration) => updateActivity(activity.id, { duration })}
                              onDelete={activity.isBase ? () => moveActivity(activity.id, null, null) : undefined}
                              slotSize={SLOT_HEIGHT}
                              isContinuing={!activity.isBase}
                              willContinue={!activity.isLast}
                              useGradient={false}
                              showNotes={true}
                              index={activityIndex}
                              className="w-full shadow-md"
                              style={{
                                minHeight: SLOT_HEIGHT + 'px'
                              }}
                            />
                          </div>
                        );
                      })}
                      {slotActivities.filter(a => a.isBase).length > 0 && (
                        <div className="relative" style={{ height: '4px', marginTop: '-4px' }}>
                           <ActivityPositionedDropZone 
                              date={row.date}
                              slot={row.slot}
                              index={slotActivities.length}
                              moveActivity={moveActivity}
                              reorderAssignedActivities={reorderAssignedActivities}
                              activities={slotActivities}
                            />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TimelineDropZoneProps {
  date: string;
  slot: TimeSlot;
  rowIndex: number;
  moveActivity: any;
  reorderAssignedActivities: any;
  getActivitiesForSlot: any;
}

function TimelineDropZone({ date, slot, rowIndex, moveActivity, reorderAssignedActivities, getActivitiesForSlot }: TimelineDropZoneProps) {
  const activities = getActivitiesForSlot(date, slot);
  
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'activity',
      drop: (item: { activityId: string, index?: number }) => {
        // If we are dropping into the general zone, add to end if it's not already in this slot
        // If it is already in this slot, it's handled by ActivityPositionedDropZone or ignored here
        const currentActivity = activities.find((a: any) => a.id === item.activityId);
        if (!currentActivity) {
          moveActivity(item.activityId, date, slot, activities.length);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [date, slot, activities]
  );
  
  const isMorning = slot === 'morning';

  return (
    <div
      ref={drop}
      className={`relative z-10 transition-colors ${
        isOver ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset rounded-lg' : ''
      }`}
      style={{
        gridRow: rowIndex,
        gridColumn: '1 / -1',
        minHeight: SLOT_HEIGHT,
      }}
    >
    </div>
  );
}

interface ActivityPositionedDropZoneProps {
  date: string;
  slot: TimeSlot;
  index: number;
  moveActivity: any;
  reorderAssignedActivities: any;
  activities: any[];
}

function ActivityPositionedDropZone({ date, slot, index, moveActivity, reorderAssignedActivities, activities }: ActivityPositionedDropZoneProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'activity',
    drop: (item: { activityId: string, index?: number }) => {
      const activityIds = activities.map(a => a.id);
      const currentActivity = activities.find(a => a.id === item.activityId);

      if (currentActivity) {
        // Reordering within the same slot
        const oldIndex = activityIds.indexOf(item.activityId);
        if (oldIndex !== -1) {
          activityIds.splice(oldIndex, 1);
          const newIndex = oldIndex < index ? index - 1 : index;
          activityIds.splice(newIndex, 0, item.activityId);
          reorderAssignedActivities(date, slot, activityIds);
        }
      } else {
        // Moving from pool or another slot to a specific position
        moveActivity(item.activityId, date, slot, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }, [date, slot, index, activities]);

  return (
    <div
      ref={drop}
      className={`absolute left-0 right-0 z-40 transition-all ${
        isOver ? 'h-8 bg-blue-400/50 -translate-y-4' : 'h-2'
      }`}
      style={{
        top: 4,
        marginLeft: '-220px',
        paddingLeft: '220px',
        pointerEvents: 'auto',
      }}
    />
  );
}