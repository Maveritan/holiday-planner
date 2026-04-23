import React, { memo, useMemo } from 'react';
import { useHoliday, ICON_MAP } from '../context/HolidayContext';
import { TimeSlot } from '../types';
import { LucideIcon, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePDF } from '@react-pdf/renderer';
import { ItineraryPDF, ItineraryDay } from './ItineraryPDF';

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  night: '🌙 Night',
};

// Helper to create a pastel version of a color
const getPastelColor = (hex: string) => {
  if (!hex || !hex.startsWith('#')) return '#f9fafb';
  
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Blend with white (85% white, 15% original color)
    const pr = Math.floor(r * 0.15 + 255 * 0.85);
    const pg = Math.floor(g * 0.15 + 255 * 0.85);
    const pb = Math.floor(b * 0.15 + 255 * 0.85);
    
    return `rgb(${pr}, ${pg}, ${pb})`;
  } catch (e) {
    return '#f9fafb';
  }
};

const MarkdownNotes = memo(({ notes }: { notes: string }) => {
  // Auto-link plain URLs while preserving existing markdown links and code blocks
  const urlRegex = /(?<!`)(?<!\()\b(https?:\/\/[^\s,$'")\]}>]+)(?!`)/g;

  const autoLinked = notes.replace(urlRegex, (match) => {
    // Skip if already inside a markdown link
    return `[${match}](${match})`;
  });

  const components: Record<string, any> = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
    ),
  };

  return (
      <div className="pro prose-sm max-w-none">
        <ReactMarkdown components={components}>{autoLinked}</ReactMarkdown>
      </div>
  );
});

type SlotActivity = ReturnType<typeof useHoliday>['activities'][number] & { offset: number; isBase: boolean; isLast: boolean };

export function ItineraryView() {
  const { dateRange, activities: localActivities, categories, getActivitiesForSlot } = useHoliday();

  const dates = useMemo(() => {
    const datesList: string[] = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      datesList.push(`${year}-${month}-${day}`);
    }
    return datesList;
  }, [dateRange.start, dateRange.end]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSlotActivities = (date: string, slot: TimeSlot): SlotActivity[] => {
    return getActivitiesForSlot(date, slot) as SlotActivity[];
  };

  const itineraryData = useMemo<ItineraryDay[]>(() => {
    return dates.map(date => {
      const daySlots = (['morning', 'afternoon', 'night'] as TimeSlot[]).map(slot => {
        const slotActivities = getActivitiesForSlot(date, slot);
        return {
          slot,
          label: TIME_SLOT_LABELS[slot],
          activities: slotActivities,
        };
      });

      return {
        date,
        formattedDate: formatDate(date),
        slots: daySlots,
      };
    });
  }, [dates, localActivities, getActivitiesForSlot]);

  console.log('itineraryData for PDF:', itineraryData);

  const pdfDocument = useMemo(() => (
    <ItineraryPDF
      dateRange={dateRange}
      categories={categories}
      itineraryData={itineraryData}
    />
  ), [dateRange, categories, itineraryData]);

  const [instance, updateInstance] = usePDF({
    document: pdfDocument,
  });

  // Re-generate PDF when data changes
  React.useEffect(() => {
    console.log('Regenerating PDF due to data change', {
      itineraryDataLength: itineraryData.length,
      firstDayActivities: itineraryData[0]?.slots.flatMap(s => s.activities).length,
      categoriesCount: categories.length
    });
    updateInstance(pdfDocument);
  }, [pdfDocument, updateInstance]);

  return (
      <div className="h-full overflow-auto bg-white">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold mb-2">Holiday Itinerary</h1>
            <div className="flex justify-between items-end">
              <p className="text-gray-600">
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              </p>
              
              <div key={instance.url || 'preparing'}>
                {instance.error ? (
                  <div className="text-red-500 text-sm">Error generating PDF</div>
                ) : (
                  <a
                    href={instance.url || '#'}
                    download={`itinerary-${dateRange.start}-to-${dateRange.end}.pdf`}
                    onClick={(e) => {
                      if (!instance.url) {
                        e.preventDefault();
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      !instance.url 
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    {instance.loading ? 'Preparing PDF...' : 'Download Itinerary'}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Days */}
          <div className="space-y-8">
            {dates.map((date, dayIndex) => {
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
                        const slotActivities = getSlotActivities(date, slot);

                        return (
                            <div key={slot} className="break-inside-avoid">
                              <h3 className="font-semibold text-lg mb-2 text-gray-700">
                                {TIME_SLOT_LABELS[slot]}
                              </h3>
                              {slotActivities.length === 0 ? (
                                  <p className="text-sm italic text-gray-400 pl-4">Nothing planned yet</p>
                              ) : (
                                  <div className="space-y-2 pl-4">
                                    {slotActivities.map((activity) => {
                                      const category = categories.find(c => c.id === activity.categoryId);
                                      if (!category) return null;

                                      const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] as LucideIcon;

                                      return (
                                          <div
                                              key={activity.id}
                                              className="flex items-start gap-3 p-3 rounded-lg"
                                              style={{ backgroundColor: getPastelColor(category.color) }}
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
                                              <div className="font-semibold text-lg">
                                                {activity.name}
                                                {!activity.isBase && (
                                                    <span className="ml-2 text-sm text-gray-500 font-normal">(cont)</span>
                                                )}
                                              </div>
                                              {activity.notes && activity.isBase && (
                                                  <MarkdownNotes notes={activity.notes} />
                                              )}
                                            </div>
                                          </div>
                                      );
                                    })}
                                  </div>
                              )}
                            </div>
                        );
                      })}
                    </div>
                  </div>
              );
            })}
          </div>
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