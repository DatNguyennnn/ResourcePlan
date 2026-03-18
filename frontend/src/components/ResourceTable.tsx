'use client';
import { Fragment, useState, useMemo, useRef } from 'react';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import type { ResourceTableData, EmployeeDetail } from '@/lib/api';
import { fetchEmployeeDetail, bulkCreateAllocation } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function getAllocClass(value: number): string {
  if (value > 1.0) return 'alloc-over';
  if (value >= 1.0) return 'alloc-100';
  if (value >= 0.8) return 'alloc-80';
  if (value >= 0.6) return 'alloc-60';
  if (value >= 0.4) return 'alloc-40';
  if (value > 0) return 'alloc-20';
  return 'alloc-0';
}

function getSubAllocClass(value: number): string {
  if (value > 1.0) return 'alloc-sub-over';
  if (value >= 1.0) return 'alloc-sub-100';
  if (value >= 0.8) return 'alloc-sub-80';
  if (value >= 0.6) return 'alloc-sub-60';
  if (value >= 0.4) return 'alloc-sub-40';
  if (value > 0) return 'alloc-sub-20';
  return 'alloc-sub-0';
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

interface Props {
  data: ResourceTableData;
  onEmployeeClick?: (empId: number) => void;
  editable?: boolean;
  onDataChanged?: () => void;
  showAllWeeks?: boolean;
}

export default function ResourceTable({ data, onEmployeeClick, editable = false, onDataChanged, showAllWeeks = false }: Props) {
  const { isAdmin } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [details, setDetails] = useState<Record<number, EmployeeDetail>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  // Local overrides for employee week totals (updated after inline edit without full reload)
  const [weekOverrides, setWeekOverrides] = useState<Record<number, Record<string, number>>>({});

  // Inline edit state
  const [editingCell, setEditingCell] = useState<{ projectId: number; week: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);

  // Month pagination: group weeks by month
  const monthGroups = useMemo(() => {
    const groups: { month: number; year: number; label: string; weeks: string[] }[] = [];
    const monthMap = new Map<string, string[]>();
    for (const w of data.weeks) {
      const d = new Date(w);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(w);
    }
    Array.from(monthMap.entries()).forEach(([key, weeks]) => {
      const [year, month] = key.split('-').map(Number);
      groups.push({ month, year, label: `${MONTH_NAMES[month]} ${year}`, weeks });
    });
    return groups;
  }, [data.weeks]);

  // Find which month contains "today" or default to first
  const currentMonthIdx = useMemo(() => {
    const now = new Date();
    const idx = monthGroups.findIndex(g => g.month === now.getMonth() && g.year === now.getFullYear());
    return idx >= 0 ? idx : 0;
  }, [monthGroups]);

  const [monthPage, setMonthPage] = useState(currentMonthIdx);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const slideKey = useRef(0);
  const visibleWeeks = showAllWeeks ? data.weeks : (monthGroups[monthPage]?.weeks ?? data.weeks);
  const monthLabel = monthGroups[monthPage]?.label ?? '';

  const goMonth = (dir: 'prev' | 'next') => {
    setSlideDir(dir === 'next' ? 'right' : 'left');
    slideKey.current += 1;
    setMonthPage(p => dir === 'next' ? Math.min(monthGroups.length - 1, p + 1) : Math.max(0, p - 1));
  };

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

  const handleSave = async () => {
    if (!editingCell || !editingEmpId) return;
    const numVal = parseInt(editValue) || 0;
    const pct = Math.max(0, Math.min(200, numVal)) / 100;
    const savedEmpId = editingEmpId;

    setSaving(true);
    try {
      await bulkCreateAllocation({
        employee_id: savedEmpId,
        project_id: editingCell.projectId,
        allocations: { [editingCell.week]: pct },
      });
      // Update detail data locally without full page reload
      const d = await fetchEmployeeDetail(savedEmpId);
      setDetails(prev => ({ ...prev, [savedEmpId]: d }));

      // Recalculate employee total weeks from project details
      // Initialize ALL visible weeks to 0 first so deleted allocations show 0 (not stale data)
      const newTotals: Record<string, number> = {};
      for (const w of data.weeks) {
        newTotals[w] = 0;
      }
      for (const proj of d.projects) {
        for (const [w, v] of Object.entries(proj.weeks)) {
          newTotals[w] = (newTotals[w] || 0) + v;
        }
      }
      setWeekOverrides(prev => ({ ...prev, [savedEmpId]: newTotals }));

      // If employee has no allocations left across ALL weeks (not just visible), refresh to remove them
      const hasAny = d.projects.some(proj => Object.values(proj.weeks).some(v => v > 0));
      if (!hasAny) {
        setExpandedIds(prev => { const next = new Set(prev); next.delete(savedEmpId); return next; });
        onDataChanged?.();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditingCell(null);
      // Keep editingEmpId so user can continue editing other cells
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
      {/* Header: summary + month navigation */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Tổng: <strong>{data.employees.length}</strong> nhân viên · <strong>{data.weeks.length}</strong> tuần
        </span>
        {monthGroups.length > 1 && !showAllWeeks && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goMonth('prev')}
              disabled={monthPage === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[100px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={() => goMonth('next')}
              disabled={monthPage === monthGroups.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              title="Tháng sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-700/50 z-10 px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap min-w-[150px]">
                Nhân viên / DA
              </th>
              {visibleWeeks.map((w) => (
                <th
                  key={w}
                  className="px-0.5 py-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[44px]"
                >
                  {formatWeek(w)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={slideKey.current} className={slideDir === 'right' ? 'animate-slideRight' : slideDir === 'left' ? 'animate-slideLeft' : 'animate-fadeIn'}>
            {Object.entries(grouped).map(([dept, employees]) => (
              <Fragment key={dept}>
                {/* Department header */}
                <tr className="bg-slate-100/70 dark:bg-slate-700/30">
                  <td
                    colSpan={visibleWeeks.length + 1}
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
                        {visibleWeeks.map((w) => {
                          const val = weekOverrides[emp.id]?.[w] ?? emp.weeks[w] ?? 0;
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
                            <td colSpan={visibleWeeks.length + 1} className="py-2 text-center">
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
                                  {visibleWeeks.map((w) => {
                                    const val = proj.weeks[w] ?? 0;
                                    const isEditing = editingCell?.projectId === proj.project_id && editingCell?.week === w && editingEmpId === emp.id;

                                    if (isEditing) {
                                      return (
                                        <td key={w} className="allocation-cell !p-0">
                                          <div className="flex items-center justify-center gap-1 px-0.5">
                                            <input
                                              type="number"
                                              min={0}
                                              max={200}
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              onKeyDown={handleEditKeyDown}
                                              autoFocus
                                              disabled={saving}
                                              className="w-10 text-center text-xs py-1 border-2 border-blue-400 rounded bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            />
                                            <button onClick={handleSave} disabled={saving} className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition-colors" title="Lưu">
                                              <Check size={14} strokeWidth={3} />
                                            </button>
                                            <button onClick={() => { setEditingCell(null); }} className="p-1 rounded bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors" title="Hủy">
                                              <X size={14} strokeWidth={3} />
                                            </button>
                                          </div>
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={w}
                                        className={`allocation-cell ${getSubAllocClass(val)} ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''}`}
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
                            <td colSpan={visibleWeeks.length + 1} className="pl-8 py-1.5 text-xs text-slate-400 dark:text-slate-500">
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
