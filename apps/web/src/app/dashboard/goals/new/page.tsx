'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewGoalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          status: 'active',
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Sunucu hatası: ${res.status}`);
      }
      router.push('/dashboard/goals');
      router.refresh(); // ← BU EKSIKTI — liste yenilenmiyordu
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  const priorityLabels = ['', 'Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Kritik'];
  const priorityColors = ['', '#94a3b8', '#64748b', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="text-sm px-3 py-1.5 rounded-xl"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          ← Geri
        </button>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>🎯 Yeni Hedef</h1>
      </div>

      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
            Hedef <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            placeholder="Örnek: 6 ayda IELTS 7.0 almak" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>Açıklama</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            rows={3} placeholder="Neden bu hedef önemli?" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Son Tarih</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            Öncelik: <span className="font-bold" style={{ color: priorityColors[priority] }}>{priorityLabels[priority]}</span>
          </label>
          <input type="range" min={1} max={5} value={priority}
            onChange={e => setPriority(Number(e.target.value))}
            className="w-full" style={{ accentColor: priorityColors[priority] }} />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Çok Düşük</span><span>Kritik</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
            ❌ {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
            style={{ background: 'var(--accent)' }}>
            {saving ? '⏳ Kaydediliyor...' : '💾 Hedefi Kaydet'}
          </button>
          <button onClick={() => router.back()} disabled={saving}
            className="px-5 py-3 rounded-xl text-sm"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
