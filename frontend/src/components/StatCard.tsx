import { Users, FolderOpen, TrendingUp, AlertTriangle, UserMinus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue';
  icon?: 'users' | 'projects' | 'trend' | 'alert' | 'low';
}

const colorMap = {
  green: 'border-l-emerald-500 dark:border-l-emerald-400',
  red: 'border-l-rose-500 dark:border-l-rose-400',
  yellow: 'border-l-amber-500 dark:border-l-amber-400',
  blue: 'border-l-blue-500 dark:border-l-blue-400',
};

const valueColorMap = {
  green: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-rose-600 dark:text-rose-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

const iconBgMap = {
  green: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400',
  yellow: 'bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400',
};

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  projects: FolderOpen,
  trend: TrendingUp,
  alert: AlertTriangle,
  low: UserMinus,
};

export default function StatCard({ title, value, subtitle, color = 'green', icon }: StatCardProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${colorMap[color]} p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</p>
          {subtitle && <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBgMap[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
