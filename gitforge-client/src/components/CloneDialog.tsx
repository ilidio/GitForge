import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cloneRepo } from '@/lib/electron';
import { Loader2 } from 'lucide-react';

interface CloneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCloneComplete: (path: string) => void;
}

export default function CloneDialog({ open, onOpenChange, onCloneComplete }: CloneDialogProps) {
    const [url, setUrl] = useState('');
    const [destination, setDestination] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClone = async () => {
        if (!url || !destination) return;
        setLoading(true);
        setError('');
        try {
            await cloneRepo(url, destination);
            onCloneComplete(destination);
            onOpenChange(false);
            setUrl('');
            setDestination('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to clone repository');
        } finally {
            setLoading(false);
        }
    };

    const handleBrowseDestination = async () => {
        // Use window.require to bypass the bundler and access Electron at runtime
        if (typeof window !== 'undefined' && (window as any).require) {
            const { ipcRenderer } = (window as any).require('electron');
            const result = await ipcRenderer.invoke('dialog:openDirectory');
            if (result && !result.canceled && result.filePaths.length > 0) {
                // The user selects the PARENT directory usually, but here we want the full path?
                // Or we can let them select a folder and we append the repo name.
                // Let's assume they pick the parent folder, and we append the repo name derived from URL.
                let path = result.filePaths[0];
                if (url) {
                    const repoName = url.split('/').pop()?.replace('.git', '') || 'repository';
                    path = `${path}/${repoName}`;
                }
                setDestination(path);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clone Repository</DialogTitle>
                    <DialogDescription>
                        Enter the repository URL and the local destination path.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="url" className="text-right">Repo URL</Label>
                        <Input 
                            id="url" 
                            placeholder="https://github.com/username/repo.git" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            className="col-span-3" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dest" className="text-right">Destination</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input 
                                id="dest" 
                                placeholder="/path/to/destination" 
                                value={destination} 
                                onChange={(e) => setDestination(e.target.value)} 
                            />
                            <Button variant="outline" onClick={handleBrowseDestination}>Browse</Button>
                        </div>
                    </div>
                </div>
                {error && <div className="text-sm text-destructive mb-4 text-center">{error}</div>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={handleClone} disabled={!url || !destination || loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cloning...</> : 'Clone'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
