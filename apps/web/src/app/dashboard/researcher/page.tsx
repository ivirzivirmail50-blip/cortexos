'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="researcher" title="🔍 Araştırmacı" subtitle="Bir konu hakkında araştırma yap. Sorular sorarak devam edebilirsin." endpoint="/api/agents/researcher" placeholder="Ne araştırmak istiyorsun?" suggestions={['Yapay zeka son trendleri','React Server Components nedir','En iyi üretkenlik teknikleri']} />;
}
