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
import { Calendar, Clock, FileText, Loader2, Menu, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';

const NAV_ITEMS = [
  { path: '/calendar', label: 'Calendar', Icon: Calendar },
  { path: '/timeline', label: 'Timeline', Icon: Clock },
  { path: '/itinerary', label: 'Itinerary', Icon: FileText },
  { path: '/research', label: 'Research', Icon: BookOpen },
];

export function Layout() {
  const { isLoading, error } = useAuth0();
  const [showAnyway, setShowAnyway] = React.useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isItinerary = location.pathname === '/itinerary';
  const isResearch = location.pathname === '/research';
  const hideActivityDrawer = isItinerary || isResearch;
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
    <TooltipProvider>
      <nav className={cn(
        "p-2 space-y-2 flex-none flex flex-col items-stretch",
        isCollapsed && !isMobile ? "items-center" : "px-4 pt-4"
      )}>
        {NAV_ITEMS.map((item) => {
          const navLink = (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsDrawerOpen(false)}
              className="block"
            >
              {({ isActive }) => (
                <div className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isCollapsed && !isMobile 
                    ? "w-11 h-11 justify-center p-0" 
                    : "px-3 py-2.5 w-full",
                  isActive 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                )}>
                  <item.Icon 
                    className={cn(
                      "shrink-0 transition-colors duration-200", 
                      isCollapsed && !isMobile ? "w-6 h-6" : "w-4 h-4", 
                      isActive ? "text-white" : "text-gray-600"
                    )} 
                  />
                  {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                </div>
              )}
            </NavLink>
          );

          if (isCollapsed && !isMobile) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {navLink}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navLink;
        })}
      </nav>

      {(!isCollapsed || isMobile) && (
        <>
          <Separator />
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ActivityPool />
          </div>
        </>
      )}

      {!isMobile && (
        <div className="mt-auto">
          <Separator />
          <div className="p-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "transition-all duration-200",
                isCollapsed ? "w-10 h-10 p-0" : "w-full justify-start px-3"
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
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
            <aside className={cn(
              "bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-300",
              isCollapsed ? "w-16" : "w-80"
            )}>
              <SidebarContent />
            </aside>
          )}

          {/* View Content */}
          <main className={`flex-1 overflow-hidden flex flex-col ${isMobile && !hideActivityDrawer ? 'pb-32' : ''}`}>
            <Outlet />
          </main>
        </div>

        {/* Mobile Activity Pool */}
        {isMobile && !hideActivityDrawer && (
          <div className="fixed bottom-0 left-0 right-0 h-32 z-40">
            <ActivityPool />
          </div>
        )}
      </div>
    </DndProvider>
  );
}
