/**
 * Environment Configuration with Validation
 * Centralized env management with runtime validation
 */

interface EnvConfig {
  LLM_PROVIDER: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  MISTRAL_API_KEY?: string;
  MISTRAL_MODEL: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL: string;
  OLLAMA_BASE_URL: string;
  OLLAMA_MODEL: string;
  DATABASE_URL: string;
  CHROMA_HOST: string;
  CHROMA_PORT: string;
  SEARXNG_URL: string;
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL: string;
  DEBUG_MODE: boolean;
}

const requiredForProvider: Record<string, (keyof EnvConfig)[]> = {
  groq: ['GROQ_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  gemini: ['GEMINI_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
  ollama: [], // Local, no API key needed
};

export const env: EnvConfig = {
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'groq',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL || 'mistral-small-latest',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://cortex:cortex@localhost:5432/cortexos',
  CHROMA_HOST: process.env.CHROMA_HOST || 'localhost',
  CHROMA_PORT: process.env.CHROMA_PORT || '8000',
  SEARXNG_URL: process.env.SEARXNG_URL || 'http://localhost:8888',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  DEBUG_MODE: process.env.DEBUG_MODE === 'true' || false,
};

/**
 * Validate environment variables at runtime
 * Call this during application startup
 */
export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required provider key
  const provider = env.LLM_PROVIDER.toLowerCase();
  const requiredKeys = requiredForProvider[provider] || [];
  
  for (const key of requiredKeys) {
    if (!env[key]) {
      errors.push(`Missing required API key for ${provider}: ${key}`);
    }
  }

  // Check database URL
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('cortex:cortex')) {
    warnings.push('Using default database credentials. Update DATABASE_URL for production.');
  }

  // Check NextAuth secret in production
  if (process.env.NODE_ENV === 'production' && !env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required in production. Generate with: openssl rand -base64 32');
  }

  // Warn about unused provider keys
  const allProviders = ['groq', 'openai', 'anthropic', 'gemini', 'mistral', 'openrouter'] as const;
  const providerKeyMap: Record<string, string> = {
    groq: 'GROQ_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };

  for (const p of allProviders) {
    if (p !== provider && env[providerKeyMap[p] as keyof EnvConfig] as string) {
      warnings.push(`API key for ${p} is set but ${provider} is the active provider.`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(e => console.error(`  • ${e}`));
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    warnings.forEach(w => console.warn(`  • ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export default env;
