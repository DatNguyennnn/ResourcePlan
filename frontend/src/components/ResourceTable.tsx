'use client';
import { Fragment, useState, useMemo } from 'react';
import { ChevronRight, Check, X } from 'lucide-react';
import type { ResourceTableData, EmployeeDetail } from '@/lib/api';
import { fetchEmployeeDetail, bulkCreateAllocation } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function getAllocClass(value: number): string {
  if (value >= 1.0) return 'alloc-100';
  if (value >= 0.8) return 'alloc-80';
  if (value >= 0.6) return 'alloc-60';
  if (value >= 0.4) return 'alloc-40';
  if (value > 0) return 'alloc-20';
  return 'alloc-0';
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface Props {
  data: ResourceTableData;
  onEmployeeClick?: (empId: number) => void;
  editable?: boolean;
  onDataChanged?: () => void;
}

export default function ResourceTable({ data, onEmployeeClick, editable = false, onDataChanged }: Props) {
  const { isAdmin } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [details, setDetails] = useState<Record<number, EmployeeDetail>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ projectId: number; week: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof data.employees> = {};
    for (const emp of data.employees) {
      const dept = emp.department || 'Khác';
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(emp);
    }
    return groups;
  }, [data.employees]);

  const handleToggle = async (empId: number) => {
    if (expandedIds.has(empId)) {
      setExpandedIds(prev => { const next = new Set(prev); next.delete(empId); return next; });
      setDetails(prev => { const next = { ...prev }; delete next[empId]; return next; });
      return;
    }
    setExpandedIds(prev => new Set(prev).add(empId));
    setLoadingIds(prev => new Set(prev).add(empId));
    setEditingCell(null);
    try {
      const d = await fetchEmployeeDetail(empId);
      setDetails(prev => ({ ...prev, [empId]: d }));
    } catch {
      // ignore
    } finally {
      setLoadingIds(prev => { const next = new Set(prev); next.delete(empId); return next; });
    }
  };

  const canEdit = editable && isAdmin;

  const handleCellClick = (projectId: number, week: string, currentVal: number) => {
    if (!canEdit) return;
    setEditingCell({ projectId, week });
    setEditValue(currentVal > 0 ? String(Math.round(currentVal * 100)) : '0');
  };

  // Track which employee owns the current edit
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);

  const handleSave = async () => {
    if (!editingCell || !editingEmpId) return;
    const numVal = parseInt(editValue) || 0;
    const pct = Math.max(0, Math.min(200, numVal)) / 100;

    setSaving(true);
    try {
      await bulkCreateAllocation({
        employee_id: editingEmpId,
        project_id: editingCell.projectId,
        allocations: { [editingCell.week]: pct },
      });
      const d = await fetchEmployeeDetail(editingEmpId);
      setDetails(prev => ({ ...prev, [editingEmpId!]: d }));
      onDataChanged?.();
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditingCell(null);
      setEditingEmpId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditingCell(null);
  };

  if (!data.employees.length) {
    return <p className="text-slate-500 dark:text-slate-400 text-sm p-4">Không có dữ liệu phân bổ.</p>;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Summary header */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tổng: <strong>{data.employees.length}</strong> nhân viên · <strong>{data.weeks.length}</strong> tuần
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap min-w-[150px]">
                Nhân viên / DA
              </th>
              {data.weeks.map((w) => (
                <th
                  key={w}
                  className="px-0.5 py-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[44px]"
                >
                  {formatWeek(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="animate-fadeIn">
            {Object.entries(grouped).map(([dept, employees]) => (
              <Fragment key={dept}>
                {/* Department header */}
                <tr className="bg-slate-100/70 dark:bg-slate-700/30">
                  <td
                    colSpan={data.weeks.length + 1}
                    className="sticky left-0 px-3 py-1 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide"
                  >
                    {dept} ({employees.length})
                  </td>
                </tr>

                {employees.map((emp) => {
                  const isExpanded = expandedIds.has(emp.id);
                  const isLoading = loadingIds.has(emp.id);
                  const empDetail = details[emp.id];
                  return (
                    <Fragment key={emp.id}>
                      {/* Employee row */}
                      <tr className="border-b border-slate-100 dark:border-slate-700/50">
                        <td
                          className="sticky left-0 bg-white dark:bg-slate-800 z-10 px-3 py-1 whitespace-nowrap font-medium text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => handleToggle(emp.id)}
                        >
                          <span className="flex items-center gap-1">
                            <span className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-blue-500' : 'text-slate-400'}`}>
                              <ChevronRight size={12} />
                            </span>
                            {emp.name}
                          </span>
                        </td>
                        {data.weeks.map((w) => {
                          const val = emp.weeks[w] ?? 0;
                          return (
                            <td key={w} className={`allocation-cell ${getAllocClass(val)}`}>
                              {val > 0 ? `${Math.round(val * 100)}%` : ''}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Expanded: project detail rows */}
                      {isExpanded && (
                        isLoading ? (
                          <tr className="bg-slate-50/50 dark:bg-slate-700/10 animate-fadeIn">
                            <td colSpan={data.weeks.length + 1} className="py-2 text-center">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Đang tải...</span>
                              </div>
                            </td>
                          </tr>
                        ) : empDetail && empDetail.projects.length > 0 ? (
                          <>
                            {empDetail.projects.map((proj) => {
                              const hasData = Object.values(proj.weeks).some(v => v > 0);
                              if (!hasData && !canEdit) return null;
                              return (
                                <tr key={proj.project_code} className="bg-slate-50/50 dark:bg-slate-700/10 border-b border-slate-100/50 dark:border-slate-700/30 animate-slideDown">
                                  <td className="sticky left-0 bg-slate-50/50 dark:bg-slate-700/10 z-10 pl-8 pr-2 py-0.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                                    {proj.project_code}
                                  </td>
                                  {data.weeks.map((w) => {
                                    const val = proj.weeks[w] ?? 0;
                                    const isEditing = editingCell?.projectId === proj.project_id && editingCell?.week === w && editingEmpId === emp.id;

                                    if (isEditing) {
                                      return (
                                        <td key={w} className="allocation-cell !p-0">
                                          <div className="flex items-center justify-center gap-0.5 px-0.5">
                                            <input
                                              type="number"
                                              min={0}
                                              max={200}
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={handleEditKeyDown}
                                              autoFocus
                                              disabled={saving}
                                              className="w-9 text-center text-[11px] py-0.5 border border-blue-400 rounded bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button onClick={handleSave} disabled={saving} className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer">
                                              <Check size={10} />
                                            </button>
                                            <button onClick={() => { setEditingCell(null); setEditingEmpId(null); }} className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                                              <X size={10} />
                                            </button>
                                          </div>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={w}
                                        className={`allocation-cell alloc-sub ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''}`}
                                        onClick={() => { setEditingEmpId(emp.id); handleCellClick(proj.project_id, w, val); }}
                                      >
                                        {val > 0 ? `${Math.round(val * 100)}%` : canEdit ? '·' : ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </>
                        ) : (
                          <tr className="bg-slate-50/50 dark:bg-slate-700/10">
                            <td colSpan={data.weeks.length + 1} className="pl-8 py-1.5 text-xs text-slate-400 dark:text-slate-500">
                              Không có dữ liệu phân bổ chi tiết.
                            </td>
                          </tr>
                        )
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
