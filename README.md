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
- **Opsiyonel:** DeepSeek API → https://platform.deepseek.com (alternatif model sağlayıcı)

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

## API Sağlayıcıları

CortexOS aşağıdaki AI sağlayıcılarını destekler:

| Sağlayıcı | Ücretsiz? | Model Örnekleri | API Key Al |
|-----------|-----------|-----------------|------------|
| **Groq** | ✅ Evet | llama-3.3-70b, mixtral-8x7b | https://console.groq.com |
| **Google Gemini** | ✅ Evet | gemini-2.0-flash, gemini-1.5-pro | https://aistudio.google.com |
| **OpenRouter** | ✅ Evet (bazı modeller) | deepseek-v3:free, llama-3.3:free | https://openrouter.ai |
| **DeepSeek** | ❌ Hayır | deepseek-chat, deepseek-coder | https://platform.deepseek.com |
| **OpenAI** | ❌ Hayır | gpt-4o, gpt-4o-mini | https://platform.openai.com |
| **Anthropic** | ❌ Hayır | claude-3.5-sonnet | https://console.anthropic.com |
| **Mistral** | ❌ Hayır | mistral-large-latest | https://console.mistral.ai |
| **Ollama** | ✅ Evet (Yerel) | llama3, mistral, codellama | https://ollama.com |

### API Anahtarlarını Ayarlama

Ayarlar sayfasından (`/dashboard/settings`) API anahtarlarınızı güvenli bir şekilde ekleyebilirsiniz:

1. Dashboard'da sol menüden **⚙️ Ayarlar**'a tıklayın
2. İstediğiniz sağlayıcıyı seçin
3. "🔑 API Anahtarları" bölümünü genişletin
4. API anahtarınızı girin ve kaydedin

Veya `.env.local` dosyasına manuel olarak ekleyin:

```env
# Groq (Ücretsiz - Önerilen)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# DeepSeek
DEEPSEEK_API_KEY=sk_...
DEEPSEEK_MODEL=deepseek-chat

# Google Gemini (Ücretsiz)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# OpenRouter (Ücretsiz modeller mevcut)
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=deepseek/deepseek-v3:free

# Ollama (Yerel - API key gerekmez)
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Semantik Arama (İsteğe Bağlı)
Bilgi Tabanı sayfasındaki arama için Ollama gerekir:
```bash
# Ollama kur: https://ollama.com
ollama pull nomic-embed-text
```

---

## Özellikler

### 🎨 Tema Değiştirme
- Koyu/Açık tema desteği
- Sol alt köşedeki 🌙/☀️ butonuyla anında değiştirilebilir
- Tercihiniz localStorage'da saklanır

### 🌐 Dil Desteği
- **AI Yanıt Dili:** 12 dil desteği (Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce, Rusça, Japonca, Çince, Korece, Arapça)
- **Özel Talimat:** AI'ya özel dil talimatları verebilirsiniz
- `/dashboard/language-settings` sayfasından ayarlanabilir
- Arayüz dili şu an Türkçe, çoklu arayüz desteği gelecek

### 📚 Kütüphane (Library)
- `/dashboard/library` sayfasında kod parçacıkları, şablonlar ve prompt koleksiyonu
- 4 tip içerik: Snippet, Template, Prompt, Resource
- Etiketleme ve arama özelliği
- Favorilere ekleme
- Tek tıkla kopyalama
- LocalStorage'da güvenle saklanır

### 🛠️ Agent Creator (Özel Ajan Oluşturucu)
- `/dashboard/agent-creator` sayfasında kendi ajanlarınızı oluşturun
- **Özelleştirilebilir Ayarlar:**
  - Ajan adı ve ikon seçimi
  - Özel sistem promptu
  - Temperature ayarı (0-2 arası yaratıcılık kontrolü)
  - Max tokens limiti
- **Hazır Şablonlar:** Kod Reviewer, İçerik Editörü, Veri Analisti, Öğrenme Koçu
- LocalStorage'da güvenle saklanır
- İstediğiniz zaman düzenleyip silebilirsiniz

### 💾 Sohbet Geçmişi
- Tüm konuşmalar otomatik olarak kaydedilir
- `/dashboard/history` sayfasından geçmiş sohbetlere erişim
- Sohbetleri TXT/PDF formatında dışa aktarma

### 📤 Dosya Yükleme
- Mesajlara dosya ekleyebilirsiniz (PDF, TXT, DOCX, resimler)
- Görseller önizleme ile gösterilir
- Dosya içeriği AI tarafından analiz edilir

### 📄 Döküman Yönetimi
- `/dashboard/documents` sayfasında notlar ve dökümanlar
- PDF, TXT, DOCX dosyaları yükleme
- Dökümanlar arası semantik arama (Ollama + ChromaDB)

### 🎯 Hedefler ve Görevler
- Hedef oluşturma ve takip
- Görevleri hedeflere bağlama
- Öncelik ve durum yönetimi
- Tahmini ve gerçek süre takibi

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


---

## 📋 Özellik Özeti ve Konumları

| Özellik | Sayfa / Konum | Durum |
|---------|--------------|-------|
| 🎨 Tema Değiştirme | Sol sidebar alt (🌙/☀️ butonu) | ✅ Aktif |
| 🌐 Dil Ayarları | `/dashboard/language-settings` | ✅ Aktif |
| 📚 Kütüphane | `/dashboard/library` | ✅ Aktif |
| 🛠️ Ajan Oluşturucu | `/dashboard/agent-creator` | ✅ Aktif |
| 💾 Sohbet Geçmişi | `/dashboard/history` | ✅ Aktif |
| ⚙️ AI Ayarları | `/dashboard/settings` | ✅ Aktif |
| 📄 Dökümanlar | `/dashboard/documents` | ✅ Aktif |
| 🧠 Bilgi Tabanı | `/dashboard/knowledge` | ✅ Aktif |
| 🎯 Hedefler | `/dashboard/goals` | ✅ Aktif |
| ✅ Görevler | `/dashboard/tasks` | ✅ Aktif |
| 📈 Analitik | `/dashboard/analytics` | ✅ Aktif |
| 🤖 Orkestratör | `/dashboard/orchestrator` | ✅ Aktif |
| 🗓 Planlayıcı | `/dashboard/planner` | ✅ Aktif |
| 🔍 Araştırmacı | `/dashboard/researcher` | ✅ Aktif |
| ✍️ Yazar | `/dashboard/writer` | ✅ Aktif |
| 💻 Kodlayıcı | `/dashboard/coder` | ✅ Aktif |
| 📋 Özetleyici | `/dashboard/summarizer` | ✅ Aktif |
| 📊 Analist | `/dashboard/analyst` | ✅ Aktif |
| 💭 Yansıma | `/dashboard/reflection` | ✅ Aktif |

---

## 🔧 Sorun Giderme

### "Message must be a string" Hatası
Bu hata, frontend'in backend'e yanlış formatta veri göndermesinden kaynaklanır. Son güncelleme ile düzeltildi. Eğer hala bu hatayı alıyorsanız:
1. Tarayıcı cache'ini temizleyin (Ctrl+Shift+R)
2. Uygulamayı yeniden başlatın

### "Worker thread exited" Hatası
Bu hata sunucu tarafında meydana gelir. Çözüm:
1. Sunucuyu durdurun (Ctrl+C)
2. `pnpm dev` ile yeniden başlatın
3. Disk alanını kontrol edin (`df -h`)

### API Key Çalışmıyor
1. API anahtarınızın doğru olduğundan emin olun
2. Seçilen sağlayıcı ve model uyumlu olmalı
3. `.env.local` dosyasına eklediyseniz uygulamayı yeniden başlatın
4. Ayarlar sayfasından eklediyseniz sayfayı yenileyin

### DeepSeek API Kullanımı
1. https://platform.deepseek.com adresinden API key alın
2. Dashboard → Ayarlar → DeepSeek seçin
3. API key'i girin ve kaydedin
4. Modeller: `deepseek-chat`, `deepseek-coder`, `deepseek-v3`

---

## 🆕 Son Güncellemeler

### v1.2.0 (En Yeni)
- ✅ **Agent Creator:** Özel ajan oluşturma özelliği eklendi
- ✅ **Library:** Kod snippet ve prompt kütüphanesi eklendi
- ✅ **Dil Ayarları:** 12 dil desteği ve özel talimat özelliği
- ✅ **DeepSeek Desteği:** DeepSeek API entegrasyonu
- ✅ **README Güncellendi:** Tüm özellikler detaylandırıldı

### v1.1.0
- Multi-agent orchestration sistemi
- ChromaDB + Ollama semantik arama
- Dosya yükleme desteği

### v1.0.0
- İlk sürüm: 8 AI ajanı
- PostgreSQL + Drizzle ORM
- Clerk-free yerel auth

---

## 📝 Lisans

MIT License — Kişisel kullanım için ücretsiz.

## 🤝 Katkıda Bulunma

Önerileriniz ve bug report'larınız için GitHub issues açabilirsiniz.

---

**🧠 CortexOS — Kişisel AI İkinci Beyniniz**
