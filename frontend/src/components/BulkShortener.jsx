import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Files,
  Upload,
  Download,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Folder,
  Clock,
  Sparkles,
} from 'lucide-react';

export function BulkShortener({ onOpenAnalytics, onOpenQr }) {
  const { refreshQuota } = useAuth();
  const toast = useToast();
  const [inputMode, setInputMode] = useState('text');
  const [urlsText, setUrlsText] = useState('');
  const [category, setCategory] = useState('General');
  const [expiryOption, setExpiryOption] = useState('never');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith('http://') || l.startsWith('https://'));

      if (lines.length > 0) {
        setUrlsText(lines.join('\n'));
        toast.info(`Loaded ${lines.length} URLs from ${file.name}`);
      } else {
        setError('No valid URLs found in file. Ensure each line begins with http:// or https://');
        toast.error('No valid URLs found in file');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const rawLines = urlsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) {
      setError('Please provide at least one valid destination URL');
      return;
    }

    if (rawLines.length > 100) {
      setError('Bulk creation supports up to 100 links per batch');
      return;
    }

    setLoading(true);

    try {
      let expiresAt = null;
      const now = new Date();
      if (expiryOption === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
      else if (expiryOption === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      else if (expiryOption === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      else if (expiryOption === '30d') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const items = rawLines.map((line) => {
        const parts = line.split(',');
        const originalUrl = parts[0].trim();
        const customAlias = parts[1] ? parts[1].trim() : undefined;
        return {
          originalUrl,
          customAlias,
          category,
          expiresAt,
        };
      });

      const res = await api.urls.bulkCreate(items);
      if (res.success) {
        setResults(res.data);
        await refreshQuota();
        toast.success(`Successfully shortened ${res.data.length} links!`);
      }
    } catch (err) {
      setError(err.message || 'Bulk shortening request failed');
      toast.error(err.message || 'Bulk shortening request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySingle = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    const allLinks = results.map((r) => r.shortUrl).join('\n');
    navigator.clipboard.writeText(allLinks);
    setAllCopied(true);
    toast.success(`Copied ${results.length} links to clipboard!`);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (results.length === 0) return;
    const header = 'Original URL,Short URL,Short Code\n';
    const rows = results
      .map((r) => `"${r.originalUrl}","${r.shortUrl}","${r.shortCode}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `snipurl-bulk-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported bulk links CSV!');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold">
          <Files className="w-3.5 h-3.5" />
          <span>Batch Processing • Up to 100 Links</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Bulk URL Shortener
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Shorten multiple destination links simultaneously via multi-line paste or CSV spreadsheet upload with instant results.
        </p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'text'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              Paste Multi-Line URLs
            </button>
            <button
              type="button"
              onClick={() => setInputMode('csv')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'csv'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              Upload CSV File
            </button>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {urlsText.split(/\r?\n/).filter(Boolean).length} URLs queued
          </span>
        </div>

        <form onSubmit={handleBulkSubmit} className="space-y-5">
          {inputMode === 'text' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Destination URLs (one per line, optional format: https://example.com,custom-slug)
              </label>
              <textarea
                rows={6}
                required
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder="https://example.com/item1&#10;https://example.com/item2&#10;https://example.com/item3,flash-sale"
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950/50">
              <Upload className="w-8 h-8 text-teal-500 dark:text-teal-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Click or drag a CSV file to upload</p>
                <p className="text-xs text-slate-500 mt-1">Each row should contain a valid HTTP or HTTPS URL.</p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="inline-block px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 font-semibold text-xs cursor-pointer border border-teal-500/20 transition-colors"
              >
                Select CSV File
              </label>
              {urlsText && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {urlsText.split(/\r?\n/).filter(Boolean).length} URLs loaded into memory
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                <span>Batch Category</span>
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

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Batch Expiry</span>
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
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !urlsText.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Short Codes in Parallel...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process & Generate All Links</span>
              </>
            )}
          </button>
        </form>

        {results.length > 0 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>Successfully Created {results.length} Short Links</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{allCopied ? 'All Copied!' : 'Copy All URLs'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-mono border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Short URL</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {r.shortUrl}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-xs font-sans">
                        {r.originalUrl}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(idx, r.shortUrl)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={r.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
                            title="Test redirect"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
