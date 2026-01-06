'use client';

import { useState, useEffect } from 'react';
import { Box, RefreshCw, ChevronRight, ChevronDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSubmodules, updateSubmodule } from '@/lib/electron';

interface SubmoduleSectionProps {
    repoPath: string;
}

export default function SubmoduleSection({ repoPath }: SubmoduleSectionProps) {
    const [submodules, setSubmodules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const loadSubmodules = async () => {
        if (!repoPath) return;
        setLoading(true);
        try {
            const output = await getSubmodules(repoPath);
            if (!output) {
                setSubmodules([]);
                return;
            }
            const parsed = output.split('\n').filter(Boolean).map((line: string) => {
                // line format: " <sha> path (branch)"
                const parts = line.trim().split(/\s+/);
                return { 
                    sha: parts[0], 
                    path: parts[1], 
                    name: parts[1].split('/').pop(),
                    status: line.startsWith('-') ? 'uninitialized' : (line.startsWith('+') ? 'modified' : 'up-to-date')
                };
            });
            setSubmodules(parsed);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (repoPath) loadSubmodules();
    }, [repoPath]);

    const handleUpdate = async (name: string) => {
        setLoading(true);
        try {
            await updateSubmodule(repoPath, name);
            loadSubmodules();
        } catch (e) {
            alert('Failed to update submodule');
        } finally {
            setLoading(false);
        }
    };

    if (submodules.length === 0 && !loading) return null;

    return (
        <div>
            <h3 
                className="text-sm font-medium mb-2 uppercase text-muted-foreground flex justify-between items-center cursor-pointer group px-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span>Submodules ({submodules.length})</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); loadSubmodules(); }}
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </h3>
            {isOpen && (
                <div className="space-y-1">
                    {submodules.map((sm, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted text-xs group">
                            <div className="flex items-center gap-2 truncate">
                                <Package className={`h-3 w-3 ${sm.status === 'uninitialized' ? 'text-muted-foreground' : 'text-blue-500'}`} />
                                <span className="truncate" title={sm.path}>{sm.name}</span>
                            </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-5 px-1 opacity-0 group-hover:opacity-100 text-[10px]"
                                                            onClick={() => handleUpdate(sm.path)}
                                                            disabled={loading}
                                                        >                                Update
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
