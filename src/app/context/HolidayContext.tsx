import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, Category, DateRange, HolidayData, TimeSlot } from '../types';
import { 
  Plane, 
  ShoppingBag, 
  Building2, 
  Utensils, 
  Hotel, 
  Camera, 
  MapPin, 
  Sparkles 
} from 'lucide-react';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' },
  { id: '2', name: 'Shopping', color: '#EC4899', icon: 'ShoppingBag' },
  { id: '3', name: 'Museum', color: '#8B5CF6', icon: 'Building2' },
  { id: '4', name: 'Dining', color: '#F59E0B', icon: 'Utensils' },
  { id: '5', name: 'Accommodation', color: '#10B981', icon: 'Hotel' },
  { id: '6', name: 'Sightseeing', color: '#06B6D4', icon: 'Camera' },
  { id: '7', name: 'Activity', color: '#EF4444', icon: 'MapPin' },
  { id: '8', name: 'Entertainment', color: '#F97316', icon: 'Sparkles' },
];

const getDefaultDateRange = (): DateRange => {
  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const stored = localStorage.getItem('holiday-planner-data');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.dateRange) return data.dateRange;
    } catch (e) {}
  }

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 6); // 7 days by default

  return {
    start: formatDateToISO(start),
    end: formatDateToISO(end),
  };
};

