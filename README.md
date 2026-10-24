# Oryvchem website (Next.js, EN / AR / FR)

Next.js 16 App Router, no CSS framework, one runtime dependency (`nodemailer`).

## Run
```bash
npm install
cp .env.example .env.local   # fill in SMTP_* (see below)
npm run dev                  # http://localhost:3000  -> redirects by Accept-Language
npm run build && npm start
```

## Forms → email
Both forms (quote inquiry, call-back) POST to `/api/inquiry`, which emails **CONTACT_TO_EMAIL**
(default `Chorfihouda55@gmail.com`). Gmail can't be a sender without credentials, so set an SMTP account:

| Provider | SMTP_HOST | SMTP_PORT | Notes |
|---|---|---|---|
| Gmail | smtp.gmail.com | 465 | `SMTP_USER` = the Gmail address, `SMTP_PASS` = a Google **App Password** (needs 2-step verification) |
| Zoho / Brevo / Resend SMTP / SendGrid | per provider | 465 or 587 | verify your domain for best deliverability |

Without `SMTP_HOST`: dev mode logs the message to the console; production returns 503 (the form shows an error and the WhatsApp fallback).
Spam protection: hidden honeypot field, server validation, per-IP rate limit (in-memory; use Upstash/Redis if you run several instances).

## CRM + editable content (`/admin`)
Set `DATABASE_URL` (Postgres, e.g. Neon/Supabase on Vercel) and `ADMIN_PASSWORD`, then open `/admin`.
- **Leads (CRM):** every form submission is saved first, then emailed (with a link to the lead). Statuses (new → contacted → quoted → won/lost/spam), assignee, follow-up date, notes timeline, search, CSV export.
- **Site content:** edit every text of the site in English, Arabic and French (hero, categories, FAQ, SEO titles/descriptions…). Only edited fields are stored; clear a field to restore the built-in copy.
- **Insights posts:** Markdown articles per language, published instantly, added to the sitemap, `llms.txt` and Article JSON-LD.
Without `DATABASE_URL` the site still works from the built-in copy and emails inquiries.
Public pages are cached for 5 min and flushed immediately when you save in the admin.

## SEO / GEO
- `/[locale]` (en, ar, fr) with `hreflang` + `x-default`, localized titles/descriptions, canonical URLs, OG/Twitter, RTL for Arabic.
- 7 product pages per language (`/[locale]/products/[slug]`) with Service, BreadcrumbList and FAQPage JSON-LD.
- Home: Organization/LocalBusiness (with geo + areaServed), WebSite, WebPage, ItemList, FAQPage, HowTo JSON-LD.
- GEO: answer-first "What is Oryvchem" block, FAQ in all languages, `/llms.txt` + `/llms-full.txt`, `robots.txt` that welcomes AI crawlers, `sitemap.xml` with alternates.
- Set `NEXT_PUBLIC_SITE_URL` to the real domain before deploying.

## Edit content
All copy lives in `src/i18n/dictionaries/{en,fr,ar}.ts` (typed against `en.ts`, so a missing key fails the build).
Categories/slugs: `src/lib/site.ts`.

## Deploy: Vercel (app) + Railway (Postgres) + Cloudflare (domain)

**1. Database (Railway).** New project -> **+ New -> Database -> PostgreSQL**. Open the Postgres service -> **Connect** and copy the
**public** connection URL (the `...proxy.rlwy.net` one; Vercel cannot use Railway's private network). Append `?sslmode=require`.
Tables are created automatically on first use.

**2. App (Vercel).** Push this folder to GitHub -> Vercel **Add New -> Project -> Import**. Framework is detected as Next.js.
Add these Environment Variables (Production), *before* the first deploy:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Railway public URL with `?sslmode=require` |
| `ADMIN_PASSWORD` | long random password for `/admin` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.oryvchem.com` (baked in at build; change = redeploy) |
| `CONTACT_TO_EMAIL` | `Chorfihouda55@gmail.com` |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | your sending account (see `.env.example`) |

Tip: in Vercel **Settings -> Functions**, set the Function Region close to your Railway Postgres region (e.g. both US-East) for fast queries.

**3. Domain (Cloudflare).** In Vercel **Settings -> Domains** add `www.oryvchem.com` and `oryvchem.com` (redirect the apex to www,
which is the canonical URL used in SEO tags). Vercel shows the exact DNS records; typically in Cloudflare DNS:

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `www` | the target Vercel shows (e.g. `cname.vercel-dns.com`) | **DNS only** (grey cloud) |
| A | `@` | the IP Vercel shows (e.g. `76.76.21.21`) | **DNS only** |

Keep the grey cloud: Vercel already provides CDN/SSL, and double proxying can break certificate issuance. If you do enable the
orange cloud later, set Cloudflare SSL/TLS mode to **Full (strict)**.

**4. Email deliverability.** Forms are sent from `MAIL_FROM`. If that is on your domain, add the SPF/DKIM records your SMTP
provider gives you in Cloudflare DNS (type TXT/CNAME, DNS only), otherwise Gmail may mark the notifications as spam.
With a Gmail SMTP account (`smtp.gmail.com`, port 465, App Password) no DNS records are needed.

**5. Check.** Open `/admin`, submit a test inquiry on the site, confirm it appears under Leads and arrives by email.
Then submit `https://www.oryvchem.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

Notes: pages are cached 5 min and flushed immediately when you save in the admin. The form rate limit is in-memory, so on
Vercel (several short-lived instances) it is a soft limit; the honeypot and validation still apply. For a hard limit use Upstash Redis.
