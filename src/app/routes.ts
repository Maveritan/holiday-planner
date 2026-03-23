import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { CalendarView } from './views/CalendarView';
import { TimelineView } from './views/TimelineView';
import { ItineraryView } from './views/ItineraryView';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
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
