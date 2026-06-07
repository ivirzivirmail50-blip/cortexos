'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../context/theme-context';
import { useProvider } from '../../context/provider-context';
import { useState } from 'react';
import { PROVIDERS } from '@cortexos/ai-core/src/config/llm';

const navGroups = [
  {
    label: 'Bilgi Yönetimi',
    items: [
      { href: '/dashboard/documents', icon: '📄', label: 'Dökümanlar' },
      { href: '/dashboard/library', icon: '📚', label: 'Kütüphane' },
      { href: '/dashboard/knowledge', icon: '🧠', label: 'Bilgi Tabanı' },
      { href: '/dashboard/goals', icon: '🎯', label: 'Hedefler' },
      { href: '/dashboard/tasks', icon: '✅', label: 'Görevler' },
      { href: '/dashboard/analytics', icon: '📈', label: 'Analitik' },
    ],
  },
  {
    label: 'AI Ajanlar',
    items: [
      { href: '/dashboard/orchestrator', icon: '🤖', label: 'Orkestratör' },
      { href: '/dashboard/planner', icon: '🗓', label: 'Planlayıcı' },
      { href: '/dashboard/researcher', icon: '🔍', label: 'Araştırmacı' },
      { href: '/dashboard/writer', icon: '✍️', label: 'Yazar' },
      { href: '/dashboard/coder', icon: '💻', label: 'Kodlayıcı' },
      { href: '/dashboard/summarizer', icon: '📋', label: 'Özetleyici' },
      { href: '/dashboard/analyst', icon: '📊', label: 'Analist' },
      { href: '/dashboard/reflection', icon: '💭', label: 'Yansıma' },
      { href: '/dashboard/agent-creator', icon: '🛠️', label: 'Ajan Oluşturucu' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { href: '/dashboard/history', icon: '🕐', label: 'Sohbet Geçmişi' },
      { href: '/dashboard/language-settings', icon: '🌐', label: 'Dil Ayarları' },
      { href: '/dashboard/settings', icon: '⚙️', label: 'Ayarlar' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { config } = useProvider();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>🧠 CortexOS</span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Kişisel AI Beyin</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity ml-auto"
            style={{ color: 'var(--text-muted)' }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-xs font-semibold uppercase tracking-wide px-3 mb-1"
                  style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </p>
              )}
              {group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${active ? 'shadow-sm' : 'hover:opacity-80'}`}
                    style={{
                      background: active ? 'var(--accent-light)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                    }}>
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Provider badge */}
          {!collapsed && (
            <Link href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <span>⚡</span>
              <span className="truncate">{PROVIDERS[config.provider as keyof typeof PROVIDERS]?.name || config.provider}</span>
            </Link>
          )}
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {!collapsed && <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
