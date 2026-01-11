
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    GitBranch, GitCommitVertical, Search, Zap, 
    Settings, ShieldAlert, History, MousePointer2, 
    Terminal, FileCode, Archive, Layout, Command, 
    RotateCcw, Github, Info, ExternalLink, Folder, Trash,
    BarChart3, Globe, Sparkles, Lock, AlertCircle
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
                                <TabsContent value="basics" className="space-y-16 mt-0 pb-[15px]">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Layout className="h-5 w-5 text-primary" /> Getting Started
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Clone & Init</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Retrieve remote repositories via URL with <strong>Clone</strong>, or transform any local folder into a Git project with <strong>Init</strong>.
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2"><Folder className="h-4 w-4" /> Workspaces</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Organize dozens of repositories into <strong>Workspaces</strong>. Group projects by client or category to keep your sidebar clean and focused.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-6 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <GitCommitVertical className="h-5 w-5 text-primary" /> The Committing Workflow
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-purple-500" /> AI Assistant
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Click the <strong>Sparkles Button</strong> to generate a semantic commit message automatically using AI (OpenAI or Gemini). Configure your API Key in Settings &gt; AI.
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Amend & Soft Undo</div>
                                                <p className="text-xs text-muted-foreground">Use "Amend" to squash into the latest commit, or the Undo button for a 1-click soft reset that keeps your work staged.</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Archive className="h-5 w-5 text-primary" /> Stash Management
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Temporarily save uncommitted changes. <strong>Right-click</strong> a stash to <strong>Pop</strong> or <strong>Drop</strong> it. 
                                            You can also stash specific files by right-clicking them in the file tree and selecting <strong>Stash This File</strong>.
                                        </p>
                                    </section>
                                </TabsContent>

                                <TabsContent value="graph" className="space-y-16 mt-0 pb-[15px]">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Terminal className="h-5 w-5 text-primary" /> Graph Visualizations
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            The <strong>History Graph</strong> supports multiple views: SourceTree, Compact, and Detailed. 
                                            Toggle the "Terminal" button to switch to an ASCII-style graph for a classic CLI experience.
                                        </p>
                                        <div className="p-4 bg-muted/10 rounded-lg border flex gap-4 items-center">
                                            <Lock className="h-4 w-4 text-green-500" />
                                            <div className="text-xs text-muted-foreground">
                                                <strong>Commit Signatures:</strong> Look for lock icons in the graph. 
                                                <span className="text-green-500 mx-1">Green</span> means verified GPG/SSH signature, 
                                                <span className="text-red-500 mx-1">Red</span> means invalid, and 
                                                <span className="text-yellow-500 mx-1">Yellow</span> means unknown key.
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-6 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Search className="h-5 w-5 text-primary" /> Search & Analysis
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                    <div className="text-sm font-bold mb-1 flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Deep Grep</div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">Find every instance where a string was added or removed across the entire repository history.</p>
                                                </div>
                                                <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                    <div className="text-sm font-bold mb-1 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Workspace Search</div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">Search for commits across <strong>multiple repositories</strong> simultaneously using the Globe icon in the sidebar.</p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10 flex gap-4 items-start">
                                                <div className="p-2 bg-primary/10 rounded-lg"><BarChart3 className="h-4 w-4 text-primary" /></div>
                                                <div>
                                                    <div className="text-sm font-bold mb-1">Repository Insights</div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        Click the chart icon in the top bar to visualize your project's health. View <strong>Author Leaderboards</strong>, <strong>Activity Heatmaps</strong>, and identify <strong>Hot Files</strong> that change most often.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <MousePointer2 className="h-5 w-5 text-primary" /> Context Actions
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-4 bg-muted/10 rounded-lg border">
                                                <div className="text-xs font-bold mb-1 uppercase opacity-50">Branching</div>
                                                <p className="text-xs text-muted-foreground">Checkout, Merge, Cherry-pick, and Tag directly from any commit.</p>
                                            </div>
                                            <div className="p-4 bg-muted/10 rounded-lg border">
                                                <div className="text-xs font-bold mb-1 uppercase opacity-50">Rewriting</div>
                                                <p className="text-xs text-muted-foreground">Revert commits or perform Soft/Mixed/Hard resets to any point in time.</p>
                                            </div>
                                            <div className="p-4 bg-muted/10 rounded-lg border col-span-2">
                                                <div className="text-xs font-bold mb-1 uppercase opacity-50 flex items-center gap-2"><Archive className="h-3 w-3" /> Exporting</div>
                                                <p className="text-xs text-muted-foreground">Right-click a commit and select <strong>Export as Zip</strong> to create a clean snapshot of your project for sharing or releases.</p>
                                            </div>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="diff" className="space-y-16 mt-0 pb-[15px]">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <FileCode className="h-5 w-5 text-primary" /> Internal Diff & Blame
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            GitForge features a <strong>custom, high-performance diff engine</strong> built from scratch. 
                                            It is extremely lightweight and handles massive files without lag. 
                                            Toggle between <strong>Internal</strong> and <strong>Monaco</strong> modes in the diff toolbar to suit your preference.
                                        </p>
                                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                                            Click <strong>Blame</strong> to view an enhanced table view of line-by-line history, including commit hash, author, date, and commit message summary.
                                        </p>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <ShieldAlert className="h-5 w-5 text-yellow-500" /> Conflict Resolution
                                        </h3>
                                        <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                                Visual conflict markers help you pick changes line-by-line. Once resolved, the file is automatically staged.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-xs font-mono p-2 bg-muted/30 rounded border"><Trash className="h-3 w-3 inline mr-1" /> git rm / git mv</div>
                                                <div className="text-xs font-mono p-2 bg-muted/30 rounded border"><Settings className="h-3 w-3 inline mr-1" /> Stage / Unstage All</div>
                                            </div>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="advanced" className="space-y-16 mt-0 pb-[15px]">
                                    <section className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-primary" /> Power Workflows
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Git Bisect</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Hunt down bugs by marking commits as <strong>Good</strong> or <strong>Bad</strong>. 
                                                    GitForge manages the checkout and logic until the first bad commit is isolated.
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Worktrees</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Check out multiple branches simultaneously in separate folders using <strong>git worktree</strong>. 
                                                    Perfect for multi-tasking without stashing.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <ShieldAlert className="h-5 w-5 text-primary" /> Advanced Integration
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2"><GitBranch className="h-4 w-4" /> Git Flow</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Standardize your release cycle. Initialize Git Flow to manage Features, Releases, and Hotfixes with automated branch naming and merging logic.
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2"><Settings className="h-4 w-4" /> Submodules</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    View and update embedded repositories. The <strong>Submodule Section</strong> in the sidebar tracks status and lets you sync dependencies with one click.
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <History className="h-5 w-5 text-primary" /> Reflog & Maintenance
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                            Open the <strong>Reflog Viewer</strong> via the Command Palette to recover lost commits or undo any operation. 
                                            Use <strong>Optimize Repository (GC)</strong> to run garbage collection and prune loose objects.
                                        </p>
                                    </section>

                                    <section className="space-y-4 border-t pt-12">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Github className="h-5 w-5 text-primary" /> GitHub Integration
                                        </h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2">Pull Requests</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Browse open PRs directly from the sidebar. Fetch PR metadata automatically and <strong>checkout PR branches</strong> for local review.
                                                </p>
                                            </div>
                                            <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10">
                                                <div className="text-sm font-bold mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Issues</div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    View open issues assigned to the repository in the new <strong>Issues Section</strong>. Click to open directly in your browser.
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </TabsContent>

                                <TabsContent value="shortcuts" className="mt-0 pb-[15px]">
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
