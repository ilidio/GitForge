
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    GitBranch, GitCommitVertical, Search, Zap, 
    Settings, ShieldAlert, History, MousePointer2, 
    Terminal, FileCode, Archive, Layout, Command, 
    RotateCcw, Github, Info, ExternalLink
} from 'lucide-react';

interface HelpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
    const [activeTab, setActiveTab] = useState('basics');

    const tabNames: Record<string, string> = {
        basics: 'Basics & Navigation',
        graph: 'History Graph & Search',
        diff: 'Review & Merge Conflicts',
        advanced: 'Advanced Workflows',
        shortcuts: 'Keyboard Shortcuts'
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-full h-[92vh] flex flex-row p-0 overflow-hidden bg-background border-none shadow-2xl">
                <div className="sr-only">
                    <DialogTitle>GitForge Documentation</DialogTitle>
                    <DialogDescription>User manual and feature documentation for GitForge.</DialogDescription>
                </div>
                <Tabs 
                    defaultValue="basics" 
                    value={activeTab} 
                    onValueChange={setActiveTab} 
                    className="flex flex-1 w-full h-full"
                >
                    {/* Left Sidebar Tabs - Icon Only */}
                    <TabsList className="flex flex-col w-24 h-full bg-muted/20 border-r p-4 gap-6 rounded-none justify-start">
                        <div className="mb-8 flex justify-center">
                            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                                <Info className="h-6 w-6 text-primary-foreground" />
                            </div>
                        </div>
                        <TabsTrigger value="basics" title="Basics" className="h-14 w-14 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm">
                            <Layout className="h-6 w-6" />
                        </TabsTrigger>
                        <TabsTrigger value="graph" title="Graph & Search" className="h-14 w-14 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm">
                            <GitCommitVertical className="h-6 w-6" />
                        </TabsTrigger>
                        <TabsTrigger value="diff" title="Review & Merge" className="h-14 w-14 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm">
                            <FileCode className="h-6 w-6" />
                        </TabsTrigger>
                        <TabsTrigger value="advanced" title="Advanced" className="h-14 w-14 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm">
                            <Zap className="h-6 w-6" />
                        </TabsTrigger>
                        <TabsTrigger value="shortcuts" title="Shortcuts" className="h-14 w-14 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all shadow-sm">
                            <Command className="h-6 w-6" />
                        </TabsTrigger>
                    </TabsList>

                    {/* Right Content Area */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
                        <header className="px-12 py-8 border-b bg-background/50 backdrop-blur-md z-10">
                            <h2 className="text-4xl font-black tracking-tight text-foreground">
                                {tabNames[activeTab]}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest font-semibold">
                                GitForge User Manual
                            </p>
                        </header>

                        <ScrollArea className="flex-1 h-full">
                            <div className="max-w-4xl mx-auto px-12 pt-12 pb-[15px]">
                                <TabsContent value="basics" className="space-y-16 mt-0">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Layout className="h-5 w-5 text-primary" /> Multi-Repo Management
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            GitForge provides a high-density sidebar for managing dozens of repositories. 
                                            Group them into <strong>Workspaces</strong> using the folder icon to stay organized. 
                                            The central divider is a <strong>resizable handle</strong>—drag it to expand your file list or your commit graph.
                                        </p>
                                    </section>

                                    <section className="space-y-6 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <GitCommitVertical className="h-5 w-5 text-primary" /> The Committing Workflow
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Message Templates</div>
                                                <p className="text-xs text-muted-foreground">Save standard prefixes like "feat:" or "fix:" to maintain a clean history. Access them via the file icon in the commit box.</p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Amend & Soft Undo</div>
                                                <p className="text-xs text-muted-foreground">Use "Amend" to squash into the latest commit, or the Undo button for a 1-click soft reset that keeps your work staged.</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Archive className="h-5 w-5 text-primary" /> Stash Inspector
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Click any stash in the sidebar to open the <strong>Stash Inspector</strong>. 
                                            This treats the stash as a virtual commit, allowing you to browse its file changes and diffs without applying it to your tree.
                                        </p>
                                    </section>
                                </TabsContent>

                                <TabsContent value="graph" className="space-y-16 mt-0">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Terminal className="h-5 w-5 text-primary" /> Graph Visualizations
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            The <strong>History Graph</strong> is locked to a dark theme for optimal contrast. 
                                            Toggle the "Terminal" button to switch to an ASCII-style graph if you prefer a classic low-level look.
                                        </p>
                                    </section>

                                    <section className="space-y-6 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Search className="h-5 w-5 text-primary" /> Advanced Search
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Deep Content Search (Grep)</div>
                                                <p className="text-xs text-muted-foreground">The magnifying glass icon triggers a content search across all commits. It finds every time a specific string was added or removed in history.</p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Metadata Filters</div>
                                                <p className="text-xs text-muted-foreground">Filter by Author, Date, or ID directly in the graph header to isolate specific workstreams in seconds.</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <MousePointer2 className="h-5 w-5 text-primary" /> Drag-and-Drop Gestures
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            <strong>Drag any local branch</strong> from the sidebar and <strong>drop it onto a commit</strong> in the graph. 
                                            GitForge will prompt you to Merge, Rebase, or Cherry-pick that branch onto the target instantly.
                                        </p>
                                    </section>
                                </TabsContent>

                                <TabsContent value="diff" className="space-y-16 mt-0">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <FileCode className="h-5 w-5 text-primary" /> Code Review
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Powered by Monaco, the diff viewer supports Side-by-Side and Inline modes. 
                                            Click <strong>Blame</strong> to see line-by-line annotations, or <strong>Open</strong> to launch an external tool like KDiff3 or VS Code.
                                        </p>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <ShieldAlert className="h-5 w-5 text-yellow-500" /> Visual Conflict Resolution
                                        </h3>
                                        <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                When a merge results in conflicts, GitForge provides a visual resolution tool. 
                                                Choose between "Current", "Incoming", or "Both" changes for each block. 
                                                Once resolved, hit <strong>Save & Resolve</strong> to automatically clean and stage the file.
                                            </p>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="advanced" className="space-y-16 mt-0">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-primary" /> Git Flow Integration
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Initialize Git Flow in your repository to enable strict branch naming conventions. 
                                            Use the specialized dashboard to start new features, releases, or critical hotfixes following the standard model.
                                        </p>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <RotateCcw className="h-5 w-5 text-primary" /> Magic Undo (Reflog)
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            The <strong>Magic Undo</strong> button in the top bar scans your Git <strong>reflog</strong>. 
                                            It can undo almost any operation—including hard resets and deleted branches—by warping the repository back to its state before your last action.
                                        </p>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Github className="h-5 w-5 text-primary" /> Pull Request Integration
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Browse open PRs in the sidebar. 
                                            Click the PR icon to <strong>fetch and checkout</strong> the branch for local review instantly.
                                        </p>
                                    </section>
                                </TabsContent>

                                <TabsContent value="shortcuts" className="mt-0">
                                    <div className="grid grid-cols-1 gap-4 max-w-2xl">
                                        {[
                                            { key: 'Cmd/Ctrl + K', desc: 'Global Command Palette' },
                                            { key: 'Cmd/Ctrl + Enter', desc: 'Commit Staged Changes' },
                                            { key: 'Shift + ?', desc: 'Open this Help Interface' },
                                            { key: 'Enter', desc: 'Submit Search or Open Path' },
                                            { key: 'Esc', desc: 'Close Active Dialog' },
                                        ].map(s => (
                                            <div key={s.key} className="flex justify-between items-center border-b pb-4 px-2 hover:bg-muted/10 transition-colors">
                                                <kbd className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-mono text-base border-b-4 border-primary-foreground/20 shadow-md">{s.key}</kbd>
                                                <span className="text-base font-medium text-muted-foreground">{s.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
