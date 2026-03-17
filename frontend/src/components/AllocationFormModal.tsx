'use client';
import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { fetchEmployees, fetchProjects, fetchAllocations, bulkCreateAllocation, type Employee, type Project } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function getMondays(from: Date, to: Date): string[] {
  const mondays: string[] = [];
  const d = new Date(from);
  // Move to Monday
  const day = d.getDay();
  const diff = day === 0 ? 1 : (day === 1 ? 0 : 8 - day);
  d.setDate(d.getDate() + diff);

  while (d <= to) {
    mondays.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

export default function AllocationFormModal({ open, onClose, onSuccess }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [percentage, setPercentage] = useState<number>(100);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [currentLoad, setCurrentLoad] = useState<number | null>(null);
  const [checkingLoad, setCheckingLoad] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees().then(setEmployees);
      fetchProjects().then(setProjects);
      // Reset form
      setEmployeeId('');
      setProjectId('');
      setPercentage(100);
      setDateFrom('');
      setDateTo('');
      setError('');
      setWarnings([]);
      setCurrentLoad(null);
    }
  }, [open]);

  // Check current load when employee or date changes
  useEffect(() => {
    if (!employeeId || !dateFrom) {
      setCurrentLoad(null);
      return;
    }
    setCheckingLoad(true);
    const checkDate = dateFrom;
    fetchAllocations({ employee_id: String(employeeId), week_from: checkDate, week_to: dateTo || checkDate })
      .then((allocs: any[]) => {
        // Sum allocations per week, find max
        const weekTotals: Record<string, number> = {};
        for (const a of allocs) {
          const w = a.week_start;
          weekTotals[w] = (weekTotals[w] || 0) + a.allocation_percentage;
        }
        const maxLoad = Object.values(weekTotals).length > 0
          ? Math.max(...Object.values(weekTotals))
          : 0;
        setCurrentLoad(maxLoad);
      })
      .catch(() => setCurrentLoad(null))
      .finally(() => setCheckingLoad(false));
  }, [employeeId, dateFrom, dateTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !projectId || !dateFrom || !dateTo) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (new Date(dateTo) < new Date(dateFrom)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    setLoading(true);
    setError('');
    setWarnings([]);

    try {
      const mondays = getMondays(new Date(dateFrom), new Date(dateTo));
      if (mondays.length === 0) {
        setError('Không có tuần nào trong khoảng thời gian này.');
        setLoading(false);
        return;
      }

      const allocations: Record<string, number> = {};
      for (const monday of mondays) {
        allocations[monday] = percentage / 100; // Convert to decimal
      }

      const result = await bulkCreateAllocation({
        employee_id: employeeId as number,
        project_id: projectId as number,
        allocations,
      });

      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi tạo phân bổ.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceClose = () => {
    // Close after warnings shown - data was already saved
    onSuccess();
    onClose();
  };

  if (!open) return null;

  const isOverloaded = currentLoad !== null && currentLoad >= 1.0;
  const selectedEmpName = employees.find(e => e.id === employeeId)?.full_name || '';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-white dark:from-slate-800 dark:to-slate-800 rounded-t-xl">
          <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">Phân bổ nhân viên vào dự án</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Overload Warning */}
          {isOverloaded && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Cảnh báo:</strong> {selectedEmpName} đang được phân bổ <strong>{Math.round(currentLoad! * 100)}%</strong> trong khoảng thời gian này.
                Thêm phân bổ sẽ vượt quá 100%. Vẫn có thể tiếp tục nhưng nhân viên sẽ bị quá tải.
              </div>
            </div>
          )}

          {/* Employee Select */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Nhân viên</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.department})</option>
              ))}
            </select>
          </div>

          {/* Project Select */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Dự án</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.project_name} [{proj.project_code}]</option>
              ))}
            </select>
          </div>

          {/* Percentage */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Tỷ lệ phân bổ (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            />
            {currentLoad !== null && !checkingLoad && (
              <p className="text-xs mt-1 text-gray-500 dark:text-slate-400">
                Hiện tại: {Math.round(currentLoad * 100)}% | Sau khi thêm: {Math.round(currentLoad * 100) + percentage}%
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          {dateFrom && dateTo && new Date(dateTo) >= new Date(dateFrom) && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Sẽ phân bổ cho <strong>{getMondays(new Date(dateFrom), new Date(dateTo)).length}</strong> tuần (tính theo ngày thứ Hai)
            </p>
          )}

          {/* Server warnings (overload after save) */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Phân bổ thành công nhưng có cảnh báo:</span>
              </div>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-5">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
              <button
                type="button"
                onClick={handleForceClose}
                className="mt-3 w-full bg-amber-600 text-white py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Đã hiểu, đóng lại
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {warnings.length === 0 && (
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : 'Phân bổ'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 dark:border-slate-600 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
