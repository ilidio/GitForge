import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldCheck, Copy, Check, Sparkles, AlertTriangle } from 'lucide-react';

interface ReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review: string;
    loading: boolean;
    error: string;
}

export default function ReviewDialog({ open, onOpenChange, review, loading, error }: ReviewDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(review);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        AI Code Review
                    </DialogTitle>
                    <DialogDescription>
                        Analysis of your staged changes for bugs, security, and style.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow mt-2 rounded-md border p-4 bg-muted/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Analyzing staged changes...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 text-destructive gap-2">
                            <AlertTriangle className="h-8 w-8" />
                            <p>{error}</p>
                        </div>
                    ) : review ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            {/* Simple markdown-like rendering for bullets */}
                            <div className="space-y-2 text-sm leading-relaxed">
                                {review.split('\n').map((line, i) => {
                                    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                        return (
                                            <div key={i} className="flex gap-2 pl-1">
                                                <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                <span>{line.trim().substring(2)}</span>
                                            </div>
                                        );
                                    }
                                    if (line.trim().startsWith('###')) {
                                        return <h3 key={i} className="font-bold text-base mt-4 mb-2">{line.trim().replace(/#/g, '')}</h3>;
                                    }
                                    if (line.trim().startsWith('##')) {
                                        return <h2 key={i} className="font-bold text-lg mt-6 mb-3 border-b pb-1">{line.trim().replace(/#/g, '')}</h2>;
                                    }
                                    return <p key={i} className={line.trim() ? "my-1" : "h-2"}>{line}</p>;
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                            No review data available.
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="mt-4 flex justify-between items-center w-full">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Powered by AI
                    </div>
                    <div className="flex gap-2">
                        {review && !loading && (
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                {copied ? <Check className="h-3.5 w-3.5 mr-2" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
                                {copied ? 'Copied' : 'Copy'}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
