import React from 'react';
import { Outlet, NavLink } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ActivityPool } from './ActivityPool';
import { DateRangePicker } from './DateRangePicker';
import { SettingsDialog } from './SettingsDialog';
import { AuthNav } from './AuthNav';
import { LayoutGrid, Calendar, Clock, FileText, Loader2 } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/itinerary', label: 'Itinerary', icon: FileText },
];

export function Layout() {
  const { isLoading, error } = useAuth0();
  const [showAnyway, setShowAnyway] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowAnyway(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
        <p className="text-gray-700">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading && !showAnyway) {
    const IS_PROD = import.meta.env.VITE_APP_ENV === 'production';
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading Holiday Planner...</p>
          {!IS_PROD && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-bold mb-1">Stuck on this screen?</p>
              <p>Ensure your IP/hostname is allowed in Auth0 Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
                <AuthNav />
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
