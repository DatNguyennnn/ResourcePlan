'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Chatbot from '@/components/Chatbot';
import ResourceTable from '@/components/ResourceTable';
import EmployeeDetailModal from '@/components/EmployeeDetailModal';
import AllocationFormModal from '@/components/AllocationFormModal';
import { fetchResourceTable, type ResourceTableData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Search, Plus } from 'lucide-react';

export default function ResourceTablePage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ResourceTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [showAllocForm, setShowAllocForm] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  const loadData = useCallback(() => {
    const params: Record<string, string> = {};
    if (department) params.department = department;
    if (employeeName) params.employee_name = employeeName;

    setLoading(true);
    fetchResourceTable(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [department, employeeName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Bảng phân bổ nguồn lực chi tiết</h1>
          {isAdmin && (
            <button
              onClick={() => setShowAllocForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
            >
              <Plus size={16} /> Phân bổ nhân viên
            </button>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả phòng ban</option>
            <option value="P.Kỹ thuật IBS">P.Ky thuat IBS</option>
            <option value="P.Nghiệp vụ IBS">P.Nghiep vu IBS</option>
            <option value="P.Phát triển phần mềm">P.Phat trien phan mem</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-slate-400">Đang tải...</p>
        ) : data ? (
          <>
            <div className="mb-4 flex gap-4 text-xs text-gray-500 dark:text-slate-400">
              <span>Tong: <strong>{data.employees.length}</strong> nhan vien</span>
              <span>|</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-100 inline-block"></span> 100%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-80 inline-block"></span> 80-99%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-60 inline-block"></span> 60-79%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-40 inline-block"></span> 40-59%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-20 inline-block"></span> &lt;40%</span>
            </div>
            <ResourceTable data={data} onEmployeeClick={setSelectedEmployee} />
          </>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">Không có dữ liệu.</p>
        )}

        <EmployeeDetailModal employeeId={selectedEmployee} onClose={() => setSelectedEmployee(null)} onDataChanged={loadData} />
        <AllocationFormModal open={showAllocForm} onClose={() => setShowAllocForm(false)} onSuccess={loadData} />
      </main>
      <Chatbot />
    </div>
  );
}
