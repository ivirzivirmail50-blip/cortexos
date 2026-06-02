import { NextResponse } from 'next/server';
import { db } from '@cortexos/db';
import { agentSessions, messages } from '@cortexos/db/src/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(_: Request, { params }: { params: { sessionId: string } }) {
  const [session] = await db.select().from(agentSessions)
    .where(eq(agentSessions.sessionId, params.sessionId));
  if (!session) return NextResponse.json({ error: 'Session bulunamadı' }, { status: 404 });

  const msgs = await db.select().from(messages)
    .where(eq(messages.sessionId, session.id))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({ session, messages: msgs });
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const { role, content, agentType, title } = await request.json();

  let [session] = await db.select().from(agentSessions)
    .where(eq(agentSessions.sessionId, params.sessionId));

  if (!session) {
    // Session yoksa oluştur - userId gerektiriyor, import ekle
    return NextResponse.json({ error: 'Session bulunamadı' }, { status: 404 });
  }

  // Session başlığını güncelle
  if (title) {
    await db.update(agentSessions)
      .set({ title, updatedAt: new Date() })
      .where(eq(agentSessions.sessionId, params.sessionId));
  }

  const [msg] = await db.insert(messages).values({
    sessionId: session.id,
    senderType: role,
    content,
    messageType: 'text',
    metadata: agentType ? { agentType } : undefined,
  }).returning();

  return NextResponse.json(msg);
}

export async function DELETE(_: Request, { params }: { params: { sessionId: string } }) {
  await db.delete(agentSessions).where(eq(agentSessions.sessionId, params.sessionId));
  return NextResponse.json({ success: true });
}
