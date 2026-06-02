import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { goals } from '@cortexos/db/src/schema';
import { eq, desc } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function GET() {
  try {
    const userId = await getLocalUserId();
    const data = await db.select().from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    console.error('[Goals GET]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Hedef başlığı gerekli' }, { status: 400 });
    }

    const [goal] = await db.insert(goals).values({
      userId,
      title: body.title.trim(),
      description: body.description || null,
      priority: body.priority ?? 3,
      status: body.status || 'active',
      deadline: body.deadline ? new Date(body.deadline) : null,
    }).returning();

    return NextResponse.json(goal, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Hata';
    console.error('[Goals POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
