'use client';
import { useState, useEffect } from 'react';

interface LibraryItem {
  id: string;
  title: string;
  type: 'snippet' | 'template' | 'prompt' | 'resource';
  content: string;
  tags: string[];
  createdAt: Date;
  favorite: boolean;
}

const SAMPLE_ITEMS: LibraryItem[] = [
  {
    id: '1',
    title: 'React Component Template',
    type: 'snippet',
    content: `export default function Component({ props }) {\n  return (\n    <div className="container">\n      {/* Your code here */}\n    </div>\n  );\n}`,
    tags: ['react', 'typescript', 'frontend'],
    createdAt: new Date(),
    favorite: true,
  },
  {
    id: '2',
    title: 'API Response Handler',
    type: 'snippet',
    content: `async function handleApiCall(url: string) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error('API error');\n    return await response.json();\n  } catch (error) {\n    console.error('API failed:', error);\n    throw error;\n  }\n}`,
    tags: ['api', 'typescript', 'error-handling'],
    createdAt: new Date(),
    favorite: false,
  },
  {
    id: '3',
    title: 'Code Review Prompt',
    type: 'prompt',
    content: 'Sen deneyimli bir yazılım geliştiricisin. Gönderilen kodları inceleyerek potansiyel hataları, performans sorunlarını ve best practice ihlallerini tespit et. Her bulgu için:\n1. Sorunu açıkla\n2. Neden önemli olduğunu belirt\n3. Düzeltme önerisi sun\n4. Örnek kod göster',
    tags: ['code-review', 'ai-prompt'],
    createdAt: new Date(),
    favorite: true,
  },
];

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'snippet' | 'template' | 'prompt' | 'resource'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<LibraryItem>>({
    title: '',
    type: 'snippet',
    content: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('library-items');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(SAMPLE_ITEMS);
      localStorage.setItem('library-items', JSON.stringify(SAMPLE_ITEMS));
    }
  }, []);

  const saveItems = (updatedItems: LibraryItem[]) => {
    setItems(updatedItems);
    localStorage.setItem('library-items', JSON.stringify(updatedItems));
  };

  const addItem = () => {
    if (!newItem.title || !newItem.content) return;
    
    const item: LibraryItem = {
      id: `item-${Date.now()}`,
      title: newItem.title!,
      type: newItem.type as any,
      content: newItem.content!,
      tags: newItem.tags || [],
      createdAt: new Date(),
      favorite: false,
    };
    
    saveItems([item, ...items]);
    setIsAdding(false);
    setNewItem({ title: '', type: 'snippet', content: '', tags: [] });
    setTagInput('');
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  const toggleFavorite = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, favorite: !i.favorite } : i));
  };

  const addTag = () => {
    if (tagInput.trim() && !newItem.tags?.includes(tagInput.trim())) {
      setNewItem({ ...newItem, tags: [...(newItem.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewItem({ ...newItem, tags: newItem.tags?.filter(t => t !== tag) });
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'snippet': return '💻';
      case 'template': return '📄';
      case 'prompt': return '💬';
      case 'resource': return '🔗';
      default: return '📦';
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Kopyalandı!');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>📚 Kütüphane</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kod parçacıkları, şablonlar ve prompt koleksiyonunuz</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          {isAdding ? 'İptal' : '+ Yeni Ekle'}
        </button>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Ara..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl outline-none transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 rounded-xl outline-none transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">Tümü</option>
          <option value="snippet">Snippet</option>
          <option value="template">Şablon</option>
          <option value="prompt">Prompt</option>
          <option value="resource">Kaynak</option>
        </select>
      </div>

      {/* Yeni Ekleme Formu */}
      {isAdding && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Başlık *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Örn: React Hook Template"
                  className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Tip</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="snippet">Snippet</option>
                  <option value="template">Şablon</option>
                  <option value="prompt">Prompt</option>
                  <option value="resource">Kaynak</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>İçerik *</label>
              <textarea
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                placeholder="Kod veya metin içeriği..."
                rows={6}
                className="w-full px-3 py-2 rounded-xl outline-none transition-all resize-none font-mono text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Etiketler</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Etiket ekle ve Enter'a bas"
                  className="flex-1 px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 rounded-xl transition-all"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  Ekle
                </button>
              </div>
              {newItem.tags && newItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newItem.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                      style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={addItem}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              💾 Kaydet
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>Hiçbir öğe bulunamadı</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yeni öğe eklemek için "+ Yeni Ekle" butonuna tıklayın</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="rounded-2xl p-4 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {item.type}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: item.favorite ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {item.favorite ? '⭐' : '☆'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(item.content)}
                    className="p-2 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)' }}
                    title="Kopyala"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 rounded-lg transition-all hover:bg-red-500/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <pre
                className="p-3 rounded-xl text-sm overflow-x-auto"
                style={{ background: 'var(--bg)', color: 'var(--text)' }}
              >
                <code>{item.content}</code>
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
