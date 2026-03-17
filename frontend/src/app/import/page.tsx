'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Chatbot from '@/components/Chatbot';
import { importExcel } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; stats: Record<string, number> } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await importExcel(file);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import thất bại. Vui lòng kiểm tra file Excel.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-6 text-gray-900 dark:text-slate-100">Nhập dữ liệu từ Excel</h1>

        <div className="max-w-xl">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-slate-100">Tải lên file Excel</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Chọn file Excel có định dạng tương tự file &quot;IBS_Resource Plan_2026.xlsx&quot;.
              Hệ thống sẽ tự động import dữ liệu nhân viên, dự án và phân bổ nguồn lực.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center mb-4">
                <Upload size={40} className="mx-auto text-gray-400 dark:text-slate-500 mb-3" />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block mx-auto text-sm text-gray-700 dark:text-slate-300"
                />
                {file && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">Đã chọn: {file.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {loading ? 'Đang nhập...' : 'Nhập dữ liệu'}
              </button>
            </form>

            {result && (
              <div className="mt-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle size={18} />
                  {result.message}
                </div>
                <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <li>Nhân viên: {result.stats.employees} bản ghi</li>
                  <li>Dự án: {result.stats.projects} bản ghi</li>
                  <li>Phân bổ: {result.stats.allocations} bản ghi</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle size={18} />
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 text-sm mb-2">Yêu cầu định dạng file Excel</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc pl-4">
              <li>Sheet &quot;DS Nhân viên&quot;: STT, ID, Họ và Tên, Phòng Ban TT, Nguồn lực, Trạng thái</li>
              <li>Sheet &quot;DS Dự án&quot;: STT, Mã DA, Tên DA, Mô tả DA, PM, Loại Dự án</li>
              <li>Sheet &quot;Resource Plan&quot;: ID NV, Họ Tên, Phòng, Trạng thái, Mã DA, Tên DA, PM, Trạng thái DA, ..., Các cột tuần</li>
            </ul>
          </div>
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
