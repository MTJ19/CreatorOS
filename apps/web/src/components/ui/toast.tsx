'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-float backdrop-blur-md',
                t.type === 'success' && 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
                t.type === 'error' && 'bg-red-955/80 border-red-500/30 text-red-100',
                t.type === 'info' && 'bg-background-surface/90 border-border/80 text-foreground'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                {t.type === 'info' && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-5">{t.message}</div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-md p-0.5 text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
