# 🚀 UniMarket — Rehberli Deploy

Bu dosyayı baştan sona takip et. **Her adımdan sonra durup bana "tamam" yaz** — bir sonrakine geçelim.

Toplam süre: ~30 dakika. Maliyet: **0₺** (hem Vercel Hobby hem Supabase Free yeterli).

---

## 📋 Aşama 1 — GitHub repo oluştur (5 dk)

### 1.1 — GitHub hesabı yoksa
- [https://github.com/signup](https://github.com/signup) — ücretsiz hesap aç
- E-posta doğrula

### 1.2 — Yeni repo oluştur
1. Sağ üstte **`+` → New repository**
2. Repository name: **`unimarket`**
3. Description (opsiyonel): `Trusted second-hand marketplace for Turkish university students`
4. **Private** seç (önerilen — daha sonra public yapabilirsin)
5. **README, .gitignore, license HİÇBİRİNİ EKLEME** (zaten bizim hazırlıklarımız var)
6. **Create repository** → tıkla

### 1.3 — Lokal kodu push et
GitHub'ın gösterdiği URL'yi kopyala (örn. `https://github.com/KULLANICI_ADIN/unimarket.git`), sonra terminalde:

```bash
cd unimarket
git init
git add .
git commit -m "Initial commit: UniMarket MVP"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/unimarket.git
git push -u origin main
```

İlk push'ta GitHub kimlik doğrulaması ister:
- **Username**: GitHub kullanıcı adın
- **Password**: ❌ Şifre değil. **Personal Access Token** lazım.
  - Token oluştur: [https://github.com/settings/tokens/new?scopes=repo&description=unimarket](https://github.com/settings/tokens/new?scopes=repo&description=unimarket)
  - Expiration: **90 days**
  - **Generate token** → kopyala → şifre yerine yapıştır

### ✅ Kontrol
GitHub'da repo'ya gidip 92 dosyayı görüyorsan ✅. **"Aşama 1 tamam"** yaz.

---

## 📋 Aşama 2 — Supabase hesabı + proje (5 dk)

### 2.1 — Hesap aç
1. [https://supabase.com](https://supabase.com) → **Start your project**
2. **Continue with GitHub** (en kolay)
3. GitHub yetki ver

### 2.2 — Yeni proje oluştur
1. Dashboard → **New project**
2. Organization: kendi organizasyonunu seç (otomatik oluşur)
3. **Project name**: `unimarket`
4. **Database Password**: ✏️ **GÜÇLÜ bir şifre oluştur ve KAYDET**. Tekrar göremeyeceksin. (Örn. password manager'a koy)
5. **Region**: **`Central EU (Frankfurt)`** (TR kullanıcıları için en hızlı)
6. **Pricing Plan**: **Free** — MVP için yeterli (500MB DB, 1GB storage)
7. **Create new project** → tıkla
8. Provisioning ~2 dakika sürer ☕

### 2.3 — API key'leri al
Proje açıldığında, sol menüden **⚙️ Project Settings → API**:

| Bul | Ne işe yarayacak |
|---|---|
| `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

**Bunları geçici bir notepad'e kopyala — biraz sonra Vercel'e gireceğiz.**

### 2.4 — Database connection string'lerini al
Sol menü → **⚙️ Project Settings → Database**:

Aşağı kaydır → **Connection string** bölümü → **URI** sekmesi:
- `Mode: Transaction` seç → bu `DATABASE_URL` olacak (port 6543)
- `Mode: Session` seç → bu `DIRECT_URL` olacak (port 5432)
- `[YOUR-PASSWORD]` yazan yere **adım 2.2'de oluşturduğun şifreyi** yaz

İki connection string'i de kaydet.

### ✅ Kontrol
5 değer elinde:
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `DATABASE_URL` ✓
- `DIRECT_URL` ✓

**"Aşama 2 tamam"** yaz.

---

## 📋 Aşama 3 — Database schema + migration (5 dk)

İki yol var. **Yöntem A önerilen** (browser üzerinden, terminal gerektirmez).

### Yöntem A — Supabase Dashboard üzerinden (önerilen)

#### 3.1 — Schema tablolarını oluştur
Sol menü → **SQL Editor → New query**

Aşağıdaki dosyanın **TÜM içeriğini** yapıştır:
```
unimarket/prisma/schema.prisma'yı SQL'e çeviren bir dosya yok,
o yüzden alternatif: lokalde 'npx prisma db push' çalıştır.
```

⚠️ **Aslında en kolay yol terminal**: lokal makineden bir komutla schema'yı push edelim.

#### 3.2 — Lokalde Prisma push
```bash
cd unimarket

# .env.local dosyası oluştur
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=<ADIM_2.3_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ADIM_2.3_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<ADIM_2.3_SERVICE_ROLE>
DATABASE_URL=<ADIM_2.4_DATABASE_URL>
DIRECT_URL=<ADIM_2.4_DIRECT_URL>
EOF

# Tabloları oluştur
npx prisma db push
```

Çıktıda `Your database is now in sync with your Prisma schema.` görmelisin.

#### 3.3 — RLS, trigger, storage, seed verilerini ekle
Supabase Dashboard → **SQL Editor → New query**

`unimarket/supabase/setup/all_in_one.sql` dosyasının **TÜM içeriğini** kopyala ve yapıştır → **Run**.

`Success. No rows returned` görmelisin.

#### 3.4 — pg_cron eklentisini etkinleştir (listing expiration için)
Dashboard → **Database → Extensions** → arama kutusuna `pg_cron` yaz → **Enable**.

Sonra SQL Editor'de:
```sql
select cron.schedule(
  'expire-listings-daily',
  '0 3 * * *',
  $$select public.expire_stale_listings();$$
);
```

### ✅ Kontrol
Dashboard → **Database → Tables** → şu tabloları görmelisin:
`users`, `listings`, `reservations`, `chats`, `messages`, `favorites`, `reports`, `transactions`, `university_domains`, `blocks`, `ratings`

**"Aşama 3 tamam"** yaz.

---

## 📋 Aşama 4 — Supabase Auth ayarları (3 dk)

### 4.1 — OTP Email yapılandırması
Dashboard → **Authentication → Providers** → **Email**:
- ✅ **Enable Email provider**
- ❌ **Confirm email** seçeneğini KAPAT (biz kendi OTP akışımızı kullanıyoruz)
- ✅ **Enable Email OTP**

**Save** tıkla.

### 4.2 — Email template
**Authentication → Email Templates → Magic Link**

Body kısmını **bu şekilde** değiştir:
```html
<h2>UniMarket'e Giriş Kodu</h2>
<p>Merhaba,</p>
<p>Giriş kodunuz:</p>
<h1 style="font-size: 32px; letter-spacing: 4px; font-family: monospace;">{{ .Token }}</h1>
<p>Bu kod <strong>1 saat</strong> içinde geçerliliğini yitirir.</p>
<p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<hr>
<p style="color: #888; font-size: 12px;">UniMarket — Öğrenciler için güvenli pazaryeri</p>
```

⚠️ **ÇOK ÖNEMLI**: `{{ .Token }}` placeholder'ı şart. Bu olmadan kullanıcılar 6 haneli kodu alamaz.

**Save** tıkla.

### 4.3 — URL Configuration
**Authentication → URL Configuration**:
- **Site URL**: şimdilik `http://localhost:3000` yaz (Vercel deploy bittiğinde güncelleyeceğiz)
- **Redirect URLs**: bir sonraki aşamada Vercel URL'sini ekleyeceğiz

### ✅ Kontrol
Email provider enabled, OTP template `{{ .Token }}` içeriyor.

**"Aşama 4 tamam"** yaz.

---

## 📋 Aşama 5 — Vercel hesabı + proje import (5 dk)

### 5.1 — Vercel hesabı
1. [https://vercel.com/signup](https://vercel.com/signup)
2. **Continue with GitHub** (en kolay)
3. **Hobby** plan seç (free, MVP için yeterli)

### 5.2 — Projeyi import et
1. Dashboard → **Add New → Project**
2. **Import Git Repository** → `unimarket` repo'yu bul
3. **Import** tıkla

### 5.3 — Configure project
- **Framework Preset**: `Next.js` (otomatik algılanır)
- **Root Directory**: `./` (varsayılan)
- **Build Command**: `npm run build` (varsayılan)
- **Output Directory**: `.next` (varsayılan)

**Environment Variables** bölümünü genişlet ve şu 5 değişkeni ekle (Aşama 2'de kaydettiğin değerler):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `DATABASE_URL` | `postgresql://postgres...` (port 6543) |
| `DIRECT_URL` | `postgresql://postgres...` (port 5432) |

### 5.4 — Deploy
**Deploy** tıkla → ~2 dakika bekle ☕

Build başarılı olunca **"Congratulations 🎉"** ekranı görürsün ve sana bir URL verir:
`https://unimarket-xxx.vercel.app`

### ✅ Kontrol
URL'ye gir, onboarding ekranını görüyorsan ✅.

**"Aşama 5 tamam"** yaz.

---

## 📋 Aşama 6 — Final ayarlar + test (5 dk)

### 6.1 — Supabase URL'lerini güncelle
Aşama 5'te aldığın Vercel URL'sini (örn. `https://unimarket-abc.vercel.app`) kopyala.

Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://unimarket-abc.vercel.app` (gerçek URL'n)
- **Redirect URLs**: aşağıdakileri ekle:
  - `https://unimarket-abc.vercel.app/**`
  - `https://*.vercel.app/**` (preview deploy'lar için)
  - `http://localhost:3000/**` (lokal dev için)

**Save**.

### 6.2 — Smoke test
Vercel URL'sine git ve şu akışı test et:

- [ ] Onboarding ekranı görünüyor → **Hesap Oluştur**
- [ ] `/kayit` → ad-soyad + gerçek `.edu.tr` e-postanı gir → **Devam Et**
- [ ] E-postana 6 haneli kod geldi mi? (gelmediyse: spam'i kontrol et)
- [ ] Kodu gir → `/kesfet`'e yönlendin → boş feed göreceksin (normal)
- [ ] Bottom nav'dan **Sat** → ilan oluştur → fotoğraf yükleme çalışıyor mu?
- [ ] İlan oluştuktan sonra `/kesfet`'e dön → ilan göründü mü?
- [ ] **Profil** sekmesine git → doğrulanmış öğrenci rozeti var mı?

### 6.3 — Olası sorunlar

| Sorun | Çözüm |
|---|---|
| OTP e-postası gelmedi | Supabase free tier saatte **3 e-posta** ile limitli. 1 saat bekle veya SMTP yapılandır (Resend ücretsiz tier'ı vardır). |
| "User not verified" döngüsü | `university_domains` tablosunu kontrol et: senin domain'in var mı? (Aşama 3 SQL'inin sonundaki seed kontrol et) |
| Fotoğraf yüklenmiyor | Supabase Dashboard → **Storage** → `listings` bucket'ı görünüyor mu? Yoksa Aşama 3.3 SQL'i tekrar çalıştır. |
| Build başarısız | Vercel → Deployments → en son'a tıkla → Build Logs incele. Genelde eksik env variable olur. |

### ✅ Final kontrol
İlan oluşturup, başka bir tarayıcıdan (incognito) ikinci bir hesapla giriş yapıp o ilana rezervasyon gönderebiliyorsan **MVP CANLI** demektir 🎉

**"Aşama 6 tamam"** yaz veya hangi adımda takıldığını söyle.

---

## 🎯 Deploy sonrası

### Hemen yapman gerekenler
- [ ] Supabase Dashboard → **Database → Backups** → **Daily backups** aktif olduğunu doğrula
- [ ] Vercel → Project Settings → **Deployment Protection** → ihtiyaca göre yapılandır
- [ ] İlk gerçek kullanıcı testlerini birkaç arkadaşınla yap

### Yakın gelecek (1-2 hafta)
- [ ] **Custom SMTP** (Resend / SendGrid) — Supabase'in 3/saat limitini aşmak için
- [ ] **Custom domain** — `unimarket.com.tr` gibi
- [ ] **Vercel Analytics** etkinleştir (free)
- [ ] **Sentry** veya benzeri error tracking

### Orta vadede
- [ ] Stripe entegrasyonu (paid ilanlarda %5 komisyon)
- [ ] Push notification (web push)
- [ ] Admin moderation dashboard (şimdilik Supabase Studio yeterli)

---

## 🆘 Yardım

Herhangi bir aşamada takılırsan:
1. Hangi aşamada olduğunu yaz
2. Hata mesajını paylaş (varsa)
3. Ekran görüntüsü ekle (varsa)

Beraber çözeriz.
