import { createLLM } from '../config/llm';

export interface AnalysisResult {
  summary: string;
  patterns: string[];
  insights: string[];
  recommendations: string[];
  dataType: string;
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runAnalystAgent(
  data: string,
  question: string,
  userId: string,
  history: HistoryMessage[] = []
): Promise<AnalysisResult> {
  const llm = createLLM();

  const systemPrompt = `Sen bir veri analisti ve iş zekası uzmanısın.
Veriyi analiz et ve soruyu yanıtla. Önceki sorular varsa bağlamı dikkate al.
Yanıtını SADECE şu JSON formatında ver:
{"summary":"Genel özet","dataType":"veri türü","patterns":["Örüntü"],"insights":["İçgörü"],"recommendations":["Öneri"]}`;

  const userContent = `Veri:\n"""\n${data.slice(0, 4000)}\n"""\n\nSoru: ${question}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: userContent },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  try {
    return JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
  } catch {
    return { summary: raw.slice(0, 300), patterns: [], insights: [], recommendations: [], dataType: 'bilinmiyor' };
  }
}
