'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentsUsed?: string[];
  ts: number;
}

const AGENT_LABELS: Record<string, string> = {
  planner: '🗓 Planlayıcı', researcher: '🔍 Araştırmacı',
  writer: '✍️ Yazar', coder: '💻 Kodlayıcı',
  summarizer: '📋 Özetleyici', analyst: '📊 Analist', multi: '🔀 Çoklu',
};

export default function OrchestratorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    // Sohbet geçmişini context olarak gönder
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sunucu hatası');

      const content = data.finalAnswer || data.result || data.response || data.output
        || JSON.stringify(data, null, 2);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content,
        agentsUsed: data.agentsUsed,
        ts: Date.now(),
      }]);
    } catch (e: any) {
      setError(e.message);
      setMessages(prev => prev.slice(0, -1)); // user mesajını geri al
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    if (confirm('Sohbeti temizlemek istiyor musun?')) setMessages([]);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>🤖 Orkestratör</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Sohbet devam eder — geçmiş mesajlar bağlam olarak gönderilir
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat}
            className="text-xs px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            🗑 Temizle
          </button>
        )}
      </div>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🧠</div>
            <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>Ne yapmamı istiyorsun?</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Soru sor, görev ver ya da bir konu hakkında araştırma yaptır.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                'Bugün yapılacakları planla',
                'React hooks nedir açıkla',
                'Motivasyon için bir tavsiye ver',
                'Haftaya bir çalışma programı yap',
              ].map(s => (
                <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-sm px-3 py-2 rounded-xl transition-all hover:opacity-80"
                  style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {/* Agent badges */}
              {msg.agentsUsed && msg.agentsUsed.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {msg.agentsUsed.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {AGENT_LABELS[a] || a}
                    </span>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : undefined,
                  borderTopLeftRadius: msg.role === 'assistant' ? '4px' : undefined,
                }}>
                {msg.content}
              </div>
              <span className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                {new Date(msg.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <span className="animate-pulse">🤔 Düşünüyor...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm text-center"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            ❌ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesaj yaz... (Enter = gönder, Shift+Enter = yeni satır)"
            rows={2}
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none resize-none transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              maxHeight: '120px',
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {loading ? '⏳' : '↑'}
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          {messages.length > 0 ? `${messages.length} mesaj — AI önceki konuşmayı hatırlıyor` : 'Sohbet başlamadı'}
        </p>
      </div>
    </div>
  );
}
