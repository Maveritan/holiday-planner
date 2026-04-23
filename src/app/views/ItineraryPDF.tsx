import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Circle, Rect } from '@react-pdf/renderer';
import { Activity, Category, DateRange, TimeSlot } from '../types';

// Lucide icon data for PDF rendering
const ICON_DATA: Record<string, any[][]> = {
  Plane: [
    ["path", { d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" }]
  ],
  ShoppingBag: [
    ["path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" }],
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M16 10a4 4 0 0 1-8 0" }]
  ],
  Building2: [
    ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }],
    ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }],
    ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }],
    ["path", { d: "M10 6h4" }],
    ["path", { d: "M10 10h4" }],
    ["path", { d: "M10 14h4" }],
    ["path", { d: "M10 18h4" }]
  ],
  Utensils: [
    ["path", { d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" }],
    ["path", { d: "M7 2v20" }],
    ["path", { d: "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" }]
  ],
  Hotel: [
    ["path", { d: "M10 22v-6.57" }],
    ["path", { d: "M12 11h.01" }],
    ["path", { d: "M12 7h.01" }],
    ["path", { d: "M14 15.43V22" }],
    ["path", { d: "M15 16a5 5 0 0 0-6 0" }],
    ["path", { d: "M16 11h.01" }],
    ["path", { d: "M16 7h.01" }],
    ["path", { d: "M8 11h.01" }],
    ["path", { d: "M8 7h.01" }],
    ["rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }]
  ],
  Camera: [
    ["path", { d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" }],
    ["circle", { cx: "12", cy: "13", r: "3" }]
  ],
  MapPin: [
    ["path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }],
    ["circle", { cx: "12", cy: "10", r: "3" }]
  ],
  Sparkles: [
    ["path", { d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" }],
    ["path", { d: "M20 3v4" }],
    ["path", { d: "M22 5h-4" }],
    ["path", { d: "M4 17v2" }],
    ["path", { d: "M5 18H3" }]
  ],
};

const Icon = ({ name, color = '#fff', size = 12 }: { name: string, color?: string, size?: number }) => {
  const iconNodes = ICON_DATA[name];
  if (!iconNodes) return null;

  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {iconNodes.map((node, index) => {
        const [type, props] = node;
        const key = `${name}-${index}`;
        if (type === 'path') {
          return <Path key={key} d={props.d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
        }
        if (type === 'circle') {
          return <Circle key={key} cx={props.cx} cy={props.cy} r={props.r} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
        }
        if (type === 'rect') {
          return <Rect key={key} x={props.x} y={props.y} width={props.width} height={props.height} rx={props.rx} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />;
        }
        return null;
      })}
    </Svg>
  );
};

// Register a common sans-serif font for reliable rendering
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4n.ttf' },
    { 
      src: 'https://fonts.gstatic.com/s/opensans/v44/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVc.ttf',
      fontStyle: 'italic'
    },
  ]
});

// Helper to remove emojis as they cause layout engine crashes in @react-pdf/renderer
const stripEmojis = (text: any) => {
  if (text === null || text === undefined) return '';
  const str = String(text || '');
  try {
    // Unicode normalization helps with some composite characters
    const normalized = str.normalize('NFC');
    // Broad emoji regex
    return normalized.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF])/g, '').trim();
  } catch (e) {
    return str;
  }
};

// Helper to create a pastel version of a color
const getPastelColor = (hex: string) => {
  // Simple hex to pastel conversion: blend with white
  // Default to a light gray if invalid hex
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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Open Sans',
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayHeader: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 16,
    fontFamily: 'Open Sans',
    fontWeight: 'bold',
    color: '#374151',
  },
  dayDate: {
    fontSize: 14,
    fontFamily: 'Open Sans',
    color: '#4b5563',
  },
  slotContainer: {
    marginLeft: 15,
    marginBottom: 10,
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activityList: {
    marginLeft: 10,
  },
  noActivities: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#9ca3af',
    marginLeft: 10,
    marginBottom: 5,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  activityIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityNotes: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 4,
  },
  contText: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: 'normal',
    marginLeft: 4,
  },
});

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};

export interface ItineraryDay {
  date: string;
  formattedDate: string;
  slots: {
    slot: TimeSlot;
    label: string;
    activities: (Activity & { offset: number; isBase: boolean; isLast: boolean })[];
  }[];
}

interface ItineraryPDFProps {
  dateRange: DateRange;
  categories: Category[];
  itineraryData: ItineraryDay[];
}

export const ItineraryPDF = ({
  dateRange,
  categories,
  itineraryData,
}: ItineraryPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Holiday Itinerary</Text>
        <Text style={styles.subtitle}>
          {dateRange.start} to {dateRange.end}
        </Text>
      </View>

      {itineraryData.map((day, dayIndex) => (
        <View key={day.date} style={styles.dayContainer} wrap={false}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>Day {dayIndex + 1}</Text>
            <Text style={{ width: 10 }} />
            <Text style={styles.dayDate}>{day.formattedDate}</Text>
          </View>

          <View>
            {day.slots.map((slotData) => {
              return (
                <View key={slotData.slot} style={styles.slotContainer} wrap={false}>
                  <Text style={styles.slotTitle}>{stripEmojis(slotData.label)}</Text>
                  
                  {Array.isArray(slotData.activities) && slotData.activities.length === 0 ? (
                    <Text style={styles.noActivities}>Nothing planned yet</Text>
                  ) : (
                    <View style={styles.activityList}>
                      {slotData.activities.map((activity) => {
                        const activityCategoryId = String(activity.categoryId || '');
                        const category = categories.find((c) => String(c.id) === activityCategoryId);
                        const activityKey = `${activity.id}-${activity.offset}`;

                        if (!category) {
                          return (
                            <View key={activityKey} style={styles.activityItem}>
                              <View style={styles.activityContent}>
                                <Text style={styles.activityName}>{stripEmojis(activity.name)} (No Category)</Text>
                              </View>
                            </View>
                          );
                        }

                        return (
                          <View
                            key={activityKey}
                            style={[
                              styles.activityItem,
                              { backgroundColor: getPastelColor(category.color) },
                            ]}
                          >
                            <View
                              style={[
                                styles.activityIconContainer,
                                { backgroundColor: category.color },
                              ]}
                            >
                              <Icon name={category.icon} color="#fff" size={10} />
                            </View>
                            <View style={styles.activityContent}>
                              <Text style={styles.activityName}>
                                {stripEmojis(activity.name)}
                                {!activity.isBase && (
                                  <Text style={styles.contText}> (cont)</Text>
                                )}
                              </Text>
                              {activity.notes && activity.isBase && (
                                <Text style={styles.activityNotes}>
                                  {stripEmojis(activity.notes.replace(/[#*`_]/g, ''))}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </Page>
  </Document>
);
