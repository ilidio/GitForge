
import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, GitBranch, RefreshCw, ArrowDown, ArrowUp, Plus, Trash, Tag, Settings, FileCode, CheckCircle, Save, History, FileText, Terminal, Archive, Sparkles, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
    hasHistory: boolean;
    hasRemotes: boolean;
    hasStagedChanges: boolean;
    actions: {
        fetch: () => void;
        pull: () => void;
        push: () => void;
        commit: () => void;
        createBranch: () => void;
        openSettings: () => void;
            openReflog: () => void;
            openWorktrees: () => void;
            openStashes: () => void;
            runGc: () => void;
            openFileSearch: () => void;
            toggleTerminal: () => void;
            openDailyBrief: () => void;
            openCompareFiles: () => void;
        };}

export default function CommandPalette({ open, onOpenChange, actions, repoPath, hasHistory, hasRemotes, hasStagedChanges }: CommandPaletteProps) {
    
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const run = (action: () => void) => {
      action();
      onOpenChange(false);
  }

  return (
    <Command.Dialog 
        open={open} 
        onOpenChange={onOpenChange}
        label="Global Command Menu"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] bg-popover text-popover-foreground border shadow-2xl rounded-xl overflow-hidden z-[100]"
        overlayClassName="fixed inset-0 bg-background/80 backdrop-blur-sm z-[99]"
    >
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <Command.Input 
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
        />
      </div>
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
        
        <Command.Group heading="Repository Actions">
            <Command.Item disabled={!repoPath || !hasRemotes} onSelect={() => run(actions.fetch)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Fetch</span>
            </Command.Item>
            <Command.Item disabled={!repoPath || !hasRemotes} onSelect={() => run(actions.pull)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <ArrowDown className="mr-2 h-4 w-4" />
                <span>Pull</span>
            </Command.Item>
            <Command.Item disabled={!repoPath || !hasRemotes} onSelect={() => run(actions.push)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <ArrowUp className="mr-2 h-4 w-4" />
                <span>Push</span>
            </Command.Item>
            <Command.Item disabled={!repoPath || !hasStagedChanges} onSelect={() => run(actions.commit)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <Save className="mr-2 h-4 w-4" />
                <span>Commit Changes</span>
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">CMD+Enter</span>
            </Command.Item>
        </Command.Group>

                        <Command.Group heading="Navigation & Search">
                            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openFileSearch)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Go to File...</span>
                                <span className="ml-auto text-xs tracking-widest text-muted-foreground">Cmd+P</span>
                            </Command.Item>
                            <Command.Item disabled={!repoPath} onSelect={() => run(actions.toggleTerminal)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Terminal className="mr-2 h-4 w-4" />
                                <span>Toggle Terminal</span>
                            </Command.Item>
                            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openDailyBrief)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>Daily Progress Briefing...</span>
                            </Command.Item>
                            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openCompareFiles)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                <span>Cross-File Comparison...</span>
                            </Command.Item>
                        </Command.Group>
        
                        <Command.Group heading="Branch & Tags">            <Command.Item disabled={!repoPath || !hasHistory} onSelect={() => run(actions.createBranch)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <GitBranch className="mr-2 h-4 w-4" />
                <span>Create New Branch...</span>
            </Command.Item>
            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openReflog)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <History className="mr-2 h-4 w-4" />
                <span>View Reflog</span>
            </Command.Item>
            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openWorktrees)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <GitBranch className="mr-2 h-4 w-4" />
                <span>Manage Worktrees</span>
            </Command.Item>
            <Command.Item disabled={!repoPath} onSelect={() => run(actions.openStashes)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <Archive className="mr-2 h-4 w-4" />
                <span>Manage Stashes...</span>
            </Command.Item>
        </Command.Group>

        <Command.Group heading="Application">
            <Command.Item onSelect={() => run(actions.openSettings)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings...</span>
            </Command.Item>
            <Command.Item disabled={!repoPath} onSelect={() => run(actions.runGc)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Optimize Repository (GC)</span>
            </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
