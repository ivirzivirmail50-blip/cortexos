/**
 * Model "flavor" sistemi — seçilen modele göre prompt'a eklenecek ton yönergesi,
 * temperature ve diğer ince ayarlar.
 *
 * Bu, model değiştirince "aynı kişi farklı modlarda" hissi yaratır.
 * Persona (karakter) değişmez; ama ton, derinlik, kısalık değişir.
 */

export type ModelFlavorId =
  | 'flagship'      // GPT-4o, Claude Sonnet/Opus, Gemini Pro
  | 'fast'          // GPT-4o-mini, Claude Haiku, Gemini Flash
  | 'llama-large'   // Llama 3.3 70B, Mixtral
  | 'llama-small'   // Llama 3.1 8B, Gemma 2 9B
  | 'mistral'       // Mistral Large, Codestral, Mistral Small
  | 'deepseek-r'    // DeepSeek R1, reasoning modelleri
  | 'openrouter'    // OpenRouter (genel fallback)
  | 'ollama'        // Lokal Ollama
  | 'unknown';

export interface ModelFlavor {
  id: ModelFlavorId;
  /** Görünen ad */
  label: string;
  /** Ton yönergesi — prompt'a EKLENIR */
  toneDirective: string;
  /** Temperature aralığı (model-flavor bazlı) */
  temperature: number;
  /** Sistem özetinde belirtmek için — kullanıcı görür */
  badge: string;
  /** Emoji */
  emoji: string;
}

export const MODEL_FLAVORS: Record<ModelFlavorId, ModelFlavor> = {
  flagship: {
    id: 'flagship',
    label: 'Flagship',
    toneDirective:
      'Sen güçlü bir flagship model olarak yanıt veriyorsun. Derin, nüanslı, çok katmanlı düşün. Farklı bakış açılarını tart, ince detayları kaçırma. Yanıtın zengin olsun ama dağılma; her paragraf bir amaca hizmet etsin.',
    temperature: 0.7,
    badge: 'Flagship',
    emoji: '✨',
  },
  fast: {
    id: 'fast',
    label: 'Fast',
    toneDirective:
      'Sen hızlı, optimize bir model olarak yanıt veriyorsun. Yalın, doğru, gereksiz süslemesiz ol. Direkt sonuca git; gereksiz giriş/kapanış cümlesi yazma. Kullanıcının zamanı kıymetli — öz ol.',
    temperature: 0.5,
    badge: 'Hızlı',
    emoji: '⚡',
  },
  'llama-large': {
    id: 'llama-large',
    label: 'Llama 70B',
    toneDirective:
      'Sen Llama ailesinin büyük modelisin. Samimi, yapılandırılmış, sohbet tonunda yanıt ver. Liste ve başlık kullanmayı seversen de düz paragraflar da yazabilirsin. Kullanıcıyla konuşuyormuş gibi doğal ol; çok kurumsal olma.',
    temperature: 0.7,
    badge: 'Llama 70B',
    emoji: '🦙',
  },
  'llama-small': {
    id: 'llama-small',
    label: 'Llama 8B',
    toneDirective:
      'Sen küçük ama çevik bir Llama modelisin. KISA ve NET ol. Süslü cümleler yazma, her kelime bilgi taşısın. Kullanıcı uzun metin istemediği sürece 3-4 cümleyi geçme. Doğrudan cevap ver.',
    temperature: 0.4,
    badge: 'Llama 8B',
    emoji: '🦙',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    toneDirective:
      'Sen Mistral ailesinin bir modelisin. "Fransız ekolü" gibi düşün: rafine, keskin, özlü. Gereksiz tekrarlardan kaçın. Çıtır çıtır, özü yakalayan yanıtlar ver. Akademik olmadan, edebi olmadan — net ve zeki.',
    temperature: 0.65,
    badge: 'Mistral',
    emoji: '🇫🇷',
  },
  'deepseek-r': {
    id: 'deepseek-r',
    label: 'DeepSeek R',
    toneDirective:
      'Sen DeepSeek R serisi bir reasoning modelisin. Yanıt vermeden önce adım adım düşün. Cevabının sonuna "### Çıkarım" başlığı altında kısa bir muhakeme özeti ekle. Kullanıcı senin NASIL düşündüğünü de görsün.',
    temperature: 0.6,
    badge: 'Reasoning',
    emoji: '🧠',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    toneDirective:
      'Sen OpenRouter üzerinden erişilen bir model olarak yanıt veriyorsun. Modelin güçlü yanlarını kullan; yanıtın dengeli, yapılandırılmış ve kullanıcı dostu olsun. Gerekirse markdown kullan.',
    temperature: 0.7,
    badge: 'OpenRouter',
    emoji: '🌐',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (Yerel)',
    toneDirective:
      'Sen kullanıcının kendi bilgisayarında çalışan yerel bir model olarak yanıt veriyorsun. Yerel olduğun için gizlilik ön planda; kullanıcıya özel, samimi bir ton kullan. Kısa-orta uzunlukta yanıtlar ver; çok uzun paragraflardan kaçın.',
    temperature: 0.7,
    badge: 'Yerel',
    emoji: '🏠',
  },
  unknown: {
    id: 'unknown',
    label: 'Unknown',
    toneDirective: 'Yanıtın net, yapılandırılmış ve kullanıcının seviyesine uygun olsun. Gerekirse markdown formatında yaz.',
    temperature: 0.7,
    badge: 'Model',
    emoji: '🤖',
  },
};

