import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Download as DownloadIcon, Clipboard, CheckCircle2, Film, Music, Eye, Calendar } from 'lucide-react';
import { useAppStore } from '../store';

const HomePage = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [error, setError] = useState('');
  const [downloadStarted, setDownloadStarted] = useState(false);

  const addToQueue = useAppStore((state) => state.addToQueue);
  const settings = useAppStore((state) => state.settings);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch (e) {
      console.warn('Clipboard access denied or unavailable');
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setDownloadStarted(false);

    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) {
        throw new Error('Electron API unavailable. Please launch TubeFlow in desktop app.');
      }
      const data = await electronAPI.analyzeVideo(url.trim());
      if (data.error) {
        throw new Error(data.error);
      }
      setVideoInfo(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0].formatId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze video URL');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async (formatIdToUse?: string) => {
    if (!videoInfo) return;
    const electronAPI = (window as any).electronAPI;
    const id = Date.now().toString();
    const format = formatIdToUse || selectedFormat || 'best';

    addToQueue({
      id,
      url: videoInfo.webpage_url,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      progress: 0,
      speed: '0 B/s',
      eta: 'Starting...',
      size: 'Analyzing...',
      status: 'downloading',
      format,
    });

    setDownloadStarted(true);

    try {
      await electronAPI.startDownload({
        id,
        url: videoInfo.webpage_url,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        format,
        downloadPath: settings.downloadFolder,
      });

      setTimeout(() => {
        navigate('/queue');
      }, 1200);
    } catch (err: any) {
      console.error('Download dispatch error:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-col items-center justify-center pt-6 pb-8 text-center max-w-3xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Download YouTube <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Videos</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl whitespace-nowrap hidden sm:block">
          Paste any YouTube video URL and download it in the highest available quality for free.
        </p>
        <p className="text-slate-400 text-sm md:text-base max-w-xl sm:hidden">
          Paste any YouTube video URL and download it in the highest available quality for free.
        </p>

        {/* Input bar */}
        <div className="w-full mt-8 relative">
          <div className="flex shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 focus-within:border-indigo-500 bg-slate-900/90 transition-all duration-300 backdrop-blur-lg">
            <div className="flex-1 flex items-center px-5 py-4 gap-3">
              <Search className="text-slate-500" size={22} />
              <input
                type="text"
                placeholder="Paste video URL here"
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none text-base font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              {url ? (
                <button
                  onClick={() => setUrl('')}
                  className="text-xs text-slate-500 hover:text-slate-300 font-semibold px-2 py-1 rounded"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  title="Paste from Clipboard"
                >
                  <Clipboard size={14} /> Paste
                </button>
              )}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center min-w-[140px] shadow-lg shadow-indigo-600/30"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm font-medium w-full text-left flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* Video Details Card */}
      {videoInfo && (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row gap-8 animate-slide-up">
          <div className="w-full md:w-2/5 aspect-video rounded-2xl overflow-hidden relative group bg-slate-950 shadow-inner border border-slate-800">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            {videoInfo.duration > 0 && (
              <div className="absolute bottom-3 right-3 bg-slate-950/90 text-slate-200 text-xs px-2.5 py-1 rounded-lg font-mono border border-slate-800 shadow">
                {formatDuration(videoInfo.duration)}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-100 leading-snug line-clamp-2">
                {videoInfo.title}
              </h2>
              <div className="flex flex-wrap items-center text-slate-400 text-xs gap-4">
                <span className="font-semibold text-slate-300">{videoInfo.uploader}</span>
                {videoInfo.upload_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {videoInfo.upload_date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')}
                  </span>
                )}
                {videoInfo.view_count && (
                  <span className="flex items-center gap-1">
                    <Eye size={13} />
                    {Number(videoInfo.view_count).toLocaleString()} views
                  </span>
                )}
              </div>
            </div>

            {/* Format Selection Grid */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Format / Quality
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videoInfo.formats?.map((fmt: any) => {
                  const isSelected = selectedFormat === fmt.formatId;
                  return (
                    <button
                      key={fmt.formatId}
                      onClick={() => setSelectedFormat(fmt.formatId)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-md shadow-indigo-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {fmt.isAudioOnly ? (
                          <Music size={16} className="text-pink-400" />
                        ) : (
                          <Film size={16} className="text-indigo-400" />
                        )}
                        <span className="text-sm font-semibold">{fmt.label}</span>
                      </div>
                      <span className="text-xs font-mono uppercase bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                        {fmt.ext}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => handleStartDownload()}
                  disabled={downloadStarted}
                  className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-75"
                >
                  {downloadStarted ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      Added to Queue (Redirecting...)
                    </>
                  ) : (
                    <>
                      <DownloadIcon size={18} />
                      Download Selected Format
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
