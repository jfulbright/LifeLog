# LifeSnaps Roadmap

> Living document. Last updated: 2026-06-30.
> Strategic focus: **nail the social, profile, and landing-timeline experiences.**

---

## Context

LifeSnaps has a complete MVP: 8 categories on a polymorphic `items` table, a 4-ring
social model, collaborations, overlays, recommendations, and a deferred-invite system —
all enforced by Supabase RLS and rendered through schema-driven forms + the `useCategory`
hook. The mechanics work, but the **experience is fragmented**: there is no front door
that shows what your people are doing, no self/other profile, identity is invisible until
people are already connected, and "leaving" silently reuses `declined` with no restore
story.

This roadmap sequences the work to nail three experiences — **the landing timeline,
profiles, and the connection/virality loop** — then carries the rest as a structured
backlog. Each first-wave story below maps to a GitHub epic/issue in `jfulbright/lifelog`.

### Product decisions (resolved)

| Decision | Choice | Why it matters |
|---|---|---|
| Virality reveal on shared entries | **Full name + Connect** (profile/snaps stay locked until both accept) | Maximizes discovery/growth; identity is the hook, content stays gated |
| Recommendation model (SOCIAL.md §9.3) | **Keep new entry + add `inspired by` backlink** | Additive, low-risk; powers attribution and "between you two" stats |
| Home/Profile IA | **Today's Dashboard becomes "My Profile"; landing = unified Timeline** | One layout serves self + others; no duplicate home/profile UI |
| First execution wave | **Social + Profile + Timeline (P0/P1)**; categories/lifespan/PWA/email = backlog | Focus the build on the three target experiences |

---

## What We've Built

### Core Platform
- React 19 SPA on Vercel (lifesnaps.org); Supabase PostgreSQL with a polymorphic JSONB
  `items` table; Express API proxy with SSRF protection.
- Auth: email/password + Google OAuth + password reset. Photo upload with client-side
  compression + Supabase Storage.
- Schema-driven form architecture and the `useCategory` shared hook (no per-category CRUD).

### Snap Categories (8 live)
Movies (TMDB/OMDB), Travel (world map + itineraries), Events (concerts/sports/theater/
comedy/festivals), Cellar (wine + whiskey, label scan), Cars (NHTSA VIN decoder),
Homes, Kids (milestones), Activities.

### Social System
4-ring visibility model (Partner, Immediate Family, Extended Family, Friends), companion
tagging, shared feed with accept/decline, personal overlays, ring-gated recommendations,
invite system with auto-link on signup, in-app notifications, contact profiles.

### Pages
Dashboard, My Timeline, Snaps, Shared Feed, Recommendations, My People, Contact Profile,
Travel/Movie Stats, Settings.

---

## Critical analysis (grounded in ARCHITECTURE.md / SOCIAL.md)

**Strong and fits the architecture as-is**
- *Unified timeline as landing* — `Timeline.js` + `dataService.getItemsWithShared()`
  already merge personal + accepted shares; RLS already gates visibility. Mostly
  composition, not new plumbing. Honors the "one Timeline page" rule.
- *Profile = parameterized Dashboard* — the biggest reuse win. `ContactProfile.js` is a
  lite proto; `ItemCardList`, `EntryDetailPanel`, `useStatsPage`, and category tiles all
  take data + meta as props. Profiles become "Dashboard in visitor mode," not new pages.
- *Stats "between you two" toggle* — Movies already ships a scope toggle (Mine / Circle /
  Individual) via `useStatsPage` + `socialStats`. Generalize it; don't invent.
- *`inspired by` recs, accept-all, auto-accept, leave-from-details* — all additive to
  existing `recommendationService` / `collaboratorService`; no schema churn.

**Where we're pushing back**
- **Ring-overlap reveal is the riskiest idea and ships separately.** Revealing a
  *shared-entry's* co-collaborators has clear consent — you were on the same trip. But
  surfacing a collaborator's *other* ring members (people who shared nothing with you and
  never consented) is a privacy footgun. Ship shared-entry co-presence first; treat
  ring-overlap reveal as a gated, opt-in Phase-2 experiment.
- **The `items` schema is frozen.** Every new category and sub-type lives in JSONB `data`
  + a `*Schema.js` + `categoryMeta` + `schemaRegistry`. Watch the dual-definition risk
  (`categoryMeta` and schema must stay in sync). Categories are backlog because each
  touches nav/routing/counts/meta even though it's individually cheap.
- **Adding the "Acquaintances" ring is not just a label.** Rings are single-membership,
  levels 1–4, hardcoded in `ringMeta.js` and referenced by RLS array checks
  (`data.visibilityRings @> …`). Level 5 must be validated against the RLS policy. Keep
  fixed labels for now; defer custom ring names (SOCIAL.md §9.2).
