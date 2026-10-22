import React, { useState } from 'react';
import { BulkShortener } from './BulkShortener.jsx';
import { UtmBuilder } from './UtmBuilder.jsx';
import { Files, Target, Sparkles } from 'lucide-react';

export function CampaignTools({ onOpenAnalytics, onOpenQr, onLinkCreated }) {
  const [selectedTool, setSelectedTool] = useState('bulk');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Power Tools Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            Campaign & Batch Acceleration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Shorten dozens of destination links simultaneously or generate standardized Google Analytics UTM parameters.
          </p>
        </div>

        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedTool('bulk')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTool === 'bulk'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            <span>Bulk Shortener</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTool('utm')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTool === 'utm'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>UTM Campaign Builder</span>
          </button>
        </div>
      </div>

      {selectedTool === 'bulk' ? (
        <BulkShortener onOpenAnalytics={onOpenAnalytics} onOpenQr={onOpenQr} />
      ) : (
        <UtmBuilder onLinkCreated={onLinkCreated} onOpenAnalytics={onOpenAnalytics} />
      )}
    </div>
  );
}
