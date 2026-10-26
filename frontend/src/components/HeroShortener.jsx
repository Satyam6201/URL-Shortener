import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Link2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  Folder,
  Layers,
  ArrowRight,
  Loader2,
  Lock,
  Flame,
  MousePointer,
  Calendar,
  Smartphone,
  Globe2,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export function HeroShortener({ onLinkCreated, onOpenAnalytics, onOpenQr }) {
  const { user, refreshQuota } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryOption, setExpiryOption] = useState('never');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');

  const [password, setPassword] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [clickLimit, setClickLimit] = useState('');
  const [activateAt, setActivateAt] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [iosTarget, setIosTarget] = useState('');
  const [androidTarget, setAndroidTarget] = useState('');
  const [desktopTarget, setDesktopTarget] = useState('');

  const [geoRules, setGeoRules] = useState([]);
  const [newGeoCountry, setNewGeoCountry] = useState('');
  const [newGeoUrl, setNewGeoUrl] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [suggestedSlugs, setSuggestedSlugs] = useState([]);
  const [loadingSlugs, setLoadingSlugs] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState(null);
  const [scanningSafety, setScanningSafety] = useState(false);

  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setOriginalUrl(text);
        runSafetyScan(text);
      }
    } catch {}
  };

  const runSafetyScan = async (url) => {
    if (!url || !url.startsWith('http')) return;
    setScanningSafety(true);
    try {
      const res = await api.ai.checkSafety(url);
      if (res.success) {
        setSafetyStatus(res.data);
      }
    } catch {
      setSafetyStatus(null);
    } finally {
      setScanningSafety(false);
    }
  };

  const handleSuggestSlugs = async () => {
    if (!originalUrl || !originalUrl.startsWith('http')) {
      setError('Please enter a valid HTTP/HTTPS URL first');
      return;
    }
    setError('');
    setLoadingSlugs(true);
    try {
      const res = await api.ai.suggestSlugs(originalUrl);
      if (res.success && res.data.slugs) {
        setSuggestedSlugs(res.data.slugs);
        setShowAdvanced(true);
      }
    } catch (err) {
      setError(err.message || 'Could not generate smart slugs');
    } finally {
      setLoadingSlugs(false);
    }
  };

  const addGeoRule = () => {
    if (!newGeoCountry || !newGeoUrl) return;
    setGeoRules([...geoRules, { country: newGeoCountry.toUpperCase().trim(), url: newGeoUrl.trim() }]);
    setNewGeoCountry('');
    setNewGeoUrl('');
  };

  const removeGeoRule = (index) => {
    setGeoRules(geoRules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setError('');
    setLoading(true);

    try {
      let expiresAt = null;
      const now = new Date();
      if (expiryOption === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      else if (expiryOption === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      else if (expiryOption === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      else if (expiryOption === '30d') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const deviceTargeting = {};
      if (iosTarget.trim()) deviceTargeting.iosUrl = iosTarget.trim();
      if (androidTarget.trim()) deviceTargeting.androidUrl = androidTarget.trim();
      if (desktopTarget.trim()) deviceTargeting.desktopUrl = desktopTarget.trim();

      const geoTargeting = geoRules.map((r) => ({
        country: r.country,
        url: r.url,
      }));

      const payload = {
        originalUrl: originalUrl.trim(),
        customAlias: customAlias.trim() || undefined,
        expiresAt,
        category,
        tags,
        password: password.trim() || undefined,
        isOneTime: Boolean(isOneTime),
        clickLimit: clickLimit ? parseInt(clickLimit, 10) : undefined,
        activateAt: activateAt ? new Date(activateAt) : undefined,
        showPreview: Boolean(showPreview),
        deviceTargeting: Object.keys(deviceTargeting).length > 0 ? deviceTargeting : undefined,
        geoTargeting: geoTargeting.length > 0 ? geoTargeting : undefined,
      };

      const res = await api.urls.create(payload);

      if (res.success) {
        setCreatedResult(res.data);
        await refreshQuota();
        if (onLinkCreated) onLinkCreated(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[320px] bg-gradient-to-tr from-teal-500/20 via-emerald-400/10 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none -z-10 animate-float-slow" />

      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-bold tracking-wide shadow-sm shadow-teal-500/5 backdrop-blur-md hover:scale-105 hover:border-teal-500/40 transition-all duration-200 cursor-default select-none">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Sub-3ms Edge Redirection • Real-Time Telemetry</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Shorten, Protect &{' '}
          <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 dark:from-teal-400 dark:via-emerald-300 dark:to-cyan-400 bg-clip-text text-transparent">
            Supercharge Every Link
          </span>
        </h1>

        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
          Transform long, fragile URLs into high-performing shortlinks with AI-generated slugs, device and geo routing, self-destructing burn links, and live visitor telemetry.
        </p>
      </div>

      <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 ring-1 ring-slate-900/5 dark:ring-white/5 p-5 sm:p-8 shadow-2xl shadow-teal-500/5 hover:shadow-teal-500/15 hover:border-teal-500/40 backdrop-blur-2xl transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="relative flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-teal-500 group-focus-within:scale-110 transition-all duration-200">
                <Link2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <input
                type="url"
                required
                placeholder="Paste destination link (e.g. https://github.com/my-repo)"
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && originalUrl) {
                    handleSubmit(e);
                  }
                }}
                onBlur={() => runSafetyScan(originalUrl)}
                className="w-full pl-12 pr-28 py-4 sm:py-4.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 hover:border-slate-300 dark:hover:border-slate-700 text-sm sm:text-base transition-all shadow-inner font-medium"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:scale-105 active:scale-95 shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                title="Paste from clipboard"
              >
                <span>Paste</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-slate-300/80 dark:bg-slate-900 rounded font-mono text-slate-500 dark:text-slate-400">⌘V</kbd>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !originalUrl}
              className="group/btn px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Shortening...</span>
                </>
              ) : (
                <>
                  <span>Shorten Link</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5] group-hover/btn:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSuggestSlugs}
                disabled={loadingSlugs || !originalUrl}
                className="group/ai inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 hover:border-teal-400/50 font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loadingSlugs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover/ai:rotate-12 group-hover/ai:scale-110 transition-transform duration-200" />
                )}
                <span>Generate AI Slugs</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                  showAdvanced 
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/40' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>Targeting & Controls</span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5 transition-transform duration-200" />
                )}
              </button>
            </div>

            {safetyStatus && (
              <div
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-200 ${
                  safetyStatus.isSafe
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400/40'
                    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:border-rose-400/40'
                }`}
              >
                {safetyStatus.isSafe ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                )}
                <span>{safetyStatus.isSafe ? 'AI Verified Safe' : `Flagged: ${safetyStatus.riskCategory}`}</span>
              </div>
            )}
          </div>

          {suggestedSlugs.length > 0 && (
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-950/60 border border-teal-200 dark:border-teal-500/30 space-y-2.5 animate-in fade-in duration-200 shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs text-teal-800 dark:text-teal-400 font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>AI Recommended Slugs (Click to use):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedSlugs.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => {
                      setCustomAlias(slug);
                      setShowAdvanced(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                      customAlias === slug
                        ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/25 scale-105 ring-2 ring-teal-400/50'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 hover:border-teal-400 dark:hover:border-teal-500/40 hover:-translate-y-0.5 hover:shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95'
                    }`}
                  >
                    /{slug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAdvanced && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
              
              <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'basic'
                      ? 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  General & Expiry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Protection & Limits
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('targeting')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'targeting'
                      ? 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Device & Geo Rules
                </button>
              </div>

              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <span>Custom Alias</span>
                      <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">/</span>
                      <input
                        type="text"
                        placeholder="my-campaign"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="w-full pl-6 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      <span>Link Expiration</span>
                    </label>
                    <select
                      value={expiryOption}
                      onChange={(e) => setExpiryOption(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="never">Never Expire</option>
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Folder className="w-3.5 h-3.5 text-teal-500" />
                      <span>Category</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="General">General</option>
                      <option value="Technology">Technology</option>
                      <option value="Shopping">Shopping</option>
                      <option value="News">News</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Education">Education</option>
                      <option value="Finance">Finance</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-teal-500" />
                      <span>Tags</span>
                      <span className="text-slate-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="marketing, summer-launch, promo"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-teal-500" />
                      <span>Passcode Protection</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank for public access"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <MousePointer className="w-3.5 h-3.5 text-teal-500" />
                      <span>Click Limit (Max Clicks)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500 (unlimited if empty)"
                      value={clickLimit}
                      onChange={(e) => setClickLimit(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      <span>Schedule Activation Date</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={activateAt}
                      onChange={(e) => setActivateAt(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-2 pt-1">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOneTime}
                        onChange={(e) => setIsOneTime(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-0"
                      />
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>One-Time Burn Link (Dies after 1st click)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPreview}
                        onChange={(e) => setShowPreview(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:ring-0"
                      />
                      <Eye className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Show Interstitial Preview Gate</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'targeting' && (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                        <span>iOS Target URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://apps.apple.com/..."
                        value={iosTarget}
                        onChange={(e) => setIosTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Android Target URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://play.google.com/..."
                        value={androidTarget}
                        onChange={(e) => setAndroidTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Desktop Target URL</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://mysite.com/desktop"
                        value={desktopTarget}
                        onChange={(e) => setDesktopTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Globe2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Country-Specific Redirect Rules</span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength="2"
                        placeholder="Country (e.g. US, IN)"
                        value={newGeoCountry}
                        onChange={(e) => setNewGeoCountry(e.target.value.toUpperCase())}
                        className="w-full sm:w-28 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs uppercase font-mono"
                      />
                      <input
                        type="url"
                        placeholder="Target URL for this country (https://...)"
                        value={newGeoUrl}
                        onChange={(e) => setNewGeoUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={addGeoRule}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    {geoRules.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {geoRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400">
                                {rule.country}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 truncate max-w-sm">{rule.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeGeoRule(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {createdResult && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-teal-500/10 via-white to-emerald-500/5 dark:from-teal-950/40 dark:via-slate-900/90 dark:to-slate-950 border-2 border-teal-500/40 ring-4 ring-teal-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl shadow-teal-500/15 hover:border-teal-500/60 transition-all duration-300">
              
              <div className="flex items-start space-x-4 w-full md:w-auto">
                {createdResult.qrCodeData && (
                  <div 
                    onClick={() => onOpenQr(createdResult)}
                    className="relative hidden sm:flex flex-col items-center justify-center p-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer group/qr hover:scale-105 hover:border-teal-400 transition-all duration-200 flex-shrink-0"
                    title="Click to enlarge QR code"
                  >
                    <img 
                      src={createdResult.qrCodeData} 
                      alt="Short URL QR Code" 
                      className="w-16 h-16 rounded-lg object-contain"
                    />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1 group-hover/qr:text-teal-500 transition-colors">Scan QR</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      <span>Ready to Share</span>
                    </span>
                    {createdResult.category && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                        {createdResult.category}
                      </span>
                    )}
                    {createdResult.isOneTime && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 animate-pulse">
                        Burn on Click
                      </span>
                    )}
                    {createdResult.password && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                        Passcode Protected
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => handleCopy(createdResult.shortUrl)}
                    className="group/link text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2 break-all cursor-pointer"
                    title="Click to copy link"
                  >
                    <span className="text-teal-600 dark:text-teal-400 group-hover/link:underline underline-offset-4 decoration-teal-400/50 transition-all">{createdResult.shortUrl}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    Target: <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors font-mono">{createdResult.originalUrl}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(createdResult.shortUrl)}
                  className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all duration-200 cursor-pointer shadow-lg ${
                    copied
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-105'
                      : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                <a
                  href={createdResult.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                  title="Test Link in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {createdResult.qrCodeData && (
                  <button
                    type="button"
                    onClick={() => onOpenQr(createdResult)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                    title="Enlarge QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenAnalytics(createdResult.shortCode)}
                  className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
