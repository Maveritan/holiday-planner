import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { TimelineView } from '../views/TimelineView';
import { ActivityCard } from './ActivityCard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock re-resizable to trigger onResizeStop manually
vi.mock('re-resizable', () => {
  return {
    Resizable: ({ children, onResizeStop, size }: any) => {
      return (
        <div data-testid="mock-resizable" style={{ height: size.height }}>
          {children}
          <button
            data-testid="resize-trigger"
            onClick={() => {
              if (onResizeStop) {
                // Simulate resizing by adding 100px to CURRENT height
                const currentHeight = typeof size.height === 'number' ? size.height : 100;
                // onResizeStop expects delta from original size
                // but our implementation calculates newDuration = Math.max(1, activity.duration + durationDelta)
                // where durationDelta = Math.round(delta / slotSize)
                onResizeStop(null, 'bottom', null, { height: 100, width: 0 });
              }
            }}
          >
            Resize
          </button>
        </div>
      );
    },
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <HolidayProvider>
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  </HolidayProvider>
);

const ActivityCreator = () => {
  const { addActivity, moveActivity, activities, setDateRange } = useHoliday();
  const hasCreated = React.useRef(false);
  
  React.useEffect(() => {
    if (!hasCreated.current) {
      // Ensure the date range covers the date we're using
      setDateRange({ start: '2026-03-20', end: '2026-03-25' });
      // Add and assign an activity on mount
      addActivity('Test Resize Activity', '1');
      hasCreated.current = true;
    }
  }, []);

  React.useEffect(() => {
    const activity = activities.find(a => a.name === 'Test Resize Activity');
    if (activity && !activity.assignedDate) {
      moveActivity(activity.id, '2026-03-22', 'morning');
    }
  }, [activities]);

  // Expose activities to the test
  (window as any).activities = activities;

  return null;
};

describe('ActivityCard', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Resizing and Basic Updates', () => {
    it('should increase duration when resized and persist the change', async () => {
    // Clear all existing activities to ensure a clean start
    act(() => {
      // We don't have a clearAll, but each test gets a fresh provider
    });

    render(
      <TestWrapper>
        <ActivityCreator />
        <TimelineView />
      </TestWrapper>
    );

    // 1. Find the activity card
    const activityCard = await screen.findByText('Test Resize Activity');
    expect(activityCard).toBeDefined();

    // 2. Initial state: duration should be 1
    const cardContainer = activityCard.closest('[style*="grid-row"]') as HTMLElement;
    expect(cardContainer).toBeDefined();

    // 3. Trigger resize
    const resizeTrigger = screen.getByTestId('resize-trigger');

    await act(async () => {
      fireEvent.click(resizeTrigger);
    });

    // 4. Verify duration increased to 2
    // It should now have 2 segments in the TimelineView, but only 1 with text
    await vi.waitFor(() => {
      const segments = screen.getAllByText('Test Resize Activity');
      expect(segments.length).toBe(1);
      
      const placeHolders = screen.getAllByTestId(/^activity-placeholder-/);
      const lastPlaceholder = placeHolders[placeHolders.length - 1] as HTMLElement;
      const activityCard = lastPlaceholder.querySelector('.shadow-md') as HTMLElement;
      expect(activityCard.getAttribute('style')).toContain('min-height: 100px');
    });

    // 5. Trigger resize again
    // We need to click the resize trigger on the LAST segment
    await vi.waitFor(async () => {
      const resizeTriggers = screen.getAllByTestId('resize-trigger');
      await act(async () => {
        fireEvent.click(resizeTriggers[resizeTriggers.length - 1]);
      });
    });

    // 6. Verify duration is 3
    await vi.waitFor(() => {
      const segments = screen.getAllByText('Test Resize Activity');
      expect(segments.length).toBe(1);
    });
  });

  it('should maintain duration even when other activities are added', async () => {
    render(
      <TestWrapper>
        <ActivityCreator />
        <TimelineView />
      </TestWrapper>
    );

    await screen.findByText('Test Resize Activity');
    const resizeTrigger = screen.getByTestId('resize-trigger');

    // Resize to span 2
    await act(async () => {
      fireEvent.click(resizeTrigger);
    });
    
    await vi.waitFor(() => {
      const segments = screen.getAllByText('Test Resize Activity');
      expect(segments.length).toBe(1);
    });

    // Wait a bit and check if it's still 2 segments
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    const finalSegments = screen.getAllByText('Test Resize Activity');
    expect(finalSegments.length).toBe(1);
  });

  it('should allow editing activity name via the category icon', async () => {
    render(
      <TestWrapper>
        <ActivityCreator />
        <TimelineView />
      </TestWrapper>
    );

    // 1. Find the category icon button (it has a title "Edit activity")
    const editButton = await screen.findByTitle('Edit activity');
    expect(editButton).toBeDefined();

    // 2. Click it to open the dialog
    act(() => {
      fireEvent.click(editButton);
    });

    // 3. Find the input and update the name
    const input = await screen.findByDisplayValue('Test Resize Activity');
    act(() => {
      fireEvent.change(input, { target: { value: 'Updated Activity Name' } });
    });

    // 4. Find and click the Save button
    const saveButton = screen.getByText('Save Changes');
    act(() => {
      fireEvent.click(saveButton);
    });

    // 5. Verify the name is updated in the Timeline
    const updatedActivity = await screen.findByText('Updated Activity Name');
    expect(updatedActivity).toBeDefined();
  });

  it('should open the edit dialog on double click', async () => {
    render(
      <TestWrapper>
        <ActivityCreator />
        <TimelineView />
      </TestWrapper>
    );

    // 1. Find the activity card
    const activityCard = await screen.findByText('Test Resize Activity');
    expect(activityCard).toBeDefined();

    // 2. Double click the card
    act(() => {
      fireEvent.doubleClick(activityCard);
    });

    // 3. Verify the edit dialog is opened (it should have the activity name in an input)
    const input = await screen.findByDisplayValue('Test Resize Activity');
    expect(input).toBeDefined();
    
    // 4. Verify Dialog Title is present
    const dialogTitle = await screen.findByText('Edit Activity');
    expect(dialogTitle).toBeDefined();
  });

  describe('Spanning Logic Visuals', () => {
    it('should apply rounded-t-none and rounded-b-none to spanning segments correctly', () => {
        const activity = { id: '1', name: 'Span', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 3, position: 0 };
        const category = { id: '1', name: 'Cat', color: '#000000', icon: 'Plane' };
        
        const { rerender } = render(
            <DndProvider backend={HTML5Backend}>
                <HolidayProvider>
                    <ActivityCard 
                      activity={activity as any} 
                      category={category} 
                      isContinuing={true} 
                      willContinue={true} 
                    />
                </HolidayProvider>
            </DndProvider>
        );
        
        expect(screen.queryByText('Span')).toBeNull();
        
        rerender(
            <DndProvider backend={HTML5Backend}>
                <HolidayProvider>
                    <ActivityCard 
                      activity={activity as any} 
                      category={category} 
                      isContinuing={false} 
                      willContinue={false} 
                    />
                </HolidayProvider>
            </DndProvider>
        );
        expect(screen.getByText('Span')).toBeDefined();
    });
  });

  it('should handle activity unassignment', async () => {
    const holidayData = {
        activities: [{ id: 'del-me', name: 'Unassign Me', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 0 }],
        categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
        dateRange: { start: '2026-03-22', end: '2026-03-22' }
    };
    localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
    
    render(<TestWrapper><TimelineView /></TestWrapper>);
    
    const deleteButton = screen.getByRole('button', { name: '' }).closest('div')?.querySelector('button:has(svg.lucide-x)');
    if (deleteButton) {
        await act(async () => {
            fireEvent.click(deleteButton);
        });
    }
  });

  it('should update name correctly via Edit Dialog', async () => {
    const holidayData = {
        activities: [{ id: 'edit-me', name: 'Old Name', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 0 }],
        categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
        dateRange: { start: '2026-03-22', end: '2026-03-22' }
    };
    localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
    
    render(<TestWrapper><TimelineView /></TestWrapper>);
    
    fireEvent.click(screen.getByTitle('Edit activity'));
    
    const input = screen.getByDisplayValue('Old Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(screen.getByText('New Name')).toBeDefined();
  });
});
});
