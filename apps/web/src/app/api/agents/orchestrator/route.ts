import { NextResponse } from 'next/server';
import { runOrchestrator } from '@cortexos/ai-core/src/agents/multi-agent';
import { getLocalUserId } from '../../../../lib/auth';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const body = await request.json() as { input?: string; history?: HistoryMessage[] };
    const { input, history = [] } = body;
    if (!input?.trim()) return NextResponse.json({ error: 'input gerekli' }, { status: 400 });
    const result = await runOrchestrator(input, userId, history);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    console.error('[Orchestrator]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
