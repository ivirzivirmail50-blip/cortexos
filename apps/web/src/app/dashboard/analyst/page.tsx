'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="analyst" title="📊 Analist" subtitle="Veri, tablo veya durumu analiz et. Farklı açılardan sormaya devam edebilirsin." endpoint="/api/agents/analyst" placeholder="Analiz etmemi istediğin veri veya durumu yaz..." suggestions={['Güçlü ve zayıf yönleri neler?','Bir sonraki adım ne olmalı?','Rakip analizi yap']} />;
}
