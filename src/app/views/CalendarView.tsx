import React from 'react';
import { useHoliday } from '../context/HolidayContext';
import { TimeSlotDropZone } from '../components/TimeSlotDropZone';
import { ActivityCard } from '../components/ActivityCard';
import { TimeSlot } from '../types';
import { useDrop } from 'react-dnd';
import { useIsMobile } from '../components/ui/use-mobile';

const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'night'];

interface CalendarPositionedDropZoneProps {
  date: string;
  slot: TimeSlot;
  index: number;
  moveActivity: any;
  reorderAssignedActivities: any;
  activities: any[];
}

function CalendarPositionedDropZone({ date, slot, index, moveActivity, reorderAssignedActivities, activities }: CalendarPositionedDropZoneProps) {
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
        top: 0,
        pointerEvents: 'auto',
      }}
    />
  );
}

export function CalendarView() {
  const { dateRange, getActivitiesForSlot, updateActivity, moveActivity, reorderAssignedActivities, categories } = useHoliday();
  const isMobile = useIsMobile();

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
  
  if (isMobile) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {dates.map((dateStr) => {
          const date = new Date(dateStr);
          return (
            <div key={dateStr} className="p-4 pt-0 space-y-3">
              <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm py-2 px-4 -mx-4 flex items-baseline gap-2 border-b border-gray-200">
                <span className="text-xl font-bold text-gray-900">
                  {date.toLocaleDateString('en-US', { day: 'numeric' })}
                </span>
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="flex flex-col relative">
                    <div className="text-[10px] font-bold text-gray-400 uppercase ml-1 relative z-30 bg-gray-50/80 w-fit px-1 rounded mb-1">
                      {slot}
                    </div>
                    <TimeSlotDropZone
                      date={dateStr}
                      slot={slot}
                      className="bg-white shadow-md border-gray-100 ring-1 ring-black/5"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Group dates into weeks, ensuring the first column is always Sunday
  const weeks: (string | null)[][] = [];
  if (dates.length > 0) {
    const firstDate = new Date(dates[0]);
    const firstDayOfWeek = firstDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Add nulls for days before the start date in the first week
    const firstWeek: (string | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      firstWeek.push(null);
    }
    
    // Fill the rest of the first week and subsequent weeks
    let currentWeek = firstWeek;
    for (const date of dates) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    }
    
    // Pad the final week with nulls to ensure it always has 7 columns
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getWeekLabel = (week: (string | null)[]) => {
    const validDates = week.filter((d): d is string => d !== null);
    if (validDates.length === 0) return '';
    
    const startDate = new Date(validDates[0]);
    const endDate = new Date(validDates[validDates.length - 1]);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    
    return `${startStr} - ${endStr}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
    };
  };

  const SLOT_HEIGHT = 120;

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold text-lg mb-4">{getWeekLabel(week)}</h3>
            
            <div className="overflow-x-auto relative">
              <div 
                className="grid border border-gray-300 relative"
                style={{
                  gridTemplateColumns: `100px repeat(7, minmax(150px, 1fr))`,
                  gridTemplateRows: `auto repeat(${TIME_SLOTS.length}, minmax(${SLOT_HEIGHT}px, auto))`,
                }}
              >
                {/* Header Row */}
                <div className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium z-20">Time</div>
                {week.map((date, idx) => {
                  const formatted = formatDate(date);
                  return (
                    <div key={date || `empty-header-${idx}`} className={`border border-gray-300 ${date ? 'bg-gray-100' : 'bg-gray-200'} p-2 text-center z-20`}>
                      {formatted ? (
                        <>
                          <div className="text-sm font-medium">{formatted.day}</div>
                          <div className="text-xs text-gray-600">{formatted.date}</div>
                        </>
                      ) : (
                        <div className="h-9" /> // Maintain header height
                      )}
                    </div>
                  );
                })}

                {/* Time Slots Labels */}
                {TIME_SLOTS.map((slot, slotIndex) => (
                  <div 
                    key={slot} 
                    className="border border-gray-300 bg-gray-50 p-2 flex items-center justify-center capitalize text-sm font-medium z-20"
                    style={{ gridRow: slotIndex + 2, gridColumn: 1 }}
                  >
                    {slot}
                  </div>
                ))}

                {/* Grid Cells (Drop Zones) */}
                {week.map((date, colIndex) => (
                  TIME_SLOTS.map((slot, rowIndex) => (
                    <div 
                      key={`${date || `empty-${colIndex}`}-${slot}`}
                      className={`border border-gray-300 relative z-10 ${!date ? 'bg-gray-200' : ''}`}
                      style={{ gridRow: rowIndex + 2, gridColumn: colIndex + 2 }}
                    >
                      {date && (
                        <TimeSlotDropZone 
                          date={date} 
                          slot={slot} 
                          slotSize={SLOT_HEIGHT} 
                          resizeDirection="vertical" 
                          hideActivities={true}
                        />
                      )}
                    </div>
                  ))
                ))}

                {/* Activities spanning */}
                {week.flatMap((d, colIdx) => {
                  if (!d) return [];
                  
                  return TIME_SLOTS.flatMap((slot, rowIndex) => {
                    const slotActivities = getActivitiesForSlot(d, slot);
                    if (slotActivities.length === 0) return [];

                    return (
                      <div 
                        key={`${d}-${slot}-activities`}
                        className="z-30 pointer-events-none flex flex-col"
                        style={{
                          gridRow: rowIndex + 2,
                          gridColumn: colIdx + 2,
                          alignSelf: 'stretch',
                        }}
                      >
                        {slotActivities.map((activity, activityIndex) => {
                          const category = categories.find(c => c.id === activity.categoryId);
                          if (!category) return null;

                          return (
                            <div key={`${activity.id}-${activity.offset}`} data-testid={`activity-placeholder-${activity.id}-${activity.offset}`} className="w-full pointer-events-auto flex-1 relative">
                              <CalendarPositionedDropZone 
                                date={d}
                                slot={slot}
                                index={activityIndex}
                                moveActivity={moveActivity}
                                reorderAssignedActivities={reorderAssignedActivities}
                                activities={slotActivities}
                              />
                              <ActivityCard
                                activity={activity}
                                category={category}
                                isBase={activity.isBase}
                                isDraggable={true}
                                isResizable={activity.isLast}
                                onResize={(duration) => updateActivity(activity.id, { duration })}
                                onDelete={activity.isBase ? () => moveActivity(activity.id, null, null) : undefined}
                                slotSize={SLOT_HEIGHT}
                                isContinuing={!activity.isBase}
                                willContinue={!activity.isLast}
                                isContinuingAcrossDay={!activity.isBase && (slot === 'morning' || activity.offset % 3 === 0)}
                                willContinueAcrossDay={!activity.isLast && (slot === 'night' || (activity.offset + 1) % 3 === 0)}
                                useGradient={true}
                                index={activityIndex}
                                className="w-full shadow-sm"
                                showNotes={true}
                              />
                            </div>
                          );
                        })}
                        {slotActivities.filter(a => a.isBase).length > 0 && (
                          <div className="relative" style={{ height: '4px', marginTop: '-4px' }}>
                             <CalendarPositionedDropZone 
                                date={d}
                                slot={slot}
                                index={slotActivities.length}
                                moveActivity={moveActivity}
                                reorderAssignedActivities={reorderAssignedActivities}
                                activities={slotActivities}
                              />
                          </div>
                        )}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}