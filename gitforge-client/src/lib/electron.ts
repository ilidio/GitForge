
// Wrapper for Electron IPC calls

type IpcRenderer = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: <T = unknown>(channel: string, ...args: any[]) => Promise<T>;
    send: (channel: string, ...args: unknown[]) => void;
    on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
    removeAllListeners: (channel: string) => void;
};

type ElectronWindow = Window & {
    require?: (module: string) => { ipcRenderer: IpcRenderer };
};

let ipcRenderer: IpcRenderer | null = null;

if (typeof window !== 'undefined' && (window as ElectronWindow).require) {
    try {
        const electron = (window as ElectronWindow).require!('electron');
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {
        console.error("Could not load electron ipcRenderer", e);
    }
}

export async function getCommitChangesElectron(repoPath: string, sha: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:commitChanges', { repoPath, sha });
}

export async function getCommitFileDiffElectron(repoPath: string, sha: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getCommitFileDiff', { repoPath, sha, filePath });
}

export async function getLog(repoPath: string, count = 50) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    const output = await ipcRenderer.invoke<string>('git:log', { repoPath, count });
    // Parse the output here to match the expected format
    return output.split('\n').filter(Boolean).map((line: string) => {
        const [id, author, timestamp, message, signature] = line.split('|');
        return { id, author, timestamp, message, signature };
    });
}

export async function getCommitsForDate(repoPath: string, since: string, until: string): Promise<unknown[]> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<unknown[]>('git:getCommitsForDate', { repoPath, since, until });
}

export async function stashPush(repoPath: string, message: string, files: string[] = []): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:stashPush', { repoPath, message, files });
}

export async function generateAICommitMessage(diff: string, apiKey: string, endpoint?: string, model?: string, context?: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('ai:generateCommitMessage', { diff, apiKey, endpoint, model, context });
}

export async function reviewChanges(diff: string, apiKey: string, endpoint?: string, model?: string, context?: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('ai:reviewChanges', { diff, apiKey, endpoint, model, context });
}

export async function generateDailyBrief(commits: unknown[], apiKey: string, endpoint?: string, model?: string, language?: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('ai:generateDailyBrief', { commits, apiKey, endpoint, model, language });
}

export async function getFileContentBinary(repoPath: string, ref: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:showBinary', { repoPath, ref, filePath });
}

export async function getDiffDetails(repoPath: string, filePath: string, staged: boolean): Promise<{ original: string; modified: string }> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<{ original: string; modified: string }>('git:diffDetails', { repoPath, filePath, staged });
}

export async function compareFiles(repoPath: string, pathA: string, refA: string | null, pathB: string, refB: string | null): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:compareFiles', { repoPath, pathA, refA, pathB, refB });
}

export async function applyPatch(repoPath: string, patch: string, cached = true, reverse = false): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:apply', { repoPath, patch, cached, reverse });
}

export async function lsFiles(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:ls-files', repoPath);
}

export async function fetchCommitStatus(owner: string, repo: string, sha: string, token: string): Promise<unknown> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('github:fetchStatus', { owner, repo, sha, token });
}

export function spawnTerminal(repoPath: string, cols: number, rows: number, onData: (data: string) => void) {
    if (!ipcRenderer) return;
    
    // Remove previous listeners to avoid dupes if any
    ipcRenderer.removeAllListeners('terminal:data');
    ipcRenderer.removeAllListeners('terminal:exit');

    ipcRenderer.send('terminal:spawn', { repoPath, cols, rows });
    
    ipcRenderer.on('terminal:data', (_: unknown, ...args: unknown[]) => {
        onData(args[0] as string);
    });

    return {
        write: (data: string) => ipcRenderer!.send('terminal:input', data),
        resize: (cols: number, rows: number) => ipcRenderer!.send('terminal:resize', { cols, rows }),
        dispose: () => ipcRenderer!.removeAllListeners('terminal:data')
    };
}

export async function getTags(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getTags', repoPath);
}

export async function createTag(repoPath: string, name: string, message: string, sha?: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:createTag', { repoPath, name, message, sha });
}

export async function deleteTag(repoPath: string, name: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:deleteTag', { repoPath, name });
}

export async function getBlame(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:blame', { repoPath, filePath });
}

export async function getBlamePorcelain(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:blamePorcelain', { repoPath, filePath });
}

export async function getConfig(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getConfig', repoPath);
}

export async function setConfig(repoPath: string, key: string, value: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:setConfig', { repoPath, key, value });
}

export async function getRemotes(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getRemotes', repoPath);
}

export async function addRemote(repoPath: string, name: string, url: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:addRemote', { repoPath, name, url });
}

export async function removeRemote(repoPath: string, name: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:removeRemote', { repoPath, name });
}

export async function appendFile(path: string, content: string): Promise<unknown> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('fs:appendFile', { path, content });
}

export async function writeFile(path: string, content: string): Promise<unknown> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('fs:writeFile', { path, content });
}

export async function getFileHistory(repoPath: string, filePath: string, limit = 50): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:logFile', { repoPath, filePath, limit });
}

export async function getReflog(repoPath: string, limit = 20): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:reflog', { repoPath, limit });
}

export async function reset(repoPath: string, target: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed'): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:reset', { repoPath, target, mode });
}

