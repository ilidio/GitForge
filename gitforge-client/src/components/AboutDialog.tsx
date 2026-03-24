'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Github, Globe, Heart, Shield } from 'lucide-react';

interface AboutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
    const version = "0.1.0"; // Could be dynamically loaded
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 border-none shadow-2xl bg-gradient-to-br from-background to-muted/30">
                <div className="sr-only">
                    <DialogHeader>
                        <DialogTitle>About GitForge</DialogTitle>
                    </DialogHeader>
                </div>
                <div className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-background rounded-2xl p-4 shadow-xl">
                            <img 
                                src="/m0k4_tools.png" 
                                alt="m0k4 tools logo" 
                                className="h-24 w-auto object-contain"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tighter text-foreground">GitForge</h2>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Version {version}</p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
                        The high-performance Git client for modern developers. 
                        Built for speed, efficiency, and clarity.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2 rounded-xl h-10"
                            onClick={() => window.open('https://github.com/ilidiomartins/gitforge', '_blank')}
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2 rounded-xl h-10"
                            onClick={() => window.open('https://m0k4.tools', '_blank')}
                        >
                            <Globe className="h-4 w-4" /> Website
                        </Button>
                    </div>

                    <div className="pt-4 border-t w-full flex flex-col items-center gap-4">
                        <div className="flex items-center gap-6 text-muted-foreground">
                             <div className="flex flex-col items-center gap-1">
                                <Shield className="h-5 w-5 text-primary/60" />
                                <span className="text-[10px] uppercase font-bold tracking-tighter">Secure</span>
                             </div>
                             <div className="flex flex-col items-center gap-1">
                                <Heart className="h-5 w-5 text-red-500/60" />
                                <span className="text-[10px] uppercase font-bold tracking-tighter">Open Source</span>
                             </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-medium">
                            © {new Date().getFullYear()} m0k4 tools. All rights reserved.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
