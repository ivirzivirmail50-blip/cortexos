'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  todo:          { label: 'Yapılacak',    bg: 'var(--bg)',          color: 'var(--text-muted)' },
  'in-progress': { label: 'Devam ediyor', bg: 'var(--accent-light)', color: 'var(--accent)' },
  done:          { label: 'Tamamlandı',   bg: '#dcfce7',             color: '#16a34a' },
  blocked:       { label: 'Bloklandı',    bg: '#fee2e2',             color: '#dc2626' },
};

interface Task {
  id: string; title: string; description?: string;
  status: string; priority: number; dueDate?: string; estimatedTime?: number;
}

interface AIResult { taskId: string; result: string; }

export default function TasksPage() {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };

  const runAI = async (task: Task) => {
    setRunning(r => ({ ...r, [task.id]: true }));
    setExpanded(e => ({ ...e, [task.id]: true }));
    try {
      const res = await fetch(`/api/tasks/${task.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description }),
      });
      const data = await res.json();
      const text = data.result || data.response || data.output || JSON.stringify(data, null, 2);
      setAiResults(r => ({ ...r, [task.id]: text }));
    } catch {
      setAiResults(r => ({ ...r, [task.id]: '❌ Hata: AI çalıştırılamadı.' }));
    } finally {
      setRunning(r => ({ ...r, [task.id]: false }));
    }
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const isUrgent = (t: Task) => {
    if (!t.dueDate) return false;
    const days = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
    return days <= 2 && t.status !== 'done';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>✅ Görevler</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tasks.filter(t => t.status !== 'done').length} bekleyen ·{' '}
            {tasks.filter(t => t.status === 'done').length} tamamlandı
          </p>
        </div>
        <Link href="/dashboard/tasks/new"
          className="px-4 py-2 rounded-xl font-medium text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          + Yeni Görev
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['all', 'Tümü'], ['todo', 'Yapılacak'], ['in-progress', 'Devam'], ['done', 'Bitti'], ['blocked', 'Bloklu']] .map(([val, label]) => {
          const count = val === 'all' ? tasks.length : tasks.filter(t => t.status === val).length;
          return (
            <button key={val} onClick={() => setFilter(val)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === val ? 'var(--accent)' : 'var(--bg-card)',
                color: filter === val ? 'white' : 'var(--text-muted)',
                border: `1px solid ${filter === val ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {label}
              <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-3">✅</div>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Bu kategoride görev yok</p>
          <Link href="/dashboard/tasks/new"
            className="px-5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            Görev ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const s = STATUS_MAP[task.status] || STATUS_MAP.todo;
            const urgent = isUrgent(task);
            const isExpanded = expanded[task.id];
            const aiText = aiResults[task.id];

            return (
              <div key={task.id}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${urgent ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => updateStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                      className="mt-1 w-4 h-4 flex-shrink-0 cursor-pointer"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through opacity-50' : ''}`}
                        style={{ color: 'var(--text)' }}>
                        {urgent && '🔥 '}{task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {task.dueDate && (
                          <span style={{ color: urgent ? 'var(--accent)' : 'var(--text-muted)' }}>
                            📅 {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                        {task.estimatedTime && <span>⏱ {task.estimatedTime} dk</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status badge */}
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>

                    {/* AI buton */}
                    {task.status !== 'done' && (
                      <button onClick={() => runAI(task)}
                        disabled={running[task.id]}
                        title="AI ile çöz"
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                        {running[task.id] ? '⏳' : '🤖 AI'}
                      </button>
                    )}

                    {/* Sil */}
                    <button onClick={() => deleteTask(task.id)}
                      title="Sil"
                      className="px-2 py-1.5 rounded-xl text-xs transition-all hover:opacity-70"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* AI sonucu */}
                {isExpanded && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    {running[task.id] ? (
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="animate-spin">⏳</span> AI bu görevi analiz ediyor...
                      </div>
                    ) : aiText ? (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>🤖 AI Yanıtı</p>
                        <div className="text-sm whitespace-pre-wrap p-3 rounded-xl"
                          style={{ background: 'var(--bg)', color: 'var(--text)', maxHeight: '300px', overflowY: 'auto' }}>
                          {aiText}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => updateStatus(task.id, 'done')}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: '#dcfce7', color: '#16a34a' }}>
                            ✅ Tamamlandı say
                          </button>
                          <button onClick={() => setExpanded(e => ({ ...e, [task.id]: false }))}
                            className="px-3 py-1.5 rounded-xl text-xs"
                            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            Kapat
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
