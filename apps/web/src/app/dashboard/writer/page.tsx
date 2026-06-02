'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="writer" title="✍️ Yazar" subtitle="Makale, blog yazısı veya herhangi bir içerik üret. Revizyon isteyebilirsin." endpoint="/api/agents/writer" placeholder="Ne yazmamı istiyorsun?" suggestions={['Yapay zeka hakkında kısa bir blog yazısı yaz','Müşteriye teşekkür e-postası yaz','Motivasyon içeriği yaz']} />;
}
