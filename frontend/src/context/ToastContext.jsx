import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Error') => addToast({ title, message, type: 'error' }),
    info: (message, title = 'Notification') => addToast({ title, message, type: 'info' }),
    sparkle: (message, title = 'AI Generated') => addToast({ title, message, type: 'sparkle' }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          let borderClass = 'border-slate-200 dark:border-slate-800';
          let icon = <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
          let glowShadow = 'shadow-slate-900/10 dark:shadow-none';

          if (t.type === 'success') {
            borderClass = 'border-emerald-500/40 bg-emerald-50/95 dark:bg-slate-900/95';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse flex-shrink-0" />;
            glowShadow = 'shadow-lg shadow-emerald-500/10';
          } else if (t.type === 'error') {
            borderClass = 'border-rose-500/40 bg-rose-50/95 dark:bg-slate-900/95';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
            glowShadow = 'shadow-lg shadow-rose-500/10';
          } else if (t.type === 'sparkle') {
            borderClass = 'border-teal-500/40 bg-teal-50/95 dark:bg-slate-900/95';
            icon = <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0 animate-spin" style={{ animationDuration: '4s' }} />;
            glowShadow = 'shadow-lg shadow-teal-500/15';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start space-x-3 text-slate-900 dark:text-white ${borderClass} ${glowShadow} animate-scale-in`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && <div className="text-xs font-bold leading-none mb-1">{t.title}</div>}
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words font-medium">
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      sparkle: () => {},
    };
  }
  return context;
}