interface HolidayContextType {
  activities: Activity[];
  categories: Category[];
  dateRange: DateRange;
  addActivity: (name: string, categoryId: string) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  setDateRange: (range: DateRange) => void;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  reorderActivities: (activityIds: string[]) => void;
  importState: (data: HolidayData) => void;
  moveActivity: (
    activityId: string,
    date: string | null,
    slot: TimeSlot | null,
    position?: number
  ) => void;
  reorderAssignedActivities: (
    date: string,
    slot: TimeSlot,
    activityIds: string[]
  ) => void;
  getActivitiesForSlot: (date: string, slot: TimeSlot) => (Activity & { offset: number; isBase: boolean; isLast: boolean })[];
  getUnassignedActivities: () => Activity[];
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

const STORAGE_KEY = 'holiday-planner-data';

export function HolidayProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: HolidayData = JSON.parse(stored);
        setActivities(data.activities || []);
        setCategories(data.categories || DEFAULT_CATEGORIES);
        setDateRange(data.dateRange || getDefaultDateRange());
      } catch (e) {
        console.error('Failed to load data from localStorage', e);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const data: HolidayData = {
      activities,
      categories,
      dateRange,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [activities, categories, dateRange]);

  const importState = (data: HolidayData) => {
    if (data.activities) setActivities(data.activities);
    if (data.categories) setCategories(data.categories);
    if (data.dateRange) setDateRange(data.dateRange);
  };

  const addActivity = (name: string, categoryId: string) => {
    setActivities(prev => {
      return [{
        id: Math.random().toString(36).substr(2, 9) + Date.now().toString(),
        name,
        categoryId,
        assignedDate: null,
        slot: null,
        duration: 1,
        position: 0,
        notes: '',
      }, ...prev.map(a => ({
        ...a,
        position: (a.assignedDate === null || a.slot === null) ? (a.position || 0) + 1 : a.position
      }))];
    });
  };

  const reorderActivities = (activityIds: string[]) => {
    setActivities(prev => {
      const activityMap = new Map(prev.map(a => [a.id, a]));
      const newActivities = [...prev];
      
      activityIds.forEach((id, index) => {
        const activity = activityMap.get(id);
        if (activity) {
          const activityIndex = newActivities.findIndex(a => a.id === id);
          if (activityIndex !== -1) {
            newActivities[activityIndex] = { ...activity, position: index };
          }
        }
      });
      return newActivities;
    });
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addCategory = (name: string, color: string, icon: string) => {
    setCategories(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(),
      name,
      color,
      icon,
    }]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    // Reassign activities to first category
    setActivities(prev => {
      if (categories.length > 0) {
        const firstCategoryId = categories.find(c => c.id !== id)?.id || categories[0].id;
        return prev.map(a => 
          a.categoryId === id ? { ...a, categoryId: firstCategoryId } : a
        );
      }
      return prev;
    });
  };

  const moveActivity = (
    activityId: string,
    date: string | null,
    slot: TimeSlot | null,
    position = 0
  ) => {
    setActivities(prev => {
      const activityToMove = prev.find(a => a.id === activityId);
      if (!activityToMove) return prev;

      // Handle unassigning (moving back to pool)
      if (date === null || slot === null) {
        return prev.map(a => {
          if (a.id === activityId) {
            return { ...a, assignedDate: null, slot: null, position: 0 };
          }
          // Shift other unassigned activities
          if (a.assignedDate === null || a.slot === null) {
            return { ...a, position: (a.position || 0) + 1 };
          }
          return a;
        });
      }

      // Handle shifting in target slot
      return prev.map(a => {
        if (a.id === activityId) {
          return { ...a, assignedDate: date, slot, position };
        }
        if (date && slot && a.assignedDate === date && a.slot === slot && a.position >= position) {
          return { ...a, position: a.position + 1 };
        }
        return a;
      });
    });
  };

  const reorderAssignedActivities = (
    date: string,
    slot: TimeSlot,
    activityIds: string[]
  ) => {
    setActivities(prev => {
      const idToIndex = new Map(activityIds.map((id, index) => [id, index]));
      return prev.map(a => {
        if (a.assignedDate === date && a.slot === slot && idToIndex.has(a.id)) {
          return { ...a, position: idToIndex.get(a.id)! };
        }
        return a;
      });
    });
  };

  const getActivitiesForSlot = (date: string, slot: TimeSlot): (Activity & { offset: number; isBase: boolean; isLast: boolean })[] => {
    const timeSlotOrder: TimeSlot[] = ['morning', 'afternoon', 'night'];
    const currentSlotIndex = timeSlotOrder.indexOf(slot);

    return activities
      .filter(a => {
        if (!a.assignedDate || !a.slot) return false;

        const activityDate = new Date(a.assignedDate);
        activityDate.setHours(0, 0, 0, 0);
        const currentMidnight = new Date(date);
        currentMidnight.setHours(0, 0, 0, 0);

        const activitySlotIndex = timeSlotOrder.indexOf(a.slot);

        // Calculate total slot difference
        const daysDiff = Math.round((currentMidnight.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalSlotDiff = (daysDiff * 3) + (currentSlotIndex - activitySlotIndex);

        return totalSlotDiff >= 0 && totalSlotDiff < a.duration;
      })
      .map(a => {
        const activityDate = new Date(a.assignedDate!);
        activityDate.setHours(0, 0, 0, 0);
        const currentMidnight = new Date(date);
        currentMidnight.setHours(0, 0, 0, 0);
        const activitySlotIndex = timeSlotOrder.indexOf(a.slot!);
        const daysDiff = Math.round((currentMidnight.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        const offset = (daysDiff * 3) + (currentSlotIndex - activitySlotIndex);

        return {
          ...a,
          offset,
          isBase: offset === 0,
          isLast: offset === a.duration - 1,
        };
      })
      .sort((a, b) => {
        // Last segments of spanned cards should always be at the first index of their slot
        if (a.isLast !== b.isLast) {
          return a.isLast ? -1 : 1;
        }
        // Then other continuations come before base activities
        if (a.isBase !== b.isBase) {
          return a.isBase ? 1 : -1;
        }
        // Finally sort by their assigned positions
        return a.position - b.position;
      });
  };

  const getUnassignedActivities = (): Activity[] => {
    return activities
      .filter(a => a.assignedDate === null || a.slot === null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  return (
    <HolidayContext.Provider
      value={{
        activities,
        categories,
        dateRange,
        addActivity,
        updateActivity,
        deleteActivity,
        addCategory,
        updateCategory,
        deleteCategory,
        setDateRange,
        setActivities,
        setCategories,
        reorderActivities,
        reorderAssignedActivities,
        importState,
        moveActivity,
        getActivitiesForSlot,
        getUnassignedActivities,
      }}
    >
      {children}
    </HolidayContext.Provider>
  );
}

export function useHoliday() {
  const context = useContext(HolidayContext);
  if (!context) {
    throw new Error('useHoliday must be used within a HolidayProvider');
  }
  return context;
}

export const ICON_MAP = {
  Plane,
  ShoppingBag,
  Building2,
  Utensils,
  Hotel,
  Camera,
  MapPin,
  Sparkles,
};
