/**
 * CortexOS Telegram Botu
 * 
 * Kurulum:
 *   npm install node-telegram-bot-api
 * 
 * .env.local dosyasına ekle:
 *   TELEGRAM_BOT_TOKEN=buraya_token
 *   TELEGRAM_USER_ID=buraya_senin_id
 * 
 * Çalıştır:
 *   node telegram-bot.js
 */

require('dotenv').config({ path: './apps/web/.env.local' });
const TelegramBot = require('node-telegram-bot-api');

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const USER_ID = process.env.TELEGRAM_USER_ID;
const API_URL = process.env.CORTEXOS_URL || 'http://localhost:3000';

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN eksik! apps/web/.env.local dosyasına ekle.');
  process.exit(1);
}
if (!USER_ID) {
  console.error('❌ TELEGRAM_USER_ID eksik! @userinfobot\'tan öğrenip ekle.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 CortexOS Telegram Botu başlatıldı...');
console.log(`📡 CortexOS API: ${API_URL}`);
console.log(`👤 Yetkili kullanıcı: ${USER_ID}`);

// Komutlar
const COMMANDS = `
/start   — Botu başlat
/help    — Yardım
/tasks   — Bekleyen görevleri listele
/goals   — Aktif hedefleri listele
/ask     — AI\'a bir şey sor (örn: /ask Bugün ne yapmalıyım?)
`.trim();

bot.onText(/\/start/, (msg) => {
  if (!isAllowed(msg)) return;
  bot.sendMessage(msg.chat.id,
    `🧠 *CortexOS\'a Hoş Geldin!*\n\nDirekt mesaj yazabilirsin, AI Orkestratör yanıtlar.\n\n${COMMANDS}`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/help/, (msg) => {
  if (!isAllowed(msg)) return;
  bot.sendMessage(msg.chat.id, `📖 *Komutlar:*\n\n${COMMANDS}`, { parse_mode: 'Markdown' });
});

bot.onText(/\/tasks/, async (msg) => {
  if (!isAllowed(msg)) return;
  const sent = await bot.sendMessage(msg.chat.id, '⏳ Görevler getiriliyor...');
  try {
    const res  = await fetch(`${API_URL}/api/tasks`);
    const data = await res.json();
    const pending = data.filter(t => t.status !== 'done');
    if (pending.length === 0) {
      await bot.editMessageText('✅ Bekleyen görev yok!', { chat_id: msg.chat.id, message_id: sent.message_id });
      return;
    }
    const text = pending
      .slice(0, 10)
      .map((t, i) => {
        const due = t.dueDate ? ` · 📅 ${new Date(t.dueDate).toLocaleDateString('tr-TR')}` : '';
        const time = t.estimatedTime ? ` · ⏱ ${t.estimatedTime}dk` : '';
        const emoji = t.status === 'in-progress' ? '🔄' : t.status === 'blocked' ? '🚫' : '📌';
        return `${i+1}. ${emoji} *${escMd(t.title)}*${due}${time}`;
      })
      .join('\n');
    await bot.editMessageText(`📋 *Bekleyen Görevler (${pending.length})*\n\n${text}`, {
      chat_id: msg.chat.id, message_id: sent.message_id, parse_mode: 'Markdown',
    });
  } catch (e) {
    await bot.editMessageText(`❌ Hata: ${e.message}`, { chat_id: msg.chat.id, message_id: sent.message_id });
  }
});

bot.onText(/\/goals/, async (msg) => {
  if (!isAllowed(msg)) return;
  const sent = await bot.sendMessage(msg.chat.id, '⏳ Hedefler getiriliyor...');
  try {
    const res  = await fetch(`${API_URL}/api/goals`);
    const data = await res.json();
    const active = data.filter(g => g.status === 'active');
    if (active.length === 0) {
      await bot.editMessageText('🎯 Aktif hedef yok.', { chat_id: msg.chat.id, message_id: sent.message_id });
      return;
    }
    const text = active
      .slice(0, 8)
      .map((g, i) => `${i+1}. 🎯 *${escMd(g.title)}*`)
      .join('\n');
    await bot.editMessageText(`🎯 *Aktif Hedefler (${active.length})*\n\n${text}`, {
      chat_id: msg.chat.id, message_id: sent.message_id, parse_mode: 'Markdown',
    });
  } catch (e) {
    await bot.editMessageText(`❌ Hata: ${e.message}`, { chat_id: msg.chat.id, message_id: sent.message_id });
  }
});

bot.onText(/\/ask (.+)/, async (msg, match) => {
  if (!isAllowed(msg)) return;
  await askOrchestrator(msg, match[1]);
});

// Direkt mesaj → Orkestratör
bot.on('message', async (msg) => {
  if (!isAllowed(msg)) return;
  if (msg.text?.startsWith('/')) return; // Komutları es geç
  if (!msg.text) return;
  await askOrchestrator(msg, msg.text);
});

async function askOrchestrator(msg, input) {
  const sent = await bot.sendMessage(msg.chat.id, '🤔 Düşünüyor...');
  try {
    const res = await fetch(`${API_URL}/api/agents/orchestrator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    
    const data = await res.json();

    // === DÜZELTME BURADA ===
    let result = '';

    if (data.finalAnswer) {
      result = data.finalAnswer;
    } else if (data.result) {
      result = data.result;
    } else if (data.response) {
      result = data.response;
    } else if (data.output) {
      result = data.output;
    } else {
      result = JSON.stringify(data, null, 2);
    }

    // Mesajı gönder
    await bot.editMessageText(result, {
      chat_id: msg.chat.id, 
      message_id: sent.message_id,
      parse_mode: 'Markdown'
    }).catch(() => {
      // Markdown hatası olursa düz metin olarak dene
      bot.editMessageText(result, { 
        chat_id: msg.chat.id, 
        message_id: sent.message_id 
      });
    });

  } catch (e) {
    await bot.editMessageText(`❌ Hata: ${e.message}`, {
      chat_id: msg.chat.id, 
      message_id: sent.message_id
    });
  }
}

function isAllowed(msg) {
  const allowed = String(msg.from?.id) === String(USER_ID);
  if (!allowed) {
    bot.sendMessage(msg.chat.id, '⛔ Bu bot sadece sahibine açık.');
    console.warn(`Yetkisiz erişim girişimi: ${msg.from?.id} (@${msg.from?.username})`);
  }
  return allowed;
}

function escMd(text) {
  return (text || '').replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Bot durduruluyor...');
  bot.stopPolling();
  process.exit(0);
});
