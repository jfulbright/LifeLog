# LifeSnaps Architecture

> System reference for the LifeSnaps platform. Last updated: 2026-05-31.

---

## 1. System Overview

LifeSnaps is a personal life-logging app with social sharing capabilities. Users catalog experiences across 8 categories (movies, travel, events, wines, cars, homes, kids, activities), attach reflections and photos, and selectively share entries with contacts via a ring-based visibility model.

```
┌──────────────────────────────────────────────────────────────┐
│                   Client (React 19 SPA)                        │
│  React Router 7 · React Bootstrap 5 · Vercel @ lifesnaps.org  │
├──────────────────────────────────────────────────────────────┤
│  Schema-driven forms (ItemForm) · useCategory hook (CRUD)     │
│  dataService (Supabase abstraction) · AppDataContext          │
└────────────┬─────────────────────────────┬───────────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌────────────────────────────────┐
│     Supabase Cloud      │   │   Express Proxy (port 5050)    │
│  · Auth (email+Google)  │   │   · /api/setlists/search       │
│  · PostgreSQL (items,   │   │   · /api/wine/* (VinoFYI)      │
│    profiles, contacts,  │   │   · /api/whiskey/* (WhiskeyFYI)│
│    collaborators, etc.) │   │   · /api/wine/scan (Vision)    │
│  · Storage (photos,     │   └──────────────┬─────────────────┘
│    avatars)             │                  │
└─────────────────────────┘     ┌────────────┼────────────┐
                                ▼            ▼            ▼
                         Setlist.fm    VinoFYI/      Google
                                       WhiskeyFYI    Vision

Client-direct APIs (no proxy):
  TMDB · OMDB · Mapbox · NHTSA · Open Food Facts
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.0.0 |
| Routing | react-router-dom | 7.4.0 |
| UI Framework | React Bootstrap + Bootstrap | 2.10.9 / 5.3.3 |
| Dropdowns | react-select | 5.10.2 |
| Maps | react-simple-maps + world-atlas | 3.0.0 / 2.0.2 |
| Barcode Scanning | @zxing/browser + @zxing/library | 0.2.0 / 0.22.0 |
| Image Compression | browser-image-compression | 2.0.2 |
| Build Toolchain | Create React App (react-scripts) | 5.0.1 |
| Backend Proxy | Node.js (ESM) + Express | 4.18.x |
| HTTP Client (server) | node-fetch | 3.x |
| Database | Supabase PostgreSQL | — |
| Auth | Supabase Auth | — |
| File Storage | Supabase Storage | — |
| Client SDK | @supabase/supabase-js | 2.105.3 |

---

## 3. Data Architecture

### 3.1 Primary Table: `items`

All 8 snap categories share a single polymorphic table. Category-specific fields live in the JSONB `data` column; common filterable fields are promoted to dedicated columns for query performance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Item identity |
| `user_id` | uuid (FK → auth.users) | Owner |
| `category` | text | Snap category key |
| `status` | text | Promoted status (watched, visited, etc.) |
| `start_date` | text | Promoted date for sorting |
| `data` | jsonb | All category-specific fields |
| `created_at` | timestamptz | Row creation |
| `updated_at` | timestamptz | Last modification |

**RLS Policies on `items`:**
- Owner can CRUD own rows (`user_id = auth.uid()`)
- Collaborators can SELECT entries shared with them (via `collaborators` table, status pending or accepted)
- Collaborators with `can_edit = true` can UPDATE shared entries
- Recipients can SELECT recommended entries (via `recommendations` table)

### 3.2 Social Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User display info | id, display_name, first_name, last_name, avatar_url, bio (140 chars) |
| `contacts` | User's address book | owner_id, email, display_name, ring_level (1-4), invite_status, linked_user_id |
| `invites` | Pending invitations | token (hex), inviter_id, invitee_email, status, shared_entry_count |
| `collaborators` | Shared entry access | entry_id, owner_id, collaborator_user_id, status (pending/accepted/declined), can_edit |
| `overlays` | Personal reflections on shared entries | entry_id, user_id, snapshot1-3, rating, photos |
| `recommendations` | Entry recommendations | from_user_id, entry_id, to_user_id, to_ring_level, status |

**Auto-linking triggers:**
- `on_auth_user_created` → creates profile from signup metadata
- `on_auth_user_created_link` → links pending invites and contacts when new user's email matches

### 3.3 Row Level Security

Every table has RLS enabled. Summary:

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|---------------------|
| profiles | Own + linked contacts | Own only |
| contacts | Own only | Own only |
| invites | Anyone (by token) | Own only |
| collaborators | Own rows + peer rows on shared entries (via `get_my_shared_entry_ids()` SECURITY DEFINER fn) | Owner manages all; collaborator updates own status |
| overlays | Own + overlays on entries you collaborate on | Own only |
| recommendations | Own + directed to you (including ring-based) | Own only |

### 3.4 Storage

**Buckets:**
- `photos` (private; read/write restricted to own `userId/itemId/` path via signed URLs)
- `avatars` (public read, write restricted to own `userId/` path)

**Photo pipeline:**
1. Client compresses image (browser-image-compression)
2. Upload to `photos/{userId}/{itemId}/{slot}.jpg` with `upsert: true`
3. Retrieve via a 1-year signed URL (`createSignedUrl`) — bucket is private
4. 3 photo slots per entry (photo1, photo2, photo3)

> **Storage RLS requires all four verbs.** Because uploads use `upsert: true`,
> overwriting an existing photo is a Postgres **UPDATE** on `storage.objects`, not
> an INSERT — so the `photos` bucket needs INSERT **and** UPDATE policies (plus
> SELECT and DELETE). A missing UPDATE policy lets the first upload succeed but
> silently breaks every re-upload. See migration `012`.

### 3.5 Database Change Management

**Migrations are the single source of truth for schema and RLS — never the
dashboard.** Drift between hand-edited dashboard policies and the repo is a real
root-cause class of bug here (e.g. the missing `photos` UPDATE policy). Rules:

1. **Every schema/RLS change is a committed migration** in `supabase/migrations/`,
   sequentially numbered (`NNN_description.sql`). The Supabase dashboard is for
   *reading* state and prototyping only — promote any prototype to a migration
   before it's considered real.
2. **Append-only.** Once a migration has run against prod it is frozen history.
   Fixes go in a *new* migration, never by editing an applied one.
3. **Idempotent and self-healing.** Use `DROP POLICY IF EXISTS "name" ...` then
   `CREATE POLICY "name" ...` so re-running converges on the correct state and
   overwrites any drifted dashboard version. Avoid `IF NOT EXISTS` guards that
   *skip* when a wrong-but-present policy exists — that is how the UPDATE policy
   went missing.
4. **Stable, predictable policy names** (`photos_update_own`-style), so the
   drop-then-create pattern can reliably target them.
5. **Apply through one path:** `supabase db push` (CLI is linked) runs pending
   migrations in order and records them in `schema_migrations`. Direct SQL is for
   emergency hotfixes only, and must be backfilled into a migration immediately.
6. **Detect drift:** run `supabase db diff --linked` periodically to surface
   divergence as a diff rather than a production error.

---

## 4. Feature Modules

> For detailed component behavior, props, deviation analysis, and standardization rules, see [COMPONENTS.md](./COMPONENTS.md).

### 4.1 Schema-Driven Pattern

Every category defines a declarative schema (`features/{category}/{category}Schema.js`) that drives both form rendering AND read-mode display:

```js
{ name: 'fieldName', type: 'text|select|date|city-autocomplete|...', 
  label: 'Display Label', section: 'Details|Reflection', 
  visibleWhen: { field: 'status', value: 'watched' },
  // Display hints (consumed by renderFieldValue):
  renderAs: 'stars',     // existing: drives star rating display
  isLink: true,          // existing: renders as clickable link
  isCurrency: true,      // existing: formats as $X,XXX
  displayAs: 'pills',    // new: stars|link|currency|boolean|pills
}
```

Shared field factories:
- `getReflectionFields()` → 5-star rating + 3 snapshot fields (140 chars each)
- `getCompanionsField()` → contact multi-select
- Base fields: tags, dates, photos, status

**Write mode:** `ItemForm.js` consumes any schema array and renders the complete form — no per-category form logic needed.

**Read mode:** `renderFieldValue(field, value)` renders any field for display using schema metadata. Used by `EntryView` for detail modals. Supports: stars, links, currency, toggles, arrays, pills.

**Registry:** `helpers/schemaRegistry.js` exports `SCHEMA_MAP` and `CATEGORY_KEYS` — the canonical list of all categories. Adding a new category requires only one entry here.

### 4.2 Category Table

| Category | Key Integrations | Schema Extras |
|----------|-----------------|---------------|
| **Movies** | TMDB search, OMDB details | Stats page, social feed, recommendations panel |
| **Travel** | Mapbox city autocomplete, world map | Trip stats dashboard, itinerary linking |
| **Events** | Setlist.fm (concerts), unified sub-types | Sports, Broadway, Comedy, Festivals |
| **Cellar** | VinoFYI, WhiskeyFYI, Google Vision OCR, barcode | Wine + Whiskey sub-types, tasting notes |
| **Cars** | NHTSA VIN decoder (13+ fields) | Ownership tracking |
| **Homes** | — | Owned/rented visibility rules |
| **Kids** | — | Milestone types (school, sports, firsts, etc.) |
| **Activities** | Mapbox city autocomplete | Trip linking |

### 4.3 Shared Components

**Entry display pipeline (card → modal):**

| Component | Role |
|-----------|------|
| `EntryHeader` | Shared header (thumbnail, title, status badge, date, subtype). Single source of truth used in both card lists and modals. |
| `EntryView` | Unified entry renderer with `expanded` prop. Compact = card inline; Expanded = full modal content. |
| `ItemDetailContent` | Thin wrapper: compact EntryView + modal containing expanded EntryView. |
| `EntryDetailPanel` | Full-screen modal for view/edit mode. |
| `ItemCardList` | Schema-driven card grid using EntryHeader + ItemDetailContent. |

**Display primitives (single-source components):**

| Component | Role |
|-----------|------|
| `StarRating` | Display + interactive star ratings. Props: `rating`, `interactive`, `onChange`. |
| `StatusBadge` | Status badge with category-aware variant mapping. Props: `category`, `status`. |
| `Avatar` | User avatar with image URL or initials fallback. Props: `avatarUrl`, `displayName`, `size`, `color`. |
| `PeoplePills` | Renders companion arrays as ring-colored pills. |
| `SharingInfo` | Renders visibility ring display. |

**Form & input components:**

| Component | Role |
|-----------|------|
| `ItemForm` | Schema-driven form renderer (handles 17+ field types) |
| `FormPanel` | Slide-over modal wrapper for forms |
| `PeopleField` | Unified contact picker (modes: companions, recommend, visibility) |
| `PhotoUploadField` / `PhotoGrid` | Upload + display |
| `CityAutocomplete` | Mapbox-powered location picker |

**Page shell components:**

| Component | Role |
|-----------|------|
| `CategoryListHeader` | Page header with filter + add button |
| `SaveToast` | Post-save confirmation |
| `SnapCaptureModal` | Post-save prompt for reflections |
| `SidebarNav` | App-wide navigation |
| `SharedMemoriesSection` | Social collaboration card with overlay contributions |

---

## 5. Service Layer

### 5.1 dataService.js

Central CRUD abstraction over Supabase:

- `getItems(category)` / `getItemsWithShared(category)` — loads own + shared entries
- `saveItems(category, items)` — full-sync upsert + orphan deletion
- `updateSharedItem(id, item)` — read-merge-write for collaborator edits (preserves owner's snapshots/photos/rating)
- `addItem` / `updateItem` / `deleteItem` — convenience wrappers
- `deleteItemPhotos(userId, itemId)` — storage cleanup on delete
- `getAllItems()` / `getCounts()` — cross-category aggregation

Shape mapping: `itemToRow()` promotes status/start_date to columns, strips transient `_`-prefixed fields. `rowToItem()` reconstitutes from JSONB.

### 5.2 Social Services

| Service | Responsibility |
|---------|---------------|
| `contactsService` | Supabase contacts CRUD, resolveContactUserIds |
| `collaboratorService` | Share entries, accept/decline, query shared-with-me |
| `overlayService` | Create/update personal overlays on shared entries |
| `recommendationService` | Create recommendations, query for-me, accept/dismiss |
| `inviteService` | Generate invite tokens, track acceptance |
| `profileService` | Read/update user profile, avatar upload |

### 5.3 Stats Services

- `travelStats.js` — countries visited, cities, trip durations, map data
- `movieStats.js` — genre breakdown, decades, ratings distribution, watch frequency
- `eventStats.js` — attendance by type, ratings, venue frequency
- `activityStats.js` — activity groups, location frequency, ratings
- `socialMovieStats.js` / `socialEventApi.js` / `socialActivityApi.js` — social overlay aggregation per category

### 5.4 supabaseClient.js

Single `createClient()` instance using `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.

