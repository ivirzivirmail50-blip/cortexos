'use client';
import { useState, useRef, useEffect } from 'react';
import { useProvider } from '../context/provider-context';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    base64?: string;
  }>;
}

interface AgentChatProps {
  title: string;
  subtitle?: string;
  endpoint: string;
  agentType: string;          // DB'ye kaydederken kullanılır: 'planner', 'writer' vb.
  inputKey?: string;
  extraBody?: Record<string, string>;
  placeholder?: string;
  suggestions?: string[];
  formatResponse?: (data: any) => string;
  showModelSelector?: boolean; // Model seçimi gösterilsin mi?
  enableFileUpload?: boolean;  // Dosya yükleme özelliği
  acceptedFileTypes?: string;  // Kabul edilen dosya tipleri
  supportExport?: boolean;     // PDF/TXT export desteği
}

function defaultFormat(data: any): string {
  if (typeof data === 'string') return data;
  if (data.finalAnswer) return data.finalAnswer;
  if (data.result) return data.result;
  if (data.response) return data.response;
  if (data.output) return data.output;

  if (data.plan) {
    const p = data.plan;
    return [
      `📋 **${p.title}**`,
      p.description,
      p.timeline ? `⏱ ${p.timeline.startDate || ''} → ${p.timeline.endDate || ''}` : '',
      '',
      ...(p.steps || []).map((s: any, i: number) =>
        `${i + 1}. **${s.title}**\n   ${s.description}${s.estimatedTime ? ` (~${s.estimatedTime}dk)` : ''}`
      ),
    ].filter(Boolean).join('\n');
  }
  if (data.summary && data.findings) {
    return [
      `🔍 **${data.topic || 'Araştırma'}**\n`,
      data.summary,
      '',
      '**Bulgular:**',
      ...(data.findings || []).map((f: any) => `• ${f.statement || f}`),
      ...(data.recommendations?.length ? ['', '**Öneriler:**', ...(data.recommendations || []).map((r: string) => `• ${r}`)] : []),
    ].join('\n');
  }
  if (data.title && data.content) return `**${data.title}**\n\n${data.content}`;
  if (data.summary && data.keyPoints) {
    return [data.summary, '', '**Temel Noktalar:**', ...(data.keyPoints || []).map((k: string) => `• ${k}`)].join('\n');
  }
  if (data.summary && data.insights) {
    return [data.summary, '', '**İçgörüler:**', ...(data.insights || []).map((i: string) => `• ${i}`)].join('\n');
  }
  if (data.snippets) {
    return [data.summary || '', '', ...(data.snippets || []).map((s: any) => `\`\`\`${s.language || ''}\n${s.code}\n\`\`\`\n${s.explanation || ''}`)].join('\n');
  }
  return JSON.stringify(data, null, 2);
}

// DB kayıt fonksiyonları (chat-store'u import etmeden inline — SSR sorununu önler)
async function createSession(agentType: string, title: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await fetch('/api/chat-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentType, title, sessionId }),
  });
  return sessionId;
}

