'use client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

interface ChartProps {
  data: Record<string, number>;
  title: string;
}

export function PieChartCard({ data, title }: ChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{title}</h3>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={0} outerRadius={55} paddingAngle={1} dataKey="value">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} người`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {chartData.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}: {item.value} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface LineChartProps {
  data: { week: string; participation_rate: number }[];
  title: string;
}

export function ParticipationChart({ data, title }: LineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    weekLabel: new Date(d.week).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip />
          <Line type="monotone" dataKey="participation_rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartProps {
  data: Record<string, number>;
  title: string;
}

export function ProjectStatusChart({ data, title }: BarChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  const statusColors: Record<string, string> = {
    'Đang thực hiện (Đã có hợp đồng)': '#2563eb',
    'Đang thực hiện (Chưa có hợp đồng)': '#3b82f6',
    'Đang thực hiện (Nội bộ)': '#60a5fa',
    'Bảo hành, Bảo trì': '#f59e0b',
    'Cơ hội': '#10b981',
    'Tạm dừng': '#ef4444',
    'Đóng': '#94a3b8',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 8, fill: '#94a3b8' }} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.name] || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