---

## 6. Hooks & Context

### 6.1 useCategory

The core hook used by all 8 category List components. Provides:

- Async load from `dataService.getItemsWithShared()` with migration + social enrichment
- `handleSubmit` — create/update with optimistic state, then share via `collaboratorService` and `recommendationService`
- `startEditing` / `deleteItem` / `batchPatch`
- `filterStatus` — status-based filtering
- `showForm` / `closeForm` / `openForm` — modal state
- `showSnapPrompt` — post-save reflection prompt for "experienced" entries
- Auto-persist on items change (debounced, own items only)
- URL param `?edit=<id>` support for deep-linking into edit mode

### 6.2 useStatsPage

Shared hook for all stats pages (Events, Activities, Movies). Encapsulates:
- Data loading (`dataService.getItemsWithShared` + `contactsService.getContacts`)
- Period filter state (year/month/all)
- Stats computation via injected `computeStatsFn`
- Social stats computation via optional `computeSocialStatsFn`
- Loading states and `hasLinkedContacts` check

Stats pages pass their category-specific compute functions and focus purely on rendering visualizations.

### 6.3 usePhotoUpload

Handles the compress → upload → get-public-URL pipeline for entry photos.

### 6.4 AppDataContext

Global state provider:
- `counts` — per-category item counts
- `contacts` — full contact list
- `notifications` — pending collaboration requests
- `profile` — current user display info
- `refreshCounts()` / `refreshContacts()` — manual invalidation

