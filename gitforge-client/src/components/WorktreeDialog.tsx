'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getWorktrees, addWorktree, removeWorktree } from '@/lib/electron';
import { Loader2, Plus, Trash, FolderOpen } from 'lucide-react';

interface WorktreeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
}

interface Worktree {
    path: string;
    head: string;
    branch: string;
}

type ElectronWindow = Window & {
    require?: (module: string) => { ipcRenderer: { invoke: (channel: string) => Promise<{ canceled: boolean; filePaths: string[] }> } };
};

export default function WorktreeDialog({ open, onOpenChange, repoPath }: WorktreeDialogProps) {
    const [worktrees, setWorktrees] = useState<Worktree[]>([]);
    const [newPath, setNewPath] = useState('');
    const [newBranch, setNewBranch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const loadWorktrees = useCallback(async () => {
        try {
            const output = await getWorktrees(repoPath);
            // Output format usually:
            // /path/to/repo  (HEAD detached at ...)
            // /path/to/worktree  [branch]
            const lines = output.split('\n').filter(Boolean);
            // Simple parsing assuming standard output
            // Depending on git version, format might vary.
            // Using `git worktree list` text output.
            const parsed: Worktree[] = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // It's space separated but path can contain spaces?
                // Usually: path commit-hash [branch]
                // Let's just store the line for now or simple split
                const parts = line.split(/\s+/);
                const path = parts[0];
                const head = parts[1];
                const branch = parts.slice(2).join(' ').replace('[', '').replace(']', '');
                parsed.push({ path, head, branch });
            }
            setWorktrees(parsed);
        } catch (e) {
            console.error(e);
        }
    }, [repoPath]);

    useEffect(() => {
        if (open && repoPath) {
            loadWorktrees();
        }
    }, [open, repoPath, loadWorktrees]);

    const handleAdd = async () => {
        if (!newPath || !newBranch) return;
        setActionLoading(true);
        try {
            await addWorktree(repoPath, newPath, newBranch);
            setNewPath('');
            setNewBranch('');
            await loadWorktrees();
        } catch (e: unknown) {
            alert('Failed to add worktree: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (path: string) => {
        if (!confirm(`Remove worktree at ${path}?`)) return;
        setActionLoading(true);
        try {
            await removeWorktree(repoPath, path);
            await loadWorktrees();
        } catch (e: unknown) {
            alert('Failed to remove worktree: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleBrowse = async () => {
        const electronWindow = window as ElectronWindow;
        if (typeof window !== 'undefined' && electronWindow.require) {
            const { ipcRenderer } = electronWindow.require('electron');
            const result = await ipcRenderer.invoke('dialog:openDirectory');
            if (result && !result.canceled && result.filePaths.length > 0) {
                setNewPath(result.filePaths[0]);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Worktrees</DialogTitle>
                    <DialogDescription>
                        Checkout multiple branches simultaneously in separate directories.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <div className="border rounded-md">
                        {worktrees.map((wt, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b last:border-0 text-sm">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-mono truncate" title={wt.path}>{wt.path}</span>
                                    <span className="text-muted-foreground text-xs">{wt.branch || wt.head}</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRemove(wt.path)} 
                                    disabled={i === 0 || actionLoading} // Usually first one is main worktree
                                    title={i === 0 ? "Main worktree cannot be removed" : "Remove Worktree"}
                                >
                                    <Trash className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4 p-4 bg-muted/50 rounded-md">
                        <div className="text-sm font-medium">Add New Worktree</div>
                        <div className="grid grid-cols-4 items-center gap-2">
                            <Label className="text-right">Path</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="/path/to/new/folder" />
                                <Button variant="outline" size="icon" onClick={handleBrowse}><FolderOpen className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-2">
                            <Label className="text-right">New Branch</Label>
                            <Input value={newBranch} onChange={e => setNewBranch(e.target.value)} placeholder="branch-name" className="col-span-3" />
                        </div>
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleAdd} disabled={!newPath || !newBranch || actionLoading}>
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add Worktree</>}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
