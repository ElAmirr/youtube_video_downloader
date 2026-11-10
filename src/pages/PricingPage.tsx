import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Sparkles, ShieldCheck, Zap, Award, Loader2, LogOut, Key } from 'lucide-react';
import { useAppStore } from '../store';
import { translations } from '../utils/i18n';

const LICENSE_SERVER = 'https://photo-invoice-licence-sever.onrender.com';
const APP_IDENTIFIER = 'youtube_video_downloader';

const PricingPage = () => {
  const language = useAppStore((state) => state.language);
  const isPro = useAppStore((state) => state.isPro);
  const setIsPro = useAppStore((state) => state.setIsPro);
  const t = translations[language] || translations.en;

  const [licenseInput, setLicenseInput] = useState('');
  const [activatedSuccess, setActivatedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLicense, setActiveLicense] = useState<any>(null);

  useEffect(() => {
    const loadLicenseInfo = async () => {
      const electron = (window as any).electron || (window as any).electronAPI;
      if (electron?.checkLicense) {
        try {
          const lic = await electron.checkLicense();
          if (lic && lic.activated) {
            setActiveLicense(lic);
            setIsPro(true);
          }
        } catch (e) {
          console.error('Error fetching license status:', e);
        }
      }
    };
    loadLicenseInfo();
  }, [setIsPro]);

  const handleActivateLicense = async () => {
    const key = licenseInput.trim();
    if (!key) {
      setErrorMsg('Please enter a valid license key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const electron = (window as any).electron || (window as any).electronAPI;
      const hwid = electron?.getHwid ? await electron.getHwid() : 'standalone-hwid';
      const appInfo = electron?.getAppInfo ? await electron.getAppInfo() : { version: '1.0.0', os: 'win32' };

      const res = await axios.post(
        `${LICENSE_SERVER}/api/activate`,
        {
          key,
          hwid,
          version: appInfo.version,
          os: appInfo.os,
          app: APP_IDENTIFIER,
        },
        { timeout: 35000 }
      );

      if (res.data.success) {
        const expiryDate = res.data.expiresAt || res.data.expires_at || null;
        const licData = {
          activated: true,
          key,
          hwid,
          app: APP_IDENTIFIER,
          activatedAt: new Date().toISOString(),
          expiresAt: expiryDate,
        };

        if (electron?.saveLicense) {
          await electron.saveLicense(licData);
        }

        setActiveLicense(licData);
        setIsPro(true);
        setActivatedSuccess(true);
        setLicenseInput('');
        setTimeout(() => setActivatedSuccess(false), 5000);
      } else {
        setErrorMsg(res.data.message || 'Invalid license key.');
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Error connecting to license server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateLicense = async () => {
    if (!confirm('Are you sure you want to unlink and deactivate your license on this device?')) return;

    const electron = (window as any).electron || (window as any).electronAPI;
    if (electron?.deleteLicense) {
      await electron.deleteLicense();
    }
    setActiveLicense(null);
    setIsPro(false);
  };

  const handleSimulatePurchase = () => {
    setIsPro(!isPro);
    setActivatedSuccess(!isPro);
    if (!isPro) {
      setTimeout(() => setActivatedSuccess(false), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-4">
          <Sparkles size={13} />
          <span>vidos Pro</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          {t.pricingTitle}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          {t.pricingSubtitle}
        </p>
      </div>

      {activatedSuccess && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-sm font-semibold flex items-center gap-2.5 animate-slide-up max-w-md w-full justify-center">
          <Award size={20} className="text-amber-400" />
          <span>🎉 vidos Pro is now active on your device!</span>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Free Plan */}
        <div className="bg-[#12151e] border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t.freePlanTitle}</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                Standard
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-white">{t.freePlanPrice}</span>
              <span className="text-xs text-slate-400 font-medium">/ {t.freePlanPeriod}</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Full access to all YouTube downloader features.
            </p>

            <div className="space-y-3.5 pt-4 border-t border-slate-800">
              {t.freePlanFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 text-sm text-slate-500 line-through">
                <X size={16} className="text-slate-600 shrink-0" />
                <span>Podcast Moment Clipper</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              disabled={!isPro}
              onClick={() => setIsPro(false)}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                !isPro
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer'
              }`}
            >
              {!isPro ? t.currentPlanBtn : 'Switch to Free'}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#151722] border-2 border-amber-400/80 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative shadow-amber-500/10">
          {/* Top Badge */}
          <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
            {t.proPlanBadge}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{t.proPlanTitle}</span>
                <Sparkles size={16} className="text-amber-400" />
              </h3>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-black text-amber-400">{t.proPlanPrice}</span>
              <span className="text-xs text-slate-400 font-medium">/ {t.proPlanPeriod}</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Includes the exclusive Podcast Moment Clipper and keyframe stream slicing.
            </p>

            <div className="space-y-3.5 pt-4 border-t border-slate-800">
              {t.proPlanFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                  <Check size={16} className="text-amber-400 shrink-0 font-bold" />
                  <span className={idx === 1 ? 'text-amber-300 font-bold' : ''}>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={handleSimulatePurchase}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isPro
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isPro ? (
                <>
                  <Check size={18} />
                  <span>Pro Active on Device</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>{t.unlockProBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* License Key Activation / Status Card */}
      <div className="w-full max-w-4xl mt-10 bg-[#12151e] border border-slate-800 rounded-2xl p-6">
        {activeLicense ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Key size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Active License Key</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Active on Device
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                  <span className="font-mono text-slate-200">{activeLicense.key}</span>
                  <span>•</span>
                  <span>
                    Expires: {activeLicense.expiresAt ? new Date(activeLicense.expiresAt).toLocaleDateString() : 'Lifetime'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDeactivateLicense}
              className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <LogOut size={13} />
              <span>Unlink Device</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Already have a License Key?</h4>
                <p className="text-xs text-slate-400">Enter your license code below to activate Pro.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                disabled={loading}
                className="bg-black border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-amber-400 w-full sm:w-64"
              />
              <button
                onClick={handleActivateLicense}
                disabled={loading}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>{loading ? 'Activating...' : 'Activate'}</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && <p className="text-xs text-red-400 mt-3">{errorMsg}</p>}
      </div>
    </div>
  );
};

export default PricingPage;