### 6.5 AuthContext

- `user` — current Supabase user
- `signIn(email, password)` / `signUp` / `signOut`
- `signInWithGoogle()` — OAuth flow
- Session persistence and auto-refresh

---

## 7. Server Proxy

Express.js server (`server/server.js`) protects third-party API keys from client exposure.

| Method | Endpoint | Upstream | Timeout |
|--------|----------|----------|---------|
| GET | `/api/setlists/search` | Setlist.fm | 10s |
| GET | `/api/wine/search` | VinoFYI | 5s |
| GET | `/api/wine/detail/:slug` | VinoFYI | 10s |
| GET | `/api/wine/winery/:slug` | VinoFYI | 10s |
| GET | `/api/whiskey/search` | WhiskeyFYI | 5s |
| GET | `/api/whiskey/detail/:slug` | WhiskeyFYI | 10s |
| GET | `/api/whiskey/distillery/:slug` | WhiskeyFYI | 10s |
| POST | `/api/wine/scan` | Google Cloud Vision | 10s |

**Security measures:**
- Dedicated endpoints (no open proxy pattern)
- Query param allowlisting (SSRF prevention)
- AbortController timeouts on all upstream requests
- CORS restricted to configured origins
- 10MB body limit (for base64 label images)
- DNS patching for VinoFYI resolution reliability

