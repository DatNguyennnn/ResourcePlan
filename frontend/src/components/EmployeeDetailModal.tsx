'use client';
import { useEffect, useState, useRef } from 'react';
import { X, AlertTriangle, Pencil, Check, XCircle } from 'lucide-react';
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
  const [successMsg, setSuccessMsg] = useState('');
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
    setSuccessMsg('');
  }, [employeeId]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 2500);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

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
    setSuccessMsg('');
  };

  const handleSave = async () => {
    if (!editing || !employeeId || !data) return;
    const newPct = parseInt(editValue) || 0;
    if (newPct < 0 || newPct > 200) {
      setWarning('Giá trị phải từ 0 đến 200%');
      return;
    }

    if (newPct === Math.round(editing.currentValue * 100)) {
      setEditing(null);
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
      } else {
        setSuccessMsg(`Đã cập nhật thành ${newPct}%`);
      }

      loadData();
      onDataChanged?.();
      setEditing(null);
    } catch (err: any) {
      setWarning(err.response?.data?.detail || 'Lỗi khi cập nhật phân bổ');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setWarning('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-white dark:from-slate-800 dark:to-slate-800">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">
              {data?.employee.name || 'Đang tải...'}
            </h2>
            <div className="flex items-center gap-3">
              {data && <p className="text-sm text-gray-500 dark:text-slate-400">{data.employee.department}</p>}
              {isAdmin && (
                <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                  <Pencil size={10} /> Click vào ô để chỉnh sửa %
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div className="mx-4 mt-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-3 flex items-center gap-2">
            <Check size={16} className="text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-300">{successMsg}</span>
          </div>
        )}

        {/* Warning banner */}
        {warning && (
          <div className="mx-4 mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-amber-800 dark:text-amber-300">{warning}</span>
            <button onClick={() => setWarning('')} className="ml-auto text-amber-600 dark:text-amber-400 hover:text-amber-800 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : data && data.projects.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-700">
                  <th className="sticky left-0 bg-gray-100 dark:bg-slate-700 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-slate-300">
                    Dự án
                  </th>
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
                            <div className="flex items-center justify-center gap-0.5">
                              <input
                                ref={inputRef}
                                type="number"
                                min="0"
                                max="200"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={saving}
                                className="w-14 h-8 text-center text-xs border-2 border-blue-500 rounded-md bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                              />
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={handleSave}
                                  disabled={saving}
                                  className="p-0.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer"
                                  title="Lưu (Enter)"
                                >
                                  <Check size={10} />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-0.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors cursor-pointer"
                                  title="Hủy (Esc)"
                                >
                                  <XCircle size={10} />
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={w}
                          className={`allocation-cell ${getAllocClass(val)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset transition-all duration-150' : ''}`}
                          onClick={() => handleCellClick(proj, w)}
                          title={isAdmin ? `Click để chỉnh sửa (hiện tại: ${Math.round(val * 100)}%)` : undefined}
                        >
                          {val > 0 ? `${Math.round(val * 100)}%` : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-gray-50 dark:bg-slate-700/50 font-bold">
                  <td className="sticky left-0 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 text-xs text-gray-900 dark:text-slate-200">
                    Tổng
                  </td>
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
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-slate-500">
              <p>Không có dữ liệu phân bổ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
