'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
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
  onAction?: (action: 'checkout' | 'merge' | 'cherrypick' | 'copy' | 'rebase', commit: any) => void;
}

const COMMIT_HEIGHT = 50;
const LANE_WIDTH = 24;
const CIRCLE_RADIUS = 6;
const COLORS = ['#0084ff', '#e6005c', '#e6e600', '#00e600', '#8c00e6', '#ff9900', '#00cccc', '#ff00cc'];

function calculateGraph(commits: any[]) {
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
        const color = COLORS[laneIndex % COLORS.length];
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
                    const pColor = COLORS[pLane % COLORS.length];
                    activeRails.set(pLane, pColor);
                }
            });
        }
        rows.push({
            commit,
            x: laneIndex * LANE_WIDTH + LANE_WIDTH / 2,
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

export default function CommitGraph({ commits, onCommitClick, onAction }: CommitGraphProps) {
  if (!commits || commits.length === 0) return null;

  const { rows, height, nodeMap } = useMemo(() => calculateGraph(commits), [commits]);

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
                        className="absolute flex items-center group cursor-pointer hover:bg-muted/50 rounded p-1 -ml-2 select-none"
                        style={{
                            top: row.y - 15, 
                            left: 0, 
                            width: '100%',
                            height: '30px'
                        }}
                        onClick={() => onCommitClick?.(row.commit)}
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
