'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { fetchDashboard, fetchEmployees, fetchProjects, fetchResourceTable, fetchAllocations, fetchOverloaded, fetchEmployeeDetail } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chao! Toi la tro ly AI cua he thong quan ly nguon luc IBS. Ban co the hoi toi ve nhan su, du an, phan bo nguon luc. Vi du:\n- Co bao nhieu nhan vien o phong ban X?\n- Ai dang ranh?\n- Du an nao dang hoat dong?\n- Nhan vien nao dang qua tai?\n- Chi tiet phan bo cua nhan vien Y?\n- Du an Z co nhung ai tham gia?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const gatherContext = async () => {
    try {
      const [dashboard, employees, projects, resourceTable] = await Promise.all([
        fetchDashboard(),
        fetchEmployees(),
        fetchProjects(),
        fetchResourceTable(),
      ]);

      // Fetch overloaded employees
      const today = new Date();
      const weekFrom = new Date(today);
      weekFrom.setDate(today.getDate() - today.getDay() + 1); // Monday
      const weekTo = new Date(weekFrom);
      weekTo.setDate(weekFrom.getDate() + 84); // 12 weeks ahead
      const overloadedData = await fetchOverloaded({
        week_from: weekFrom.toISOString().split('T')[0],
        week_to: weekTo.toISOString().split('T')[0],
      });

      // Fetch detailed allocation per employee (top employees with allocations)
      const employeeDetails: string[] = [];
      const empWithAlloc = resourceTable.employees.slice(0, 30); // limit to 30
      const detailPromises = empWithAlloc.map(e =>
        fetchEmployeeDetail(e.id).then(detail => {
          if (detail.projects.length > 0) {
            const projLines = detail.projects.map(p => {
              const weekEntries = Object.entries(p.weeks)
                .filter(([, v]) => v > 0)
                .map(([w, v]) => `${w.substring(5)}: ${Math.round(v * 100)}%`);
              return `  - ${p.project_name}: ${weekEntries.slice(0, 6).join(', ')}${weekEntries.length > 6 ? '...' : ''}`;
            });
            employeeDetails.push(`${detail.employee.name} (${detail.employee.department}):\n${projLines.join('\n')}`);
          }
        }).catch(() => {})
      );
      await Promise.all(detailPromises);

      const empList = employees.map(e => `${e.full_name} (ID: ${e.employee_id}, ${e.department}, ${e.level}, ${e.status})`).join('\n');

      const projList = projects.map(p => `${p.project_name} [${p.project_code}] - PM: ${p.pm}, Trang thai: ${p.status}, Mo ta: ${p.description || 'N/A'}`).join('\n');

      // Detailed per-employee allocation summary
      const allocSummary = resourceTable.employees.map(e => {
        const weeks = Object.entries(e.weeks);
        if (weeks.length === 0) return null;
        const avg = weeks.reduce((s, [, v]) => s + v, 0) / weeks.length;
        const max = Math.max(...weeks.map(([, v]) => v));
        const min = Math.min(...weeks.map(([, v]) => v));
        return `${e.name} (${e.department}): TB ${Math.round(avg * 100)}%, Max ${Math.round(max * 100)}%, Min ${Math.round(min * 100)}%, ${weeks.length} tuan`;
      }).filter(Boolean);

      // Underloaded
      const underloaded = resourceTable.employees
        .filter(e => {
          const vals = Object.values(e.weeks);
          const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return avg < 0.6;
        })
        .map(e => {
          const vals = Object.values(e.weeks);
          const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return `${e.name} (${e.department}) - trung binh ${Math.round(avg * 100)}%`;
        });

      // Overloaded details
      const overloadedDetails = overloadedData.map(o =>
        `${o.employee_name} (${o.department}) - Tuan ${o.week}: tong ${Math.round(o.total_percentage * 100)}% [${o.projects.map(p => `${p.name}: ${Math.round(p.percentage * 100)}%`).join(', ')}]`
      );

      return `DU LIEU HE THONG QUAN LY NGUON LUC IBS (cap nhat real-time):

TONG QUAN:
- Tong nhan su: ${dashboard.total_employees}
- Du an dang hoat dong: ${dashboard.active_projects}
- Ty le tham gia du an: ${dashboard.participation_rate}%
- Nhan su qua tai (>100%): ${dashboard.over_100_count}
- Nhan su chua du viec (<60%): ${dashboard.under_60_count}

PHAN BO PHONG BAN: ${JSON.stringify(dashboard.department_distribution)}
PHAN BO LEVEL: ${JSON.stringify(dashboard.level_distribution)}
TRANG THAI NHAN VIEN: ${JSON.stringify(dashboard.employee_status_distribution)}
TRANG THAI DU AN: ${JSON.stringify(dashboard.project_status_distribution)}

DANH SACH NHAN VIEN (${employees.length} nguoi):
${empList}

DANH SACH DU AN (${projects.length} du an):
${projList}

TONG HOP PHAN BO NGUON LUC MOI NHAN VIEN (trung binh/max/min %):
${allocSummary.join('\n')}

CHI TIET PHAN BO THEO DU AN CUA TUNG NHAN VIEN:
${employeeDetails.join('\n\n')}

NHAN VIEN DANG RANH (< 60% phan bo):
${underloaded.length > 0 ? underloaded.join('\n') : 'Khong co'}

NHAN VIEN QUA TAI CHI TIET (> 100%, bao gom du an cu the):
${overloadedDetails.length > 0 ? overloadedDetails.join('\n') : 'Khong co'}`;
    } catch {
      return 'Khong the lay du lieu tu he thong.';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const context = await gatherContext();

      const response = await fetch(`${API_URL}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Ban la tro ly AI chuyen sau cua he thong Quan ly Nguon luc Nhan su IBS (iERP Services JSC). Ban co quyen truy cap TOAN BO du lieu he thong bao gom: danh sach nhan vien, du an, chi tiet phan bo % tham gia tung du an theo tung tuan, trang thai qua tai, nhan vien ranh.

Tra loi bang tieng Viet, chinh xac, cu the dua tren du lieu thuc te duoi day. Khi tra loi ve phan bo, hay neu cu the % tham gia, ten du an, thoi gian. Neu hoi ve 1 nhan vien cu the, hay tra loi chi tiet tat ca du an ho dang tham gia va % phan bo. Neu khong biet thi noi khong co thong tin.

${context}`,
            },
            ...messages.filter(m => m.role === 'user').slice(-5).map(m => ({ role: 'user' as const, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          max_tokens: 2048,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Xin loi, toi khong the tra loi luc nay.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Loi ket noi. Vui long thu lai.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-green-600 rounded-t-xl">
            <div className="flex items-center gap-2 text-white">
              <Bot size={20} />
              <span className="font-medium text-sm">IBS Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={14} className="text-green-700 dark:text-green-400" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User size={14} className="text-blue-700 dark:text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-green-700 dark:text-green-400" />
                </div>
                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-slate-400">
                  Dang suy nghi...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-700">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hoi gi do ve nhan su..."
                className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
