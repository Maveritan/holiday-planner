import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { TimelineView } from './TimelineView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    <HolidayProvider>
      {children}
    </HolidayProvider>
  </DndProvider>
);

const ActivityAdder = ({ name, notes }: { name: string, notes: string }) => {
  const { addActivity, moveActivity, activities } = useHoliday();
  
  React.useEffect(() => {
    addActivity(name, '1');
  }, []);

  React.useEffect(() => {
    const activity = activities.find(a => a.name === name);
    if (activity && activity.assignedDate === null) {
      moveActivity(activity.id, '2026-03-22', 'morning');
      // @ts-ignore
      activity.notes = notes; // Directly modify for test simplicity if updateActivity is not enough
      // Better way: use updateActivity
    }
  }, [activities]);

  return null;
};

const ActivityWithNotes = ({ name, notes }: { name: string, notes: string }) => {
  const { addActivity, updateActivity, moveActivity, activities, setDateRange } = useHoliday();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!initialized) {
        setDateRange({ start: '2026-03-20', end: '2026-03-25' });
        addActivity(name, '1');
        setInitialized(true);
    }
  }, [initialized]);

  React.useEffect(() => {
    const activity = activities.find(a => a.name === name);
    if (activity && activity.assignedDate === null) {
      updateActivity(activity.id, { notes });
      moveActivity(activity.id, '2026-03-22', 'morning');
    }
  }, [activities, name, notes]);

  return <TimelineView />;
};

describe('TimelineView Notes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should display notes with markdown in TimelineView', async () => {
    const notes = 'This is **bold** and *italic* with a list:\n- item 1\n- item 2';
    
    render(
      <TestWrapper>
        <ActivityWithNotes name="Test Activity" notes={notes} />
      </TestWrapper>
    );

    // Wait for activity to be assigned and rendered
    const activityName = await screen.findByText('Test Activity');
    expect(activityName).toBeInTheDocument();

    // Check for bold text
    const boldText = screen.getByText('bold');
    expect(boldText.tagName).toBe('STRONG');

    // Check for italic text
    const italicText = screen.getByText('italic');
    expect(italicText.tagName).toBe('EM');

    // Check for list items
    const listItem1 = screen.getByText('item 1');
    const listItem2 = screen.getByText('item 2');
    expect(listItem1.tagName).toBe('LI');
    expect(listItem2.tagName).toBe('LI');
  });
});
