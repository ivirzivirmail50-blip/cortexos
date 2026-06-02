# 🤖 CortexOS Telegram Bot Kurulumu

## Bu bot nasıl çalışır?
Webhook DEĞİL, polling kullanır. ngrok gerekmez!
CortexOS çalışırken ayrı bir terminalde bot da çalışır.

## 1. Bot Oluştur
Telegram'da @BotFather → /newbot → isim ver → token al

## 2. Kendi User ID'ini Öğren  
@userinfobot'a mesaj at → ID'ni söyler

## 3. .env.local'e Ekle
```
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxx
TELEGRAM_USER_ID=123456789
CORTEXOS_URL=http://localhost:3000
```

## 4. node-telegram-bot-api Yükle
```bash
# Proje kök dizininde:
pnpm install
```

## 5. Botu Başlat (CortexOS çalışırken ayrı terminal)
```bash
# Terminal 1:
pnpm dev

# Terminal 2:
pnpm telegram
# veya direkt:
node telegram-bot.js
```

## Komutlar
| Komut | Açıklama |
|-------|----------|
| /start | Başlat |
| /help | Yardım |
| /tasks | Bekleyen görevleri listele |
| /goals | Aktif hedefleri listele |
| /ask [soru] | AI Orkestratöre sor |
| Direkt mesaj | Otomatik Orkestratöre gönderilir |

## Örnekler
```
/tasks
/goals
/ask Bugün yapılacakları planla
Yapay zeka nedir?    ← direkt mesaj da çalışır
```

## Notlar
- Bot sadece senin user ID'inden gelen mesajlara yanıt verir
- Botun çalışması için CortexOS (pnpm dev) açık olmalı
- Kapatmak: Ctrl+C
