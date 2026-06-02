import { NextResponse } from 'next/server';
import { runAnalystAgent } from '@cortexos/ai-core/src/agents/analyst-agent';
import { getLocalUserId } from '../../../../lib/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

const SETTINGS_PATH = join(process.cwd(), '../../.cortexos-settings.json');

function getSettings() {
  if (existsSync(SETTINGS_PATH)) {
    return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  }
  return { provider: process.env.LLM_PROVIDER || 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' };
}

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const body = await request.json() as { input?: string; history?: HistoryMessage[]; model?: string };
    const { input, history = [], model } = body;
    if (!input?.trim()) return NextResponse.json({ error: 'input gerekli' }, { status: 400 });
    
    // Use provided model, or fall back to global settings
    const settings = getSettings();
    const selectedModel = model || settings.model;
    
    const result = await runAnalystAgent(input, input, userId, history, selectedModel);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
