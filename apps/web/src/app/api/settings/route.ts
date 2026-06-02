import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SETTINGS_PATH = join(process.cwd(), '../../.cortexos-settings.json');

interface Settings {
  provider: string;
  model: string;
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: Settings = {
  provider: process.env.LLM_PROVIDER || 'groq',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  theme: 'light',
};

export async function GET() {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const data = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
      return NextResponse.json({ ...DEFAULT_SETTINGS, ...data });
    }
  } catch {}
  return NextResponse.json(DEFAULT_SETTINGS);
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    let existing = DEFAULT_SETTINGS;
    if (existsSync(SETTINGS_PATH)) {
      existing = { ...existing, ...JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) };
    }
    const updated = { ...existing, ...body };
    writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
