import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { store } from './store.js';
import { setupLicenseHandlers } from './license.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const activeDownloads = new Map<string, any>();

async function createWindow() {
  // preload.cjs forces CommonJS loading even with "type":"module" in package.json
  const preloadCjs = path.join(__dirname, 'preload.cjs');
  const preloadMjs = path.join(__dirname, 'preload.mjs');
  const preloadJs  = path.join(__dirname, 'preload.js');
  const preloadPath = fs.existsSync(preloadCjs) ? preloadCjs
                    : fs.existsSync(preloadJs) ? preloadJs
                    : preloadMjs;

  const iconPath = app.isPackaged 
    ? path.join(__dirname, '../dist/icon.png')
    : path.join(__dirname, '../public/icon.png');

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 950,
    minHeight: 640,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: iconPath,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0e0e10',
      symbolColor: '#cbd5e1',
      height: 36,
    },
    backgroundColor: '#0e0e10',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load window:', errorCode, errorDescription);
  });
}

app.whenReady().then(async () => {
  // Initialize store
  await store.init();

  // Setup license validation & background heartbeat
  setupLicenseHandlers(() => mainWindow);

  // Ensure yt-dlp binary in background
  try {
    const { ensureYtDlp } = await import('./ytdlp.js');
    ensureYtDlp().catch((err) => console.warn('yt-dlp setup warning:', err));
  } catch (err) {
    console.warn('Failed to load ytdlp module:', err);
  }

  // IPC handlers: yt-dlp Version and Updates
  ipcMain.handle('getYtDlpVersion', async () => {
    try {
      const { getYtDlpVersion } = await import('./ytdlp.js');
      const version = await getYtDlpVersion();
      return { version };
    } catch (err: any) {
      return { version: 'Unknown', error: err.message };
    }
  });

  ipcMain.handle('updateYtDlp', async () => {
    try {
      const { updateYtDlp } = await import('./ytdlp.js');
      return await updateYtDlp();
    } catch (err: any) {
      return { success: false, message: err.message || 'Update failed' };
    }
  });

  // IPC handlers: Analyze Video
  ipcMain.handle('analyzeVideo', async (_event, url: string) => {
    try {
      const { analyzeVideo } = await import('./ytdlp.js');
      return await analyzeVideo(url);
    } catch (err: any) {
      return { error: err.message || 'Analysis failed' };
    }
  });

  // IPC handlers: Start Download
  ipcMain.handle(
    'startDownload',
    async (
      _event,
      payload: {
        id: string;
        url: string;
        title: string;
        thumbnail: string;
        format: string;
        downloadPath?: string;
        section?: {
          start: string;
          end: string;
          startSeconds?: number;
          endSeconds?: number;
          label?: string;
        };
      }
    ) => {
      const { id, url, title, thumbnail, format, section } = payload;
      const settings = store.getSettings();
      const downloadFolder = payload.downloadPath || settings.downloadFolder || app.getPath('downloads');

      try {
        const { startDownload } = await import('./ytdlp.js');

        const proc = startDownload(
          url,
          downloadFolder,
          format,
          // On progress
          (progressData) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('download-progress', { id, ...progressData });
            }
          },
          // On complete
          async (filePath) => {
            activeDownloads.delete(id);
            const historyItem = {
              id,
              title: title || 'Downloaded Video',
              thumbnail: thumbnail || '',
              url,
              filePath,
              date: new Date().toISOString(),
              format,
              section,
            };
            await store.addHistory(historyItem);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('download-completed', { id, filePath, historyItem });
            }
          },
          // On error
          (errorMsg) => {
            activeDownloads.delete(id);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('download-error', { id, error: errorMsg });
            }
          },
          section
        );

        activeDownloads.set(id, proc);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  );

  // IPC handlers: Cancel Download
  ipcMain.handle('cancelDownload', async (_event, id: string) => {
    const proc = activeDownloads.get(id);
    if (proc) {
      try {
        proc.kill();
      } catch (e) {}
      activeDownloads.delete(id);
      return true;
    }
    return false;
  });

  // IPC handlers: Folder & File Dialogs
  ipcMain.handle('chooseFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Directory',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('openFolder', async (_event, folderPath: string) => {
    if (folderPath) {
      shell.openPath(folderPath);
    }
  });

  ipcMain.handle('openFile', async (_event, filePath: string) => {
    if (filePath) {
      shell.openPath(filePath);
    }
  });

  // IPC handlers: Settings & History Persistence
  ipcMain.handle('getSettings', async () => {
    return store.getSettings();
  });

  ipcMain.handle('saveSettings', async (_event, newSettings) => {
    return await store.updateSettings(newSettings);
  });

  ipcMain.handle('getHistory', async () => {
    return store.getHistory();
  });

  ipcMain.handle('removeHistory', async (_event, id: string) => {
    return await store.removeHistory(id);
  });

  ipcMain.handle('clearHistory', async () => {
    return await store.clearHistory();
  });

  ipcMain.handle('getQueue', async () => {
    return store.getQueue();
  });

  ipcMain.handle('saveQueue', async (_event, queue) => {
    return await store.saveQueue(queue);
  });

  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
