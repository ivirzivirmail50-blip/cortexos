import { NextResponse } from 'next/server';
import { runSummarizerAgent } from '@cortexos/ai-core/src/agents/summarizer-agent';
import { getLocalUserId } from '../../../../lib/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { rateLimiter, validateChatInput } from '@cortexos/utils';

type H = { role: 'user' | 'assistant'; content: string };

const SETTINGS_PATH = join(process.cwd(), '../../.cortexos-settings.json');

function getSettings() {
  if (existsSync(SETTINGS_PATH)) {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  }
  return { provider: process.env.LLM_PROVIDER || 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
}

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

    // Use provided model, or fall back to global settings
    const settings = getSettings();
    const selectedModel = model || settings.model;

    const result = await runSummarizerAgent({ content: input, length: 'medium' }, userId, [], selectedModel);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 });
  }
}
