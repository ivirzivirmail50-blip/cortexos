import { createLLM } from '../config/llm';
import { buildSystemPrompt, getTemperatureForModel } from '../config/prompt-builder';

export interface AnalysisResult {
  summary: string;
  patterns: string[];
  insights: string[];
  recommendations: string[];
  dataType: string;
  debug?: { persona: string; flavor: string; model: string };
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runAnalystAgent(
  data: string,
  question: string,
  userId: string,
  history: HistoryMessage[] = [],
  model?: string
): Promise<AnalysisResult> {
  console.log('Analist Agent başlatıldı', { userId, question: question.slice(0, 80), model });

  // Build system prompt using persona + agent template + model flavor
  const promptResult = buildSystemPrompt({
    agent: 'analyst',
    model,
    hasHistory: history.length > 0,
    jsonSchema: JSON.stringify({
      summary: "Veri analizi özeti",
      dataType: "veri türü (metin/sayı/karışık)",
      patterns: ["Örüntü 1", "Örüntü 2"],
      insights: ["İçgörü 1", "İçgörü 2"],
      recommendations: ["Öneri 1", "Öneri 2"]
    }, null, 2),
  });

  const temperature = getTemperatureForModel(model, 'analyst');
  const llm = createLLM({ temperature });

  const userContent = `Veri:\\n"""\\n${data.slice(0, 4000)}\\n"""\\n\\nSoru: ${question}`;

  const messages = [
    { role: 'system' as const, content: promptResult.systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: userContent },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  try {
    const parsed = JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
    return { ...parsed, debug: promptResult.debug };
  } catch {
    return { 
      summary: raw.slice(0, 300), 
      patterns: [], 
      insights: [], 
      recommendations: [], 
      dataType: 'bilinmiyor',
      debug: promptResult.debug,
    };
  }
}
