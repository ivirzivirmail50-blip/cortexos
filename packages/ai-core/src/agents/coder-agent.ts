import { createLLM } from '../config/llm';

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
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runCoderAgent(
  task: string,
  language: string,
  userId: string,
  history: HistoryMessage[] = []
): Promise<CoderResult> {
  const llm = createLLM();

  const systemPrompt = `Sen expert bir yazılım geliştiricisin.
Önceki kod veya konuşma varsa bağlamı dikkate al (örn: "bunu düzelt", "ekle" gibi istekler).
Tercih edilen dil: ${language || 'herhangi biri'}
Yanıtını SADECE şu JSON formatında ver:
{"task":"görev","snippets":[{"language":"ts","code":"// kod","explanation":"açıklama","fileName":"dosya.ts"}],"summary":"Açıklama"}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: task },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  try {
    return JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
  } catch {
    return {
      task,
      snippets: [{ language: language || 'text', code: raw, explanation: 'AI yanıtı' }],
      summary: 'Kod oluşturuldu',
    };
  }
}
