import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { agentSessions, messages } from '@cortexos/db/src/schema';
import { eq, desc } from 'drizzle-orm';
import { getLocalUserId } from '../../../lib/auth';

export async function GET() {
  const userId = await getLocalUserId();
  const sessions = await db
    .select()
    .from(agentSessions)
    .where(eq(agentSessions.userId, userId))
    .orderBy(desc(agentSessions.updatedAt))
    .limit(50);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const userId = await getLocalUserId();
  const { agentType, title, sessionId } = await request.json();

  const [session] = await db.insert(agentSessions).values({
    userId,
    sessionId: sessionId || crypto.randomUUID(),
    agentType,
    title: title || `${agentType} - ${new Date().toLocaleDateString('tr-TR')}`,
    status: 'active',
  }).returning();

  return NextResponse.json(session);
}
