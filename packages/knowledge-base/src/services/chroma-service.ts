// ChromaDB vector store — dökümanları vektöre çevirir ve semantik arama yapar
import { ChromaClient, Collection } from 'chromadb';

const COLLECTION_NAME = 'cortexos_documents';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

function getClient(): ChromaClient {
  if (!client) {
    client = new ChromaClient({
      path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || '8000'}`,
    });
  }
  return client;
}

async function getCollection(): Promise<Collection> {
  if (!collection) {
    const c = getClient();
    collection = await c.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'CortexOS dökümanları için vector store' },
    });
  }
  return collection;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  content: string;
  userId: string;
  tags?: string[];
}

// Dökümanı ChromaDB'ye ekle (Ollama embed servisi kullanılır)
export async function indexDocument(doc: DocumentChunk): Promise<void> {
  try {
    const col = await getCollection();

    // Ollama'dan embedding al
    const embedding = await getEmbedding(doc.content);

    await col.upsert({
      ids: [doc.id],
      embeddings: [embedding],
      documents: [doc.content],
      metadatas: [{
        documentId: doc.documentId,
        title: doc.title,
        userId: doc.userId,
        tags: (doc.tags || []).join(','),
      }],
    });
  } catch (err) {
    console.warn('ChromaDB index hatası (ChromaDB çalışmıyor olabilir):', err);
  }
}

// Semantik arama
export async function searchDocuments(
  query: string,
  userId: string,
  limit = 5
): Promise<Array<{ documentId: string; title: string; content: string; score: number }>> {
  try {
    const col = await getCollection();
    const queryEmbedding = await getEmbedding(query);

    const results = await col.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: { userId },
    });

    return (results.ids[0] || []).map((id, i) => ({
      documentId: results.metadatas[0][i]?.documentId as string || '',
      title: results.metadatas[0][i]?.title as string || '',
      content: results.documents[0][i] || '',
      score: 1 - (results.distances?.[0]?.[i] || 0),
    }));
  } catch {
    return [];
  }
}

// Dökümanı ChromaDB'den sil
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const col = await getCollection();
    await col.delete({ where: { documentId } });
  } catch {
    // sessizce geç
  }
}

// Ollama'dan embedding al (nomic-embed-text modeli)
async function getEmbedding(text: string): Promise<number[]> {
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

export async function isChromaAvailable(): Promise<boolean> {
  try {
    const c = getClient();
    await c.heartbeat();
    return true;
  } catch {
    return false;
  }
}
