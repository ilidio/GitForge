'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { getRepoStatus, getRepoLog, getFileDiff, stageFile, unstageFile, commitChanges, getCommitChanges, getCommitFileDiff, checkout, merge, cherryPick, getBranches, createBranch, deleteBranch, fetchRepo, pullRepo, pushRepo, getTextGraph, getStashes, stashChanges, popStash, dropStash, undoLastCommit } from '@/lib/api';
import CommitGraph from '@/components/CommitGraph';
import DiffView from '@/components/DiffView';
import FileTree from '@/components/FileTree';
import RebaseDialog from '@/components/RebaseDialog';
import Ansi from 'ansi-to-react';
import { Plus, RefreshCw, ArrowDown, ArrowUp, Terminal, GitGraph as GitGraphIcon, Moon, Sun, Search, Archive, Undo, Settings2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Helper to parse Ansi and find SHAs
function InteractiveTerminalGraph({ content, onCommitSelect, onAction }: { content: string, onCommitSelect: (sha: string) => void, onAction?: (action: any, commit: any) => void }) {
    if (!content) return <div>No graph</div>;

    const lines = content.split('\n');

    return (
        <div className="font-mono text-sm leading-relaxed whitespace-pre">
            {lines.map((line, i) => {
                // Heuristic to find SHA in git-graph output (first 7-char hex string)
                // We strip ANSI codes to find the SHA.
                const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
                const shaMatch = cleanLine.match(/\b[0-9a-f]{7}\b/);
                const sha = shaMatch ? shaMatch[0] : null;
                const commitStub = { id: sha, message: cleanLine.trim() };
                return (
                    <ContextMenu key={i}>
                        <ContextMenuTrigger disabled={!sha}>
                            <div 
                                className={`hover:bg-white/10 cursor-pointer px-2 -mx-2 rounded ${sha ? '' : 'pointer-events-none'}`}
                                onClick={() => sha && onCommitSelect(sha)}
                                title={sha ? `Select commit ${sha}` : ''}
                            >
                                <Ansi>{line}</Ansi>
                            </div>
                        </ContextMenuTrigger>
                        {sha && (
                            <ContextMenuContent className="w-48">
                                <ContextMenuItem onClick={() => onAction?.('checkout', commitStub)}>
                                    Checkout this Commit
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => onAction?.('merge', commitStub)}>
                                    Merge into Current
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => onAction?.('cherrypick', commitStub)}>
                                    Cherry-Pick
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => onAction?.('copy', commitStub)}>
                                    Copy SHA
                                </ContextMenuItem>
                            </ContextMenuContent>
                        )}
                    </ContextMenu>
                );
            })}
        </div>
    );
}

// Helper to get language from file extension
function getLanguageFromPath(path: string | null) {
    if (!path) return 'plaintext';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx': return 'javascript';
        case 'ts':
        case 'tsx': return 'typescript';
        case 'py': return 'python';
        case 'rb': return 'ruby';
        case 'go': return 'go';
        case 'rs': return 'rust';
        case 'java': return 'java';
        case 'cpp':
        case 'cc':
        case 'c': return 'cpp';
        case 'cs': return 'csharp';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        case 'yml':
        case 'yaml': return 'yaml';
        case 'sh':
        case 'bash': return 'shell';
        default: return 'plaintext';
    }
}

