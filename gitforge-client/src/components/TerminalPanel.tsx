'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { spawnTerminal } from '@/lib/electron';
import 'xterm/css/xterm.css';

interface TerminalPanelProps {
    repoPath: string;
    onClose: () => void;
}

export default function TerminalPanel({ repoPath, onClose }: TerminalPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!containerRef.current || !repoPath) return;

        const term = new Terminal({
            theme: {
                background: '#020617', // slate-950
                foreground: '#f8fafc',
                cursor: '#ffffff'
            },
            fontFamily: 'monospace',
            fontSize: 12,
            cursorBlink: true,
            cols: 80,
            rows: 24
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(containerRef.current);
        fitAddon.fit();

        const pty = spawnTerminal(repoPath, term.cols, term.rows, (data) => {
            term.write(data);
        });

        term.onData((data) => {
            pty?.write(data);
        });

        const handleResize = () => {
            fitAddon.fit();
            pty?.resize(term.cols, term.rows);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            pty?.dispose();
        };
    }, [repoPath]);

    return (
        <div className="h-64 border-t bg-slate-950 p-2 flex flex-col">
            <div className="flex justify-between items-center mb-1 px-2">
                <span className="text-xs font-bold text-slate-400">Terminal</span>
                <button onClick={onClose} className="text-xs text-slate-500 hover:text-white">Close</button>
            </div>
            <div ref={containerRef} className="flex-1 overflow-hidden rounded" />
        </div>
    );
}
