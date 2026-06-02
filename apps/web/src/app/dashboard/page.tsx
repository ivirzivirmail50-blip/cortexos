'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useProvider } from '../../context/provider-context';
import { PROVIDERS } from '@cortexos/ai-core/src/config/llm';

interface Task { id: string; title: string; status: string; priority: number; dueDate?: string; }
interface Goal { id: string; title: string; status: string; }

const agents = [
  { href: '/dashboard/orchestrator', icon: '🤖', title: 'Orkestratör', desc: 'AI doğru ajanı seçsin', gradient: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)' },
  { href: '/dashboard/planner', icon: '🗓', title: 'Planlayıcı', desc: 'Adım adım plan' },
  { href: '/dashboard/researcher', icon: '🔍', title: 'Araştırmacı', desc: 'Web araştırması' },
  { href: '/dashboard/writer', icon: '✍️', title: 'Yazar', desc: 'İçerik üret' },
  { href: '/dashboard/coder', icon: '💻', title: 'Kodlayıcı', desc: 'Kod yaz & debug' },
  { href: '/dashboard/summarizer', icon: '📋', title: 'Özetleyici', desc: 'Metinleri özetle' },
  { href: '/dashboard/analyst', icon: '📊', title: 'Analist', desc: 'Veri analizi' },
  { href: '/dashboard/reflection', icon: '💭', title: 'Yansıma', desc: 'Günlük koçluk' },
];

export default function DashboardPage() {
  const { config } = useProvider();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [time, setTime] = useState(new Date());
  const [lastAgent, setLastAgent] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(d => setTasks(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/goals').then(r => r.json()).then(d => setGoals(Array.isArray(d) ? d : [])).catch(() => {});
    setLastAgent(localStorage.getItem('cortexos-last-agent'));
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Son kullanılan ajanı kaydet
  useEffect(() => {
    const agentPaths = agents.map(a => a.href);
    const handler = () => {
      const path = window.location.pathname;
      if (agentPaths.includes(path)) localStorage.setItem('cortexos-last-agent', path);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const providerName = PROVIDERS[config.provider as keyof typeof PROVIDERS]?.name || config.provider;
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const urgentTasks = pendingTasks.filter(t => {
    if (!t.dueDate) return false;
    const days = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
    return days <= 2;
  });
  const activeGoals = goals.filter(g => g.status === 'active');
  const lastAgentData = agents.find(a => a.href === lastAgent);

  const greeting = () => {
    const h = time.getHours();
    if (h < 6)  return 'Gece geç saatler 🌙';
    if (h < 12) return 'Günaydın ☀️';
    if (h < 18) return 'İyi öğleden sonralar 🌤';
    return 'İyi akşamlar 🌆';
  };

  const dateStr = time.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{dateStr}</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{greeting()}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>CortexOS — Kişisel AI İkinci Beyin</p>
        </div>
        <Link href="/dashboard/settings"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          <span>⚡</span>
          <span>{providerName} · {config.model.split('/').pop()}</span>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '✅', label: 'Bekleyen Görev', value: pendingTasks.length, href: '/dashboard/tasks', alert: urgentTasks.length > 0 },
          { icon: '🎯', label: 'Aktif Hedef',    value: activeGoals.length,  href: '/dashboard/goals',  alert: false },
          { icon: '🔥', label: 'Acil Görev',     value: urgentTasks.length,  href: '/dashboard/tasks',  alert: urgentTasks.length > 0 },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="card animate-fade-up" style={{ padding: '16px 18px', borderColor: stat.alert && stat.value > 0 ? 'var(--accent)' : 'var(--border)', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)') }
              onMouseOut={e => (e.currentTarget.style.transform = 'none')}>
              <div style={{ fontSize: 20 }}>{stat.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: stat.alert && stat.value > 0 ? 'var(--accent)' : 'var(--text)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Acil görevler uyarısı */}
      {urgentTasks.length > 0 && (
        <div className="animate-fade-up" style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 14, background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>⚠️ Yaklaşan Görevler</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urgentTasks.slice(0, 3).map(t => (
              <Link key={t.id} href="/dashboard/tasks" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}>
                <span>{t.title}</span>
                {t.dueDate && <span style={{ color: 'var(--accent)', fontSize: 12 }}>{new Date(t.dueDate).toLocaleDateString('tr-TR')}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Son kullanılan ajan */}
      {lastAgentData && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Son kullanılan</p>
          <Link href={lastAgentData.href}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'var(--accent-light)', color: 'var(--accent-text)', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--accent)' }}>
            <span style={{ fontSize: 16 }}>{lastAgentData.icon}</span>
            {lastAgentData.title}'ya devam et →
          </Link>
        </div>
      )}

      {/* Hızlı sor */}
      <QuickAsk />

      {/* Agent grid */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '20px 0 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Ajanları</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
        {agents.map((agent, i) => (
          <Link key={agent.href} href={agent.href} style={{ textDecoration: 'none' }}
            onClick={() => localStorage.setItem('cortexos-last-agent', agent.href)}>
            <div className="card animate-fade-up"
              style={{ padding: '18px 16px', background: agent.gradient || 'var(--bg-card)', border: agent.gradient ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', animationDelay: `${i * 0.04}s` }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{agent.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: agent.gradient ? 'white' : 'var(--text)' }}>{agent.title}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: agent.gradient ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{agent.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickAsk() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const ask = async () => {
    if (!input.trim() || loading) return;
    setLoading(true); setResult('');
    try {
      const res = await fetch('/api/agents/orchestrator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      setResult(data.finalAnswer || data.result || data.response || JSON.stringify(data, null, 2));
    } catch { setResult('Hata: API\'ye bağlanılamadı.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: '16px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>⚡ Hızlı Sor</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Ne yapmamı istiyorsun? AI doğru ajanı seçer..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
        <button onClick={ask} disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '10px 18px', borderRadius: 12, flexShrink: 0 }}>
          {loading ? '...' : '→'}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg)', color: 'var(--text)', fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)' }}>
          {result}
        </div>
      )}
    </div>
  );
}
