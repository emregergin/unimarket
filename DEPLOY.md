# UniMarket — Production Deploy Guide

End-to-end checklist for launching to Vercel + Supabase.

---

## 1. Supabase project setup

### 1.1 Create the project
1. Go to [supabase.com](https://supabase.com) → **New project** (region: `eu-central-1` recommended for TR users).
2. Note: `Project URL`, `anon` key, `service_role` key, and the DB connection strings.

### 1.2 Enable extensions
In **Database → Extensions**, enable:
- `pg_cron` (for listing expiration)
- `uuid-ossp` (usually on by default)

### 1.3 Apply schema
```bash
# Locally, with .env.local filled
npx prisma db push
psql "$DIRECT_URL" -f supabase/migrations/0001_rls_and_triggers.sql
psql "$DIRECT_URL" -f supabase/migrations/0002_storage.sql
psql "$DIRECT_URL" -f supabase/migrations/0003_blocks_ratings_limits.sql
psql "$DIRECT_URL" -f supabase/seed.sql
```

### 1.4 Configure Auth
Dashboard → **Authentication → Providers**:
- **Email** → enable "Email OTP". Disable "Confirm email" (we handle verification ourselves via OTP).
- Set the **Site URL** to your Vercel URL (e.g. `https://unimarket.app`).
- Add Vercel preview URLs (`https://*.vercel.app`) to **Redirect URLs**.

Dashboard → **Authentication → Email Templates → Magic Link**:
Ensure the body includes the literal `{{ .Token }}` placeholder so users receive a 6-digit code:
```html
<p>UniMarket'e giriş için doğrulama kodun:</p>
<h2>{{ .Token }}</h2>
<p>Bu kod 1 saat içinde geçerliliğini yitirir.</p>
```

### 1.5 Schedule listing expiration
Once `pg_cron` is enabled, run in SQL Editor:
```sql
select cron.schedule(
  'expire-listings-daily',
  '0 3 * * *',
  $$select public.expire_stale_listings();$$
);
```

---

## 2. Vercel project setup

### 2.1 Import the repo
- Vercel → **Add New → Project** → import the GitHub repo.
- Framework preset: **Next.js** (auto-detected).
- Build Command: `npm run build` (default).
- Output: `.next` (default).

### 2.2 Environment variables
Set these in **Project → Settings → Environment Variables** for both `Production` and `Preview`:

| Name | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-only, used by future admin tools) |
| `DATABASE_URL` | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Supabase direct connection (port 5432, used by migrations) |

### 2.3 Domain
- Add your custom domain in **Project → Settings → Domains**.
- Update the Supabase **Site URL** to match.

---

## 3. Pre-launch checklist

### Auth & verification
- [ ] Sign up with a real `.edu.tr` email → receive OTP → land on `/kesfet` verified
- [ ] Sign up with a non-`.edu.tr` email → land on `/dogrulama`
- [ ] Sign out → redirected to `/`
- [ ] Sign-in URL with `?redirect=/sat` honors redirect after success

### Listings
- [ ] Create listing with 3 photos → upload progress shows → redirected to detail page
- [ ] Free toggle hides price field
- [ ] Listing appears in `/kesfet` immediately
- [ ] Try creating 6 listings in a day → 6th blocked with rate-limit message

### Reservation flow
- [ ] Verified buyer can reserve another seller's listing
- [ ] Cannot reserve own listing (UI error)
- [ ] Cannot reserve while unverified (middleware redirect)
- [ ] Seller sees request in `/rezervasyonlar?tab=incoming`
- [ ] Accept → chat auto-created → both parties see it in `/sohbet`
- [ ] Reject → buyer sees rejected state, no chat

### Chat
- [ ] Locked state visible until accepted
- [ ] Realtime delivery works between two browser sessions
- [ ] Optimistic send + rollback on RLS failure
- [ ] Mark "Buluşmayı Tamamla" → status flips to completed → rating button appears

### Trust & safety
- [ ] Report listing → row appears in `reports` table (check via Supabase Studio)
- [ ] Report + Block in same flow → seller hidden from feed afterwards
- [ ] Unblock from `/profil/engellenenler`
- [ ] Submit rating → counterparty's `rating_avg` and `rating_count` update

### UX / accessibility
- [ ] Tab through every page — focus rings visible
- [ ] Bottom nav announces current page (`aria-current`)
- [ ] All forms have labels
- [ ] Light + dark mode both pass contrast check
- [ ] Reduce motion: shimmer is subtle enough; no jarring animations

### Performance
- [ ] First Load JS on `/kesfet` < 150 kB ✓
- [ ] LCP under 2s on 3G (test via Vercel Speed Insights)
- [ ] Images served from Supabase Storage with proper cache headers (default 1h public)

---

## 4. Post-launch monitoring

- **Vercel Analytics**: enable for traffic patterns.
- **Vercel Speed Insights**: real-user Core Web Vitals.
- **Supabase Logs**: watch the `auth.audit_log_entries` table for suspicious OTP traffic.
- **Reports queue**: query `select * from reports where status = 'open' order by created_at desc;` daily.

---

## 5. Common gotchas

| Symptom | Fix |
|---|---|
| OTP email never arrives | Supabase free tier limits to 3/hour. Switch to a custom SMTP (Resend, SES) before launch. |
| Image uploads 403 | Bucket `listings` must exist and `0002_storage.sql` policies must be applied. |
| "User not verified" loop | Confirm `university_domains` table is seeded and the user's email domain matches an entry. |
| Realtime chat silent | In Supabase Dashboard → Database → Replication, confirm `messages` and `reservations` are in the `supabase_realtime` publication. |
| Cron job not running | Confirm `pg_cron` is enabled and `select * from cron.job;` shows the schedule. |
