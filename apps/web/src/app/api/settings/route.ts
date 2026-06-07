import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SETTINGS_PATH = join(process.cwd(), '../../.cortexos-settings.json');
const ENV_KEYS_PATH = join(process.cwd(), '../../.cortexos-apikeys.json');

interface Settings {
  provider: string;
  model: string;
  theme: 'light' | 'dark';
}

interface ApiKeys {
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

const DEFAULT_SETTINGS: Settings = {
  provider: process.env.LLM_PROVIDER || 'groq',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  theme: 'light',
};

export async function GET() {
  try {
    let settings = DEFAULT_SETTINGS;
    if (existsSync(SETTINGS_PATH)) {
      const data = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      settings = { ...settings, ...data };
    }
    
    // Load API keys
    let apiKeys: ApiKeys = {};
    if (existsSync(ENV_KEYS_PATH)) {
      apiKeys = JSON.parse(readFileSync(ENV_KEYS_PATH, 'utf-8'));
    }
    
    return NextResponse.json({ ...settings, apiKeys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    // Update settings
    let existing = DEFAULT_SETTINGS;
    if (existsSync(SETTINGS_PATH)) {
      existing = { ...existing, ...JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) };
    }
    const updated = { ...existing, ...body };
    writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
    
    // Update API keys if provided
    if (body.apiKeys) {
      let currentKeys: ApiKeys = {};
      if (existsSync(ENV_KEYS_PATH)) {
        currentKeys = JSON.parse(readFileSync(ENV_KEYS_PATH, 'utf-8'));
      }
      const updatedKeys = { ...currentKeys, ...body.apiKeys };
      writeFileSync(ENV_KEYS_PATH, JSON.stringify(updatedKeys, null, 2));
    }
    
    return NextResponse.json({ ...updated, apiKeys: body.apiKeys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