- **Data-cleansing extends rule 7, it doesn't replace it.** "Leave" already = `declined`
  (hides the entry) and overlays persist, so data is *already* recoverable in principle.
  The gaps: no restore-on-reaccept, no reciprocal hide, no warning modal distinguishing
  "hidden" from "deleted," and remove-person vs leave-one-entry are different scopes.
  Never hard-delete collaborator/overlay rows on leave or remove.
- **Email digests have no backend to run on.** The server is a stateless proxy — no
  scheduler, no email provider. Digests need a cron/queue + transactional email. Real
  infra; stays backlog with the dependency flagged.
- **`F-010` is a hidden launch blocker.** The "email invite → they sign up → everything
  appears" loop is broken in prod until migration 010 is applied. People/Rings work sits
  on sand until it's verified.

---

## First wave — epics & issue-ready stories

→ lists the primary files/services each story touches.

### EPIC A — People, Rings & Invites (P0)
- **A1. Email invite when adding a person** (#2.1). "Send email invite" in the add-person
  flow → `inviteService.createInvite()` + server email send; surface invite status.
  *Pre-req: confirm migration 010 (F-010) applied in prod.*
  → `MyPeople.js`, `inviteService.js`, server email endpoint, `contactsService.js`
- **A2. In-app invite notifications + badge** (#2.2). Pending-invite badge by People in nav
  and per-person; reuse `AppDataContext` counts. → `AppDataContext.js`, nav, `MyPeople.js`
- **A3. Add "Acquaintances" ring (level 5)** (#2.7). Extend `ringMeta.js`; audit every ring
  enumeration and the RLS `visibilityRings` checks. → `ringMeta.js`, RLS review, ring pickers
- **A4. Rename "Partner in Crime" → "Partners"** (#2.6). Label-only. → `ringMeta.js`

### EPIC B — Connection & Virality Paradigm (P0)
- **B1. Shared-entry co-presence reveal** (#2.4). On any entry you can see, show the **full
  names** of all collaborators — including those you're not connected to — each with a
  **Connect** CTA. Profile/snaps stay locked until both accept. New SECURITY DEFINER read
  (sibling of `get_my_shared_entry_ids()`) returning collaborator `display_name` only.
  → new SQL fn + migration, `collaboratorService.js`, `SocialMemoriesCard`/`EntryDetailPanel`
- **B2. Connect handshake.** "Connect" creates a pending mutual contact link; on mutual
  accept, both see each other's full profile + co-attended entries. Reuse contact/invite
  status machinery. → `contactsService.js`, `inviteService.js`, notifications
- **B3. Leave / remove with restore** (#2.3, #10.1). Define `leaveCollaboration` (one entry)
  and `removePerson` (all shared context) as soft-hide, never hard-delete; restore on
  re-add + accept; reciprocal hide; **warning modal** ("hidden, not deleted — restorable").
  → `collaboratorService.js`, `overlayService.js` (preserve rows), detail panel, confirm modal
- **B4. (Phase-2, gated) Ring-overlap reveal** (#2.5). Opt-in, separate issue, behind the
  privacy discussion. **Not in the first build wave.**

### EPIC C — Landing Timeline (P0)
- **C1. Make the unified Timeline the landing route** (#4.1, #4.6). Repoint `/` to one
  `Timeline` rendering personal + shared via `getItemsWithShared()`; no second component.
  → `App.js` routing, `Timeline.js`
- **C2. Ring/people filter pills** (#4.1, #4.3). Filter by ring and individual; only show
  snaps from people in your rings. → `Timeline.js`, `ringMeta.js`, `contactsService.js`
- **C3. Inline photo thumbnails + honored visibility** (#4.2, #4.4). Inline `PhotoGrid`
  thumbs; keep owner-set visibility intact. → `Timeline.js`, `PhotoGrid.js`, `socialContent.js`
- **C4. Live incoming summary header** (#4.5). Top-of-landing component summarizing pending
  recs + collab invites, click-through, auto-updating from `AppDataContext`. → new component

### EPIC D — User Profiles (P1)
- **D1. Reusable "open profile" entry point** (#5.1). One `ProfileLink`/avatar component
  from every card/companion chip → `/people/:userId` (self or other).
  → new shared component, `EntryHeader`, companion chips
- **D2. Profile = parameterized Dashboard** (#5.2). Refactor `Dashboard.js` →
  `ProfileView({ profileUserId, isOwnProfile })`; gate add/log/search behind `isOwnProfile`;
  extend `ContactProfile.js` rather than fork. → `Dashboard.js`, `ContactProfile.js`, `App.js`
- **D3. Stats + stats-in-common header** (#5.3). Reuse the stats summary; add shared-collabs
  count and recs sent/accepted/pending between you two; link to their stats page.
  → `useStatsPage.js`, stats summary, `recommendationService`, `collaboratorService`
- **D4. Generalized social scope toggle on stats** (#5.3.2). Promote the Movies scope
  pattern (Their stats / Shared / Just us) to a page-wide filter; category + social filters
  apply to everything. → `useStatsPage.js`, `StatsPageLayout.js`, all `*StatsPage`
- **D5. Visitor-mode category tiles + drill-in** (#5.4). Tiles open the standard category
  page in **visitor mode** (rich UI like trips/maps, no add/log/search), scoped to that user
  via RLS-filtered reads. Drive off `isOwnProfile` to reuse, not duplicate.
  → category list pages, `ItemCardList`, `EntryDetailPanel`, a `viewerMode` flag
- **D6. Profile memories strip** (#5.5). Below tiles, show their snaps/photos (reuse
  `Snaps`/`PhotoGrid`, visibility-honored). → `ProfileView`, `Snaps` rendering

### EPIC E — Collaboration & Recommendations (P1)
- **E1. Accept-all + auto-accept toggle** (#9.1, #9.2). Bulk accept; settings auto-accept
  with status still shown in filter pills. → `Recommendations.js`, `SharedFeed.js`, services, Settings
- **E2. Leave from details panel** (#9.3). "Leave collaboration" on the detail panel, routed
  through B3's soft-hide. → `EntryDetailPanel`, `collaboratorService`
- **E3. `inspired by` recommendation backlink** (SOCIAL.md §9.3). On accept, keep the new
  entry but persist provenance and render "inspired by {recommender}".
  → `recommendationService.acceptRecommendation`, `data.recommendedBy`, card/detail display
- **E4. Collaboration edit-history log** (#10.2). Append-only change log per shared entry.
  → migration (table or JSONB audit), `EntryDetailPanel`

### EPIC F — Stats integrity (supports profiles)
- **F1. Shared `avgRating` util + fix** (#11.1). One common average util (`rating > 0`
  filter); add to `travelStats.js` (missing); replace per-category copies.
  → new `helpers/ratingStats.js`, `travelStats.js`, `movie/event/activityStats`
- **F2. Stats honor visibility for others** (#11.2). All stat computations run on
  RLS-filtered data for other users. → `useStatsPage.js`, stats services

---

## Backlog (not first-wave)

- **Email notifications** (P2, #1) — live/daily/weekly/off in Settings. **Needs infra**:
  scheduler + transactional email (Supabase scheduled fn or Resend).
- **PWA add-to-home-screen** (P3, #3) — manifest + service worker; isolated, low effort.
- **New categories** (P3, #6) — Restaurants (trip sub-items; Google/Eater), Hotels (trip
  sub-items), Health vitals (blood tests over time + auto-age), Books (own category;
  Amazon/Google Books), Car sub-types (use the `cellar.subType` pattern). All via JSONB +
  schema + `categoryMeta`; mind dual-definition sync.
- **Children** (P2, #7) — rename Kids→Children (label only, keep `kids` key); sub-types
  grades/artwork/jobs/baby milestones; **fix age field** — `KidsForm` needs a calc effect
  watching `childContactId` + `startDate` against the contact birthday to populate the
  read-only `ageAtEvent`.
- **Lifespan chart** (P3, #8) — Monarch-style life curve with major-snap filters; reuse the
  events map/list view-toggle for timeline↔life-curve switching.

---

## Sequencing

1. **Foundation:** verify/apply migration 010 (F-010) → A1–A4 (people/rings/invites).
2. **Connection loop:** B1–B3 (virality reveal + connect + soft-hide/restore).
3. **Front door:** C1–C4 (landing timeline), reusing the C4 summary header.
4. **Profiles:** D1–D6, leaning on the parameterized-Dashboard refactor.
5. **Collab/rec polish + stats integrity:** E1–E4, F1–F2.
6. **Backlog** as capacity allows; email blocked on the infra decision.

B4 (ring-overlap reveal) and all backlog items are explicitly out of the first wave.

---

## Archived Plans

Previous engineering plans (Phases 1–6iv) and feature specs are archived in
`~/.cursor/plans/archive/`:
- Engineering Roadmap: `lifelog_incremental_roadmap_cc32d162.plan.md`
- Feature Roadmap: `lifelog_feature_roadmap_11c9083a.plan.md`
