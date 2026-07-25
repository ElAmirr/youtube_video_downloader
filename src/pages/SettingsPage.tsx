import { useState, useEffect } from 'react';
import { Folder, Save, CheckCircle2, Moon, Sliders } from 'lucide-react';
import { useAppStore } from '../store';

const SettingsPage = () => {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [downloadFolder, setDownloadFolder] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(3);
  const [darkTheme, setDarkTheme] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setDownloadFolder(settings.downloadFolder || '');
      setMaxDownloads(settings.maxConcurrentDownloads || 3);
      setDarkTheme(settings.darkTheme !== false);
    }
  }, [settings]);

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

      {/* Storage section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Folder size={20} className="text-indigo-400" />
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
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-indigo-500 font-mono text-sm"
            />
            <button
              onClick={handleSelectFolder}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 border border-slate-700/80 shrink-0"
            >
              <Folder size={18} /> Browse
            </button>
          </div>
        </div>
      </div>

      {/* Performance section */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-100 pb-3 border-b border-slate-800">
          <Sliders size={20} className="text-purple-400" />
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
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 outline-none focus:border-indigo-500 font-medium text-sm"
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
          <Moon size={20} className="text-pink-400" />
          <span>Interface & Appearance</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-semibold text-slate-200 text-sm">Dark Cyber Theme</div>
            <div className="text-xs text-slate-500">Optimized high-contrast dark palette</div>
          </div>
          <button
            onClick={() => {
              const newVal = !darkTheme;
              setDarkTheme(newVal);
              updateSettings({ darkTheme: newVal });
            }}
            className={`w-12 h-6 rounded-full relative transition-colors duration-200 p-0.5 ${
              darkTheme ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
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
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
