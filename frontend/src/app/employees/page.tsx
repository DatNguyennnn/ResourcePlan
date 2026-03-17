'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Chatbot from '@/components/Chatbot';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';

const LEVELS = ['Senior', 'Experienced', 'Assesed'];
const STATUSES = ['Chính thức', 'Thử việc', 'Học việc'];
const DEPARTMENTS = ['P.Kỹ thuật IBS', 'P.Nghiệp vụ IBS', 'P.Phát triển phần mềm'];

export default function EmployeesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ employee_id: '', full_name: '', department: DEPARTMENTS[0], level: LEVELS[0], status: STATUSES[0] });

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  const load = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterDept) params.department = filterDept;
    if (filterLevel) params.level = filterLevel;
    if (filterStatus) params.status = filterStatus;
    fetchEmployees(params).then(setEmployees);
  };

  useEffect(() => { load(); }, [search, filterDept, filterLevel, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateEmployee(editing.id, form);
    } else {
      await createEmployee(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ employee_id: '', full_name: '', department: DEPARTMENTS[0], level: LEVELS[0], status: STATUSES[0] });
    load();
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ employee_id: emp.employee_id, full_name: emp.full_name, department: emp.department, level: emp.level, status: emp.status });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      await deleteEmployee(id);
      load();
    }
  };

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Quản lý Nhân sự</h1>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setForm({ employee_id: '', full_name: '', department: DEPARTMENTS[0], level: LEVELS[0], status: STATUSES[0] }); setShowForm(true); }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Plus size={16} /> Thêm nhân viên
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả phòng ban</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả level</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Mã NV</th>
                <th className="px-4 py-3 text-left">Họ và Tên</th>
                <th className="px-4 py-3 text-left">Phòng ban</th>
                <th className="px-4 py-3 text-left">Level</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                {isAdmin && <th className="px-4 py-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-2 text-gray-900 dark:text-slate-200">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-slate-200">{emp.employee_id}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">{emp.full_name}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{emp.department}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      emp.level === 'Senior' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                      emp.level === 'Experienced' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    }`}>{emp.level}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      emp.status === 'Chính thức' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                      emp.status === 'Thử việc' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    }`}>{emp.status}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleEdit(emp)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-1 transition-colors cursor-pointer" title="Chỉnh sửa">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors cursor-pointer" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <p className="text-center text-gray-500 dark:text-slate-400 py-8">Không có nhân viên nào.</p>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">{editing ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-colors cursor-pointer"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mã nhân viên</label>
                  <input required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} disabled={!!editing}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-100 dark:disabled:bg-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Họ và tên</label>
                  <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Phòng ban</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Level</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors cursor-pointer">
                  {editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 dark:border-slate-600 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors cursor-pointer">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
