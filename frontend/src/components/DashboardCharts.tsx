'use client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

// Custom tooltip component for all charts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 text-xs max-w-[220px]">
      {label && <p className="text-slate-300 mb-1 font-medium">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-slate-100">
            {entry.name !== 'value' ? `${entry.name}: ` : ''}<strong>{entry.value}{suffix}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

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
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const total1 = chartData.reduce((s, d) => s + d.value, 0);
                  const pct1 = total1 > 0 ? Math.round(((item.value as number) / total1) * 100) : 0;
                  return (
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.payload?.fill }} />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <p className="text-slate-100 font-semibold mt-0.5">{item.value} người ({pct1}%)</p>
                    </div>
                  );
                }}
              />
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
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#475569' }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Line type="monotone" dataKey="participation_rate" name="Tỷ lệ tham gia" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
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
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} axisLine={{ stroke: '#475569' }} tickLine={false} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color || (item.payload as any)?.fill }} />
                    <span className="text-slate-300">{item.payload?.name}</span>
                  </div>
                  <p className="text-slate-100 font-semibold mt-0.5">{item.value} dự án</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={statusColors[entry.name] || COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
