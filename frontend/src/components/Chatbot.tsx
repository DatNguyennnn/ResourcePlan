'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, RefreshCw } from 'lucide-react';
import { fetchDashboard, fetchEmployees, fetchProjects, fetchResourceTable, fetchOverloaded } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là trợ lý AI của hệ thống quản lý nguồn lực IBS. Bạn có thể hỏi tôi về nhân sự, dự án, phân bổ nguồn lực. Ví dụ:\n- Có bao nhiêu nhân viên ở phòng ban X?\n- Ai đang rảnh?\n- Dự án nào đang hoạt động?\n- Nhân viên nào đang quá tải?\n- Chi tiết phân bổ của nhân viên Y?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cachedContext = useRef<string | null>(null);
  const cacheTime = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const gatherContext = async () => {
    // Cache context for 2 minutes to avoid excessive API calls
    const now = Date.now();
    if (cachedContext.current && now - cacheTime.current < 120000) {
      return cachedContext.current;
    }

    try {
      const [dashboard, employees, projects, resourceTable] = await Promise.all([
        fetchDashboard(),
        fetchEmployees(),
        fetchProjects(),
        fetchResourceTable(),
      ]);

      // Fetch overloaded employees (lightweight)
      const today = new Date();
      const weekFrom = new Date(today);
      weekFrom.setDate(today.getDate() - today.getDay() + 1);
      const weekTo = new Date(weekFrom);
      weekTo.setDate(weekFrom.getDate() + 84);
      let overloadedDetails: string[] = [];
      try {
        const overloadedData = await fetchOverloaded({
          week_from: weekFrom.toISOString().split('T')[0],
          week_to: weekTo.toISOString().split('T')[0],
        });
        overloadedDetails = overloadedData.slice(0, 20).map(o =>
          `${o.employee_name} (${o.department}) - Tuần ${o.week}: tổng ${Math.round(o.total_percentage * 100)}% [${o.projects.map(p => `${p.name}: ${Math.round(p.percentage * 100)}%`).join(', ')}]`
        );
      } catch { /* ignore */ }

      const empList = employees.map(e =>
        `${e.full_name} (ID: ${e.employee_id}, ${e.department}, ${e.level}, ${e.status})`
      ).join('\n');

      const projList = projects.map(p =>
        `${p.project_name} [${p.project_code}] - PM: ${p.pm}, Trạng thái: ${p.status}`
      ).join('\n');

      // Allocation summary per employee (compact)
      const allocSummary = resourceTable.employees.map(e => {
        const weeks = Object.entries(e.weeks);
        if (weeks.length === 0) return null;
        const avg = weeks.reduce((s, [, v]) => s + v, 0) / weeks.length;
        const max = Math.max(...weeks.map(([, v]) => v));
        return `${e.name} (${e.department}): TB ${Math.round(avg * 100)}%, Max ${Math.round(max * 100)}%`;
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
          return `${e.name} (${e.department}) - TB ${Math.round(avg * 100)}%`;
        });

      const context = `DỮ LIỆU HỆ THỐNG QUẢN LÝ NGUỒN LỰC IBS (cập nhật real-time):

TỔNG QUAN:
- Tổng nhân sự: ${dashboard.total_employees}
- Dự án đang hoạt động: ${dashboard.active_projects}
- Tỷ lệ tham gia dự án: ${dashboard.participation_rate}%
- Nhân sự quá tải (>100%): ${dashboard.over_100_count}
- Nhân sự chưa đủ việc (<60%): ${dashboard.under_60_count}

PHÂN BỔ PHÒNG BAN: ${JSON.stringify(dashboard.department_distribution)}
PHÂN BỔ LEVEL: ${JSON.stringify(dashboard.level_distribution)}

DANH SÁCH NHÂN VIÊN (${employees.length} người):
${empList}

DANH SÁCH DỰ ÁN (${projects.length} dự án):
${projList}

TỔNG HỢP PHÂN BỔ NGUỒN LỰC MỖI NHÂN VIÊN:
${allocSummary.join('\n')}

NHÂN VIÊN ĐANG RẢNH (< 60% phân bổ):
${underloaded.length > 0 ? underloaded.join('\n') : 'Không có'}

NHÂN VIÊN QUÁ TẢI CHI TIẾT (> 100%):
${overloadedDetails.length > 0 ? overloadedDetails.join('\n') : 'Không có'}`;

      cachedContext.current = context;
      cacheTime.current = now;
      return context;
    } catch {
      return 'Không thể lấy dữ liệu từ hệ thống.';
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
              content: `Bạn là trợ lý AI chuyên sâu của hệ thống Quản lý Nguồn lực Nhân sự IBS (iERP Services JSC). Bạn có quyền truy cập TOÀN BỘ dữ liệu hệ thống bao gồm: danh sách nhân viên, dự án, chi tiết phân bổ % tham gia từng dự án theo từng tuần, trạng thái quá tải, nhân viên rảnh.

Trả lời bằng tiếng Việt, chính xác, cụ thể dựa trên dữ liệu thực tế dưới đây. Khi trả lời về phân bổ, hãy nêu cụ thể % tham gia, tên dự án. Nếu không biết thì nói không có thông tin.

${context}`,
            },
            ...messages.filter(m => m.role === 'user').slice(-3).map(m => ({ role: 'user' as const, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      const data = await response.json();

      // Handle API errors from Groq
      if (data.error) {
        const errMsg = data.error.message || data.error;
        if (typeof errMsg === 'string' && errMsg.includes('rate_limit')) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Hệ thống đang bận, vui lòng thử lại sau vài giây.' }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Có lỗi xảy ra. Vui lòng thử lại.' }]);
        }
        return;
      }

      const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối. Vui lòng thử lại.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Xin chào! Tôi là trợ lý AI của hệ thống quản lý nguồn lực IBS. Bạn có thể hỏi tôi về nhân sự, dự án, phân bổ nguồn lực.' },
    ]);
    cachedContext.current = null;
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110 cursor-pointer"
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
              <span className="font-medium text-sm">Trợ lý IBS</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
              >
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
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
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                  {' '}Đang suy nghĩ
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
                placeholder="Hỏi gì đó về nhân sự..."
                className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
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
