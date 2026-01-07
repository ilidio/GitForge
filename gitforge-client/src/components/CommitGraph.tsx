'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo, useState } from 'react';
import { Lock, ShieldAlert, ShieldQuestion } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"

interface CommitGraphProps {
  commits: any[];
  branches?: any[];
  onCommitClick?: (commit: any) => void;
  onAction?: (action: 'checkout' | 'merge' | 'cherrypick' | 'copy' | 'rebase' | 'drop-branch', commit: any, extra?: any) => void;
  theme?: 'light' | 'dark';
}

const COMMIT_HEIGHT = 50;
const LANE_WIDTH = 24;
const CIRCLE_RADIUS = 6;

const DARK_COLORS = ['#3b82f6', '#ec4899', '#eab308', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#d946ef'];
const LIGHT_COLORS = ['#2563eb', '#db2777', '#ca8a04', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#c026d3'];

function SignatureBadge({ status }: { status?: string }) {
    if (!status || status === 'N') return null;
    if (status === 'G') return <Lock className="w-3 h-3 text-green-500" title="Verified Signature" />;
    if (status === 'B') return <ShieldAlert className="w-3 h-3 text-red-500" title="Bad Signature" />;
    return <ShieldQuestion className="w-3 h-3 text-yellow-500" title="Unknown Signature" />;
}

function calculateGraph(commits: any[], theme: 'light' | 'dark' = 'light') {
    const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    const sorted = [...commits].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const commitLaneMap = new Map<string, number>();
    const lanes: (string | null)[] = [];
    
    sorted.forEach(commit => {
        let myLane = commitLaneMap.get(commit.id);
        if (myLane === undefined) {
            myLane = lanes.findIndex(l => l === null);
            if (myLane === -1) {
                myLane = lanes.length;
                lanes.push(null);
            }
            commitLaneMap.set(commit.id, myLane);
        }
        lanes[myLane] = commit.id;
        if (commit.parents && commit.parents.length > 0) {
            const firstParent = commit.parents[0];
            if (!commitLaneMap.has(firstParent)) {
                commitLaneMap.set(firstParent, myLane);
            }
            for (let i = 1; i < commit.parents.length; i++) {
                const parent = commit.parents[i];
                if (!commitLaneMap.has(parent)) {
                    let newLane = lanes.length;
                    lanes.push(null);
                    commitLaneMap.set(parent, newLane);
                }
            }
        }
    });

    const rows: any[] = [];
    const activeRails = new Map<number, string>();

    sorted.forEach((commit, rowIndex) => {
        const laneIndex = commitLaneMap.get(commit.id)!;
        const color = colors[laneIndex % colors.length];
        activeRails.delete(laneIndex);
        const verticalRails: any[] = [];
        activeRails.forEach((rColor, rLane) => {
            verticalRails.push({
                laneIndex: rLane,
                color: rColor,
                fromY: rowIndex * COMMIT_HEIGHT,
                toY: (rowIndex + 1) * COMMIT_HEIGHT
            });
        });
        if (commit.parents && commit.parents.length > 0) {
            commit.parents.forEach((p: string) => {
                const pLane = commitLaneMap.get(p);
                if (pLane !== undefined) {
                    const pColor = colors[pLane % colors.length];
                    activeRails.set(pLane, pColor);
                }
            });
        }
        rows.push({
            commit,
            x: laneIndex * LANE_WIDTH +LANE_WIDTH / 2,
            y: rowIndex * COMMIT_HEIGHT + COMMIT_HEIGHT / 2,
            color: color,
            verticalRails,
        });
    });

    const nodeMap = new Map<string, { x: number, y: number, color: string }>();
    rows.forEach(row => {
        nodeMap.set(row.commit.id, { x: row.x, y: row.y, color: row.color });
    });

    return { rows, height: sorted.length * COMMIT_HEIGHT, nodeMap };
}

export default function CommitGraph({ commits, branches, onCommitClick, onAction, theme = 'light' }: CommitGraphProps) {
  const [dragOverCommitId, setDragOverCommitId] = useState<string | null>(null);

  if (!commits || commits.length === 0) return null;

  const { rows, height, nodeMap } = useMemo(() => calculateGraph(commits, theme), [commits, theme]);

  const handleDragOver = (e: React.DragEvent, commitId: string) => {
      e.preventDefault();
      setDragOverCommitId(commitId);
  };

  const handleDrop = (e: React.DragEvent, commit: any) => {
      e.preventDefault();
      setDragOverCommitId(null);
      const data = e.dataTransfer.getData('gitforge/branch');
      if (data) {
          const branch = JSON.parse(data);
          onAction?.('drop-branch', commit, branch);
      }
  };

  return (
    <ScrollArea className="h-full w-full bg-background">
      <div className="relative" style={{ height: height + 50 }}>
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            {rows.map((row) => (
                <g key={row.commit.id}>
                    {row.verticalRails.map((rail: any, i: number) => (
                        <line 
                            key={`rail-${i}`}
                            x1={rail.laneIndex * LANE_WIDTH + LANE_WIDTH / 2}
                            y1={rail.fromY + COMMIT_HEIGHT/2} 
                            x2={rail.laneIndex * LANE_WIDTH + LANE_WIDTH / 2}
                            y2={rail.toY + COMMIT_HEIGHT/2}   
                            stroke={rail.color}
                            strokeWidth="2"
                        />
                    ))}
                    {row.commit.parents.map((parentId: string) => {
                         const parentNode = nodeMap.get(parentId);
                         if (!parentNode) return null;
                         const x1 = row.x;
                         const y1 = row.y;
                         const x2 = parentNode.x;
                         const y2 = parentNode.y;
                         if (x1 === x2) {
                             return (
                                <line 
                                    key={`${row.commit.id}-${parentId}`}
                                    x1={x1} y1={y1}
                                    x2={x2} y2={y2}
                                    stroke={row.color}
                                    strokeWidth="2"
                                />
                             );
                         }
                         const d = `M ${x1} ${y1} C ${x1} ${y1 + COMMIT_HEIGHT/2}, ${x2} ${y1 + COMMIT_HEIGHT/2}, ${x2} ${y2}`;
                         return (
                            <path 
                                key={`${row.commit.id}-${parentId}`}
                                d={d}
                                stroke={row.color}
                                strokeWidth="2"
                                fill="none"
                            />
                         );
                    })}
                </g>
            ))}
        </svg>

        {rows.map((row) => (
            <ContextMenu key={row.commit.id}>
                <ContextMenuTrigger>
                    <div 
                        className={`absolute flex items-center group cursor-pointer hover:bg-muted/50 rounded p-1 -ml-2 select-none ${dragOverCommitId === row.commit.id ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''}`}
                        style={{
                            top: row.y - 15, 
                            left: 0, 
                            width: '100%',
                            height: '30px'
                        }}
                        onClick={() => onCommitClick?.(row.commit)}
                        onDragOver={(e) => handleDragOver(e, row.commit.id)}
                        onDragLeave={() => setDragOverCommitId(null)}
                        onDrop={(e) => handleDrop(e, row.commit)}
                    >
                        <div 
                            className="absolute rounded-full border-2 border-background z-10"
                            style={{
                                left: row.x - CIRCLE_RADIUS,
                                top: 15 - CIRCLE_RADIUS,
                                width: CIRCLE_RADIUS * 2,
                                height: CIRCLE_RADIUS * 2,
                                backgroundColor: row.color
                            }}
                        />
                        <div className="ml-[140px] flex-1 flex justify-between gap-4 text-xs pr-4 min-w-0 items-center">
                            <span className="font-mono text-muted-foreground w-16 flex-shrink-0">{row.commit.id.substring(0,7)}</span>
                            <div className="flex-1 truncate flex items-center gap-2 min-w-0">
                                <SignatureBadge status={row.commit.signature} />
                                {branches?.filter(b => b.commitId === row.commit.id || b.target === row.commit.id).map(b => (
                                    <span key={b.name} className={`px-1 rounded text-[10px] font-bold flex-shrink-0 ${b.isCurrentRepositoryHead ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border'}`}>
                                        {b.name}
                                    </span>
                                ))}
                                <span className="font-semibold truncate">{row.commit.message.split('\n')[0]}</span>
                            </div>
                            <span className="text-muted-foreground whitespace-nowrap hidden sm:block truncate max-w-[100px]">{row.commit.author}</span>
                            <span className="text-muted-foreground whitespace-nowrap opacity-70 w-24 text-right flex-shrink-0">
                                {new Date(row.commit.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => onAction?.('checkout', row.commit)}>
                        Checkout this Commit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onAction?.('merge', row.commit)}>
                        Merge into Current
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onAction?.('rebase', row.commit)}>
                        Rebase onto this Commit
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onAction?.('cherrypick', row.commit)}>
                        Cherry-Pick
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onAction?.('copy', row.commit)}>
                        Copy SHA
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        ))}
      </div>
    </ScrollArea>
  );
}