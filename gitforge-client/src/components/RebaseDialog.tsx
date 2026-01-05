'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, Trash2, Edit2, GripVertical } from 'lucide-react';

interface RebaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commits: any[];
    onConfirm: (instructions: any[]) => void;
    targetBranch: string;
}

type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

export default function RebaseDialog({ open, onOpenChange, commits, onConfirm, targetBranch }: RebaseDialogProps) {
    const [instructions, setInstructions] = useState<any[]>([]);

    useEffect(() => {
        if (open && commits) {
            setInstructions(commits.map(c => ({
                id: c.id,
                message: c.message,
                action: 'pick' as RebaseAction
            })));
        }
    }, [open, commits]);

    const updateAction = (index: number, action: RebaseAction) => {
        const newInstructions = [...instructions];
        newInstructions[index].action = action;
        setInstructions(newInstructions);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newInstructions = [...instructions];
        [newInstructions[index - 1], newInstructions[index]] = [newInstructions[index], newInstructions[index - 1]];
        setInstructions(newInstructions);
    };

    const moveDown = (index: number) => {
        if (index === instructions.length - 1) return;
        const newInstructions = [...instructions];
        [newInstructions[index + 1], newInstructions[index]] = [newInstructions[index], newInstructions[index + 1]];
        setInstructions(newInstructions);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Interactive Rebase</DialogTitle>
                    <DialogDescription>
                        Rebasing current branch onto <span className="font-mono font-bold text-foreground">{targetBranch}</span>.
                        Choose actions for each commit and reorder if necessary.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                        {instructions.map((inst, i) => (
                            <div key={inst.id} className={`flex items-center gap-3 p-2 rounded border bg-muted/30 ${inst.action === 'drop' ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveUp(i)} disabled={i === 0}>
                                        <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveDown(i)} disabled={i === instructions.length - 1}>
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </div>
                                
                                <select 
                                    className="bg-background border rounded px-1 text-xs h-7 w-24 outline-none"
                                    value={inst.action}
                                    onChange={(e) => updateAction(i, e.target.value as RebaseAction)}
                                >
                                    <option value="pick">Pick</option>
                                    <option value="reword">Reword</option>
                                    <option value="edit">Edit</option>
                                    <option value="squash">Squash</option>
                                    <option value="fixup">Fixup</option>
                                    <option value="drop">Drop</option>
                                </select>

                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-[10px] text-muted-foreground">{inst.id.substring(0, 7)}</div>
                                    <div className="text-xs font-medium truncate">{inst.message.split('\n')[0]}</div>
                                </div>

                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-7 w-7 ${inst.action === 'drop' ? 'text-primary' : 'text-muted-foreground'}`}
                                    onClick={() => updateAction(i, inst.action === 'drop' ? 'pick' : 'drop')}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onConfirm(instructions)}>Start Rebase</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
