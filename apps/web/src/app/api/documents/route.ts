import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { documents } from '@cortexos/db/src/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function GET() {
  const userId = await getLocalUserId();
  const docs = await db.select().from(documents).where(eq(documents.userId, userId));
  return NextResponse.json(docs);
}

export async function POST(request: Request) {
  const userId = await getLocalUserId();
  const body = await request.json();
  const [doc] = await db.insert(documents).values({
    userId,
    title: body.title,
    content: body.content,
    type: body.type || 'note',
    tags: body.tags || [],
    metadata: body.metadata || {},
  }).returning();
  return NextResponse.json(doc);
}
