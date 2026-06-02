import { NextResponse } from 'next/server';
import { runWriterAgent } from '@cortexos/ai-core/src/agents/writer-agent';
import { getLocalUserId } from '../../../../lib/auth';

type H = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const { input, history = [] } = await request.json() as { input?: string; history?: H[] };
    if (!input?.trim()) return NextResponse.json({ error: 'input gerekli' }, { status: 400 });
    const result = await runWriterAgent(input, '', userId, history);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 });
  }
}
