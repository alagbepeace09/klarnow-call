# Klaro Call V1.1: marketing site and onboarding preview

The Klaro Call landing page, plus the first three onboarding screens from the V1.1 brief:

1. **Landing** (`/`): the full marketing page with the "Get my receptionist" website input.
2. **Klaro Generator** (`/start?site=…`): scanning → review/edit, or manual entry when there's no website.
3. **Live Test Call** (`/start` → call): consent, honest call states, post-call summary and a browser voice preview fallback.

> **Preview build.** Scan results, call progress and summaries are **sample data**. Nothing is dialled.
> The UI is built to show only states that really happened, so real telephony events can replace the simulation one-for-one.
> A "Review tools" pill lets reviewers jump to any state and simulate failures. Add `?clean=1` to the URL to hide it.

## Brand and themes
- Standalone Klaro Call identity (no links to klarnow.co.uk): Instrument Sans + JetBrains Mono, electric violet `#7346ff` + signal lime `#d2ff3a`, visor logo mark.
- Light and dark mode: tokens live in `src/styles/theme.css` under `[data-theme]`. The toggle sits in the nav. The choice is saved in localStorage and defaults to the visitor's system setting.
- Page structure follows the Nooks reference: floating capsule nav, `/ LABEL` section headers, numbered tab carousel, bento, dark dot-matrix and glass sections, big-wordmark footer.

## Stack
- Vite + React 18 (no UI library)
- Plain CSS: `src/styles/theme.css` (tokens), `src/styles/app.css` (flow + Klaro) and `src/styles/landing.css`
- Klaro is a pure-CSS character (`src/components/Klaro.jsx`) with 7 moods: welcome, thinking, listening, speaking, working, success, attention
- Fonts: Geist and Geist Mono (Google Fonts)

## Run locally
```bash
npm install
npm run dev
```

## Deploy
Connected to Vercel. Every push to `main` deploys. `vercel.json` rewrites routes to the SPA.
