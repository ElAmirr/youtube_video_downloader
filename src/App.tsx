import { useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, List, Clock, Settings } from 'lucide-react';
import HomePage from './pages/HomePage';
import QueuePage from './pages/QueuePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { useAppStore } from './store';

const Sidebar = () => {
  const location = useLocation();
  const queue = useAppStore((state) => state.queue);
  const activeCount = queue.filter((q) => q.status === 'downloading').length;

  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    {
      path: '/queue',
      icon: <List size={20} />,
      label: 'Queue',
      badge: activeCount > 0 ? activeCount : null,
    },
    { path: '/history', icon: <Clock size={20} />, label: 'History' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl h-full flex flex-col pt-10 border-r border-slate-800/60 select-none z-20">
      <div className="px-6 mb-8 flex items-center gap-3 text-xl font-bold text-white tracking-tight">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/icon.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
        </div>
        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          TubeFlow
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${active
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Title bar drag area for Electron */}
      <div
        className="h-9 w-full absolute top-0 left-0 z-50 pointer-events-auto"
        style={{ WebkitAppRegion: 'drag' } as any}
      />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-10 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950">
        <div className="p-8 max-w-6xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
};

const App = () => {
  const loadInitialData = useAppStore((state) => state.loadInitialData);
  const updateProgress = useAppStore((state) => state.updateProgress);
  const markCompleted = useAppStore((state) => state.markCompleted);
  const markError = useAppStore((state) => state.markError);

  useEffect(() => {
    loadInitialData();

    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      electronAPI.onDownloadProgress((_event: any, data: any) => {
        updateProgress(data.id, {
          progress: data.progress,
          size: data.size,
          speed: data.speed,
          eta: data.eta,
        });
      });

      electronAPI.onDownloadCompleted((_event: any, data: any) => {
        markCompleted(data.id, data.filePath, data.historyItem);
      });

      electronAPI.onDownloadError((_event: any, data: any) => {
        markError(data.id, data.error);
      });

      return () => {
        electronAPI.offDownloadListeners?.();
      };
    }
  }, [loadInitialData, updateProgress, markCompleted, markError]);

  const darkTheme = useAppStore((state) => state.settings?.darkTheme);
  useEffect(() => {
    if (darkTheme === false) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [darkTheme]);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
