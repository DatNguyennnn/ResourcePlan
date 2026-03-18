'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelect({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = selected.length === 0
    ? 'Tất cả'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} đã chọn`;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-1 w-full min-w-[130px] border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
      >
        <span className="truncate text-left">{displayText}</span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {selected.length > 0 && (
            <span
              onClick={clearAll}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg animate-slideDown">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">Không có dữ liệu</p>
          ) : (
            options.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="truncate text-slate-700 dark:text-slate-200">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
