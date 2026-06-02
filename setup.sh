#!/bin/bash
set -e

echo "🧠 CortexOS Kurulum Scripti"
echo "================================"

# Node.js kontrolü
if ! command -v node &> /dev/null; then
  echo "❌ Node.js bulunamadı. https://nodejs.org'dan yükleyin (v18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ gerekli. Mevcut: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# pnpm kontrolü
if ! command -v pnpm &> /dev/null; then
  echo "📦 pnpm yükleniyor..."
  npm install -g pnpm@8.15.0
fi
echo "✅ pnpm $(pnpm -v)"

# Docker kontrolü
if ! command -v docker &> /dev/null; then
  echo "❌ Docker bulunamadı. https://docker.com'dan yükleyin"
  exit 1
fi
echo "✅ Docker mevcut"

# .env dosyası
if [ ! -f "apps/web/.env.local" ]; then
  cp .env.example apps/web/.env.local
  echo ""
  echo "⚠️  apps/web/.env.local oluşturuldu."
  echo "   Şimdi şu değerleri doldurun:"
  echo "   - GROQ_API_KEY     → https://console.groq.com"
  echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY → https://clerk.com"
  echo "   - CLERK_SECRET_KEY"
  echo "   - CLERK_WEBHOOK_SECRET"
  echo ""
  read -p "Devam etmek için Enter'a basın (veya Ctrl+C ile çıkın ve .env.local'i düzenleyin)..."
fi

# Docker servisleri başlat
echo ""
echo "🐳 Docker servisleri başlatılıyor (PostgreSQL, ChromaDB, SearXNG)..."
docker-compose up -d

# Docker'ın hazır olmasını bekle
echo "⏳ PostgreSQL'in hazır olması bekleniyor..."
sleep 5
until docker exec cortexos-postgres pg_isready -U cortex &> /dev/null; do
  echo "  Bekleniyor..."
  sleep 2
done
echo "✅ PostgreSQL hazır"

# Bağımlılıkları yükle
echo ""
echo "📦 Bağımlılıklar yükleniyor..."
pnpm install

# Veritabanı migration
echo ""
echo "🗄  Veritabanı tabloları oluşturuluyor..."
cd packages/db
pnpm drizzle-kit push:pg
cd ../..

echo ""
echo "🎉 Kurulum tamamlandı!"
echo "================================"
echo "Şimdi çalıştır: pnpm dev"
echo "Uygulama: http://localhost:3000"
