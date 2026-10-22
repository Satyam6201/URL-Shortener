import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  Sun,
  Moon,
  Link2,
  Sparkles,
  Radio,
  Files,
  Code2,
  ShieldAlert,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  BarChart3,
  Flame,
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, onOpenAuth }) {
  const { user, logout, quota } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'shorten', label: 'Shortener', icon: Link2 },
    ...(user ? [{ id: 'dashboard', label: 'My Links', icon: BarChart3 }] : []),
    { id: 'live', label: 'Live Stream', icon: Radio },
    { id: 'tools', label: 'Campaign Tools', icon: Files },
    { id: 'developer', label: 'Developer API', icon: Code2 },
  ];

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div className="flex items-center space-x-8">
          <div
            onClick={() => handleSelectTab('shorten')}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/25 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-teal-500/40 transition-all duration-300">
                <Link2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors duration-200">
                Snip<span className="bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all">URL</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-md group-hover:border-teal-500/40 transition-colors">
                Fast Edge
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center space-x-1.5 group/nav ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-500/30 shadow-sm shadow-teal-500/10 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover/nav:scale-110 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover/nav:text-teal-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3">
          
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Day and Night Theme"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:ring-2 hover:ring-teal-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group shadow-sm"
            title={theme === 'dark' ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300 text-slate-700" />
            )}
          </button>

          {user ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 pl-2.5 pr-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name || 'User'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                      {user.email}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                        {user.plan || 'Free Plan'}
                      </span>
                      {quota && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {quota.count} / {quota.limit} links
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleSelectTab('dashboard')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 text-teal-500" />
                      <span>My Links Dashboard</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleSelectTab('admin')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Platform Administration</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {user && user.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleSelectTab('admin')}
              className="w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Platform Administration</span>
            </button>
          )}

          {!user && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm text-center shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                Sign In / Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
