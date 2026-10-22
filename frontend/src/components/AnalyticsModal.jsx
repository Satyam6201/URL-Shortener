import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  X,
  Sparkles,
  Globe2,
  Smartphone,
  Compass,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export function AnalyticsModal({ shortCode, onClose }) {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortCode) return;
    setLoading(true);
    api.analytics
      .getUrlAnalytics(shortCode, timeframe)
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load analytics');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shortCode, timeframe]);

  const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Analytics Deep Dive
              </span>
              <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">/{shortCode}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {data?.title || `Link /${shortCode}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
              {data?.originalUrl}
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {['24h', '7d', '30d', 'all'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg uppercase font-bold transition-colors cursor-pointer ${
                    timeframe === tf
                      ? 'bg-teal-500 text-slate-950 shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <a
              href={`/api/analytics/${shortCode}/export/csv`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Aggregating telemetry events...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            
            {data?.aiInsights && (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 dark:from-teal-950/60 dark:via-slate-900 dark:to-slate-900 border border-teal-200 dark:border-teal-500/30 space-y-3 shadow-sm">
                <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-pulse" />
                  <span>AI Audience Insights & Synthesis</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {data.aiInsights.summary}
                </p>
                {data.aiInsights.highlights?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
                    {data.aiInsights.highlights.map((h, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.aiInsights.recommendation && (
                  <div className="text-xs pt-2 border-t border-teal-200 dark:border-teal-500/20 text-teal-800 dark:text-teal-300 font-medium">
                    <strong>Actionable Recommendation:</strong> {data.aiInsights.recommendation}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Total Clicks</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {data?.summary?.totalClicks || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Unique Visitors</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {data?.summary?.uniqueVisitors || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Top Country</div>
                <div className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                  {data?.countries[0]?.country || 'N/A'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Primary Device</div>
                <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1 capitalize">
                  {data?.devices[0]?.device || 'N/A'}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Traffic Velocity Over Time</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {data?.timeline?.length || 0} data intervals
                </span>
              </div>

              <div className="h-64 w-full pt-4">
                {data?.timeline?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.timeline}>
                      <defs>
                        <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
                        fontSize={11}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#fff' : '#0f172a',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#clickGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No clicks recorded for this timeframe yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Device Distribution</span>
                </div>
                {data?.devices?.length > 0 ? (
                  <div className="space-y-3">
                    {data.devices.map((d, index) => {
                      const total = data.summary.totalClicks || 1;
                      const pct = Math.round((d.count / total) * 100);
                      return (
                        <div key={d.device} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                            <span className="capitalize font-medium">{d.device}</span>
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{d.count} clicks ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">No device telemetry yet</div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Top Referral Channels</span>
                </div>
                {data?.referrers?.length > 0 ? (
                  <div className="space-y-2">
                    {data.referrers.map((ref) => (
                      <div
                        key={ref.referrer}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800"
                      >
                        <span className="font-medium truncate max-w-xs">{ref.referrer}</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{ref.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">No referrer data yet</div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Globe2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Geographic Audience by Country</span>
              </div>
              {data?.countries?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {data.countries.map((c) => (
                    <div key={c.country} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{c.country}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{c.count} clicks</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No country telemetry yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
