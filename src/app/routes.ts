import { createBrowserRouter } from 'react-router';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Layout } from './components/Layout';
import { CalendarView } from './views/CalendarView';
import { TimelineView } from './views/TimelineView';
import { ItineraryView } from './views/ItineraryView';
import React from 'react';
import { Loader2 } from 'lucide-react';

const ProtectedLayout = withAuthenticationRequired(Layout, {
  onRedirecting: () => {
    const IS_PROD = import.meta.env.VITE_APP_ENV === 'production';
    
    return React.createElement(
      'div',
      { className: "h-screen w-screen flex items-center justify-center bg-gray-100" },
      React.createElement(
        'div',
        { className: "flex flex-col items-center gap-4 max-w-md text-center" },
        React.createElement(Loader2, { className: "h-12 w-12 animate-spin text-blue-600" }),
        React.createElement('p', { className: "text-gray-600 font-medium" }, "Authenticating..."),
        !IS_PROD && React.createElement('div', { className: "mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800" },
          React.createElement('p', { className: "font-bold mb-1" }, "Stuck on this screen?"),
          React.createElement('p', null, "Self-signed certificates can cause issues with Auth0."),
          React.createElement('ul', { className: "list-disc list-inside text-left mt-1 space-y-1" },
            React.createElement('li', null, React.createElement('a', { href: "/socket.io/", target: "_blank", className: "underline font-bold" }, "Accept the backend certificate (Open in new tab, then refresh)")),
            React.createElement('li', null, "Ensure you've updated the Auth0 Dashboard with https:// urls")
          )
        )
      )
    );
  },
  onBeforeInternalNavigation: () => {
    // Detection: only skip if we are actually at the callback URL and have the params
    const url = new URL(window.location.href);
    const hasAuthParams = url.searchParams.has("code") && url.searchParams.has("state");
    
    console.log("Auth0: onBeforeInternalNavigation check. hasAuthParams:", hasAuthParams);
    if (hasAuthParams) {
      console.log("Auth0: Detected callback params, allowing SDK to handle redirect internally.");
      // If we return false here, we might block the SDK from performing its final redirect back to the app, 
      // which might be what's causing it to "hang" in the loading state.
      return true; 
    }
    return true;
  },
});

export const router = createBrowserRouter([
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      {
        index: true,
        Component: TimelineView,
      },
      {
        path: 'timeline',
        Component: TimelineView,
      },
      {
        path: 'calendar',
        Component: CalendarView,
      },
      {
        path: 'itinerary',
        Component: ItineraryView,
      },
    ],
  },
]);
