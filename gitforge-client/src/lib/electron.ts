
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

export async function openDifftool(repoPath: string, filePath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:openDifftool', { repoPath, filePath });
}

export async function restoreAll(repoPath: string) {
    if (!ipcRenderer) throw new Error("Not in Electron environment");
    return ipcRenderer.invoke('git:restoreAll', repoPath);
}
