import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { tasks } from '@cortexos/db/src/schema';
import { eq, desc } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function GET() {
  try {
    const userId = await getLocalUserId();
    const data = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hata';
    console.error('[Tasks GET] Hata:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getLocalUserId();
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Görev başlığı gerekli' }, { status: 400 });
    }

    const [task] = await db.insert(tasks).values({
      userId,
      title: body.title.trim(),
      description: body.description || null,
      priority: body.priority ?? 3,
      status: body.status || 'todo',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      estimatedTime: body.estimatedTime ? Number(body.estimatedTime) : null,
    }).returning();

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hata';
    console.error('[Tasks POST] Hata:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
