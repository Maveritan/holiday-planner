import React from 'react';
import { useHoliday, ICON_MAP } from '../context/HolidayContext';
import { TimeSlot } from '../types';
import { LucideIcon } from 'lucide-react';

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  night: '🌙 Night',
};

export function ItineraryView() {
  const { dateRange, activities, categories } = useHoliday();

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActivitiesForDateAndSlot = (date: string, slot: TimeSlot) => {
    return activities
      .filter(a => a.assignedDate === date && a.slot === slot)
      .sort((a, b) => a.position - b.position);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold mb-2">Holiday Itinerary</h1>
          <p className="text-gray-600">
            {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
          </p>
          <button
            onClick={handlePrint}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors print:hidden"
          >
            Print Itinerary
          </button>
        </div>

        {/* Days */}
        <div className="space-y-8">
          {dates.map((date, dayIndex) => {
            const hasActivities = ['morning', 'afternoon', 'night'].some(
              slot => getActivitiesForDateAndSlot(date, slot as TimeSlot).length > 0
            );

            if (!hasActivities) return null;

            return (
              <div key={date} className="break-inside-avoid">
                <div className="bg-gray-100 px-4 py-3 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-700">Day {dayIndex + 1}</span>
                    <span className="text-lg text-gray-600">{formatDate(date)}</span>
                  </div>
                </div>

                <div className="space-y-4 pl-4">
                  {(['morning', 'afternoon', 'night'] as TimeSlot[]).map(slot => {
                    const slotActivities = getActivitiesForDateAndSlot(date, slot);
                    if (slotActivities.length === 0) return null;

                    return (
                      <div key={slot} className="break-inside-avoid">
                        <h3 className="font-semibold text-lg mb-2 text-gray-700">
                          {TIME_SLOT_LABELS[slot]}
                        </h3>
                        <div className="space-y-2 pl-4">
                          {slotActivities.map((activity, index) => {
                            const category = categories.find(c => c.id === activity.categoryId);
                            if (!category) return null;

                            const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] as LucideIcon;

                            return (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg border-l-4"
                                style={{ borderColor: category.color }}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {IconComponent && (
                                      <IconComponent className="w-4 h-4 text-white" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{activity.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {category.name}
                                    {activity.duration > 1 && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        {activity.duration} slots
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {dates.every(date =>
          ['morning', 'afternoon', 'night'].every(
            slot => getActivitiesForDateAndSlot(date, slot as TimeSlot).length === 0
          )
        ) && (
          <div className="text-center text-gray-400 py-12">
            No activities scheduled yet.<br />
            Plan your holiday to see the itinerary here.
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}