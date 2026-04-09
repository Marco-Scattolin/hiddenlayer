# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HiddenLayer is an internal tool (max 3 users) for identifying local businesses with no real web presence.

### Core logic
1. User inputs business sector + geographic area
2. System queries Google Maps Places API
3. For each result: if website field is empty → show card
4. If website field has URL → ping the URL
5. If URL does not respond → show card
6. If URL responds → hide card

### Output
Cards showing only businesses without real web presence. Each card shows: business name, category, address, Google Maps link, phone number if available, reason for inclusion (no website or unreachable website).

### Exclusion registry
PostgreSQL table of existing clients and already-contacted businesses. Any match is silently excluded before display.

### What v1 does NOT include
- Responsive check
- Social media analysis
- Maps view
- Scoring or ranking
- External auth system

### Auth
Three hardcoded users via environment variables. No registration flow.

## Commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (next/core-web-vitals + TypeScript rules)
```

No test framework is configured.

## Architecture

Next.js 14 App Router application with TypeScript and Tailwind CSS.

- `src/app/` — App Router root. All routes, layouts, and pages live here.
- `src/app/layout.tsx` — Root layout: sets metadata, loads Geist fonts, applies CSS variables.
- `src/app/page.tsx` — Home route (`/`).
- `src/app/globals.css` — Tailwind directives + CSS variable theming (`--background`, `--foreground`) with automatic light/dark mode.

Import alias `@/*` resolves to `./src/*`.

Components, utilities, and additional routes should be added under `src/`. The Tailwind config scans `src/pages/**`, `src/components/**`, and `src/app/**` for class names.
