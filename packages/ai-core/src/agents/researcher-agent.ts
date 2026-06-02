import { createLLM } from '../config/llm';
import { buildSystemPrompt, getTemperatureForModel } from '../config/prompt-builder';

export interface ResearchSource {
  title: string;
  url?: string;
  excerpt: string;
  relevance: number;
}

export interface ResearchFinding {
  statement: string;
  confidence: number;
  category?: string;
}

export interface ResearchReport {
  topic: string;
  summary: string;
  findings: ResearchFinding[];
  sources: ResearchSource[];
  recommendations?: string[];
  debug?: { persona: string; flavor: string; model: string };
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

// Tavily API ile gerçek web araması (TAVILY_API_KEY varsa)
async function searchTavily(query: string): Promise<ResearchSource[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      excerpt: r.content?.slice(0, 300) || '',
      relevance: r.score || 0.8,
    }));
  } catch (e) {
    console.warn('[Researcher] Tavily hatası:', (e as Error).message);
    return [];
  }
}

// SearXNG ile arama (SEARXNG_URL varsa)
async function searchSearXNG(query: string): Promise<ResearchSource[]> {
  try {
    const baseUrl = process.env.SEARXNG_URL || 'http://localhost:8888';
    const res = await fetch(
      `${baseUrl}/search?q=${encodeURIComponent(query)}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error('SearXNG yanıt vermedi');
    const data = await res.json();
    return (data.results || []).slice(0, 5).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      excerpt: r.content || '',
      relevance: 0.8,
    }));
  } catch {
    return [];
  }
}

export async function runResearcherAgent(
  topic: string,
  userId: string,
  history: HistoryMessage[] = [],
  model?: string
): Promise<ResearchReport> {
  console.log('Researcher Agent başlatıldı', { userId, topic: topic.slice(0, 80), model });

  // 1. Tavily dene, yoksa SearXNG dene, yoksa LLM kendi bilgisiyle yapsın
  let sources: ResearchSource[] = await searchTavily(topic);
  if (sources.length === 0) sources = await searchSearXNG(topic);

  const hasRealSources = sources.length > 0;
  const sourceText = hasRealSources
    ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`).join('\n\n')
    : 'Web araması mevcut değil — kendi bilginle kapsamlı araştırma yap.';

  // Build system prompt using persona + agent template + model flavor
  const promptResult = buildSystemPrompt({
    agent: 'researcher',
    model,
    hasHistory: history.length > 0,
    hasWebSources: hasRealSources,
    sourcesText: sourceText,
    jsonSchema: JSON.stringify({
      topic,
      summary: "Yönetici özeti (2-3 paragraf, Türkçe)",
      findings: [{ statement: "Bulgu", confidence: 0.9, category: "kategori" }],
      recommendations: ["Öneri 1", "Öneri 2"]
    }, null, 2),
  });

  const temperature = getTemperatureForModel(model, 'researcher');
  const llm = createLLM({ temperature });

  const messages = [
    { role: 'system' as const, content: promptResult.systemPrompt },
    ...history.slice(-4),
    { role: 'user' as const, content: `"${topic}" hakkında araştırma raporu hazırla.` },
  ];

  const response = await llm.invoke(messages);
  const raw = response.content?.toString() || '{}';

  let report: Partial<ResearchReport>;
  try {
    report = JSON.parse(raw.replace(/```json\s*|\s*```/g, '').trim());
  } catch {
    report = { topic, summary: raw.slice(0, 500), findings: [], recommendations: [] };
  }

  // Kaynak yoksa bunu belirt
  if (!hasRealSources) {
    sources = [{ title: 'LLM Bilgi Tabanı', excerpt: 'Web araması yapılamadı. Sonuçlar modelin eğitim verisine dayanıyor.', relevance: 0.6 }];
  }

  return {
    topic,
    summary: report.summary || '',
    findings: report.findings || [],
    sources,
    recommendations: report.recommendations,
    debug: promptResult.debug,
  };
}
