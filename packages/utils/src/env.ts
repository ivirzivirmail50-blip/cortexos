export const env = {
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'groq',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://cortex:cortex@localhost:5432/cortexos',
  CHROMA_HOST: process.env.CHROMA_HOST || 'localhost',
  CHROMA_PORT: process.env.CHROMA_PORT || '8000',
  SEARXNG_URL: process.env.SEARXNG_URL || 'http://localhost:8888',
};
