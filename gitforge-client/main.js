const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let sidecarProcess = null;

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
