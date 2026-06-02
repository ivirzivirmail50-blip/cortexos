'use client';
import { useState, useRef, useEffect } from 'react';
import { useProvider } from '../context/provider-context';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface AgentChatProps {
  title: string;
  subtitle?: string;
  endpoint: string;
  agentType: string;          // DB'ye kaydederken kullanılır: 'planner', 'writer' vb.
  inputKey?: string;
  extraBody?: Record<string, string>;
  placeholder?: string;
  suggestions?: string[];
  formatResponse?: (data: any) => string;
  showModelSelector?: boolean; // Model seçimi gösterilsin mi?
}

function defaultFormat(data: any): string {
  if (typeof data === 'string') return data;
  if (data.finalAnswer) return data.finalAnswer;
  if (data.result) return data.result;
  if (data.response) return data.response;
  if (data.output) return data.output;

  if (data.plan) {
    const p = data.plan;
    return [
      `📋 **${p.title}**`,
      p.description,
      p.timeline ? `⏱ ${p.timeline.startDate || ''} → ${p.timeline.endDate || ''}` : '',
      '',
      ...(p.steps || []).map((s: any, i: number) =>
        `${i + 1}. **${s.title}**\n   ${s.description}${s.estimatedTime ? ` (~${s.estimatedTime}dk)` : ''}`
      ),
    ].filter(Boolean).join('\n');
  }
  if (data.summary && data.findings) {
    return [
      `🔍 **${data.topic || 'Araştırma'}**\n`,
      data.summary,
      '',
      '**Bulgular:**',
      ...(data.findings || []).map((f: any) => `• ${f.statement || f}`),
      ...(data.recommendations?.length ? ['', '**Öneriler:**', ...(data.recommendations || []).map((r: string) => `• ${r}`)] : []),
    ].join('\n');
  }
  if (data.title && data.content) return `**${data.title}**\n\n${data.content}`;
  if (data.summary && data.keyPoints) {
    return [data.summary, '', '**Temel Noktalar:**', ...(data.keyPoints || []).map((k: string) => `• ${k}`)].join('\n');
  }
  if (data.summary && data.insights) {
    return [data.summary, '', '**İçgörüler:**', ...(data.insights || []).map((i: string) => `• ${i}`)].join('\n');
  }
  if (data.snippets) {
    return [data.summary || '', '', ...(data.snippets || []).map((s: any) => `\`\`\`${s.language || ''}\n${s.code}\n\`\`\`\n${s.explanation || ''}`)].join('\n');
  }
  return JSON.stringify(data, null, 2);
}

// DB kayıt fonksiyonları (chat-store'u import etmeden inline — SSR sorununu önler)
async function createSession(agentType: string, title: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await fetch('/api/chat-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentType, title, sessionId }),
  });
  return sessionId;
}

async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  await fetch(`/api/chat-history/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content }),
  });
}

export function AgentChat({
  title, subtitle, endpoint, agentType,
  inputKey = 'input', extraBody = {},
  placeholder = 'Mesajını yaz...', suggestions = [],
  formatResponse = defaultFormat,
  showModelSelector = true, // Varsayılan olarak model seçici göster
}: AgentChatProps) {
  const { config } = useProvider();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(config.model); // Her agent için kendi model seçimi
  const sessionIdRef = useRef<string | null>(null); // Oturum ID'si — component yaşadıkça sabit
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    // İlk mesajda session oluştur
    if (!sessionIdRef.current) {
      const sid = await createSession(agentType, text.slice(0, 60));
      sessionIdRef.current = sid;
    }

    // Kullanıcı mesajını kaydet
    await saveMessage(sessionIdRef.current, 'user', text).catch(() => {});

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [inputKey]: text, history, ...extraBody }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Sunucu hatası: ${res.status}`);

      const content = formatResponse(data);
      setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }]);

      // AI yanıtını kaydet
      if (sessionIdRef.current) {
        await saveMessage(sessionIdRef.current, 'assistant', content).catch(() => {});
      }
    } catch (e: any) {
      setError(e.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    if (messages.length && confirm('Sohbeti temizlemek istiyor musun?')) {
      setMessages([]);
      sessionIdRef.current = null; // Yeni sohbet = yeni session
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} style={{
            fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px',
            border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
          }}>🗑 Temizle</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{title.slice(0, 2)}</div>
            <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>{placeholder}</p>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '12px 16px', borderRadius: '18px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              <div style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.6, textAlign: 'right' }}>
                {new Date(msg.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px', borderTopLeftRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              💭 Düşünüyor...
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 16px', borderRadius: '12px', textAlign: 'center', background: '#fee2e2', color: '#dc2626', fontSize: '0.85rem' }}>
            ❌ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesaj yaz... (Enter = gönder, Shift+Enter = yeni satır)"
            rows={2}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '18px', fontSize: '0.875rem', outline: 'none', resize: 'none', maxHeight: '120px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ padding: '12px 20px', borderRadius: '18px', fontSize: '0.875rem', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1, flexShrink: 0 }}>
            ↑
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '6px', color: 'var(--text-muted)' }}>
          {messages.length > 0 ? `${Math.floor(messages.length / 2)} tur · kaydediliyor 💾` : 'Sohbet başlamadı'}
        </p>
      </div>
    </div>
  );
}
