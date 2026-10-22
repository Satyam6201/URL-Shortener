import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Search,
  Filter,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  Power,
  Clock,
  Sparkles,
  Link2,
  MousePointerClick,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export function DashboardView({ onOpenAnalytics, onOpenQr, onOpenEdit, onSwitchToShorten }) {
  const { user, quota, refreshQuota } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [overview, setOverview] = useState({ totalLinks: 0, totalClicks: 0 });
  const [copiedId, setCopiedId] = useState(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.urls.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        category: selectedCategory !== 'All' ? selectedCategory : '',
        status: selectedStatus !== 'all' ? selectedStatus : '',
      });
      if (res.success) {
        setLinks(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedCategory, selectedStatus]);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.analytics.getOverview();
      if (res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link) => {
    try {
      const res = await api.urls.update(link._id, { isActive: !link.isActive });
      if (res.success) {
        setLinks((prev) =>
          prev.map((l) => (l._id === link._id ? { ...l, isActive: !link.isActive } : l))
        );
      }
    } catch (err) {
      alert(`Could not toggle link: ${err.message}`);
    }
  };

  const handleDelete = async (linkId, shortCode) => {
    if (!window.confirm(`Are you sure you want to delete /${shortCode}? This will immediately purge it from cache and database.`)) {
      return;
    }

    try {
      const res = await api.urls.delete(linkId);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l._id !== linkId));
        fetchOverview();
        refreshQuota();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const categories = ['All', 'Technology', 'Shopping', 'News', 'Social Media', 'Education', 'Finance', 'Entertainment', 'General'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Your Links Dashboard</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage short links, inspect click metrics, and configure targeting.</p>
        </div>

        <button
          onClick={onSwitchToShorten}
          className="group flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
          <span>Create New Link</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
            <Link2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Links</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{overview.totalLinks}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
            <MousePointerClick className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Clicks</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{overview.totalClicks}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
            <Layers className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Daily Quota</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{quota.usedToday}/{quota.dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (quota.usedToday / quota.dailyLimit) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200">
            <Sparkles className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Edge Redirection</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Sub-3ms Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, short code, destination URL, or tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Links</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer font-bold ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25 scale-105 ring-1 ring-teal-400'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 hover:scale-105 active:scale-95'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-900/5 dark:shadow-none">
        {loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-sm space-y-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading your link records...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Link2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No short links found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {search || selectedCategory !== 'All' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'Get started by creating your very first short link!'}
            </p>
            <button
              onClick={onSwitchToShorten}
              className="mt-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Create Short Link
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {links.map((link) => {
              const isExpired = link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
              return (
                <div
                  key={link._id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                        {link.title || link.shortCode}
                      </span>

                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          Expired
                        </span>
                      ) : link.isActive ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Disabled
                        </span>
                      )}

                      {link.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {link.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-sm font-mono">
                      <span className="text-teal-600 dark:text-teal-400 font-bold">{link.shortUrl}</span>
                      <button
                        onClick={() => handleCopy(link._id, link.shortUrl)}
                        title="Copy short URL"
                        className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === link._id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                        title="Test link redirect"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg">
                      Destination: <span className="hover:text-slate-700 dark:hover:text-slate-300">{link.originalUrl}</span>
                    </div>

                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {link.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 self-end lg:self-center">
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{link.clicksCount}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Clicks</div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onOpenAnalytics(link.shortCode)}
                        title="View Detailed Analytics"
                        className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 text-xs font-bold flex items-center space-x-1.5 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Analytics</span>
                      </button>

                      <button
                        onClick={() => onOpenQr(link)}
                        title="View QR Code"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-transparent hover:border-teal-500/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenEdit(link)}
                        title="Edit Destination / Expiry"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-transparent hover:border-amber-500/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(link)}
                        title={link.isActive ? 'Disable Link' : 'Enable Link'}
                        className={`p-2 rounded-xl border border-transparent hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer ${
                          link.isActive
                            ? 'bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/30'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:border-slate-400/30'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(link._id, link.shortCode)}
                        title="Delete Link"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-500/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total links)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
