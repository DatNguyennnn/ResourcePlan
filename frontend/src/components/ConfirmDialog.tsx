'use client';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center animate-backdropIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-modalIn overflow-hidden">
        {/* Icon + Title */}
        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            isDanger
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            <AlertTriangle size={24} className={isDanger ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
        </div>
        {/* Actions */}
        <div className="px-6 pb-6 pt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer ${
              isDanger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
