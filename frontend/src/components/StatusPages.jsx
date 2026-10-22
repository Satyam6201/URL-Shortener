import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Link2,
  AlertTriangle,
  Clock,
  ShieldX,
  ArrowLeft,
  Lock,
  Eye,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  MousePointer,
} from 'lucide-react';

export function StatusPage({ type = 'not-found', code = '', time = '', onGoHome }) {
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (type === 'preview' && code) {
      setPreviewLoading(true);
      api.urls
        .getPreview(code)
        .then((res) => {
          if (res.success) setPreviewData(res.data);
          else setPreviewError(res.error || 'Failed to load preview');
        })
        .catch((err) => setPreviewError(err.message || 'Failed to load preview'))
        .finally(() => setPreviewLoading(false));
    }
  }, [type, code]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setPasswordLoading(true);
    setPasswordError('');
    try {
      const res = await api.urls.verifyPassword(code, password);
      if (res.success && res.data.originalUrl) {
        window.location.href = res.data.originalUrl;
      }
    } catch (err) {
      setPasswordError(err.message || 'Incorrect password entered');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (type === 'protected') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 border border-slate-200 dark:border-slate-700">
              Password Required
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Protected Short Link</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The owner of <code className="text-teal-600 dark:text-teal-400 font-mono font-bold">/{code}</code> has protected this destination with a passcode.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Enter passcode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Unlock & Visit Link</span>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={onGoHome}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (type === 'preview') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Link Preview Gate</h2>
            </div>
            <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">/{code}</span>
          </div>

          {previewLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
              <p>Fetching link preview details...</p>
            </div>
          ) : previewError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
              {previewError}
            </div>
          ) : previewData ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px]">Title / Target</span>
                <div className="font-bold text-slate-900 dark:text-white text-base">{previewData.title || previewData.shortCode}</div>
                <div className="font-mono text-teal-600 dark:text-teal-400 break-all bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {previewData.originalUrl}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Category</span>
                  <div className="font-bold text-slate-900 dark:text-white">{previewData.category || 'General'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Total Clicks</span>
                  <div className="font-bold text-slate-900 dark:text-white font-mono">{previewData.clicksCount || 0}</div>
                </div>
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <a
                  href={previewData.originalUrl}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-center text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-teal-500/20"
                >
                  <span>Proceed to Destination</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={onGoHome}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const configs = {
    'not-found': {
      icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
      badge: '404 • Not Found',
      title: 'Link Does Not Exist',
      description: code
        ? `The short link /${code} could not be found. It may have been mistyped or deleted.`
        : 'The short link you are trying to visit does not exist or has been deleted.',
    },
    'expired': {
      icon: <Clock className="w-10 h-10 text-rose-500" />,
      badge: '410 • Link Expired',
      title: 'This Link Has Expired',
      description: code
        ? `The short link /${code} has exceeded its predetermined expiration lifetime.`
        : 'This short link was configured with an expiration deadline that has elapsed.',
    },
    'disabled': {
      icon: <ShieldX className="w-10 h-10 text-slate-400" />,
      badge: '403 • Link Paused',
      title: 'Link Currently Disabled',
      description: code
        ? `The short link /${code} has been paused or temporarily deactivated by its owner.`
        : 'The link owner has temporarily paused traffic to this shortlink.',
    },
    'scheduled': {
      icon: <Calendar className="w-10 h-10 text-cyan-500" />,
      badge: 'Scheduled • Not Yet Active',
      title: 'Link Activates Soon',
      description: time
        ? `This link has been scheduled to activate on ${new Date(time).toLocaleString()}.`
        : 'This short link is scheduled to go live at a future date.',
    },
    'limit-reached': {
      icon: <MousePointer className="w-10 h-10 text-amber-500" />,
      badge: 'Limit Reached',
      title: 'Click Limit Reached',
      description: code
        ? `The short link /${code} has reached its maximum allowed click quota.`
        : 'This short link was configured with a visitor click limit that has now been reached.',
    },
  };

  const item = configs[type] || configs['not-found'];

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto shadow-inner">
          {item.icon}
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {item.badge}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{item.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
        </div>

        <div className="pt-2">
          <button
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Go to SnipURL Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
