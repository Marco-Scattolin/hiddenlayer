# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HiddenLayer is an Italian-language internal tool (max 3 users) for identifying local businesses with no real web presence.

### Core logic
1. User inputs business sector + geographic area
2. Claude API generates 6–8 Italian query variations; app fetches Google Places results in parallel
3. For each result: if website field is empty → show card; if URL present → ping it (HEAD, 5s timeout); if unreachable → show card; if reachable → hide card
4. Social media URLs (Facebook, Instagram, etc.) are treated as no real website
5. Exclusion registry (Supabase) silently filters out existing clients and already-contacted businesses by name (partial match) or domain (exact)

### Auth
Three hardcoded users stored in Supabase. Session via iron-session (signed httpOnly cookie). Admin username is hardcoded as `"marco"`. No registration flow.

## Commands

```bash
npm run dev    # Dev server at http://localhost:3000
npm run build  # Production build
npm run start  # Start production server
npm run lint   # ESLint (next/core-web-vitals + TypeScript)
```

No test framework is configured.

## Architecture

Next.js 15 App Router with TypeScript and Tailwind CSS. Import alias `@/*` → `./src/*`.

**External services:**
- **Supabase** — PostgreSQL DB (users, contacts, reports, exclusions tables)
- **Google Places API** — business discovery (paginated, max 3 pages, 2s delay between pages)
- **Anthropic Claude API** — generates search query variations; falls back to raw sector name on failure
- **N8N** (optional) — webhook triggered on report submission

**Key data flow:**
```
SearchForm → POST /api/search → Claude (query gen) → Google Places (parallel)
          → website check → Exclusion filter → results to UI
```

**Database tables:**
- `users`: `username (PK)`, `email`, `password_hash`
- `contacts`: `username + maps_url (composite PK)`, `name`, `category`, `address`, `phone`, `reason`, `saved_at`
- `reports`: `id`, `username`, `type`, `business_name`, `object` (subject), `note`, `place_id (unique)`, `triggered_exclusion`
- `exclusions`: `id`, `name` (partial match), `domain` (exact match), `reason`, `createdAt`

**Report subjects** are defined in `src/lib/reportSubjects.ts`. Some subjects (e.g. "Sito rilevato") auto-add the business to exclusions; others are flagged for manual review.

## Routes

Public: `GET /login`, `POST /api/auth/login`

All other routes require a valid session (middleware at `src/app/middleware.ts` redirects to `/login`).

Admin-only (`username === "marco"`): `/admin`, `/api/admin/users/*`, `GET /api/reports`, `DELETE /api/reports/[id]`

## Key files

| File | Purpose |
|------|---------|
| `src/lib/session.ts` | `SessionData` interface, iron-session config |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/reportSubjects.ts` | `REPORT_SUBJECTS` constant — source of truth for report categories |
| `src/lib/exportCsv.ts` | Client-side CSV generation for saved contacts |
| `src/components/SearchForm.tsx` | Main search UI, pagination, report modal |
| `src/app/api/search/route.ts` | Core search logic: Claude → Places → website check → exclusion filter |

## Conventions

- **API responses:** `{ ok: true }` / `{ error: "..." }` / `{ data: ... }` with appropriate HTTP status
- **Styling:** Tailwind + custom classes (`.hl-input`, `.hl-button`); dark theme hardcoded (`#252525` bg, `#c9a030` accent gold, `#c92055` red); no CSS modules
- **Client components:** marked with `"use client"`, use local `useState` — no global state library
- **Italian UI:** all user-facing strings are in Italian

## Environment variables

`.env` (Supabase + session — committed with placeholders):
```
DATABASE_URL, DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SESSION_SECRET
```

`.env.local` (never commit):
```
GOOGLE_MAPS_API_KEY
ANTHROPIC_API_KEY
N8N_WEBHOOK_URL   # optional
```
