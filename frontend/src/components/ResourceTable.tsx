'use client';
import { useState } from 'react';
import type { ResourceTableData } from '@/lib/api';

function getAllocClass(value: number): string {
  if (value >= 1.0) return 'alloc-100';
  if (value >= 0.8) return 'alloc-80';
  if (value >= 0.6) return 'alloc-60';
  if (value >= 0.4) return 'alloc-40';
  if (value > 0) return 'alloc-20';
  return 'alloc-0';
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

interface Props {
  data: ResourceTableData;
  onEmployeeClick?: (empId: number) => void;
}

export default function ResourceTable({ data, onEmployeeClick }: Props) {
  if (!data.employees.length) {
    return <p className="text-gray-500 dark:text-slate-400 text-sm p-4">Không có dữ liệu phân bổ.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-green-700 text-white">
            <th className="sticky left-0 bg-green-700 z-10 px-3 py-2 text-left text-xs font-medium whitespace-nowrap">
              Họ và Tên
            </th>
            <th className="px-2 py-2 text-left text-xs font-medium whitespace-nowrap">Phòng ban</th>
            {data.weeks.map((w) => (
              <th key={w} className="px-1 py-2 text-center text-xs font-medium whitespace-nowrap">
                {formatWeek(w)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              <td
                className="sticky left-0 bg-white dark:bg-slate-800 z-10 px-3 py-1 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                onClick={() => onEmployeeClick?.(emp.id)}
              >
                {emp.name}
              </td>
              <td className="px-2 py-1 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{emp.department}</td>
              {data.weeks.map((w) => {
                const val = emp.weeks[w] ?? 0;
                return (
                  <td key={w} className={`allocation-cell ${getAllocClass(val)}`}>
                    {val > 0 ? `${Math.round(val * 100)}%` : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
