import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HolidayProvider } from '../context/HolidayContext';
import { TimelineView } from './TimelineView';
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

describe('TimelineView Overlap Reproduction', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('should stack activities in the same slot correctly without overlapping', async () => {
    const activities = [
      {
        id: 'act-1',
        name: 'Long Activity',
        categoryId: '1',
        assignedDate: '2026-03-22',
        slot: 'morning',
        duration: 2, // Spans morning and afternoon
        position: 0
      },
      {
        id: 'act-2',
        name: 'Short Activity',
        categoryId: '1',
        assignedDate: '2026-03-22',
        slot: 'morning',
        duration: 1, // Only in morning
        position: 1
      }
    ];
    setupData(activities);
    render(<Wrapper><TimelineView /></Wrapper>);

    const longActSegments = await screen.findAllByText('Long Activity');
    expect(longActSegments.length).toBe(1);
    
    const shortAct = await screen.findByText('Short Activity');

    const longActPlaceholder = longActSegments[0].closest('[data-testid^="activity-placeholder"]') as HTMLElement;
    const shortActPlaceholder = shortAct.closest('[data-testid^="activity-placeholder"]') as HTMLElement;

    // They should be in the same container in the morning slot
    expect(longActPlaceholder.parentElement).toBe(shortActPlaceholder.parentElement);
    
    // Check their order in the DOM
    const children = Array.from(longActPlaceholder.parentElement!.children);
    const longIndex = children.indexOf(longActPlaceholder);
    const shortIndex = children.indexOf(shortActPlaceholder);

    // After the sorting fix, base activities (even with lower position) might be pushed down if others are spanning
    // In this case, Long Activity is duration 2, so in morning it's isBase=true, isLast=false.
    // Short Activity is duration 1, so in morning it's isBase=true, isLast=true.
    // Our new sort: isLast first. So short should be 0, long should be 1.
    expect(shortIndex).toBe(0);
    expect(longIndex).toBe(1);

    // Verify each segment is 100px
    const longCard1 = longActSegments[0].closest('.shadow-md') as HTMLElement;
    expect(longCard1.getAttribute('style')).toContain('min-height: 100px');

    const shortCard = shortAct.closest('.shadow-md') as HTMLElement;
    expect(shortCard.getAttribute('style')).toContain('min-height: 100px');
  });
});
