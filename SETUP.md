# Switching on real sign-in (about 15 minutes)

The site reads real websites straight away. Real email codes and shared company workspaces need two free services connected in Vercel. Until both are connected, the email step tells people sign-in isn't switched on yet and offers a preview code instead, so the journey never dead-ends.

## 1. Database: Upstash for Redis (stores codes, sessions and workspaces)

1. Open the **klarnow-call** project in Vercel → **Storage** → **Create Database** → **Upstash for Redis** (free plan is enough).
2. Name it (e.g. `klaro-call`), pick a region close to your users (London is fine), and **connect it to the klarnow-call project** for Production and Preview.
3. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. Nothing to copy.

## 2. Email: Resend (sends the 6-digit codes)

1. Create a free account at resend.com (3,000 emails a month, 100 a day).
2. **Domains → Add domain.** Use a domain you control, ideally a subdomain like `mail.yourdomain.com`.
3. Add the DNS records Resend shows (at your domain provider) and wait until the domain says **Verified**.
   *Without a verified domain, Resend only delivers to your own Resend login email, so other people won't get codes.*
4. **API Keys → Create API key** with "Sending access".
5. In Vercel → klarnow-call → **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = the key from step 4
   - `MAIL_FROM` = `Klaro Call <hello@mail.yourdomain.com>` (any address on the verified domain)

## 3. Redeploy

Vercel → **Deployments** → latest → **Redeploy** (environment variables only apply to new deployments).

## How it behaves

- **Codes:** 6 digits, valid 10 minutes, 5 tries, new code after 30 seconds, max 6 codes per email per hour.
- **Workspaces:** the first person who signs in with a company email (e.g. `@canalstreetkitchen.co.uk`) becomes the **owner** and their setup becomes the workspace. Colleagues who sign in later with the same company domain join as **members** (view only). Gmail, Outlook, iCloud and similar addresses get a personal workspace.
- **Sessions:** 30 days, stored as a secure, http-only cookie.
- **New workspaces start empty** (no calls until a number is live). Owners can load clearly labelled example calls to try the dashboard, and remove them again. Step 03 plays an example call in the browser; nothing is dialled.
- **Coming back:** “Sign in” on the landing page (or /signin) → work email → code → straight into the workspace. Opening /app while signed out asks you to sign in.
- **Review tools:** hidden for normal visitors. Add `?review=1` to any address to show them (remembered in that browser), `?review=0` to hide them again.

## Local development

```
LOCAL_DEV=1 npm run dev
```

Uses an in-memory database and shows the code on screen and in the terminal instead of emailing it.