---

## 8. External APIs

### 8.1 Proxied (API key protection)

| API | Purpose | Key |
|-----|---------|-----|
| Setlist.fm | Concert/setlist search | `SETLISTFM_API_KEY` |
| VinoFYI | Wine/winery/grape search | None (public, but DNS issues) |
| WhiskeyFYI | Whiskey/distillery search | None (public, but CORS) |
| Google Cloud Vision | Wine label OCR | `GOOGLE_CLOUD_VISION_API_KEY` |

### 8.2 Client-direct (public or read-only tokens)

| API | Purpose | Auth |
|-----|---------|------|
| TMDB | Movie search + metadata | Bearer token (read-only) |
| OMDB | Movie details fallback | API key in URL |
| Mapbox Geocoding | City autocomplete | Public token |
| NHTSA VIN Decoder | Car specs from VIN | None |
| Open Food Facts | Wine barcode lookup | None |

---

## 9. Auth & Security

**Authentication:**
- Supabase Auth with email/password and Google OAuth
- Password reset flow via email
- Auto-profile creation on signup (database trigger)
- Protected routes redirect unauthenticated users to `/login`
- Public routes: `/login`, `/reset-password`, `/invite/:token`

**Authorization:**
- RLS is the authorization layer — no app-level permission checks needed
- Users see only their own items + explicitly shared entries
- Ring-based visibility controls recommendation distribution

