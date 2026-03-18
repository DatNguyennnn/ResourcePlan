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
  { href: '/resource-table', label: 'Phân bổ Nhân Lực', icon: Table2 },
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
    <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IBS</span>
            </div>
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Mở rộng sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">IBS</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">iERP Services JSC</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Quản lý Nguồn lực</p>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Thu gọn sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer flex-shrink-0"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <div className="px-2 pt-2">
        <button
          onClick={toggle}
          title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm w-full transition-all duration-200 cursor-pointer text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200`}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && (dark ? 'Giao diện sáng' : 'Giao diện tối')}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 mt-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg mb-1 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <item.icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
        {user && (
          <>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} px-3 py-2`}>
              {isAdmin ? (
                <Shield size={16} className="text-amber-500 flex-shrink-0" />
              ) : (
                <User size={16} className="text-blue-500 flex-shrink-0" />
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin ? 'Quản trị viên' : 'Nhân viên'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-sm text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-all duration-200 w-full cursor-pointer`}
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
