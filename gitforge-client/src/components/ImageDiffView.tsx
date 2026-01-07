'use client';

import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Eye, Columns, Layers } from 'lucide-react';

interface ImageDiffViewProps {
    originalUrl: string;
    modifiedUrl: string;
    fileName: string;
}

export default function ImageDiffView({ originalUrl, modifiedUrl, fileName }: ImageDiffViewProps) {
    const [mode, setMode] = useState<'side-by-side' | 'swipe' | 'onion'>('side-by-side');
    const [swipePos, setSwipePos] = useState(50);
    const [onionOpacity, setOnionOpacity] = useState(50);

    return (
        <div className="h-full flex flex-col bg-slate-950 p-4 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">{fileName}</h3>
                <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                    <Button 
                        variant={mode === 'side-by-side' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMode('side-by-side')}
                        title="Side by Side"
                    >
                        <Columns className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant={mode === 'swipe' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMode('swipe')}
                        title="Swipe (Slider)"
                    >
                        <Columns className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button 
                        variant={mode === 'onion' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMode('onion')}
                        title="Onion Skin (Overlay)"
                    >
                        <Layers className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-[url('https://repo-editor.github.io/images/transparent-bg.png')] bg-repeat rounded-lg border border-slate-800 relative overflow-hidden">
                {mode === 'side-by-side' && (
                    <div className="flex w-full h-full gap-4 p-4">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain shadow-lg" />
                            <span className="text-xs text-slate-400 mt-2">Original</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <img src={modifiedUrl} alt="Modified" className="max-w-full max-h-full object-contain shadow-lg" />
                            <span className="text-xs text-slate-400 mt-2">Modified</span>
                        </div>
                    </div>
                )}

                {mode === 'swipe' && (
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <div className="relative w-full h-full max-w-[800px] max-h-[600px]">
                            {/* Modified Image (Background) */}
                            <img 
                                src={modifiedUrl} 
                                alt="Modified" 
                                className="absolute top-0 left-0 w-full h-full object-contain select-none pointer-events-none" 
                            />
                            {/* Original Image (Clipped) */}
                            <div 
                                className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-primary bg-background/5"
                                style={{ width: `${swipePos}%` }}
                            >
                                <img 
                                    src={originalUrl} 
                                    alt="Original" 
                                    className="absolute top-0 left-0 w-[100vw] max-w-none h-full object-contain"
                                    style={{ width: '100%', maxWidth: '100%' }} // This needs to match parent width to align
                                />
                            </div>
                            {/* Control */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 bg-slate-900/80 p-2 rounded-full">
                                <Slider 
                                    value={[swipePos]} 
                                    onValueChange={([v]) => setSwipePos(v)} 
                                    min={0} max={100} step={1} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'onion' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative">
                            <img src={originalUrl} alt="Original" className="max-w-full max-h-[80vh] object-contain" />
                            <img 
                                src={modifiedUrl} 
                                alt="Modified" 
                                className="absolute top-0 left-0 w-full h-full object-contain" 
                                style={{ opacity: onionOpacity / 100 }}
                            />
                        </div>
                        <div className="absolute bottom-4 w-64 bg-slate-900/80 p-2 rounded-full">
                            <Slider 
                                value={[onionOpacity]} 
                                onValueChange={([v]) => setOnionOpacity(v)} 
                                min={0} max={100} step={1} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
