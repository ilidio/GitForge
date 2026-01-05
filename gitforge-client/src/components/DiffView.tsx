'use client';

import { DiffEditor, loader } from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';

interface DiffViewProps {
  original: string;
  modified: string;
  language?: string;
  theme?: 'vs-light' | 'vs-dark';
  renderSideBySide?: boolean;
}

export default function DiffView({ 
    original, 
    modified, 
    language = 'plaintext', 
    theme = 'vs-light',
    renderSideBySide = true
}: DiffViewProps) {
  const [mounted, setMounted] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    import('monaco-editor').then((monaco) => {
      loader.config({ monaco });
      setMounted(true);
    });
  }, []);

  // Debounce the editor rendering to ensure previous instances are cleanly disposed
  useEffect(() => {
    setShowEditor(false);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
        setShowEditor(true);
    }, 50); // 50ms delay to allow cleanup

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [original, modified]);

  if (!mounted || !showEditor) return (
      <div className="h-full flex items-center justify-center bg-white border rounded-md text-xs text-muted-foreground">
          Loading diff...
      </div>
  );

  const hasConflicts = modified.includes('<<<<<<<') && modified.includes('=======') && modified.includes('>>>>>>>');

  return (
    <div className="h-full border rounded-md overflow-hidden bg-white flex flex-col">
      {hasConflicts && (
          <div className="bg-destructive text-destructive-foreground px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-center">
              Merge Conflicts Detected in this file
          </div>
      )}
      <div className="flex-1">
        <DiffEditor
            height="100%"
            language={language} 
            original={original}
            modified={modified}
            theme={theme}
            options={{
            readOnly: true,
            minimap: { enabled: false },
            renderSideBySide: renderSideBySide,
            automaticLayout: true,
            }}
        />
      </div>
    </div>
  );
}
