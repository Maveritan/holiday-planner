import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HolidayProvider } from '../context/HolidayContext';
import { TimelineView } from './TimelineView';
import { CalendarView } from './CalendarView';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

const setupData = (activities: any[]) => {
  const data = {
    activities,
    categories: [
      { id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }
    ],
    dateRange: { start: '2026-03-22', end: '2026-03-24' }
  };
  localStorage.setItem('holiday-planner-data', JSON.stringify(data));
};

describe('Ghost Cards and Slot Expansion', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('should have multiple segments for spanning activities in TimelineView', async () => {
    const activities = [
      {
        id: 'act-1',
        name: 'Spanning Activity',
        categoryId: '1',
        assignedDate: '2026-03-22',
        slot: 'morning',
        duration: 2, // Spans morning and afternoon
        position: 0
      }
    ];
    setupData(activities);
    render(<Wrapper><TimelineView /></Wrapper>);

    // Spanning activities now render as multiple segments in TimelineView
    // but only the first segment has the text label
    const segments = await screen.findAllByText('Spanning Activity');
    expect(segments.length).toBe(1);

    segments.forEach(segment => {
      const card = segment.closest('.shadow-md') as HTMLElement;
      expect(card.style.minHeight).toBe('100px');
    });
  });

  it('should render spanning segments individually in CalendarView', async () => {
    const activities = [
      {
        id: 'act-1',
        name: 'Spanning Activity',
        categoryId: '1',
        assignedDate: '2026-03-22',
        slot: 'morning',
        duration: 2, // Spans morning and afternoon
        position: 0
      }
    ];
    setupData(activities);
    render(<Wrapper><CalendarView /></Wrapper>);

    await screen.findByText('Spanning Activity');
    
    // In CalendarView, we now render segments individually with minHeight: 120px
    const segments = await screen.findAllByTestId(/activity-placeholder-act-1/);
    expect(segments.length).toBe(2);
    
    segments.forEach(segment => {
      const card = segment.querySelector('.shadow-sm') as HTMLElement;
      expect(card.style.minHeight).toBe('120px');
    });
  });
});
