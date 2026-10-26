import React, { useState } from 'react';
import {
  Zap,
  Globe2,
  Lock,
  Radio,
  Code2,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

export function HomeFeatures({ onSelectTab, onOpenAuth, user }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const metrics = [
    { label: 'Edge Redirection', value: '< 3ms', detail: 'In-memory Redis cache hits' },
    { label: 'Namespace Scale', value: '56.8B+', detail: 'Collision-free Base62 IDs' },
    { label: 'Bot Traffic Filter', value: '100%', detail: 'Verified human analytics' },
    { label: 'Platform Availability', value: '99.99%', detail: 'High-availability topology' },
  ];

  const features = [
    {
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      title: 'Sub-3ms Edge Redirection',
      description:
        'Redirection paths bypass disk bottlenecks via distributed in-memory caching. Visitors reach your content instantly without hesitation or delay.',
      pill: 'Instant Speed',
    },
    {
      icon: Sparkles,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      title: 'AI Smart Slugs & Threat Scanner',
      description:
        'Powered by Google Gemini. Automatically suggests high-converting, readable slugs while AI heuristics inspect URLs against phishing and malware.',
      pill: 'AI Enhanced',
    },
    {
      icon: Globe2,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      title: 'Smart Geo & Device Targeting',
      description:
        'Route iOS users to the App Store, Android visitors to Google Play, and international visitors to country-specific storefronts automatically.',
      pill: 'Smart Routing',
    },
    {
      icon: Lock,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      title: 'Passcodes & Burn-on-Click Links',
      description:
        'Lock sensitive documents behind bcrypt passcodes, cap visitor counts, or generate one-time burn links that self-destruct after the first click.',
      pill: 'Privacy & Security',
    },
    {
      icon: Radio,
      color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      title: 'Live Visitor Telemetry Feed',
      description:
        'Observe clicks streamed live via Server-Sent Events (SSE) with instant geolocation, OS, browser detection, and automated crawler filtering.',
      pill: 'Real-Time Insights',
    },
    {
      icon: Code2,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      title: 'Developer REST API & Webhooks',
      description:
        'Automate link creation with production API keys. Receive signed HMAC-SHA256 webhook notifications whenever links are clicked or expire.',
      pill: 'Developer Ready',
    },
  ];

  const faqs = [
    {
      q: 'How does SnipURL achieve sub-3ms redirection latency?',
      a: 'Incoming requests to short links query an in-memory Redis cache first. On a hit, the system immediately returns an HTTP 302 redirect, while telemetry recording is handled asynchronously via in-memory message queues so visitors never experience lag.',
    },
    {
      q: 'What is the benefit of the Atomic Base62 algorithm?',
      a: 'Unlike legacy shorteners that hash URLs and frequently collide (requiring slower retry queries), SnipURL increments a high-speed counter and encodes it into 62 alphanumeric characters (0-9, a-z, A-Z), providing over 56.8 billion deterministic, collision-free codes.',
    },
    {
      q: 'How does the AI Phishing & Threat detection work?',
      a: 'Before any shortlink is generated, destination URLs undergo multi-tier security inspection: detecting homograph brand spoofing, testing high-risk top-level domains, and ensuring the destination does not point to internal private infrastructure.',
    },
    {
      q: 'Can I shorten links in bulk or use campaign UTM tracking?',
      a: 'Yes! Head to Campaign Tools to paste dozens of links simultaneously, upload CSV files, or use our UTM Campaign Builder to standardize Google Analytics parameters.',
    },
    {
      q: 'Is there a REST API for automated link shortening?',
      a: 'Yes. Every account can generate production API keys (prefixed with snip_live_) and test endpoints using our interactive OpenAPI documentation under the Developer API tab.',
    },
  ];

  return (
    <div className="space-y-24 mt-16 sm:mt-24">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-teal-500/15 hover:border-teal-500/50 hover:-translate-y-1.5 transition-all duration-300 group cursor-default relative overflow-hidden"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-mono group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:scale-105 transition-all duration-200 origin-left">
                {m.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                {m.label}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {m.detail}
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-sm">
            Engineered For Speed & Control
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything You Need For High-Converting Links
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            From lightning-fast redirects and smart AI slugs to live telemetry and campaign tracking—built to give you complete visibility over every click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-slate-900/75 border border-slate-200/90 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-none hover:shadow-2xl hover:shadow-teal-500/15 hover:border-teal-500/60 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-default relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${feat.color} group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all duration-300`}
                    >
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-teal-500/10 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200">
                      {feat.pill}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all duration-200">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-sm">
            Frictionless Experience
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            How It Works In 3 Steps
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            From raw, messy URLs into branded, tracked, and protected assets in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono font-black text-sm flex items-center justify-center border border-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-200">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Paste & Auto-Suggest</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Drop in any destination URL. Our Google Gemini integration scans safety and generates memorable, high-converting slug suggestions.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono font-black text-sm flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-200">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Configure Rules</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Add optional passcodes, click expiration caps, self-destructing burn links, or route visitors dynamically by iOS, Android, or country.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 transition-all duration-300 space-y-4 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-200">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Share & Track Live</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Distribute short links or print QR codes. Monitor clicks in real-time on the live telemetry feed with verified human traffic filtering.
            </p>
          </div>
        </div>
      </section>


      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Quick answers about speed, reliability, security, and developer integration.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                openFaq === idx
                  ? 'bg-white dark:bg-slate-900/90 border-teal-500/50 shadow-md shadow-teal-500/5'
                  : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-slate-900 dark:text-white font-bold text-sm sm:text-base cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <span className="pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                    openFaq === idx ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/35 transition-all duration-300">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Ready to create your first protected short link?
            </h2>
            <p className="text-slate-950/80 text-xs sm:text-sm font-semibold">
              Join thousands of creators, developers, and marketing teams using SnipURL for instant, collision-free redirects.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group px-7 py-4 rounded-2xl bg-slate-950 text-white hover:bg-slate-900 font-black text-xs sm:text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center space-x-2"
            >
              <span>Shorten a URL Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
