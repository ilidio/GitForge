import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Archive, Trash, RotateCcw } from 'lucide-react';

function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

interface StashDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stashes: any[];
    onPop: (index: number) => void;
    onDrop: (index: number) => void;
    onApply?: (index: number) => void;
}

export default function StashDialog({ open, onOpenChange, stashes, onPop, onDrop }: StashDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Stash List</DialogTitle>
                    <DialogDescription>
                        Manage your stashed changes.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] border rounded-md p-4">
                    {stashes.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No stashes found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stashes.map((stash, index) => (
                                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                stash@&#123;{stash.index}&#125;
                                            </span>
                                            <span className="truncate" title={stash.message}>
                                                {stash.message || "No message"}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {stash.timestamp ? timeAgo(new Date(stash.timestamp)) : 'Unknown time'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button size="sm" variant="outline" onClick={() => onPop(stash.index)} title="Pop (Apply & Drop)">
                                            <RotateCcw className="h-4 w-4 mr-1" /> Pop
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDrop(stash.index)} title="Drop (Delete)">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
