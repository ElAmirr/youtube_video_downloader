import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  analyzeVideo: (url: string) => ipcRenderer.invoke('analyzeVideo', url),

  startDownload: (options: {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    format: string;
    downloadPath?: string;
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
});
