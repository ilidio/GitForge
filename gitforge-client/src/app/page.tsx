'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { getFileDiff, commitChanges, getCommitChanges, getCommitFileDiff, merge, cherryPick, createBranch, deleteBranch, fetchRepo, pullRepo, pushRepo, getTextGraph, getStashes, stashChanges, popStash, dropStash, undoLastCommit, startInteractiveRebase, continueRebase, abortRebase } from '@/lib/api';
import { checkout, getTags, createTag, deleteTag, appendFile, getBlame, getBlamePorcelain, getReflog, reset, openDifftool, restoreAll, getCustomGraph, initRepo, getDiffFile, dropStashElectron, gitRm, bisectStart, bisectReset, bisectGood, bisectBad, revertCommit, gitArchive, gitGc, gitMv, generateAICommitMessage, getLog, stashPush, getDiffDetails, fetchCommitStatus, getConfig, getFileContentBinary, stageFile, unstageFile, getRepoStatus, getBranches, discardPath, discardUnstaged } from '@/lib/electron';
import DiffView from '@/components/DiffView';
import InternalDiffView from '@/components/InternalDiffView';
import PatchView from '@/components/PatchView';
import ImageDiffView from '@/components/ImageDiffView';
import dynamic from 'next/dynamic';
const TerminalPanel = dynamic(() => import('@/components/TerminalPanel'), { ssr: false });
import FileSearchDialog from '@/components/FileSearchDialog';
import FileTree from '@/components/FileTree';
import RebaseDialog from '@/components/RebaseDialog';
import BisectControls from '@/components/BisectControls';
import ReflogDialog from '@/components/ReflogDialog';
import GlobalLoader from '@/components/GlobalLoader';
import WorktreeDialog from '@/components/WorktreeDialog';
import CommandPalette from '@/components/CommandPalette';
import SettingsDialog from '@/components/SettingsDialog';
import FileHistoryDialog from '@/components/FileHistoryDialog';
import MergeConflictView from '@/components/MergeConflictView';
import SidebarPRSection from '@/components/SidebarPRSection';
import SidebarIssuesSection from '@/components/SidebarIssuesSection';
import GitFlowDialog from '@/components/GitFlowDialog';
import WorkspaceDialog from '@/components/WorkspaceDialog';
import TemplateSelector from '@/components/TemplateSelector';
import GrepSearchDialog from '@/components/GrepSearchDialog';
import GlobalGrepDialog from '@/components/GlobalGrepDialog';
import RepoInsightsDialog from '@/components/RepoInsightsDialog';
import SubmoduleSection from '@/components/SubmoduleSection';
import HelpDialog from '@/components/HelpDialog';
import CloneDialog from '@/components/CloneDialog';
import StashDialog from '@/components/StashDialog';
import Ansi from 'ansi-to-react';
import { Plus, RefreshCw, ArrowDown, ArrowUp, Terminal, GitGraph as GitGraphIcon, Moon, Sun, Search, Archive, Undo, Settings2, Tag, Trash, FileCode, RotateCcw, GitBranch, Folder, ExternalLink, GripVertical, HelpCircle, BarChart3, Globe, DownloadCloud, Sparkles, Layers, Loader2 } from 'lucide-react';
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
                                <ContextMenuItem onClick={() => onAction?.('tag', commitStub)}>
                                    Create Tag...
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
  const [tags, setTags] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [textGraph, setTextGraph] = useState('');
  const [historyLimit, setHistoryLimit] = useState(50);
  const [commitStatuses, setCommitStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphNonce, setGraphNonce] = useState(0);
  const [error, setError] = useState('');
  
  // Cache for graph output
  const graphCache = useRef<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create Branch State
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Rebase State
  const [isRebaseOpen, setIsRebaseOpen] = useState(false);
  const [rebaseCommits, setRebaseCommits] = useState<any[]>([]);
  const [rebaseTarget, setRebaseTarget] = useState('');

  // Bisect State
  const [bisectActive, setBisectActive] = useState(false);
  const [bisectStatus, setBisectStatus] = useState('');
  const [bisectGoodCommit, setBisectGoodCommit] = useState<string | null>(null);
  const [bisectBadCommit, setBisectBadCommit] = useState<string | null>(null);

  // Selection State
  const [selectedCommit, setSelectedCommit] = useState<any>(null);
  const [commitFiles, setCommitFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<any>(null);

  // View Mode: 'workdir' or 'commit'
  const [viewMode, setViewMode] = useState<'workdir' | 'commit'>('workdir');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [useInternalDiff, setUseInternalDiff] = useState(true);
  const [isPatchMode, setIsPatchMode] = useState(false);

  // Command Palette & Settings
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFileSearchOpen, setIsFileSearchOpen] = useState(false);
  
  // Blame State
  const [isBlameOpen, setIsBlameOpen] = useState(false);
  const [blameContent, setBlameContent] = useState('');
  const [blameData, setBlameData] = useState<any[]>([]);

  // File History State
  const [isFileHistoryOpen, setIsFileHistoryOpen] = useState(false);
  const [historyFilePath, setHistoryFilePath] = useState<string | null>(null);

  // Git Flow State
  const [isGitFlowOpen, setIsGitFlowOpen] = useState(false);

  // Workspaces State
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Grep Search State
  const [isGrepSearchOpen, setIsGrepSearchOpen] = useState(false);

  // Help State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Clone State
  const [isCloneOpen, setIsCloneOpen] = useState(false);

  // Reflog & Worktree State
  const [isReflogOpen, setIsReflogOpen] = useState(false);
  const [isWorktreeOpen, setIsWorktreeOpen] = useState(false);

  // Global Search State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Insights State
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  // Stash Dialog State
  const [isStashDialogOpen, setIsStashDialogOpen] = useState(false);

  // Terminal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Graph Views State
  const defaultGraphViews = {
    sourcetree: {
      label: "SourceTree",
      description: "Clean branch-focused view",
      command: "git log --graph --all --oneline --decorate --pretty=format:\"%C(auto)%h %d %s\""
    },
    compact: {
      label: "Compact",
      command: "git log --oneline --graph"
    },
    detailed: {
      label: "Detailed",
      command: "git log --all --branches --tags --decorate --graph --pretty=format:\"%H|%an|%ad|%s\""
    },
    classic: {
        label: "Git Log",
        command: "git log --all --graph --decorate"
    }
  };
  const [graphViews, setGraphViews] = useState<any>(defaultGraphViews);
  const [activeGraphView, setActiveGraphView] = useState('sourcetree');

  // Recent Repositories
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  
  // Advanced Search State
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchDate, setSearchDate] = useState('');

  // UI State
  const [changesWidth, setChangesWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  // Commit State
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [amend, setAmend] = useState(false);
  const [pushOnCommit, setPushOnCommit] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Search State
  const [branchSearch, setBranchSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing) return;
          // Calculate new width based on mouse position relative to sidebar (fixed 256px)
          const newWidth = e.clientX - 256; 
          if (newWidth > 300 && newWidth < 800) {
              setChangesWidth(newWidth);
          }
      };

      const handleMouseUp = () => {
          setIsResizing(false);
          document.body.style.cursor = 'default';
      };

      if (isResizing) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = 'col-resize';
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isResizing]);

  useEffect(() => {
    const saved = localStorage.getItem('recentRepos');
    if (saved) {
      try {
        setRecentRepos(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent repos", e);
      }
    }
    const savedWs = localStorage.getItem('workspaces');
    if (savedWs) {
        try { setWorkspaces(JSON.parse(savedWs)); } catch {}
    }
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
        setTheme(savedTheme);
    }
  }, []);

  const saveWorkspaces = (newWs: any[]) => {
      setWorkspaces(newWs);
      localStorage.setItem('workspaces', JSON.stringify(newWs));
  };

  useEffect(() => {
      localStorage.setItem('theme', theme);
  }, [theme]);

  // Keyboard Shortcuts Effect
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) {
              setIsHelpOpen(true);
          }
      };
      window.addEventListener('keydown', handleKeyDown);

      // Electron Menu Listeners
      if (typeof window !== 'undefined' && (window as any).require) {
          const { ipcRenderer } = (window as any).require('electron');
          ipcRenderer.on('menu:open-settings', () => setIsSettingsOpen(true));
          ipcRenderer.on('menu:open-repo', (_: any, path: string) => {
              setRepoPath(path);
              loadRepo(50, path);
          });
      }

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          if (typeof window !== 'undefined' && (window as any).require) {
              const { ipcRenderer } = (window as any).require('electron');
              ipcRenderer.removeAllListeners('menu:open-settings');
              ipcRenderer.removeAllListeners('menu:open-repo');
          }
      };
  }, []);

  // Auto-Fetch Effect
  useEffect(() => {
      if (!repoPath) return;
      const interval = setInterval(() => {
          console.log("Auto-fetching...");
          fetchRepo(repoPath).then(() => loadRepo(historyLimit, repoPath, true)).catch(console.error);
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
  }, [repoPath, historyLimit]);

  const addToRecent = (path: string) => {
    if (!path) return;
    const updated = [path, ...recentRepos.filter(r => r !== path)].slice(10);
    setRecentRepos(updated);
    localStorage.setItem('recentRepos', JSON.stringify(updated));
  };

  const loadRepo = async (limit = historyLimit, path = repoPath, silent = false) => {
    if (!path) return;
    if (!silent) setLoading(true);
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
      const [statusData, logData, branchData, stashData] = await Promise.all([
        getRepoStatus(path),
        getLog(path, limit),
        getBranches(path),
        getStashes(path).catch(() => []) 
      ]);
      setStatus(statusData);
      setHistory(logData);
      setBranches(branchData);
      setStashes(stashData || []);

      // Update history limit state if it changed (ensures graph effect stays in sync)
      if (limit !== historyLimit) setHistoryLimit(limit);
      
      // Trigger graph refresh via effect
      setGraphNonce(n => n + 1);
      
      // Load Tags via Electron IPC
      getTags(path).then(tagStr => {
          const parsed = tagStr.split('\n').filter(Boolean).map((line: string) => {
              const parts = line.trim().split(/\s+/);
              const name = parts[0];
              return { name, message: line.substring(name.length).trim() };
          });
          setTags(parsed);
      }).catch(e => console.error("Tags not supported", e));

      addToRecent(path);
      
      // Fetch statuses
      loadStatuses(path, logData);
    } catch (err: any) {
      setError(err.message || 'Failed to load repository');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadStatuses = async (path: string, commits: any[]) => {
      try {
          const config = await getConfig(path);
          const lines = config.split('\n');
          const tokenLine = lines.find((l: string) => l.startsWith('github.token='));
          const remoteLine = lines.find((l: string) => l.startsWith('remote.origin.url='));
          
          if (!tokenLine || !remoteLine) return;
          
          const token = tokenLine.split('=')[1];
          let cleanUrl = remoteLine.split('=')[1].replace('.git', '');
          const parts = cleanUrl.split(/[/:]/);
          const repo = parts.pop();
          const owner = parts.pop();
          
          if (!owner || !repo || !token) return;

          // Fetch for latest 10 commits to avoid rate limits
          const recentCommits = commits.slice(0, 10);
          const newStatuses: Record<string, string> = {};
          
          await Promise.all(recentCommits.map(async (c: any) => {
              const status = await fetchCommitStatus(owner, repo, c.id, token);
              if (status) newStatuses[c.id] = status;
          }));
          
          setCommitStatuses(prev => ({ ...prev, ...newStatuses }));
      } catch (e) {
          console.error("Failed to load statuses", e);
      }
  };

  const handleGraphViewChange = (viewKey: string) => {
      setActiveGraphView(viewKey);
  };

  useEffect(() => {
      if (repoPath) {
          const activeCmd = graphViews[activeGraphView]?.command || defaultGraphViews.sourcetree.command;
          const cmdWithLimit = `${activeCmd} -n ${historyLimit}`;
          
          // Check cache (key by repo + command + limit + HEAD)
          // We use the first commit ID (HEAD) as a cache key validator
          const headSha = history[0]?.id;
          const cacheKey = `${repoPath}|${activeGraphView}|${historyLimit}|${headSha}`;
          
          if (headSha && graphCache.current[cacheKey]) {
              setTextGraph(graphCache.current[cacheKey]);
              return;
          }

          setGraphLoading(true);
          getCustomGraph(repoPath, cmdWithLimit)
            .then(output => {
                setTextGraph(output);
                if (headSha) {
                    graphCache.current[cacheKey] = output;
                }
            })
            .catch(console.error)
            .finally(() => setGraphLoading(false));
      }
  }, [activeGraphView, repoPath, historyLimit, graphNonce]);

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

  const handleInit = async () => {
      // Prompt for directory
      if (typeof window !== 'undefined' && (window as any).require) {
          const { ipcRenderer } = (window as any).require('electron');
          const result = await ipcRenderer.invoke('dialog:openDirectory');
          if (result && !result.canceled && result.filePaths.length > 0) {
              const selectedPath = result.filePaths[0];
              try {
                  setLoading(true);
                  await initRepo(selectedPath);
                  setRepoPath(selectedPath);
                  await loadRepo(50, selectedPath);
              } catch(e: any) {
                  setError(e.message);
              } finally {
                  setLoading(false);
              }
          }
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

  const handleGraphAction = async (action: string, commit: any, extra?: any) => {
      if (action === 'copy') {
          navigator.clipboard.writeText(commit.id);
          return;
      }
      if (action === 'checkout') handleCheckout(commit.id);
      if (action === 'merge') handleMerge(commit.id);
      if (action === 'cherrypick') handleCherryPick(commit.id);
      if (action === 'rebase') handleStartRebase(commit.id);
      if (action === 'tag') handleCreateTag(commit.id);
      if (action === 'drop-branch') {
          const branchName = extra.name;
          // Prompt for action
          const choice = confirm(`Dropped branch "${branchName}" onto commit ${commit.id.substring(0,7)}. \n\nOK to Merge? \nCancel to Rebase? (Press ESC to abort)`);
          if (choice === null) return;
          if (choice) {
              handleMerge(branchName);
          } else {
              // Note: our rebase UI assumes we rebase CURRENT onto TARGET.
              // Here we might want to rebase DROPPED onto TARGET? 
              // Usually drag-and-drop means "do something with this branch here".
              handleStartRebase(commit.id); 
          }
      }
  };

  const handleBranchDragStart = (e: React.DragEvent, branch: any) => {
      e.dataTransfer.setData('gitforge/branch', JSON.stringify(branch));
      e.dataTransfer.effectAllowed = 'move';
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

// Helper to check if file is image
function isImage(path: string) {
    return /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i.test(path);
}

  const handleFileClick = async (filePath: string, isStagedView?: boolean) => {
    setSelectedFile(filePath);
    setIsPatchMode(false);
    try {
        let diff;
        
        // Determine staging status for workdir view
        // Priority: Explicit argument > Fallback to status check
        let isStaged = false;
        if (viewMode === 'workdir') {
            const fileStatus = status?.files?.find((f: any) => f.path === filePath)?.status || '';
            isStaged = isStagedView !== undefined 
                ? isStagedView 
                : (fileStatus.includes('Index') || fileStatus === 'Staged');
        }

        if (isImage(filePath)) {
            // Load binary data
            const originalBase64 = await getFileContentBinary(repoPath, 'HEAD', filePath);
            let modifiedBase64 = null;
            
            if (viewMode === 'workdir') {
                if (isStaged) {
                    modifiedBase64 = await getFileContentBinary(repoPath, '', filePath); // git show :path
                }
                // Unstaged images in workdir are tricky to read in Electron without file protocol, 
                // skipping for now or user sees broken image if not staged.
            } else {
                modifiedBase64 = await getFileContentBinary(repoPath, selectedCommit.id, filePath);
            }
            
            diff = {
                isImage: true,
                originalUrl: originalBase64 ? `data:image/png;base64,${originalBase64}` : '',
                modifiedUrl: modifiedBase64 ? `data:image/png;base64,${modifiedBase64}` : ''
            };
        } else if (viewMode === 'workdir') {
            const details = await getDiffDetails(repoPath, filePath, isStaged);
            
            diff = {
                originalContent: details.original,
                modifiedContent: details.modified,
                patch: details.patch,
                isStaged
            };
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
          if (pushOnCommit) {
              await pushRepo(repoPath);
          }
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsCommitting(false);
      }
  };

  const handleAICommit = async () => {
      const apiKey = localStorage.getItem('ai_api_key');
      if (!apiKey) {
          alert('Please configure your AI API Key in Settings.');
          setIsSettingsOpen(true);
          return;
      }
      
      setIsGeneratingAI(true);
      try {
          // Get diff of staged files
          const diff = await getDiffFile(repoPath, '.', true);
          if (!diff || diff.length < 10) {
              alert('Stage some changes first to generate a commit message.');
              setIsGeneratingAI(false);
              return;
          }
          
          const provider = localStorage.getItem('ai_provider') || 'openai';
          const model = localStorage.getItem('ai_model') || 'gpt-3.5-turbo';
          let endpoint = 'https://api.openai.com/v1/chat/completions';
          if (provider === 'gemini') {
              endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          }
          
          const context = localStorage.getItem('ai_context') || '';

          const message = await generateAICommitMessage(diff, apiKey, endpoint, model, context);
          if (message) setCommitMessage(message);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setIsGeneratingAI(false);
      }
  };

  const handleStashFile = async (path: string) => {
      const msg = prompt(`Stash message for ${path}:`, `Stash ${path}`);
      if (msg === null) return;
      
      setActionLoading(true);
      try {
          await stashPush(repoPath, msg, [path]);
          await loadRepo(historyLimit);
      } catch(e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  // Actions
  const handleCheckout = async (target: string) => {
      // Don't do anything if we are already on this branch/commit
      const currentBranch = branches.find(b => b.isCurrentRepositoryHead);
      if (currentBranch && (currentBranch.name === target || currentBranch.commitId === target || currentBranch.commitId?.startsWith(target))) return;

      // Check for uncommitted changes
      const hasChanges = status?.files?.some((f: any) => f.status.includes("Modified") || f.status.includes("Staged") || f.status.includes("Untracked"));
      
      if (hasChanges) {
          if (confirm("You have local changes. Stash them and checkout? \n\nClick OK to Stash & Checkout.\nClick Cancel to abort.")) {
              setActionLoading(true);
              try {
                  await stashChanges(repoPath, `Auto-stash before checkout to ${target}`);
              } catch (e: any) {
                  setError("Failed to stash changes: " + e.message);
                  setActionLoading(false);
                  return;
              }
          } else {
              return;
          }
      }

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

  const handleCreateTag = async (sha: string) => {
      const name = prompt("Tag Name:");
      if (!name) return;
      setActionLoading(true);
      try {
          await createTag(repoPath, name, name, sha);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleDeleteTag = async (name: string) => {
      if (!confirm(`Delete tag ${name}?`)) return;
      setActionLoading(true);
      try {
          await deleteTag(repoPath, name);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleIgnoreFile = async (path: string) => {
      try {
          // Check if .gitignore exists first? fs append will create if not exists usually.
          await appendFile(`${repoPath}/.gitignore`, `\n${path}`);
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleDiscardFile = async (path: string, isStaged?: boolean) => {
      if (!confirm(`Discard changes to ${path}? This cannot be undone.`)) return;
      setActionLoading(true);
      try {
          // If staged view, we discard everything to HEAD (nuke)
          // If unstaged view, we only discard unstaged changes (revert to Index)
          if (isStaged) {
              await discardPath(repoPath, path);
          } else {
              await discardUnstaged(repoPath, path);
          }
          await loadRepo(historyLimit);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleBlame = async () => {
      if (!selectedFile) return;
      try {
          const content = await getBlamePorcelain(repoPath, selectedFile);
          const lines = content.split('\n');
          const parsedData = [];
          let currentCommit: any = {};
          
          for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.match(/^[0-9a-f]{40} \d+ \d+/)) {
                  const [sha, originalLine, finalLine] = line.split(' ');
                  currentCommit = { sha, originalLine, finalLine };
              } else if (line.startsWith('author ')) {
                  currentCommit.author = line.substring(7);
              } else if (line.startsWith('author-time ')) {
                  currentCommit.time = parseInt(line.substring(12));
              } else if (line.startsWith('summary ')) {
                  currentCommit.summary = line.substring(8);
              } else if (line.startsWith('\t')) {
                  currentCommit.content = line.substring(1);
                  parsedData.push(currentCommit);
                  currentCommit = {};
              }
          }
          setBlameData(parsedData);
          setIsBlameOpen(true);
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleOpenExternalDiff = async () => {
      if (!selectedFile) return;
      setActionLoading(true);
      try {
          await openDifftool(repoPath, selectedFile);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleRestoreAll = async () => {
      if (!confirm("Discard all uncommitted changes? This cannot be undone.")) return;
      setActionLoading(true);
      try {
          await restoreAll(repoPath);
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
          setIsStashDialogOpen(false);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleStashDrop = async (index: number) => {
      if (!confirm("Are you sure you want to drop this stash?")) return;
      setActionLoading(true);
      try {
          await dropStash(repoPath, index);
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

  const handleMagicUndo = async () => {
      setActionLoading(true);
      try {
          const reflog = await getReflog(repoPath, 2);
          const entries = reflog.split('\n');
          // entries[0] is HEAD@{0} (current), entries[1] is HEAD@{1} (previous)
          if (entries.length < 2) {
              alert("Nothing to undo.");
              return;
          }
          const prev = entries[1].split('|');
          const sha = prev[0];
          const action = prev[2];

          if (!confirm(`Undo last action ("${action}")? This will HARD reset to ${sha}.`)) return;

          await reset(repoPath, sha, 'hard');
          await loadRepo(historyLimit);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleFileHistory = (path: string) => {
      setHistoryFilePath(path);
      setIsFileHistoryOpen(true);
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

  const handleBisectStart = async (bad: string, good: string) => {
      if (!bad || !good) return;
      setActionLoading(true);
      try {
          const output = await bisectStart(repoPath, bad, good);
          setBisectActive(true);
          setBisectStatus(output);
          setBisectGoodCommit(null);
          setBisectBadCommit(null);
          await loadRepo(historyLimit);
      } catch(e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleBisectStep = async (verdict: 'good' | 'bad') => {
      setActionLoading(true);
      try {
          let output;
          if (verdict === 'good') output = await bisectGood(repoPath);
          else output = await bisectBad(repoPath);

          if (output.includes('is the first bad commit')) {
              alert(output); // Found it!
              // Optionally reset automatically or let user inspect?
              // Let's reset after alert.
              await bisectReset(repoPath);
              setBisectActive(false);
          } else {
              setBisectStatus(output);
          }
          await loadRepo(historyLimit);
      } catch(e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleBisectReset = async () => {
      setActionLoading(true);
      try {
          await bisectReset(repoPath);
          setBisectActive(false);
          await loadRepo(historyLimit);
      } catch(e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleArchive = async (commitId: string) => {
       // Open Save Dialog via Electron
       if (typeof window !== 'undefined' && (window as any).require) {
          const { ipcRenderer } = (window as any).require('electron');
          const { canceled, filePath } = await ipcRenderer.invoke('dialog:saveFile', {
              defaultPath: `archive-${commitId.substring(0,7)}.zip`
          });
          if (canceled || !filePath) return;
          
          setActionLoading(true);
          try {
              await gitArchive(repoPath, commitId, filePath);
              alert(`Successfully exported to ${filePath}`);
          } catch(e: any) {
              setError(e.message);
          } finally {
              setActionLoading(false);
          }
       }
  };

  const handleGc = async () => {
      setActionLoading(true);
      try {
          await gitGc(repoPath);
          alert("Repository optimized (Garbage Collection complete).");
      } catch(e: any) {
          setError(e.message);
      } finally {
          setActionLoading(false);
      }
  };

  return (
    <main className={`flex h-screen pb-[20px] bg-background ${theme === 'dark' ? 'dark text-foreground' : ''}`}>
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col h-full overflow-hidden">
        <div className="p-4 font-bold text-xl tracking-tight flex-shrink-0 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <img src="/logo.svg" className="h-8 w-8 rounded-md bg-slate-900 p-1" alt="Logo" />
                <span>GitForge</span>
            </div>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Git Flow" onClick={() => setIsGitFlowOpen(true)}>
                    <GitBranch className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Settings" onClick={() => setIsSettingsOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                </Button>
                <Dialog open={isCreateBranchOpen} onOpenChange={setIsCreateBranchOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            title="Create Branch" 
                            disabled={!repoPath || history.length === 0}
                        >
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
                <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground flex justify-between items-center px-2">
                    <span>Workspaces</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsGlobalSearchOpen(true)} title="Global Workspace Search">
                            <Globe className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsWorkspaceOpen(true)}>
                            <Folder className="h-3 w-3" />
                        </Button>
                    </div>
                </h3>
                <div className="space-y-1">
                    {workspaces.map(ws => (
                        <div key={ws.id}>
                            <div 
                                className={`text-sm px-2 py-1 rounded cursor-pointer flex items-center gap-2 hover:bg-muted ${activeWorkspaceId === ws.id ? 'font-bold' : ''}`}
                                onClick={() => setActiveWorkspaceId(ws.id === activeWorkspaceId ? null : ws.id)}
                            >
                                <Folder className="h-3 w-3 text-blue-400" />
                                <span className="truncate">{ws.name}</span>
                            </div>
                            {activeWorkspaceId === ws.id && (
                                <div className="ml-4 border-l pl-2 mt-1 space-y-1">
                                    {ws.repos.map((r: string) => (
                                        <div 
                                            key={r}
                                            className={`text-xs px-2 py-1 rounded cursor-pointer truncate ${repoPath === r ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                                            onClick={() => { setRepoPath(r); loadRepo(50, r); }}
                                            title={r}
                                        >
                                            {r.split('/').pop()}
                                        </div>
                                    ))}
                                    {ws.repos.length === 0 && <div className="text-[10px] text-muted-foreground italic px-2">Empty</div>}
                                </div>
                            )}
                        </div>
                    ))}
                    {workspaces.length === 0 && <div className="text-xs text-muted-foreground px-2 italic">No workspaces</div>}
                </div>
            </div>

            {bisectActive && (
                <BisectControls 
                    onGood={() => handleBisectStep('good')}
                    onBad={() => handleBisectStep('bad')}
                    onReset={handleBisectReset}
                    status={bisectStatus}
                    loading={actionLoading}
                />
            )}

            <div>
              <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Local Branches</h3>
              <div className="space-y-1">
                  {branches.filter(b => !b.isRemote && b.name.toLowerCase().includes(branchSearch.toLowerCase())).map(b => (
                    <div 
                        key={b.name} 
                        className={`text-sm px-2 py-1 rounded cursor-grab active:cursor-grabbing truncate flex items-center gap-2 ${b.isCurrentRepositoryHead ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-muted-foreground'}`}
                        title={b.name}
                        onClick={() => handleCheckout(b.name)}
                        draggable="true"
                        onDragStart={(e) => handleBranchDragStart(e, b)}
                    >
                      {b.isCurrentRepositoryHead && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      <span className="truncate">{b.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            <SubmoduleSection repoPath={repoPath} />
            
            {branches.some(b => b.isRemote) && (
                <div>
                  <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Remote Branches</h3>
                  <div className="space-y-1">
                      {branches.filter(b => b.isRemote && b.name.toLowerCase().includes(branchSearch.toLowerCase())).map(b => (
                        <div 
                            key={b.name} 
                            className="text-sm px-2 py-1 rounded truncate text-muted-foreground/70 hover:text-foreground hover:bg-muted cursor-pointer"
                            title={b.name}
                            onClick={() => handleCheckout(b.name.replace(/^origin\//, ''))}
                        >
                          {b.name.replace('origin/', '')}
                        </div>
                      ))}
                  </div>
                </div>
            )}
            
            {tags.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium mb-2 uppercase text-muted-foreground">Tags</h3>
                    <div className="space-y-1">
                        {tags.map((t, i) => (
                            <ContextMenu key={i}>
                                <ContextMenuTrigger>
                                    <div className="text-sm px-2 py-1 rounded hover:bg-muted text-muted-foreground cursor-default flex items-center gap-2">
                                        <Tag className="h-3 w-3" />
                                        <span className="truncate" title={t.message}>{t.name}</span>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => handleDeleteTag(t.name)}>
                                        <Trash className="w-3 h-3 mr-2" /> Delete Tag
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
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
                            <ContextMenu key={i}>
                                <ContextMenuTrigger>
                                    <div className="group flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground cursor-default">
                                        <span 
                                            className="truncate cursor-pointer hover:text-foreground" 
                                            title="Click to view stash content"
                                            onClick={() => {
                                                handleCommitClick({
                                                    id: `stash@{${i}}`,
                                                    message: s.message || `On ${branches.find(b => b.isCurrentRepositoryHead)?.name}: Stash`,
                                                    author: 'Stash',
                                                    timestamp: new Date().toISOString()
                                                });
                                            }}
                                        >
                                            {s.message || `stash@{${i}}`}
                                        </span>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => handleStashPop(i)}>
                                        Pop Stash
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={async () => {
                                        if(!confirm("Drop this stash?")) return;
                                        setActionLoading(true);
                                        try {
                                            await dropStashElectron(repoPath, i);
                                            await loadRepo(historyLimit);
                                        } catch(e: any) { setError(e.message); }
                                        finally { setActionLoading(false); }
                                    }}>
                                        Drop Stash
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </div>
                </div>
            )}
            
            <SidebarPRSection repoPath={repoPath} onCheckout={handleCheckout} />
            <SidebarIssuesSection repoPath={repoPath} />

            <Separator className="my-4" />
            
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
              <Button variant="secondary" onClick={handleBrowse} title="Browse Folder" disabled={loading}>
                  Browse...
              </Button>
              <Button variant="secondary" onClick={() => setIsCloneOpen(true)} title="Clone Repository" disabled={loading}>
                  <DownloadCloud className="h-4 w-4 mr-2" /> Clone
              </Button>
              <Button variant="secondary" onClick={handleInit} title="Initialize Repository" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" /> Init
              </Button>
          </div>
          <Button size="sm" onClick={() => loadRepo(50)} disabled={loading || !repoPath}>
            {loading ? 'Loading...' : 'Open Repo'}
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={() => setIsInsightsOpen(true)} title="Repository Insights" disabled={!repoPath}>
                  <BarChart3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsHelpOpen(true)} title="Help & Documentation">
                  <HelpCircle className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMagicUndo} 
                disabled={actionLoading || history.length === 0} 
                title={history.length === 0 ? "No history to undo" : "Magic Undo (Revert last action)"}
              >
                  <RotateCcw className="h-4 w-4 mr-1" /> Undo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFetch} 
                disabled={actionLoading || !branches.some(b => b.isRemote)} 
                title="Fetch"
              >
                  <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePull} 
                disabled={actionLoading || !branches.some(b => b.isRemote)} 
                title="Pull"
              >
                  <ArrowDown className="h-4 w-4 mr-1" /> Pull
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePush} 
                disabled={actionLoading || !branches.some(b => b.isRemote)} 
                title="Push"
              >
                  <ArrowUp className="h-4 w-4 mr-1" /> Push
              </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm border-b flex justify-between items-center flex-shrink-0">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError('')}>Dismiss</Button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Status Column */}
          <div 
            style={{ width: changesWidth }} 
            className="border-r flex flex-col bg-muted/5 relative h-full overflow-hidden flex-shrink-0"
          >
            <div className="p-3 border-b font-medium bg-muted/50 flex justify-between items-center h-12 flex-shrink-0">
                <span className="text-sm uppercase tracking-wider font-bold">
                    {viewMode === 'workdir' ? 'Changes' : 'Commit Details'}
                </span>
                {viewMode === 'commit' ? (
                    <Button variant="ghost" size="sm" onClick={() => setViewMode('workdir')} className="h-7 text-[10px]">
                        Back to WD
                    </Button>
                ) : (
                    <div className="flex gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => loadRepo(historyLimit)} 
                            title="Refresh Status"
                            disabled={!repoPath || loading}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                        {status?.files?.some((f: any) => !f.status.includes("Index") && f.status !== "Staged") && (
                            <Button variant="ghost" size="sm" onClick={async () => {
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
                        )}
                        {status?.files?.some((f: any) => f.status.includes("Index") || f.status === "Staged") && (
                            <Button variant="ghost" size="sm" onClick={async () => {
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
                        )}
                        {status?.files?.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleRestoreAll} className="h-7 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10">
                                Discard All
                            </Button>
                        )}
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
                         <ContextMenuSub>
                            <ContextMenuSubTrigger>Reset Branch to Here</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem onClick={async () => {
                                    if(!confirm("Soft Reset? Keeps changes staged.")) return;
                                    setActionLoading(true);
                                    try { await reset(repoPath, selectedCommit.id, 'soft'); await loadRepo(historyLimit); }
                                    catch(e: any) { setError(e.message); }
                                    finally { setActionLoading(false); }
                                }}>
                                    Soft (Keep Staged)
                                </ContextMenuItem>
                                <ContextMenuItem onClick={async () => {
                                    if(!confirm("Mixed Reset? Keeps changes unstaged.")) return;
                                    setActionLoading(true);
                                    try { await reset(repoPath, selectedCommit.id, 'mixed'); await loadRepo(historyLimit); }
                                    catch(e: any) { setError(e.message); }
                                    finally { setActionLoading(false); }
                                }}>
                                    Mixed (Keep Unstaged)
                                </ContextMenuItem>
                                <ContextMenuItem onClick={async () => {
                                    if(!confirm("HARD Reset? DISCARDS ALL CHANGES.")) return;
                                    setActionLoading(true);
                                    try { await reset(repoPath, selectedCommit.id, 'hard'); await loadRepo(historyLimit); }
                                    catch(e: any) { setError(e.message); }
                                    finally { setActionLoading(false); }
                                }}>
                                    Hard (Discard Changes)
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleMerge(selectedCommit.id)}>
                            Merge into Current
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleCherryPick(selectedCommit.id)}>
                            Cherry-Pick
                        </ContextMenuItem>
                        <ContextMenuItem onClick={async () => {
                             if(!confirm(`Revert commit ${selectedCommit.id.substring(0,7)}? This will create a new commit that undoes these changes.`)) return;
                             setActionLoading(true);
                             try {
                                 await revertCommit(repoPath, selectedCommit.id);
                                 await loadRepo(historyLimit);
                             } catch(e: any) { setError(e.message); }
                             finally { setActionLoading(false); }
                        }}>
                            Revert Commit
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleCreateTag(selectedCommit.id)}>
                            Create Tag...
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>Bisect...</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem onClick={() => {
                                    setBisectGoodCommit(selectedCommit.id);
                                    if (bisectBadCommit) {
                                        handleBisectStart(bisectBadCommit, selectedCommit.id);
                                    } else {
                                        alert(`Marked ${selectedCommit.id.substring(0,7)} as GOOD. Now mark a BAD commit to start.`);
                                    }
                                }}>
                                    Mark as Good (Known working)
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => {
                                    setBisectBadCommit(selectedCommit.id);
                                    if (bisectGoodCommit) {
                                        handleBisectStart(selectedCommit.id, bisectGoodCommit);
                                    } else {
                                        alert(`Marked ${selectedCommit.id.substring(0,7)} as BAD. Now mark a GOOD commit to start.`);
                                    }
                                }}>
                                    Mark as Bad (Known broken)
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => {
                            navigator.clipboard.writeText(selectedCommit.id);
                        }}>
                            Copy SHA
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => handleArchive(selectedCommit.id)}>
                            Export as Zip...
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            )}

            <ScrollArea className="flex-1">
              <div className="p-2">
                {viewMode === 'workdir' ? (
                    <>
                        {/* Staged Changes */}
                        <div className="mb-4">
                            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Staged Changes ({status?.files?.filter((f: any) => f.status.includes("Staged")).length || 0})</span>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 px-2 text-[10px]"
                                        onClick={async () => {
                                            const staged = status?.files?.filter((f: any) => f.status.includes("Staged")) || [];
                                            if (staged.length === 0) return;
                                            setActionLoading(true);
                                            try {
                                                for (const f of staged) {
                                                    await unstageFile(repoPath, f.path);
                                                }
                                                await loadRepo(historyLimit);
                                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                                        }}
                                    >
                                        Unstage All
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={async () => {
                                            const staged = status?.files?.filter((f: any) => f.status.includes("Staged")) || [];
                                            if (staged.length === 0) return;
                                            if (!confirm("Discard all staged changes? This cannot be undone.")) return;
                                            setActionLoading(true);
                                            try {
                                                for (const f of staged) {
                                                    await discardPath(repoPath, f.path);
                                                }
                                                await loadRepo(historyLimit);
                                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                                        }}
                                    >
                                        Discard All
                                    </Button>
                                </div>
                            </div>
                            <FileTree 
                                files={status?.files?.filter((f: any) => f.status.includes("Staged")) || []}
                                selectedFile={selectedFile}
                                onFileClick={(path) => handleFileClick(path, true)}
                                onToggleStage={async (file) => {
                                    try { await unstageFile(repoPath, file.path); await loadRepo(historyLimit); }
                                    catch(e: any) { setError(e.message); }
                                }}
                                viewMode={viewMode}
                                onResolve={async (file) => {
                                    try { await stageFile(repoPath, file.path); await loadRepo(historyLimit); }
                                    catch (err: any) { setError(err.message); }
                                }}
                                onIgnore={handleIgnoreFile}
                                onHistory={handleFileHistory}
                                onDelete={async (path) => {
                                    if (!confirm(`Are you sure you want to delete ${path}? This uses 'git rm' and stages the deletion.`)) return;
                                    try { await gitRm(repoPath, path); await loadRepo(historyLimit); } catch(e: any) { setError(e.message); }
                                }}
                                onRename={async (oldPath, newPath) => {
                                    try { await gitMv(repoPath, oldPath, newPath); await loadRepo(historyLimit); } catch(e: any) { setError(e.message); }
                                }}
                                onStash={handleStashFile}
                                onDiscard={handleDiscardFile}
                                checked={true}
                            />
                        </div>

                        {/* Unstaged Changes */}
                        <div>
                            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Unstaged Changes ({status?.files?.filter((f: any) => f.status.includes("Unstaged") || f.status.includes("Untracked")).length || 0})</span>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 px-2 text-[10px]"
                                        onClick={async () => {
                                            const unstaged = status?.files?.filter((f: any) => f.status.includes("Unstaged") || f.status.includes("Untracked")) || [];
                                            if (unstaged.length === 0) return;
                                            setActionLoading(true);
                                            try {
                                                for (const f of unstaged) {
                                                    await stageFile(repoPath, f.path);
                                                }
                                                await loadRepo(historyLimit);
                                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                                        }}
                                    >
                                        Stage All
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-5 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={async () => {
                                            const unstaged = status?.files?.filter((f: any) => f.status.includes("Unstaged") || f.status.includes("Untracked")) || [];
                                            if (unstaged.length === 0) return;
                                            if (!confirm("Discard all unstaged changes? This cannot be undone.")) return;
                                            setActionLoading(true);
                                            try {
                                                for (const f of unstaged) {
                                                    await discardUnstaged(repoPath, f.path);
                                                }
                                                await loadRepo(historyLimit);
                                            } catch (e: any) { setError(e.message); } finally { setActionLoading(false); }
                                        }}
                                    >
                                        Discard All
                                    </Button>
                                </div>
                            </div>
                            <FileTree 
                                files={status?.files?.filter((f: any) => f.status.includes("Unstaged") || f.status.includes("Untracked")) || []}
                                selectedFile={selectedFile}
                                onFileClick={(path) => handleFileClick(path, false)}
                                onToggleStage={async (file) => {
                                    try { await stageFile(repoPath, file.path); await loadRepo(historyLimit); }
                                    catch(e: any) { setError(e.message); }
                                }}
                                viewMode={viewMode}
                                onResolve={async (file) => {
                                    try { await stageFile(repoPath, file.path); await loadRepo(historyLimit); }
                                    catch (err: any) { setError(err.message); }
                                }}
                                onIgnore={handleIgnoreFile}
                                onHistory={handleFileHistory}
                                onDelete={async (path) => {
                                    if (!confirm(`Are you sure you want to delete ${path}? This uses 'git rm' and stages the deletion.`)) return;
                                    try { await gitRm(repoPath, path); await loadRepo(historyLimit); } catch(e: any) { setError(e.message); }
                                }}
                                onRename={async (oldPath, newPath) => {
                                    try { await gitMv(repoPath, oldPath, newPath); await loadRepo(historyLimit); } catch(e: any) { setError(e.message); }
                                }}
                                onStash={handleStashFile}
                                onDiscard={handleDiscardFile}
                                checked={false}
                            />
                        </div>
                    </>
                ) : (
                    <FileTree 
                        files={commitFiles}
                        selectedFile={selectedFile}
                        onFileClick={handleFileClick}
                        onToggleStage={undefined}
                        viewMode={viewMode}
                        onResolve={async (file) => {
                            try { await stageFile(repoPath, file.path); await loadRepo(historyLimit); }
                            catch (err: any) { setError(err.message); }
                        }}
                        onIgnore={handleIgnoreFile}
                        onHistory={handleFileHistory}
                        onDelete={async (path) => {
                            if (!confirm(`Are you sure you want to delete ${path}? This uses 'git rm' and stages the deletion.`)) return;
                            try { await gitRm(repoPath, path); await loadRepo(historyLimit); } catch(e: any) { setError(e.message); }
                        }}
                    />
                )}
                
                {((viewMode === 'workdir' ? !status?.files?.length : !commitFiles.length)) && repoPath && !loading && (
                  <div className="text-sm text-muted-foreground p-8 text-center italic">
                      {viewMode === 'workdir' ? 'Clean working directory' : 'No changes in this commit'}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Commit Box (Only in WorkDir) */}
            {viewMode === 'workdir' && (
                <div className="p-3 border-t bg-background space-y-2">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="amend" 
                                checked={amend} 
                                onCheckedChange={(checked) => setAmend(!!checked)} 
                                disabled={history.length === 0}
                            />
                            <label htmlFor="amend" className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Amend
                            </label>
                            <Separator orientation="vertical" className="h-4 mx-1" />
                            <Checkbox 
                                id="pushOnCommit" 
                                checked={pushOnCommit} 
                                onCheckedChange={(checked) => setPushOnCommit(!!checked)} 
                            />
                            <label htmlFor="pushOnCommit" className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Push
                            </label>
                        </div>
                        <div className="flex gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={handleUndoCommit} 
                                title="Undo Last Commit (Soft Reset)"
                                disabled={history.length === 0}
                            >
                                <Undo className="h-3.5 w-3.5" />
                            </Button>
                            {status?.files?.length > 0 && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={handleStashPush} title="Stash Changes">
                                    <Archive className="h-3.5 w-3.5 mr-1" /> Stash
                                </Button>
                            )}
                            {stashes.length > 0 && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleStashPop(0)} title="Pop Latest Stash">
                                    <Archive className="h-3.5 w-3.5 mr-1" /> Pop
                                </Button>
                            )}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-6 w-6 ${isGeneratingAI ? 'animate-pulse text-primary' : ''}`}
                                onClick={handleAICommit}
                                title="Generate Commit Message with AI"
                                disabled={isGeneratingAI}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                            <TemplateSelector onSelect={(txt) => setCommitMessage(txt)} />
                        </div>
                    </div>
                    <Textarea 
                        placeholder="Commit message..." 
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        className="text-xs resize-none h-20 shadow-none border-muted"
                        disabled={!amend && !status?.files?.some((f: any) => f.status.includes("Index") || f.status === "Staged")}
                    />
                    <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={handleCommit} 
                        disabled={isCommitting || !commitMessage || (!amend && !status?.files?.some((f: any) => f.status.includes("Index") || f.status === "Staged"))}
                    >
                        {isCommitting ? 'Committing...' : (amend ? 'Amend Commit' : 'Commit')}
                    </Button>
                </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors flex items-center justify-center -ml-0.5 z-10"
            onMouseDown={() => setIsResizing(true)}
          >
             {/* Invisible wider grab area if needed, or visual indicator */}
          </div>

          {/* Center Area (Diff or Graph) */}
          <div className="flex-1 flex flex-col overflow-hidden h-full">
             {selectedFile && diffData ? (
                 <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
                     <div className="h-12 px-4 border-b text-xs flex justify-between items-center bg-muted/20 flex-shrink-0">
                         <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono font-bold truncate">{selectedFile}</span>
                            <div className="flex items-center bg-muted/50 rounded p-0.5">
                                {viewMode === 'workdir' && (
                                    <Button 
                                        variant={isPatchMode ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="h-6 px-2 text-[10px]"
                                        onClick={() => setIsPatchMode(!isPatchMode)}
                                    >
                                        <Layers className="h-3 w-3 mr-1" /> Patch
                                    </Button>
                                )}
                                <Button 
                                    variant={diffMode === 'side-by-side' ? 'secondary' : 'ghost'}
                                    size="sm" 
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setDiffMode('side-by-side')}
                                >
                                    Side-by-Side
                                </Button>
                                <Button 
                                    variant={diffMode === 'inline' ? 'secondary' : 'ghost'}
                                    size="sm" 
                                    className="h-6 px-2 text-[10px]"
                                    onClick={() => setDiffMode('inline')}
                                >
                                    Inline
                                </Button>
                                <Button 
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-muted-foreground"
                                    onClick={() => setUseInternalDiff(!useInternalDiff)}
                                    title={useInternalDiff ? "Switch to Monaco Editor" : "Switch to Internal Diff"}
                                >
                                    {useInternalDiff ? "Internal" : "Monaco"}
                                </Button>
                            </div>
                         </div>
                         <div className="flex items-center gap-1">
                             <Button variant="ghost" size="sm" className="h-8" onClick={handleOpenExternalDiff} title="Open in External Diff Tool" disabled={actionLoading}>
                                 <ExternalLink className="h-4 w-4 mr-1" /> Open
                             </Button>
                             <Button variant="ghost" size="sm" className="h-8" onClick={handleBlame} title="View Blame">
                                 <FileCode className="h-4 w-4 mr-1" /> Blame
                             </Button>
                             <Button variant="ghost" size="sm" className="h-8" onClick={() => { setSelectedFile(null); setDiffData(null); }}>
                                 Close Diff
                             </Button>
                         </div>
                     </div>
                     <div className="flex-1 p-2 overflow-hidden">
                        {diffData.isImage ? (
                            <ImageDiffView 
                                originalUrl={diffData.originalUrl} 
                                modifiedUrl={diffData.modifiedUrl} 
                                fileName={selectedFile} 
                            />
                        ) : isPatchMode && diffData.patch ? (
                            <PatchView 
                                diff={diffData.patch} 
                                repoPath={repoPath} 
                                onStage={() => {
                                    handleFileClick(selectedFile); // Reload
                                    loadRepo(historyLimit); // Refresh status
                                }}
                                isStaged={diffData.isStaged}
                            />
                        ) : (
                            diffData.modifiedContent?.includes('<<<<<<<') && diffData.modifiedContent?.includes('=======') && diffData.modifiedContent?.includes('>>>>>>>') ? (
                                <MergeConflictView 
                                    filePath={selectedFile} 
                                    content={diffData.modifiedContent} 
                                    repoPath={repoPath}
                                    onResolve={() => {
                                        loadRepo(historyLimit);
                                        handleFileClick(selectedFile);
                                    }}
                                />
                            ) : (
                                useInternalDiff ? (
                                    <InternalDiffView 
                                        original={diffData.originalContent} 
                                        modified={diffData.modifiedContent} 
                                        language={getLanguageFromPath(selectedFile)}
                                        renderSideBySide={diffMode === 'side-by-side'}
                                    />
                                ) : (
                                    <DiffView 
                                        original={diffData.originalContent} 
                                        modified={diffData.modifiedContent} 
                                        language={getLanguageFromPath(selectedFile)}
                                        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                                        renderSideBySide={diffMode === 'side-by-side'}
                                    />
                                )
                            )
                        )}
                     </div>
                 </div>
             ) : (
                <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                    <div className="p-3 border-b font-medium bg-muted/50 flex justify-between items-center h-12 flex-shrink-0">
                        <span className="text-sm uppercase tracking-wider font-bold">History Graph</span>
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            className="bg-background border rounded px-2 h-7 text-[10px] outline-none"
                                                            value={activeGraphView}
                                                            onChange={(e) => handleGraphViewChange(e.target.value)}
                                                        >
                                                            {Object.entries(graphViews).map(([key, v]: [string, any]) => (
                                                                <option key={key} value={key}>{v.label}</option>
                                                            ))}
                                                        </select>
                                                        <Separator orientation="vertical" className="h-4" />
                                                        <div className="relative w-48 mr-2">                                                            <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                                            <Input 
                                                                placeholder="Search history..." 
                                                                className="pl-7 h-7 text-[10px] bg-background/50" 
                                                                value={historySearch}
                                                                onChange={(e) => setHistorySearch(e.target.value)}
                                                            />
                                                        </div>
                                                                                    <div className="flex gap-1">
                                                                                        <Input 
                                                                                            placeholder="Author" 
                                                                                            className="w-24 h-7 text-[10px] bg-background/50"
                                                                                            value={searchAuthor}
                                                                                            onChange={(e) => setSearchAuthor(e.target.value)}
                                                                                        />
                                                                                        <Input 
                                                                                            placeholder="Date (YYYY-MM-DD)" 
                                                                                            className="w-28 h-7 text-[10px] bg-background/50"
                                                                                            value={searchDate}
                                                                                            onChange={(e) => setSearchDate(e.target.value)}
                                                                                        />
                                                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsGrepSearchOpen(true)} title="Deep History Search (Grep)">
                                                                                            <Search className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </div>                            <Separator orientation="vertical" className="h-4" />
                            {history.length > 0 && (
                                <Button variant="outline" size="sm" onClick={loadMore} disabled={loading} className="h-7 text-[10px]">
                                    {loading ? 'Loading...' : 'Load 50 More'}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden h-full bg-slate-950 relative">
                        {graphLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 z-50">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <ScrollArea className="h-full w-full bg-slate-950 text-slate-100">
                            <div className="p-6">
                                <InteractiveTerminalGraph 
                                    content={textGraph} 
                                    onCommitSelect={handleTerminalCommitClick} 
                                    onAction={handleGraphAction}
                                />
                            </div>
                        </ScrollArea>
                    </div>
                </div>
             )}
             
             {isTerminalOpen && (
                 <TerminalPanel repoPath={repoPath} onClose={() => setIsTerminalOpen(false)} />
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

      <FileHistoryDialog 
        open={isFileHistoryOpen} 
        onOpenChange={setIsFileHistoryOpen} 
        repoPath={repoPath} 
        filePath={historyFilePath} 
      />

      <GitFlowDialog 
        open={isGitFlowOpen} 
        onOpenChange={setIsGitFlowOpen} 
        repoPath={repoPath} 
        onRefresh={() => loadRepo(historyLimit)}
      />
      
      <WorkspaceDialog 
        open={isWorkspaceOpen} 
        onOpenChange={setIsWorkspaceOpen} 
        workspaces={workspaces} 
        onSave={saveWorkspaces} 
      />

      <GrepSearchDialog 
        open={isGrepSearchOpen} 
        onOpenChange={setIsGrepSearchOpen} 
        repoPath={repoPath} 
        onCommitSelect={(c) => handleCommitClick(c)}
      />

      <GlobalGrepDialog 
        open={isGlobalSearchOpen} 
        onOpenChange={setIsGlobalSearchOpen} 
        repoPaths={workspaces.flatMap(ws => ws.repos)} 
        onCommitSelect={(path, commit) => {
            setRepoPath(path);
            handleCommitClick(commit);
        }}
      />

      <RepoInsightsDialog 
        open={isInsightsOpen} 
        onOpenChange={setIsInsightsOpen} 
        repoPath={repoPath} 
      />

      <CloneDialog 
        open={isCloneOpen} 
        onOpenChange={setIsCloneOpen} 
        onCloneComplete={(path) => {
            setRepoPath(path);
            loadRepo(50, path);
        }}
      />
      
      <ReflogDialog 
        open={isReflogOpen} 
        onOpenChange={setIsReflogOpen} 
        repoPath={repoPath}
        onActionComplete={() => loadRepo(historyLimit)}
      />

      <WorktreeDialog 
        open={isWorktreeOpen} 
        onOpenChange={setIsWorktreeOpen} 
        repoPath={repoPath}
      />

      <HelpDialog  
        open={isHelpOpen} 
        onOpenChange={setIsHelpOpen} 
      />

      <StashDialog 
        open={isStashDialogOpen} 
        onOpenChange={setIsStashDialogOpen} 
        stashes={stashes} 
        onPop={handleStashPop} 
        onDrop={handleStashDrop}
      />

      <Dialog open={isBlameOpen} onOpenChange={setIsBlameOpen}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Blame: {selectedFile}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 border rounded bg-background font-mono text-xs overflow-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                            <th className="p-2 text-left w-20">SHA</th>
                            <th className="p-2 text-left w-32">Author</th>
                            <th className="p-2 text-left w-24">Date</th>
                            <th className="p-2 text-left">Message</th>
                            <th className="p-2 text-left border-l">Content</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blameData.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/50 border-b border-muted/20">
                                <td className="p-1 pl-2 text-muted-foreground select-all">{row.sha ? row.sha.substring(0,7) : ''}</td>
                                <td className="p-1">{row.author}</td>
                                <td className="p-1 text-muted-foreground">{row.time ? new Date(row.time * 1000).toLocaleDateString() : ''}</td>
                                <td className="p-1 truncate max-w-xs text-muted-foreground" title={row.summary}>{row.summary}</td>
                                <td className="p-1 border-l pl-2 whitespace-pre text-foreground">{row.content}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <FileSearchDialog 
        open={isFileSearchOpen} 
        onOpenChange={setIsFileSearchOpen} 
        repoPath={repoPath} 
        onSelect={(path) => {
            handleFileHistory(path);
        }} 
      />

      <CommandPalette  
        open={isCommandOpen} 
        onOpenChange={setIsCommandOpen}
        repoPath={repoPath}
        hasHistory={history.length > 0}
        hasRemotes={branches.some(b => b.isRemote)}
        hasStagedChanges={!!status?.files?.some((f: any) => f.status.includes("Index") || f.status === "Staged")}
        actions={{
            fetch: handleFetch,
            pull: handlePull,
            push: handlePush,
            commit: handleCommit,
            createBranch: () => setIsCreateBranchOpen(true),
            openSettings: () => setIsSettingsOpen(true),
            openReflog: () => setIsReflogOpen(true),
            openWorktrees: () => setIsWorktreeOpen(true),
            openStashes: () => setIsStashDialogOpen(true),
            runGc: handleGc,
            openFileSearch: () => setIsFileSearchOpen(true),
            toggleTerminal: () => setIsTerminalOpen(!isTerminalOpen),
        }}
      />
      <SettingsDialog 
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        repoPath={repoPath}
      />
      
      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-primary text-primary-foreground text-[10px] flex items-center px-3 justify-between z-50">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 font-medium">
                  <Terminal className="h-3 w-3" />
                  <span>{repoPath || 'No repository open'}</span>
              </div>
              <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-[10px] hover:bg-primary-foreground/10 text-primary-foreground" 
                  onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              >
                  <Terminal className="h-3 w-3 mr-1" /> Terminal
              </Button>
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
      <GlobalLoader 
        isVisible={loading || actionLoading} 
        message={loading ? "Loading repository..." : "Processing..."} 
      />
    </main>
  );
}
