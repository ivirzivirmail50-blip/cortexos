'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const AGENT_ICONS: Record<string, string> = {
  planner: '🗓', researcher: '🔍', writer: '✍️', coder: '💻',
  summarizer: '📋', analyst: '📊', orchestrator: '🤖', reflection: '💭',
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    fetch('/api/chat-history').then(r => r.json()).then(d => {
      setSessions(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const openSession = async (session: any) => {
    setSelected(session);
    setLoadingMsgs(true);
    const data = await fetch(`/api/chat-history/${session.sessionId}`).then(r => r.json());
    setMessages(data.messages || []);
    setLoadingMsgs(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat-history/${sessionId}`, { method: 'DELETE' });
    setSessions(ss => ss.filter(s => s.sessionId !== sessionId));
    if (selected?.sessionId === sessionId) { setSelected(null); setMessages([]); }
  };

  return (
    <div className="flex gap-4 h-full" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      {/* Sol: Session listesi */}
      <div className="w-72 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>🕐 Sohbet Geçmişi</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sessions.length} konuşma</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-sm p-4" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz sohbet yok</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Bir ajan kullanınca burada görünür</p>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} onClick={() => openSession(s)}
              className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer mb-1 transition-all ${selected?.id === s.id ? '' : 'hover:opacity-80'}`}
              style={{
                background: selected?.id === s.id ? 'var(--accent-light)' : 'transparent',
                border: `1px solid ${selected?.id === s.id ? 'var(--accent)' : 'transparent'}`,
              }}>
              <span className="text-xl flex-shrink-0">{AGENT_ICONS[s.agentType] || '🤖'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{s.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(s.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={e => deleteSession(s.sessionId, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:text-red-400"
                style={{ color: 'var(--text-muted)' }}>🗑</button>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ: Mesajlar */}
      <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <span className="text-5xl">💬</span>
            <p className="font-medium" style={{ color: 'var(--text)' }}>Bir sohbet seç</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sol taraftan bir konuşmaya tıkla</p>
          </div>
        ) : (
          <>
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xl">{AGENT_ICONS[selected.agentType] || '🤖'}</span>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>{selected.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(selected.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bu sohbette mesaj yok</p>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.senderType === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{
                      background: msg.senderType === 'user' ? 'var(--accent)' : 'var(--bg)',
                      color: msg.senderType === 'user' ? 'white' : 'var(--text)',
                      border: msg.senderType !== 'user' ? `1px solid var(--border)` : 'none',
                    }}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