**API Security:**
- Server proxy keeps secret keys out of the client bundle
- CORS whitelist prevents cross-origin abuse
- Dedicated endpoints prevent SSRF (no user-controlled target URLs)

---

## 10. Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend (React SPA) | Vercel | lifesnaps.org |
| Server (Express proxy) | TBD (Railway planned) | api.lifesnaps.org (planned) |
| Database + Auth + Storage | Supabase Cloud | — |

**Build:** `client/` directory, output to `build/`, configured via `client/vercel.json`.

---

## 11. Development Setup

**Prerequisites:** Node.js 18+, npm

**Environment variables:**

Client (`client/.env.local`):
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_SERVER_URL=http://localhost:5050
REACT_APP_SITE_URL=http://localhost:3000
REACT_APP_MAPBOX_TOKEN=
REACT_APP_TMDB_ACCESS_TOKEN=
REACT_APP_TMDB_API_KEY=
```

Server (`server/.env`):
```
SETLISTFM_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
CORS_ORIGIN=http://localhost:3000
PORT=5050
```

**Running locally:**
```bash
# Terminal 1: React dev server
cd client && npm start   # → http://localhost:3000

# Terminal 2: Express proxy
cd server && npm start   # → http://localhost:5050
```

---

## 12. Shared Utilities (helpers/)

| File | Exports | Purpose |
|------|---------|---------|
| `dateUtils.js` | `formatDisplayDate`, `formatDateRange`, `formatMonthYear` | All date formatting (single source) |
| `categoryMeta.js` | `getCategoryMeta`, `getEntryTitle`, `getEntrySubtitle`, `formatLocation`, `shouldShowCountry` | Category display metadata + entry title/subtitle derivation |
| `schemaRegistry.js` | `SCHEMA_MAP`, `CATEGORY_KEYS` | Canonical category list and schema imports |
| `renderFieldValue.js` | `renderFieldValue(field, value)` | Schema-driven field display (stars, links, currency, pills, boolean) |
| `ringMeta.js` | `RING_META`, `RING_LEVELS` | Ring level colors, labels, emojis |
| `statusLabels.js` | `getStatusLabel(category, status)` | Category-aware status display text |
| `operator.js` | `isFieldVisible`, `getSnapshotTeaser`, `getAllSnapshots`, `getItemPhotos` | Field visibility + data extractors |
| `socialContent.js` | `normalizeSocialContributions`, `enrichItemsWithSocialContent`, `getSocialPreview` | Social overlay normalization |
| `filterUtils.js` | `filterByStatus`, `getStatusFilterOptions` | Status-based filtering |

---

## 13. Conventions

- **File naming:** PascalCase components, camelCase services/hooks/helpers
- **CSS:** Custom properties in `index.css` (design tokens), component-scoped styles
- **Commits:** Conventional format (`feat:`, `fix:`, `refactor:`, `chore:`)
- **Branches:** `feature/<name>`, `fix/<name>`, `refactor/<name>` off `main`
- **State:** No global store — React Context for auth/app data, local state via `useCategory` hook
- **Forms:** Always schema-driven — add fields to schema, not component JSX
- **Display:** Use shared primitives (`StarRating`, `StatusBadge`, `Avatar`, `PeoplePills`) — never inline duplicate rendering
- **Dates:** Always use `dateUtils.js` — never define local format functions
- **Field rendering:** Use `renderFieldValue(field, value)` for read-mode display — add new `displayAs` types there, not in components
- **New categories:** Add schema file + entry in `categoryMeta` + entry in `schemaRegistry` — no new components needed for basic CRUD
