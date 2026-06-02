'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('note');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content, type,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      router.push('/dashboard/documents');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📄 Yeni Döküman</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Döküman başlığı..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {['note', 'article', 'report', 'idea', 'reference'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            rows={10} placeholder="Döküman içeriği..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler (virgülle ayır)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="ai, proje, fikir" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving || !title.trim() || !content.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
          </button>
          <button onClick={() => router.back()}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
