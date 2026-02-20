import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'error':   return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'warning': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      default:        return 'border-white/10 bg-white/5 text-zinc-300';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✓';
      case 'error':   return '✕';
      case 'warning': return '!';
      default:        return 'i';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-4 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-[10000] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 sm:px-5 py-3 rounded-xl border backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-12 fade-in duration-300 max-w-full sm:max-w-sm ${getToastStyles(t.type)}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black flex-shrink-0">
              {getIcon(t.type)}
            </span>
            <span className="text-[11px] font-bold tracking-wide break-words">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4">
          <div className="max-w-md w-full bg-zinc-950 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_40px_80px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-300">
            <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-8">{confirmState.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(true)}
                className="flex-1 h-[46px] bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center"
              >
                Confirm
              </button>
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 h-[46px] border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:text-white hover:border-white/20 transition-all flex items-center justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
