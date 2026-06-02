import { createLLM } from '../config/llm';
import { runPlannerAgent } from './planner-agent';
import { runResearcherAgent } from './researcher-agent';
import { runWriterAgent } from './writer-agent';
import { runCoderAgent } from './coder-agent';
import { runSummarizerAgent } from './summarizer-agent';
import { runAnalystAgent } from './analyst-agent';

export type AgentType = 'planner' | 'researcher' | 'writer' | 'coder' | 'summarizer' | 'analyst' | 'multi';

export interface AgentMessage {
  role: 'user' | 'agent' | 'orchestrator';
  agentType?: AgentType;
  content: string;
  timestamp: Date;
}

export interface MultiAgentResult {
  finalAnswer: string;
  agentsUsed: AgentType[];
  steps: AgentMessage[];
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

async function routeToAgent(input: string, history: HistoryMessage[]): Promise<AgentType> {
  const llm = createLLM();

  const messages = [
    {
      role: 'system' as const,
      content: `Kullanıcının isteğini analiz et ve en uygun ajanı seç.
Seçenekler:
- planner: Plan, strateji, adım adım yol haritası
- researcher: Araştırma, bilgi toplama, "nedir", "nasıl çalışır"
- writer: Makale, içerik, metin yazma, e-posta
- coder: Kod yazma, debug, teknik çözüm
- summarizer: Özetleme, kısaltma
- analyst: Veri analizi, değerlendirme, karşılaştırma
- multi: Birden fazla ajan gerektiren karmaşık istekler

SADECE tek kelime yanıt ver (ajan adı):`,
    },
    ...history.slice(-4),
    { role: 'user' as const, content: input },
  ];

  const response = await llm.invoke(messages);
  const agentName = response.content?.toString().trim().toLowerCase() as AgentType;

  const validAgents: AgentType[] = ['planner', 'researcher', 'writer', 'coder', 'summarizer', 'analyst', 'multi'];
  return validAgents.includes(agentName) ? agentName : 'planner';
}

async function runSingleAgent(agentType: AgentType, input: string, userId: string, history: HistoryMessage[]): Promise<string> {
  switch (agentType) {
    case 'planner': {
      const r = await runPlannerAgent(input, userId, history);
      return `📋 **${r.plan.title}**\n${r.plan.description}\n\n${r.plan.steps.map((s, i) => `${i + 1}. **${s.title}**\n   ${s.description}${s.estimatedTime ? ` (~${s.estimatedTime}dk)` : ''}`).join('\n')}`;
    }
    case 'researcher': {
      const r = await runResearcherAgent(input, userId, history);
      const findings = r.findings.map(f => `• ${f.statement}`).join('\n');
      const recs = r.recommendations?.map(rec => `• ${rec}`).join('\n') || '';
      return `🔍 **${r.topic}**\n\n${r.summary}${findings ? `\n\n**Bulgular:**\n${findings}` : ''}${recs ? `\n\n**Öneriler:**\n${recs}` : ''}`;
    }
    case 'writer': {
      const r = await runWriterAgent(input, '', userId, history);
      return `**${r.title}**\n\n${r.content}`;
    }
    case 'coder': {
      const r = await runCoderAgent(input, '', userId, history);
      const snippets = r.snippets.map(s => `\`\`\`${s.language}\n${s.code}\n\`\`\`\n${s.explanation}`).join('\n\n');
      return `${r.summary}\n\n${snippets}`;
    }
    case 'summarizer': {
      const r = await runSummarizerAgent({ content: input, length: 'medium' }, userId, history);
      return `${r.summary}\n\n**Temel Noktalar:**\n${r.keyPoints.map(k => `• ${k}`).join('\n')}`;
    }
    case 'analyst': {
      const r = await runAnalystAgent(input, input, userId, history);
      return `${r.summary}\n\n**İçgörüler:**\n${r.insights.map(i => `• ${i}`).join('\n')}${r.recommendations.length ? `\n\n**Öneriler:**\n${r.recommendations.map(r => `• ${r}`).join('\n')}` : ''}`;
    }
    default:
      return 'Ajan bulunamadı';
  }
}

async function runMultiAgent(input: string, userId: string, history: HistoryMessage[]): Promise<{ result: string; agentsUsed: AgentType[] }> {
  const agentsUsed: AgentType[] = [];

  agentsUsed.push('researcher');
  const research = await runResearcherAgent(input, userId, history);

  agentsUsed.push('planner');
  const plan = await runPlannerAgent(`${input}\n\nAraştırma: ${research.summary}`, userId, []);

  agentsUsed.push('writer');
  const article = await runWriterAgent(input, `Araştırma: ${research.summary}\nPlan: ${plan.plan.title}`, userId, []);

  return {
    result: [
      `🔍 **Araştırma**\n${research.summary}`,
      `📋 **Plan: ${plan.plan.title}**\n${plan.plan.steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`,
      `✍️ **${article.title}**\n${article.content}`,
    ].join('\n\n---\n\n'),
    agentsUsed,
  };
}

export async function runOrchestrator(input: string, userId: string, history: HistoryMessage[] = []): Promise<MultiAgentResult> {
  const steps: AgentMessage[] = [];
  steps.push({ role: 'user', content: input, timestamp: new Date() });

  const agentType = await routeToAgent(input, history);
  steps.push({ role: 'orchestrator', content: `→ ${agentType}`, agentType, timestamp: new Date() });

  let finalAnswer: string;
  let agentsUsed: AgentType[];

  if (agentType === 'multi') {
    const r = await runMultiAgent(input, userId, history);
    finalAnswer = r.result;
    agentsUsed = r.agentsUsed;
  } else {
    finalAnswer = await runSingleAgent(agentType, input, userId, history);
    agentsUsed = [agentType];
  }

  steps.push({ role: 'agent', agentType, content: finalAnswer, timestamp: new Date() });
  return { finalAnswer, agentsUsed, steps };
}
