'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import MultiSelect from '@/components/MultiSelect';
import { PieChartCard, ParticipationChart, ProjectStatusChart } from '@/components/DashboardCharts';
import ResourceTable from '@/components/ResourceTable';
import OverloadWarning from '@/components/OverloadWarning';
import Chatbot from '@/components/Chatbot';
import { useAuth } from '@/lib/auth';
import { fetchDashboard, fetchResourceTable, fetchFilterOptions, seedAdmin, type DashboardSummary, type ResourceTableData, type FilterOptions } from '@/lib/api';

function getDefaultDates() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 3, 0);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [resourceData, setResourceData] = useState<ResourceTableData | null>(null);
  const [filterOpts, setFilterOpts] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  const defaults = getDefaultDates();
  const [weekFrom, setWeekFrom] = useState(defaults.from);
  const [weekTo, setWeekTo] = useState(defaults.to);
  const [departments, setDepartments] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<string[]>([]);
  const [pms, setPms] = useState<string[]>([]);
  const [projectNames, setProjectNames] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      seedAdmin().catch(() => {});
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchFilterOptions().then(setFilterOpts).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const params: Record<string, string> = {};
    if (weekFrom) params.week_from = weekFrom;
    if (weekTo) params.week_to = weekTo;
    if (departments.length) params.department = departments.join(',');
    if (levels.length) params.level = levels.join(',');
    if (projectStatuses.length) params.project_status = projectStatuses.join(',');
    if (pms.length) params.pm = pms.join(',');
    if (projectNames.length) params.project_name = projectNames.join(',');

    setLoading(true);
    Promise.all([fetchDashboard(params), fetchResourceTable(params)])
      .then(([s, r]) => {
        setSummary(s);
        setResourceData(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekFrom, weekTo, departments, levels, projectStatuses, pms, projectNames, user]);

  if (authLoading || !user) return null;

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-5 overflow-auto">
        <PageHeader title="Tổng quan" />

        {/* Filter Bar */}
        <div className="flex items-end gap-3 mb-5 flex-wrap bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Từ tuần</label>
            <input
              type="date"
              value={weekFrom}
              onChange={(e) => setWeekFrom(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Đến tuần</label>
            <input
              type="date"
              value={weekTo}
              onChange={(e) => setWeekTo(e.target.value)}
              className="border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 cursor-pointer"
            />
          </div>
          <MultiSelect label="Phòng ban" options={filterOpts?.departments || []} selected={departments} onChange={setDepartments} />
          <MultiSelect label="Loại nhân sự" options={filterOpts?.levels || []} selected={levels} onChange={setLevels} />
          <MultiSelect label="Trạng thái dự án" options={filterOpts?.project_statuses || []} selected={projectStatuses} onChange={setProjectStatuses} />
          <MultiSelect label="Quản trị dự án" options={filterOpts?.pms || []} selected={pms} onChange={setPms} />
          <MultiSelect label="Tên dự án" options={filterOpts?.project_names || []} selected={projectNames} onChange={setProjectNames} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : summary ? (
          <div className="space-y-5">
            <OverloadWarning />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard title="Tổng nhân sự" value={summary.total_employees} color="blue" icon="users" />
              <StatCard title="Dự án đang hoạt động" value={summary.active_projects} color="green" icon="projects" />
              <StatCard title="Tỷ lệ tham gia" value={`${summary.participation_rate}%`} color="blue" icon="trend" />
              <StatCard title="Quá tải (>100%)" value={summary.over_100_count} color="red" icon="alert" />
              <StatCard title="Chưa đủ việc (<60%)" value={summary.under_60_count} color="yellow" icon="low" />
            </div>

            {/* Charts - 2 columns on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <PieChartCard data={summary.department_distribution} title="Nhân sự theo Phòng ban" />
                <PieChartCard data={summary.level_distribution} title="Nhân sự theo Level" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ProjectStatusChart data={summary.project_status_distribution} title="Trạng thái Dự án" />
                <ParticipationChart data={summary.weekly_summary} title="Xu hướng tham gia" />
              </div>
            </div>

            {/* Resource Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bảng phân bổ nguồn lực</h2>
                <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-100 inline-block"></span> 100%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-80 inline-block"></span> 80-99%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-60 inline-block"></span> 60-79%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-40 inline-block"></span> 40-59%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded alloc-20 inline-block"></span> &lt;40%</span>
                </div>
              </div>
              {resourceData && <ResourceTable data={resourceData} />}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Không thể tải dữ liệu.</p>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