/**
 * Model adından flavor belirle. Hem anahtar kelime hem fuzzy eşleşme.
 * "gpt-4o-mini" → fast, "claude-3-5-sonnet" → flagship, "llama-3.1-8b" → llama-small
 */
export function detectModelFlavor(model: string | undefined | null): ModelFlavor {
  if (!model) return MODEL_FLAVORS.unknown;
  const m = model.toLowerCase();

  // OpenRouter prefix'leri: "meta-llama/llama-3.3-70b-instruct:free"
  // ya da "openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash"
  // vs. onların hepsi için ayrı kontrol.

  // Reasoning modelleri (R1, vs.)
  if (/deepseek[-_]?r1|o1[-_]|reasoning/i.test(m)) return MODEL_FLAVORS['deepseek-r'];

  // Mistral ailesi
  if (/mistral|codestral|mixtral|mistralai/i.test(m)) return MODEL_FLAVORS.mistral;

  // Ollama (sadece provider üzerinden anlaşılır; burada sadece model adı yeterli değil,
  // ama ollama default modelleri llama/mistral/codellama/phi3/gemma/deepseek-coder
  // hepsi zaten yukarıda yakalanıyor. Buraya düşenler: phi, qwen, vs. — llama-small gibi davran)
  if (/phi|qwen|llama3\.\d|llama3$|gemma2.*2b|nemotron/i.test(m)) return MODEL_FLAVORS['llama-small'];

  // Llama ailesi
  if (/llama[-_]?3\.3[-_]?70|llama[-_]?3\.1[-_]?70|llama[-_]?4|llama[-_]?70|llama2[-_]?70|mixtral/i.test(m)) {
    return MODEL_FLAVORS['llama-large'];
  }
  if (/llama[-_]?3\.1[-_]?8|llama[-_]?3\.2[-_]?[13]b|llama[-_]?8|llama2[-_]?7|llama2[-_]?13/i.test(m)) {
    return MODEL_FLAVORS['llama-small'];
  }

  // Claude
  if (/claude[-_]?opus|claude[-_]?3[-_]?5[-_]?sonnet|claude[-_]?sonnet[-_]?4|claude[-_]?3[-_]?opus/i.test(m)) {
    return MODEL_FLAVORS.flagship;
  }
  if (/claude[-_]?haiku|claude[-_]?3[-_]?5[-_]?haiku|claude[-_]?instant/i.test(m)) {
    return MODEL_FLAVORS.fast;
  }

  // OpenAI
  if (/gpt[-_]?4o$|gpt[-_]?4[-_]?turbo|o1[-_]?preview|o1[-_]?mini|o3/i.test(m)) {
    // "o1-mini" reasoning moduna düşebilir ama deepseek-r'dan önce bu eşleşir — yine de flagship mantıklı
    if (/^o1|reasoning/i.test(m)) return MODEL_FLAVORS['deepseek-r'];
    return MODEL_FLAVORS.flagship;
  }
  if (/gpt[-_]?4o[-_]?mini|gpt[-_]?3\.5|gpt[-_]?4$|nano/i.test(m)) {
    return MODEL_FLAVORS.fast;
  }

  // Gemini
  if (/gemini[-_]?2\.5[-_]?pro|gemini[-_]?1\.5[-_]?pro|gemini[-_]?2\.0[-_]?pro/i.test(m)) {
    return MODEL_FLAVORS.flagship;
  }
  if (/gemini[-_]?2\.0[-_]?flash|gemini[-_]?1\.5[-_]?flash|gemini[-_]?2\.5[-_]?flash|gemini[-_]?flash/i.test(m)) {
    return MODEL_FLAVORS.fast;
  }

  // OpenRouter "openai/" "anthropic/" "google/" prefix'leri yukarıda yakalanmalı
  if (m.includes('/')) {
    // Prefixed modeller için — provider kısmına bak
    if (/openai\//.test(m)) {
      // İçerideki model adına tekrar bak
      const inner = m.split('/').pop() || '';
      return detectModelFlavor(inner);
    }
    if (/anthropic\//.test(m)) {
      const inner = m.split('/').pop() || '';
      return detectModelFlavor(inner);
    }
    if (/google\//.test(m)) {
      const inner = m.split('/').pop() || '';
      return detectModelFlavor(inner);
    }
    if (/meta-llama\//.test(m)) {
      const inner = m.split('/').pop() || '';
      return detectModelFlavor(inner);
    }
    if (/mistralai\//.test(m)) {
      const inner = m.split('/').pop() || '';
      return detectModelFlavor(inner);
    }
    return MODEL_FLAVORS.openrouter;
  }

  return MODEL_FLAVORS.unknown;
}

/**
 * Model için uygun temperature değeri. Persona'ya göre override edilebilir.
 */
export function getTemperatureForModel(model: string | undefined | null, agentType?: string): number {
  const flavor = detectModelFlavor(model);
  let base = flavor.temperature;

  // Ajan bazlı ince ayar
  if (agentType === 'analyst' || agentType === 'summarizer') {
    base = Math.max(0.2, base - 0.2); // analitik ajanlar daha deterministik
  }
  if (agentType === 'writer') {
    base = Math.min(0.95, base + 0.1); // yazar daha yaratıcı
  }
  if (agentType === 'coder') {
    base = Math.max(0.1, base - 0.1); // kod daha deterministik
  }
  if (agentType === 'orchestrator') {
    base = Math.max(0.2, base - 0.1); // yönlendirici, kararlı
  }

  return Math.round(base * 100) / 100;
}
