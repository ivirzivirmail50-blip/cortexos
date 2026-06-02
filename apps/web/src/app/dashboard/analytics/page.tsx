'use client';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Yükleniyor...</div>;
  if (!stats) return null;

  const { tasks, goals, documents, reflections } = stats;

  const statCards = [
    { label: 'Toplam Görev', value: tasks.total, icon: '✅', color: 'text-blue-600' },
    { label: 'Tamamlanan', value: tasks.byStatus.done, icon: '🎉', color: 'text-green-600' },
    { label: 'Aktif Hedef', value: goals.active, icon: '🎯', color: 'text-purple-600' },
    { label: 'Döküman', value: documents.total, icon: '📄', color: 'text-orange-600' },
    { label: 'Tamamlanma', value: `${tasks.completionRate}%`, icon: '📊', color: 'text-indigo-600' },
    { label: 'Yansıma', value: reflections.total, icon: '💭', color: 'text-pink-600' },
  ];

  const taskBars = [
    { label: 'Yapılacak', count: tasks.byStatus.todo, color: 'bg-gray-400' },
    { label: 'Devam', count: tasks.byStatus['in-progress'], color: 'bg-blue-500' },
    { label: 'Tamamlandı', count: tasks.byStatus.done, color: 'bg-green-500' },
    { label: 'Bloklandı', count: tasks.byStatus.blocked, color: 'bg-red-400' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📈 Analitik</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Görev Dağılımı</h2>
          <div className="space-y-3">
            {taskBars.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{b.label}</span><span className="font-medium">{b.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${b.color}`}
                    style={{ width: tasks.total > 0 ? `${(b.count / tasks.total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Hedefler</h2>
          <div className="space-y-3">
            {[
              { label: 'Aktif', value: goals.active, color: 'bg-green-500' },
              { label: 'Tamamlandı', value: goals.completed, color: 'bg-blue-500' },
              { label: 'Toplam', value: goals.total, color: 'bg-gray-300' },
            ].map(g => (
              <div key={g.label}>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{g.label}</span><span className="font-medium">{g.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${g.color}`}
                    style={{ width: goals.total > 0 ? `${(g.value / goals.total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
          {reflections.avgMood !== null && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Ortalama Ruh Hali</p>
              <p className="text-2xl font-bold text-indigo-600">{reflections.avgMood} / 10</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between mb-2">
          <h2 className="font-semibold text-gray-800">Genel Tamamlanma</h2>
          <span className="text-indigo-600 font-bold">{tasks.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4">
          <div className="h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${tasks.completionRate}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {tasks.byStatus.done} / {tasks.total} görev tamamlandı
        </p>
      </div>
    </div>
  );
}
