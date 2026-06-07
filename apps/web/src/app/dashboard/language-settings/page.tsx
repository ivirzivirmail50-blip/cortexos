'use client';
import { useState, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  flag: string;
  aiPrompt: string;
}

const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', aiPrompt: 'Türkçe yanıt ver' },
  { code: 'en', name: 'English', flag: '🇬🇧', aiPrompt: 'Respond in English' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', aiPrompt: 'Antworte auf Deutsch' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', aiPrompt: 'Répondez en français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', aiPrompt: 'Responde en español' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', aiPrompt: 'Rispondi in italiano' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', aiPrompt: 'Responda em português' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', aiPrompt: 'Отвечайте на русском языке' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', aiPrompt: '日本語で回答してください' },
  { code: 'zh', name: '中文', flag: '🇨🇳', aiPrompt: '请用中文回答' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', aiPrompt: '한국어로 답변해주세요' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', aiPrompt: 'أجب باللغة العربية' },
];

export default function LanguageSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('tr');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('ui-language') || 'tr';
    const savedCustom = localStorage.getItem('ai-language-prompt') || '';
    const useCustomVal = localStorage.getItem('use-custom-ai-prompt') === 'true';
    
    setSelectedLanguage(savedLang);
    setCustomPrompt(savedCustom);
    setUseCustomPrompt(useCustomVal);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('ui-language', selectedLanguage);
    localStorage.setItem('ai-language-prompt', customPrompt);
    localStorage.setItem('use-custom-ai-prompt', String(useCustomPrompt));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLanguage);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>🌐 Dil Ayarları</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>AI yanıtlarının dilini ve arayüz tercihlerini yönetin</p>

      {/* AI Yanıt Dili */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>🤖 AI Yanıt Dili</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          AI ajanlarının size hangi dilde yanıt vereceğini seçin. Bu ayar tüm sohbetlerde geçerli olacaktır.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`p-4 rounded-xl text-left transition-all border-2 ${
                selectedLanguage === lang.code ? 'border-indigo-500' : 'border-transparent hover:border-opacity-50'
              }`}
              style={{
                background: selectedLanguage === lang.code ? 'var(--accent-light)' : 'var(--bg)',
                borderColor: selectedLanguage === lang.code ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <span className="text-2xl mb-2 block">{lang.flag}</span>
              <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{lang.name}</span>
              {selectedLanguage === lang.code && (
                <span className="block mt-1 text-xs" style={{ color: 'var(--accent)' }}>✓ Seçili</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Özel Prompt */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>✍️ Özel Talimat</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomPrompt}
              onChange={(e) => setUseCustomPrompt(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Kullan</span>
          </label>
        </div>
        
        {useCustomPrompt && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              AI'ya özel talimat vermek için buraya yazın. Bu, seçilen dil ayarını geçersiz kılar.
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Örn: Her zaman kısa ve öz yanıt ver. Teknik terimleri İngilizce bırak."
              rows={4}
              className="w-full px-3 py-2 rounded-xl outline-none transition-all resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              İpucu: "{currentLang?.aiPrompt}" yerine bu kullanılacak
            </p>
          </div>
        )}
        
        {!useCustomPrompt && currentLang && (
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Mevcut AI talimatı:</p>
            <p className="font-medium mt-1" style={{ color: 'var(--text)' }}>"{currentLang.aiPrompt}"</p>
          </div>
        )}
      </div>

      {/* Arayüz Dili Bilgisi */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>🖥️ Arayüz Dili</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          Uygulama arayüzü şu anda <strong>Türkçe</strong> olarak yapılandırılmıştır.
        </p>
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ℹ️ Çoklu dil desteği gelecek sürümlerde eklenecektir. Şu an sadece AI yanıtlarının dili değiştirilebilir.
          </p>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <button
        onClick={saveSettings}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
        style={{ background: 'var(--accent)' }}
      >
        {saved ? '✅ Ayarlar Kaydedildi!' : '💾 Ayarları Kaydet'}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
        Değişiklikler yeni sohbetlerde uygulanacaktır.
      </p>
    </div>
  );
}
