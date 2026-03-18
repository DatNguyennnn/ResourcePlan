'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FolderKanban, Table2, Upload, LogOut, Moon, Sun, Shield, User, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
    <div className="relative group/sidebar flex-shrink-0 sticky top-0 h-screen">
      <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full flex flex-col transition-all duration-300 overflow-y-auto`}>
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          {collapsed ? (
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IBS</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">IBS</span>
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">iERP Services JSC</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Quản lý Nguồn lực</p>
              </div>
            </div>
          )}
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

          {/* Theme toggle - below nav items */}
          <button
            onClick={toggle}
            title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg mb-1 text-sm w-full transition-all duration-200 cursor-pointer text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200`}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (dark ? 'Giao diện sáng' : 'Giao diện tối')}
          </button>
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

      {/* Collapse toggle - always visible pill beside sidebar */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-20 w-6 h-12 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-r-lg flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 hover:shadow-lg hover:w-7"
      >
        {collapsed ? <ChevronsRight size={14} strokeWidth={2.5} /> : <ChevronsLeft size={14} strokeWidth={2.5} />}
      </button>
    </div>
  );
}
