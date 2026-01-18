const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let loadURL;

(async () => {
    try {
        const serve = (await import('electron-serve')).default;
        loadURL = serve({ directory: 'out' });
    } catch (e) {
        console.error("Failed to load electron-serve", e);
    }
})();

app.setName('GitForge');

let sidecarProcess = null;
let mainWindow = null;

function createMenu() {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{
            label: 'GitForge',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { 
                    label: 'Preferences...', 
                    accelerator: 'CmdOrCtrl+,', 
                    click: () => mainWindow?.webContents.send('menu:open-settings') 
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'File',
            submenu: [
                { 
                    label: 'Open Repository...', 
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
                        if (!canceled && filePaths.length > 0) {
                            mainWindow?.webContents.send('menu:open-repo', filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        await shell.openExternal('https://github.com/ilidiomartins/gitforge');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function runGit(command, repoPath, options = { trim: true }) {
  // Normalize path for the OS
  const normalizedPath = path.normalize(repoPath);
  
  return new Promise((resolve, reject) => {
      // Use a larger maxBuffer and ensure the path is handled correctly by the shell
      exec(command, { 
          cwd: normalizedPath, 
          maxBuffer: 1024 * 1024 * 10 
      }, (error, stdout, stderr) => {
          if (error) {
              const errorMessage = stderr ? stderr.trim() : error.message;
              reject(new Error(errorMessage));
          } else {
              const output = options.trim ? stdout.trim() : stdout;
              resolve(output);
          }
      });
  });
}

function startSidecar() {
  const isWindows = process.platform === 'win32';
  const dotnetCmd = isWindows ? 'dotnet.exe' : 'dotnet';

  if (!app.isPackaged) {
    console.log('Starting sidecar in dev mode...');
    const serverPath = path.resolve(__dirname, '..', 'gitforge-server');
    sidecarProcess = spawn(dotnetCmd, ['run', '--project', 'GitForge.Server.csproj'], {
      cwd: serverPath,
      stdio: 'inherit',
      shell: isWindows 
    });
  } else {
    const binaryName = isWindows ? 'GitForge.Server.exe' : 'GitForge.Server';
    const sidecarPath = path.join(process.resourcesPath, 'server', binaryName);
    
    console.log(`Starting production sidecar: ${sidecarPath}`);
    
    if (!fs.existsSync(sidecarPath)) {
        console.error(`Sidecar binary not found at: ${sidecarPath}`);
        return;
    }

    sidecarProcess = spawn(sidecarPath, ['--urls', 'http://localhost:5030'], { 
        stdio: 'inherit',
        cwd: path.dirname(sidecarPath)
    });
  }

  sidecarProcess.on('error', (err) => {
    console.error('Failed to start sidecar process:', err);
  });

  sidecarProcess.on('exit', (code, signal) => {
    console.log(`Sidecar process exited with code ${code} and signal ${signal}`);
    sidecarProcess = null;
  });
}

async function createWindow() {
  const isMac = process.platform === 'darwin';
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public', 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // Only use hiddenInset on macOS for the modern integrated look
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    frame: true,
  });

  if (process.platform === 'darwin') {
      try {
        app.dock.setIcon(path.join(__dirname, 'public', 'logo.png'));
      } catch (e) { console.error("Failed to set dock icon", e); }
  }

  if (app.isPackaged) {
      await loadURL(mainWindow);
  } else {
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createMenu();
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return { canceled, filePaths: filePaths || [] };
  });

  // --- Git IPC Handlers ---

  ipcMain.handle('git:log', async (_, { repoPath, count = 50 }) => {
      // Added %G? for GPG signature status: G=Good, B=Bad, U=Unknown, X=Expired, Y=ExpiredKey, R=RevokedKey, E=CantCheck, N=None
      return runGit(`git log -n ${count} --pretty=format:"%H|%an|%ad|%s|%G?" --date=iso`, repoPath);
  });

  ipcMain.handle('git:stashPush', async (_, { repoPath, message, files }) => {
      // git stash push -m "message" -- file1 file2
      let cmd = 'git stash push';
      if (message) cmd += ` -m "${message}"`;
      if (files && files.length > 0) {
          // Quote files
          const fileList = files.map(f => `"${f}"`).join(' ');
          cmd += ` -- ${fileList}`;
      }
      return runGit(cmd, repoPath);
  });

  ipcMain.handle('ai:generateCommitMessage', async (_, { diff, apiKey, endpoint, model, context }) => {
      if (!diff) throw new Error("No diff provided");
      if (!apiKey) throw new Error("API Key is required");
      
      const apiEndpoint = endpoint || 'https://api.openai.com/v1/chat/completions';
      const apiModel = model || 'gpt-3.5-turbo';

      let systemPrompt = "You are a helpful assistant that writes semantic commit messages.";
      if (context) {
          systemPrompt += `\nAdditional requirements:\n${context}`;
      }

      const prompt = `Generate a concise commit message (Conventional Commits style) for the following git diff. 
      Provide ONLY the commit message, no explanations.
      
      Diff:
      ${diff.substring(0, 3000)}`; // Truncate to avoid huge context

      try {
          // Special handling for Gemini API
          if (apiEndpoint.includes('generativelanguage.googleapis.com')) {
              const geminiUrl = `${apiEndpoint}?key=${apiKey}`;
              const geminiPrompt = `${systemPrompt}\n\n${prompt}`;
              
              const response = await fetch(geminiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      contents: [{
                          parts: [{ text: geminiPrompt }]
                      }]
                  })
              });

              if (!response.ok) {
                  const err = await response.text();
                  throw new Error(`Gemini API Error: ${err}`);
              }

              const data = await response.json();
              return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          } 
          
          // Standard OpenAI-compatible API
          const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                  model: apiModel,
                  messages: [
                      { role: "system", content: systemPrompt },
                      { role: "user", content: prompt }
                  ],
                  temperature: 0.7
              })
          });

          if (!response.ok) {
              const err = await response.text();
              throw new Error(`AI API Error: ${err}`);
          }

          const data = await response.json();
          return data.choices[0]?.message?.content?.trim();
      } catch (error) {
          console.error("AI Generation Failed:", error);
          throw error;
      }
  });

  ipcMain.handle('git:showBinary', async (_, { repoPath, ref, filePath }) => {
      // Returns base64 string
      return new Promise((resolve, reject) => {
          // git show ref:path
          const child = spawn('git', ['show', `${ref}:${filePath}`], { cwd: repoPath });
          const chunks = [];
          child.stdout.on('data', c => chunks.push(c));
          child.on('close', (code) => {
              if (code === 0) {
                  const buffer = Buffer.concat(chunks);
                  resolve(buffer.toString('base64'));
              } else {
                  resolve(null);
              }
          });
      });
  });

  ipcMain.handle('git:diffDetails', async (_, { repoPath, filePath, staged }) => {
      const patchCmd = staged ? `git diff --staged -- "${filePath}"` : `git diff -- "${filePath}"`;
      const patch = await runGit(patchCmd, repoPath).catch(() => '');
      
      let original = '';
      let modified = '';

      if (staged) {
          // Staged: HEAD vs Index
          try {
              original = await runGit(`git show HEAD:"${filePath}"`, repoPath);
          } catch (e) {}
          try {
              // Quote the entire refspec for index lookup
              modified = await runGit(`git show ":${filePath}"`, repoPath);
          } catch (e) {}
      } else {
          // Unstaged: Index vs Workdir
          try {
              original = await runGit(`git show ":${filePath}"`, repoPath);
          } catch (e) {
              // If not in index (untracked), original is empty
          }
          try {
              const normalizedPath = path.normalize(path.join(repoPath, filePath));
              if (fs.existsSync(normalizedPath)) {
                  modified = fs.readFileSync(normalizedPath, 'utf8');
              }
          } catch (e) {}
      }

      return { patch, original, modified };
  });

  ipcMain.handle('git:apply', async (_, { repoPath, patch, reverse = false, cached = false }) => {
      // git apply [--reverse] [--cached] -
      const args = ['apply', '--ignore-space-change', '--ignore-whitespace'];
      if (reverse) args.push('--reverse');
      if (cached) args.push('--cached');
      args.push('-'); // Read from stdin

      return new Promise((resolve, reject) => {
          const child = spawn('git', args, { cwd: repoPath });
          
          let stderr = '';
          child.stderr.on('data', d => stderr += d.toString());
          
          child.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error(`git apply failed: ${stderr}`));
          });
          
          child.stdin.write(patch);
          child.stdin.end();
      });
  });

  ipcMain.handle('git:ls-files', async (_, repoPath) => {
      // List all tracked files + untracked files
      // git ls-files -co --exclude-standard
      return runGit('git ls-files -co --exclude-standard', repoPath);
  });

  // Simple terminal shell spawn
  ipcMain.on('terminal:spawn', (event, { repoPath, cols, rows }) => {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const pty = spawn(shell, [], { 
          cwd: repoPath,
          env: process.env,
          cols,
          rows
      });

      pty.stdout.on('data', (data) => {
          event.reply('terminal:data', data.toString());
      });

      pty.stderr.on('data', (data) => {
          event.reply('terminal:data', data.toString());
      });

      ipcMain.on('terminal:input', (_, data) => {
          try {
            pty.stdin.write(data);
          } catch(e) {}
      });
      
      ipcMain.on('terminal:resize', (_, { cols, rows }) => {
          // simple spawn doesn't support resize strictly like pty, but that's fine for basic use
      });

      pty.on('exit', () => {
          event.reply('terminal:exit');
      });
  });

  ipcMain.handle('github:fetchStatus', async (_, { owner, repo, sha, token }) => {
      // https://api.github.com/repos/OWNER/REPO/commits/REF/status
      if (!token) return null;
      try {
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}/status`, {
              headers: {
                  'Authorization': `token ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'GitForge'
              }
          });
          if (!response.ok) return null;
          const data = await response.json();
          // data.state can be 'pending', 'success', 'error', 'failure'
          return data.state;
      } catch (e) {
          return null;
      }
  });

  ipcMain.handle('git:getTags', async (_, repoPath) => {
      return runGit('git tag --sort=-creatordate --format="%(refname:short)|%(subject)"', repoPath);
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

  ipcMain.handle('git:blamePorcelain', async (_, { repoPath, filePath }) => {
      return runGit(`git blame --line-porcelain "${filePath}"`, repoPath);
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
      // Discard ALL changes (staged, unstaged) and clean untracked files
      // git reset --hard HEAD ensures working tree and index match HEAD
      await runGit('git reset --hard HEAD', repoPath);
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

  ipcMain.handle('git:stage', async (_, { repoPath, filePath }) => {
      return runGit(`git add "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:unstage', async (_, { repoPath, filePath }) => {
      // git reset HEAD -- file (unstages)
      return runGit(`git reset HEAD -- "${filePath}"`, repoPath);
  });

  ipcMain.handle('git:discardPath', async (_, { repoPath, filePath }) => {
      // Try to checkout HEAD (discards staged and unstaged changes for tracked files)
      try {
          await runGit(`git checkout HEAD -- "${filePath}"`, repoPath);
      } catch (e) {
          // Ignore error (e.g. if file is untracked)
      }
      // Try to clean (removes untracked files)
      try {
          await runGit(`git clean -f "${filePath}"`, repoPath);
      } catch (e) {
          // Ignore error
      }
  });

  ipcMain.handle('git:discardUnstaged', async (_, { repoPath, filePath }) => {
      // Revert workdir to Index (keeps staged changes)
      try {
          await runGit(`git checkout -- "${filePath}"`, repoPath);
      } catch (e) {}
      // Remove untracked
      try {
          await runGit(`git clean -f "${filePath}"`, repoPath);
      } catch (e) {}
  });

  ipcMain.handle('git:status', async (_, repoPath) => {
      // Porcelain v1 for easy parsing
      // XY PATH
      return runGit('git status --porcelain=v1', repoPath, { trim: false });
  });

  ipcMain.handle('git:branches', async (_, repoPath) => {
      // SHA|RefName|HEAD(*)
      return runGit('git for-each-ref --sort=-committerdate --format="%(objectname)|%(refname)|%(HEAD)" refs/heads refs/remotes', repoPath);
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
