import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { HolidayProvider, useHoliday } from './HolidayContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HolidayProvider>{children}</HolidayProvider>
);

describe('HolidayContext Activity Management', () => {
  it('should add activity at the top of the pool (position 0)', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    act(() => {
        result.current.addActivity('First', '1');
    });
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.getUnassignedActivities()[0].name).toBe('First');
    
    act(() => {
        result.current.addActivity('Second', '1');
    });
    // Newest should be at the top
    expect(result.current.getUnassignedActivities()[0].name).toBe('Second');
    expect(result.current.getUnassignedActivities()[1].name).toBe('First');
  });

  it('should correctly reorder unassigned activities', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    act(() => {
        result.current.addActivity('A', '1');
        result.current.addActivity('B', '1');
        result.current.addActivity('C', '1');
    });
    // Initial order (newest first): C, B, A
    let unassigned = result.current.getUnassignedActivities();
    expect(unassigned.map(a => a.name)).toEqual(['C', 'B', 'A']);
    
    act(() => {
        // Move C to the bottom (index 2) - new order B, A, C
        const ids = [unassigned[1].id, unassigned[2].id, unassigned[0].id];
        result.current.reorderActivities(ids);
    });
    expect(result.current.getUnassignedActivities().map(a => a.name)).toEqual(['B', 'A', 'C']);
    
    act(() => {
        // Move C back to the top - new order C, B, A
        const currentUnassigned = result.current.getUnassignedActivities();
        const ids = [currentUnassigned[2].id, currentUnassigned[0].id, currentUnassigned[1].id];
        result.current.reorderActivities(ids);
    });
    expect(result.current.getUnassignedActivities().map(a => a.name)).toEqual(['C', 'B', 'A']);
  });

  it('should handle unassigning an activity (moving back to pool)', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    let id = '';
    act(() => {
        result.current.addActivity('Pool Act', '1');
    });
    id = result.current.activities[0].id;
    act(() => {
        result.current.moveActivity(id, '2026-03-22', 'morning');
    });
    
    expect(result.current.getUnassignedActivities()).toHaveLength(0);
    
    act(() => {
        result.current.moveActivity(id, null, null);
    });
    
    expect(result.current.getUnassignedActivities()).toHaveLength(1);
    expect(result.current.getUnassignedActivities()[0].name).toBe('Pool Act');
  });

  it('should maintain stable positions when reordering assigned activities', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    let id1 = '', id2 = '';
    act(() => {
        result.current.addActivity('Act 1', '1');
        result.current.addActivity('Act 2', '1');
    });
    id1 = result.current.activities.find(a => a.name === 'Act 1')!.id;
    id2 = result.current.activities.find(a => a.name === 'Act 2')!.id;
    act(() => {
        result.current.moveActivity(id1, '2026-03-22', 'morning', 0);
        result.current.moveActivity(id2, '2026-03-22', 'morning', 1);
    });
    
    const slotActs = result.current.getActivitiesForSlot('2026-03-22', 'morning');
    expect(slotActs[0].name).toBe('Act 1');
    expect(slotActs[1].name).toBe('Act 2');
    
    act(() => {
        const currentId1 = slotActs[0].id;
        const currentId2 = slotActs[1].id;
        result.current.reorderAssignedActivities('2026-03-22', 'morning', [currentId2, currentId1]);
    });
    
    const reorderedSlotActs = result.current.getActivitiesForSlot('2026-03-22', 'morning');
    expect(reorderedSlotActs[0].name).toBe('Act 2');
    expect(reorderedSlotActs[1].name).toBe('Act 1');
  });

  it('should correctly prioritize segments in getActivitiesForSlot', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    // Setup: 
    // Act 1: Morning -> Afternoon (duration 2)
    // Act 2: Afternoon (duration 1)
    
    act(() => {
        result.current.addActivity('Act 1', '1');
        result.current.addActivity('Act 2', '1');
    });
    
    const id1 = result.current.getUnassignedActivities().find(a => a.name === 'Act 1')!.id;
    const id2 = result.current.getUnassignedActivities().find(a => a.name === 'Act 2')!.id;
    
    act(() => {
        result.current.moveActivity(id1, '2026-03-22', 'morning', 0);
        result.current.moveActivity(id2, '2026-03-22', 'afternoon', 0);
        result.current.updateActivity(id1, { duration: 2 });
    });
    
    // In afternoon slot:
    // Act 1 (continuation, isLast) should be index 0
    // Act 2 (base, isBase) should be index 1
    const slotActs = result.current.getActivitiesForSlot('2026-03-22', 'afternoon');
    expect(slotActs).toHaveLength(2);
    expect(slotActs[0].name).toBe('Act 1');
    expect(slotActs[0].isLast).toBe(true);
    expect(slotActs[0].isBase).toBe(false);
    expect(slotActs[1].name).toBe('Act 2');
    expect(slotActs[1].isBase).toBe(true);
  });

  it('should prioritize isLast even if position is higher', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    
    act(() => {
        result.current.addActivity('Act 1', '1');
        result.current.addActivity('Act 2', '1');
    });
    
    const id1 = result.current.getUnassignedActivities().find(a => a.name === 'Act 1')!.id;
    const id2 = result.current.getUnassignedActivities().find(a => a.name === 'Act 2')!.id;
    
    act(() => {
        // Force Act 1 to have higher position in afternoon
        result.current.moveActivity(id1, '2026-03-22', 'morning', 1); 
        result.current.moveActivity(id2, '2026-03-22', 'afternoon', 0);
        result.current.updateActivity(id1, { duration: 2 });
    });
    
    const slotActs = result.current.getActivitiesForSlot('2026-03-22', 'afternoon');
    expect(slotActs[0].name).toBe('Act 1');
    expect(slotActs[1].name).toBe('Act 2');
  });

  it('should update activity duration correctly', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    act(() => {
        result.current.addActivity('Resize Me', '1');
    });
    const id = result.current.activities[0].id;
    act(() => {
        result.current.updateActivity(id, { duration: 3 });
    });
    expect(result.current.activities[0].duration).toBe(3);
  });

  it('should handle category icon updates', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    act(() => {
        result.current.updateCategory('1', { icon: 'Camera' });
    });
    expect(result.current.categories.find(c => c.id === '1')?.icon).toBe('Camera');
  });

  it('should correctly import complex state', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    const newState = {
        activities: [{ id: 'imp-1', name: 'Imported', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning' as any, duration: 2, position: 0 }],
        categories: [{ id: '1', name: 'Cat 1', color: '#000', icon: 'Plane' }],
        dateRange: { start: '2026-03-22', end: '2026-03-24' }
    };
    act(() => {
        result.current.importState(newState);
    });
    expect(result.current.activities[0].id).toBe('imp-1');
    expect(result.current.dateRange.start).toBe('2026-03-22');
  });

  it('should find correct activities for a slot including continuations', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper: HolidayProvider });
    let id = '';
    act(() => {
        result.current.addActivity('Long', '1');
    });
    id = result.current.activities[0].id;
    act(() => {
        result.current.updateActivity(id, { duration: 3 });
        result.current.moveActivity(id, '2026-03-22', 'morning');
    });
    
    const slot1 = result.current.getActivitiesForSlot('2026-03-22', 'morning');
    expect(slot1[0].isBase).toBe(true);
    
    const slot2 = result.current.getActivitiesForSlot('2026-03-22', 'afternoon');
    expect(slot2[0].isBase).toBe(false);
    expect(slot2[0].name).toBe('Long');
    
    const slot3 = result.current.getActivitiesForSlot('2026-03-22', 'night');
    expect(slot3[0].isBase).toBe(false);
  });

  it('should create a test activity and keep it in the activities array after assignment', async () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });

    // 1. Add an activity
    act(() => {
      result.current.addActivity('Test Activity', '1');
    });

    expect(result.current.activities).toHaveLength(1);
    const activityId = result.current.activities[0].id;
    expect(result.current.activities[0].name).toBe('Test Activity');
    expect(result.current.activities[0].assignedDate).toBeNull();
    expect(result.current.activities[0].slot).toBeNull();

    // 2. Assign the activity to a slot
    const testDate = '2026-03-22';
    const testSlot = 'morning';

    act(() => {
      result.current.moveActivity(activityId, testDate, testSlot);
    });

    // 3. Verify that the activity is still in the activities array
    expect(result.current.activities).toHaveLength(1);
    const assignedActivity = result.current.activities.find(a => a.id === activityId);
    
    expect(assignedActivity).toBeDefined();
    expect(assignedActivity?.assignedDate).toBe(testDate);
    expect(assignedActivity?.slot).toBe(testSlot);
    expect(assignedActivity?.name).toBe('Test Activity');
  });

  it('should verify 176 activities can be assigned without removal', () => {
    const { result } = renderHook(() => useHoliday(), { wrapper });
    const NUM_ACTIVITIES = 176;

    // Clear initial activities if any (though each test should have its own state due to wrapper)
    const initialCount = result.current.activities.length;

    act(() => {
      for (let i = 1; i <= NUM_ACTIVITIES; i++) {
        result.current.addActivity(`Activity ${i}`, '1');
      }
    });

    expect(result.current.activities).toHaveLength(NUM_ACTIVITIES + initialCount);
    
    // Get only the newly added activities
    const newActivities = result.current.activities.slice(initialCount);
    const activityIds = newActivities.map(a => a.id);

    act(() => {
      activityIds.forEach((id, index) => {
        const slot: 'morning' | 'afternoon' | 'night' = 
          index % 3 === 0 ? 'morning' : index % 3 === 1 ? 'afternoon' : 'night';
        const dayOffset = Math.floor(index / 3);
        const date = new Date(2026, 2, 22); // March 22, 2026
        date.setDate(date.getDate() + dayOffset);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        result.current.moveActivity(id, dateStr, slot);
      });
    });

    expect(result.current.activities).toHaveLength(NUM_ACTIVITIES + initialCount);
    
    // Track assigned combinations to verify uniqueness
    const assignments = new Set<string>();

    activityIds.forEach((id) => {
      const activity = result.current.activities.find(a => a.id === id);
      expect(activity).toBeDefined();
      expect(activity?.assignedDate).not.toBeNull();
      expect(activity?.slot).not.toBeNull();
      
      const assignmentKey = `${activity?.assignedDate}-${activity?.slot}`;
      expect(assignments.has(assignmentKey)).toBe(false);
      assignments.add(assignmentKey);
    });
    
    expect(assignments.size).toBe(NUM_ACTIVITIES);
  });
});
