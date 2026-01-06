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

  ipcMain.handle('git:checkout', async (_, { repoPath, target }) => {
      return runGit(`git checkout "${target}"`, repoPath);
  });

  ipcMain.handle('git:openDifftool', async (_, { repoPath, filePath }) => {
      return runGit(`git difftool -y "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:getCustomGraph', async (_, { repoPath, command }) => {
      // Ensure we use color=always for the terminal graph
      const cmdWithColor = command.includes('--color') ? command : `${command} --color=always`;
      return runGit(cmdWithColor, repoPath);
  });

  ipcMain.handle('git:globalGrep', async (_, { repoPaths, pattern }) => {
      const results = [];
      for (const repoPath of repoPaths) {
          try {
              const output = await runGit(`git log -G "${pattern}" --pretty=format:"%H|%an|%ad|%s" --date=iso`, repoPath);
              if (output) {
                  const parsed = output.split('\n').map(line => {
                      const [id, author, date, message] = line.split('|');
                      return { id, author, date, message, repoPath };
                  });
                  results.push(...parsed);
              }
          } catch (e) {
              console.error(`Grep failed for ${repoPath}`, e);
          }
      }
      return results;
  });

  ipcMain.handle('git:getSubmodules', async (_, repoPath) => {
      return runGit('git submodule status', repoPath);
  });

  ipcMain.handle('git:updateSubmodule', async (_, { repoPath, name }) => {
      return runGit(`git submodule update --init --recursive "${name}"`, repoPath);
  });

  ipcMain.handle('git:getRepoStats', async (_, repoPath) => {
      const authors = await runGit('git shortlog -sn --all', repoPath);
      const activity = await runGit('git log --date=short --pretty=format:%ad', repoPath);
      const hotFiles = await runGit('git log --name-only --pretty=format: | sort | uniq -c | sort -nr | head -n 10', repoPath);
      
      return { authors, activity, hotFiles };
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

  ipcMain.handle('git:clone', async (_, { url, destination }) => {
      // git clone <url> <destination>
      // We run this in the parent directory of destination, or just use the full command.
      // runGit expects a cwd. For clone, we can run it in the parent dir of destination, 
      // or just run it with no specific cwd if we provide full path.
      // But runGit implementation uses exec(command, { cwd: normalizedPath }).
      // So we need a valid cwd.
      
      const parentDir = path.dirname(destination);
      const dirName = path.basename(destination);
      
      // Ensure parent directory exists
      if (!fs.existsSync(parentDir)) {
          throw new Error(`Parent directory ${parentDir} does not exist`);
      }
      
      return runGit(`git clone "${url}" "${dirName}"`, parentDir);
  });

  ipcMain.handle('git:init', async (_, repoPath) => {
      const normalizedPath = path.normalize(repoPath);
      // Ensure directory exists
      if (!fs.existsSync(normalizedPath)) {
          fs.mkdirSync(normalizedPath, { recursive: true });
      }
      return runGit('git init', normalizedPath);
  });

  ipcMain.handle('git:diffFile', async (_, { repoPath, filePath, staged }) => {
      // if staged, git diff --staged -- filePath
      // else git diff -- filePath
      const flag = staged ? '--staged' : '';
      return runGit(`git diff ${flag} -- "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:stashDrop', async (_, { repoPath, index }) => {
      return runGit(`git stash drop stash@{${index}}`, repoPath);
  });

  ipcMain.handle('git:rm', async (_, { repoPath, filePath }) => {
      return runGit(`git rm -f "${filePath}"`, repoPath);
  });
  
  // Bisect
  ipcMain.handle('git:bisectStart', async (_, { repoPath, bad, good }) => {
      // bad is usually HEAD, good is older
      // git bisect start <bad> <good>
      return runGit(`git bisect start "${bad}" "${good}"`, repoPath);
  });

  ipcMain.handle('git:bisectReset', async (_, repoPath) => {
      return runGit('git bisect reset', repoPath);
  });

  ipcMain.handle('git:bisectGood', async (_, repoPath) => {
      return runGit('git bisect good', repoPath);
  });

  ipcMain.handle('git:bisectBad', async (_, repoPath) => {
      return runGit('git bisect bad', repoPath);
  });
  
  ipcMain.handle('git:revert', async (_, { repoPath, sha }) => {
      // --no-edit to avoid launching editor
      return runGit(`git revert --no-edit "${sha}"`, repoPath);
  });

  // Archive
  ipcMain.handle('git:archive', async (_, { repoPath, ref, outputPath }) => {
      return runGit(`git archive --format=zip --output="${outputPath}" "${ref}"`, repoPath);
  });

  // Worktree
  ipcMain.handle('git:worktreeList', async (_, repoPath) => {
      return runGit('git worktree list', repoPath);
  });

  ipcMain.handle('git:worktreeAdd', async (_, { repoPath, path: wtPath, branch }) => {
      return runGit(`git worktree add "${wtPath}" "${branch}"`, repoPath);
  });

  ipcMain.handle('git:worktreeRemove', async (_, { repoPath, path: wtPath }) => {
      return runGit(`git worktree remove "${wtPath}"`, repoPath);
  });

  // GC
  ipcMain.handle('git:gc', async (_, repoPath) => {
      return runGit('git gc', repoPath);
  });

  // MV
  ipcMain.handle('git:mv', async (_, { repoPath, oldPath, newPath }) => {
      return runGit(`git mv "${oldPath}" "${newPath}"`, repoPath);
  });

  ipcMain.handle('dialog:saveFile', async (_, { defaultPath }) => {
      const { canceled, filePath } = await dialog.showSaveDialog({
          defaultPath,
          filters: [{ name: 'Zip Files', extensions: ['zip'] }]
      });
      return { canceled, filePath };
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
