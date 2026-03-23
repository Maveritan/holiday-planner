import React from 'react';
import { Outlet, NavLink } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ActivityPool } from './ActivityPool';
import { DateRangePicker } from './DateRangePicker';
import { SettingsDialog } from './SettingsDialog';
import { LayoutGrid, Calendar, Clock, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/itinerary', label: 'Itinerary', icon: FileText },
];

export function Layout() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Holiday Planner</h1>
              <div className="flex items-center gap-4">
                <DateRangePicker />
                <SettingsDialog />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
            <nav className="p-4 border-b border-gray-200 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ActivityPool />
            </div>
          </aside>

          {/* View Content */}
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </DndProvider>
  );
}
