import { NextResponse } from 'next/server';
import { runAnalystAgent } from '@cortexos/ai-core/src/agents/analyst-agent';
import { getLocalUserId } from '../../../../lib/auth';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const body = await request.json() as { input?: string; history?: HistoryMessage[] };
    const { input, history = [] } = body;
    if (!input?.trim()) return NextResponse.json({ error: 'input gerekli' }, { status: 400 });
    const result = await runAnalystAgent(input, input, userId, history);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
