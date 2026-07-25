import { create } from 'zustand';

export interface DownloadTask {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  progress: number;
  speed: string;
  eta: string;
  size: string;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  format?: string;
  filePath?: string;
  errorMessage?: string;
}

export interface HistoryTask {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  filePath: string;
  date: string;
  channel?: string;
  format?: string;
  size?: string;
}

export interface AppSettings {
  downloadFolder: string;
  maxConcurrentDownloads: number;
  darkTheme: boolean;
}

interface AppState {
  settings: AppSettings;
  queue: DownloadTask[];
  history: HistoryTask[];
  
  // Actions
  loadInitialData: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  addToQueue: (task: DownloadTask) => void;
  updateProgress: (id: string, data: Partial<DownloadTask>) => void;
  markCompleted: (id: string, filePath: string, historyItem?: HistoryTask) => void;
  markError: (id: string, errorMessage: string) => void;
  removeFromQueue: (id: string) => void;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: {
    downloadFolder: '',
    maxConcurrentDownloads: 3,
    darkTheme: true,
  },
  queue: [],
  history: [],

  loadInitialData: async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        const [settings, history] = await Promise.all([
          electronAPI.getSettings?.(),
          electronAPI.getHistory?.(),
        ]);

        if (settings) {
          set({ settings });
        }
        if (history) {
          set({ history });
        }
      } catch (err) {
        console.warn('Failed to load initial data from IPC:', err);
      }
    }
  },

  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveSettings) {
      await electronAPI.saveSettings(updated);
    }
  },

  addToQueue: (task) => {
    set((state) => ({ queue: [task, ...state.queue] }));
  },

  updateProgress: (id, data) => {
    set((state) => ({
      queue: state.queue.map((task) => (task.id === id ? { ...task, ...data } : task)),
    }));
  },

  markCompleted: (id, filePath, historyItem) => {
    set((state) => {
      const updatedQueue = state.queue.map((task) =>
        task.id === id
          ? { ...task, progress: 100, status: 'completed' as const, filePath, speed: 'Done', eta: '00:00' }
          : task
      );

      const existingInHistory = state.history.some((h) => h.id === id);
      let updatedHistory = state.history;
      if (historyItem && !existingInHistory) {
        updatedHistory = [historyItem, ...state.history];
      }

      return { queue: updatedQueue, history: updatedHistory };
    });
  },

  markError: (id, errorMessage) => {
    set((state) => ({
      queue: state.queue.map((task) =>
        task.id === id ? { ...task, status: 'error', errorMessage } : task
      ),
    }));
  },

  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter((task) => task.id !== id),
    }));
  },

  removeHistory: async (id) => {
    set((state) => ({
      history: state.history.filter((h) => h.id !== id),
    }));
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.removeHistory) {
      await electronAPI.removeHistory(id);
    }
  },

  clearHistory: async () => {
    set({ history: [] });
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.clearHistory) {
      await electronAPI.clearHistory();
    }
  },
}));
