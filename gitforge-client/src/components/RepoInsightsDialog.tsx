'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRepoStats } from '@/lib/electron';
import { BarChart3, Users, FileText, Activity, Loader2 } from 'lucide-react';

interface RepoInsightsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
}

export default function RepoInsightsDialog({ open, onOpenChange, repoPath }: RepoInsightsDialogProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && repoPath) {
            setLoading(true);
            getRepoStats(repoPath)
                .then(data => setStats(data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, repoPath]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-8">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Repository Insights: {repoPath.split('/').pop()}
                    </DialogTitle>
                    <DialogDescription>Visual statistics and project health overview.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                ) : stats ? (
                    <ScrollArea className="flex-1 mt-4 pr-4">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Contributors */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                    <Users className="h-5 w-5" /> Top Contributors
                                </h3>
                                <div className="space-y-2">
                                    {stats.authors.split('\n').filter(Boolean).map((line: string, i: number) => {
                                        const parts = line.trim().split('\t');
                                        return (
                                            <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                                                <span className="font-medium">{parts[1]}</span>
                                                <span className="bg-primary/10 text-primary px-2 rounded-full font-bold">{parts[0]} commits</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Hot Files */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                    <FileText className="h-5 w-5" /> Hot Files (Most Changed)
                                </h3>
                                <div className="space-y-2">
                                    {stats.hotFiles.split('\n').filter(Boolean).map((line: string, i: number) => {
                                        const [count, ...pathParts] = line.trim().split(/\s+/);
                                        const path = pathParts.join(' ');
                                        if (!path) return null;
                                        return (
                                            <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                                                <span className="truncate font-mono text-xs" title={path}>{path}</span>
                                                <span className="bg-orange-500/10 text-orange-500 px-2 rounded-full font-bold ml-2">{count}x</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Activity (simplified list) */}
                            <section className="col-span-2 space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                    <Activity className="h-5 w-5" /> Recent Activity (Commits per Day)
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                    {/* Simplified Heatmap-like view */}
                                    {Object.entries(
                                        stats.activity.split('\n').reduce((acc: any, date: string) => {
                                            acc[date] = (acc[date] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ).sort().reverse().slice(0, 30).map(([date, count]: any) => (
                                        <div key={date} className="p-2 border rounded text-center min-w-[80px]">
                                            <div className="text-[10px] text-muted-foreground">{date}</div>
                                            <div className="text-lg font-bold">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </ScrollArea>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
