'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getReflog, checkout, reset } from '@/lib/electron';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Loader2, RotateCcw, ArrowRight } from 'lucide-react';

interface ReflogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
    onActionComplete: () => void;
}

export default function ReflogDialog({ open, onOpenChange, repoPath, onActionComplete }: ReflogDialogProps) {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (open && repoPath) {
            loadReflog();
        }
    }, [open, repoPath]);

    const loadReflog = async () => {
        setLoading(true);
        try {
            const output = await getReflog(repoPath, 100);
            const lines = output.split('\n').filter(Boolean);
            const parsed = lines.map((line: string) => {
                const parts = line.split('|');
                return {
                    id: parts[0],
                    ref: parts[1],
                    message: parts[2]
                };
            });
            setEntries(parsed);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (id: string) => {
        setActionLoading(true);
        try {
            await checkout(repoPath, id);
            onActionComplete();
            onOpenChange(false);
        } catch(e) {
            alert('Failed to checkout');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReset = async (id: string) => {
        if(!confirm(`Hard reset current branch to ${id}? This will discard changes.`)) return;
        setActionLoading(true);
        try {
            await reset(repoPath, id, 'hard');
            onActionComplete();
            onOpenChange(false);
        } catch(e) {
            alert('Failed to reset');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Repository Reflog</DialogTitle>
                    <DialogDescription>
                        View local history of HEAD updates. Useful for recovering lost commits.
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center items-center flex-1"><Loader2 className="animate-spin" /></div>
                ) : (
                    <ScrollArea className="flex-1 border rounded bg-muted/10 p-2">
                        <div className="space-y-1">
                            {entries.map((entry, i) => (
                                <ContextMenu key={i}>
                                    <ContextMenuTrigger>
                                        <div className="flex items-center gap-4 p-2 text-xs hover:bg-muted rounded cursor-default font-mono">
                                            <span className="text-yellow-600 dark:text-yellow-400 font-bold w-20">{entry.id.substring(0,7)}</span>
                                            <span className="text-blue-500 w-24">{entry.ref}</span>
                                            <span className="truncate flex-1">{entry.message}</span>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => handleCheckout(entry.id)}>
                                            <ArrowRight className="w-3 h-3 mr-2" /> Checkout
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => handleReset(entry.id)}>
                                            <RotateCcw className="w-3 h-3 mr-2" /> Hard Reset to Here
                                        </ContextMenuItem>
                                        <ContextMenuItem onClick={() => navigator.clipboard.writeText(entry.id)}>
                                            Copy SHA
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
