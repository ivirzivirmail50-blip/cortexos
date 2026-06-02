import { NextResponse } from 'next/server';
import { runOrchestrator } from '@cortexos/ai-core/src/agents/multi-agent';
import { getLocalUserId } from '../../../../../lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getLocalUserId();
    const { title, description } = await request.json() as {
      title?: string;
      description?: string;
    };

    if (!title) {
      return NextResponse.json({ error: 'Görev başlığı gerekli' }, { status: 400 });
    }

    const prompt = [
      `Görev: "${title}"`,
      description ? `Açıklama: ${description}` : null,
      '',
      'Bu görevi analiz et. Ne yapılması gerektiğini adım adım açıkla ve mümkünse direkt yardımcı ol.',
    ].filter(Boolean).join('\n');

    const result = await runOrchestrator(prompt, userId);

    return NextResponse.json({
      taskId: params.id,
      result: result?.finalAnswer || result?.result || result?.response || JSON.stringify(result),
      agentsUsed: result?.agentsUsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
    console.error('[Task/Run] Hata:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
