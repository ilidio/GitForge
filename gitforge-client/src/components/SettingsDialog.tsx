import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getConfig, setConfig, getRemotes, addRemote, removeRemote } from '@/lib/electron';
import { Trash, Plus, Save, Loader2, User, GitFork, Wrench, Settings as SettingsIcon, Sparkles } from 'lucide-react';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
}

export default function SettingsDialog({ open, onOpenChange, repoPath }: SettingsDialogProps) {
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [remotes, setRemotes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [newRemoteName, setNewRemoteName] = useState('');
    const [newRemoteUrl, setNewRemoteUrl] = useState('');
    
    // Tools
    const [diffTool, setDiffTool] = useState('');

    // Global
    const [colorUi, setColorUi] = useState('auto');
    const [excludesFile, setExcludesFile] = useState('');

    // AI
    const [aiProvider, setAiProvider] = useState('openai');
    const [aiApiKey, setAiApiKey] = useState('');
    const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
    const [aiContext, setAiContext] = useState('');

    const loadSettings = async () => {
        if (!repoPath || !open) return;
        setLoading(true);
        try {
            const config = await getConfig(repoPath);
            const lines = config.split('\n');
            let name = '';
            let email = '';
            let token = '';
            let tool = '';
            let color = 'auto';
            let excludes = '';

            for (const line of lines) {
                if (line.startsWith('user.name=')) name = line.substring(10);
                if (line.startsWith('user.email=')) email = line.substring(11);
                if (line.startsWith('github.token=')) token = line.substring(13);
                if (line.startsWith('diff.tool=')) tool = line.substring(10);
                if (line.startsWith('color.ui=')) color = line.substring(9);
                if (line.startsWith('core.excludesfile=')) excludes = line.substring(18);
            }
            setUserName(name);
            setUserEmail(email);
            setGithubToken(token);
            setDiffTool(tool);
            setColorUi(color);
            setExcludesFile(excludes);

            const remotesData = await getRemotes(repoPath);
            setRemotes(remotesData.split('\n').filter((r: string) => r.trim() !== ''));

            // Load AI settings from localStorage
            setAiProvider(localStorage.getItem('ai_provider') || 'openai');
            setAiApiKey(localStorage.getItem('ai_api_key') || '');
            setAiModel(localStorage.getItem('ai_model') || 'gpt-3.5-turbo');
            setAiContext(localStorage.getItem('ai_context') || '');

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [open, repoPath]);

    const handleSaveUser = async () => {
        try {
            await setConfig(repoPath, 'user.name', userName);
            await setConfig(repoPath, 'user.email', userEmail);
            await setConfig(repoPath, 'github.token', githubToken);
            alert('User config saved!');
        } catch (e) {
            alert('Failed to save config');
        }
    };

    const handleSaveGlobal = async () => {
        try {
           await setConfig(repoPath, 'color.ui', colorUi);
           if (excludesFile) await setConfig(repoPath, 'core.excludesfile', excludesFile);
           alert('Core config saved!');
        } catch(e) {
            alert('Failed to save core config');
        }
    };

    const handleSaveAI = () => {
        localStorage.setItem('ai_provider', aiProvider);
        localStorage.setItem('ai_api_key', aiApiKey);
        localStorage.setItem('ai_model', aiModel);
        localStorage.setItem('ai_context', aiContext);
        alert('AI settings saved!');
    };

    const handleSaveTool = async (tool: string) => {
        setDiffTool(tool);
        try {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if (tool === 'vscode') {
                await setConfig(repoPath, 'diff.tool', 'vscode');
                await setConfig(repoPath, 'difftool.vscode.cmd', 'code --wait --diff "$LOCAL" "$REMOTE"');
            } else if (tool === 'kdiff3') {
                await setConfig(repoPath, 'diff.tool', 'kdiff3');
                if (isMac) {
                    await setConfig(repoPath, 'difftool.kdiff3.path', '/Applications/kdiff3.app/Contents/MacOS/kdiff3');
                }
            } else {
                await setConfig(repoPath, 'diff.tool', tool);
            }
            alert(`Diff tool set to ${tool}`);
        } catch (e) {
            alert('Failed to save tool config');
        }
    };

    const handleAddRemote = async () => {
        if (!newRemoteName || !newRemoteUrl) return;
        try {
            await addRemote(repoPath, newRemoteName, newRemoteUrl);
            setNewRemoteName('');
            setNewRemoteUrl('');
            loadSettings();
        } catch (e) {
            alert('Failed to add remote');
        }
    };

    const handleRemoveRemote = async (remoteLine: string) => {
        const name = remoteLine.split('\t')[0];
        if (!confirm(`Remove remote ${name}?`)) return;
        try {
            await removeRemote(repoPath, name);
            loadSettings();
        } catch (e) {
            alert('Failed to remove remote');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Repository Settings</DialogTitle>
                    <DialogDescription>Configure user identity, remotes, and AI assistant.</DialogDescription>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <Tabs defaultValue="user" className="w-full h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                            <TabsTrigger value="user"><User className="w-4 h-4 mr-2" /> Identity</TabsTrigger>
                            <TabsTrigger value="remotes"><GitFork className="w-4 h-4 mr-2" /> Remotes</TabsTrigger>
                            <TabsTrigger value="core"><SettingsIcon className="w-4 h-4 mr-2" /> Core</TabsTrigger>
                            <TabsTrigger value="tools"><Wrench className="w-4 h-4 mr-2" /> Tools</TabsTrigger>
                            <TabsTrigger value="ai"><Sparkles className="w-4 h-4 mr-2" /> AI</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-auto">
                            <TabsContent value="user" className="space-y-4 border p-4 rounded-md mt-0">
                                <h3 className="font-medium text-sm">User Identity</h3>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Name</Label>
                                    <Input value={userName} onChange={e => setUserName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input value={userEmail} onChange={e => setUserEmail(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">GitHub Token</Label>
                                    <Input 
                                        type="password" 
                                        value={githubToken} 
                                        onChange={e => setGithubToken(e.target.value)} 
                                        className="col-span-3" 
                                        placeholder="ghp_..." 
                                    />
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button size="sm" onClick={handleSaveUser}><Save className="w-4 h-4 mr-2" /> Save Identity</Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="core" className="space-y-4 border p-4 rounded-md mt-0">
                                <h3 className="font-medium text-sm">Core Configuration</h3>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Color UI</Label>
                                    <select 
                                        className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={colorUi}
                                        onChange={(e) => setColorUi(e.target.value)}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="always">Always</option>
                                        <option value="false">False</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Excludes File</Label>
                                    <Input value={excludesFile} onChange={e => setExcludesFile(e.target.value)} className="col-span-3" placeholder="~/.gitignore_global" />
                                </div>
                                 <div className="flex justify-end">
                                    <Button size="sm" onClick={handleSaveGlobal}><Save className="w-4 h-4 mr-2" /> Save Core</Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="tools" className="space-y-4 border p-4 rounded-md mt-0">
                                <h3 className="font-medium text-sm">External Tools</h3>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Diff Tool</Label>
                                    <div className="col-span-3 flex gap-2">
                                        <select 
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={diffTool}
                                            onChange={(e) => handleSaveTool(e.target.value)}
                                        >
                                            <option value="">System Default</option>
                                            <option value="kdiff3">KDiff3</option>
                                            <option value="vscode">VS Code</option>
                                            <option value="meld">Meld</option>
                                            <option value="bc3">Beyond Compare 3</option>
                                        </select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="ai" className="space-y-4 border p-4 rounded-md mt-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium text-sm">AI Assistant</h3>
                                    {process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                                        <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> Gemini Configured via Env
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Provider</Label>
                                    <select 
                                        className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={aiProvider}
                                        onChange={(e) => setAiProvider(e.target.value)}
                                    >
                                        <option value="openai">OpenAI (GPT)</option>
                                        <option value="gemini">Google (Gemini)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">API Key</Label>
                                    <Input 
                                        type="password"
                                        value={aiApiKey} 
                                        onChange={e => setAiApiKey(e.target.value)} 
                                        className="col-span-3" 
                                        placeholder="sk-..." 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Model</Label>
                                    <Input 
                                        value={aiModel} 
                                        onChange={e => setAiModel(e.target.value)} 
                                        className="col-span-3" 
                                        placeholder="gpt-3.5-turbo" 
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <Label className="text-right pt-2">Requirements</Label>
                                    <Textarea 
                                        value={aiContext} 
                                        onChange={e => setAiContext(e.target.value)} 
                                        className="col-span-3 h-24" 
                                        placeholder="E.g., Always start with a Jira ID. Use present tense." 
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={handleSaveAI}><Save className="w-4 h-4 mr-2" /> Save AI Settings</Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="remotes" className="space-y-4 border p-4 rounded-md mt-0">
                                <h3 className="font-medium text-sm">Remotes</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto bg-muted p-2 rounded text-xs font-mono">
                                    {remotes.map((r, i) => (
                                        <div key={i} className="flex justify-between items-center group">
                                            <span>{r}</span>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveRemote(r)}>
                                                <Trash className="w-3 h-3 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    {remotes.length === 0 && <div className="text-muted-foreground italic">No remotes configured</div>}
                                </div>
                                <div className="flex gap-2">
                                    <Input placeholder="Remote Name (e.g. origin)" value={newRemoteName} onChange={e => setNewRemoteName(e.target.value)} className="w-1/3" />
                                    <Input placeholder="URL" value={newRemoteUrl} onChange={e => setNewRemoteUrl(e.target.value)} className="flex-1" />
                                    <Button size="icon" onClick={handleAddRemote} disabled={!newRemoteName || !newRemoteUrl}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
