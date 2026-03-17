'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchOverloaded, type OverloadEntry } from '@/lib/api';

export default function OverloadWarning() {
  const [overloaded, setOverloaded] = useState<OverloadEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const today = new Date();
    const weekFrom = new Date(today);
    weekFrom.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekTo = new Date(weekFrom);
    weekTo.setDate(weekFrom.getDate() + 28); // 4 weeks ahead

    fetchOverloaded({
      week_from: weekFrom.toISOString().split('T')[0],
      week_to: weekTo.toISOString().split('T')[0],
    }).then(setOverloaded).catch(() => {});
  }, []);

  if (overloaded.length === 0) return null;

  // Group by employee
  const grouped = overloaded.reduce((acc, item) => {
    if (!acc[item.employee_name]) acc[item.employee_name] = [];
    acc[item.employee_name].push(item);
    return acc;
  }, {} as Record<string, OverloadEntry[]>);

  return (
    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
        <span className="text-sm font-medium text-red-700 dark:text-red-400 flex-1">
          CANH BAO: {Object.keys(grouped).length} nhan vien dang bi qua tai (&gt;100%) trong 4 tuan toi
        </span>
        {expanded ? <ChevronUp size={16} className="text-red-500" /> : <ChevronDown size={16} className="text-red-500" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {Object.entries(grouped).map(([name, entries]) => (
            <div key={name} className="bg-white dark:bg-slate-800 rounded p-2 border border-red-100 dark:border-red-900">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{name} ({entries[0].department})</p>
              {entries.map((e, i) => (
                <div key={i} className="text-xs text-red-600 dark:text-red-400 ml-4 mt-1">
                  Tuan {new Date(e.week).toLocaleDateString('vi-VN')}: <strong>{Math.round(e.total_percentage * 100)}%</strong>
                  {' - '}
                  {e.projects.map(p => `${p.name} (${Math.round(p.percentage * 100)}%)`).join(', ')}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
