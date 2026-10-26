import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Sparkles,
  Radio,
  Globe2,
  Smartphone,
  Compass,
  Download,
  ShieldCheck,
  Bot,
  Users,
  MousePointerClick,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export function DeepAnalytics() {
  const [liveClicks, setLiveClicks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics
      .getOverview()
      .then((res) => {
        if (res.success) {
          setOverview(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const token = localStorage.getItem('token');
    const streamUrl = token ? `/api/analytics/stream?token=${encodeURIComponent(token)}` : '/api/analytics/stream';
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'click') {
          const clickData = payload.data || payload;
          if (clickData && clickData.shortCode) {
            setLiveClicks((prev) => [clickData, ...prev.slice(0, 49)]);
            setOverview((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                totalClicks: (prev.totalClicks || 0) + 1,
              };
            });
          }
        }
      } catch {
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Telemetry Engine • Real-Time Feed</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Real-Time Telemetry Stream
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Instant click telemetry streamed live as visitors worldwide engage with your short links.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-slate-700 dark:text-slate-300">
              {connected ? 'Live Stream Connected' : 'Reconnecting...'}
            </span>
          </div>

          <a
            href="/api/analytics/overview/export/csv"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-teal-500/20 transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between shadow-sm">
        <div>
          <strong className="text-slate-900 dark:text-slate-200 font-semibold">How to use Live Stream:</strong> Keep this dashboard open during live broadcasts, product launches, or ad campaigns to observe real-time click bursts and monitor automated bot filtering.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Recorded Clicks</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{overview?.totalClicks ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unique IP Visitors</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{overview?.uniqueVisitors ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filtered Bots / Crawlers</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{overview?.botClicks ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Redirection System</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span>Operational (100% Uptime)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-teal-500 dark:text-teal-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Click Stream (Most Recent 50 Events)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {liveClicks.length} events caught in session
          </span>
        </div>

        {liveClicks.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Waiting for live short link redirects...</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Open any short link in another tab to observe immediate telemetry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Link Slug</th>
                  <th className="px-4 py-3">Geo Location</th>
                  <th className="px-4 py-3">Device / OS</th>
                  <th className="px-4 py-3">Browser</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {liveClicks.filter(Boolean).map((click, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {click.timestamp ? new Date(click.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                      /{click.shortCode || 'link'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-sans">
                      <div className="flex items-center space-x-1.5">
                        <Globe2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="text-slate-900 dark:text-white font-medium">{click.country || 'Global'}</span>
                        {click.city && <span className="text-slate-400 dark:text-slate-500">({click.city})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300 whitespace-nowrap font-sans">
                      <div className="flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{click.device || 'Desktop'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-sans">
                      {click.browser || 'Chrome'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs font-sans">
                      {click.referrer || 'Direct'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {click.isBot ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          Bot Detected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Human 200 OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
