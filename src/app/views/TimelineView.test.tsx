import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { TimelineView } from './TimelineView';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    <HolidayProvider>
      {children}
    </HolidayProvider>
  </DndProvider>
);

const setupAssignedActivities = () => {
  const dateRange = { start: '2026-03-21', end: '2026-03-27' };
  
  const activities = [
    {
      id: 'activity-1',
      name: 'Activity 1',
      categoryId: '1',
      assignedDate: '2026-03-21',
      slot: 'morning',
      duration: 1,
      position: 0
    },
    {
      id: 'activity-2',
      name: 'Activity 2',
      categoryId: '1',
      assignedDate: '2026-03-21',
      slot: 'morning',
      duration: 1,
      position: 1
    },
    {
      id: 'activity-3',
      name: 'Activity 3',
      categoryId: '1',
      assignedDate: '2026-03-22',
      slot: 'morning',
      duration: 3,
      position: 0
    }
  ];
  
  const data = {
    activities,
    categories: [
      { id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }
    ],
    dateRange
  };
  localStorage.setItem('holiday-planner-data', JSON.stringify(data));
};

describe('TimelineView', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dividers and Grid Structure', () => {
    it('should only have one horizontal divider for each time slot', () => {
      render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      const dividers = document.querySelectorAll('.border-b, .border-b-4');
      const nonDateDividers = Array.from(dividers).filter(el => {
          const style = (el as HTMLElement).style;
          return style.gridColumn !== '1' && (style.gridColumn === '2' || style.gridColumn === '1 / -1');
      });

      expect(nonDateDividers.length).toBe(21);
    });

    it('renders with the correct grid structure (3 columns)', () => {
      const { container } = render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      
      const style = window.getComputedStyle(grid!);
      expect(style.gridTemplateColumns).toBe('100px 120px 1fr');
    });

    it('renders date labels only for morning slots and spanning 3 rows', () => {
      const { container } = render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      const dateLabels = container.querySelectorAll('[style*="grid-column: 1"]');
      const actualDateLabels = Array.from(dateLabels).filter(el => el.textContent?.match(/[0-9]+/));
      
      expect(actualDateLabels.length).toBe(7);
      
      actualDateLabels.forEach(label => {
        const style = (label as HTMLElement).style;
        expect(style.gridRow).toContain('span 3');
      });
    });

    it('renders time slot labels in the second column', () => {
      render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      expect(screen.getAllByText('Morning').length).toBe(7);
      expect(screen.getAllByText('Afternoon').length).toBe(7);
      expect(screen.getAllByText('Night').length).toBe(7);
      
      const morningLabels = screen.getAllByText('Morning');
      morningLabels.forEach(label => {
        const container = label.closest('div');
        expect(container?.style.gridColumn).toBe('2');
      });
    });

    it('renders dividers with correct thickness for day separation', () => {
      const { container } = render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      const thickDividers = container.querySelectorAll('.border-b-4');
      expect(thickDividers.length).toBe(14);

      const thinDividers = Array.from(container.querySelectorAll('.border-b')).filter(d => !d.classList.contains('border-b-4'));
      expect(thinDividers.length).toBe(14);
    });

    it('renders drop zones in all columns', () => {
      const { container } = render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      const columnAllElements = Array.from(container.querySelectorAll('div')).filter(el => (el as HTMLElement).style.gridColumn === '1 / -1');
      expect(columnAllElements.length).toBe(42);
      
      const dropZones = columnAllElements.filter(el => (el as HTMLElement).style.minHeight === '100px');
      expect(dropZones.length).toBe(21);
    });

    it('should maintain grid row height minimums in TimelineView', () => {
        render(<Wrapper><TimelineView /></Wrapper>);
        const grids = document.querySelectorAll('.grid');
        grids.forEach(grid => {
            const htmlGrid = grid as HTMLElement;
            if (htmlGrid.style.gridTemplateRows) {
                expect(htmlGrid.style.gridTemplateRows).toContain('minmax(100px, auto)');
            }
        });
     });
  });

  describe('Activity Rendering and Stacking', () => {
    it('stacks multiple activities vertically in the third column', async () => {
      setupAssignedActivities();
      const { container } = render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Activity 2')).toBeInTheDocument();

      const activityContainers = container.querySelectorAll('.z-20.flex-col');
      
      const morningContainer = Array.from(activityContainers).find(el => el.textContent?.includes('Activity 1') && el.textContent?.includes('Activity 2'));
      expect(morningContainer).toBeInTheDocument();
      expect((morningContainer as HTMLElement).style.gridColumn).toBe('3');
      expect((morningContainer as HTMLElement).classList.contains('flex-col')).toBe(true);
    });

    it('correctly spans multi-slot activities across slots', async () => {
      setupAssignedActivities();
      render(
        <Wrapper>
          <TimelineView />
        </Wrapper>
      );

      // Activity 3 starts on Mar 22 Morning and spans 3 slots
      // It should now have 3 segments in total (one for each slot)
      // but only one (the base) will have the name "Activity 3"
      const activity3Segments = await screen.findAllByText('Activity 3');
      expect(activity3Segments.length).toBe(1);

      activity3Segments.forEach((segment) => {
        const placeholder = segment.closest('[data-testid^="activity-placeholder-"]') as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const activityCard = placeholder.querySelector('.shadow-md');
        // Each segment should be 100px
        expect(activityCard?.getAttribute('style')).toContain('min-height: 100px');
      });
    });

    it('should stack many activities and maintain their order', () => {
        const activities = Array.from({ length: 5 }, (_, i) => ({
          id: `act-${i}`,
          name: `Activity ${i}`,
          categoryId: '1',
          assignedDate: '2026-03-22',
          slot: 'morning',
          duration: 1,
          position: i
        }));
        
        const holidayData = {
          activities,
          categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
          dateRange: { start: '2026-03-22', end: '2026-03-22' }
        };
        localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
        
        render(<Wrapper><TimelineView /></Wrapper>);
        
        const renderedActivities = screen.getAllByText(/Activity \d/);
        expect(renderedActivities.length).toBe(5);
        expect(renderedActivities[0].textContent).toBe('Activity 0');
        expect(renderedActivities[4].textContent).toBe('Activity 4');
    });

    it('should handle 10+ activities in a single slot without breaking layout', () => {
        const activities = Array.from({ length: 12 }, (_, i) => ({
          id: `dense-act-${i}`,
          name: `Dense ${i}`,
          categoryId: '1',
          assignedDate: '2026-03-22',
          slot: 'morning',
          duration: 1,
          position: i
        }));
        const holidayData = {
          activities,
          categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
          dateRange: { start: '2026-03-22', end: '2026-03-22' }
        };
        localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
        
        render(<Wrapper><TimelineView /></Wrapper>);
        expect(screen.getAllByText(/Dense \d+/).length).toBe(12);
    });
  });

  describe('Edge Cases and Trip Duration', () => {
    it('should correctly handle activity starting on the last slot of the last day', async () => {
      const holidayData = {
        activities: [
          { id: 'last-slot-act', name: 'Final Night Activity', categoryId: '1', assignedDate: '2026-03-24', slot: 'night', duration: 1, position: 0 }
        ],
        categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
        dateRange: { start: '2026-03-22', end: '2026-03-24' }
      };
      localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
      render(<Wrapper><TimelineView /></Wrapper>);
      expect(screen.getByText('Final Night Activity')).toBeDefined();
    });

    it('should handle activity assigned to a date before the trip starts', () => {
       const holidayData = {
         activities: [
           { id: 'pre-trip-act', name: 'Pre-trip Activity', categoryId: '1', assignedDate: '2026-03-20', slot: 'morning', duration: 1, position: 0 }
         ],
         categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
         dateRange: { start: '2026-03-22', end: '2026-03-24' }
       };
       localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
       render(<Wrapper><TimelineView /></Wrapper>);
       expect(screen.queryByText('Pre-trip Activity')).toBeNull();
    });

    it('should handle a 1-day trip duration', () => {
       const holidayData = {
           activities: [],
           categories: [],
           dateRange: { start: '2026-03-22', end: '2026-03-22' }
       };
       localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
       render(<Wrapper><TimelineView /></Wrapper>);
       const timeLabels = screen.getAllByText(/Morning|Afternoon|Night/);
       expect(timeLabels.length).toBe(3);
    });

    it('should handle 31 day trip (one month) without crashing', () => {
       const holidayData = {
          activities: [],
          categories: [],
          dateRange: { start: '2026-03-01', end: '2026-03-31' }
       };
       localStorage.setItem('holiday-planner-data', JSON.stringify(holidayData));
       render(<Wrapper><TimelineView /></Wrapper>);
       const timeLabels = screen.getAllByText(/Morning|Afternoon|Night/);
       expect(timeLabels.length).toBe(93);
    });

    it('does not render "Drop here to plan" text', async () => {
        const { container } = render(
          <Wrapper>
            <TimelineView />
          </Wrapper>
        );
        const column3Elements = Array.from(container.querySelectorAll('div')).filter(el => (el as HTMLElement).style.gridColumn === '3');
        const dropZones = column3Elements.filter(el => (el as HTMLElement).style.gridRow !== '');
        dropZones.forEach(dz => {
          expect(dz.textContent).not.toContain('Drop here to plan');
        });
    });
  });
});
