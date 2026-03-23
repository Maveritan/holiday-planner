import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { HolidayProvider } from '../context/HolidayContext';
import { CalendarView } from '../views/CalendarView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <HolidayProvider>
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  </HolidayProvider>
);

describe('CalendarView Contiguity', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should not have padding/gap in the activity stacking container in CalendarView', async () => {
    const initialState = {
      activities: [
        {
          id: 'act-1',
          name: 'Spanning Activity',
          categoryId: '1',
          assignedDate: '2026-03-22',
          slot: 'morning',
          duration: 2,
          position: 0
        }
      ],
      categories: [
        { id: '1', name: 'Test', color: '#ff0000', icon: 'Activity' }
      ],
      dateRange: { start: '2026-03-22', end: '2026-03-22' }
    };

    const STORAGE_KEY = 'holiday-planner-data';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

    render(
      <TestWrapper>
        <CalendarView />
      </TestWrapper>
    );

    // Find the stacking container for the first slot
    const morningPlaceholder = await screen.findByTestId(/activity-placeholder-act-1-0/);
    const stackingContainer = morningPlaceholder.parentElement as HTMLElement;

    // Verify it doesn't have p-1 (padding)
    expect(stackingContainer.className).not.toContain('p-1');
    // Verify it doesn't have gap-1 (gap)
    expect(stackingContainer.className).not.toContain('gap-1');
  });
});
