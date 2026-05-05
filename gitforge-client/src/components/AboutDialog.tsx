'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, Globe, Heart, Shield, Sparkles, Code2 } from 'lucide-react';
import packageJson from '../../package.json';

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    theme?: 'light' | 'dark';
}

export default function AboutDialog({ open, onOpenChange, theme = 'light' }: AboutDialogProps) {
    const version = packageJson.version;
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[420px] overflow-hidden p-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl ${theme === 'dark' ? 'dark' : ''}`}>
                <div className={`w-full h-full text-foreground ${theme === 'dark' ? 'dark' : ''}`}>
                <div className="sr-only">
                    <DialogHeader>
                        <DialogTitle>About GitForge</DialogTitle>
                    </DialogHeader>
                </div>
                
                {/* Hero Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent -z-10" />
                
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
                        <div className="relative bg-background/50 backdrop-blur-sm rounded-3xl p-5 shadow-2xl border border-primary/10 ring-1 ring-white/10">
                            <img 
                                src="/logo.svg" 
                                alt="GitForge logo" 
                                className="h-16 w-16 object-contain"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 mb-6">
                        <div className="flex items-center justify-center gap-2">
                            <h2 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                                GitForge
                            </h2>
                            <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider h-fit">
                                Beta
                            </div>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                            Version {version}
                        </p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[320px] mb-8 font-medium">
                        The ultimate AI-powered Git experience. <br/>
                        Built for speed, clarity, and modern engineering workflows.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full mb-8">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full gap-2 rounded-xl h-11 font-bold bg-secondary/50 hover:bg-secondary border border-border/50"
                            onClick={() => window.open('https://github.com/ilidio/GitForge', '_blank')}
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full gap-2 rounded-xl h-11 font-bold bg-secondary/50 hover:bg-secondary border border-border/50"
                            onClick={() => window.open('https://m0k4.tools', '_blank')}
                        >
                            <Globe className="h-4 w-4" /> Website
                        </Button>
                    </div>

                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-around py-4 border-y border-border/50">
                             <div className="flex flex-col items-center gap-1.5">
                                <div className="p-2 rounded-full bg-primary/5 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/80">AI Native</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5">
                                <div className="p-2 rounded-full bg-blue-500/5 text-blue-500">
                                    <Code2 className="h-4 w-4" />
                                </div>
                                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/80">Efficient</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5">
                                <div className="p-2 rounded-full bg-red-500/5 text-red-500">
                                    <Heart className="h-4 w-4" />
                                </div>
                                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground/80">OSS</span>
                             </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-default">
                                <img src="/m0k4_tools.png" alt="m0k4 tools" className="h-4 grayscale invert brightness-0 dark:invert-0 dark:brightness-100" />
                                <span className="text-[10px] font-bold tracking-tight text-muted-foreground">m0k4 tools project</span>
                            </div>
                            <div className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                                © {new Date().getFullYear()} All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </DialogContent>
        </Dialog>
    );
}