export async function checkout(repoPath: string, target: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    // We can reuse the same command runner or add specific ipc if needed.
    // For now, let's just run "git checkout <target>"
    // But I don't have a generic "runGit" exposed to renderer.
    // I need an IPC handler for checkout.
    // Let's check main.js. There is 'repository/checkout' via API, but not IPC.
    // But I can add one or use the existing 'git:reset' style.
    // Let's check main.js... no 'git:checkout'.
    // I'll add 'git:checkout' to main.js and then expose it here.
    return ipcRenderer.invoke<string>('git:checkout', { repoPath, target });
}

export async function openDifftool(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:openDifftool', { repoPath, filePath });
}

export async function getCustomGraph(repoPath: string, command: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getCustomGraph', { repoPath, command });
}

export async function globalGrep(repoPaths: string[], pattern: string): Promise<unknown[]> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<unknown[]>('git:globalGrep', { repoPaths, pattern });
}

export async function getSubmodules(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:getSubmodules', repoPath);
}

export async function updateSubmodule(repoPath: string, name: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:updateSubmodule', { repoPath, name });
}

export async function getRepoStats(repoPath: string): Promise<unknown> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getRepoStats', repoPath);
}

export async function grepHistory(repoPath: string, pattern: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:grep', { repoPath, pattern });
}

export async function restoreAll(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:restoreAll', repoPath);
}

export async function cloneRepo(url: string, destination: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:clone', { url, destination });
}

export async function initRepo(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:init', repoPath);
}

export async function getDiffFile(repoPath: string, filePath: string, staged: boolean): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:diffFile', { repoPath, filePath, staged });
}

export async function dropStashElectron(repoPath: string, index: number): Promise<string> {
    // We already have dropStash in api.ts calling the server, but let's use electron one if we prefer direct git
    // Or just rename this to distinguish.
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:stashDrop', { repoPath, index });
}

export async function gitRm(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:rm', { repoPath, filePath });
}

export async function bisectStart(repoPath: string, bad: string, good: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:bisectStart', { repoPath, bad, good });
}

export async function bisectReset(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:bisectReset', repoPath);
}

export async function bisectGood(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:bisectGood', repoPath);
}

export async function bisectBad(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:bisectBad', repoPath);
}

export async function revertCommit(repoPath: string, sha: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:revert', { repoPath, sha });
}

export async function gitArchive(repoPath: string, ref: string, outputPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:archive', { repoPath, ref, outputPath });
}

export async function getWorktrees(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:worktreeList', repoPath);
}

export async function addWorktree(repoPath: string, path: string, branch: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:worktreeAdd', { repoPath, path, branch });
}

export async function removeWorktree(repoPath: string, path: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:worktreeRemove', { repoPath, path });
}

export async function gitGc(repoPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:gc', repoPath);
}

export async function gitMv(repoPath: string, oldPath: string, newPath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:mv', { repoPath, oldPath, newPath });
}

export async function stageFile(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:stage', { repoPath, filePath });
}

export async function unstageFile(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:unstage', { repoPath, filePath });
}

export async function discardPath(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:discardPath', { repoPath, filePath });
}

export async function discardUnstaged(repoPath: string, filePath: string): Promise<string> {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke<string>('git:discardUnstaged', { repoPath, filePath });
}

export async function getRepoStatus(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    
    const [output, branches] = await Promise.all([
        ipcRenderer.invoke<string>('git:status', repoPath),
        getBranches(repoPath).catch(() => [])
    ]);

    const head = branches.find((b: { isCurrentRepositoryHead: boolean; name: string }) => b.isCurrentRepositoryHead)?.name || "Detached HEAD";

    // Parse output
    // XY PATH
    // ?? untracked
    const files = output.split('\n').filter(Boolean).map((line: string) => {
        const statusChar = line.substring(0, 2);
        let path = line.substring(3);
        
        // Unquote if git quoted the path
        if (path.startsWith('"') && path.endsWith('"')) {
            path = path.substring(1, path.length - 1).replace(/\\"/g, '"');
        }

        let fullStatus = "";
        
        // Handle conflicts (U in any position)
        if (statusChar.includes('U') || (statusChar[0] === 'A' && statusChar[1] === 'A') || (statusChar[0] === 'D' && statusChar[1] === 'D')) {
            fullStatus = "Conflicted";
        } else if (statusChar.includes('?')) {
            fullStatus = "Untracked";
        } else {
             const staged = statusChar[0] !== ' ' && statusChar[0] !== '?';
             const unstaged = statusChar[1] !== ' ' && statusChar[1] !== '?';
             
             if (staged && unstaged) fullStatus = "Staged & Unstaged";
             else if (staged) fullStatus = "Staged";
             else if (unstaged) fullStatus = "Unstaged";
        }
        
        if (!fullStatus) fullStatus = "Modified"; // Fallback

        return { path, status: fullStatus, rawStatus: statusChar };
    });
    return { head, files };
}

export async function getBranches(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    const output = await ipcRenderer.invoke<string>('git:branches', repoPath);
    // SHA|refs/heads/master|*
    return output.split('\n').filter(Boolean).map((line: string) => {
        const [commitId, refName, head] = line.split('|');
        const isRemote = refName.startsWith('refs/remotes/');
        const name = refName.replace('refs/heads/', '').replace('refs/remotes/', '');
        return { name, commitId, isCurrentRepositoryHead: head === '*', isRemote };
    });
}
