
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { globalGrep } from '@/lib/electron';
import { Search, Loader2, Calendar, User, Hash, Folder } from 'lucide-react';

interface GlobalGrepDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPaths: string[];
    onCommitSelect: (repoPath: string, commit: any) => void;
}

export default function GlobalGrepDialog({ open, onOpenChange, repoPaths, onCommitSelect }: GlobalGrepDialogProps) {
    const [pattern, setPattern] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!pattern || repoPaths.length === 0) return;
        setLoading(true);
        try {
            const data = await globalGrep(repoPaths, pattern);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[700px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Global Workspace Search</DialogTitle>
                    <DialogDescription>
                        Searching across <strong>{repoPaths.length}</strong> repositories in your workspace.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search pattern across all repos..." 
                            className="pl-8" 
                            value={pattern}
                            onChange={e => setPattern(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading || !pattern}>
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Global Search'}
                    </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-md bg-muted/20">
                    <div className="p-2 space-y-2">
                        {results.length === 0 && !loading && (
                            <div className="text-center text-muted-foreground py-8 italic">No results found across workspace.</div>
                        )}
                        {results.map((item, i) => (
                            <div 
                                key={i} 
                                className="p-3 rounded border bg-background hover:border-primary cursor-pointer transition-colors group"
                                onClick={() => {
                                    onCommitSelect(item.repoPath, item);
                                    onOpenChange(false);
                                }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                                        <Folder className="h-3 w-3" />
                                        {item.repoPath.split('/').pop()}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">{item.message}</div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="font-mono">{item.id.substring(0, 7)}</span>
                                    <span>{item.author}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
