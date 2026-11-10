import { useState, useEffect } from 'react';
import { Folder, Save, CheckCircle2, Moon, Sliders, RefreshCw, Cpu, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';

const SettingsPage = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [downloadFolder, setDownloadFolder] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(3);
  const [darkTheme, setDarkTheme] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // yt-dlp core status
  const [ytdlpVersion, setYtdlpVersion] = useState<string>('Loading...');
  const [updatingYtdlp, setUpdatingYtdlp] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setDownloadFolder(settings.downloadFolder || '');
      setMaxDownloads(settings.maxConcurrentDownloads || 3);
      setDarkTheme(settings.darkTheme !== false);
    }
  }, [settings]);

  const fetchYtDlpVersion = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getYtDlpVersion) {
      try {
        const res = await electronAPI.getYtDlpVersion();
        setYtdlpVersion(res.version || 'Unknown');
      } catch {
        setYtdlpVersion('Unknown');
      }
    }
  };

  useEffect(() => {
    fetchYtDlpVersion();
  }, []);

  const handleUpdateYtDlp = async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.updateYtDlp) return;

    setUpdatingYtdlp(true);
    setUpdateStatus(null);
    try {
      const res = await electronAPI.updateYtDlp();
      if (res.success) {
        setYtdlpVersion(res.version || 'Updated');
        setUpdateStatus({ type: 'success', message: res.message || 'Core updated successfully!' });
      } else {
        setUpdateStatus({ type: 'error', message: res.message || 'Failed to update core engine.' });
      }
    } catch (err: any) {
      setUpdateStatus({ type: 'error', message: err.message || 'Update failed.' });
    } finally {
      setUpdatingYtdlp(false);
    }
  };

  const handleSelectFolder = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.chooseFolder) {
      const path = await electronAPI.chooseFolder();
      if (path) {
        setDownloadFolder(path);
      }
    }
  };

  const handleSave = async () => {
    await updateSettings({
      downloadFolder,
      maxConcurrentDownloads: maxDownloads,
      darkTheme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Application Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure default download paths and application preferences.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 size={18} /> Settings saved successfully!
        </div>
      )}

      {/* Core Engine section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Cpu size={20} className="text-cyan-400" />
          <span>Downloader Engine (yt-dlp)</span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            <div>
              <div className="font-semibold text-slate-200 text-sm">Installed Version</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Version: <span className="font-mono text-cyan-300 font-semibold">{ytdlpVersion}</span>
              </div>
            </div>
            <button
              onClick={handleUpdateYtDlp}
              disabled={updatingYtdlp}
              className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={15} className={updatingYtdlp ? 'animate-spin' : ''} />
              {updatingYtdlp ? 'Updating Core...' : 'Update yt-dlp Core'}
            </button>
          </div>

          {updateStatus && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                updateStatus.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}
            >
              {updateStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{updateStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Storage section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Folder size={20} className="text-amber-400" />
          <span>Storage & Directory</span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Default Download Folder
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={downloadFolder}
              onChange={(e) => setDownloadFolder(e.target.value)}
              placeholder="System default Downloads directory"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-amber-400 font-mono text-sm"
            />
            <button
              onClick={handleSelectFolder}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 border border-slate-700/80 shrink-0 cursor-pointer"
            >
              <Folder size={18} /> Browse
            </button>
          </div>
        </div>
      </div>

      {/* Performance section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Sliders size={20} className="text-amber-400" />
          <span>Download Performance</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-slate-200 text-sm">Concurrent Downloads</div>
              <div className="text-xs text-slate-500">Maximum number of downloads processing simultaneously</div>
            </div>
            <select
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 outline-none focus:border-amber-400 font-medium text-sm cursor-pointer"
            >
              <option value={1}>1 download</option>
              <option value={2}>2 downloads</option>
              <option value={3}>3 downloads</option>
              <option value={5}>5 downloads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interface section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Moon size={20} className="text-amber-400" />
          <span>Interface & Appearance</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-slate-200 text-sm">Dark Theme</div>
            <div className="text-xs text-slate-500">vidos optimized high-contrast dark palette</div>
          </div>
          <button
            onClick={() => {
              const newVal = !darkTheme;
              setDarkTheme(newVal);
              updateSettings({ darkTheme: newVal });
            }}
            className={`w-12 h-6 rounded-full relative transition-colors duration-200 p-0.5 cursor-pointer ${
              darkTheme ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 bg-slate-950 rounded-full transition-transform duration-200 ${
                darkTheme ? 'transform translate-x-6' : 'transform translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
