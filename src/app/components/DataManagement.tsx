import React, { useState, useRef } from 'react';
import { Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useHoliday } from '../context/HolidayContext';
import { HolidayData } from '../types';

export function DataManagement() {
  const { activities, categories, dateRange, importState } = useHoliday();
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data: HolidayData = {
      activities,
      categories,
      dateRange,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `holiday-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', message: 'Data exported successfully!' });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  const validateAndImport = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Basic validation of the shape
      if (
        !data ||
        typeof data !== 'object' ||
        !Array.isArray(data.activities) ||
        !Array.isArray(data.categories) ||
        !data.dateRange ||
        typeof data.dateRange.start !== 'string' ||
        typeof data.dateRange.end !== 'string'
      ) {
        throw new Error('Invalid JSON format: missing required fields or incorrect data types.');
      }

      importState(data as HolidayData);
      setStatus({ type: 'success', message: 'Data imported successfully!' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to parse JSON file.' 
      });
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          validateAndImport(result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          validateAndImport(result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-gray-700">Backup & Restore</h3>
        
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
            data-testid="file-input"
          />
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <FileJson className={`w-10 h-10 mb-2 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 text-center">
            {dragActive ? 'Drop your JSON file here' : 'Drag and drop your JSON backup here to restore'}
          </p>
        </div>

        {status.type && (
          <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
