'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastData {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface Props {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const accentColors = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
  const Icon = icons[toast.type];
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(timer);
    }
  }, [exiting, toast.id, onRemove]);

  return (
    <div
      className={`flex items-center gap-3 pl-0 pr-3 py-3 rounded-lg border border-l-4 shadow-xl backdrop-blur-sm
        bg-white/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700
        ${accentColors[toast.type]}
        transition-all duration-300 ease-out
        ${exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-toastIn'}
      `}
    >
      <div className="pl-3">
        <Icon size={18} className={`flex-shrink-0 ${iconColors[toast.type]}`} />
      </div>
      <p className="text-sm font-medium flex-1 text-slate-800 dark:text-slate-200">{toast.message}</p>
      <button
        onClick={() => { setExiting(true); }}
        className="flex-shrink-0 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <X size={14} className="text-slate-400" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col-reverse gap-2 w-96 max-w-[calc(100vw-3rem)]">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
