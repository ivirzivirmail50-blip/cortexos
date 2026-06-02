/**
 * Ajan + model için nihai system prompt üretici.
 * Persona (karakter) + Model flavor (ton/derinlik) + Agent Prompt Template birleştirilir.
 */

import { AgentType, PERSONAS } from './personas';
import { detectModelFlavor, ModelFlavor, getTemperatureForModel } from './model-flavors';
import { getAgentPromptTemplate } from './agent-prompts';

// Re-export temperature helper for convenience
export { getTemperatureForModel };

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
 * Ana prompt üretici. Persona + Agent Template + Flavor birleştirip döndürür.
 */
export function buildSystemPrompt(opts: BuildPromptOptions): BuiltPrompt {
  const persona = PERSONAS[opts.agent];
  const agentTemplate = getAgentPromptTemplate(opts.agent);
  const flavor = detectModelFlavor(opts.model);
  const model = opts.model || 'bilinmiyor';

  const sections: string[] = [];

  // 1. Persona — kimlik
  sections.push(`# 🎭 Kimlik\n${persona.identity}`);
  sections.push(`# 🧠 Karakter\n${persona.personality}`);

  // 2. Çalışma ilkeleri
  if (persona.principles.length > 0) {
    sections.push(
      `# 📜 Çalışma İlkeleri\n${persona.principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    );
  }

  // 3. Görev tanımı (agent-specific)
  sections.push(`# 🎯 Görev Tanımı\n${agentTemplate.taskDescription}`);

  // 4. Format spesifikasyonları
  if (agentTemplate.formatSpecs.length > 0) {
    sections.push(
      `# 📋 Çıktı Formatı\n${agentTemplate.formatSpecs.map((f, i) => `• ${f}`).join('\n')}`
    );
  }

  // 5. Örnek çıktı (varsa)
  if (agentTemplate.exampleOutput) {
    sections.push(`# 💡 Örnek Çıktı\n${agentTemplate.exampleOutput}`);
  }

  // 6. Kaçınılması gerekenler
  if (agentTemplate.avoid.length > 0) {
    sections.push(
      `# ⚠️ Kaçınılması Gerekenler\n${agentTemplate.avoid.map((a, i) => `• ${a}`).join('\n')}`
    );
  }

  // 7. Özel talimatlar (varsa)
  if (agentTemplate.specialInstructions && agentTemplate.specialInstructions.length > 0) {
    sections.push(
      `# 🔑 Özel Talimatlar\n${agentTemplate.specialInstructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    );
  }

  // 8. Ton
  sections.push(`# 🎨 Ton\nYanıt tonun: ${persona.tone}.`);

  // 9. Model flavor — modele özel ton
  sections.push(
    `# 🔮 Model Adaptasyonu\nŞu anda şu model üzerinden yanıt veriyorsun: ${flavor.emoji} **${model}** (${flavor.badge}).\n${flavor.toneDirective}`
  );

  // 10. Dil
  sections.push(`# 🌐 Dil\nYanıtını ${persona.language} ver.`);

  // 11. Geçmiş sohbet
  if (opts.hasHistory) {
    sections.push(
      `# 📚 Bağlam\nÖnceki konuşma mesajları sana iletilecek. Onları dikkate al — kullanıcı devam ettiriyor olabilir, aynı bilgiyi tekrar sorma, bağlamı kullan.`
    );
  }

  // 12. Web kaynakları (sadece researcher için)
  if (opts.agent === 'researcher' && opts.sourcesText) {
    if (opts.hasWebSources) {
      sections.push(`# 🌍 Web Kaynakları\nAşağıdaki gerçek kaynakları kullan:\n\n${opts.sourcesText}`);
    } else {
      sections.push(
        `# 📝 Not\nWeb araması şu an mevcut değil. Kendi bilginle kapsamlı araştırma yap; uydurma, "bilmiyorum" demekten çekinme.`
      );
    }
  }

  // 13. Ek talimatlar
  if (opts.extraInstructions) {
    sections.push(`# ➕ Ek Talimatlar\n${opts.extraInstructions}`);
  }

  // 14. JSON şeması
  if (opts.jsonSchema) {
    sections.push(
      `# 📦 Çıktı Formatı (JSON)\nYanıtını SADECE aşağıdaki JSON formatında ver, başka metin ekleme:\n\`\`\`json\n${opts.jsonSchema}\n\`\`\``
    );
  } else {
    sections.push(
      `# ✍️ Çıktı Formatı\nYanıtını doğrudan metin olarak ver. Markdown kullanabilirsin; kod bloğu, liste, başlık uygundur. Gereksiz giriş ("Tabii ki!", "İşte cevabınız:") yapma.`
    );
  }

  return {
    systemPrompt: sections.join('\n\n'),
    flavor,
    personaName: persona.name,
    debug: { persona: persona.name, flavor: flavor.label, model },
  };
}
