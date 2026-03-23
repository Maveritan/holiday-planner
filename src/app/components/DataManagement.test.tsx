import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HolidayProvider, useHoliday } from '../context/HolidayContext';
import { DataManagement } from './DataManagement';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper component to display current state for verification
const StateDisplay = () => {
  const { activities, categories, dateRange } = useHoliday();
  return (
    <div>
      <div data-testid="activity-count">{activities.length}</div>
      <div data-testid="category-count">{categories.length}</div>
      <div data-testid="date-range-start">{dateRange.start}</div>
    </div>
  );
};

describe('DataManagement - Export/Import', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('exports data as JSON and can be reimported', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    let exportedData = '';
    const createObjectURL = vi.fn((blob: Blob) => {
      // Read the blob content synchronously-ish for the test
      const reader = new FileReader();
      reader.onload = () => {
        exportedData = reader.result as string;
      };
      reader.readAsText(blob);
      return 'mock-url';
    });
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    
    // Mock document.createElement to handle the download link
    const originalCreateElement = document.createElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = originalCreateElement.call(document, tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = vi.fn();
      }
      return el;
    });
    
    // Don't mock appendChild/removeChild, as it's not strictly necessary and was causing issues.
    // Instead, just make sure to clean up if needed.

    const testData = {
      activities: [{ id: 'test-1', name: 'Test Activity', categoryId: '1', assignedDate: '2024-01-01', slot: 'morning', duration: 1, position: 0 }],
      categories: [{ id: '1', name: 'Test Category', color: '#ff0000', icon: 'Plane' }],
      dateRange: { start: '2024-01-01', end: '2024-01-07' }
    };

    const { unmount } = render(
      <HolidayProvider>
        <StateDisplay />
        <DataManagement />
      </HolidayProvider>
    );

    // Initial state setup (we can use the importState from context indirectly or just check default)
    // For this test, let's first import the testData, then export it, then clear, then reimport.
    
    // 1. Setup initial state by importing
    const initialFile = new File([JSON.stringify(testData)], 'initial.json', { type: 'application/json' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [initialFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('activity-count').textContent).toBe('1');
    });

    // 2. Export the data
    const exportButton = screen.getByText(/Export JSON/i);
    fireEvent.click(exportButton);

    expect(createObjectURL).toHaveBeenCalled();
    
    // Wait for FileReader in the mock to finish
    await waitFor(() => expect(exportedData).not.toBe(''));
    
    const parsedExportedData = JSON.parse(exportedData);
    expect(parsedExportedData.activities).toHaveLength(1);
    expect(parsedExportedData.activities[0].name).toBe('Test Activity');

    // 3. Unmount and remount to clear state (or just clear localStorage and reload)
    unmount();
    localStorage.clear();

    render(
      <HolidayProvider>
        <StateDisplay />
        <DataManagement />
      </HolidayProvider>
    );

    // Verify state is cleared (8 default categories, 0 activities)
    expect(screen.getByTestId('activity-count').textContent).toBe('0');
    expect(screen.getByTestId('category-count').textContent).toBe('8');

    // 4. Reimport the exported data
    const reimportFile = new File([exportedData], 'reexport.json', { type: 'application/json' });
    const reimportInput = screen.getByTestId('file-input');
    fireEvent.change(reimportInput, { target: { files: [reimportFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Data imported successfully!/i)).toBeInTheDocument();
    });

    // 5. Final verification
    expect(screen.getByTestId('activity-count').textContent).toBe('1');
    expect(screen.getByTestId('category-count').textContent).toBe('1');
    expect(screen.getByTestId('date-range-start').textContent).toBe('2024-01-01');

    createElementSpy.mockRestore();
  });

  it('imports data from a JSON string', async () => {
    const testData = {
      activities: [{ id: 'test-1', name: 'Test Activity', categoryId: '1', assignedDate: '2024-01-01', slot: 'morning', duration: 1, position: 0 }],
      categories: [{ id: '1', name: 'Test Category', color: '#ff0000', icon: 'Plane' }],
      dateRange: { start: '2024-01-01', end: '2024-01-07' }
    };

    render(
      <HolidayProvider>
        <StateDisplay />
        <DataManagement />
      </HolidayProvider>
    );

    // Verify initial state (8 default categories)
    expect(screen.getByTestId('category-count').textContent).toBe('8');

    // Simulate file upload
    const file = new File([JSON.stringify(testData)], 'test.json', { type: 'application/json' });
    const input = screen.getByTestId('file-input') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Data imported successfully!/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByTestId('activity-count').textContent).toBe('1');
    expect(screen.getByTestId('category-count').textContent).toBe('1');
    expect(screen.getByTestId('date-range-start').textContent).toBe('2024-01-01');
  });

  it('shows error for invalid JSON', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <HolidayProvider>
        <DataManagement />
      </HolidayProvider>
    );

    const invalidData = { foo: 'bar' };
    const file = new File([JSON.stringify(invalidData)], 'test.json', { type: 'application/json' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON format/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Import failed'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
