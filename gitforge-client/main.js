const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let sidecarProcess = null;

function runGit(command, repoPath) {
  // Normalize path for the OS
  const normalizedPath = path.normalize(repoPath);
  
  return new Promise((resolve, reject) => {
      // Use a larger maxBuffer and ensure the path is handled correctly by the shell
      exec(command, { 
          cwd: normalizedPath, 
          maxBuffer: 1024 * 1024 * 10 
      }, (error, stdout, stderr) => {
          if (error) {
              reject({ message: error.message, stderr, stdout });
          } else {
              resolve(stdout.trim());
          }
      });
  });
}

function startSidecar() {
  const isWindows = process.platform === 'win32';
  const dotnetCmd = isWindows ? 'dotnet.exe' : 'dotnet';

  if (isDev) {
    console.log('Starting sidecar in dev mode...');
    const serverPath = path.resolve(__dirname, '..', 'gitforge-server');
    sidecarProcess = spawn(dotnetCmd, ['run', '--project', 'GitForge.Server.csproj'], {
      cwd: serverPath,
      stdio: 'inherit',
      shell: isWindows // Windows needs shell for dotnet run often
    });
  } else {
    const binaryName = isWindows ? 'GitForge.Server.exe' : 'GitForge.Server';
    const sidecarPath = path.join(process.resourcesPath, binaryName);
    sidecarProcess = spawn(sidecarPath, [], { stdio: 'inherit' });
  }

  sidecarProcess.on('error', (err) => {
    console.error('Failed to start sidecar:', err);
  });
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // Only use hiddenInset on macOS for the modern integrated look
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    frame: true,
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'out', 'index.html')}`;

  win.loadURL(url);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return { canceled, filePaths: filePaths || [] };
  });

  // --- Git IPC Handlers ---

  ipcMain.handle('git:getTags', async (_, repoPath) => {
      return runGit('git tag -n', repoPath);
  });

  ipcMain.handle('git:createTag', async (_, { repoPath, name, message, sha }) => {
      // Quote arguments to handle spaces and special chars
      let cmd = `git tag -a "${name}" -m "${message || name}"`;
      if (sha) cmd += ` ${sha}`;
      return runGit(cmd, repoPath);
  });

  ipcMain.handle('git:deleteTag', async (_, { repoPath, name }) => {
      return runGit(`git tag -d "${name}"`, repoPath);
  });

  ipcMain.handle('git:blame', async (_, { repoPath, filePath }) => {
      return runGit(`git blame "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:getConfig', async (_, repoPath) => {
      return runGit('git config --list', repoPath);
  });

  ipcMain.handle('git:setConfig', async (_, { repoPath, key, value }) => {
      return runGit(`git config "${key}" "${value}"`, repoPath);
  });

  ipcMain.handle('git:getRemotes', async (_, repoPath) => {
      return runGit('git remote -v', repoPath);
  });

  ipcMain.handle('git:addRemote', async (_, { repoPath, name, url }) => {
      return runGit(`git remote add "${name}" "${url}"`, repoPath);
  });

  ipcMain.handle('git:removeRemote', async (_, { repoPath, name }) => {
      return runGit(`git remote remove "${name}"`, repoPath);
  });

  ipcMain.handle('git:logFile', async (_, { repoPath, filePath, limit = 50 }) => {
      return runGit(`git log -n ${limit} --pretty=format:"%H|%an|%ad|%s" --date=iso -- "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:reflog', async (_, { repoPath, limit = 20 }) => {
      return runGit(`git reflog -n ${limit} --pretty=format:"%H|%gd|%gs"`, repoPath);
  });

  ipcMain.handle('git:reset', async (_, { repoPath, target, mode = 'mixed' }) => {
      return runGit(`git reset --${mode} "${target}"`, repoPath);
  });

  ipcMain.handle('git:openDifftool', async (_, { repoPath, filePath }) => {
      return runGit(`git difftool -y "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:grep', async (_, { repoPath, pattern }) => {
      // Find commits where content matching pattern was changed
      return runGit(`git log -G "${pattern}" --pretty=format:"%H|%an|%ad|%s" --date=iso`, repoPath);
  });

  ipcMain.handle('git:restoreAll', async (_, repoPath) => {
      // Discard tracked changes and clean untracked files
      await runGit('git restore .', repoPath);
      return runGit('git clean -fd', repoPath);
  });

  // --- File System IPC Handlers ---

  ipcMain.handle('fs:appendFile', async (_, { path: filePath, content }) => {
      const normalizedPath = path.normalize(filePath);
      return new Promise((resolve, reject) => {
          fs.appendFile(normalizedPath, content, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  });

  ipcMain.handle('fs:writeFile', async (_, { path: filePath, content }) => {
      const normalizedPath = path.normalize(filePath);
      return new Promise((resolve, reject) => {
          fs.writeFile(normalizedPath, content, (err) => {
              if (err) reject(err);
              else resolve();
          });
      });
  });

  startSidecar();
  createWindow();
});


app.on('window-all-closed', () => {
  if (sidecarProcess) {
    sidecarProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (sidecarProcess) {
    sidecarProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
