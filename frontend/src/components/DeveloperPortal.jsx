import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Code2,
  Key,
  Webhook,
  FileCode,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
  Terminal,
} from 'lucide-react';

export function DeveloperPortal() {
  const [activeSubTab, setActiveSubTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState(false);

  const [webhooks, setWebhooks] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['link.clicked']);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [testStatus, setTestStatus] = useState({});

  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState('');

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await api.keys.list();
      if (res.success) setKeys(res.data);
    } catch {
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const res = await api.webhooks.list();
      if (res.success) setWebhooks(res.data);
    } catch {
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setError('');
    try {
      const res = await api.keys.create(newKeyName.trim());
      if (res.success) {
        setCreatedKey(res.data.key);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (err) {
      setError(err.message || 'Failed to create API Key');
    }
  };

  const handleRevokeKey = async (keyString) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Applications using it will lose access immediately.')) {
      return;
    }
    try {
      const res = await api.keys.revoke(keyString);
      if (res.success) fetchKeys();
    } catch (err) {
      alert(`Could not revoke key: ${err.message}`);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setError('');
    try {
      const res = await api.webhooks.create({
        url: webhookUrl.trim(),
        events: webhookEvents,
      });
      if (res.success) {
        setWebhookUrl('');
        fetchWebhooks();
      }
    } catch (err) {
      setError(err.message || 'Failed to register webhook');
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      const res = await api.webhooks.delete(id);
      if (res.success) fetchWebhooks();
    } catch (err) {
      alert(`Could not delete webhook: ${err.message}`);
    }
  };

  const handleTestWebhook = async (id) => {
    setTestStatus((prev) => ({ ...prev, [id]: 'sending' }));
    try {
      const res = await api.webhooks.test(id);
      if (res.success) {
        setTestStatus((prev) => ({ ...prev, [id]: 'success' }));
      } else {
        setTestStatus((prev) => ({ ...prev, [id]: 'failed' }));
      }
    } catch {
      setTestStatus((prev) => ({ ...prev, [id]: 'failed' }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Ecosystem • REST API & Webhooks</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Developer Infrastructure
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Automate link creation, authenticate server workloads with API keys, and receive real-time webhook payloads.
          </p>
        </div>

        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Interactive OpenAPI Docs</span>
        </a>
      </div>

      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('keys')}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'keys'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('webhooks')}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'webhooks'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('snippets')}
          className={`px-4 py-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'snippets'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Code Examples</span>
        </button>
      </div>

      {activeSubTab === 'keys' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New API Key</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              API Keys authenticate machine-to-machine requests. Include them in the <code className="text-teal-600 dark:text-teal-400">X-API-Key</code> request header.
            </p>

            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Key label (e.g. Production CI/CD Server, Mobile App)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Key</span>
              </button>
            </form>

            {createdKey && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>API Key Generated Successfully:</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Copy now; this secret will not be displayed again.</span>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-white">
                  <span className="break-all">{createdKey}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="ml-3 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Active API Keys ({keys.length})
            </div>

            {loadingKeys ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading API keys...</div>
            ) : keys.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">No API keys created yet.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {keys.map((k, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{k.name}</div>
                      <div className="font-mono text-slate-500 dark:text-slate-400">
                        Prefix: <span className="text-teal-600 dark:text-teal-400">{k.key.slice(0, 12)}••••••••</span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Created on {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeKey(k.key)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Outgoing Webhook</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Receive cryptographically signed HMAC-SHA256 HTTP POST events when links are clicked, expired, or reach limits.
            </p>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Endpoint URL (HTTPS recommended)</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhooks/snipurl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Subscriptions</label>
                <div className="flex flex-wrap gap-3 text-xs">
                  {['link.clicked', 'link.expired', 'link.limit_reached'].map((ev) => (
                    <label key={ev} className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(ev)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, ev]);
                          } else {
                            setWebhookEvents(webhookEvents.filter((item) => item !== ev));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-teal-500 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                      />
                      <span className="font-mono">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Webhook</span>
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Active Webhook Subscriptions ({webhooks.length})
            </div>

            {loadingWebhooks ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading webhooks...</div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">No webhooks registered yet.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {webhooks.map((w) => (
                  <div key={w._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-teal-600 dark:text-teal-400 break-all">{w.url}</div>
                      <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                        <span>Events:</span>
                        {w.events?.map((ev) => (
                          <span key={ev} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                            {ev}
                          </span>
                        ))}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        HMAC Secret: {w.secret ? `${w.secret.slice(0, 10)}••••••••` : 'configured'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTestWebhook(w._id)}
                        disabled={testStatus[w._id] === 'sending'}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-300 font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        {testStatus[w._id] === 'sending' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {testStatus[w._id] === 'success'
                            ? 'Delivered!'
                            : testStatus[w._id] === 'failed'
                            ? 'Test Failed'
                            : 'Send Test Ping'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWebhook(w._id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'snippets' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
              <Terminal className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              <span>cURL Integration</span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-teal-300 overflow-x-auto border border-slate-800">
{`curl -X POST https://yourdomain.com/api/urls \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: snip_your_api_key_here" \\
  -d '{
    "originalUrl": "https://example.com/product/shoes",
    "customAlias": "shoes-sale"
  }'`}
            </pre>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
              <FileCode className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              <span>Node.js / JavaScript Fetch</span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800">
{`const response = await fetch("https://yourdomain.com/api/urls", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "snip_your_api_key_here"
  },
  body: JSON.stringify({
    originalUrl: "https://example.com/article",
    tags: ["tech", "blog"]
  })
});
const result = await response.json();
console.log("Short link created:", result.data.shortUrl);`}
            </pre>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
              <FileCode className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>Python (requests)</span>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
{`import requests

url = "https://yourdomain.com/api/urls"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "snip_your_api_key_here"
}
payload = {
    "originalUrl": "https://example.com/docs",
    "category": "Technology"
}

resp = requests.post(url, json=payload, headers=headers)
data = resp.json()
print("Short link:", data["data"]["shortUrl"])`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
