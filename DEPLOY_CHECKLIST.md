# ✅ UniMarket Deploy Checklist

Hızlı referans kartı. Detaylar için [`DEPLOY_NOW.md`](./DEPLOY_NOW.md).

```
┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 1 — GITHUB                                  ~5 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] GitHub hesabı var                                      │
│  [ ] 'unimarket' adında private repo oluşturuldu            │
│  [ ] git init / add / commit / push tamam                   │
│  [ ] Personal Access Token oluşturuldu                      │
│  [ ] Repo'da 92 dosya görünüyor                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 2 — SUPABASE PROJE                          ~5 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] supabase.com'da hesap var (GitHub ile)                 │
│  [ ] 'unimarket' projesi oluşturuldu (Frankfurt region)     │
│  [ ] DB şifresi kaydedildi (password manager'a)             │
│  [ ] Project URL kopyalandı                                 │
│  [ ] anon key kopyalandı                                    │
│  [ ] service_role key kopyalandı                            │
│  [ ] DATABASE_URL (port 6543) hazır                         │
│  [ ] DIRECT_URL (port 5432) hazır                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 3 — DATABASE SCHEMA                         ~5 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] .env.local oluşturuldu, 5 değişken dolu                │
│  [ ] npx prisma db push BAŞARILI                            │
│  [ ] supabase/setup/all_in_one.sql çalıştırıldı             │
│  [ ] 11+ tablo var (Database → Tables)                      │
│  [ ] pg_cron extension etkin                                │
│  [ ] cron.schedule komutu çalıştırıldı                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 4 — SUPABASE AUTH                           ~3 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] Email provider enabled                                 │
│  [ ] "Confirm email" KAPALI                                 │
│  [ ] Email OTP enabled                                      │
│  [ ] Magic Link template'inde {{ .Token }} var              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 5 — VERCEL                                  ~5 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] vercel.com'da hesap var (GitHub ile)                   │
│  [ ] 'unimarket' repo import edildi                         │
│  [ ] 5 environment variable eklendi                         │
│  [ ] Build BAŞARILI                                         │
│  [ ] Vercel URL açılıyor (onboarding ekranı)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AŞAMA 6 — FINAL TEST                              ~5 dk    │
├─────────────────────────────────────────────────────────────┤
│  [ ] Supabase Site URL güncellendi (Vercel URL'si)          │
│  [ ] Redirect URLs eklendi                                  │
│  [ ] Kayıt ol → OTP mail geldi                              │
│  [ ] OTP girdi → /kesfet açıldı                             │
│  [ ] Profil → "Doğrulanmış Öğrenci" rozeti var              │
│  [ ] /sat → ilan oluşturuldu (fotoğraflı)                   │
│  [ ] /kesfet → ilan görünüyor                               │
│  [ ] İkinci hesap → rezervasyon → sohbet açıldı             │
└─────────────────────────────────────────────────────────────┘

       🎉  CANLI! Vercel URL'ni paylaş ve kullanıcı topla.
```
