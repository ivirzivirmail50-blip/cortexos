'use client';
import { useState } from 'react';

export default function ReflectionPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
  const [mood, setMood] = useState(7);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/reflection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, mood, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata');
      setResult(data.aiInsights);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const moodEmojis = ['😞','😔','😕','😐','🙂','😊','😄','😁','🤩','🌟'];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">💭 Yansıma</h1>
      <p className="text-gray-500 mb-6">Günlük veya haftalık değerlendirmeni yap, AI içgörüler üretsin.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-3 mb-5">
          {(['daily', 'weekly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p === 'daily' ? '☀️ Günlük' : '📅 Haftalık'}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ruh halin: <span className="text-2xl">{moodEmojis[mood - 1]}</span> {mood}/10
          </label>
          <input type="range" min={1} max={10} value={mood} onChange={e => setMood(Number(e.target.value))}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Zor</span><span>Harika</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notlar / Düşünceler</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            rows={5} placeholder={`Bugün neler yaptın? Neler iyi gitti? Neler zorladı?`} />
        </div>

        <button onClick={run} disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? '⏳ Analiz ediliyor...' : '💭 Yansımayı Kaydet & Analiz Et'}
        </button>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {result.motivationalMessage && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
              <p className="text-indigo-800 font-medium italic">"{result.motivationalMessage}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {result.strengths?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-green-700 mb-3">💪 Güçlü Yönler</h3>
                <ul className="space-y-1">{result.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500">✓</span>{s}</li>)}</ul>
              </div>
            )}
            {result.improvements?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-orange-600 mb-3">🎯 Gelişim Alanları</h3>
                <ul className="space-y-1">{result.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-orange-400">→</span>{s}</li>)}</ul>
              </div>
            )}
          </div>
          {result.nextActions?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">🚀 Sonraki Adımlar</h3>
              <ul className="space-y-2">{result.nextActions.map((a: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>{a}
                </li>
              ))}</ul>
            </div>
          )}
          {result.insights?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">💡 İçgörüler</h3>
              <ul className="space-y-2">{result.insights.map((ins: string, i: number) => (
                <li key={i} className="text-sm text-gray-700 p-2 bg-yellow-50 rounded-lg">{ins}</li>
              ))}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
