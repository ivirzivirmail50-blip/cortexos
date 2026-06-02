import { createLLM } from '../config/llm';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  priority: number;
  estimatedTime?: number;
}

export interface Plan {
  title: string;
  description: string;
  steps: PlanStep[];
  timeline?: { startDate?: string; endDate?: string };
}

export interface PlannerResult {
  plan: Plan;
  rawOutput: string;
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function runPlannerAgent(
  input: string,
  userId: string,
  history: HistoryMessage[] = []
): Promise<PlannerResult> {
  console.log('Planner Agent başlatıldı', { userId, input: input.slice(0, 80) });

  const llm = createLLM();

  const systemPrompt = `Sen bir kişisel üretkenlik planlama asistanısın.
Kullanıcının isteğini analiz et ve somut, uygulanabilir bir plan oluştur.
Önceki konuşma varsa bağlamı dikkate al.
Yanıtını SADECE şu JSON formatında ver (başka metin ekleme):
{
  "title": "Planın başlığı",
  "description": "Kısa açıklama",
  "steps": [
    { "id": "step-1", "title": "Adım başlığı", "description": "Detaylı açıklama", "priority": 1, "estimatedTime": 60 }
  ],
  "timeline": { "startDate": "bugün", "endDate": "tahmini bitiş" }
}`;

  // Geçmiş mesajları düzgün LangChain messages olarak gönder — string concat DEĞİL
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-6),
    { role: 'user' as const, content: input },
  ];

  const response = await llm.invoke(messages);
  const rawOutput = response.content?.toString() || '{}';

  let plan: Plan;
  try {
    const cleaned = rawOutput.replace(/```json\s*|\s*```/g, '').trim();
    plan = JSON.parse(cleaned);
  } catch {
    plan = {
      title: input.slice(0, 60),
      description: 'AI tarafından oluşturulan plan',
      steps: [{ id: 'step-1', title: 'İlk adım', description: rawOutput.slice(0, 200), priority: 1 }],
    };
  }

  return { plan, rawOutput };
}
