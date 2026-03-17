'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Chatbot from '@/components/Chatbot';
import { fetchProjects, createProject, updateProject, deleteProject, type Project } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';

const PROJECT_STATUSES = [
  'Đang thực hiện (Đã có hợp đồng)',
  'Đang thực hiện (Chưa có hợp đồng)',
  'Đang thực hiện (Nội bộ)',
  'Cơ hội',
  'Bảo hành, Bảo trì',
  'Tạm dừng',
  'Đóng',
];

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ project_code: '', project_name: '', description: '', pm: '', status: PROJECT_STATUSES[0] });

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  const load = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    fetchProjects(params).then(setProjects);
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateProject(editing.id, form);
    } else {
      await createProject(form);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleEdit = (proj: Project) => {
    setEditing(proj);
    setForm({ project_code: proj.project_code, project_name: proj.project_name, description: proj.description || '', pm: proj.pm || '', status: proj.status });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa dự án này?')) {
      await deleteProject(id);
      load();
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Đã có hợp đồng')) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    if (status.includes('Chưa có hợp đồng')) return 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400';
    if (status.includes('Nội bộ')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (status === 'Cơ hội') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    if (status === 'Bảo hành, Bảo trì') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400';
    if (status === 'Tạm dừng') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    if (status === 'Đóng') return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Quản lý Dự án</h1>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setForm({ project_code: '', project_name: '', description: '', pm: '', status: PROJECT_STATUSES[0] }); setShowForm(true); }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
            >
              <Plus size={16} /> Thêm dự án
            </button>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Tìm kiếm dự án..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
            <option value="">Tất cả trạng thái</option>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Mã DA</th>
                <th className="px-4 py-3 text-left">Tên dự án</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">PM</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                {isAdmin && <th className="px-4 py-3 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {projects.map((proj, i) => (
                <tr key={proj.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-2 text-gray-900 dark:text-slate-200">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-slate-200">{proj.project_code}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-slate-100">{proj.project_name}</td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-slate-400 max-w-[200px] truncate">{proj.description}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-slate-300">{proj.pm}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(proj.status)}`}>
                      {proj.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleEdit(proj)} className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 mr-1"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(proj.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Không có dự án nào.</p>}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-slate-100">{editing ? 'Sửa dự án' : 'Thêm dự án mới'}</h2>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-slate-300"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mã dự án</label>
                  <input required value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} disabled={!!editing}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-100 dark:disabled:bg-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Tên dự án</label>
                  <input required value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Mô tả</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">PM</label>
                  <input value={form.pm} onChange={(e) => setForm({ ...form, pm: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Trạng thái</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100">
                    {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                  {editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 dark:border-slate-600 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300">Hủy</button>
              </div>
            </form>
          </div>
        )}
      </main>
      <Chatbot />
    </div>
  );
}
