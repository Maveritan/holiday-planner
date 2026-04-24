import React, { memo } from 'react';
import { useHoliday } from '../context/HolidayContext';
import MarkdownNotes from '../components/MarkdownNotes';
import { Pencil, Save, X } from 'lucide-react';

export function ResearchView() {
  const { researchContent, updateResearchContent } = useHoliday();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(researchContent || '');
  const prevIsEditingRef = React.useRef(isEditing);

  React.useEffect(() => {
    if (!isEditing && prevIsEditingRef.current === true) {
      setEditContent(researchContent || '');
    }
    prevIsEditingRef.current = isEditing;
  }, [researchContent, isEditing]);

  const handleSave = () => {
    updateResearchContent(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(researchContent || '');
    setIsEditing(false);
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 border-b-2 border-gray-300 pb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Research & Notes</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Write your research notes here... You can use markdown formatting and paste links."
            className="w-full min-h-[60vh] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
          />
        ) : (
          <div className="min-h-[60vh]">
            {researchContent ? (
              <MarkdownNotes notes={researchContent} />
            ) : (
              <p className="text-gray-400 italic mt-8">No research notes yet. Click "Edit" to add some.</p>
            )}
          </div>
        )}

        {/* Help text */}
        {!isEditing && !researchContent && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Getting started</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
              <li>Paste links to research articles, booking pages, or travel guides</li>
              <li>Use markdown formatting for headings, lists, and emphasis</li>
              <li>Add notes about activities you're considering</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
