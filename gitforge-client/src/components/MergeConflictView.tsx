'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { DiffEditor, loader } from '@monaco-editor/react';
import { writeFile } from '@/lib/electron';

interface MergeConflictViewProps {
    filePath: string;
    content: string;
    onResolve: () => void;
    repoPath: string;
}

interface ConflictBlock {
    id: number;
    startLine: number;
    endLine: number;
    currentContent: string;
    incomingContent: string;
    originalContent?: string; // For 3-way if available, mostly not in standard output
    state: 'conflict' | 'current' | 'incoming' | 'both';
}

export default function MergeConflictView({ filePath, content, onResolve, repoPath }: MergeConflictViewProps) {
    const [blocks, setBlocks] = useState<ConflictBlock[]>([]);
    const [lines, setLines] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        parseConflicts(content);
    }, [content]);

    const parseConflicts = (text: string) => {
        const lines = text.split('\n');
        setLines(lines);
        const parsedBlocks: ConflictBlock[] = [];
        let inConflict = false;
        let startLine = 0;
        let currentStart = 0;
        let separator = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('<<<<<<<')) {
                inConflict = true;
                startLine = i;
                currentStart = i + 1;
            } else if (line.startsWith('=======')) {
                separator = i;
            } else if (line.startsWith('>>>>>>>')) {
                if (inConflict) {
                    parsedBlocks.push({
                        id: parsedBlocks.length,
                        startLine,
                        endLine: i,
                        currentContent: lines.slice(currentStart, separator).join('\n'),
                        incomingContent: lines.slice(separator + 1, i).join('\n'),
                        state: 'conflict'
                    });
                    inConflict = false;
                }
            }
        }
        setBlocks(parsedBlocks);
    };

    const resolveBlock = (id: number, choice: 'current' | 'incoming' | 'both') => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, state: choice } : b));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let result: string[] = [];
            let lastIndex = 0;

            for (const block of blocks) {
                // Add content before conflict
                result.push(...lines.slice(lastIndex, block.startLine));
                
                // Add resolved content
                if (block.state === 'current') {
                    result.push(block.currentContent);
                } else if (block.state === 'incoming') {
                    result.push(block.incomingContent);
                } else if (block.state === 'both') {
                    result.push(block.currentContent);
                    result.push(block.incomingContent);
                } else {
                    // If still conflict, keep markers? Or force resolve?
                    // Ideally we shouldn't allow save if conflicts remain, but for now we keep markers
                    result.push(...lines.slice(block.startLine, block.endLine + 1));
                }
                lastIndex = block.endLine + 1;
            }
            // Add remaining content
            result.push(...lines.slice(lastIndex));

            await writeFile(`${repoPath}/${filePath}`, result.join('\n'));
            onResolve();
        } catch (e) {
            console.error(e);
            alert('Failed to save file');
        } finally {
            setLoading(false);
        }
    };

    const remainingConflicts = blocks.filter(b => b.state === 'conflict').length;

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-12 border-b flex items-center justify-between px-4 bg-yellow-500/10 text-yellow-500">
                <span className="font-bold flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    Merge Conflict: {filePath}
                </span>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-mono">{remainingConflicts} remaining</span>
                    <Button size="sm" onClick={handleSave} disabled={loading || remainingConflicts > 0}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        Save & Resolve
                    </Button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {blocks.map(block => (
                    <div key={block.id} className={`border rounded-lg overflow-hidden ${block.state === 'conflict' ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'border-green-500/30 opacity-60'}`}>
                        <div className="grid grid-cols-2 divide-x h-full min-h-[100px]">
                            <div className="flex flex-col">
                                <div className="bg-muted/30 p-2 text-xs font-bold text-center border-b">Current Change (HEAD)</div>
                                <div className="p-2 font-mono text-xs whitespace-pre-wrap flex-1 bg-background">{block.currentContent}</div>
                                <Button 
                                    variant={block.state === 'current' ? 'default' : 'secondary'}
                                    className="rounded-none h-8 text-xs"
                                    onClick={() => resolveBlock(block.id, 'current')}
                                >
                                    Accept Current
                                </Button>
                            </div>
                            <div className="flex flex-col">
                                <div className="bg-muted/30 p-2 text-xs font-bold text-center border-b">Incoming Change</div>
                                <div className="p-2 font-mono text-xs whitespace-pre-wrap flex-1 bg-background">{block.incomingContent}</div>
                                <Button 
                                    variant={block.state === 'incoming' ? 'default' : 'secondary'}
                                    className="rounded-none h-8 text-xs"
                                    onClick={() => resolveBlock(block.id, 'incoming')}
                                >
                                    Accept Incoming
                                </Button>
                            </div>
                        </div>
                        <Button 
                            variant={block.state === 'both' ? 'default' : 'outline'}
                            className="w-full rounded-none h-8 text-xs border-t"
                            onClick={() => resolveBlock(block.id, 'both')}
                        >
                            Accept Both
                        </Button>
                    </div>
                ))}
                
                {blocks.length === 0 && (
                    <div className="text-center text-muted-foreground p-10">
                        No conflict markers found. The file might be binary or already resolved.
                    </div>
                )}
            </div>
        </div>
    );
}
