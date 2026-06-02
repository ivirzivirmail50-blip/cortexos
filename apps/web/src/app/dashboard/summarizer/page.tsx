'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="summarizer" title="📋 Özetleyici" subtitle="Metin, makale veya belge özetle. Daha kısa veya detaylı isteyebilirsin." endpoint="/api/agents/summarizer" placeholder="Özetlemek istediğin metni yapıştır..." suggestions={['Daha kısa özetle','5 madde halinde ver','Temel noktaları listele']} />;
}