export default function Home() {
  const [repoPath, setRepoPath] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [stashes, setStashes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [textGraph, setTextGraph] = useState('');
  const [historyLimit, setHistoryLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create Branch State
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Rebase State
  const [isRebaseOpen, setIsRebaseOpen] = useState(false);
  const [rebaseCommits, setRebaseCommits] = useState<any[]>([]);
  const [rebaseTarget, setRebaseTarget] = useState('');

  // Selection State
  const [selectedCommit, setSelectedCommit] = useState<any>(null);
  const [commitFiles, setCommitFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<any>(null);

  // View Mode: 'workdir' or 'commit'
  const [viewMode, setViewMode] = useState<'workdir' | 'commit'>('workdir');
  const [graphMode, setGraphMode] = useState<'visual' | 'terminal'>('terminal');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');

  // Recent Repositories
  const [recentRepos, setRecentRepos] = useState<string[]>([]);

  // Commit State
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [amend, setAmend] = useState(false);

  // Search State
  const [branchSearch, setBranchSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('recentRepos');
    if (saved) {
      try {
        setRecentRepos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent repos", e);
      }
    }
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
        setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('theme', theme);
  }, [theme]);

  const addToRecent = (path: string) => {
    if (!path) return;
    const updated = [path, ...recentRepos.filter(r => r !== path)].slice(0, 10);
    setRecentRepos(updated);
    localStorage.setItem('recentRepos', JSON.stringify(updated));
  };

  const loadRepo = async (limit = historyLimit, path = repoPath) => {
    if (!path) return;
    setLoading(true);
    setError('');
    // Clear selection when opening a new repo
    if (limit === 50) {
        setSelectedCommit(null);
        setCommitFiles([]);
        setSelectedFile(null);
        setDiffData(null);
        setViewMode('workdir');
    }
    
    try {
      const [statusData, logData, branchData, textGraphData, stashData] = await Promise.all([
        getRepoStatus(path),
        getRepoLog(path, limit),
        getBranches(path),
        getTextGraph(path),
        getStashes(path).catch(() => []) // Fallback if not supported
      ]);
      setStatus(statusData);
      setHistory(logData);
      setBranches(branchData);
      setTextGraph(textGraphData.output);
      setStashes(stashData || []);
      addToRecent(path);
    } catch (err: any) {
      setError(err.message || 'Failed to load repository');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = async () => {
      // Use window.require to bypass the bundler and access Electron at runtime
      if (typeof window !== 'undefined' && (window as any).require) {
          const { ipcRenderer } = (window as any).require('electron');
          const result = await ipcRenderer.invoke('dialog:openDirectory');
          if (result && !result.canceled && result.filePaths.length > 0) {
              const selectedPath = result.filePaths[0];
              setRepoPath(selectedPath);
              loadRepo(50, selectedPath);
          }
      } else {
          console.warn("Electron IPC is not available in this environment.");
      }
  };

  const handleCommitClick = async (commit: any) => {
      setSelectedCommit(commit);
      setViewMode('commit');
      setSelectedFile(null);
      setDiffData(null);
      try {
          const files = await getCommitChanges(repoPath, commit.id);
          setCommitFiles(files);
      } catch (err) {
          console.error("Failed to load commit changes", err);
      }
  };

  const handleGraphAction = async (action: string, commit: any) => {
      if (action === 'copy') {
          navigator.clipboard.writeText(commit.id);
          return;
      }
      if (action === 'checkout') handleCheckout(commit.id);
      if (action === 'merge') handleMerge(commit.id);
      if (action === 'cherrypick') handleCherryPick(commit.id);
      if (action === 'rebase') handleStartRebase(commit.id);
  };

  const handleTerminalCommitClick = (sha: string) => {
      // Find the commit object from history if loaded, or construct a partial one
      const commit = history.find(c => c.id.startsWith(sha));
      if (commit) {
          handleCommitClick(commit);
      } else {
          // Fallback if not in loaded history
          const shellCommit = { id: sha, message: 'Commit loaded from graph', author: '?', timestamp: new Date().toISOString() };
          handleCommitClick(shellCommit);
      }
  };

  const handleFileClick = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
        let diff;
        if (viewMode === 'workdir') {
            diff = await getFileDiff(repoPath, filePath);
        } else {
            diff = await getCommitFileDiff(repoPath, selectedCommit.id, filePath);
        }
        setDiffData(diff);
    } catch (err) {
        console.error("Failed to load diff", err);
    }
  };

  const toggleStage = async (file: any) => {
      if (viewMode !== 'workdir') return;
      try {
          if (file.status.includes('Index') || file.status === 'Staged') {
             await unstageFile(repoPath, file.path);
          } else {
             await stageFile(repoPath, file.path);
          }
          const statusData = await getRepoStatus(repoPath);
          setStatus(statusData);
      } catch (err: any) {
          setError(err.message);
      }
  };

  const loadMore = () => {
      const newLimit = historyLimit + 50;
      setHistoryLimit(newLimit);
      loadRepo(newLimit);
  };

  const handleCommit = async () => {
      if (!commitMessage) return;
      setIsCommitting(true);
      try {
          await commitChanges(repoPath, commitMessage, "GitForge User", "user@gitforge.local", amend);
          setCommitMessage('');
          setAmend(false);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsCommitting(false);
      }
  };

  // Actions
  const handleCheckout = async (target: string) => {
      setActionLoading(true);
      try {
          await checkout(repoPath, target);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleMerge = async (target: string) => {
      if (!confirm(`Are you sure you want to merge ${target} into current HEAD?`)) return;
      setActionLoading(true);
      try {
          await merge(repoPath, target);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleCherryPick = async (commitSha: string) => {
      if (!confirm(`Cherry-pick commit ${commitSha.substring(0,7)}?`)) return;
      setActionLoading(true);
      try {
          await cherryPick(repoPath, commitSha);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleCreateBranch = async () => {
      if (!newBranchName) return;
      setActionLoading(true);
      try {
          await createBranch(repoPath, newBranchName);
          setNewBranchName('');
          setIsCreateBranchOpen(false);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleFetch = async () => {
      setActionLoading(true);
      try {
          await fetchRepo(repoPath);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handlePull = async () => {
      setActionLoading(true);
      try {
          await pullRepo(repoPath);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handlePush = async () => {
      setActionLoading(true);
      try {
          await pushRepo(repoPath);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleStashPush = async () => {
      const msg = prompt("Stash message (optional):");
      if (msg === null) return;
      setActionLoading(true);
      try {
          await stashChanges(repoPath, msg);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleStashPop = async (index = 0) => {
      setActionLoading(true);
      try {
          await popStash(repoPath, index);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleUndoCommit = async () => {
      if (!confirm("Undo last commit? This will perform a soft reset, keeping your changes staged.")) return;
      setActionLoading(true);
      try {
          await undoLastCommit(repoPath);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleStartRebase = async (target: string) => {
      setActionLoading(true);
      try {
          // In a real app, we'd fetch the commits between HEAD and target
          // For now, we'll use the last 5 commits as a demo if we don't have the list
          const commitsToRebase = history.slice(0, 5); 
          setRebaseCommits(commitsToRebase);
          setRebaseTarget(target);
          setIsRebaseOpen(true);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const onRebaseConfirm = async (instructions: any[]) => {
      setIsRebaseOpen(false);
      setActionLoading(true);
      try {
          await startInteractiveRebase(repoPath, rebaseTarget);
          await continueRebase(repoPath, instructions);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <main className={`flex h-screen pb-[20px] bg-background ${theme === 'dark' ? 'dark text-foreground' : ''}`}>
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col h-full overflow-hidden">
        <div className="p-4 font-bold text-xl tracking-tight flex-shrink-0 flex justify-between items-center">
            <span>GitForge</span>
            <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Create Branch">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Branch</DialogTitle>
                        <DialogDescription>
                            Create a new branch from the current HEAD.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateBranch} disabled={!newBranchName || actionLoading}>Create Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <Separator />
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                    placeholder="Search branches..." 
                    className="pl-7 h-8 text-xs" 
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                />
            </div>

            {recentRepos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Recent Repositories</h3>
                  <div className="space-y-1">
                      {recentRepos.map(path => (
                        <div 
                            key={path} 
                            className={`text-sm px-2 py-1 rounded cursor-pointer truncate ${repoPath === path ? 'bg-muted font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                            title={path}
                            onClick={() => { setRepoPath(path); loadRepo(50, path); }}
                        >
                          {path.split('/').pop() || path}
                        </div>
                      ))}
                  </div>
                </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Local Branches</h3>
              <div className="space-y-1">
                  {branches.filter(b => !b.isRemote && b.name.toLowerCase().includes(branchSearch.toLowerCase())).map(b => (
                    <div 
                        key={b.name} 
                        className={`text-sm px-2 py-1 rounded cursor-pointer truncate flex items-center gap-2 ${b.isCurrentRepositoryHead ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                        title={b.name}
                        onClick={() => handleCheckout(b.name)}
                    >
                      {b.isCurrentRepositoryHead && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      <span className="truncate">{b.name}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {branches.some(b => b.isRemote) && (
                <div>
                  <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Remote Branches</h3>
                  <div className="space-y-1">
                      {branches.filter(b => b.isRemote && b.name.toLowerCase().includes(branchSearch.toLowerCase())).map(b => (
                        <div 
                            key={b.name} 
                            className="text-sm px-2 py-1 rounded truncate text-muted-foreground/70 hover:text-foreground hover:bg-muted cursor-pointer"
                            title={b.name}
                            onClick={() => handleCheckout(b.name)}
                        >
                          {b.name.replace('origin/', '')}
                        </div>
                      ))}
                  </div>
                </div>
            )}
            
            {stashes.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground flex justify-between items-center">
                        <span>Stashes</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleStashPop(0)} title="Pop Latest Stash">
                            <Archive className="h-3 w-3" />
                        </Button>
                    </h3>
                    <div className="space-y-1">
                        {stashes.map((s, i) => (
                            <div key={i} className="group flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground cursor-default">
                                <span className="truncate" title={s.message}>{s.message || `stash@{${i}}`}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-4 w-4 opacity-0 group-hover:opacity-100" 
                                    onClick={() => handleStashPop(i)}
                                    title="Pop this stash"
                                >
                                    <Archive className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <Separator />
            
            <div className="flex flex-col gap-2">
                <Button 
                    variant={viewMode === 'workdir' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="justify-start"
                    onClick={() => { setViewMode('workdir'); setSelectedFile(null); setDiffData(null); }}
                >
                    Working Directory
                </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Bar */}
        <div className="h-14 border-b flex items-center px-4 space-x-2 flex-shrink-0">
          <div className="flex gap-2 w-full max-w-xl">
              <Input
                placeholder="Absolute path to local repository..."
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadRepo(50)}
                className="flex-1 text-sm"
              />
              <Button variant="secondary" onClick={handleBrowse} title="Browse Folder">
                  Browse...
              </Button>
          </div>
          <Button size="sm" onClick={() => loadRepo(50)} disabled={loading}>
            {loading ? 'Loading...' : 'Open Repo'}
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleFetch} disabled={actionLoading} title="Fetch">
                  <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePull} disabled={actionLoading} title="Pull">
                  <ArrowDown className="h-4 w-4 mr-1" /> Pull
              </Button>
              <Button variant="outline" size="sm" onClick={handlePush} disabled={actionLoading} title="Push">
                  <ArrowUp className="h-4 w-4 mr-1" /> Push
              </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm border-b flex justify-between items-center flex-shrink-0">
            <span>{error}</span>
            <Button variant="ghost" size="xs" onClick={() => setError('')}>Dismiss</Button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Status Column */}
          <div className="w-80 border-r flex flex-col bg-muted/5 relative h-full overflow-hidden">
            <div className="p-3 border-b font-medium bg-muted/50 flex justify-between items-center h-12 flex-shrink-0">
                <span className="text-sm uppercase tracking-wider font-bold">
                    {viewMode === 'workdir' ? 'Changes' : 'Commit Details'}
                </span>
                {viewMode === 'commit' ? (
                    <Button variant="ghost" size="xs" onClick={() => setViewMode('workdir')} className="h-7 text-[10px]">
                        Back to WD
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadRepo(historyLimit)} title="Refresh Status">
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={async () => {
                            if (!status?.files) return;
                            setActionLoading(true);
                            try {
                                for (const file of status.files) {
                                    if (!file.status.includes("Index") && file.status !== "Staged") {
                                        await stageFile(repoPath, file.path);
                                    }
                                }
                                await loadRepo(historyLimit);
                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                        }} className="h-7 text-[10px]">
                            Stage All
                        </Button>
                        <Button variant="ghost" size="xs" onClick={async () => {
                            if (!status?.files) return;
                            setActionLoading(true);
                            try {
                                for (const file of status.files) {
                                    if (file.status.includes("Index") || file.status === "Staged") {
                                        await unstageFile(repoPath, file.path);
                                    }
                                }
                                await loadRepo(historyLimit);
                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                        }} className="h-7 text-[10px]">
                            Unstage All
                        </Button>
                    </div>
                )}
            </div>
            
            {viewMode === 'commit' && selectedCommit && (
                <ContextMenu>
                    <ContextMenuTrigger className="p-3 border-b bg-primary/5 text-xs space-y-1 cursor-context-menu select-none hover:bg-primary/10 transition-colors flex-shrink-0">
                        <div className="font-bold truncate" title={selectedCommit.message}>{selectedCommit.message}</div>
                        <div className="text-muted-foreground truncate font-mono">{selectedCommit.id}</div>
                        <div className="text-muted-foreground flex justify-between">
                            <span>{selectedCommit.author}</span>
                            <span className="opacity-50 text-[10px] self-center">Right-click for actions</span>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                        <ContextMenuItem onClick={() => handleCheckout(selectedCommit.id)}>
                            Checkout this Commit
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleMerge(selectedCommit.id)}>
                            Merge into Current
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleCherryPick(selectedCommit.id)}>
                            Cherry-Pick
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => {
                            navigator.clipboard.writeText(selectedCommit.id);
                        }}>
                            Copy SHA
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            )}

            <ScrollArea className="flex-1">
              <div className="p-2">
                <FileTree 
                    files={viewMode === 'workdir' ? status?.files || [] : commitFiles}
                    selectedFile={selectedFile}
                    onFileClick={handleFileClick}
                    onToggleStage={toggleStage}
                    viewMode={viewMode}
                    onResolve={async (file) => {
                        try {
                            await stageFile(repoPath, file.path);
                            await loadRepo(historyLimit);
                        } catch (err: any) { setError(err.message); }
                    }}
                />
                
                {((viewMode === 'workdir' ? !status?.files?.length : !commitFiles.length)) && repoPath && !loading && (
                  <div className="text-sm text-muted-foreground p-8 text-center italic">
                      {viewMode === 'workdir' ? 'Clean working directory' : 'No changes in this commit'}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Loading Overlay for Actions */}
            {actionLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
                    <span className="text-sm font-medium animate-pulse">Running Git Action...</span>
                </div>
            )}
            
            {/* Commit Box (Only in WorkDir) */}
            {viewMode === 'workdir' && (
                <div className="p-3 border-t bg-background space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="amend" checked={amend} onCheckedChange={(checked) => setAmend(!!checked)} />
                            <label htmlFor="amend" className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Amend
                            </label>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleUndoCommit} title="Undo Last Commit (Soft Reset)">
                                <Undo className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleStashPush} title="Stash Changes">
                                <Archive className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    <Textarea 
                        placeholder="Commit message..." 
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="text-xs resize-none h-20 shadow-none border-muted"
                    />
                    <Button size="sm" className="w-full" onClick={handleCommit} disabled={isCommitting || !commitMessage}>
                        {isCommitting ? 'Committing...' : (amend ? 'Amend Commit' : 'Commit')}
                    </Button>
                </div>
            )}
          </div>

          {/* Center Area (Diff or Graph) */}
          <div className="flex-1 flex flex-col overflow-hidden h-full">
             {selectedFile && diffData ? (
                 <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
                     <div className="h-12 px-4 border-b text-xs flex justify-between items-center bg-muted/20 flex-shrink-0">
                         <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono font-bold truncate">{selectedFile}</span>
                            <div className="flex items-center bg-muted/50 rounded p-0.5">
                                <Button 
                                    variant={diffMode === 'side-by-side' ? 'secondary' : 'ghost'} 
                                    size="xs" 
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setDiffMode('side-by-side')}
                                >
                                    Side-by-Side
                                </Button>
                                <Button 
                                    variant={diffMode === 'inline' ? 'secondary' : 'ghost'} 
                                    size="xs" 
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setDiffMode('inline')}
                                >
                                    Inline
                                </Button>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="h-8" onClick={() => { setSelectedFile(null); setDiffData(null); }}>
                             Close Diff
                         </Button>
                     </div>
                     <div className="flex-1 p-2 overflow-hidden">
                        <DiffView 
                            original={diffData.originalContent} 
                            modified={diffData.modifiedContent} 
                            language={getLanguageFromPath(selectedFile)}
                            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                            renderSideBySide={diffMode === 'side-by-side'}
                        />
                     </div>
                 </div>
             ) : (
                <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                    <div className="p-3 border-b font-medium bg-muted/50 flex justify-between items-center h-12 flex-shrink-0">
                        <span className="text-sm uppercase tracking-wider font-bold">History Graph</span>
                        <div className="flex items-center gap-2">
                            <div className="relative w-48 mr-2">
                                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                <Input 
                                    placeholder="Search history..." 
                                    className="pl-7 h-7 text-[10px] bg-background/50" 
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant={graphMode === 'visual' ? 'secondary' : 'ghost'} 
                                size="xs" 
                                onClick={() => setGraphMode('visual')}
                                title="Visual Graph"
                            >
                                <GitGraphIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={graphMode === 'terminal' ? 'secondary' : 'ghost'} 
                                size="xs" 
                                onClick={() => setGraphMode('terminal')}
                                title="Terminal Graph"
                            >
                                <Terminal className="h-4 w-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-4" />
                            {history.length > 0 && (
                                <Button variant="outline" size="xs" onClick={loadMore} disabled={loading} className="h-7 text-[10px]">
                                    {loading ? 'Loading...' : 'Load 50 More'}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden h-full bg-slate-950">
                        {graphMode === 'visual' ? (
                            history.length > 0 ? (
                                <CommitGraph 
                                    commits={history.filter(c => 
                                        c.message.toLowerCase().includes(historySearch.toLowerCase()) || 
                                        c.id.toLowerCase().includes(historySearch.toLowerCase()) ||
                                        c.author.toLowerCase().includes(historySearch.toLowerCase())
                                    )} 
                                    branches={branches} 
                                    onCommitClick={handleCommitClick} 
                                    onAction={handleGraphAction} 
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                                    {repoPath ? (loading ? 'Loading history...' : 'No commits found') : 'Enter a repository path to begin'}
                                </div>
                            )
                        ) : (
                            <ScrollArea className="h-full w-full">
                                <div className="p-6 text-slate-100">
                                    <InteractiveTerminalGraph 
                                        content={textGraph} 
                                        onCommitSelect={handleTerminalCommitClick} 
                                        onAction={handleGraphAction}
                                    />
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
             )}
          </div>
        </div>
      </div>

      <RebaseDialog 
        open={isRebaseOpen} 
        onOpenChange={setIsRebaseOpen} 
        commits={rebaseCommits} 
        onConfirm={onRebaseConfirm}
        targetBranch={rebaseTarget}
      />
      
      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-primary text-primary-foreground text-[10px] flex items-center px-3 justify-between z-50">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 font-medium">
                  <Terminal className="h-3 w-3" />
                  <span>{repoPath || 'No repository open'}</span>
              </div>
              {branches.find(b => b.isCurrentRepositoryHead) && (
                  <div className="flex items-center gap-1 font-bold">
                      <GitGraphIcon className="h-3 w-3" />
                      <span>{branches.find(b => b.isCurrentRepositoryHead)?.name}</span>
                  </div>
              )}
          </div>
          <div className="flex items-center gap-3">
              {status?.files && (
                  <>
                      <span>{status.files.filter((f: any) => f.status.includes("Index") || f.status === "Staged").length} staged</span>
                      <span>{status.files.filter((f: any) => !f.status.includes("Index") && f.status !== "Staged").length} unstaged</span>
                  </>
              )}
              <span className="opacity-70">GitForge v0.1.0</span>
          </div>
      </div>
    </main>
  );
}
