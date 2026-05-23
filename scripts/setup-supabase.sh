#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  UniMarket — Supabase otomatik kurulum
#  
#  Önce .env.local'i doldur, sonra:
#    chmod +x scripts/setup-supabase.sh
#    ./scripts/setup-supabase.sh
#
#  Yaptıkları:
#    1. prisma db push       (tabloları oluşturur)
#    2. Tüm migration SQL'leri uygular
#    3. Seed verilerini ekler
# ════════════════════════════════════════════════════════════════

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   UniMarket — Supabase Setup                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── .env.local kontrolü ────────────────────────────────────
if [ ! -f .env.local ]; then
  echo -e "${RED}✗ .env.local bulunamadı!${NC}"
  echo ""
  echo "Önce .env.local oluştur ve şu değişkenleri doldur:"
  echo "  - NEXT_PUBLIC_SUPABASE_URL"
  echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo "  - DATABASE_URL"
  echo "  - DIRECT_URL"
  echo ""
  echo "Şablon: .env.example"
  exit 1
fi

# .env.local'i yükle
set -a
# shellcheck disable=SC1091
source .env.local
set +a

# Gerekli değişkenleri kontrol et
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "DATABASE_URL" "DIRECT_URL")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗ $var tanımlı değil veya boş.${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ .env.local yüklendi${NC}"
echo ""

# ── psql var mı? ───────────────────────────────────────────
if ! command -v psql >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠ psql bulunamadı. Migration uygulanamayacak.${NC}"
  echo ""
  echo "Çözüm seçenekleri:"
  echo "  macOS:   brew install libpq && brew link --force libpq"
  echo "  Ubuntu:  sudo apt install postgresql-client"
  echo ""
  echo "Veya alternatif: Supabase Dashboard → SQL Editor'e şu dosyayı yapıştır:"
  echo "  supabase/setup/all_in_one.sql"
  echo ""
  HAS_PSQL=false
else
  echo -e "${GREEN}✓ psql bulundu${NC}"
  HAS_PSQL=true
fi
echo ""

# ── ADIM 1: Prisma push ────────────────────────────────────
echo -e "${BLUE}[1/3] Prisma — tablolar oluşturuluyor...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss
echo -e "${GREEN}✓ Tablolar oluşturuldu${NC}"
echo ""

# ── ADIM 2: SQL migration'ları ─────────────────────────────
if [ "$HAS_PSQL" = true ]; then
  echo -e "${BLUE}[2/3] RLS + trigger + storage + seed uygulanıyor...${NC}"
  psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f supabase/setup/all_in_one.sql
  echo -e "${GREEN}✓ Migrations uygulandı${NC}"
else
  echo -e "${YELLOW}[2/3] psql yok — manuel adım gerekli:${NC}"
  echo ""
  echo "  Supabase Dashboard → SQL Editor → New query"
  echo "  Yapıştır: supabase/setup/all_in_one.sql (tüm içerik)"
  echo "  Run"
fi
echo ""

# ── ADIM 3: Doğrulama ──────────────────────────────────────
echo -e "${BLUE}[3/3] Kurulum doğrulanıyor...${NC}"
if [ "$HAS_PSQL" = true ]; then
  TABLE_COUNT=$(psql "$DIRECT_URL" -t -c "select count(*) from information_schema.tables where table_schema='public';" | tr -d ' \n')
  UNI_COUNT=$(psql "$DIRECT_URL" -t -c "select count(*) from public.university_domains;" | tr -d ' \n')
  
  echo "  Tablo sayısı:               $TABLE_COUNT (beklenen: 11+)"
  echo "  Üniversite domain sayısı:   $UNI_COUNT (beklenen: 12)"
  
  if [ "$TABLE_COUNT" -ge 11 ] && [ "$UNI_COUNT" -eq 12 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✓ Supabase kurulumu tamam!                     ║${NC}"
    echo -e "${GREEN}║                                                  ║${NC}"
    echo -e "${GREEN}║   Sıradaki: DEPLOY_NOW.md Aşama 4                ║${NC}"
    echo -e "${GREEN}║   (Auth ayarları)                                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  else
    echo -e "${YELLOW}⚠ Bazı sayılar beklendiği gibi değil. Logları kontrol et.${NC}"
  fi
fi
