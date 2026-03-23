import React, { useState, useRef, useEffect } from 'react';
import { useHoliday } from '../context/HolidayContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DayPicker, DateRange as DayPickerDateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export function DateRangePicker() {
  const { dateRange, setDateRange } = useHoliday();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DayPickerDateRange | undefined>(() => ({
    from: new Date(dateRange.start),
    to: new Date(dateRange.end),
  }));
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (range: DayPickerDateRange | undefined) => {
    setSelectedRange(range);
    
    // If both dates are selected, update the date range
    if (range?.from && range?.to) {
      const formatDateToISO = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setDateRange({
        start: formatDateToISO(range.from),
        end: formatDateToISO(range.to),
      });
      // Close after a short delay to show the selection
      setTimeout(() => setIsOpen(false), 300);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
      >
        <CalendarIcon className="w-5 h-5 text-gray-600" />
        <span className="font-medium">
          {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={1}
            className="holiday-planner-calendar"
          />
        </div>
      )}
    </div>
  );
}