'use client';

import React, { useMemo } from 'react';
import { computeDiff, alignDiffChanges } from '@/lib/simpleDiff';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InternalDiffViewProps {
    original: string;
    modified: string;
    language?: string;
    renderSideBySide?: boolean;
}

export default function InternalDiffView({ original, modified, renderSideBySide = true }: InternalDiffViewProps) {
    const changes = useMemo(() => computeDiff(original, modified), [original, modified]);
    const alignedRows = useMemo(() => alignDiffChanges(changes), [changes]);

    if (renderSideBySide) {
        return (
            <div className="flex h-full font-mono text-xs bg-white dark:bg-slate-950 overflow-auto">
                <div className="w-1/2 border-r flex flex-col">
                    {alignedRows.map((row, i) => (
                        <div key={i} className={`flex ${row.left?.type === 'delete' ? 'bg-red-100 dark:bg-red-900/20' : ''} h-5`}>
                            <span className="w-8 text-right text-gray-400 select-none mr-2 bg-slate-50 dark:bg-slate-900 px-1 border-r border-transparent">
                                {row.left?.originalLine || ''}
                            </span>
                            <span className={`whitespace-pre flex-1 ${!row.left ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''}`}>
                                {row.left?.content || ''}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="w-1/2 flex flex-col">
                     {alignedRows.map((row, i) => (
                        <div key={i} className={`flex ${row.right?.type === 'insert' ? 'bg-green-100 dark:bg-green-900/20' : ''} h-5`}>
                            <span className="w-8 text-right text-gray-400 select-none mr-2 bg-slate-50 dark:bg-slate-900 px-1 border-r border-transparent">
                                {row.right?.modifiedLine || ''}
                            </span>
                            <span className={`whitespace-pre flex-1 ${!row.right ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''}`}>
                                {row.right?.content || ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Inline View
    return (
        <div className="h-full font-mono text-xs bg-white dark:bg-slate-950 overflow-auto">
            {changes.map((change, i) => {
                let bgClass = '';
                if (change.type === 'insert') bgClass = 'bg-green-100 dark:bg-green-900/20';
                if (change.type === 'delete') bgClass = 'bg-red-100 dark:bg-red-900/20';
                
                return (
                    <div key={i} className={`flex ${bgClass} h-5`}>
                        <div className="flex w-16 text-gray-400 select-none bg-slate-50 dark:bg-slate-900 border-r mr-2">
                            <span className="w-8 text-right pr-1">{change.originalLine || ''}</span>
                            <span className="w-8 text-right pr-1">{change.modifiedLine || ''}</span>
                        </div>
                        <div className="flex-1 whitespace-pre">
                            {change.type === 'insert' && '+ '}
                            {change.type === 'delete' && '- '}
                            {change.type === 'keep' && '  '}
                            {change.content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
