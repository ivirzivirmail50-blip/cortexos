'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="coder" title="💻 Kodlayıcı" subtitle="Kod yaz, debug et, açıkla. Devam ettirmesini veya düzeltmesini isteyebilirsin." endpoint="/api/agents/coder" placeholder="Ne kodlamamı istiyorsun?" suggestions={['TypeScript\'te bir debounce hook yaz','Python\'da CSV okuyan kod','Bu kodu optimize et']} />;
}
