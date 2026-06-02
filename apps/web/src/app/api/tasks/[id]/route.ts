import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { tasks } from '@cortexos/db/src/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '../../../../lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  const body = await request.json();
  const [task] = await db.update(tasks).set({ ...body, updatedAt: new Date() })
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, userId))).returning();
  return NextResponse.json(task);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await getLocalUserId();
  await db.delete(tasks).where(and(eq(tasks.id, params.id), eq(tasks.userId, userId)));
  return NextResponse.json({ success: true });
}
