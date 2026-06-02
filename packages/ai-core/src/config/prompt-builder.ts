/**
 * Ajan + model için nihai system prompt üretici.
 * Persona (karakter) + Model flavor (ton/derinlik) + JSON şeması birleştirilir.
 */

import { AgentType, PERSONAS } from './personas';
import { detectModelFlavor, ModelFlavor } from './model-flavors';

export interface BuildPromptOptions {
  /** Ajan tipi */
  agent: AgentType;
  /** Model adı — flavor belirlemek için */
  model?: string;
  /** Yanıt için JSON şeması (opsiyonel — bazı ajanlar kullanmıyor) */
  jsonSchema?: string;
  /** Ek talimat (opsiyonel) */
  extraInstructions?: string;
  /** Geçmiş sohbet var mı */
  hasHistory?: boolean;
  /** Web araması var mı (researcher için) */
  hasWebSources?: boolean;
  /** Web kaynakları (varsa) */
  sourcesText?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  flavor: ModelFlavor;
  personaName: string;
  /** Debug için — UI'da gösterilebilir */
  debug: { persona: string; flavor: string; model: string };
}

/**
 * Ana prompt üretici. Persona + flavor birleştirip döndürür.
 */
export function buildSystemPrompt(opts: BuildPromptOptions): BuiltPrompt {
  const persona = PERSONAS[opts.agent];
  const flavor = detectModelFlavor(opts.model);
  const model = opts.model || 'bilinmiyor';

  const sections: string[] = [];

  // 1. Persona — kimlik
  sections.push(`# Kimlik\n${persona.identity}`);
  sections.push(`# Karakter\n${persona.personality}`);

  // 2. Çalışma ilkeleri
  if (persona.principles.length > 0) {
    sections.push(
      `# Çalışma İlkeleri\n${persona.principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    );
  }

  // 3. Ton
  sections.push(`# Ton\nYanıt tonun: ${persona.tone}.`);

  // 4. Model flavor — modele özel ton
  sections.push(
    `# Model Adaptasyonu\nŞu anda şu model üzerinden yanıt veriyorsun: ${flavor.emoji} **${model}** (${flavor.badge}).\n${flavor.toneDirective}`
  );

  // 5. Dil
  sections.push(`# Dil\nYanıtını ${persona.language} ver.`);

  // 6. Geçmiş sohbet
  if (opts.hasHistory) {
    sections.push(
      `# Bağlam\nÖnceki konuşma mesajları sana iletilecek. Onları dikkate al — kullanıcı devam ettiriyor olabilir, aynı bilgiyi tekrar sorma, bağlamı kullan.`
    );
  }

  // 7. Web kaynakları (sadece researcher için)
  if (opts.agent === 'researcher' && opts.sourcesText) {
    if (opts.hasWebSources) {
      sections.push(`# Web Kaynakları\nAşağıdaki gerçek kaynakları kullan:\n\n${opts.sourcesText}`);
    } else {
      sections.push(
        `# Not\nWeb araması şu an mevcut değil. Kendi bilginle kapsamlı araştırma yap; uydurma, "bilmiyorum" demekten çekinme.`
      );
    }
  }

  // 8. Ek talimatlar
  if (opts.extraInstructions) {
    sections.push(`# Ek Talimatlar\n${opts.extraInstructions}`);
  }

  // 9. JSON şeması
  if (opts.jsonSchema) {
    sections.push(
      `# Çıktı Formatı\nYanıtını SADECE aşağıdaki JSON formatında ver, başka metin ekleme:\n\`\`\`json\n${opts.jsonSchema}\n\`\`\``
    );
  } else {
    sections.push(
      `# Çıktı Formatı\nYanıtını doğrudan metin olarak ver. Markdown kullanabilirsin; kod bloğu, liste, başlık uygundur. Gereksiz giriş ("Tabii ki!", "İşte cevabınız:") yapma.`
    );
  }

  return {
    systemPrompt: sections.join('\n\n'),
    flavor,
    personaName: persona.name,
    debug: { persona: persona.name, flavor: flavor.label, model },
  };
}
