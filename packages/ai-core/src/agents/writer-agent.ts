import { createLLM } from '../config/llm';
import { buildSystemPrompt, getTemperatureForModel } from '../config/prompt-builder';

export interface WrittenContent {
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
  debug?: { persona: string; flavor: string; model: string };
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runWriterAgent(
  topic: string,
  context: string,
  userId: string,
  history: HistoryMessage[] = [],
  model?: string
): Promise<WrittenContent> {
  console.log('Writer Agent başlatıldı', { userId, topic, model });

  // Build system prompt using persona + agent template + model flavor
  const promptResult = buildSystemPrompt({
    agent: 'writer',
    model,
    hasHistory: history.length > 0,
    extraInstructions: context ? `Ek bağlam/talimatlar: ${context}` : undefined,
    jsonSchema: JSON.stringify({
      title: "İçerik başlığı",
      content: "Ana içerik (Markdown destekli)"
    }, null, 2),
  });

  const temperature = getTemperatureForModel(model, 'writer');
  const llm = createLLM({ temperature });

  const messages = [
    { role: 'system' as const, content: promptResult.systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: topic },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  let title = topic;
  let content = raw;

  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      title = parsed.title || topic;
      content = parsed.content || raw;
    }
  } catch {
    content = raw.replace(/^\s*\{.*?"content"\s*:\s*"/s, '').replace(/"\s*\}\s*$/s, '').replace(/\\n/g, '\n').trim();
    if (!content || content.length < 50) content = raw;
  }

  const words = content.split(/\s+/).filter(Boolean).length;
  return { 
    title, 
    content, 
    wordCount: words, 
    readingTime: Math.ceil(words / 200),
    debug: promptResult.debug,
  };
}
