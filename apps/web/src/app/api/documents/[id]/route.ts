import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { documents } from '@cortexos/db/src/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '../../../../lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  const [doc] = await db.select().from(documents).where(and(eq(documents.id, params.id), eq(documents.userId, userId)));
  return doc ? NextResponse.json(doc) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  const body = await request.json();
  const [doc] = await db.update(documents).set({ ...body, updatedAt: new Date() })
    .where(and(eq(documents.id, params.id), eq(documents.userId, userId))).returning();
  return NextResponse.json(doc);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  await db.delete(documents).where(and(eq(documents.id, params.id), eq(documents.userId, userId)));
  return NextResponse.json({ success: true });
}