async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  await fetch(`/api/chat-history/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content }),
  });
}

export function AgentChat({
  title, subtitle, endpoint, agentType,
  inputKey = 'input', extraBody = {},
  placeholder = 'Mesajını yaz...', suggestions = [],
  formatResponse = defaultFormat,
  showModelSelector = true, // Varsayılan olarak model seçici göster
  enableFileUpload = true,  // Dosya yükleme varsayılan aktif
  acceptedFileTypes = '.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif',
  supportExport = true,     // Export varsayılan aktif
}: AgentChatProps) {
  const { config } = useProvider();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState(config.model); // Her agent için kendi model seçimi
  const [streamingContent, setStreamingContent] = useState(''); // Streaming sırasında biriktirilen içerik
  const sessionIdRef = useRef<string | null>(null); // Oturum ID'si — component yaşadıkça sabit
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null); // Streaming'i durdurmak için
  const [canStop, setCanStop] = useState(false); // Durdurma butonu gösterilsin mi?

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingContent]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs for images
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    const newPreviewUrls = imageFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && selectedFiles.length === 0) || loading) return;

    // Process files if any
    let attachments: ChatMessage['attachments'] = undefined;
    let fileContext = '';
    
    if (selectedFiles.length > 0) {
      attachments = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: await convertFileToBase64(file).catch(() => undefined),
        }))
      );
      
      // Add file context to the message
      fileContext = `\n\n[Dosyalar eklendi: ${selectedFiles.map(f => f.name).join(', ')}]`;
    }

    const userMsg: ChatMessage = { 
      role: 'user', 
      content: text + fileContext, 
      ts: Date.now(),
      attachments 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');
    setStreamingContent('');
    setCanStop(true);
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);
    setPreviewUrls([]);

    // İlk mesajda session oluştur
    if (!sessionIdRef.current) {
      const sid = await createSession(agentType, text.slice(0, 60));
      sessionIdRef.current = sid;
    }

    // Kullanıcı mesajını kaydet
    await saveMessage(sessionIdRef.current, 'user', text + fileContext).catch(() => {});

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Prepare request body with file data if present
      const requestBody: any = { 
        [inputKey]: text + fileContext, 
        history, 
        model: selectedModel, 
        ...extraBody 
      };
      
      // Add attachments if any
      if (attachments && attachments.length > 0) {
        requestBody.attachments = attachments;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      // Check if response is streaming (SSE)
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'token' && data.content) {
                    accumulatedContent += data.content;
                    setStreamingContent(accumulatedContent);
                  } else if (data.type === 'done') {
                    // Streaming complete
                    setMessages(prev => [...prev, { role: 'assistant', content: accumulatedContent, ts: Date.now() }]);
                    setStreamingContent('');
                    setCanStop(false);
                    
                    // AI yanıtını kaydet
                    if (sessionIdRef.current) {
                      await saveMessage(sessionIdRef.current, 'assistant', accumulatedContent).catch(() => {});
                    }
                  }
                } catch (e) {
                  // Parse error, skip this chunk
                }
              }
            }
          }
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Sunucu hatası: ${res.status}`);

        const content = formatResponse(data);
        setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }]);
        setCanStop(false);

        // AI yanıtını kaydet
        if (sessionIdRef.current) {
          await saveMessage(sessionIdRef.current, 'assistant', content).catch(() => {});
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // User stopped the generation
        setStreamingContent('');
        setCanStop(false);
        setError('⏹️ Üretim durduruldu');
        // Add partial content as a message
        if (streamingContent) {
          setMessages(prev => [...prev, { role: 'assistant', content: streamingContent + '\n\n[⚠️ Yanıt tamamlanmadı - kullanıcı tarafından durduruldu]', ts: Date.now() }]);
        }
      } else {
        setError(e.message);
        setMessages(prev => prev.slice(0, -1));
        setCanStop(false);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setCanStop(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => {
    if (messages.length && confirm('Sohbeti temizlemek istiyor musun?')) {
      setMessages([]);
      sessionIdRef.current = null; // Yeni sohbet = yeni session
    }
  };

  // Export chat as TXT or PDF
  const exportChat = async (format: 'txt' | 'pdf') => {
    if (messages.length === 0) return;
    
    let content = '';
    if (format === 'txt') {
      content = messages.map(m => 
        `[${new Date(m.ts).toLocaleString('tr-TR')}] ${m.role === 'user' ? '👤 Kullanıcı' : '🤖 AI'}:\n${m.content}\n`
      ).join('\n---\n\n');
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentType}-sohbet-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Simple PDF export using browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        content = `
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>${title} - Sohbet Kaydı</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
              .message { margin: 15px 0; padding: 10px; border-radius: 8px; }
              .user { background: #e3f2fd; }
              .assistant { background: #f5f5f5; }
              .timestamp { font-size: 0.8em; color: #666; }
            </style>
          </head>
          <body>
            <h1>${title} - Sohbet Kaydı</h1>
            ${messages.map(m => `
              <div class="message ${m.role}">
                <div class="timestamp">${new Date(m.ts).toLocaleString('tr-TR')} - ${m.role === 'user' ? '👤 Kullanıcı' : '🤖 AI'}</div>
                <div>${m.content.replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
          </body>
          </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {supportExport && messages.length > 0 && (
            <>
              <button onClick={() => exportChat('txt')} style={{
                fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
              }}>📄 TXT</button>
              <button onClick={() => exportChat('pdf')} style={{
                fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px',
                border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
              }}>📕 PDF</button>
            </>
          )}
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              fontSize: '0.75rem', padding: '6px 12px', borderRadius: '10px',
              border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer'
            }}>🗑 Temizle</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
        {messages.length === 0 && !loading && !streamingContent && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{title.slice(0, 2)}</div>
            <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>{placeholder}</p>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    style={{ fontSize: '0.8rem', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '12px 16px', borderRadius: '18px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '18px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
              <div style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.6, textAlign: 'right' }}>
                {new Date(msg.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && !streamingContent && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '18px', borderTopLeftRadius: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              💭 Düşünüyor...
            </div>
          </div>
        )}

        {streamingContent && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '12px 16px', borderRadius: '18px',
              borderTopLeftRadius: '4px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text)',
              fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {streamingContent}
              <span style={{ display: 'inline-block', width: '2px', height: '1em', background: 'var(--text)', marginLeft: '2px', animation: 'blink 1s infinite' }}>▌</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 16px', borderRadius: '12px', textAlign: 'center', background: '#fee2e2', color: '#dc2626', fontSize: '0.85rem' }}>
            ❌ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Mesaj yaz... (Enter = gönder, Shift+Enter = yeni satır)"
            rows={2}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '18px', fontSize: '0.875rem', outline: 'none', resize: 'none', maxHeight: '120px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ padding: '12px 20px', borderRadius: '18px', fontSize: '0.875rem', fontWeight: 600, background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', opacity: loading || !input.trim() ? 0.4 : 1, flexShrink: 0 }}>
            ↑
          </button>
        </div>
        <p style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '6px', color: 'var(--text-muted)' }}>
          {messages.length > 0 ? `${Math.floor(messages.length / 2)} tur · kaydediliyor 💾` : 'Sohbet başlamadı'}
        </p>
      </div>
    </div>
  );
}
