// Sohbet geçmişini DB'ye kaydeden yardımcı fonksiyonlar

export async function createSession(agentType: string, title?: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await fetch('/api/chat-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentType, title, sessionId }),
  });
  return sessionId;
}

export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  title?: string
) {
  await fetch(`/api/chat-history/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content, title }),
  });
}

export async function getSessions() {
  const res = await fetch('/api/chat-history');
  return res.json();
}

export async function getSession(sessionId: string) {
  const res = await fetch(`/api/chat-history/${sessionId}`);
  return res.json();
}
