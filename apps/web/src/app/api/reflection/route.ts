import { NextResponse } from 'next/server';
import { createLLM } from '@cortexos/ai-core/src/config/llm';
import { db } from '@cortexos/db';
import { reflections, tasks, goals } from '@cortexos/db/src/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function POST(request: Request) {
  const userId = await getLocalUserId();
  const { period, mood, notes } = await request.json();

  const [recentTasks, recentGoals] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(goals).where(eq(goals.userId, userId)),
  ]);

  const completedTasks = recentTasks.filter(t => t.status === 'done').length;
  const activeGoals = recentGoals.filter(g => g.status === 'active').length;

  const llm = createLLM();
  const prompt = `Sen kişisel gelişim koçusun. Kullanıcının ${period === 'weekly' ? 'haftalık' : 'günlük'} yansımasını analiz et.

Veriler:
- Tamamlanan görev: ${completedTasks} / ${recentTasks.length}
- Aktif hedef sayısı: ${activeGoals}
- Kullanıcı notları: ${notes || 'Belirtilmedi'}
- Ruh hali (1-10): ${mood || 'Belirtilmedi'}

Yanıtını SADECE JSON formatında ver:
{
  "insights": ["içgörü 1", "içgörü 2", "içgörü 3"],
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "improvements": ["gelişim alanı 1", "gelişim alanı 2"],
  "nextActions": ["öneri 1", "öneri 2"],
  "motivationalMessage": "Kısa motivasyon mesajı"
}`;

  const response = await llm.invoke([{ role: 'user', content: prompt }]);
  const raw = response.content?.toString() || '{}';

  let aiInsights;
  try {
    aiInsights = JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
  } catch {
    aiInsights = { insights: [], strengths: [], improvements: [], nextActions: [], motivationalMessage: raw.slice(0, 200) };
  }

  const [reflection] = await db.insert(reflections).values({
    userId,
    period: period || 'daily',
    content: notes || '',
    insights: aiInsights,
    mood,
  }).returning();

  return NextResponse.json({ reflection, aiInsights });
}

export async function GET() {
  const userId = await getLocalUserId();
  const data = await db.select().from(reflections).where(eq(reflections.userId, userId));
  return NextResponse.json(data);
}
