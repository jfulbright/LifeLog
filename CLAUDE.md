# CLAUDE.md — LifeSnaps

## Project

LifeSnaps (lifesnaps.org) — personal life-logging app with social sharing.
React 19 + Express proxy + Supabase PostgreSQL. Deployed on Vercel.

## References

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, data model, services, patterns
- [ROADMAP.md](./ROADMAP.md) — what's shipped, what's next, priorities
- [SOCIAL.md](./SOCIAL.md) — social sharing behavior, rules, flows, MVP decisions
- [USER_STORIES.md](./USER_STORIES.md) — manual usability/consistency walkthrough of the social model
- [COMPONENTS.md](./COMPONENTS.md) — UI pattern library, schema conventions, deviation rules

---

## Commands

```bash
# No root package.json — run from subdirectories
cd client && npm start        # React dev server → http://localhost:3000
cd server && npm start        # Express proxy   → http://localhost:5050

cd client && npm run build    # Production bundle (also used for compile check)
cd client && npm test         # Jest tests (watch mode)
```

---

## Environment

**`client/.env.local`** (required):
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_SERVER_URL=http://localhost:5050
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_MAPBOX_TOKEN=          # city autocomplete
REACT_APP_TMDB_ACCESS_TOKEN=     # movie search (Bearer)
REACT_APP_TMDB_API_KEY=          # movie search (v3 fallback)
REACT_APP_OMDB_API_KEY=          # IMDb / Rotten Tomatoes ratings (omdbapi.com, free tier)
```

**`server/.env`** (required):
```
SETLISTFM_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=     # wine label OCR
CORS_ORIGIN=http://localhost:3000
```

---

## Git Workflow

Follow this loop for all feature work:

1. **Branch:** `git checkout -b feature/<descriptive-name>` from `main`
2. **Code:** Implement the feature using existing patterns (schema-driven forms, useCategory hook)
3. **Verify:** Run `npx react-scripts build` to confirm zero compile errors. (ESLint + Prettier config is pending — once configured, run lint before build.)
4. **Commit:** Atomic, conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`). Focus on the *why*, not the *what*.
5. **PR:** Generate a markdown PR description from `git diff main...HEAD` before pushing.

---

## Design System

This project uses **React Bootstrap** (not Tailwind or shadcn). Follow the existing token system.

**Typography:**
- Display/headings: `DM Sans` (700 weight) — `var(--font-display)`
- Body/UI: `Lato` (400/700) — `var(--font-body)`

**Color palette (Slack-inspired):**
- Brand/primary: Aubergine `#4A154B` — `var(--color-primary)`
- Background: `#F4F4F5` — `var(--color-surface)` for cards
- Text: `#1D1C1D` primary, `#696969` secondary
- Status: success `#2EB67D`, warning `#ECB22E`, info `#36C5F0`, danger `#E01E5A`
- Sidebar: Aubergine background with white text at 82% opacity

**Component patterns:**
- Cards use `var(--card-radius)` (8px) and `var(--card-shadow)`
- Spacing via `var(--spacing-card-padding)` and `var(--spacing-section)`
- All colors and sizing through CSS custom properties in `client/src/index.css`
- No inline styles for colors/fonts — always reference tokens

---

## Key Patterns

- **Schema-driven forms:** Add fields to `*Schema.js` → `ItemForm` renders automatically. Never write per-category form JSX.
- **`hooks/useCategory.js`:** All CRUD, filtering, modals, and social sharing per category. Do not duplicate this logic in feature components.
- **dataService.js:** All DB access goes through here. Never call Supabase directly from components.
- **RLS handles authorization:** No app-level permission checks needed for data access.
- **Photos:** Compress client-side → upload to the **private** `photos` bucket with `upsert: true` → serve via 1-year signed URL (`createSignedUrl`). Path: `{userId}/{itemId}/{slot}.jpg`. The bucket needs INSERT **and** UPDATE RLS policies (upsert overwrites are Postgres UPDATEs — see migration `012`).
- **Server proxy:** Dedicated endpoints only. No open proxy pattern.

---

## CLI Tools

- **Supabase CLI** (`supabase`): Installed via `brew install supabase/tap/supabase`. Linked to project ref `wzsbatztmcdungfzgrnm`.
  - Run SQL: `SUPABASE_ACCESS_TOKEN=<token> supabase db query --linked "<sql>"`
  - Schema diff: `supabase db diff --linked`
  - Pull remote schema: `supabase db pull --linked`

---

## Do Not

- Modify the `items` table schema (use the JSONB `data` column for new fields)
- Add direct localStorage usage (fully migrated to Supabase)
- Create open proxy endpoints (all upstream targets are hardcoded, no user-controlled URLs)
- Skip RLS policies on new tables
- Use Tailwind, shadcn, or Material UI — this project is React Bootstrap + CSS custom properties
- Install the `frontend-design` skill — it conflicts with our established design system
- Add global state management (Redux, Zustand) — we use React Context + useCategory hook
