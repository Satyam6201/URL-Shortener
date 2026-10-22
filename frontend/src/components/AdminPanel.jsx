import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  ShieldAlert,
  Users,
  Link2,
  MousePointerClick,
  Activity,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [abuseReports, setAbuseReports] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeAdminTab, setActiveAdminTab] = useState('users');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, abuseRes] = await Promise.all([
        api.admin.getStats().catch(() => ({ success: false })),
        api.admin.listUsers({ search: userSearch }).catch(() => ({ success: false })),
        api.admin.listAbuse().catch(() => ({ success: false })),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (abuseRes.success) setAbuseReports(abuseRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userSearch]);

  const handleToggleUser = async (userId) => {
    try {
      const res = await api.admin.toggleUser(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: res.data.isActive } : u))
        );
      }
    } catch (err) {
      alert(`Could not toggle user status: ${err.message}`);
    }
  };

  const handleAbuseAction = async (reportId, action) => {
    try {
      const res = await api.admin.actionAbuse(reportId, action);
      if (res.success) {
        setAbuseReports((prev) => prev.filter((r) => r._id !== reportId));
        fetchData();
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Owner Superadmin Console</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Platform Administration
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Audit system metrics, moderate user accounts, and resolve abuse reports.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalUsers ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Short Links</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalLinks ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Redirects</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalClicks ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Abuse Reports</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{abuseReports.length}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeAdminTab === 'users'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('abuse')}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeAdminTab === 'abuse'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Abuse & Flagged Links ({abuseReports.length})</span>
        </button>
      </div>

      {activeAdminTab === 'users' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-4 p-5 transition-colors">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name or email address..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 uppercase font-bold">
                        {u.plan || 'pro'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUser(u._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          u.isActive !== false
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.isActive !== false ? 'Suspend Account' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeAdminTab === 'abuse' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Reported Flagged Links Queue ({abuseReports.length})
          </div>

          {abuseReports.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto" />
              <p>No open abuse reports. All short links in compliance.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {abuseReports.map((report) => (
                <div key={report._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">/{report.shortCode}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {report.reason || 'Malicious / Phishing'}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 max-w-lg">
                      {report.details || 'User flagged this URL for potential policy violations.'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Reported on {new Date(report.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAbuseAction(report._id, 'ban')}
                      className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Ban & Delete Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAbuseAction(report._id, 'dismiss')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
