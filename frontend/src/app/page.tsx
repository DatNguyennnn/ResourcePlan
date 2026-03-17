'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { PieChartCard, ParticipationChart, ProjectStatusChart } from '@/components/DashboardCharts';
import ResourceTable from '@/components/ResourceTable';
import EmployeeDetailModal from '@/components/EmployeeDetailModal';
import OverloadWarning from '@/components/OverloadWarning';
import Chatbot from '@/components/Chatbot';
import { useAuth } from '@/lib/auth';
import { fetchDashboard, fetchResourceTable, seedAdmin, type DashboardSummary, type ResourceTableData } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [resourceData, setResourceData] = useState<ResourceTableData | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      seedAdmin().catch(() => {});
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const params: Record<string, string> = {};
    if (department) params.department = department;

    setLoading(true);
    Promise.all([fetchDashboard(params), fetchResourceTable(params)])
      .then(([s, r]) => {
        setSummary(s);
        setResourceData(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [department, user]);

  if (authLoading || !user) return null;

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Báo cáo phân bổ Nguồn lực Trung tâm IBS
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Hệ thống quản lý nhân sự dự án</p>
          </div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">Tất cả phòng ban</option>
            <option value="P.Kỹ thuật IBS">P.Kỹ thuật IBS</option>
            <option value="P.Nghiệp vụ IBS">P.Nghiệp vụ IBS</option>
            <option value="P.Phát triển phần mềm">P.Phát triển phần mềm</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 dark:text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : summary ? (
          <>
            <OverloadWarning />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <StatCard title="Số lượng nhân sự" value={summary.total_employees} color="green" />
              <StatCard title="Dự án đang thực hiện" value={summary.active_projects} color="blue" />
              <StatCard title="Tỷ lệ tham gia dự án" value={`${summary.participation_rate}%`} color="green" />
              <StatCard title="Nhân sự >100%" value={summary.over_100_count} subtitle="Quá tải" color="red" />
              <StatCard title="Nhân sự <60%" value={summary.under_60_count} subtitle="Chưa đủ việc" color="yellow" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <PieChartCard data={summary.department_distribution} title="Nhân sự theo Phòng ban" />
              <PieChartCard data={summary.level_distribution} title="Nhân sự theo Nguồn lực" />
              <ProjectStatusChart data={summary.project_status_distribution} title="Số lượng dự án theo Trạng thái" />
              <ParticipationChart data={summary.weekly_summary} title="Tỷ lệ tham gia dự án theo tuần" />
            </div>

            {/* Resource Table */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Bảng phân bổ nguồn lực
              </h2>
              {resourceData && (
                <ResourceTable data={resourceData} onEmployeeClick={setSelectedEmployee} />
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">Không thể tải dữ liệu. Vui lòng kiểm tra kết nối API.</p>
        )}

        <EmployeeDetailModal employeeId={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      </main>
      <Chatbot />
    </div>
  );
}
