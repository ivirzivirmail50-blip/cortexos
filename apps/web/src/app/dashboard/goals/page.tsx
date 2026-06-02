'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', completed: 'Tamamlandı', paused: 'Duraklatıldı', cancelled: 'İptal'
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    const res = await fetch('/api/goals');
    const data = await res.json();
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setGoals(gs => gs.map(g => g.id === id ? { ...g, status } : g));
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Bu hedefi silmek istiyor musun?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    setGoals(gs => gs.filter(g => g.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎯 Hedefler</h1>
          <p className="text-gray-500 text-sm mt-1">{goals.filter(g => g.status === 'active').length} aktif hedef</p>
        </div>
        <Link href="/dashboard/goals/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">
          + Yeni Hedef
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-gray-500 mb-4">Henüz hedef yok</p>
          <Link href="/dashboard/goals/new" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            İlk hedefi oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[goal.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[goal.status] || goal.status}
                    </span>
                  </div>
                  {goal.description && <p className="text-sm text-gray-500">{goal.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>Öncelik: {goal.priority}/5</span>
                    {goal.deadline && <span>📅 {new Date(goal.deadline).toLocaleDateString('tr-TR')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={goal.status} onChange={e => updateStatus(goal.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-400 transition-colors">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
