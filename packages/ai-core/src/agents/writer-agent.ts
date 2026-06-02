import { createLLM } from '../config/llm';

export interface WrittenContent {
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runWriterAgent(
  topic: string,
  context: string,
  userId: string,
  history: HistoryMessage[] = []
): Promise<WrittenContent> {
  console.log('Writer Agent başlatıldı', { userId, topic });
  const llm = createLLM();

  const systemPrompt = `Sen profesyonel bir içerik yazarısın. Türkçe yaz.
Önceki konuşma varsa (revizyon, düzenleme istekleri) bağlamı dikkate al.
Yanıtını SADECE şu JSON formatında ver: {"title":"Başlık","content":"İçerik"}
${context ? `Ek talimatlar: ${context}` : ''}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
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
  return { title, content, wordCount: words, readingTime: Math.ceil(words / 200) };
}
