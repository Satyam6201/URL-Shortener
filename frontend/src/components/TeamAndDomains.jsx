import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Users2,
  Globe,
  Plus,
  Trash2,
  ShieldCheck,
  Clock,
  Check,
  Copy,
  RefreshCw,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function TeamAndDomains() {
  const [activeTab, setActiveTab] = useState('team');
  const [team, setTeam] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');

  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const res = await api.teams.getMyTeam();
      if (res.success) setTeam(res.data);
    } catch {
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchDomains = async () => {
    setLoadingDomains(true);
    try {
      const res = await api.domains.list();
      if (res.success) setDomains(res.data);
    } catch {
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchDomains();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.teams.invite(inviteEmail.trim(), inviteRole);
      if (res.success) {
        setSuccessMsg(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        fetchTeam();
      }
    } catch (err) {
      setError(err.message || 'Failed to invite team member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from your team workspace?')) return;
    try {
      const res = await api.teams.removeMember(userId);
      if (res.success) fetchTeam();
    } catch (err) {
      alert(`Could not remove member: ${err.message}`);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.domains.add(newDomain.trim().toLowerCase());
      if (res.success) {
        setSuccessMsg(`Domain ${newDomain} registered! Configure DNS TXT record to verify.`);
        setNewDomain('');
        fetchDomains();
      }
    } catch (err) {
      setError(err.message || 'Failed to add custom domain');
    }
  };

  const handleVerifyDomain = async (domainId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.domains.verify(domainId);
      if (res.success) {
        setSuccessMsg(res.message || 'Domain verified successfully!');
        fetchDomains();
      }
    } catch (err) {
      setError(err.message || 'Verification check failed. Please ensure DNS TXT records have propagated.');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Delete this custom domain?')) return;
    try {
      const res = await api.domains.delete(domainId);
      if (res.success) fetchDomains();
    } catch (err) {
      alert(`Could not delete domain: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Users2 className="w-3.5 h-3.5" />
            <span>SaaS Team Workspaces & Branded Custom Domains</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Workspaces & Branded Domains
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Collaborate with team members across RBAC roles and serve short links from your company's custom branded domain.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('team');
            setError('');
            setSuccessMsg('');
          }}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'team'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Team Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('domains');
            setError('');
            setSuccessMsg('');
          }}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'domains'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Custom Branded Domains</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Add collaborators with granular role-based access control (Admin, Editor, Viewer).
            </p>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="colleague@yourcompany.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="editor">Editor (Can create & manage links)</option>
                <option value="viewer">Viewer (Read-only analytics access)</option>
                <option value="admin">Admin (Can manage team & settings)</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Send Invite</span>
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Workspace Members ({team?.members?.length || 1})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                Plan: {team?.plan || 'Business'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {team?.ownerId?.name || 'Workspace Owner'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{team?.ownerId?.email || 'owner@domain.com'}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Owner
                </span>
              </div>

              {team?.members?.map((m, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{m.userId?.name || 'Team Member'}</div>
                    <div className="text-slate-500 dark:text-slate-400">{m.userId?.email || 'member@domain.com'}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700">
                      {m.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId?._id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Branded Custom Domain</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Serve short URLs directly from your domain (e.g. <code className="text-teal-600 dark:text-teal-400">go.yourbrand.com/promo</code>).
            </p>

            <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="go.yourbrand.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Domain</span>
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Registered Custom Domains ({domains.length})
            </div>

            {loadingDomains ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading domains...</div>
            ) : domains.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">No custom domains added yet.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {domains.map((d) => (
                  <div key={d._id} className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{d.domain}</span>
                        {d.isVerified ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Verified & Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending DNS Verification
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!d.isVerified && (
                          <button
                            type="button"
                            onClick={() => handleVerifyDomain(d._id)}
                            className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Verify DNS Record</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDomain(d._id)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {!d.isVerified && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
                        <div className="text-slate-600 dark:text-slate-400 font-sans text-[11px]">
                          Create a TXT DNS record on your domain registrar with the following verification token:
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-teal-700 dark:text-teal-300">
                          <span className="break-all">{`snipurl-verify=${d.verificationToken}`}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`snipurl-verify=${d.verificationToken}`);
                              setCopiedToken(d._id);
                              setTimeout(() => setCopiedToken(null), 2000);
                            }}
                            className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          >
                            {copiedToken === d._id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
