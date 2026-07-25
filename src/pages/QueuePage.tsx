import { useAppStore } from '../store';
import { X, Folder, AlertCircle, CheckCircle2, FolderOpen, Play } from 'lucide-react';

const QueuePage = () => {
  const queue = useAppStore((state) => state.queue);
  const removeFromQueue = useAppStore((state) => state.removeFromQueue);

  const handleCancel = async (id: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.cancelDownload) {
      await electronAPI.cancelDownload(id);
    }
    removeFromQueue(id);
  };

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

  if (queue.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-slate-500 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 text-slate-600 shadow-xl">
          <Folder size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-300">Your queue is empty</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Active and recent downloads will appear here with live speed and progress metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Download Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Manage active downloads and progress.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          {queue.length} {queue.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      <div className="space-y-4">
        {queue.map((task) => {
          const isCompleted = task.status === 'completed';
          const isError = task.status === 'error';

          return (
            <div
              key={task.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-center shadow-xl backdrop-blur-md transition-all"
            >
              <img
                src={task.thumbnail}
                alt={task.title}
                className="w-full md:w-36 aspect-video object-cover rounded-xl border border-slate-800 bg-slate-950"
              />

              <div className="flex-1 min-w-0 w-full space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-slate-100 truncate text-base" title={task.title}>
                    {task.title}
                  </h3>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/50">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  )}
                  {isError && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-950/60 px-2.5 py-1 rounded-full border border-red-800/50">
                      <AlertCircle size={13} /> Error
                    </span>
                  )}
                </div>

                {!isCompleted && !isError && (
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="font-bold text-indigo-400">{Math.round(task.progress)}%</span>
                    <span>{task.size}</span>
                    <span>{task.speed}</span>
                    <span>ETA {task.eta}</span>
                  </div>
                )}

                {isError && (
                  <p className="text-xs text-red-400 font-mono truncate">
                    {task.errorMessage || 'An error occurred during download.'}
                  </p>
                )}

                {/* Progress bar */}
                {!isCompleted && !isError && (
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 rounded-full shadow-lg shadow-indigo-500/50"
                      style={{ width: `${Math.max(2, task.progress)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {isCompleted && task.filePath && (
                  <>
                    <button
                      onClick={() => handleOpenFile(task.filePath)}
                      className="p-2.5 text-slate-300 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
                      title="Play / Open File"
                    >
                      <Play size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenFolder(task.filePath)}
                      className="p-2.5 text-slate-300 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition-colors"
                      title="Show in Folder"
                    >
                      <FolderOpen size={18} />
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleCancel(task.id)}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl border border-slate-800 hover:border-red-900/50 transition-colors"
                  title="Remove from Queue"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QueuePage;
