import React from 'react';
import { useHoliday } from '../context/HolidayContext';
import { Loader2, WifiOff } from 'lucide-react';
import { cn } from './ui/utils';

export function SyncStatus() {
  const { isInitialSyncDone, isConnected } = useHoliday();

  if (!isInitialSyncDone) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Syncing with backend...</h2>
        <p className="text-muted-foreground mt-2">Getting your latest holiday plans.</p>
        {!isConnected && (
          <div className="mt-6 flex items-center gap-2 text-destructive animate-pulse">
            <WifiOff className="h-5 w-5" />
            <span>Connection lost. Waiting to reconnect...</span>
          </div>
        )}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-destructive-foreground shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <WifiOff className="size-4" />
        <span className="text-sm font-medium">Offline - Reconnecting...</span>
      </div>
    );
  }

  return null;
}
