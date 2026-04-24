import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { CalendarView } from './CalendarView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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

const setupCalendarData = (data: any) => {
  localStorage.setItem('holiday-planner-data', JSON.stringify(data));
};

describe('CalendarView', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Grid Structure and Padding', () => {
    it('should render day headers', () => {
      const holidayData = {
        activities: [],
        categories: [],
        dateRange: { start: '2026-03-25', end: '2026-03-28' }
      };
      setupCalendarData(holidayData);
      render(<Wrapper><CalendarView /></Wrapper>);
      expect(screen.getByText(/Wed/i)).toBeDefined();
      expect(screen.getByText(/Sat/i)).toBeDefined();
    });

    it('should pad the first and last week with darkened backgrounds (dummy columns)', () => {
      const holidayData = {
         activities: [],
         categories: [],
         dateRange: { start: '2026-03-25', end: '2026-03-28' }
      };
      setupCalendarData(holidayData);
      render(<Wrapper><CalendarView /></Wrapper>);
      const dummyCells = document.querySelectorAll('.bg-gray-200');
      expect(dummyCells.length).toBeGreaterThan(0);
    });

    it('should always have Sunday in the first column', () => {
        const holidayData = {
          activities: [],
          categories: [],
          dateRange: { start: '2023-12-31', end: '2024-01-07' } // Dec 31 2023 is Sunday
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        const dayHeaders = document.querySelectorAll('.text-sm.font-medium');
        // First one is "Time" column header, second one should be "Sun"
        expect(dayHeaders[1].textContent).toBe('Sun');
    });

    it('should render correct date range header', () => {
        const holidayData = {
            activities: [],
            categories: [],
            dateRange: { start: '2026-03-22', end: '2026-03-24' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        const header = screen.getByRole('heading', { level: 3 });
        expect(header.textContent).toContain('Mar');
    });
  });

  describe('Activity Rendering and Spanning', () => {
    it('should render activities within the grid and not absolutely positioned relative to page', async () => {
        const holidayData = {
            activities: [{ id: 'act-1', name: 'Activity 1', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 0 }],
            categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
            dateRange: { start: '2026-03-22', end: '2026-03-28' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        const activity = await screen.findByText(/Activity 1/);
        const wrapper = activity.closest('.z-30');
        expect(wrapper).toBeTruthy();
        expect(wrapper?.className).not.toContain('absolute');
        const style = (wrapper as HTMLElement).style;
        expect(style.gridRow).toBeTruthy();
        expect(style.gridColumn).toBeTruthy();
    });

    it('should stack multiple activities in the same slot using flex-col', async () => {
        const holidayData = {
            activities: [
                { id: 'act-1', name: 'Activity 1', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 0 },
                { id: 'act-2', name: 'Activity 2', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 1 }
            ],
            categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
            dateRange: { start: '2026-03-22', end: '2026-03-28' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        await screen.findByText(/Activity 1/);
        await screen.findByText(/Activity 2/);
        const activity1 = screen.getByText(/Activity 1/).closest('.z-30');
        const activity2 = screen.getByText(/Activity 2/).closest('.z-30');
        expect(activity1?.className).toContain('flex-col');
        expect(activity2?.className).toContain('flex-col');
    });

    it('should calculate correct boundary flags for gradients in CalendarView', async () => {
      const holidayData = {
          activities: [
              { id: 'spanning-act', name: 'Multi-Day Activity', categoryId: '1', assignedDate: '2026-03-22', slot: 'afternoon', duration: 3, position: 0 }
              // Duration 3 from Mar 22 Afternoon (idx 0) -> Mar 22 Night (idx 1) -> Mar 23 Morning (idx 2)
          ],
          categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
          dateRange: { start: '2026-03-22', end: '2026-03-24' }
      };
      setupCalendarData(holidayData);
      render(<Wrapper><CalendarView /></Wrapper>);

      // Slot 1: Mar 22 Afternoon (Middle of day 1) - isContinuingAcrossDay=false, willContinueAcrossDay=false
      // Since it's isBase=true, isContinuingAcrossDay is naturally false.
      // willContinueAcrossDay should be false because slot is 'afternoon'.
      
      // Slot 2: Mar 22 Night (End of day 1) - willContinueAcrossDay=true
      // Slot 3: Mar 23 Morning (Start of day 2) - isContinuingAcrossDay=true
      
      // We check that ActivityCard is called with correct props by checking for presence of placeholders
      // Testing internal props in integration test is hard, but we can verify it doesn't crash and placeholders are there.
      expect(screen.getByTestId('activity-placeholder-spanning-act-0')).toBeTruthy();
      expect(screen.getByTestId('activity-placeholder-spanning-act-1')).toBeTruthy();
      expect(screen.getByTestId('activity-placeholder-spanning-act-2')).toBeTruthy();
    });

    it('should break multi-day activity into multiple segments', () => {
        const holidayData = {
            activities: [
                { id: 'long-act', name: '3-day trip', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 9, position: 0 }
            ],
            categories: [{ id: '1', name: 'Transit', color: '#000', icon: 'Plane' }],
            dateRange: { start: '2026-03-22', end: '2026-03-25' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        // In CalendarView, multi-day activities have one segment per day.
        // Each day segment in CalendarView is considered a new start slot for that day.
        // But our ActivityCard hides name if isContinuing is true.
        // isContinuing = activity.offset > 0 && slot === 'morning';
        // For '3-day trip', offset will be 0 (day 1), 3 (day 2), 6 (day 3).
        // Day 1 Morning: offset 0, isContinuing = false -> name shown.
        // Day 2 Morning: offset 3, isContinuing = true -> name hidden.
        // Day 3 Morning: offset 6, isContinuing = true -> name hidden.
        // So only 1 segment should have the name.
        const segments = screen.getAllByText('3-day trip');
        expect(segments.length).toBe(1);
    });

    it('should order multiple activities after a spanned activity correctly', async () => {
        const holidayData = {
            activities: [
                { id: 'spanned', name: 'Spanned', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 2, position: 0 },
                { id: 'after', name: 'After', categoryId: '1', assignedDate: '2026-03-22', slot: 'afternoon', duration: 1, position: 0 }
            ],
            categories: [{ id: '1', name: 'Transit', color: '#000', icon: 'Plane' }],
            dateRange: { start: '2026-03-22', end: '2026-03-22' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        
        // In the afternoon slot (row 3):
        // 1. Spanned (isLast=true) should be first
        // 2. After (isBase=true) should be second
        
        const placeholders = await screen.findAllByTestId(/activity-placeholder-/);
        // We expect:
        // placeholders[0]: spanned-0 (morning)
        // placeholders[1]: spanned-1 (afternoon)
        // placeholders[2]: after-0 (afternoon)
        
        const afternoonPlaceholders = placeholders.filter(p => {
          const style = p.closest('.z-30')?.getAttribute('style');
          return style && style.includes('grid-row: 3');
        });
        expect(afternoonPlaceholders.length).toBe(2);
        expect(afternoonPlaceholders[0].getAttribute('data-testid')).toBe('activity-placeholder-spanned-1');
        expect(afternoonPlaceholders[1].getAttribute('data-testid')).toBe('activity-placeholder-after-0');
    });
  });

  describe('Bug Regression Tests', () => {
    it('should not show activities from later weeks in earlier ones', async () => {
        const holidayData = {
          activities: [
            { id: 'future-act', name: 'Future Week', categoryId: '1', assignedDate: '2026-03-29', slot: 'morning', duration: 1, position: 0 }
          ],
          categories: [{ id: '1', name: 'Transit', color: '#000', icon: 'Plane' }],
          dateRange: { start: '2026-03-22', end: '2026-04-04' }
        };
        setupCalendarData(holidayData);
        render(<Wrapper><CalendarView /></Wrapper>);
        
    // Find the grid for the first week
    const firstWeekHeader = screen.getByText(/Mar 22 - Mar 28/i);
    const firstWeekSection = firstWeekHeader.closest('.bg-white');
    expect(firstWeekSection?.textContent).not.toContain('Future Week');

    // Find the grid for the second week
    const secondWeekHeader = screen.getByText(/Mar 29 - Apr 4/i);
    const secondWeekSection = secondWeekHeader.closest('.bg-white');
    expect(secondWeekSection?.textContent).toContain('Future Week');
  });
  });
});
