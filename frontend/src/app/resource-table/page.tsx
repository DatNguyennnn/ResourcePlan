'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import Chatbot from '@/components/Chatbot';
import ResourceTable from '@/components/ResourceTable';
import EmployeeDetailModal from '@/components/EmployeeDetailModal';
import AllocationFormModal from '@/components/AllocationFormModal';
import { fetchResourceTable, type ResourceTableData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Search, Plus, Calendar } from 'lucide-react';

export default function ResourceTablePage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ResourceTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [weekFrom, setWeekFrom] = useState('');
  const [weekTo, setWeekTo] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  const loadData = useCallback(() => {
    const params: Record<string, string> = {};
    if (department) params.department = department;
    if (employeeName) params.employee_name = employeeName;
    if (weekFrom) params.week_from = weekFrom;
    if (weekTo) params.week_to = weekTo;

    setLoading(true);
    fetchResourceTable(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [department, employeeName, weekFrom, weekTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <PageHeader title="Phân bổ Nhân Lực">
          {isAdmin && (
            <button
              onClick={() => setShowAllocForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus size={16} /> Phân bổ nhân viên
            </button>
          )}
        </PageHeader>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả phòng ban</option>
            <option value="P.Kỹ thuật IBS">P.Kỹ thuật IBS</option>
            <option value="P.Nghiệp vụ IBS">P.Nghiệp vụ IBS</option>
            <option value="P.Phát triển phần mềm">P.Phát triển phần mềm</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={weekFrom}
              onChange={(e) => setWeekFrom(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              title="Từ ngày"
            />
            <span className="text-gray-400 text-sm">đến</span>
            <input
              type="date"
              value={weekTo}
              onChange={(e) => setWeekTo(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
              title="Đến ngày"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : data ? (
          <>
            <div className="mb-3 flex gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded alloc-100 inline-block"></span> 100%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded alloc-80 inline-block"></span> 80-99%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded alloc-60 inline-block"></span> 60-79%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded alloc-40 inline-block"></span> 40-59%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded alloc-20 inline-block"></span> &lt;40%</span>
              {isAdmin && <span className="text-blue-500 dark:text-blue-400 ml-2">Click ô dự án để chỉnh sửa %</span>}
            </div>
            <ResourceTable data={data} onEmployeeClick={setSelectedEmployee} editable onDataChanged={loadData} showAllWeeks={!!(weekFrom || weekTo)} />
          </>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Không có dữ liệu.</p>
        )}

        <EmployeeDetailModal employeeId={selectedEmployee} onClose={() => setSelectedEmployee(null)} onDataChanged={loadData} />
        <AllocationFormModal open={showAllocForm} onClose={() => setShowAllocForm(false)} onSuccess={loadData} />
      </main>
      <Chatbot />
    </div>
  );
}
