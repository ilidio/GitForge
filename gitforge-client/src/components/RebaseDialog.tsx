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
import { ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RebaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commits: any[];
    onConfirm: (instructions: any[]) => void;
    targetBranch: string;
}

type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';

function SortableItem({ inst, i, updateAction, moveUp, moveDown, isFirst, isLast }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: inst.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-2 rounded border bg-muted/30 ${inst.action === 'drop' ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing px-1" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveUp(i)} disabled={isFirst}>
                    <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveDown(i)} disabled={isLast}>
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
    );
}

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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const updateAction = (index: number, action: RebaseAction) => {
        const newInstructions = [...instructions];
        newInstructions[index].action = action;
        setInstructions(newInstructions);
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        setInstructions((items) => {
            const newItems = [...items];
            [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
            return newItems;
        });
    };

    const moveDown = (index: number) => {
        if (index === instructions.length - 1) return;
        setInstructions((items) => {
            const newItems = [...items];
            [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
            return newItems;
        });
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setInstructions((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Interactive Rebase</DialogTitle>
                    <DialogDescription>
                        Rebasing current branch onto <span className="font-mono font-bold text-foreground">{targetBranch}</span>.
                        Drag to reorder commits.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={instructions} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {instructions.map((inst, i) => (
                                    <SortableItem 
                                        key={inst.id} 
                                        inst={inst} 
                                        i={i} 
                                        updateAction={updateAction} 
                                        moveUp={moveUp} 
                                        moveDown={moveDown}
                                        isFirst={i === 0}
                                        isLast={i === instructions.length - 1}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onConfirm(instructions)}>Start Rebase</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
