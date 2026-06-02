import { createLLM } from '../config/llm';

export interface TaskForPrioritization {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  estimatedTime?: number;
  priority: number;
  status: string;
  createdAt: Date;
}

export interface PrioritizedTask extends TaskForPrioritization {
  aiScore: number;
  urgency: number;
  importance: number;
  suggestedPriority: number;
  reasoning: string;
}

export class TaskPrioritizationService {
  static async prioritizeTasks(
    tasks: TaskForPrioritization[]
  ): Promise<PrioritizedTask[]> {
    try {
      const llm = createLLM();

      const prompt = `Görev önceliklendirme uzmanısın. Aşağıdaki görevleri analiz et.

Görevler:
${JSON.stringify(tasks.map(t => ({
  id: t.id,
  title: t.title,
  description: t.description,
  dueDate: t.dueDate?.toISOString(),
  priority: t.priority,
  status: t.status,
})), null, 2)}

Her görev için şunları değerlendir:
- Aciliyet (bitiş tarihine göre)
- Önem (başka görevleri blokluyorsa)
- Etki/Çaba oranı

Yanıtını SADECE JSON array olarak ver:
[
  {
    "id": "görev-id",
    "aiScore": 85,
    "urgency": 8,
    "importance": 7,
    "suggestedPriority": 1,
    "reasoning": "Neden bu öncelik verildi"
  }
]`;

      const response = await llm.invoke([{ role: 'user', content: prompt }]);
      const raw = response.content?.toString() || '[]';

      let aiResults: any[];
      try {
        const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
        aiResults = JSON.parse(cleaned);
      } catch {
        aiResults = [];
      }

      return tasks.map(task => {
        const ai = aiResults.find((r: any) => r.id === task.id);
        const fallbackScore = this.fallbackScore(task);
        return {
          ...task,
          aiScore: ai?.aiScore ?? fallbackScore,
          urgency: ai?.urgency ?? 5,
          importance: ai?.importance ?? 5,
          suggestedPriority: ai?.suggestedPriority ?? task.priority,
          reasoning: ai?.reasoning ?? 'Otomatik önceliklendirme',
        };
      }).sort((a, b) => b.aiScore - a.aiScore);
    } catch (err) {
      console.error('Task prioritization hatası:', err);
      return tasks.map(t => ({
        ...t,
        aiScore: this.fallbackScore(t),
        urgency: 5,
        importance: 5,
        suggestedPriority: t.priority,
        reasoning: 'Fallback önceliklendirme',
      }));
    }
  }

  private static fallbackScore(task: TaskForPrioritization): number {
    let score = 50;
    if (task.dueDate) {
      const days = (task.dueDate.getTime() - Date.now()) / 86400000;
      if (days <= 1) score += 30;
      else if (days <= 3) score += 20;
      else if (days <= 7) score += 10;
    }
    score += (task.priority - 3) * 10;
    if (task.status === 'blocked') score += 15;
    return Math.max(0, Math.min(100, score));
  }
}
