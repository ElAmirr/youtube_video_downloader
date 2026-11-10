import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getYtDlpVersion: () => ipcRenderer.invoke('getYtDlpVersion'),

  updateYtDlp: () => ipcRenderer.invoke('updateYtDlp'),

  analyzeVideo: (url: string) => ipcRenderer.invoke('analyzeVideo', url),

  startDownload: (options: {
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
  }) => ipcRenderer.invoke('startDownload', options),

  cancelDownload: (id: string) => ipcRenderer.invoke('cancelDownload', id),

  chooseFolder: () => ipcRenderer.invoke('chooseFolder'),

  openFolder: (folderPath: string) => ipcRenderer.invoke('openFolder', folderPath),

  openFile: (filePath: string) => ipcRenderer.invoke('openFile', filePath),

  getSettings: () => ipcRenderer.invoke('getSettings'),

  saveSettings: (settings: any) => ipcRenderer.invoke('saveSettings', settings),

  getHistory: () => ipcRenderer.invoke('getHistory'),

  removeHistory: (id: string) => ipcRenderer.invoke('removeHistory', id),

  clearHistory: () => ipcRenderer.invoke('clearHistory'),

  getQueue: () => ipcRenderer.invoke('getQueue'),

  saveQueue: (queue: any) => ipcRenderer.invoke('saveQueue', queue),

  onDownloadProgress: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('download-progress', callback);
  },

  onDownloadCompleted: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('download-completed', callback);
  },

  onDownloadError: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('download-error', callback);
  },

  offDownloadListeners: () => {
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('download-completed');
    ipcRenderer.removeAllListeners('download-error');
  },

  // License APIs
  getHwid: () => ipcRenderer.invoke('get-hwid'),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  saveLicense: (data: any) => ipcRenderer.invoke('save-license', data),
  deleteLicense: () => ipcRenderer.invoke('delete-license'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  startTrial: () => ipcRenderer.invoke('start-trial'),
  onLicenseRevoked: (callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on('license-revoked', callback);
  },
});

// Also expose as window.electron for 100% compatibility with photo_invoice patterns
contextBridge.exposeInMainWorld('electron', {
  getHwid: () => ipcRenderer.invoke('get-hwid'),
  checkLicense: () => ipcRenderer.invoke('check-license'),
  saveLicense: (data: any) => ipcRenderer.invoke('save-license', data),
  deleteLicense: () => ipcRenderer.invoke('delete-license'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  startTrial: () => ipcRenderer.invoke('start-trial'),
  onLicenseRevoked: (callback: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on('license-revoked', callback);
  },
});
