import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/logo.png';
import { Key, ShieldCheck, Copy, Check, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

const LICENSE_SERVER = 'https://photo-invoice-licence-sever.onrender.com';
const APP_IDENTIFIER = 'youtube_video_downloader';

interface LicenseModalProps {
  onAuthenticated: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ onAuthenticated }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hwid, setHwid] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const electron = (window as any).electron || (window as any).electronAPI;
      if (!electron) return;
      try {
        const id = await electron.getHwid();
        setHwid(id);
      } catch (e) {
        console.error('Failed to get HWID:', e);
      }
    };
    init();
  }, []);

  const copyHwid = () => {
    if (!hwid) return;
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return setError('Please enter your license key.');
    }

    setLoading(true);
    setError('');

    try {
      const electron = (window as any).electron || (window as any).electronAPI;
      let appInfo = { version: '1.0.0', os: 'win32' };
      if (electron?.getAppInfo) {
        appInfo = await electron.getAppInfo();
      }

      const response = await axios.post(
        `${LICENSE_SERVER}/api/activate`,
        {
          key: trimmedKey,
          hwid: hwid,
          version: appInfo.version,
          os: appInfo.os,
          app: APP_IDENTIFIER,
        },
        { timeout: 40000 } // 40s timeout for Render cold start
      );

      if (response.data.success) {
        const expiryDate = response.data.expiresAt || response.data.expires_at || null;
        if (electron?.saveLicense) {
          await electron.saveLicense({
            activated: true,
            key: trimmedKey,
            hwid: hwid,
            app: APP_IDENTIFIER,
            activatedAt: new Date().toISOString(),
            expiresAt: expiryDate,
          });
        }
        onAuthenticated();
      } else {
        setError(response.data.message || 'Invalid license key.');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server is waking up. Please retry in 20 seconds...');
      } else {
        setError('Connection failed. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setTrialLoading(true);
    setError('');
    const electron = (window as any).electron || (window as any).electronAPI;
    try {
      if (electron?.startTrial) {
        await electron.startTrial();
      }
      // If server accepted trial start, grant trial access locally
      if (electron?.saveLicense) {
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 7);
        await electron.saveLicense({
          activated: true,
          key: 'FREE-TRIAL-' + (hwid ? hwid.slice(0, 8) : 'ACCESS'),
          hwid: hwid,
          app: APP_IDENTIFIER,
          isTrial: true,
          activatedAt: new Date().toISOString(),
          expiresAt: trialExpiry.toISOString(),
        });
      }
      onAuthenticated();
    } catch (e: any) {
      setError('Could not initiate trial. Please check connection.');
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none">
      <div className="relative w-full max-w-md bg-[#12151e] border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        {/* Amber glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-xl shadow-amber-500/20 mb-4">
            <div className="w-full h-full bg-[#12151e] rounded-[14px] flex items-center justify-center p-2.5">
              <img src={logo} alt="vidos logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">Activate Vidos</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Enter your license key to unlock unlimited downloads, high-res audio, and the podcast clipper.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="w-full mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="w-full mt-6 space-y-4">
            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-500">
                <Key size={16} />
              </div>
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={loading}
                className="w-full bg-[#090b11] border border-slate-800 focus:border-amber-400 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono outline-none transition-colors placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-slate-950" />
                  <span>Verifying License...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Activate License</span>
                </>
              )}
            </button>
          </form>

          {/* Trial / Alternative Option */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-xs text-slate-400">
            <span>Don't have a key?</span>
            <button
              onClick={handleStartTrial}
              disabled={trialLoading}
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={12} />
              <span>{trialLoading ? 'Starting...' : 'Start 7-Day Trial'}</span>
            </button>
          </div>

          {/* Hardware ID Footer */}
          <div className="mt-6 w-full bg-[#090b11]/80 border border-slate-800/80 rounded-xl p-3 text-left">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Device Identifier (HWID):</span>
              <button
                type="button"
                onClick={copyHwid}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedHwid ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedHwid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="font-mono text-[11px] text-slate-300 break-all select-all block">
              {hwid || 'Detecting...'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;

