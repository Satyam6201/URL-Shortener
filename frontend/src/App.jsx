import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { HeroShortener } from './components/HeroShortener.jsx';
import { HomeFeatures } from './components/HomeFeatures.jsx';
import { DashboardView } from './components/DashboardView.jsx';
import { CampaignTools } from './components/CampaignTools.jsx';
import { DeepAnalytics } from './components/DeepAnalytics.jsx';
import { DeveloperPortal } from './components/DeveloperPortal.jsx';
import { AdminPanel } from './components/AdminPanel.jsx';
import { AnalyticsModal } from './components/AnalyticsModal.jsx';
import { QrModal } from './components/QrModal.jsx';
import { EditLinkModal } from './components/EditLinkModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { StatusPage } from './components/StatusPages.jsx';

export function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shorten');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [analyticsCode, setAnalyticsCode] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [editLink, setEditLink] = useState(null);

  const [statusPageInfo, setStatusPageInfo] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || '';
    const time = params.get('time') || '';

    if (path === '/not-found') {
      setStatusPageInfo({ type: 'not-found', code });
    } else if (path === '/expired') {
      setStatusPageInfo({ type: 'expired', code });
    } else if (path === '/disabled') {
      setStatusPageInfo({ type: 'disabled', code });
    } else if (path === '/scheduled') {
      setStatusPageInfo({ type: 'scheduled', code, time });
    } else if (path === '/limit-reached') {
      setStatusPageInfo({ type: 'limit-reached', code });
    } else if (path === '/protected') {
      setStatusPageInfo({ type: 'protected', code });
    } else if (path === '/preview') {
      setStatusPageInfo({ type: 'preview', code });
    }
  }, []);

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setStatusPageInfo(null);
    setActiveTab('shorten');
  };

  if (statusPageInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            handleGoHome();
            setActiveTab(tab);
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <StatusPage
            type={statusPageInfo.type}
            code={statusPageInfo.code}
            time={statusPageInfo.time}
            onGoHome={handleGoHome}
          />
        </main>
        {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white transition-colors duration-300 relative bg-grid-pattern overflow-x-hidden">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-teal-500/15 to-emerald-400/10 dark:from-teal-500/10 dark:to-cyan-500/10 rounded-full blur-[140px] animate-float-slow" />
        <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/05 dark:to-teal-500/05 rounded-full blur-[130px] animate-float-slow" style={{ animationDelay: '-3.5s' }} />
        <div className="absolute -bottom-32 left-10 w-[450px] h-[450px] bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-900/10 rounded-full blur-[140px] animate-float-slow" style={{ animationDelay: '-5s' }} />
      </div>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1 pb-20 animate-fade-in">
        {activeTab === 'shorten' && (
          <div className="animate-fade-in-up">
            <HeroShortener
              onLinkCreated={() => {}}
              onOpenAnalytics={(code) => setAnalyticsCode(code)}
              onOpenQr={(link) => setQrLink(link)}
            />

            <HomeFeatures
              onSelectTab={setActiveTab}
              onOpenAuth={() => setAuthModalOpen(true)}
              user={user}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in-up">
            <DashboardView
              onOpenAnalytics={(code) => setAnalyticsCode(code)}
              onOpenQr={(link) => setQrLink(link)}
              onOpenEdit={(link) => setEditLink(link)}
              onSwitchToShorten={() => setActiveTab('shorten')}
            />
          </div>
        )}

        {(activeTab === 'tools' || activeTab === 'bulk' || activeTab === 'utm') && (
          <div className="animate-fade-in-up">
            <CampaignTools
              onOpenAnalytics={(code) => setAnalyticsCode(code)}
              onOpenQr={(link) => setQrLink(link)}
              onLinkCreated={() => {}}
            />
          </div>
        )}

        {activeTab === 'live' && (
          <div className="animate-fade-in-up">
            <DeepAnalytics />
          </div>
        )}

        {activeTab === 'developer' && (
          <div className="animate-fade-in-up">
            <DeveloperPortal />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-fade-in-up">
            <AdminPanel />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-850/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl py-12 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-8">
            <div className="flex items-center space-x-3">
              <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                Snip<span className="text-teal-600 dark:text-teal-400">URL</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Modern URL Shortener, Fast Edge Redirection & Live Telemetry
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab('shorten')}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                Shortener
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                >
                  My Links
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                Live Stream
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tools')}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                Campaign Tools
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('developer')}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
              >
                API & Docs
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 dark:text-slate-500 text-[11px]">
            <div>
              Crafted by{' '}
              <strong className="text-slate-800 dark:text-slate-300 font-bold">Satyam Kumar Mishra</strong>
            </div>
            <div>
              © 2026 SnipURL. Fast, private, and collision-free.
            </div>
          </div>
        </div>
      </footer>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

      {analyticsCode && (
        <AnalyticsModal
          shortCode={analyticsCode}
          onClose={() => setAnalyticsCode(null)}
        />
      )}

      {qrLink && (
        <QrModal
          link={qrLink}
          onClose={() => setQrLink(null)}
        />
      )}

      {editLink && (
        <EditLinkModal
          link={editLink}
          onClose={() => setEditLink(null)}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
}
