'use client';
import { useState, useEffect } from 'react';
import { useProvider } from '../../../context/provider-context';
import { PROVIDERS } from '@cortexos/ai-core/src/config/llm';

export default function SettingsPage() {
  const { config, setConfig } = useProvider();
  const [selectedProvider, setSelectedProvider] = useState(config.provider);
  const [selectedModel, setSelectedModel] = useState(config.model);
  const [saved, setSaved] = useState(false);
  const [envKeys, setEnvKeys] = useState<Record<string, string>>({});

  const providers = Object.entries(PROVIDERS);
  const currentProviderInfo = PROVIDERS[selectedProvider as keyof typeof PROVIDERS];
  const models = currentProviderInfo?.models || [];

  const save = () => {
    setConfig({ provider: selectedProvider, model: selectedModel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>⚙️ Ayarlar</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>AI sağlayıcı ve model seçimi</p>

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

      {/* API key bilgisi */}
      {currentProviderInfo?.envKey && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>API Key</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            <span className="font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg)' }}>
              apps/web/.env.local
            </span>
            {' '}dosyasına ekle:
          </p>
          <code className="block text-sm p-3 rounded-xl" style={{ background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            {currentProviderInfo.envKey}=sk_...
          </code>
          <a href={currentProviderInfo.url} target="_blank" rel="noreferrer"
            className="inline-block mt-3 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
            → Key almak için {currentProviderInfo.url}
          </a>
        </div>
      )}

      <button onClick={save}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'var(--accent)' }}>
        {saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Değişiklikler anında uygulanır. Sayfa yenileme gerekmez.
      </p>
    </div>
  );
}
