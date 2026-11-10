import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';

export interface AppSettings {
  downloadFolder: string;
  maxConcurrentDownloads: number;
  darkTheme: boolean;
}

export interface DownloadSection {
  start: string;
  end: string;
  startSeconds?: number;
  endSeconds?: number;
  label?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  filePath: string;
  date: string;
  channel?: string;
  format?: string;
  size?: string;
  section?: DownloadSection;
}

export interface QueueItem {
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
  section?: DownloadSection;
}

interface DataStore {
  settings: AppSettings;
  history: HistoryItem[];
  queue: QueueItem[];
}

const getDefaultSettings = (): AppSettings => ({
  downloadFolder: app.getPath('downloads'),
  maxConcurrentDownloads: 3,
  darkTheme: true,
});

class StoreManager {
  private filePath: string;
  private data: DataStore;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'tubeflow-data.json');
    this.data = {
      settings: getDefaultSettings(),
      history: [],
      queue: [],
    };
  }

  public async init(): Promise<void> {
    try {
      const fileData = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(fileData);
      this.data = {
        settings: { ...getDefaultSettings(), ...(parsed.settings || {}) },
        history: Array.isArray(parsed.history) ? parsed.history : [],
        queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      };
    } catch (err) {
      // File doesn't exist or corrupt, write default data
      await this.save();
    }
  }

  public getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  public async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    this.data.settings = { ...this.data.settings, ...newSettings };
    await this.save();
    return this.data.settings;
  }

  public getHistory(): HistoryItem[] {
    return [...this.data.history];
  }

  public async addHistory(item: HistoryItem): Promise<HistoryItem[]> {
    // Keep top 100 history items, remove duplicate by id if present
    this.data.history = [item, ...this.data.history.filter((h) => h.id !== item.id)].slice(0, 100);
    await this.save();
    return this.data.history;
  }

  public async removeHistory(id: string): Promise<HistoryItem[]> {
    this.data.history = this.data.history.filter((h) => h.id !== id);
    await this.save();
    return this.data.history;
  }

  public async clearHistory(): Promise<HistoryItem[]> {
    this.data.history = [];
    await this.save();
    return [];
  }

  public getQueue(): QueueItem[] {
    return [...this.data.queue];
  }

  public async saveQueue(queue: QueueItem[]): Promise<QueueItem[]> {
    this.data.queue = queue;
    await this.save();
    return this.data.queue;
  }

  private async save(): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save store data:', err);
    }
  }
}

export const store = new StoreManager();
