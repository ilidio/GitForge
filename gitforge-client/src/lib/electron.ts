
// Wrapper for Electron IPC calls

let ipcRenderer: any = null;

if (typeof window !== 'undefined' && (window as any).require) {
    try {
        const electron = (window as any).require('electron');
        ipcRenderer = electron.ipcRenderer;
    } catch (e) {
        console.error("Could not load electron ipcRenderer", e);
    }
}

export async function getLog(repoPath: string, count = 50) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    const output = await ipcRenderer.invoke('git:log', { repoPath, count });
    // Parse the output here to match the expected format
    return output.split('\n').filter(Boolean).map((line: string) => {
        const [id, author, timestamp, message, signature] = line.split('|');
        return { id, author, timestamp, message, signature };
    });
}

export async function stashPush(repoPath: string, message: string, files: string[] = []) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:stashPush', { repoPath, message, files });
}

export async function generateAICommitMessage(diff: string, apiKey: string, endpoint?: string, model?: string, context?: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('ai:generateCommitMessage', { diff, apiKey, endpoint, model, context });
}

export async function getDiffDetails(repoPath: string, filePath: string, staged: boolean) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:diffDetails', { repoPath, filePath, staged });
}

export async function applyPatch(repoPath: string, patch: string, cached = true, reverse = false) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:apply', { repoPath, patch, cached, reverse });
}

export async function lsFiles(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:ls-files', repoPath);
}

export async function fetchCommitStatus(owner: string, repo: string, sha: string, token: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('github:fetchStatus', { owner, repo, sha, token });
}

export function spawnTerminal(repoPath: string, cols: number, rows: number, onData: (data: string) => void) {
    if (!ipcRenderer) return;
    
    // Remove previous listeners to avoid dupes if any
    ipcRenderer.removeAllListeners('terminal:data');
    ipcRenderer.removeAllListeners('terminal:exit');

    ipcRenderer.send('terminal:spawn', { repoPath, cols, rows });
    
    ipcRenderer.on('terminal:data', (_, data: string) => {
        onData(data);
    });

    return {
        write: (data: string) => ipcRenderer.send('terminal:input', data),
        resize: (cols: number, rows: number) => ipcRenderer.send('terminal:resize', { cols, rows }),
        dispose: () => ipcRenderer.removeAllListeners('terminal:data')
    };
}

export async function getTags(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getTags', repoPath);
}

export async function createTag(repoPath: string, name: string, message: string, sha?: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:createTag', { repoPath, name, message, sha });
}

export async function deleteTag(repoPath: string, name: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:deleteTag', { repoPath, name });
}

export async function getBlame(repoPath: string, filePath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:blame', { repoPath, filePath });
}

export async function getBlamePorcelain(repoPath: string, filePath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:blamePorcelain', { repoPath, filePath });
}

export async function getConfig(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getConfig', repoPath);
}

export async function setConfig(repoPath: string, key: string, value: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:setConfig', { repoPath, key, value });
}

export async function getRemotes(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getRemotes', repoPath);
}

export async function addRemote(repoPath: string, name: string, url: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:addRemote', { repoPath, name, url });
}

export async function removeRemote(repoPath: string, name: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:removeRemote', { repoPath, name });
}

export async function appendFile(path: string, content: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('fs:appendFile', { path, content });
}

export async function writeFile(path: string, content: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('fs:writeFile', { path, content });
}

export async function getFileHistory(repoPath: string, filePath: string, limit = 50) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:logFile', { repoPath, filePath, limit });
}

export async function getReflog(repoPath: string, limit = 20) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:reflog', { repoPath, limit });
}

export async function reset(repoPath: string, target: string, mode: 'soft' | 'mixed' | 'hard' = 'mixed') {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:reset', { repoPath, target, mode });
}

export async function checkout(repoPath: string, target: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    // We can reuse the same command runner or add specific ipc if needed.
    // For now, let's just run "git checkout <target>"
    // But I don't have a generic "runGit" exposed to renderer.
    // I need an IPC handler for checkout.
    // Let's check main.js. There is 'repository/checkout' via API, but not IPC.
    // But I can add one or use the existing 'git:reset' style.
    // Let's check main.js... no 'git:checkout'.
    // I'll add 'git:checkout' to main.js and then expose it here.
    return ipcRenderer.invoke('git:checkout', { repoPath, target });
}

export async function openDifftool(repoPath: string, filePath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:openDifftool', { repoPath, filePath });
}

export async function getCustomGraph(repoPath: string, command: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getCustomGraph', { repoPath, command });
}

export async function globalGrep(repoPaths: string[], pattern: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:globalGrep', { repoPaths, pattern });
}

export async function getSubmodules(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getSubmodules', repoPath);
}

export async function updateSubmodule(repoPath: string, name: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:updateSubmodule', { repoPath, name });
}

export async function getRepoStats(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:getRepoStats', repoPath);
}

export async function grepHistory(repoPath: string, pattern: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:grep', { repoPath, pattern });
}

export async function restoreAll(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:restoreAll', repoPath);
}

export async function cloneRepo(url: string, destination: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:clone', { url, destination });
}

export async function initRepo(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:init', repoPath);
}

export async function getDiffFile(repoPath: string, filePath: string, staged: boolean) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:diffFile', { repoPath, filePath, staged });
}

export async function dropStashElectron(repoPath: string, index: number) {
    // We already have dropStash in api.ts calling the server, but let's use electron one if we prefer direct git
    // Or just rename this to distinguish.
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:stashDrop', { repoPath, index });
}

export async function gitRm(repoPath: string, filePath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:rm', { repoPath, filePath });
}

export async function bisectStart(repoPath: string, bad: string, good: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:bisectStart', { repoPath, bad, good });
}

export async function bisectReset(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:bisectReset', repoPath);
}

export async function bisectGood(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:bisectGood', repoPath);
}

export async function bisectBad(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:bisectBad', repoPath);
}

export async function revertCommit(repoPath: string, sha: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:revert', { repoPath, sha });
}

export async function gitArchive(repoPath: string, ref: string, outputPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:archive', { repoPath, ref, outputPath });
}

export async function getWorktrees(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:worktreeList', repoPath);
}

export async function addWorktree(repoPath: string, path: string, branch: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:worktreeAdd', { repoPath, path, branch });
}

export async function removeWorktree(repoPath: string, path: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:worktreeRemove', { repoPath, path });
}

export async function gitGc(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:gc', repoPath);
}

export async function gitMv(repoPath: string, oldPath: string, newPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:mv', { repoPath, oldPath, newPath });
}
