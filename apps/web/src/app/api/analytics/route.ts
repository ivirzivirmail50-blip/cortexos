import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { tasks, goals, documents, reflections } from '@cortexos/db/src/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function GET() {
  const userId = await getLocalUserId();

  const [allTasks, allGoals, allDocs, allReflections] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(goals).where(eq(goals.userId, userId)),
    db.select().from(documents).where(eq(documents.userId, userId)),
    db.select().from(reflections).where(eq(reflections.userId, userId)),
  ]);

  const tasksByStatus = {
    todo: allTasks.filter(t => t.status === 'todo').length,
    'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
    blocked: allTasks.filter(t => t.status === 'blocked').length,
  };

  const completionRate = allTasks.length > 0
    ? Math.round((tasksByStatus.done / allTasks.length) * 100)
    : 0;

  const avgMood = allReflections.length > 0
    ? Math.round(allReflections.reduce((sum, r) => sum + (r.mood ?? 5), 0) / allReflections.length * 10) / 10
    : null;

  return NextResponse.json({
    tasks: { total: allTasks.length, byStatus: tasksByStatus, completionRate },
    goals: {
      total: allGoals.length,
      active: allGoals.filter(g => g.status === 'active').length,
      completed: allGoals.filter(g => g.status === 'completed').length,
    },
    documents: { total: allDocs.length },
    reflections: { total: allReflections.length, avgMood },
  });
}
