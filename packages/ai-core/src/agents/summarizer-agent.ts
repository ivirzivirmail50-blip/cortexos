import { createLLM } from '../config/llm';

export type SummaryLength = 'short' | 'medium' | 'detailed';
export type SummaryFormat = 'paragraph' | 'bullets' | 'structured';

export interface SummaryRequest {
  content: string;
  length?: SummaryLength;
  format?: SummaryFormat;
  focusPoints?: string[];
  language?: string;
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: { original: number; summary: number; reductionPercent: number };
  topics: string[];
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

const LENGTH_MAP: Record<SummaryLength, string> = {
  short: '2-3 cümle (maks 100 kelime)',
  medium: '1-2 paragraf (100-250 kelime)',
  detailed: '3-5 paragraf (250-500 kelime)',
};

export async function runSummarizerAgent(
  request: SummaryRequest,
  userId: string,
  history: HistoryMessage[] = []
): Promise<SummaryResult> {
  const { content, length = 'medium', format = 'paragraph', focusPoints = [], language = 'tr' } = request;

  const llm = createLLM();

  const systemPrompt = `Sen uzman bir metin özetleme asistanısın.
Özet uzunluğu: ${LENGTH_MAP[length]}
Format: ${format}
${focusPoints.length ? `Odaklan: ${focusPoints.join(', ')}` : ''}
${language === 'tr' ? 'Türkçe yaz.' : `${language} dilinde yaz.`}
Yanıtını SADECE şu JSON formatında ver:
{"summary":"Özet","keyPoints":["Nokta 1","Nokta 2"],"topics":["konu1"]}`;

  const userContent = `Şu metni özetle:\n"""\n${content.slice(0, 8000)}\n"""`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-4), // Summarizer için daha az geçmiş yeterli
    { role: 'user' as const, content: userContent },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  let parsed: { summary: string; keyPoints: string[]; topics: string[] };
  try {
    parsed = JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
  } catch {
    parsed = { summary: raw.slice(0, 500), keyPoints: [], topics: [] };
  }

  const originalWords = content.split(/\s+/).length;
  const summaryWords = parsed.summary.split(/\s+/).length;

  return {
    summary: parsed.summary,
    keyPoints: parsed.keyPoints || [],
    topics: parsed.topics || [],
    wordCount: {
      original: originalWords,
      summary: summaryWords,
      reductionPercent: Math.max(0, Math.round((1 - summaryWords / originalWords) * 100)),
    },
  };
}
