'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { applyPatch } from '@/lib/electron';
import { Check, Plus, Minus } from 'lucide-react';

interface PatchViewProps {
    diff: string;
    repoPath: string;
    onStage: () => void;
    isStaged: boolean; // if true, we are unstaging (reverse apply)
}

interface Hunk {
    header: string;
    lines: string[];
    content: string;
}

export default function PatchView({ diff, repoPath, onStage, isStaged }: PatchViewProps) {
    const hunks = useMemo(() => {
        const lines = diff.split('\n');
        const hunks: Hunk[] = [];
        let currentHunk: Hunk | null = null;
        let headerLines: string[] = [];

        // Parse Git Diff to find Hunks
        // Header looks like: `diff --git ...` until `@@ ... @@`
        
        let inHeader = true;
        let fileHeader = '';

        for (const line of lines) {
            if (line.startsWith('diff --git')) {
                inHeader = true;
                fileHeader = line + '\n';
                continue;
            }
            if (inHeader && !line.startsWith('@@')) {
                fileHeader += line + '\n';
                continue;
            }
            
            if (line.startsWith('@@')) {
                inHeader = false;
                if (currentHunk) hunks.push(currentHunk);
                currentHunk = {
                    header: line,
                    lines: [],
                    content: '' 
                };
                // Hunk must include the file header to be a valid patch for `git apply`?
                // `git apply` usually needs the `diff --git` header if we are creating a full patch.
                // But `git apply` can sometimes accept just the hunk if context matches.
                // However, for safety, we should prepend the File Header to EACH hunk when applying.
                // So let's store it.
                currentHunk.content = fileHeader + line + '\n';
            } else if (currentHunk) {
                currentHunk.lines.push(line);
                currentHunk.content += line + '\n';
            }
        }
        if (currentHunk) hunks.push(currentHunk);
        
        return hunks;
    }, [diff]);

    const handleStageHunk = async (hunk: Hunk) => {
        try {
            // if isStaged is true, we want to UNSTAGE. 
            // `git apply --cached --reverse` unstages.
            // `git apply --cached` stages.
            await applyPatch(repoPath, hunk.content, true, isStaged);
            onStage(); // Refresh
        } catch (e) {
            alert('Failed to apply hunk: ' + e);
        }
    };

    return (
        <ScrollArea className="h-full bg-background font-mono text-xs">
            <div className="p-4 space-y-4">
                {hunks.map((hunk, i) => (
                    <div key={i} className="border rounded-md overflow-hidden bg-card shadow-sm">
                        <div className="flex justify-between items-center bg-muted/50 px-2 py-1 border-b">
                            <span className="text-muted-foreground">{hunk.header}</span>
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-6 text-[10px]"
                                onClick={() => handleStageHunk(hunk)}
                            >
                                {isStaged ? 'Unstage Hunk' : 'Stage Hunk'}
                            </Button>
                        </div>
                        <div className="p-2 whitespace-pre overflow-x-auto">
                            {hunk.lines.map((line, j) => (
                                <div key={j} className={
                                    line.startsWith('+') ? 'bg-green-500/10 text-green-600' :
                                    line.startsWith('-') ? 'bg-red-500/10 text-red-600' :
                                    'text-muted-foreground'
                                }>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {hunks.length === 0 && <div className="text-center p-8 text-muted-foreground">No changes found (Binary file or empty diff)</div>}
            </div>
        </ScrollArea>
    );
}
