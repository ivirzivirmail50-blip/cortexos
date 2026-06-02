import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { documents } from '@cortexos/db/src/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';
import { indexDocument, searchDocuments, isChromaAvailable } from '@cortexos/knowledge-base';

// Tüm dökümanları knowledge base'e index et
export async function POST(request: Request) {
  const userId = await getLocalUserId();
  const { action, query } = await request.json();

  if (action === 'search') {
    if (!query) return NextResponse.json({ error: 'query gerekli' }, { status: 400 });
    const results = await searchDocuments(query, userId);
    return NextResponse.json({ results });
  }

  if (action === 'index-all') {
    const docs = await db.select().from(documents).where(eq(documents.userId, userId));
    let indexed = 0;
    for (const doc of docs) {
      await indexDocument({
        id: doc.id,
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        userId: doc.userId,
        tags: doc.tags ?? [],
      });
      indexed++;
    }
    return NextResponse.json({ success: true, indexed });
  }

  return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
}

export async function GET() {
  const chromaOk = await isChromaAvailable();
  return NextResponse.json({ chromaAvailable: chromaOk });
}
