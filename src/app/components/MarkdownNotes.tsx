import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { autoLinkUrls } from '../utils/markdown';

const MarkdownNotes = memo(({ notes }: { notes: string }) => {
  const autoLinked = autoLinkUrls(notes);

  const components: Record<string, any> = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a href={href} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
    ),
  };

  return (
      <div className="pro prose-sm max-w-none">
        <ReactMarkdown components={components}>{autoLinked}</ReactMarkdown>
      </div>
  );
});

export default MarkdownNotes;
