import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Activity, Category, DateRange, HolidayData, TimeSlot } from '../types';
import { socket } from '../services/socket';
import { toast } from 'sonner';
import * as Y from 'yjs';
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

const ydoc = new Y.Doc();
const ymap = ydoc.getMap('holiday-data');

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
  isInitialSyncDone: boolean;
  isConnected: boolean;
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

export function HolidayProvider({ children }: { children: ReactNode }) {
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [localDateRange, setLocalDateRange] = useState<DateRange>(getDefaultDateRange());
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Sync with WebSocket and Yjs
  useEffect(() => {
    console.log('Socket: Initializing connection listeners');
    
    const onConnect = () => {
      console.log('Socket: Connected successfully');
      setIsConnected(true);
      toast.success('Connected to backend');
      // On reconnect, we might want to sync again if we missed updates
      // The server will send 'yjs-update' on connection anyway
    };

    const onConnectError = (error: any) => {
      console.error('Socket: Connection error:', error);
      setIsConnected(false);
      toast.error(`Backend connection error: ${error.message}`);
    };

    const onDisconnect = (reason: string) => {
      console.warn('Socket: Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const handleYjsUpdate = (update: any) => {
      console.log('Socket: Received Yjs update');
      try {
        // Ensure we are working with a Uint8Array
        const uint8Update = update instanceof Uint8Array ? update : new Uint8Array(update);
        Y.applyUpdate(ydoc, uint8Update, socket);
        setIsInitialSyncDone(true);
      } catch (err) {
        console.error('Error applying Yjs update from server:', err);
      }
    };

    const handleYjsUpdateBase64 = (base64Update: string) => {
      console.log('Socket: Received Yjs update (Base64)');
      try {
        const binaryString = atob(base64Update);
        const uint8Update = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Update[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, uint8Update, socket);
        setIsInitialSyncDone(true);
      } catch (err) {
        console.error('Error applying Yjs update (Base64) from server:', err);
      }
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('yjs-update', handleYjsUpdate);
    socket.on('yjs-update-base64', handleYjsUpdateBase64);

    // Initial Yjs sync: when we update the local ydoc, broadcast it
    const handleLocalYjsUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== socket) {
        console.log('Socket: Broadcasting local Yjs update');
        // Send both binary and base64 for maximum compatibility
        socket.emit('yjs-update', update);
        
        try {
          // Also send base64 as a fallback for browsers like Safari
          const base64Update = btoa(String.fromCharCode(...update));
          socket.emit('yjs-update-base64', base64Update);
        } catch (e) {
          console.error('Error encoding update to base64:', e);
        }
      }
    };
    ydoc.on('update', handleLocalYjsUpdate);

    // Sync React state with Yjs
    const syncReactState = () => {
      const data = ymap.toJSON() as any;
      console.log('Syncing React state from Yjs:', data);
      
      // We must be careful not to trigger excessive re-renders
      // but ymap.toJSON() is a fresh object every time.
      if (data.activities) setLocalActivities(data.activities);
      if (data.categories) setLocalCategories(data.categories);
      if (data.dateRange) setLocalDateRange(data.dateRange);
    };

    const observer = () => {
      syncReactState();
    };

    ymap.observeDeep(observer);

    // Initial sync from what we have in ymap
    syncReactState();

    // If already connected when effect runs
    if (socket.connected) {
      onConnect();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('App became visible, attempting to reconnect socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('yjs-update', handleYjsUpdate);
      socket.off('yjs-update-base64', handleYjsUpdateBase64);
      ydoc.off('update', handleLocalYjsUpdate);
      ymap.unobserveDeep(observer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const importState = (data: HolidayData) => {
    ydoc.transact(() => {
      const yactivities = new Y.Array();
      data.activities.forEach(a => {
        const ya = new Y.Map();
        Object.entries(a).forEach(([k, v]) => ya.set(k, v));
        yactivities.push([ya]);
      });
      ymap.set('activities', yactivities);

      const ycategories = new Y.Array();
      data.categories.forEach(c => {
        const yc = new Y.Map();
        Object.entries(c).forEach(([k, v]) => yc.set(k, v));
        ycategories.push([yc]);
      });
      ymap.set('categories', ycategories);

      const ydateRange = new Y.Map();
      Object.entries(data.dateRange).forEach(([k, v]) => ydateRange.set(k, v));
      ymap.set('dateRange', ydateRange);
    });
  };

  const addActivity = (name: string, categoryId: string) => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now().toString();
    const newActivity: Activity = {
      id,
      name,
      categoryId,
      assignedDate: null,
      slot: null,
      duration: 1,
      position: 0,
      notes: '',
    };

    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      // Update positions of other unassigned activities
      yactivities.forEach(ya => {
        if (ya.get('assignedDate') === null || ya.get('slot') === null) {
          ya.set('position', (ya.get('position') || 0) + 1);
        }
      });

      const ya = new Y.Map();
      Object.entries(newActivity).forEach(([k, v]) => ya.set(k, v));
      yactivities.insert(0, [ya]);
    });
  };

  const reorderActivities = (activityIds: string[]) => {
    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      activityIds.forEach((id, index) => {
        const ya = yactivities.toArray().find(a => a.get('id') === id);
        if (ya) {
          ya.set('position', index);
        }
      });
    });
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      const ya = yactivities.toArray().find(a => a.get('id') === id);
      if (ya) {
        Object.entries(updates).forEach(([k, v]) => ya.set(k, v));
      }
    });
  };

  const deleteActivity = (id: string) => {
    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      const index = yactivities.toArray().findIndex(a => a.get('id') === id);
      if (index !== -1) {
        yactivities.delete(index, 1);
      }
    });
  };

  const addCategory = (name: string, color: string, icon: string) => {
    const id = Math.random().toString(36).substr(2, 9) + Date.now().toString();
    const newCategory: Category = { id, name, color, icon };

    ydoc.transact(() => {
      const ycategories = ymap.get('categories') as Y.Array<Y.Map<any>>;
      if (!ycategories) return;

      const yc = new Y.Map();
      Object.entries(newCategory).forEach(([k, v]) => yc.set(k, v));
      ycategories.push([yc]);
    });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    ydoc.transact(() => {
      const ycategories = ymap.get('categories') as Y.Array<Y.Map<any>>;
      if (!ycategories) return;

      const yc = ycategories.toArray().find(c => c.get('id') === id);
      if (yc) {
        Object.entries(updates).forEach(([k, v]) => yc.set(k, v));
      }
    });
  };

  const deleteCategory = (id: string) => {
    ydoc.transact(() => {
      const ycategories = ymap.get('categories') as Y.Array<Y.Map<any>>;
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!ycategories || !yactivities) return;

      const index = ycategories.toArray().findIndex(c => c.get('id') === id);
      if (index !== -1) {
        ycategories.delete(index, 1);
      }

      // Reassign activities to first category
      const remainingCategories = ycategories.toArray();
      if (remainingCategories.length > 0) {
        const firstCategoryId = remainingCategories.find(c => c.get('id') !== id)?.get('id') || remainingCategories[0].get('id');
        yactivities.forEach(ya => {
          if (ya.get('categoryId') === id) {
            ya.set('categoryId', firstCategoryId);
          }
        });
      }
    });
  };

  const moveActivity = (
    activityId: string,
    date: string | null,
    slot: TimeSlot | null,
    position = 0
  ) => {
    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      const activityToMove = yactivities.toArray().find(a => a.get('id') === activityId);
      if (!activityToMove) return;

      // Handle unassigning (moving back to pool)
      if (date === null || slot === null) {
        yactivities.forEach(ya => {
          if (ya.get('id') === activityId) {
            ya.set('assignedDate', null);
            ya.set('slot', null);
            ya.set('position', 0);
          } else if (ya.get('assignedDate') === null || ya.get('slot') === null) {
            // Shift other unassigned activities
            ya.set('position', (ya.get('position') || 0) + 1);
          }
        });
        return;
      }

      // Handle shifting in target slot
      yactivities.forEach(ya => {
        if (ya.get('id') === activityId) {
          ya.set('assignedDate', date);
          ya.set('slot', slot);
          ya.set('position', position);
        } else if (ya.get('assignedDate') === date && ya.get('slot') === slot && (ya.get('position') || 0) >= position) {
          ya.set('position', (ya.get('position') || 0) + 1);
        }
      });
    });
  };

  const reorderAssignedActivities = (
    date: string,
    slot: TimeSlot,
    activityIds: string[]
  ) => {
    ydoc.transact(() => {
      const yactivities = ymap.get('activities') as Y.Array<Y.Map<any>>;
      if (!yactivities) return;

      const idToIndex = new Map(activityIds.map((id, index) => [id, index]));
      yactivities.forEach(ya => {
        const id = ya.get('id');
        if (ya.get('assignedDate') === date && ya.get('slot') === slot && idToIndex.has(id)) {
          ya.set('position', idToIndex.get(id)!);
        }
      });
    });
  };

  const setDateRange = (range: DateRange) => {
    ydoc.transact(() => {
      let ydateRange = ymap.get('dateRange') as Y.Map<any>;
      if (!ydateRange) {
        ydateRange = new Y.Map();
        ymap.set('dateRange', ydateRange);
      }
      Object.entries(range).forEach(([k, v]) => ydateRange.set(k, v));
    });
  };

  const getActivitiesForSlot = (date: string, slot: TimeSlot): (Activity & { offset: number; isBase: boolean; isLast: boolean })[] => {
    const timeSlotOrder: TimeSlot[] = ['morning', 'afternoon', 'night'];
    const currentSlotIndex = timeSlotOrder.indexOf(slot);

    return localActivities
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
    return localActivities
      .filter(a => a.assignedDate === null || a.slot === null)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  return (
    <HolidayContext.Provider
      value={{
        activities: localActivities,
        categories: localCategories,
        dateRange: localDateRange,
        isInitialSyncDone,
        isConnected,
        addActivity,
        updateActivity,
        deleteActivity,
        addCategory,
        updateCategory,
        deleteCategory,
        setDateRange,
        setActivities: () => {},
        setCategories: () => {},
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
