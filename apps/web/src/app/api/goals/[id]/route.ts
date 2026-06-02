import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { goals } from '@cortexos/db/src/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '../../../../lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  const body = await request.json();
  const [goal] = await db.update(goals)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(goals.id, params.id), eq(goals.userId, userId)))
    .returning();
  return NextResponse.json(goal);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  await db.delete(goals).where(and(eq(goals.id, params.id), eq(goals.userId, userId)));
  return NextResponse.json({ success: true });
}
