'use client';
import { useEffect, useState, useRef } from 'react';
import { X, AlertTriangle, Pencil } from 'lucide-react';
import { fetchEmployeeDetail, bulkCreateAllocation, type EmployeeDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  employeeId: number | null;
  onClose: () => void;
  onDataChanged?: () => void;
}

function getAllocClass(value: number): string {
  if (value >= 1.0) return 'alloc-100';
  if (value >= 0.8) return 'alloc-80';
  if (value >= 0.6) return 'alloc-60';
  if (value >= 0.4) return 'alloc-40';
  if (value > 0) return 'alloc-20';
  return 'alloc-0';
}

interface EditingCell {
  projectCode: string;
  projectId: number;
  week: string;
  currentValue: number;
}

export default function EmployeeDetailModal({ employeeId, onClose, onDataChanged }: Props) {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [warning, setWarning] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    if (!employeeId) return;
    setLoading(true);
    fetchEmployeeDetail(employeeId)
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    setEditing(null);
    setWarning('');
  }, [employeeId]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleCellClick = (proj: EmployeeDetail['projects'][0], week: string) => {
    if (!isAdmin) return;
    const val = proj.weeks[week] ?? 0;
    setEditing({
      projectCode: proj.project_code,
      projectId: proj.project_id,
      week,
      currentValue: val,
    });
    setEditValue(String(Math.round(val * 100)));
    setWarning('');
  };

  const handleSave = async () => {
    if (!editing || !employeeId || !data) return;
    const newPct = parseInt(editValue) || 0;
    if (newPct < 0 || newPct > 200) {
      setWarning('Gia tri phai tu 0 den 200%');
      return;
    }

    setSaving(true);
    setWarning('');
    try {
      const result = await bulkCreateAllocation({
        employee_id: employeeId,
        project_id: editing.projectId,
        allocations: { [editing.week]: newPct / 100 },
      });

      if (result.warnings && result.warnings.length > 0) {
        setWarning(result.warnings.join('; '));
      }

      // Reload data
      loadData();
      onDataChanged?.();
      setEditing(null);
    } catch (err: any) {
      setWarning(err.response?.data?.detail || 'Loi khi cap nhat phan bo');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditing(null);
      setWarning('');
    }
  };

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">{data?.employee.name || 'Loading...'}</h2>
            <div className="flex items-center gap-3">
              {data && <p className="text-sm text-gray-500 dark:text-slate-400">{data.employee.department}</p>}
              {isAdmin && <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1"><Pencil size={10} /> Click vao o de chinh sua %</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-slate-300">
            <X size={20} />
          </button>
        </div>

        {/* Warning banner */}
        {warning && (
          <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-amber-800 dark:text-amber-300">{warning}</span>
            <button onClick={() => setWarning('')} className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-800"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <p className="text-gray-500 dark:text-slate-400">Dang tai...</p>
          ) : data && data.projects.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-700">
                  <th className="sticky left-0 bg-gray-100 dark:bg-slate-700 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-300">Du an</th>
                  {data.weeks.map((w) => (
                    <th key={w} className="px-1 py-2 text-center text-xs font-medium whitespace-nowrap text-gray-700 dark:text-slate-300">
                      {new Date(w).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.projects.map((proj) => (
                  <tr key={proj.project_code} className="border-b border-gray-100 dark:border-slate-700">
                    <td className="sticky left-0 bg-white dark:bg-slate-800 px-3 py-1 whitespace-nowrap font-medium text-xs text-gray-900 dark:text-slate-200">
                      {proj.project_name}
                    </td>
                    {data.weeks.map((w) => {
                      const val = proj.weeks[w] ?? 0;
                      const isEditing = editing?.projectCode === proj.project_code && editing?.week === w;

                      if (isEditing) {
                        return (
                          <td key={w} className="p-0">
                            <input
                              ref={inputRef}
                              type="number"
                              min="0"
                              max="200"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleSave}
                              disabled={saving}
                              className="w-16 h-8 text-center text-xs border-2 border-blue-500 rounded bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none"
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={w}
                          className={`allocation-cell ${getAllocClass(val)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''}`}
                          onClick={() => handleCellClick(proj, w)}
                          title={isAdmin ? `Click de chinh sua (hien tai: ${Math.round(val * 100)}%)` : undefined}
                        >
                          {val > 0 ? `${Math.round(val * 100)}%` : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-slate-700/50 font-bold">
                  <td className="sticky left-0 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 text-xs text-gray-900 dark:text-slate-200">Tong</td>
                  {data.weeks.map((w) => {
                    const total = data.projects.reduce((sum, p) => sum + (p.weeks[w] ?? 0), 0);
                    return (
                      <td key={w} className={`allocation-cell ${getAllocClass(total)}`}>
                        {total > 0 ? `${Math.round(total * 100)}%` : ''}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 dark:text-slate-400">Khong co du lieu phan bo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
