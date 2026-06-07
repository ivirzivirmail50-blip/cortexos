'use client';
import { useState, useEffect } from 'react';
import { useProvider } from '../../../context/provider-context';
import { PROVIDERS } from '@cortexos/ai-core/src/config/llm';

export default function SettingsPage() {
  const { config, setConfig } = useProvider();
  const [selectedProvider, setSelectedProvider] = useState(config.provider);
  const [selectedModel, setSelectedModel] = useState(config.model);
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [loading, setLoading] = useState(true);

  const providers = Object.entries(PROVIDERS);
  const currentProviderInfo = PROVIDERS[selectedProvider as keyof typeof PROVIDERS];
  const models = currentProviderInfo?.models || [];

  // Load settings and API keys
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.apiKeys) setApiKeys(data.apiKeys);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = () => {
    setConfig({ provider: selectedProvider, model: selectedModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveApiKeys = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert('API anahtarları kaydedilemedi');
    }
  };

  const updateApiKey = (key: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>⚙️ Ayarlar</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>AI sağlayıcı, model ve API anahtarı yönetimi</p>

      {/* Provider seçimi */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>AI Sağlayıcı</h2>
        <div className="grid grid-cols-2 gap-3">
          {providers.map(([key, info]) => (
            <button key={key} onClick={() => { setSelectedProvider(key); setSelectedModel(info.models[0]); }}
              className={`p-4 rounded-xl text-left transition-all border-2 ${selectedProvider === key ? 'border-indigo-500' : 'border-transparent hover:border-opacity-50'}`}
              style={{
                background: selectedProvider === key ? 'var(--accent-light)' : 'var(--bg)',
                borderColor: selectedProvider === key ? 'var(--accent)' : 'var(--border)',
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{info.name}</span>
                {info.free && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    Ücretsiz
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{info.models.length} model</p>
              {info.envKey && (
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{info.envKey}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Model seçimi */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Model</h2>
        <div className="grid gap-2">
          {models.map(model => (
            <button key={model} onClick={() => setSelectedModel(model)}
              className="flex items-center justify-between p-3 rounded-xl text-left transition-all"
              style={{
                background: selectedModel === model ? 'var(--accent-light)' : 'var(--bg)',
                border: `1px solid ${selectedModel === model ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>{model}</span>
              {selectedModel === model && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* API Key Yönetimi */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>🔑 API Anahtarları</h2>
          <button 
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{ 
              background: showApiKeys ? 'var(--accent)' : 'var(--bg)',
              color: showApiKeys ? 'white' : 'var(--text)',
              border: '1px solid var(--border)'
            }}>
            {showApiKeys ? 'Gizle ▲' : 'Göster ▼'}
          </button>
        </div>
        
        {showApiKeys && (
          <div className="space-y-4">
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              API anahtarlarını buradan güvenli bir şekilde ekleyebilir veya güncelleyebilirsiniz. 
              Anahtarlar <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg)' }}>.cortexos-apikeys.json</code> dosyasında şifrelenmeden saklanır.
            </p>
            
            {providers.filter(([_, info]) => info.envKey).map(([key, info]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium flex items-center justify-between" style={{ color: 'var(--text)' }}>
                  <span>{info.name} API Key</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{info.envKey}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeys[info.envKey!] || ''}
                    onChange={(e) => updateApiKey(info.envKey!, e.target.value)}
                    placeholder={`${info.envKey} değerini girin...`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{ 
                      background: 'var(--bg)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      focus: { outline: '2px solid var(--accent)' }
                    }}
                  />
                  {apiKeys[info.envKey!] && (
                    <button
                      onClick={() => updateApiKey(info.envKey!, '')}
                      className="px-3 py-2 rounded-xl text-sm transition-all"
                      style={{ 
                        background: 'var(--bg)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)'
                      }}>
                      🗑
                    </button>
                  )}
                </div>
                {info.url && (
                  <a href={info.url} target="_blank" rel="noreferrer"
                    className="text-xs hover:underline inline-block" style={{ color: 'var(--accent)' }}>
                    → {info.name} API key al
                  </a>
                )}
              </div>
            ))}
            
            <button 
              onClick={saveApiKeys}
              className="w-full py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}>
              💾 API Anahtarlarını Kaydet
            </button>
          </div>
        )}
        
        {!showApiKeys && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            API anahtarlarınızı yönetmek için "Göster" butonuna tıklayın.
          </p>
        )}
      </div>

      <button onClick={save}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'var(--accent)' }}>
        {saved ? '✅ Kaydedildi!' : '💾 Ayarları Kaydet'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Değişiklikler anında uygulanır. Sayfa yenileme gerekmez.
      </p>
    </div>
  );
}
