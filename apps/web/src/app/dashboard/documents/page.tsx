'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const deleteDoc = async (id: string) => {
    if (!confirm('Bu dökümanı silmek istiyor musun?')) return;
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    await fetchDocs();
    setDeleting(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📄 Dökümanlar</h1>
          <p className="text-gray-500 text-sm mt-1">{docs.length} döküman</p>
        </div>
        <Link href="/dashboard/documents/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">
          + Yeni Döküman
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-5xl mb-3">📄</div>
          <p className="text-gray-500 mb-4">Henüz döküman yok</p>
          <Link href="/dashboard/documents/new" className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            İlk dökümanı oluştur
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{doc.content?.slice(0, 150)}...</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{doc.type}</span>
                    {doc.tags?.slice(0, 3).map((t: string) => (
                      <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc.id)} disabled={deleting === doc.id}
                  className="ml-4 text-gray-300 hover:text-red-400 transition-colors text-lg flex-shrink-0">
                  {deleting === doc.id ? '⏳' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
