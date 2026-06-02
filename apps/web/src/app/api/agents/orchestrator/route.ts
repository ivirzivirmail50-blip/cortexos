import { NextResponse } from 'next/server';
import { createLLM, getTemperatureForModel } from '@cortexos/ai-core/src/config/llm';
import { buildSystemPrompt } from '@cortexos/ai-core/src/config/prompt-builder';
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

    // Use provided model or default
    const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    // Build system prompt
    const promptResult = buildSystemPrompt({
      agent: 'orchestrator',
      model: selectedModel,
      hasHistory: false,
    });

    const temperature = getTemperatureForModel(selectedModel, 'orchestrator');
    const llm = createLLM({ model: selectedModel, temperature, streaming: true });

    const messages = [
      { role: 'system' as const, content: promptResult.systemPrompt },
      { role: 'user' as const, content: input },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = await llm.stream(messages);

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.content?.toString() || '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    console.error('[Orchestrator]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
