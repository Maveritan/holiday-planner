import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HolidayProvider } from '../context/HolidayContext';
import { ItineraryView } from './ItineraryView';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <HolidayProvider>
    {children}
  </HolidayProvider>
);

const setupItineraryData = (data: any) => {
  localStorage.setItem('holiday-planner-data', JSON.stringify(data));
};

describe('ItineraryView', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('should render scheduled activities in correct chronological order', () => {
    const holidayData = {
        activities: [
            { id: 'night-act', name: 'Night Act', categoryId: '1', assignedDate: '2026-03-22', slot: 'night', duration: 1, position: 0 },
            { id: 'morning-act', name: 'Morning Act', categoryId: '1', assignedDate: '2026-03-22', slot: 'morning', duration: 1, position: 0 },
            { id: 'day2-act', name: 'Day 2 Act', categoryId: '1', assignedDate: '2026-03-23', slot: 'afternoon', duration: 1, position: 0 }
        ],
        categories: [{ id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' }],
        dateRange: { start: '2026-03-22', end: '2026-03-23' }
    };
    setupItineraryData(holidayData);
    render(<Wrapper><ItineraryView /></Wrapper>);
    
    // In ItineraryView, activity name is in a div with className "font-medium"
    const activityNames = screen.getAllByText(/Act/i).filter(el => el.classList.contains('font-medium')).map(el => el.textContent);
    expect(activityNames[0]).toBe('Morning Act');
    expect(activityNames[1]).toBe('Night Act');
    expect(activityNames[2]).toBe('Day 2 Act');
  });

  it('should show empty state message when no activities are assigned', () => {
    const holidayData = {
        activities: [],
        categories: [],
        dateRange: { start: '2026-03-22', end: '2026-03-23' }
    };
    setupItineraryData(holidayData);
    render(<Wrapper><ItineraryView /></Wrapper>);
    expect(screen.getByText(/No activities scheduled yet/i)).toBeDefined();
  });
});
