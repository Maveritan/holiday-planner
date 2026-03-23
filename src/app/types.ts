export type TimeSlot = 'morning' | 'afternoon' | 'night';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Activity {
  id: string;
  name: string;
  categoryId: string;
  assignedDate: string | null; // ISO date string
  slot: TimeSlot | null;
  duration: number; // number of slots it spans
  position: number; // position within a slot
  notes: string;
}

export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

export interface HolidayData {
  activities: Activity[];
  categories: Category[];
  dateRange: DateRange;
}
