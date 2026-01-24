'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash, Play, Save, Hash, Calendar, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';

interface SavedQuery {
    id: string;
    name: string;
    pattern: string;
    type: 'grep' | 'log';
    createdAt: number;
}

interface QueryLibraryProps {
    repoPath: string;
    onRunQuery: (query: SavedQuery) => void;
}

export default function QueryLibrary({ repoPath, onRunQuery }: QueryLibraryProps) {
    const [queries, setQueries] = useState<SavedQuery[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPattern, setNewPattern] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('gitforge_saved_queries');
        if (saved) {
            try {
                setQueries(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved queries", e);
            }
        } else {
            // Default examples
            const defaults: SavedQuery[] = [
                { id: '1', name: 'Find TODOs', pattern: 'TODO', type: 'grep', createdAt: Date.now() },
                { id: '2', name: 'Fixes & Bugs', pattern: 'fix|bug', type: 'grep', createdAt: Date.now() }
            ];
            setQueries(defaults);
            localStorage.setItem('gitforge_saved_queries', JSON.stringify(defaults));
        }
    }, []);

    const saveQueries = (newQueries: SavedQuery[]) => {
        setQueries(newQueries);
        localStorage.setItem('gitforge_saved_queries', JSON.stringify(newQueries));
    };

    const handleAddQuery = () => {
        if (!newName || !newPattern) return;
        const query: SavedQuery = {
            id: Math.random().toString(36).substring(7),
            name: newName,
            pattern: newPattern,
            type: 'grep',
            createdAt: Date.now()
        };
        saveQueries([query, ...queries]);
        setNewName('');
        setNewPattern('');
        setIsAddOpen(false);
    };

    const handleDeleteQuery = (id: string) => {
        saveQueries(queries.filter(q => q.id !== id));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Query Library</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddOpen(true)}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {queries.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground italic">
                            No saved queries. Click + to add one.
                        </div>
                    )}
                    {queries.map(query => (
                        <Card key={query.id} className="p-3 group hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold truncate flex-1" title={query.name}>{query.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-primary" 
                                        onClick={() => onRunQuery(query)}
                                        title="Run Query"
                                        disabled={!repoPath}
                                    >
                                        <Play className="h-3 w-3 fill-current" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-destructive" 
                                        onClick={() => handleDeleteQuery(query.id)}
                                        title="Delete"
                                    >
                                        <Trash className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground truncate bg-muted/50 p-1 rounded">
                                {query.pattern}
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Snippet</DialogTitle>
                        <DialogDescription>
                            Store a search pattern to reuse it later across repositories.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input 
                                placeholder="e.g. Audit Sensitive Changes" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Grep Pattern</label>
                            <Input 
                                placeholder="Regex or string..." 
                                value={newPattern}
                                onChange={e => setNewPattern(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddQuery} disabled={!newName || !newPattern}>Save Snippet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
