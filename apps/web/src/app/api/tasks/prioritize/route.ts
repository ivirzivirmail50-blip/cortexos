import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { tasks } from '@cortexos/db/src/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '../../../../lib/auth';
import { TaskPrioritizationService } from '@cortexos/ai-core/src/services/task-prioritization-service';

export async function POST() {
  const userId = await getLocalUserId();
  const rawTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));

  const forPrioritization = rawTasks
    .filter(t => t.status !== 'done')
    .map(t => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      dueDate: t.dueDate ?? undefined,
      estimatedTime: t.estimatedTime ?? undefined,
      priority: t.priority ?? 3,
      status: t.status ?? 'todo',
      createdAt: t.createdAt,
    }));

  const prioritized = await TaskPrioritizationService.prioritizeTasks(forPrioritization);
  return NextResponse.json(prioritized);
}
