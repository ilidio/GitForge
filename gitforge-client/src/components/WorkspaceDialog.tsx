
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Folder, Trash, FolderOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Workspace {
    id: string;
    name: string;
    repos: string[];
}

interface WorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaces: Workspace[];
    onSave: (workspaces: Workspace[]) => void;
}

export default function WorkspaceDialog({ open, onOpenChange, workspaces, onSave }: WorkspaceDialogProps) {
    const [localWorkspaces, setLocalWorkspaces] = useState<Workspace[]>(workspaces);
    const [newWsName, setNewWsName] = useState('');
    const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
    const [newRepoPath, setNewRepoPath] = useState('');

    useEffect(() => {
        setLocalWorkspaces(workspaces);
    }, [workspaces, open]);

    const addWorkspace = () => {
        if (!newWsName) return;
        setLocalWorkspaces([...localWorkspaces, { id: Date.now().toString(), name: newWsName, repos: [] }]);
        setNewWsName('');
    };

    const deleteWorkspace = (id: string) => {
        setLocalWorkspaces(localWorkspaces.filter(w => w.id !== id));
        if (selectedWsId === id) setSelectedWsId(null);
    };

    const addRepoToWorkspace = () => {
        if (!selectedWsId || !newRepoPath) return;
        setLocalWorkspaces(localWorkspaces.map(w => {
            if (w.id === selectedWsId) {
                return { ...w, repos: [...w.repos, newRepoPath] };
            }
            return w;
        }));
        setNewRepoPath('');
    };

    const removeRepoFromWorkspace = (wsId: string, repo: string) => {
        setLocalWorkspaces(localWorkspaces.map(w => {
            if (w.id === wsId) {
                return { ...w, repos: w.repos.filter(r => r !== repo) };
            }
            return w;
        }));
    };

    const handleSave = () => {
        onSave(localWorkspaces);
        onOpenChange(false);
    };

    const selectedWs = localWorkspaces.find(w => w.id === selectedWsId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Workspaces</DialogTitle>
                    <DialogDescription>Create and organize repository groups for easier access.</DialogDescription>
                </DialogHeader>
                
                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Left: List of Workspaces */}
                    <div className="w-1/3 border-r pr-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="New Workspace" 
                                value={newWsName} 
                                onChange={e => setNewWsName(e.target.value)}
                                className="h-8 text-xs"
                            />
                            <Button size="sm" onClick={addWorkspace} disabled={!newWsName} className="h-8 w-8 p-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="space-y-1">
                                {localWorkspaces.map(w => (
                                    <div 
                                        key={w.id} 
                                        className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${selectedWsId === w.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                                        onClick={() => setSelectedWsId(w.id)}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Folder className="h-4 w-4" />
                                            <span className="truncate">{w.name}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 opacity-50 hover:opacity-100 hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); deleteWorkspace(w.id); }}
                                        >
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: Repos in selected Workspace */}
                    <div className="flex-1 flex flex-col gap-2">
                        {selectedWs ? (
                            <>
                                <h3 className="font-medium flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    {selectedWs.name}
                                </h3>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Add Repo Path..." 
                                        value={newRepoPath} 
                                        onChange={e => setNewRepoPath(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <Button size="sm" onClick={addRepoToWorkspace} disabled={!newRepoPath} className="h-8">
                                        Add
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 border rounded p-2">
                                    {selectedWs.repos.length === 0 && <div className="text-muted-foreground text-xs italic">No repositories in this workspace.</div>}
                                    {selectedWs.repos.map((repo, i) => (
                                        <div key={i} className="flex items-center justify-between p-1 hover:bg-muted rounded text-sm group">
                                            <span className="truncate font-mono text-xs" title={repo}>{repo}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                                onClick={() => removeRepoFromWorkspace(selectedWs.id, repo)}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground italic">
                                Select a workspace to manage repositories.
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
