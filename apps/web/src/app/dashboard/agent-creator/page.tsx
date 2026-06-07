'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CustomAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: Date;
}

const DEFAULT_ICONS = ['🤖', '🧠', '⚡', '🎯', '🔮', '🚀', '💡', '🌟', '🔥', '✨'];

export default function AgentCreatorPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🤖',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2048,
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAgent: CustomAgent = {
      id: `agent-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      systemPrompt: formData.systemPrompt,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      createdAt: new Date(),
    };

    // LocalStorage'a kaydet
    const existingAgents = JSON.parse(localStorage.getItem('custom-agents') || '[]');
    const updatedAgents = [...existingAgents, newAgent];
    localStorage.setItem('custom-agents', JSON.stringify(updatedAgents));
    
    setAgents(updatedAgents);
    setSaved(true);
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      icon: '🤖',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 2048,
    });
    
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteAgent = (id: string) => {
    const updatedAgents = agents.filter(a => a.id !== id);
    localStorage.setItem('custom-agents', JSON.stringify(updatedAgents));
    setAgents(updatedAgents);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>🛠️ Özel Ajan Oluşturucu</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kendi AI ajanınızı oluşturun ve özelleştirin</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-xl font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          {isCreating ? 'İptal' : '+ Yeni Ajan'}
        </button>
      </div>

      {isCreating && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Ajan Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Kod Reviewer"
                  required
                  className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>İkon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  {DEFAULT_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu ajan ne yapar?"
                className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Sistem Promptu *</label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Ajanın nasıl davranacağını tanımlayın. Örn: Sen deneyimli bir kod review uzmanısın..."
                rows={5}
                required
                className="w-full px-3 py-2 rounded-xl outline-none transition-all resize-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Düşük (=0.3): Daha tutarlı, Yüksek (>1): Daha yaratıcı
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none transition-all"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              {saved ? '✅ Ajan Oluşturuldu!' : '🚀 Ajanı Oluştur'}
            </button>
          </form>
        </div>
      )}

      {/* Mevcut Ajanlar */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Oluşturduğunuz Ajanlar</h2>
        {agents.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
            <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>Henüz özel ajan oluşturmadınız</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>"+ Yeni Ajan" butonuna tıklayarak başlayın</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 rounded-2xl transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{agent.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                    Temp: {agent.temperature}
                  </span>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="p-2 rounded-lg transition-all hover:bg-red-500/10"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hazır Şablonlar */}
      <div className="mt-8">
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>📋 Hazır Şablonlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Kod Reviewer', icon: '💻', desc: 'Kod kalitesi ve best practice kontrolü', prompt: 'Sen deneyimli bir yazılım geliştiricisin. Gönderilen kodları inceleyerek potansiyel hataları, performans sorunlarını ve best practice ihlallerini tespit et. Yapıcı geri bildirimler ver.' },
            { name: 'İçerik Editörü', icon: '✍️', desc: 'Metin düzenleme ve iyileştirme', prompt: 'Sen profesyonel bir içerik editörüsün. Gönderilen metinleri dil bilgisi, akıcılık, netlik ve etkileyicilik açısından değerlendir. Gerekli düzeltmeleri öner ve alternatif ifadeler sun.' },
            { name: 'Veri Analisti', icon: '📊', desc: 'Veri yorumlama ve içgörü', prompt: 'Sen kıdemli bir veri analistisin. Verilen verileri veya istatistikleri analiz ederek anlamlı içgörüler çıkar. Trendleri, desenleri ve önemli noktaları vurgula.' },
            { name: 'Öğrenme Koçu', icon: '🎓', desc: 'Kişisel gelişim ve öğrenme', prompt: 'Sen deneyimli bir eğitim koçusun. Öğrencilerin öğrenme hedeflerine ulaşmasına yardımcı ol. Konuları basit ve anlaşılır şekilde açıkla, örnekler ver, sorular sorarak öğrenmeyi pekiştir.' },
          ].map((template, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFormData({
                  ...formData,
                  name: template.name,
                  description: template.desc,
                  icon: template.icon,
                  systemPrompt: template.prompt,
                });
                setIsCreating(true);
              }}
              className="p-4 rounded-xl text-left transition-all hover:opacity-80"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{template.icon}</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{template.name}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{template.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
