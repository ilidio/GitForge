'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

interface FileTreeProps {
    files: any[];
    selectedFile: string | null;
    onFileClick: (path: string) => void;
    onToggleStage?: (file: any) => void;
    viewMode: 'workdir' | 'commit';
        onResolve?: (file: any) => void;
        onIgnore?: (path: string) => void;
        onHistory?: (path: string) => void;
    }
    
    interface TreeNode {
        name: string;
        path: string;
        children: Record<string, TreeNode>;
        files: any[];
    }
    
    export default function FileTree({ files, selectedFile, onFileClick, onToggleStage, viewMode, onResolve, onIgnore, onHistory }: FileTreeProps) {
        const buildTree = (files: any[]) => {
            const root: TreeNode = { name: '', path: '', children: {}, files: [] };
            files.forEach(file => {
                const parts = file.path.split('/');
                let current = root;
                let currentPath = '';
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    if (!current.children[part]) {
                        current.children[part] = { name: part, path: currentPath, children: {}, files: [] };
                    }
                    current = current.children[part];
                }
                current.files.push(file);
            });
            return root;
        };
    
        const tree = buildTree(files);
    
        return (
            <div className="text-xs">
                <TreeItem 
                    node={tree} 
                    level={0} 
                    selectedFile={selectedFile} 
                    onFileClick={onFileClick} 
                    onToggleStage={onToggleStage}
                    viewMode={viewMode}
                    onResolve={onResolve}
                    onIgnore={onIgnore}
                    onHistory={onHistory}
                    isRoot
                />
            </div>
        );
    }
    
    function TreeItem({ node, level, selectedFile, onFileClick, onToggleStage, viewMode, onResolve, onIgnore, onHistory, isRoot = false }: any) {
        const [isOpen, setIsOpen] = useState(true);
    
        const hasContent = Object.keys(node.children).length > 0 || node.files.length > 0;
    
        return (
            <div>
                {!isRoot && (
                    <div 
                        className="flex items-center py-1 px-2 hover:bg-muted cursor-pointer rounded select-none"
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                            {Object.keys(node.children).length > 0 || node.files.length > 0 ? (
                                isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                            ) : null}
                        </div>
                        <Folder className="h-3.5 w-3.5 mr-2 text-blue-400 fill-blue-400/20" />
                        <span className="font-medium truncate">{node.name}</span>
                    </div>
                )}
    
                {isOpen && (
                    <div>
                        {Object.values(node.children).sort((a: any, b: any) => a.name.localeCompare(b.name)).map((child: any) => (
                            <TreeItem 
                                key={child.path} 
                                node={child} 
                                level={isRoot ? level : level + 1} 
                                selectedFile={selectedFile} 
                                onFileClick={onFileClick}
                                onToggleStage={onToggleStage}
                                viewMode={viewMode}
                                onResolve={onResolve}
                                onIgnore={onIgnore}
                                onHistory={onHistory}
                            />
                        ))}
                        {node.files.sort((a: any, b: any) => a.path.localeCompare(b.path)).map((file: any) => {
                            const fileName = file.path.split('/').pop();
                            const isStaged = file.status.includes("Index") || file.status === "Staged";
                            const isConflicted = file.status.includes("Conflicted");
    
                            return (
                                <ContextMenu key={file.path}>
                                    <ContextMenuTrigger asChild>
                                        <div 
                                            className={`flex items-center py-1 px-2 group cursor-pointer rounded border border-transparent ${selectedFile === file.path ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted'}`}
                                            style={{ paddingLeft: `${(isRoot ? level : level + 1) * 12 + 8}px` }}
                                            onClick={() => onFileClick(file.path)}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {viewMode === 'workdir' && (
                                                    <Checkbox 
                                                        checked={isStaged}
                                                        onCheckedChange={() => onToggleStage?.(file)}
                                                        onClick={(e) => e.stopPropagation()} 
                                                        className="h-3 w-3"
                                                    />
                                                )}
                                                <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isConflicted ? 'text-destructive' : 'text-muted-foreground'}`} />
                                                <div className="flex-1 truncate flex items-center justify-between gap-2">
                                                    <span className={`truncate ${isConflicted ? 'text-destructive font-semibold' : ''}`}>{fileName}</span>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {isConflicted && onResolve && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-4 text-[8px] px-1 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onResolve(file);
                                                                }}
                                                            >
                                                                Resolve
                                                            </Button>
                                                        )}
                                                        <span className={`text-[8px] uppercase font-bold px-1 rounded ${isConflicted ? 'bg-destructive/10 text-destructive' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                                            {file.status.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        {viewMode === 'workdir' && onIgnore && (
                                            <ContextMenuItem onClick={() => onIgnore(file.path)}>
                                                Add to .gitignore
                                            </ContextMenuItem>
                                        )}
                                        {onHistory && (
                                            <ContextMenuItem onClick={() => onHistory(file.path)}>
                                                View File History
                                            </ContextMenuItem>
                                        )}
                                    </ContextMenuContent>
                                </ContextMenu>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
