# LifeSnaps Roadmap

> Living document. Last updated: 2026-05-21.

---

## What We've Built

### Core Platform
- React 19 SPA deployed on Vercel at lifesnaps.org
- Supabase PostgreSQL backend with JSONB items table
- Full auth: email/password + Google OAuth + password reset
- Express API proxy with SSRF protection and key management
- Photo upload with client-side compression + Supabase Storage
- Schema-driven form architecture (declarative field definitions)
- `useCategory` shared hook (eliminates per-category CRUD boilerplate)

### Snap Categories (8 live)
- **Movies** — TMDB/OMDB search, stats page, social feed, recommendations, unified landing
- **Travel** — World map, city autocomplete, trip stats dashboard, itinerary linking
- **Events** — Unified sub-types: concerts (Setlist.fm), sports, broadway, comedy, festivals
- **Cellar** — Wine + whiskey, VinoFYI/WhiskeyFYI search, label scan (barcode + OCR)
- **Cars** — NHTSA VIN decoder (13+ fields auto-populated)
- **Homes** — Owned/rented with visibility rules
- **Kids** — Milestone types (school, sports, firsts, performance, achievement)
- **Activities** — General experiences with city autocomplete + trip linking

### Social System
- 4-ring visibility model (Partner, Immediate Family, Extended Family, Friends)
- Companion tagging with contact picker
- Shared feed with accept/decline collaboration flow
- Personal overlays (your reflections on shared entries)
- Recommendations with ring-gated distribution
- Invite system with auto-link on signup
- In-app notifications
- Contact profiles with shared entry history

### Pages
- Dashboard (category counts overview)
- My Timeline (chronological feed with month filter + stats strip)
- Snaps (universal filtered view)
- Shared Feed (entries from contacts with inline overlays)
- Recommendations (ring-gated suggestions)
- My People (contact management + ring assignment)
- Contact Profile (individual shared history)
- Travel Stats / Movie Stats (dedicated analytics)
- Settings (profile, preferences, export)

---

## In Progress

- [x] Unified movie landing page with inline TMDB search and quick-add
- [x] Movie social polish — detail-modal redesign, SERP friend ratings/snaps, IMDb/RT display + four rating filters (My / People / IMDb / Rotten Tomatoes), and a stats scope toggle (Mine / Circle / Individual) with agreements/disagreements

---

## Next Up (Prioritized)

### Priority 1: Launch Readiness
- [ ] Facebook OAuth (Meta App Review process)
- [ ] Privacy policy page
- [ ] Publish Google OAuth (exit testing mode)
- [ ] Supabase identity linking (multi-provider accounts)
- [ ] Invite first real users (wife + close friends)
- [ ] Production Express proxy deployment (Railway)

### Priority 2: Social Stickiness
- [ ] "Recommended" status model — cross-category flag on any entry
- [ ] One-tap "Add to my Wishlist" from recommendation feed
- [ ] Wishlist-to-Done conversion tracking (hidden PMF metric)
- [ ] Lightweight "tips" field for travel recommendations

### Priority 3: Stats Engine
- [ ] Generic stats service (query items by category + user + time range)
- [ ] Ring-gated friend comparison (collective stats, non-competitive framing) — shipped for **movies** (circle compatibility, agreements/disagreements, Mine/Circle/Individual scope toggle); generalize to other categories
- [ ] Per-category stats tabs (reusable component pattern)
- [ ] Dashboard "Your 2026 so far" summary widget

### Priority 4: New Categories
- [ ] Restaurants (name, cuisine, location, price range, occasion, order notes)
- [ ] Books (reading list — natural extension of the watched/wishlist pattern)

### Priority 5: Depth Features
- [ ] Maintenance logs for Cars and Homes (nested entries, cost, vendor, next-due)
- [ ] Year-in-Review "Wrapped" (annual recap, shareable card)
- [ ] Quick-add mode for high-frequency categories (< 30 sec entry)

### Priority 6: Infrastructure & DX Tooling
- [ ] Configure ESLint + Prettier (code quality gate for git workflow)
- [ ] Install Supabase CLI (migration diffing, schema introspection, local dev)
- [ ] Install Railway CLI (deploy verification, env management)
- [ ] Document CLI workflows in CLAUDE.md once available

---

## Future Vision

Items here are directional — not committed.

- Public profiles / follow model (extending Ring 4 to public)
- Push notifications (PWA service worker or native wrapper)
- AI-powered entry suggestions ("You were in Denver last weekend — log it?")
- Trip linking across categories (dinner + event + hotel = one trip)
- Import from external services (Letterboxd, Untappd, Strava)
- Export / data portability (JSON, CSV)
- Mobile-native app (React Native or PWA enhancement)
- Gamification (streaks, badges, completion incentives)

---

## Archived Plans

Previous engineering plans (Phases 1–6iv) and feature specs are archived in `~/.cursor/plans/archive/`. Key historical references:
- Engineering Roadmap: `lifelog_incremental_roadmap_cc32d162.plan.md`
- Feature Roadmap: `lifelog_feature_roadmap_11c9083a.plan.md`
