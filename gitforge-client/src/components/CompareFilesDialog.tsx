import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, ArrowRightLeft, Loader2, X } from 'lucide-react';
import { compareFiles, lsFiles } from '@/lib/electron';
import DiffView from './DiffView';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { getLanguageFromPath } from '@/app/page';

interface CompareFilesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
    initialFileA?: string;
}

export default function CompareFilesDialog({ open, onOpenChange, repoPath, initialFileA }: CompareFilesDialogProps) {
    const [pathA, setPathA] = useState(initialFileA || '');
    const [refA, setRefA] = useState('');
    const [pathB, setPathB] = useState('');
    const [refB, setRefB] = useState('');
    const [loading, setLoading] = useState(false);
    const [diffData, setDiffData] = useState<any>(null);
    const [files, setFiles] = useState<string[]>([]);
    const [pickingFile, setPickingFile] = useState<'A' | 'B' | null>(null);

    useEffect(() => {
        if (open) {
            if (initialFileA) setPathA(initialFileA);
            loadFiles();
        } else {
            setDiffData(null);
        }
    }, [open, initialFileA]);

    const loadFiles = async () => {
        try {
            const output = await lsFiles(repoPath);
            setFiles(output.split('\n').filter(Boolean));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCompare = async () => {
        if (!pathA || !pathB) return;
        setLoading(true);
        try {
            const data = await compareFiles(repoPath, pathA, refA || null, pathB, refB || null);
            setDiffData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (path: string) => {
        if (pickingFile === 'A') setPathA(path);
        else if (pickingFile === 'B') setPathB(path);
        setPickingFile(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Cross-File Comparison
                    </DialogTitle>
                    <DialogDescription>
                        Compare two different files or versions to track code movements.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 grid grid-cols-2 gap-8 py-4 border-b">
                    {/* File A */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Source (File A)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Input 
                                        placeholder="Path to file A..." 
                                        value={pathA} 
                                        onChange={e => setPathA(e.target.value)}
                                        className="pr-8"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="absolute right-0 top-0 h-full px-2"
                                        onClick={() => setPickingFile('A')}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Input 
                                    placeholder="Ref (HEAD, SHA...)" 
                                    className="w-32" 
                                    value={refA} 
                                    onChange={e => setRefA(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* File B */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Target (File B)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Input 
                                        placeholder="Path to file B..." 
                                        value={pathB} 
                                        onChange={e => setPathB(e.target.value)}
                                        className="pr-8"
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="absolute right-0 top-0 h-full px-2"
                                        onClick={() => setPickingFile('B')}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Input 
                                    placeholder="Ref (HEAD, SHA...)" 
                                    className="w-32" 
                                    value={refB} 
                                    onChange={e => setRefB(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden relative">
                    {pickingFile && (
                        <div className="absolute inset-0 bg-background/95 z-50 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold">Select File {pickingFile}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setPickingFile(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <Command className="rounded-lg border shadow-md">
                                <CommandInput placeholder="Search files..." />
                                <CommandList className="max-h-[400px]">
                                    <CommandEmpty>No files found.</CommandEmpty>
                                    <CommandGroup>
                                        {files.map(f => (
                                            <CommandItem key={f} onSelect={() => handleFileSelect(f)} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted">
                                                <FileText className="h-4 w-4" />
                                                {f}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    )}

                    <ScrollArea className="h-full bg-muted/20">
                        {loading ? (
                            <div className="flex items-center justify-center h-full py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : diffData ? (
                            <div className="p-4 h-[600px]">
                                <DiffView 
                                    original={diffData.original} 
                                    modified={diffData.modified} 
                                    renderSideBySide={true}
                                    language={getLanguageFromPath(pathB)}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                                <ArrowRightLeft className="h-12 w-12 mb-4 opacity-10" />
                                <p>Select source and target files to compare</p>
                                <Button variant="outline" className="mt-4" onClick={handleCompare} disabled={!pathA || !pathB}>
                                    Run Comparison
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="p-4 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={handleCompare} disabled={loading || !pathA || !pathB}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Compare Files
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
