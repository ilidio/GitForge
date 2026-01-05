const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let sidecarProcess = null;

function runGit(command, cwd) {
  return new Promise((resolve, reject) => {
      exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
          if (error) {
              reject({ message: error.message, stderr, stdout });
          } else {
              resolve(stdout.trim());
          }
      });
  });
}

function startSidecar() {
  if (isDev) {
    // In dev, we assume the server is started separately or we start it via dotnet run
    console.log('Starting sidecar in dev mode...');
    const serverPath = path.join(__dirname, '../gitforge-server');
    sidecarProcess = spawn('dotnet', ['run', '--project', 'GitForge.Server.csproj'], {
      cwd: serverPath,
      stdio: 'inherit',
    });
  } else {
    // In production, we would point to the bundled executable
    const sidecarPath = path.join(process.resourcesPath, 'GitForge.Server');
    sidecarProcess = spawn(sidecarPath, [], { stdio: 'inherit' });
  }

  sidecarProcess.on('error', (err) => {
    console.error('Failed to start sidecar:', err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    titleBarStyle: 'hiddenInset', // Modern macOS look
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

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
    if (canceled) {
      return { canceled, filePaths: [] };
    }
    return { canceled, filePaths };
  });

  // --- Git IPC Handlers ---

  // Tags
  ipcMain.handle('git:getTags', async (_, repoPath) => {
      return runGit('git tag -n', repoPath);
  });

  ipcMain.handle('git:createTag', async (_, { repoPath, name, message, sha }) => {
      let cmd = `git tag -a "${name}" -m "${message || name}"`;
      if (sha) cmd += ` ${sha}`;
      return runGit(cmd, repoPath);
  });

  ipcMain.handle('git:deleteTag', async (_, { repoPath, name }) => {
      return runGit(`git tag -d "${name}"`, repoPath);
  });

  // Blame
  ipcMain.handle('git:blame', async (_, { repoPath, filePath }) => {
      // -p for porcelain format might be better, but start with standard for simplicity or -t
      return runGit(`git blame "${filePath}"`, repoPath);
  });

  // Config
  ipcMain.handle('git:getConfig', async (_, repoPath) => {
      return runGit('git config --list', repoPath);
  });

  ipcMain.handle('git:setConfig', async (_, { repoPath, key, value }) => {
      return runGit(`git config "${key}" "${value}"`, repoPath);
  });

  // Remotes
  ipcMain.handle('git:getRemotes', async (_, repoPath) => {
      return runGit('git remote -v', repoPath);
  });

  ipcMain.handle('git:addRemote', async (_, { repoPath, name, url }) => {
      return runGit(`git remote add "${name}" "${url}"`, repoPath);
  });

  ipcMain.handle('git:removeRemote', async (_, { repoPath, name }) => {
      return runGit(`git remote remove "${name}"`, repoPath);
  });

  // File System
  ipcMain.handle('fs:appendFile', async (_, { path: filePath, content }) => {
      return new Promise((resolve, reject) => {
          fs.appendFile(filePath, content, (err) => {
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
