import React from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from './ui/dialog';
import { CategoryManager } from './CategoryManager';
import { DataManagement } from './DataManagement';

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage categories and other application settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-8">
          <CategoryManager />
          <hr className="border-gray-200" />
          <DataManagement />
        </div>
      </DialogContent>
    </Dialog>
  );
}
