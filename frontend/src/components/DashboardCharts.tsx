'use client';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

const COLORS = ['#16a34a', '#22c55e', '#86efac', '#facc15', '#f97316', '#ef4444', '#6366f1', '#8b5cf6'];

interface ChartProps {
  data: Record<string, number>;
  title: string;
}

export function PieChartCard({ data, title }: ChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip />
          <Line type="monotone" dataKey="participation_rate" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
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
    'Đang thực hiện (Đã có hợp đồng)': '#16a34a',
    'Đang thực hiện (Chưa có hợp đồng)': '#22c55e',
    'Đang thực hiện (Nội bộ)': '#86efac',
    'Bảo hành, Bảo trì': '#facc15',
    'Cơ hội': '#f97316',
    'Tạm dừng': '#ef4444',
    'Đóng': '#94a3b8',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
          />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={statusColors[entry.name] || COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
