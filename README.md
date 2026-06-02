# 🧠 CortexOS — Kişisel AI İkinci Beyin

Çoklu AI ajanlarıyla çalışan, tamamen yerel kişisel verimlilik sistemi.
**Clerk yok, kayıt yok — direkt çalışır.**

## Ajanlar

| Ajan | Açıklama |
|------|----------|
| 🤖 Orkestratör | AI doğru ajanı seçer, karmaşık görevlerde çoklu ajan çalıştırır |
| 🗓 Planlayıcı | Hedef ve proje planı oluşturur |
| 🔍 Araştırmacı | Web araştırması yapar |
| ✍️ Yazar | Makale ve içerik yazar |
| 💻 Kodlayıcı | Kod üretir |
| 📋 Özetleyici | Uzun metinleri özetler |
| 📊 Analist | Veri analizi yapar |
| 💭 Yansıma | AI koçluk değerlendirmesi |
| 🧠 Bilgi Tabanı | Dökümanlar arası semantik arama (ChromaDB + Ollama) |

---

## Kurulum

### 1. Gereksinimler
- Node.js v18+ → https://nodejs.org
- pnpm → `npm install -g pnpm`
- Docker Desktop → https://docker.com
- Groq API anahtarı → https://console.groq.com (ücretsiz, kart gerekmez)

### 2. .env dosyasını oluştur
```bash
cp .env.example apps/web/.env.local
# apps/web/.env.local içine GROQ_API_KEY'i yaz
```

### 3. Docker servislerini başlat
```bash
docker-compose up -d
```

### 4. Bağımlılıkları yükle
```bash
pnpm install
```

### 5. Veritabanını oluştur
```bash
cd packages/db
pnpm drizzle-kit push:pg
cd ../..
```

### 6. Çalıştır
```bash
pnpm dev
```
→ http://localhost:3000 aç, direkt dashboard gelir.

---

## Semantik Arama (İsteğe Bağlı)
Bilgi Tabanı sayfasındaki arama için Ollama gerekir:
```bash
# Ollama kur: https://ollama.com
ollama pull nomic-embed-text
```

---

## Proje Yapısı
```
cortexos_final/
├── apps/web/src/
│   ├── app/api/          # Backend API route'ları
│   ├── app/dashboard/    # Frontend sayfaları
│   └── lib/auth.ts       # Yerel kullanıcı yönetimi
├── packages/
│   ├── ai-core/          # Tüm AI ajanları + multi-agent
│   ├── db/               # PostgreSQL + Drizzle ORM
│   ├── knowledge-base/   # ChromaDB + Ollama embeddings
│   └── utils/            # Logger, env helpers
└── docker-compose.yml    # PostgreSQL, ChromaDB, SearXNG
```
