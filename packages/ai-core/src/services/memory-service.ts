/**
 * Memory Service — Kullanıcı hakkında bilgileri saklar ve geri çağırır
 * ChromaDB kullanarak semantik bellek araması yapar
 */

import { getCollection, isChromaAvailable } from '@cortexos/knowledge-base/src/services/chroma-service';
import type { Collection } from 'chromadb';

const MEMORY_COLLECTION_NAME = 'user_memories';

let memoryCollection: Collection | null = null;

async function getMemoryCollection(): Promise<Collection> {
  if (!memoryCollection) {
    const client = (await import('chromadb')).ChromaClient;
    const chromaClient = new client({
      path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || '8000'}`,
    });
    memoryCollection = await chromaClient.getOrCreateCollection({
      name: MEMORY_COLLECTION_NAME,
      metadata: { description: 'Kullanıcı bellekleri için vector store' },
    });
  }
  return memoryCollection;
}

export interface Memory {
  key: string;
  value: string;
  userId: string;
  createdAt: number;
  tags?: string[];
}

export class MemoryService {
  /**
   * Kullanıcı hakkında bir bilgiyi belleğe kaydet
   */
  async remember(userId: string, key: string, value: string, tags?: string[]): Promise<void> {
    try {
      const col = await getMemoryCollection();
      const memoryId = `${userId}:${key}:${Date.now()}`;
      
      // Ollama'dan embedding al
      const embedding = await this.getEmbedding(`${key}: ${value}`);
      
      await col.upsert({
        ids: [memoryId],
        embeddings: [embedding],
        documents: [`${key}: ${value}`],
        metadatas: [{
          userId,
          key,
          value,
          tags: (tags || []).join(','),
          createdAt: Date.now(),
        }],
      });
    } catch (err) {
      console.warn('MemoryService remember hatası:', err);
      // ChromaDB yoksa sessizce geç (degradasyon)
    }
  }

  /**
   * Bellekten ilgili anıları sorgula (semantik arama)
   */
  async recall(userId: string, query: string, limit = 5): Promise<string[]> {
    try {
      const col = await getMemoryCollection();
      const queryEmbedding = await this.getEmbedding(query);

      const results = await col.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: { userId },
      });

      return (results.metadatas[0] || []).map((m: any) => {
        const key = m?.key as string || '';
        const value = m?.value as string || '';
        return `${key}: ${value}`;
      }).filter(Boolean);
    } catch (err) {
      console.warn('MemoryService recall hatası:', err);
      return [];
    }
  }

  /**
   * Son N anıyı getir ve context string olarak formatla
   */
  async getRecentContext(userId: string, limit = 10): Promise<string> {
    try {
      const col = await getMemoryCollection();
      
      // Tüm kullanıcı belleklerini al (zaman sıralı)
      const results = await col.get({
        where: { userId },
        limit: limit * 2, // Daha fazla alıp en yenileri seçeceğiz
        include: ['metadatas'],
      });

      const memories = (results.metadatas || [])
        .filter((m: any) => m && m.userId === userId)
        .sort((a: any, b: any) => (b?.createdAt || 0) - (a?.createdAt || 0))
        .slice(0, limit);

      if (memories.length === 0) {
        return '';
      }

      const formatted = memories.map((m: any) => `- ${m.key}: ${m.value}`).join('\n');
      return `🧠 Kullanıcı Belleği:\n${formatted}`;
    } catch (err) {
      console.warn('MemoryService getRecentContext hatası:', err);
      return '';
    }
  }

  /**
   * Bellekten bir anıyı sil
   */
  async forget(userId: string, key: string): Promise<void> {
    try {
      const col = await getMemoryCollection();
      // Bu key'e sahip tüm bellekleri sil
      await col.delete({
        where: {
          userId,
          key,
        },
      });
    } catch (err) {
      console.warn('MemoryService forget hatası:', err);
    }
  }

  /**
   * Tüm bellekleri listele (UI için)
   */
  async listMemories(userId: string, limit = 50): Promise<Memory[]> {
    try {
      const col = await getMemoryCollection();
      const results = await col.get({
        where: { userId },
        limit,
        include: ['metadatas'],
      });

      return (results.metadatas || [])
        .filter((m: any) => m && m.userId === userId)
        .map((m: any) => ({
          key: m.key as string,
          value: m.value as string,
          userId: m.userId as string,
          createdAt: m.createdAt as number,
          tags: (m.tags as string || '').split(',').filter(Boolean),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.warn('MemoryService listMemories hatası:', err);
      return [];
    }
  }

  /**
   * Ollama'dan embedding al
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    try {
      const res = await fetch(`${ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
          prompt: text.slice(0, 2000),
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`Ollama ${res.status}`);
      const data = await res.json();
      return data.embedding;
    } catch {
      // Ollama yoksa rastgele embedding döndür (geliştirme için)
      console.warn('Ollama embedding alınamadı, mock embedding kullanılıyor');
      return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    }
  }
}

// Singleton instance
export const memoryService = new MemoryService();

/**
 * Helper: ChromaDB'nin mevcut olup olmadığını kontrol et
 */
export async function isMemoryServiceAvailable(): Promise<boolean> {
  return isChromaAvailable();
}
