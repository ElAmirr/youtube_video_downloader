import { useAppStore } from '../store';
import { Clock, FolderOpen, Trash2, Play } from 'lucide-react';

const HistoryPage = () => {
  const history = useAppStore((state) => state.history);
  const removeHistory = useAppStore((state) => state.removeHistory);
  const clearHistory = useAppStore((state) => state.clearHistory);

  const handleOpenFolder = (filePath?: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && filePath) {
      electronAPI.openFolder(filePath);
    }
  };

  const handleOpenFile = (filePath?: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && filePath) {
      electronAPI.openFile(filePath);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (history.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-slate-500 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 text-slate-600 shadow-xl">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-300">No download history</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Successfully finished downloads will be saved here so you can open them anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Download History</h1>
          <p className="text-slate-400 text-sm mt-1">Review and manage your past video downloads.</p>
        </div>
        <button
          onClick={() => clearHistory()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={14} /> Clear History
        </button>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center shadow-xl backdrop-blur-md transition-all"
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full md:w-36 aspect-video object-cover rounded-xl border border-slate-800 bg-slate-950"
              />
            ) : (
              <div className="w-full md:w-36 aspect-video rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-700">
                <Play size={24} />
              </div>
            )}

            <div className="flex-1 min-w-0 w-full space-y-1">
              <h3 className="font-bold text-slate-100 truncate text-base" title={item.title}>
                {item.title}
              </h3>
              <p className="text-xs font-mono text-slate-500 truncate" title={item.filePath}>
                {item.filePath}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                <span>Downloaded {formatDate(item.date)}</span>
                {item.format && (
                  <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                    {item.format}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => handleOpenFile(item.filePath)}
                className="p-2.5 text-slate-300 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
                title="Play File"
              >
                <Play size={18} />
              </button>
              <button
                onClick={() => handleOpenFolder(item.filePath)}
                className="p-2.5 text-slate-300 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
                title="Open Containing Folder"
              >
                <FolderOpen size={18} />
              </button>
              <button
                onClick={() => removeHistory(item.id)}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl border border-slate-800 hover:border-red-900/50 transition-colors"
                title="Remove Entry"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
