'use client';
import { AgentChat } from '../../../components/agent-chat';
export default function Page() {
  return <AgentChat agentType="planner" title="🗓 Planlayıcı" subtitle="Hedef veya projen için adım adım plan oluştur." endpoint="/api/agents/planner" placeholder="Ne planlamak istiyorsun?" suggestions={['3 ayda İngilizce öğrenmek istiyorum','Haftaya spor rutini kur','Bir mobil uygulama geliştirme planı yap']} />;
}
