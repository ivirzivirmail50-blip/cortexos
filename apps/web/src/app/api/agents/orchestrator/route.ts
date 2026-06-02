import { NextResponse } from 'next/server';
import { runOrchestrator } from '@cortexos/ai-core/src/agents/multi-agent';
import { getLocalUserId } from '../../../../lib/auth';
import { rateLimiter, validateChatInput } from '@cortexos/utils';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = rateLimiter.check(ip);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded', retryAfter: limit.retryAfter }, { status: 429 });
    }

    // Validate input
    const body = await request.json();
    const validation = validateChatInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const userId = await getLocalUserId();
    const { message: input, model } = validation.data!;

    const result = await runOrchestrator(input, userId, [], model);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    console.error('[Orchestrator]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
