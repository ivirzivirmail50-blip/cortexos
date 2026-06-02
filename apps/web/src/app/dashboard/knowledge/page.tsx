'use client';
import { useState, useEffect } from 'react';

interface SearchResult {
  documentId: string;
  title: string;
  content: string;
  score: number;
}

interface Memory {
  key: string;
  value: string;
  userId: string;
  createdAt: number;
  tags?: string[];
}

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [chromaOk, setChromaOk] = useState<boolean | null>(null);
  const [indexMsg, setIndexMsg] = useState('');
  const [error, setError] = useState('');
  
  // Memory state
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryKey, setMemoryKey] = useState('');
  const [memoryValue, setMemoryValue] = useState('');
  const [memoryTab, setMemoryTab] = useState<'list' | 'add'>('list');
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [memoryMsg, setMemoryMsg] = useState('');

  useEffect(() => {
    fetch('/api/knowledge')
      .then(r => r.json())
      .then(d => setChromaOk(d.chromaAvailable));
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setLoadingMemories(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMemories(data.memories || []);
      }
    } catch (e: any) {
      console.error('Bellek yükleme hatası:', e);
    }
    finally {
      setLoadingMemories(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setError(''); setResults([]);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); }
    finally { setSearching(false); }
  };

  const indexAll = async () => {
    setIndexing(true); setIndexMsg('');
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'index-all' }),
      });
      const data = await res.json();
      setIndexMsg(`✅ ${data.indexed} döküman index'lendi`);
    } catch {
      setIndexMsg('❌ Index hatası');
    }
    finally { setIndexing(false); }
  };

  const addMemory = async () => {
    if (!memoryKey.trim() || !memoryValue.trim()) return;
    setMemoryMsg('');
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remember', key: memoryKey, value: memoryValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setMemoryMsg('✅ Bellek kaydedildi');
        setMemoryKey('');
        setMemoryValue('');
        loadMemories();
      } else {
        setMemoryMsg(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setMemoryMsg('❌ Bellek kaydetme hatası');
    }
  };

  const deleteMemory = async (key: string) => {
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forget', key }),
      });
      if (res.ok) {
        loadMemories();
      }
    } catch (e: any) {
      console.error('Bellek silme hatası:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🧠 Bilgi Tabanı & Bellek</h1>
      <p className="text-gray-500 mb-6">Dökümanlarını semantik olarak ara ve kişisel anılarını yönet.</p>

      {/* Durum kartı */}
      <div className={`rounded-xl p-4 mb-6 flex items-center justify-between ${chromaOk === null ? 'bg-gray-50' : chromaOk ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{chromaOk === null ? '⏳' : chromaOk ? '✅' : '⚠️'}</span>
          <div>
            <p className="text-sm font-medium text-gray-700">
              ChromaDB: {chromaOk === null ? 'Kontrol ediliyor...' : chromaOk ? 'Bağlı' : 'Bağlanamadı'}
            </p>
            {!chromaOk && chromaOk !== null && (
              <p className="text-xs text-yellow-600">docker-compose up -d çalıştır</p>
            )}
          </div>
        </div>
        <button onClick={indexAll} disabled={indexing || !chromaOk}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {indexing ? '⏳ Index ediliyor...' : '📥 Tüm Dökümanları Index Et'}
        </button>
      </div>
      {indexMsg && <p className="mb-4 text-sm font-medium text-gray-600">{indexMsg}</p>}

      {/* Tablar */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setMemoryTab('list')}
          className={`px-4 py-2 text-sm font-medium ${memoryTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📚 Döküman Arama
        </button>
        <button
          onClick={() => setMemoryTab('add')}
          className={`px-4 py-2 text-sm font-medium ${memoryTab === 'add' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          💭 Bellek Yönetimi
        </button>
      </div>

      {/* Döküman Arama */}
      {memoryTab === 'list' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Semantik Arama</label>
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                className="flex-1 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Örnek: makine öğrenmesi notlarım..." />
              <button onClick={search} disabled={searching || !query.trim()}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 text-sm">
                {searching ? '⏳' : '🔍 Ara'}
              </button>
            </div>
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-800">{results.length} sonuç bulundu</h2>
              {results.map((r, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      %{Math.round(r.score * 100)} eşleşme
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && query && !searching && (
            <div className="text-center py-10 text-gray-400">
              <p>Sonuç bulunamadı. Önce dökümanları index etmeyi dene.</p>
            </div>
          )}
        </>
      )}

      {/* Bellek Yönetimi */}
      {memoryTab === 'add' && (
        <>
          {/* Bellek Ekleme */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Yeni Bellek Ekle</h3>
            <div className="space-y-3">
              <input value={memoryKey} onChange={e => setMemoryKey(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Anahtar (örn: 'tercihlerim', 'hedeflerim')" />
              <textarea value={memoryValue} onChange={e => setMemoryValue(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Değer (örn: 'Python kullanmayı tercih ediyorum')" />
              <button onClick={addMemory} disabled={!memoryKey.trim() || !memoryValue.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                💾 Kaydet
              </button>
            </div>
            {memoryMsg && <p className="mt-2 text-sm font-medium text-gray-600">{memoryMsg}</p>}
          </div>

          {/* Bellek Listesi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Kaydedilmiş Bellekler</h3>
              <button onClick={loadMemories} className="text-xs text-indigo-600 hover:text-indigo-700">
                🔄 Yenile
              </button>
            </div>
            {loadingMemories ? (
              <p className="text-sm text-gray-500">Yükleniyor...</p>
            ) : memories.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz bellek yok.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {memories.map((m, i) => (
                  <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{m.key}</p>
                      <p className="text-sm text-gray-600 mt-1">{m.value}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(m.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <button onClick={() => deleteMemory(m.key)}
                      className="ml-2 text-red-500 hover:text-red-700 text-sm">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Ollama bilgisi */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-800 mb-1">💡 Ollama Embedding Kurulumu</h3>
        <p className="text-xs text-blue-600 mb-2">Semantik arama için Ollama'nın çalışıyor olması gerekir:</p>
        <code className="block text-xs bg-blue-100 rounded p-2 text-blue-800">
          ollama pull nomic-embed-text
        </code>
      </div>
    </div>
  );
}
