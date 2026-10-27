import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Target,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Tag,
  Share2,
} from 'lucide-react';

export function UtmBuilder({ onLinkCreated, onOpenAnalytics }) {
  const { refreshQuota } = useAuth();
  const toast = useToast();
  const [baseUrl, setBaseUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [customAlias, setCustomAlias] = useState('');

  const [loading, setLoading] = useState(false);
  const [shortResult, setShortResult] = useState(null);
  const [copiedTagged, setCopiedTagged] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [error, setError] = useState('');

  const getTaggedUrl = () => {
    if (!baseUrl.trim()) return '';
    try {
      const parsed = new URL(baseUrl.trim().startsWith('http') ? baseUrl.trim() : `https://${baseUrl.trim()}`);
      if (utmSource.trim()) parsed.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) parsed.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) parsed.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) parsed.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) parsed.searchParams.set('utm_content', utmContent.trim());
      return parsed.toString();
    } catch {
      return baseUrl;
    }
  };

  const taggedUrl = getTaggedUrl();

  const handleCopyTagged = () => {
    if (!taggedUrl) return;
    navigator.clipboard.writeText(taggedUrl);
    setCopiedTagged(true);
    toast.success('Tagged UTM link copied to clipboard!');
    setTimeout(() => setCopiedTagged(false), 2000);
  };

  const handleCopyShort = () => {
    if (!shortResult) return;
    navigator.clipboard.writeText(shortResult.shortUrl);
    setCopiedShort(true);
    toast.success('Shortened link copied to clipboard!');
    setTimeout(() => setCopiedShort(false), 2000);
  };

  const handleShortenTagged = async (e) => {
    e.preventDefault();
    if (!taggedUrl) return;

    setError('');
    setLoading(true);

    try {
      const payload = {
        originalUrl: taggedUrl,
        customAlias: customAlias.trim() || undefined,
        category: 'Marketing',
        utm: {
          source: utmSource.trim() || undefined,
          medium: utmMedium.trim() || undefined,
          campaign: utmCampaign.trim() || undefined,
          term: utmTerm.trim() || undefined,
          content: utmContent.trim() || undefined,
        },
      };

      const res = await api.urls.create(payload);
      if (res.success) {
        setShortResult(res.data);
        await refreshQuota();
        if (onLinkCreated) onLinkCreated(res.data);
        toast.success('UTM Campaign shortlink generated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to shorten tagged link');
      toast.error(err.message || 'Failed to shorten tagged link');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (source, medium) => {
    setUtmSource(source);
    setUtmMedium(medium);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
          <Target className="w-3.5 h-3.5" />
          <span>Marketing Attribution & Campaign Tracking</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Campaign UTM Builder
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Add standardized Google Analytics and ad network tracking parameters to your URLs and generate short links instantly.
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
        <form onSubmit={handleShortenTagged} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Website Target URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://example.com/pricing"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('google', 'cpc')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
            >
              Google Ads (cpc)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('newsletter', 'email')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
            >
              Email Newsletter
            </button>
            <button
              type="button"
              onClick={() => applyPreset('twitter', 'social')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
            >
              X / Twitter (social)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('linkedin', 'social')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
            >
              LinkedIn (social)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Source <span className="text-rose-500">*</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(utm_source)</span>
              </label>
              <input
                type="text"
                required
                placeholder="google, newsletter, linkedin"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Medium <span className="text-rose-500">*</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(utm_medium)</span>
              </label>
              <input
                type="text"
                required
                placeholder="cpc, email, social, banner"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Name
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(utm_campaign)</span>
              </label>
              <input
                type="text"
                placeholder="summer_sale, product_launch"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Term / Keyword
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(utm_term)</span>
              </label>
              <input
                type="text"
                placeholder="running_shoes, crm_software"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Campaign Content
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(utm_content)</span>
              </label>
              <input
                type="text"
                placeholder="logolink, banner_sidebar_blue"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Short Link Alias
                <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="campaign-2026"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {taggedUrl && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Generated Tagged URL:</span>
                <button
                  type="button"
                  onClick={handleCopyTagged}
                  className="inline-flex items-center space-x-1 text-teal-600 dark:text-teal-400 hover:text-teal-500 cursor-pointer"
                >
                  {copiedTagged ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTagged ? 'Copied Tagged URL' : 'Copy Tagged'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {taggedUrl}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !baseUrl || !utmSource || !utmMedium}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Shortening Tagged URL...</span>
              </>
            ) : (
              <>
                <span>Generate & Shorten UTM Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {shortResult && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">Campaign Short URL</span>
                <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                  {shortResult.shortUrl}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  utm_campaign: {shortResult.utm?.campaign || 'none'}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyShort}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedShort ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedShort ? 'Copied!' : 'Copy Short Link'}</span>
                </button>

                <a
                  href={shortResult.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => onOpenAnalytics(shortResult.shortCode)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 text-xs font-semibold cursor-pointer"
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
