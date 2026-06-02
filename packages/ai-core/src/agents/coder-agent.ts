import { createLLM } from '../config/llm';
import { buildSystemPrompt, getTemperatureForModel } from '../config/prompt-builder';

export interface CodeSnippet {
  language: string;
  code: string;
  explanation: string;
  fileName?: string;
}

export interface CoderResult {
  task: string;
  snippets: CodeSnippet[];
  summary: string;
  debug?: { persona: string; flavor: string; model: string };
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runCoderAgent(
  task: string,
  language: string,
  userId: string,
  history: HistoryMessage[] = [],
  model?: string
): Promise<CoderResult> {
  console.log('Coder Agent başlatıldı', { userId, task: task.slice(0, 80), language, model });

  // Build system prompt using persona + agent template + model flavor
  const promptResult = buildSystemPrompt({
    agent: 'coder',
    model,
    hasHistory: history.length > 0,
    extraInstructions: language ? `Tercih edilen programlama dili: ${language}` : undefined,
    jsonSchema: JSON.stringify({
      task: "Görev açıklaması",
      snippets: [
        { language: "ts", code: "// kod", explanation: "açıklama", fileName: "dosya.ts" }
      ],
      summary: "Kodun özeti ve kullanım talimatları"
    }, null, 2),
  });

  const temperature = getTemperatureForModel(model, 'coder');
  const llm = createLLM({ temperature });

  const messages = [
    { role: 'system' as const, content: promptResult.systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: task },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  try {
    const parsed = JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
    return { ...parsed, debug: promptResult.debug };
  } catch {
    return {
      task,
      snippets: [{ language: language || 'text', code: raw, explanation: 'AI yanıtı' }],
      summary: 'Kod oluşturuldu',
      debug: promptResult.debug,
    };
  }
}
