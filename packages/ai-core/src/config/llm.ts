import { ChatGroq } from '@langchain/groq';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessageChunk } from '@langchain/core/messages';
import { IterableReadableStream } from '@langchain/core/utils/stream';

export type LLMProvider = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'ollama' | 'openrouter' | 'deepseek';

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
  temperature?: number;
  streaming?: boolean;
}

export function createLLM(config?: Partial<LLMConfig>): BaseChatModel {
  const provider = (config?.provider || process.env.LLM_PROVIDER || 'groq') as LLMProvider;
  const temperature = config?.temperature ?? 0.7;
  const streaming = config?.streaming ?? false;

  switch (provider) {
    case 'groq': {
      const apiKey = config?.apiKey || process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY eksik');
      return new ChatGroq({
        apiKey,
        model: config?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature,
        streaming,
      });
    }

    case 'openai': {
      const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY eksik');
      return new ChatOpenAI({
        apiKey,
        modelName: config?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature,
        streaming,
      });
    }

    case 'anthropic': {
      const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY eksik');
      return new ChatAnthropic({
        apiKey,
        modelName: config?.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        temperature,
        streaming,
      } as any);
    }

    case 'gemini': {
      const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY eksik');
      return new ChatGoogleGenerativeAI({
        apiKey,
        model: config?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        temperature,
        streaming,
      } as any);
    }

    case 'mistral': {
      // Mistral, OpenAI uyumlu API kullanıyor
      const apiKey = config?.apiKey || process.env.MISTRAL_API_KEY;
      if (!apiKey) throw new Error('MISTRAL_API_KEY eksik');
      return new ChatOpenAI({
        apiKey,
        modelName: config?.model || process.env.MISTRAL_MODEL || 'mistral-small-latest',
        temperature,
        streaming,
        configuration: {
          baseURL: 'https://api.mistral.ai/v1',
        },
      });
    }

    case 'openrouter': {
      const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('OPENROUTER_API_KEY eksik');
      return new ChatOpenAI({
        apiKey,
        modelName: config?.model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
        temperature,
        streaming,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'CortexOS',
          },
        },
      });
    }

    case 'ollama': {
      return new ChatOpenAI({
        modelName: config?.model || process.env.OLLAMA_MODEL || 'llama3',
        temperature,
        streaming,
        configuration: {
          baseURL: `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/v1`,
          apiKey: 'ollama',
        },
      });
    }

    case 'deepseek': {
      // DeepSeek, OpenAI uyumlu API kullanıyor
      const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error('DEEPSEEK_API_KEY eksik');
      return new ChatOpenAI({
        apiKey,
        modelName: config?.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        temperature,
        streaming,
        configuration: {
          baseURL: 'https://api.deepseek.com/v1',
        },
      });
    }

    default:
      throw new Error(`Bilinmeyen provider: ${provider}`);
  }
}

/**
 * Creates an LLM instance with streaming enabled and returns the stream
 */
export async function streamLLM(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  config?: Partial<LLMConfig>
): Promise<IterableReadableStream<AIMessageChunk>> {
  const llm = createLLM({ ...config, streaming: true });
  const response = await llm.stream(messages.map(m => [m.role, m.content] as const));
  return response;
}

export const PROVIDERS = {
  groq: {
    name: 'Groq',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    envKey: 'GROQ_API_KEY',
    url: 'https://console.groq.com',
    free: true,
  },
  gemini: {
    name: 'Google Gemini',
    models: [
      'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash-preview-04-17',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    envKey: 'GEMINI_API_KEY',
    url: 'https://aistudio.google.com',
    free: true,
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      // Ücretsiz modeller
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-4-scout:free',
      'google/gemma-3-27b-it:free',
      'deepseek/deepseek-r1:free',
      'deepseek/deepseek-v3:free',
      'mistralai/mistral-7b-instruct:free',
      'nvidia/llama-3.1-nemotron-70b-instruct:free',
      // Ücretli ama güçlü
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/o1-mini',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3.5-haiku',
      'google/gemini-2.0-flash-001',
      'mistralai/mistral-large-latest',
    ],
    envKey: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai',
    free: true,
  },
  mistral: {
    name: 'Mistral AI',
    models: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'codestral-latest',
      'open-mistral-nemo',
      'open-codestral-mamba',
    ],
    envKey: 'MISTRAL_API_KEY',
    url: 'https://console.mistral.ai',
    free: false,
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'gpt-3.5-turbo'],
    envKey: 'OPENAI_API_KEY',
    url: 'https://platform.openai.com',
    free: false,
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    models: [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ],
    envKey: 'ANTHROPIC_API_KEY',
    url: 'https://console.anthropic.com',
    free: false,
  },
  ollama: {
    name: 'Ollama (Yerel)',
    models: ['llama3', 'llama3.1', 'llama3.2', 'mistral', 'codellama', 'phi3', 'gemma2', 'deepseek-coder'],
    envKey: null,
    url: 'https://ollama.com',
    free: true,
  },
  deepseek: {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-v3'],
    envKey: 'DEEPSEEK_API_KEY',
    url: 'https://platform.deepseek.com',
    free: false,
  },
} as const;
