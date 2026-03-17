'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FolderKanban, Table2, Upload, LogOut, Moon, Sun, Shield, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

const navItems = [
  { href: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/employees', label: 'Nhân sự', icon: Users },
  { href: '/projects', label: 'Dự án', icon: FolderKanban },
  { href: '/resource-table', label: 'Bảng phân bổ', icon: Table2 },
  { href: '/import', label: 'Nhập dữ liệu', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-screen flex flex-col transition-all duration-200`}>
      {/* Header + Controls */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">IBS</span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">iERP Services JSC</h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">Quản lý Nguồn lực</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <div className={`flex items-center mt-2 ${collapsed ? 'justify-center' : 'justify-end'}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pt-3 pb-1 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors w-full"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && (dark ? 'Giao diện sáng' : 'Giao diện tối')}
        </button>
      </div>

      {/* User info + logout */}
      <div className="px-3 pb-3 pt-1 border-t border-gray-200 dark:border-slate-700">
        {user && (
          <>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} mb-2`}>
              {isAdmin ? (
                <Shield size={16} className="text-amber-500 flex-shrink-0" />
              ) : (
                <User size={16} className="text-blue-500 flex-shrink-0" />
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors w-full"
            >
              <LogOut size={18} />
              {!collapsed && 'Đăng xuất'}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
