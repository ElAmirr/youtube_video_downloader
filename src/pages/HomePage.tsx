import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Link2,
  Loader2,
  Download as DownloadIcon,
  CheckCircle2,
  RefreshCw,
  Scissors,
  Sparkles,
  Lock,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAppStore } from '../store';
import { translations } from '../utils/i18n';
import {
  formatSecondsToTime,
  secondsToYtDlpTime,
  formatDurationHuman,
  parseTimeStringToSeconds,
  extractTimestampFromUrl,
  type DownloadSection,
} from '../utils/time';

const HomePage = () => {
  const navigate = useNavigate();
  const language = useAppStore((state) => state.language);
  const isPro = useAppStore((state) => state.isPro);
  const t = translations[language] || translations.en;

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [error, setError] = useState('');
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [updatingCore, setUpdatingCore] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Pro Upgrade Modal state
  const [showProModal, setShowProModal] = useState(false);

  // Moment / Clip Selection State
  const [enableClip, setEnableClip] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');

  const addToQueue = useAppStore((state) => state.addToQueue);
  const settings = useAppStore((state) => state.settings);

  const parsedStart = parseTimeStringToSeconds(startTime);
  const parsedEnd = parseTimeStringToSeconds(endTime);

  const isClipValid =
    parsedStart !== null &&
    parsedEnd !== null &&
    parsedStart >= 0 &&
    parsedEnd > parsedStart &&
    (!videoInfo?.duration || parsedEnd <= videoInfo.duration);

  const clipDuration =
    isClipValid && parsedStart !== null && parsedEnd !== null
      ? parsedEnd - parsedStart
      : 0;

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setDownloadStarted(false);

    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) {
        throw new Error('Please launch vidos in desktop mode to download videos.');
      }
      const data = await electronAPI.analyzeVideo(url.trim());
      if (data.error) {
        throw new Error(data.error);
      }
      setVideoInfo(data);
      if (data.formats && data.formats.length > 0) {
        setSelectedFormat(data.formats[0].formatId);
      }

      // Detect timestamp in URL (e.g. ?t=1240 or &t=15m30s)
      const urlTimestamp = extractTimestampFromUrl(url.trim());
      if (urlTimestamp && data.duration && urlTimestamp < data.duration) {
        if (isPro) {
          setEnableClip(true);
        }
        setStartTime(formatSecondsToTime(urlTimestamp));
        const defaultEnd = Math.min(data.duration, urlTimestamp + 300);
        setEndTime(formatSecondsToTime(defaultEnd));
      } else {
        setEnableClip(false);
        setStartTime('00:00:00');
        setEndTime(formatSecondsToTime(data.duration || 0));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze video URL');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePodcastMode = () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    setEnableClip(!enableClip);
  };

  const handleUpdateCore = async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.updateYtDlp) return;

    setUpdatingCore(true);
    setUpdateMsg(null);
    try {
      const res = await electronAPI.updateYtDlp();
      if (res.success) {
        setUpdateMsg(`Core updated to ${res.version || 'latest'}. Try analyzing again.`);
        setError('');
      } else {
        setUpdateMsg(res.message || 'Update failed');
      }
    } catch (err: any) {
      setUpdateMsg(err.message || 'Update failed');
    } finally {
      setUpdatingCore(false);
    }
  };

  const handleStartDownload = async (formatIdToUse?: string) => {
    if (!videoInfo) return;
    const electronAPI = (window as any).electronAPI;
    const id = Date.now().toString();
    const format = formatIdToUse || selectedFormat || 'best';

    let sectionData: DownloadSection | undefined = undefined;
    if (enableClip && isPro) {
      if (!isClipValid || parsedStart === null || parsedEnd === null) {
        setError('Please check your clip timestamps. End moment must be after start moment.');
        return;
      }
      sectionData = {
        start: secondsToYtDlpTime(parsedStart),
        end: secondsToYtDlpTime(parsedEnd),
        startSeconds: parsedStart,
        endSeconds: parsedEnd,
        label: `${formatSecondsToTime(parsedStart)} – ${formatSecondsToTime(parsedEnd)}`,
      };
    }

    addToQueue({
      id,
      url: videoInfo.webpage_url,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      progress: 0,
      speed: '0 B/s',
      eta: 'Starting...',
      size: enableClip ? 'Downloading clip...' : 'Analyzing...',
      status: 'downloading',
      format,
      section: sectionData,
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
        section: sectionData,
      });

      setTimeout(() => {
        navigate('/queue');
      }, 1000);
    } catch (err: any) {
      console.error('Download dispatch error:', err);
    }
  };

  const resetAll = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setDownloadStarted(false);
    setEnableClip(false);
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] w-full overflow-hidden flex flex-col items-center justify-center px-4 py-2 select-none">
      {/* ======================= CASE 1: HERO VIEW (NO VIDEO ANALYZED YET) ======================= */}
      {!videoInfo ? (
        <div className="max-w-4xl w-full flex flex-col items-center text-center animate-fade-in my-auto">
          {/* Badge: Free Tool */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#16130b] border border-amber-500/30 text-amber-400 text-xs font-semibold mb-5 shadow-sm select-none">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{t.freeTool}</span>
          </div>

          {/* Heading: YouTube Video Downloader in one single line */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 leading-tight whitespace-nowrap">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm sm:text-base max-w-xl font-normal leading-relaxed mb-7">
            {t.heroSubtitle}
          </p>

          {/* Input Bar & Button matching the exact screenshot layout */}
          <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-3">
            {/* Rounded Input Box */}
            <div className="flex-1 w-full flex items-center bg-[#15151a] border border-slate-700/80 rounded-xl px-4 py-3 gap-3 focus-within:border-amber-400/80 transition-colors">
              <Link2 className="text-slate-500 shrink-0" size={18} />
              <input
                type="text"
                placeholder={t.inputPlaceholder}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm sm:text-base font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                autoFocus
              />
              {url && (
                <button
                  onClick={() => setUrl('')}
                  className="text-xs text-slate-500 hover:text-slate-300 font-semibold px-2 py-1 rounded shrink-0 cursor-pointer"
                >
                  {t.clear}
                </button>
              )}
            </div>

            {/* Yellow Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold px-7 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 text-sm sm:text-base shadow-lg shadow-amber-400/20 whitespace-nowrap"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin text-slate-950" size={18} />
                  <span>{t.analyzing}</span>
                </div>
              ) : (
                <span>{t.downloadNow}</span>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs sm:text-sm font-medium w-full max-w-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-slide-up">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={handleUpdateCore}
                disabled={updatingCore}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-200 shrink-0 transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={updatingCore ? 'animate-spin' : ''} />
                {updatingCore ? 'Updating Core...' : 'Update yt-dlp'}
              </button>
            </div>
          )}

          {/* Update notification */}
          {updateMsg && (
            <div className="mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium w-full max-w-2xl text-left flex items-center gap-2 animate-slide-up">
              <CheckCircle2 size={16} />
              <span>{updateMsg}</span>
            </div>
          )}
        </div>
      ) : (
        /* ======================= CASE 2: SINGLE-SCREEN COMPACT RESULT VIEW ======================= */
        <div className="w-full max-w-3xl flex flex-col justify-center items-center my-auto animate-fade-in gap-3">
          {/* Top Compact Input Strip to allow quick URL change without expanding page */}
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#15151a] border border-slate-800 rounded-xl px-3.5 py-2 gap-2.5">
              <Link2 className="text-amber-400 shrink-0" size={16} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder={t.inputPlaceholder}
                className="w-full bg-transparent text-slate-200 placeholder-slate-500 outline-none text-xs sm:text-sm"
              />
              <button
                onClick={resetAll}
                className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
            </button>
          </div>

          {/* Compact Main Card (Designed strictly to fit without scrollbar) */}
          <div className="w-full bg-[#1A1A1F] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
            {/* Video Overview: Thumbnail + Meta */}
            <div className="flex gap-4 items-center">
              <div className="w-32 sm:w-40 aspect-video rounded-xl overflow-hidden relative group bg-[#0e0e10] shrink-0 border border-slate-800">
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
                {videoInfo.duration > 0 && (
                  <div className="absolute bottom-1 right-1 bg-[#0e0e10]/90 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono border border-slate-800">
                    {formatSecondsToTime(videoInfo.duration)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-tight">
                  {videoInfo.title}
                </h2>
                <div className="flex flex-wrap items-center text-slate-400 text-xs gap-2.5 mt-1">
                  <span className="text-slate-300 font-medium truncate max-w-[140px]">
                    {videoInfo.uploader}
                  </span>
                  {videoInfo.duration > 0 && (
                    <span className="font-mono text-amber-400 text-[11px]">
                      {formatDurationHuman(videoInfo.duration)}
                    </span>
                  )}
                  {videoInfo.view_count && (
                    <span className="text-[11px] text-slate-500">
                      {Number(videoInfo.view_count).toLocaleString()} views
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quality / Format Selection Row */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.selectQuality}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {videoInfo.formats?.slice(0, 4).map((fmt: any) => {
                  const isSelected = selectedFormat === fmt.formatId;
                  return (
                    <button
                      key={fmt.formatId}
                      onClick={() => setSelectedFormat(fmt.formatId)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400/20 border-amber-400 text-white font-bold shadow-sm'
                          : 'bg-[#15151a] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate pr-1 text-[11px]">{fmt.label}</span>
                      <span className="font-mono uppercase text-[9px] text-amber-400 font-bold">
                        {fmt.ext}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Podcast Mode: Download Specific Moment (Pro Feature) */}
            {videoInfo.duration > 0 && (
              <div className="p-3 rounded-xl bg-[#121216] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors size={14} className={enableClip ? 'text-amber-400' : 'text-slate-500'} />
                    <span className="text-xs font-bold text-slate-200">
                      {t.podcastMode}
                    </span>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-500/40 text-amber-400 flex items-center gap-0.5">
                      <Sparkles size={10} />
                      {t.proBadge}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTogglePodcastMode}
                    className={`relative inline-flex h-4.5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      enableClip && isPro ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-slate-950 transition-transform ${
                        enableClip && isPro ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* If Clip Enabled & Pro is Active */}
                {enableClip && isPro && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-slide-up">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#18181f] border border-slate-800 rounded-lg px-2.5 py-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          {t.startMoment}
                        </label>
                        <input
                          type="text"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          placeholder="00:00:00"
                          className="w-full bg-[#0e0e10] border border-slate-700/80 rounded px-2 py-0.5 text-slate-100 font-mono text-xs focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div className="bg-[#18181f] border border-slate-800 rounded-lg px-2.5 py-1.5">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">
                          {t.endMoment}
                        </label>
                        <input
                          type="text"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          placeholder="00:00:00"
                          className="w-full bg-[#0e0e10] border border-slate-700/80 rounded px-2 py-0.5 text-slate-100 font-mono text-xs focus:border-amber-400 outline-none"
                        />
                      </div>
                    </div>

                    {isClipValid && parsedStart !== null && parsedEnd !== null && (
                      <div className="text-[11px] font-mono text-amber-300 flex items-center justify-between">
                        <span>
                          {formatSecondsToTime(parsedStart)} ➔ {formatSecondsToTime(parsedEnd)}
                        </span>
                        <span className="text-slate-400">({formatDurationHuman(clipDuration)})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Download CTA Button */}
            <div className="pt-1">
              <button
                onClick={() => handleStartDownload()}
                disabled={downloadStarted || (enableClip && isPro && !isClipValid)}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm active:scale-98"
              >
                {downloadStarted ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{t.addedToQueue}...</span>
                  </>
                ) : enableClip && isPro && isClipValid && parsedStart !== null && parsedEnd !== null ? (
                  <>
                    <Scissors size={16} />
                    <span>
                      {t.downloadClip} ({formatSecondsToTime(parsedStart)} – {formatSecondsToTime(parsedEnd)})
                    </span>
                  </>
                ) : (
                  <>
                    <DownloadIcon size={16} />
                    <span>{t.downloadVideo}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= PRO UPGRADE MODAL ======================= */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1A1A1F] border border-amber-400/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4">
              <Lock size={22} />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-black text-white">{t.proModalTitle}</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                PRO
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              {t.proModalDesc}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/pricing"
                onClick={() => setShowProModal(false)}
                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/25 transition-all text-center"
              >
                <span>{t.upgradeBtn}</span>
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setShowProModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.maybeLater}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
