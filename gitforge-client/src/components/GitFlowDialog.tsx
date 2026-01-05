'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getConfig, setConfig } from '@/lib/electron';
import { createBranch, checkout, merge, deleteBranch } from '@/lib/api'; // Standard git ops
import { Loader2, GitBranch, Play, CheckCircle } from 'lucide-react';

interface GitFlowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoPath: string;
    onRefresh: () => void;
}

export default function GitFlowDialog({ open, onOpenChange, repoPath, onRefresh }: GitFlowDialogProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Config
    const [masterBranch, setMasterBranch] = useState('master');
    const [developBranch, setDevelopBranch] = useState('develop');
    const [featurePrefix, setFeaturePrefix] = useState('feature/');
    const [releasePrefix, setReleasePrefix] = useState('release/');
    const [hotfixPrefix, setHotfixPrefix] = useState('hotfix/');

    // Actions
    const [featureName, setFeatureName] = useState('');
    const [releaseName, setReleaseName] = useState('');
    const [hotfixName, setHotfixName] = useState('');

    useEffect(() => {
        if (open && repoPath) {
            checkInit();
        }
    }, [open, repoPath]);

    const checkInit = async () => {
        setLoading(true);
        try {
            const config = await getConfig(repoPath);
            const lines = config.split('\n');
            const hasMaster = lines.some((l: string) => l.startsWith('gitflow.branch.master='));
            const hasDevelop = lines.some((l: string) => l.startsWith('gitflow.branch.develop='));
            
            if (hasMaster && hasDevelop) {
                setIsInitialized(true);
                // Load prefixes if available
                const f = lines.find((l: string) => l.startsWith('gitflow.prefix.feature='));
                if (f) setFeaturePrefix(f.split('=')[1]);
                // ... others
            } else {
                setIsInitialized(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInit = async () => {
        setLoading(true);
        try {
            await setConfig(repoPath, 'gitflow.branch.master', masterBranch);
            await setConfig(repoPath, 'gitflow.branch.develop', developBranch);
            await setConfig(repoPath, 'gitflow.prefix.feature', featurePrefix);
            await setConfig(repoPath, 'gitflow.prefix.release', releasePrefix);
            await setConfig(repoPath, 'gitflow.prefix.hotfix', hotfixPrefix);
            
            // Ensure branches exist
            try { await createBranch(repoPath, masterBranch); } catch {}
            try { await createBranch(repoPath, developBranch); } catch {}
            
            setIsInitialized(true);
            onRefresh();
        } catch (e) {
            alert('Failed to initialize Git Flow');
        } finally {
            setLoading(false);
        }
    };

    const startFeature = async () => {
        if (!featureName) return;
        setLoading(true);
        try {
            // Checkout develop
            await checkout(repoPath, developBranch);
            // Create feature branch
            await createBranch(repoPath, `${featurePrefix}${featureName}`);
            setFeatureName('');
            onOpenChange(false);
            onRefresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const finishFeature = async () => {
        // Assume we are on the feature branch or ask user?
        // For simplicity, ask user for name or assume current branch if it matches prefix
        // Let's just implement "Start" for now, standard git flow finish is complex (merge --no-ff, delete)
        alert("Finish Feature: Please manually merge into develop and delete the branch.");
    };
    
    // ... Implement startRelease, startHotfix similarly

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-primary" />
                        Git Flow
                    </DialogTitle>
                    <DialogDescription>
                        Standardize your branching workflow.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : !isInitialized ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Master Branch</Label>
                            <Input value={masterBranch} onChange={e => setMasterBranch(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Develop Branch</Label>
                            <Input value={developBranch} onChange={e => setDevelopBranch(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Feature Prefix</Label>
                                <Input value={featurePrefix} onChange={e => setFeaturePrefix(e.target.value)} className="text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Release Prefix</Label>
                                <Input value={releasePrefix} onChange={e => setReleasePrefix(e.target.value)} className="text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Hotfix Prefix</Label>
                                <Input value={hotfixPrefix} onChange={e => setHotfixPrefix(e.target.value)} className="text-xs" />
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleInit}>Initialize Git Flow</Button>
                    </div>
                ) : (
                    <Tabs defaultValue="feature">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="feature">Feature</TabsTrigger>
                            <TabsTrigger value="release">Release</TabsTrigger>
                            <TabsTrigger value="hotfix">Hotfix</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="feature" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Feature Name</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-muted-foreground">{featurePrefix}</span>
                                    <Input value={featureName} onChange={e => setFeatureName(e.target.value)} placeholder="login-page" />
                                </div>
                            </div>
                            <Button className="w-full" onClick={startFeature} disabled={!featureName}>
                                <Play className="w-4 h-4 mr-2" /> Start Feature
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Creates a new branch from <strong>{developBranch}</strong>.
                            </p>
                        </TabsContent>
                        
                        {/* Similar tabs for Release (from develop) and Hotfix (from master) */}
                         <TabsContent value="release" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Release Version</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-muted-foreground">{releasePrefix}</span>
                                    <Input value={releaseName} onChange={e => setReleaseName(e.target.value)} placeholder="1.0.0" />
                                </div>
                            </div>
                            <Button className="w-full" onClick={async () => {
                                 if (!releaseName) return;
                                 setLoading(true);
                                 try {
                                     await checkout(repoPath, developBranch);
                                     await createBranch(repoPath, `${releasePrefix}${releaseName}`);
                                     onOpenChange(false);
                                     onRefresh();
                                 } catch(e:any) { alert(e.message); } finally { setLoading(false); }
                            }} disabled={!releaseName}>
                                <Play className="w-4 h-4 mr-2" /> Start Release
                            </Button>
                             <p className="text-xs text-muted-foreground text-center">
                                Creates a new branch from <strong>{developBranch}</strong>.
                            </p>
                        </TabsContent>

                        <TabsContent value="hotfix" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Hotfix Version</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-muted-foreground">{hotfixPrefix}</span>
                                    <Input value={hotfixName} onChange={e => setHotfixName(e.target.value)} placeholder="1.0.1" />
                                </div>
                            </div>
                            <Button className="w-full" onClick={async () => {
                                 if (!hotfixName) return;
                                 setLoading(true);
                                 try {
                                     await checkout(repoPath, masterBranch);
                                     await createBranch(repoPath, `${hotfixPrefix}${hotfixName}`);
                                     onOpenChange(false);
                                     onRefresh();
                                 } catch(e:any) { alert(e.message); } finally { setLoading(false); }
                            }} disabled={!hotfixName}>
                                <Play className="w-4 h-4 mr-2" /> Start Hotfix
                            </Button>
                             <p className="text-xs text-muted-foreground text-center">
                                Creates a new branch from <strong>{masterBranch}</strong>.
                            </p>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
