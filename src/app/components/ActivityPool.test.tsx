import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityPool } from './ActivityPool';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndProvider backend={HTML5Backend}>
    <HolidayProvider>
      {children}
    </HolidayProvider>
  </DndProvider>
);

describe('ActivityPool', () => {
  it('should keep the form open after adding an activity', async () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <HolidayProvider>
          <ActivityPool />
        </HolidayProvider>
      </DndProvider>
    );

    // 1. Open the form
    const addButton = screen.getByLabelText(/add activity/i);
    fireEvent.click(addButton);

    const input = screen.getByPlaceholderText(/activity name/i);
    const submitButton = screen.getByRole('button', { name: /^add$/i });

    // 2. Add first activity
    fireEvent.change(input, { target: { value: 'First Activity' } });
    fireEvent.click(submitButton);

    // 3. Verify activity added and form STILL visible
    expect(screen.getByText('First Activity')).toBeDefined();
    expect(screen.getByPlaceholderText(/activity name/i)).toBeDefined();
    expect(input).toHaveValue('');

    // 4. Add second activity
    fireEvent.change(input, { target: { value: 'Second Activity' } });
    fireEvent.click(submitButton);

    // 5. Verify both activities added and form STILL visible
    expect(screen.getByText('First Activity')).toBeDefined();
    expect(screen.getByText('Second Activity')).toBeDefined();
    expect(screen.getByPlaceholderText(/activity name/i)).toBeDefined();
    expect(input).toHaveValue('');
    
    // 6. Close the form manually
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // 7. Verify form is closed
    expect(screen.queryByPlaceholderText(/activity name/i)).toBeNull();
  });

  it('should render activities in the pool', async () => {
    render(
      <TestWrapper>
        <ActivityPool />
      </TestWrapper>
    );

    // Add activity
    const addButton = screen.getByLabelText(/add activity/i);
    fireEvent.click(addButton);
    const input = screen.getByPlaceholderText(/activity name/i);
    const submitButton = screen.getByRole('button', { name: /^add$/i });
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Test')).toBeDefined();
  });

  it('should allow reordering activities in the pool', async () => {
    render(
      <TestWrapper>
        <ActivityPool />
      </TestWrapper>
    );

    // Add multiple activities
    const addButton = screen.getByLabelText(/add activity/i);
    fireEvent.click(addButton);
    const input = screen.getByPlaceholderText(/activity name/i);
    const submitButton = screen.getByRole('button', { name: /^add$/i });

    fireEvent.change(input, { target: { value: 'Activity A' } });
    fireEvent.click(submitButton);
    fireEvent.change(input, { target: { value: 'Activity B' } });
    fireEvent.click(submitButton);

    // Latest should be at the top: B then A
    const activities = screen.getAllByText(/Activity [AB]/);
    expect(activities[0].textContent).toBe('Activity B');
    expect(activities[1].textContent).toBe('Activity A');
  });

  it('should assign new activities to the top of the pool', async () => {
    render(
      <TestWrapper>
        <ActivityPool />
      </TestWrapper>
    );

    const addButton = screen.getByLabelText(/add activity/i);
    fireEvent.click(addButton);
    const input = screen.getByPlaceholderText(/activity name/i);
    const submitButton = screen.getByRole('button', { name: /^add$/i });

    fireEvent.change(input, { target: { value: 'First' } });
    fireEvent.click(submitButton);
    fireEvent.change(input, { target: { value: 'Second' } });
    fireEvent.click(submitButton);

    const items = screen.getAllByText(/First|Second/);
    expect(items[0].textContent).toBe('Second');
    expect(items[1].textContent).toBe('First');
  });
});
