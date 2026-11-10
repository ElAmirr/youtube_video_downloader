import { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import LicenseModal from './components/LicenseModal';
import {
  Globe,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import logoImg from './assets/logo.png';
import HomePage from './pages/HomePage';
import QueuePage from './pages/QueuePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import { useAppStore } from './store';
import { translations, type Language } from './utils/i18n';

const Navbar = () => {
  const location = useLocation();
  const queue = useAppStore((state) => state.queue);
  const activeCount = queue.filter((q) => q.status === 'downloading').length;
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = translations[language] || translations.en;

  const [downloadersOpen, setDownloadersOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDownloadersOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <header
      dir="ltr"
      className="sticky top-0 z-40 w-full bg-[#0e0e10] transition-colors select-none"
      style={{ paddingRight: '150px' }}
    >
      {/* Electron drag bar */}
      <div
        className="h-4 w-full absolute top-0 left-0 pointer-events-auto"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <img src={logoImg} alt="vidos logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-sans lowercase">
            vidos
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
          {/* Downloaders Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDownloadersOpen(!downloadersOpen)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer py-2 ${
                downloadersOpen || location.pathname === '/'
                  ? 'text-amber-400 font-semibold'
                  : 'hover:text-white text-slate-300'
              }`}
            >
              <span>{t.downloaders}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${downloadersOpen ? 'rotate-180 text-amber-400' : 'text-slate-500'}`}
              />
            </button>

            {/* Dropdown Menu Card */}
            {downloadersOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#1A1A1F] border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl z-50 animate-slide-up">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div>
                    <h4 className="text-base font-bold text-white leading-tight">{t.downloaders}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">High-speed video & audio extraction</p>
                  </div>
                  <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border border-amber-500/40 text-amber-400 bg-amber-400/10">
                    FAST
                  </span>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/"
                    onClick={() => setDownloadersOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
                  >
                    <span className="text-slate-500 group-hover:text-amber-400 text-lg leading-none mt-0.5">•</span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 group-hover:text-white leading-tight">
                        {t.youtubeDownloader}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {t.youtubeDownloaderDesc}
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setDownloadersOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
                  >
                    <span className="text-slate-500 group-hover:text-amber-400 text-lg leading-none mt-0.5">•</span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 group-hover:text-white leading-tight">
                        {t.podcastClipper}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {t.podcastClipperDesc}
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setDownloadersOpen(false)}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
                  >
                    <span className="text-slate-500 group-hover:text-amber-400 text-lg leading-none mt-0.5">•</span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 group-hover:text-white leading-tight">
                        {t.audioExtractor}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {t.audioExtractorDesc}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Queue Link */}
          <Link
            to="/queue"
            className={`flex items-center gap-2 transition-colors py-2 ${
              location.pathname === '/queue' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            <span>{t.queue}</span>
            {activeCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {activeCount}
              </span>
            )}
          </Link>

          {/* History Link */}
          <Link
            to="/history"
            className={`transition-colors py-2 ${
              location.pathname === '/history' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            {t.history}
          </Link>

          {/* Analytics */}
          <div className="hover:text-white transition-colors cursor-pointer py-2">
            {t.analytics}
          </div>

          {/* Pricing Link */}
          <Link
            to="/pricing"
            className={`transition-colors py-2 ${
              location.pathname === '/pricing' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            {t.pricing}
          </Link>

          {/* Settings Link */}
          <Link
            to="/settings"
            className={`transition-colors py-2 ${
              location.pathname === '/settings' ? 'text-amber-400 font-semibold' : 'hover:text-white text-slate-300'
            }`}
          >
            {t.settings}
          </Link>
        </nav>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-800 bg-[#15151a] text-xs text-slate-200 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <Globe size={13} className="text-amber-400" />
              <span>{currentLangObj.label}</span>
              <ChevronDown size={12} className={`text-slate-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-2 w-36 bg-[#1A1A1F] border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-slide-up">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      language === l.code ? 'bg-amber-400/15 text-amber-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </span>
                    {language === l.code && <Check size={13} className="text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sign in button */}
          <button className="hidden sm:inline-flex items-center text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer whitespace-nowrap">
            {t.signIn}
          </button>

          {/* Yellow CTA Button */}
          <Link
            to="/pricing"
            className="bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center gap-1.5 active:scale-95 shrink-0 whitespace-nowrap"
          >
            <Sparkles size={13} />
            <span>{t.getStarted}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const language = useAppStore((state) => state.language);
  const isRtl = language === 'ar';

  return (
    <div
      className="min-h-screen bg-[#0e0e10] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950"
    >
      <Navbar />
      <main
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex-1 w-full flex flex-col bg-[#0e0e10] overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
};

const LICENSE_SERVER = 'https://photo-invoice-licence-sever.onrender.com';
const APP_IDENTIFIER = 'youtube_video_downloader';

const App = () => {
  const loadInitialData = useAppStore((state) => state.loadInitialData);
  const updateProgress = useAppStore((state) => state.updateProgress);
  const markCompleted = useAppStore((state) => state.markCompleted);
  const markError = useAppStore((state) => state.markError);
  const setIsPro = useAppStore((state) => state.setIsPro);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [licenseChecking, setLicenseChecking] = useState(true);

  // Initial License Check & Background Heartbeat
  useEffect(() => {
    const checkAuth = async () => {
      const electron = (window as any).electron || (window as any).electronAPI;
      if (!electron || !electron.checkLicense) {
        // Outside Electron browser dev environment
        setIsAuthenticated(true);
        setLicenseChecking(false);
        return;
      }

      try {
        const status = await electron.checkLicense();
        if (status && status.activated) {
          setIsAuthenticated(true);
          setIsPro(true);
          setLicenseChecking(false);

          // Background re-validation with license server
          try {
            const hwid = await electron.getHwid();
            const appInfo = electron.getAppInfo ? await electron.getAppInfo() : { version: '1.0.0', os: 'win32' };

            const response = await axios.post(
              `${LICENSE_SERVER}/api/activate`,
              {
                key: status.key,
                hwid: hwid,
                app: APP_IDENTIFIER,
                version: appInfo.version,
                os: appInfo.os,
              },
              { timeout: 12000 }
            );

            if (!response.data.success) {
              console.warn('License revoked by server:', response.data.message);
              await electron.deleteLicense();
              setIsAuthenticated(false);
              setIsPro(false);
            } else {
              const expiryDate = response.data.expiresAt || response.data.expires_at || status.expiresAt || null;
              await electron.saveLicense({
                ...status,
                expiresAt: expiryDate,
                lastChecked: new Date().toISOString(),
              });
            }
          } catch (err: any) {
            if (err.response && (err.response.status === 404 || err.response.status === 403)) {
              console.warn('License explicitly revoked by server:', err.response.status);
              await electron.deleteLicense();
              setIsAuthenticated(false);
              setIsPro(false);
            } else {
              console.log('Background license verification skipped (offline / server waking up)');
            }
          }
        } else {
          setIsAuthenticated(false);
          setIsPro(false);
        }
      } catch (err) {
        console.error('Error in checkLicense:', err);
        setIsAuthenticated(false);
      } finally {
        setLicenseChecking(false);
      }
    };

    checkAuth();

    // Listen for background revocation
    const electron = (window as any).electron || (window as any).electronAPI;
    if (electron?.onLicenseRevoked) {
      electron.onLicenseRevoked(() => {
        console.warn('License revoked in background. Resetting auth state.');
        setIsAuthenticated(false);
        setIsPro(false);
      });
    }
  }, [setIsPro]);

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
    }

    return () => {
      const api = (window as any).electronAPI;
      if (api?.offDownloadListeners) {
        api.offDownloadListeners();
      }
    };
  }, [loadInitialData, updateProgress, markCompleted, markError]);

  if (licenseChecking) {
    return (
      <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center text-slate-400">
        <div className="animate-pulse text-xs font-mono">Verifying license...</div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated && (
        <LicenseModal
          onAuthenticated={() => {
            setIsAuthenticated(true);
            setIsPro(true);
          }}
        />
      )}
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/queue" element={<div className="p-8 max-w-5xl mx-auto w-full"><QueuePage /></div>} />
            <Route path="/history" element={<div className="p-8 max-w-5xl mx-auto w-full"><HistoryPage /></div>} />
            <Route path="/settings" element={<div className="p-8 max-w-5xl mx-auto w-full"><SettingsPage /></div>} />
          </Routes>
        </Layout>
      </HashRouter>
    </>
  );
};

export default App;
