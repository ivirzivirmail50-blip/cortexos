import { NextResponse } from 'next/server';
import { runPlannerAgent } from '@cortexos/ai-core/src/agents/planner-agent';
import { getLocalUserId } from '../../../../lib/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
    const userId = await getLocalUserId();
    const { input, history = [], model } = await request.json() as { input?: string; history?: H[]; model?: string };
    if (!input?.trim()) return NextResponse.json({ error: 'input gerekli' }, { status: 400 });
    
    // Use provided model, or fall back to global settings
    const settings = getSettings();
    const selectedModel = model || settings.model;
    
    const result = await runPlannerAgent(input, userId, history, selectedModel);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 });
  }
}
