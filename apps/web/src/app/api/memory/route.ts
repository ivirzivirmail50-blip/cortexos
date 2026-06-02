import { NextResponse } from 'next/server';
import { getLocalUserId } from '../../../lib/auth';
import { memoryService, isMemoryServiceAvailable } from '@cortexos/ai-core';

export async function POST(request: Request) {
  const userId = await getLocalUserId();
  const body = await request.json();
  const { action, key, value, query, tags } = body;

  try {
    switch (action) {
      case 'remember': {
        if (!key || !value) {
          return NextResponse.json({ error: 'key ve value gerekli' }, { status: 400 });
        }
        await memoryService.remember(userId, key, value, tags);
        return NextResponse.json({ success: true, message: 'Bellek kaydedildi' });
      }

      case 'recall': {
        if (!query) {
          return NextResponse.json({ error: 'query gerekli' }, { status: 400 });
        }
        const memories = await memoryService.recall(userId, query);
        return NextResponse.json({ memories });
      }

      case 'forget': {
        if (!key) {
          return NextResponse.json({ error: 'key gerekli' }, { status: 400 });
        }
        await memoryService.forget(userId, key);
        return NextResponse.json({ success: true, message: 'Bellek silindi' });
      }

      case 'list': {
        const memories = await memoryService.listMemories(userId);
        return NextResponse.json({ memories });
      }

      default:
        return NextResponse.json({ error: 'Geçersiz action. Kullanılabilir: remember, recall, forget, list' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Memory API hatası:', error);
    return NextResponse.json({ error: error.message || 'Bellek işlemi başarısız' }, { status: 500 });
  }
}

export async function GET() {
  const available = await isMemoryServiceAvailable();
  return NextResponse.json({ available });
}
