import React from 'react';
import { render, screen } from '@testing-library/react';
import { HolidayProvider } from '../context/HolidayContext';
import { TimelineView } from './TimelineView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const TestWrapper = ({ children, initialState }: { children: React.ReactNode, initialState?: any }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <HolidayProvider>
        {React.cloneElement(children as React.ReactElement, { initialState })}
      </HolidayProvider>
    </DndProvider>
  );
};

describe('TimelineView Ordering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should place the last segment of a spanned activity at the first index of its slot', async () => {
    const mockData = {
      activities: [
        {
          id: 'long-activity',
          name: 'Long Activity',
          categoryId: '1',
          assignedDate: '2026-03-22',
          slot: 'morning',
          duration: 2, // Spans Morning and Afternoon
          position: 0,
        },
        {
          id: 'new-activity',
          name: 'New Activity',
          categoryId: '2',
          assignedDate: '2026-03-22',
          slot: 'afternoon',
          duration: 1,
          position: 0,
        },
      ],
      categories: [
        { id: '1', name: 'Cat 1', color: '#ff0000', icon: 'MapPin' },
        { id: '2', name: 'Cat 2', color: '#00ff00', icon: 'Plane' },
      ],
      dateRange: { start: '2026-03-22', end: '2026-03-23' },
    };

    localStorage.setItem('holiday-planner-data', JSON.stringify(mockData));

    render(
      <DndProvider backend={HTML5Backend}>
        <HolidayProvider>
          <TimelineView />
        </HolidayProvider>
      </DndProvider>
    );

    // After loading, both activities might have position: 0 in their respective initial slots.
    // In the Afternoon slot of 2026-03-22:
    // Long Activity (last segment) should be index 0
    // New Activity (base) should be index 1
    
    const longActivityPlaceholder = screen.getByTestId('activity-placeholder-long-activity-1');
    const newActivityPlaceholder = screen.getByTestId('activity-placeholder-new-activity-0');
    
    const container = longActivityPlaceholder.parentElement;
    expect(container).toBe(newActivityPlaceholder.parentElement);
    
    const children = Array.from(container!.children);
    const longIndex = children.indexOf(longActivityPlaceholder);
    const newIndex = children.indexOf(newActivityPlaceholder);
    
    // We expect long activity (last segment) to be index 0, but current code sorts by position first.
    // If they both have position 0, then !isBase (long) comes before isBase (new).
    // Let's force New Activity to have position 0 too.
    expect(longIndex).toBe(0);
    expect(newIndex).toBe(1);
  });

  it('should prioritize last segment over new activities even if positions conflict', async () => {
    const mockData = {
      activities: [
        {
          id: 'long-activity',
          name: 'Long Activity',
          categoryId: '1',
          assignedDate: '2026-03-22',
          slot: 'morning',
          duration: 2,
          position: 1, // Higher position than the new one
        },
        {
          id: 'new-activity',
          name: 'New Activity',
          categoryId: '2',
          assignedDate: '2026-03-22',
          slot: 'afternoon',
          duration: 1,
          position: 0, // Lower position, but it's a base activity
        },
      ],
      categories: [
        { id: '1', name: 'Cat 1', color: '#ff0000', icon: 'MapPin' },
        { id: '2', name: 'Cat 2', color: '#00ff00', icon: 'Plane' },
      ],
      dateRange: { start: '2026-03-22', end: '2026-03-23' },
    };

    localStorage.setItem('holiday-planner-data', JSON.stringify(mockData));

    render(
      <DndProvider backend={HTML5Backend}>
        <HolidayProvider>
          <TimelineView />
        </HolidayProvider>
      </DndProvider>
    );

    const longActivityPlaceholder = screen.getByTestId('activity-placeholder-long-activity-1');
    const newActivityPlaceholder = screen.getByTestId('activity-placeholder-new-activity-0');
    
    const children = Array.from(longActivityPlaceholder.parentElement!.children);
    const longIndex = children.indexOf(longActivityPlaceholder);
    const newIndex = children.indexOf(newActivityPlaceholder);
    
    // This is where it should fail if we don't fix it.
    expect(longIndex).toBe(0);
    expect(newIndex).toBe(1);
  });
});
