import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { ActivityPool } from './ActivityPool';
import { SyncStatus } from './SyncStatus';
import { CustomDragLayer } from './CustomDragLayer';
import { DateRangePicker } from './DateRangePicker';
import { SettingsDialog } from './SettingsDialog';
import { AuthNav } from './AuthNav';
import { LayoutGrid, Calendar, Clock, FileText, Loader2, Menu } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';

const NAV_ITEMS = [
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/itinerary', label: 'Itinerary', icon: FileText },
];

export function Layout() {
  const { isLoading, error } = useAuth0();
  const [showAnyway, setShowAnyway] = React.useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isItinerary = location.pathname === '/itinerary';
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

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

  const SidebarContent = () => (
    <>
      {isMobile && (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <AuthNav />
          <SettingsDialog />
        </div>
      )}
      <nav className="p-4 border-b border-gray-200 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsDrawerOpen(false)}
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
        {!isMobile && <ActivityPool />}
      </div>
    </>
  );

  return (
    <DndProvider 
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { 
        enableMouseEvents: true, 
        delayTouchStart: 200, // Increased delay to allow scrolling to take precedence
        triggerKind: 'press'  // Specifically wait for a press/hold
      } : undefined}
    >
      {isMobile && <CustomDragLayer />}
      <SyncStatus />
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 shrink-0">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="-ml-2">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80 flex flex-col">
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Holiday Planner</SheetTitle>
                      </SheetHeader>
                      <SidebarContent />
                    </SheetContent>
                  </Sheet>
                )}
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate hidden md:block">Holiday Planner</h1>
              </div>
              <div className="flex items-center gap-1 md:gap-4">
                <DateRangePicker />
                {!isMobile && (
                  <>
                    <SettingsDialog />
                    <AuthNav />
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
              <SidebarContent />
            </aside>
          )}

          {/* View Content */}
          <main className={`flex-1 overflow-hidden flex flex-col ${isMobile && !isItinerary ? 'pb-32' : ''}`}>
            <Outlet />
          </main>
        </div>

        {/* Mobile Activity Pool */}
        {isMobile && !isItinerary && (
          <div className="fixed bottom-0 left-0 right-0 h-32 z-40">
            <ActivityPool />
          </div>
        )}
      </div>
    </DndProvider>
  );
}
