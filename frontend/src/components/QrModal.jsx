import React, { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';

export function QrModal({ link, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!link.qrCodeData) return;
    const a = document.createElement('a');
    a.href = link.qrCodeData;
    a.download = `qr-${link.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">QR Code</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">/{link.shortCode}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white mx-auto inline-block shadow-md border border-slate-100">
          {link.qrCodeData ? (
            <img
              src={link.qrCodeData}
              alt={`QR Code for ${link.shortCode}`}
              className="w-48 h-48 mx-auto"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              No QR data available
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold break-all">
            {link.shortUrl}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mx-auto">
            {link.originalUrl}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-md shadow-teal-500/20"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
