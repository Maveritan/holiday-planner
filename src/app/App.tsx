import { RouterProvider } from 'react-router';
import { router } from './routes';
import { HolidayProvider } from './context/HolidayContext';

export default function App() {
  return (
    <HolidayProvider>
      <RouterProvider router={router} />
    </HolidayProvider>
  );
}
