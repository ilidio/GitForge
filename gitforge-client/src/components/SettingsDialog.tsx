'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getConfig, setConfig, getRemotes, addRemote, removeRemote } from '@/lib/electron';
import { Trash, Plus, Save, Loader2 } from 'lucide-react';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
}

export default function SettingsDialog({ open, onOpenChange, repoPath }: SettingsDialogProps) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [newRemoteName, setNewRemoteName] = useState('');
    const [newRemoteUrl, setNewRemoteUrl] = useState('');
    
    // Tools
    const [diffTool, setDiffTool] = useState('');

    const loadSettings = async () => {
        if (!repoPath || !open) return;
        setLoading(true);
        try {
            const config = await getConfig(repoPath);
            const lines = config.split('\n');
            let name = '';
            let email = '';
            let tool = '';
            for (const line of lines) {
                if (line.startsWith('user.name=')) name = line.substring(10);
                if (line.startsWith('user.email=')) email = line.substring(11);
                if (line.startsWith('diff.tool=')) tool = line.substring(10);
            }
            setUserName(name);
            setUserEmail(email);
            setDiffTool(tool);

            const remotesData = await getRemotes(repoPath);
            setRemotes(remotesData.split('\n').filter((r: string) => r.trim() !== ''));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [open, repoPath]);

    const handleSaveUser = async () => {
        try {
            await setConfig(repoPath, 'user.name', userName);
            await setConfig(repoPath, 'user.email', userEmail);
            alert('User config saved!');
        } catch (e) {
            alert('Failed to save config');
        }
    };

    const handleSaveTool = async (tool: string) => {
        setDiffTool(tool);
        try {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if (tool === 'vscode') {
                await setConfig(repoPath, 'diff.tool', 'vscode');
                await setConfig(repoPath, 'difftool.vscode.cmd', 'code --wait --diff "$LOCAL" "$REMOTE"');
            } else if (tool === 'kdiff3') {
                await setConfig(repoPath, 'diff.tool', 'kdiff3');
                if (isMac) {
                    // Specific path for KDiff3 on macOS Applications folder
                    await setConfig(repoPath, 'difftool.kdiff3.path', '/Applications/kdiff3.app/Contents/MacOS/kdiff3');
                }
            } else {
                await setConfig(repoPath, 'diff.tool', tool);
            }
            alert(`Diff tool set to ${tool}`);
        } catch (e) {
            alert('Failed to save tool config');
        }
    };

    const handleAddRemote = async () => {
        if (!newRemoteName || !newRemoteUrl) return;
        try {
            await addRemote(repoPath, newRemoteName, newRemoteUrl);
            setNewRemoteName('');
            setNewRemoteUrl('');
            loadSettings();
        } catch (e) {
            alert('Failed to add remote');
        }
    };

    const handleRemoveRemote = async (remoteLine: string) => {
        const name = remoteLine.split('\t')[0];
        if (!confirm(`Remove remote ${name}?`)) return;
        try {
            await removeRemote(repoPath, name);
            loadSettings();
        } catch (e) {
            alert('Failed to remove remote');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Repository Settings</DialogTitle>
                    <DialogDescription>Configure user identity and remotes for this repository.</DialogDescription>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium text-sm">User Identity</h3>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input value={userName} onChange={e => setUserName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Email</Label>
                                <Input value={userEmail} onChange={e => setUserEmail(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="flex justify-end">
                                <Button size="sm" onClick={handleSaveUser}><Save className="w-4 h-4 mr-2" /> Save Identity</Button>
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium text-sm">External Tools</h3>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Diff Tool</Label>
                                <div className="col-span-3 flex gap-2">
                                    <select 
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={diffTool}
                                        onChange={(e) => handleSaveTool(e.target.value)}
                                    >
                                        <option value="">System Default</option>
                                        <option value="kdiff3">KDiff3</option>
                                        <option value="vscode">VS Code</option>
                                        <option value="meld">Meld</option>
                                        <option value="bc3">Beyond Compare 3</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-md">
                            <h3 className="font-medium text-sm">Remotes</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto bg-muted p-2 rounded text-xs font-mono">
                                {remotes.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <span>{r}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveRemote(r)}>
                                            <Trash className="w-3 h-3 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {remotes.length === 0 && <div className="text-muted-foreground italic">No remotes configured</div>}
                            </div>
                            <div className="flex gap-2">
                                <Input placeholder="Remote Name (e.g. origin)" value={newRemoteName} onChange={e => setNewRemoteName(e.target.value)} className="w-1/3" />
                                <Input placeholder="URL" value={newRemoteUrl} onChange={e => setNewRemoteUrl(e.target.value)} className="flex-1" />
                                <Button size="icon" onClick={handleAddRemote} disabled={!newRemoteName || !newRemoteUrl}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
