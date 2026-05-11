# LifeSnaps Architecture

> Living reference document for the LifeSnaps tech stack, services, and data architecture.

---

## Tech Stack

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
| Backend | Node.js (ESM) + Express | 4.18.x |
| HTTP Client (server) | node-fetch | 3.x |
| Database | Supabase PostgreSQL | -- |
| Auth | Supabase Auth | -- |
| File Storage | Supabase Storage | -- |
| Client SDK | @supabase/supabase-js | 2.105.3 |

---

## External APIs and Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Supabase** | Auth, PostgreSQL DB, file storage | Client SDK (`@supabase/supabase-js`) |
| **Mapbox Geocoding** | City autocomplete for Travel and Activities | Client-side fetch via `CityAutocomplete.js` |
| **Setlist.fm** | Concert and setlist search by artist/year | Server proxy (`GET /api/setlists/search`) |
| **Google Cloud Vision** | Wine label OCR (TEXT_DETECTION) | Server proxy (`POST /api/wine/scan`) |
| **VinoFYI** | Wine, winery, grape, and region search | Server proxy (`GET /api/wine/*`) |
| **Open Food Facts** | Barcode/UPC wine bottle lookup | Direct client fetch to `world.openfoodfacts.org` |
| **NHTSA VIN Decoder** | Decode VIN to car make, model, year, trim, engine | Direct client fetch to `vpic.nhtsa.dot.gov` |
| **Google OAuth** | "Sign in with Google" | Via Supabase Auth provider |

---

## Server Endpoints

The Express server (`server/server.js`) acts as an API proxy to protect third-party API keys from client exposure.

| Method | Endpoint | Upstream Service | Purpose |
|--------|----------|-----------------|---------|
| GET | `/api/setlists/search` | Setlist.fm | Search concerts by artist, year, country, state |
| GET | `/api/wine/search` | VinoFYI | Search wines by name/keyword |
| GET | `/api/wine/detail/:slug` | VinoFYI | Get full wine details |
| GET | `/api/wine/winery/:slug` | VinoFYI | Get winery details |
| POST | `/api/wine/scan` | Google Cloud Vision | OCR on wine label image (base64) |

---

## Hosting and Deployment

| Component | Platform | Configuration |
|-----------|----------|---------------|
| Client (React SPA) | Vercel | `client/vercel.json` -- build from `client/`, output `build/` |
| Server (Express proxy) | TBD | Port 5050 in dev; production deployment pending |
| Domain | lifesnaps.org | DNS configured for Vercel |

---

## Data Architecture

### Supabase PostgreSQL

Primary table: `items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner (FK to `auth.users`) |
| `category` | text | Snap category (events, travel, cars, homes, activities, wines) |
| `data` | jsonb | All category-specific fields stored as JSON |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### Supabase Storage

- **Bucket:** `photos` (private)
- **Access:** Row Level Security (RLS) -- users can only access their own photos
- **URLs:** Signed URLs with 1-year expiry for display

### Local Storage (Phase 7 migration pending)

- `contacts` -- user's contact list for sharing rings
- `entryTags` -- who is tagged on which entries
- `personalOverlays` -- per-user snapshots/ratings on shared entries

---

## Environment Variables

### Client (`client/.env.local`)

```
REACT_APP_SUPABASE_URL=<supabase project URL>
REACT_APP_SUPABASE_ANON_KEY=<supabase anon/public key>
REACT_APP_SERVER_URL=<express server URL, e.g. http://localhost:5050>
REACT_APP_SITE_URL=<app URL, e.g. http://localhost:3000>
REACT_APP_MAPBOX_TOKEN=<mapbox geocoding token>
```

### Server (`server/.env`)

```
SETLISTFM_API_KEY=<setlist.fm API key>
GOOGLE_CLOUD_VISION_API_KEY=<GCP Vision API key>
CORS_ORIGIN=<allowed origin, e.g. http://localhost:3000>
```

### Root (`.env.local`) -- legacy/shared

```
REACT_APP_SETLISTFM_API_KEY=<setlist.fm key (legacy)>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
```

---

## Snap Categories

| Category | Key Features |
|----------|-------------|
| **Events** | Unified category with sub-types: Sports, Broadway, Comedy, Festivals (evolved from Concerts) |
| **Concerts** | Setlist.fm integration, setlist display, artist/venue/tour |
| **Travel** | World map visualization, city autocomplete, trip stats dashboard |
| **Cars** | VIN decoder auto-populate (13 fields from NHTSA), ownership tracking |
| **Homes** | Owned/rented with different field visibility, location with full address |
| **Activities** | General experiences with city autocomplete |
| **Wines** | Label scanning (barcode + OCR), VinoFYI search, tasting notes |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React SPA)                     │
│  React 19 + React Router 7 + React Bootstrap             │
│  Hosted on Vercel @ lifesnaps.org                        │
├─────────────────────────────────────────────────────────┤
│  Schema-driven forms (ItemForm.js)                       │
│  Schema-driven cards (ItemCardList.js)                   │
│  useCategory hook (CRUD + UI state)                      │
│  dataService.js (Supabase client abstraction)            │
└───────────┬──────────────────────┬──────────────────────┘
            │                      │
            ▼                      ▼
┌───────────────────┐   ┌──────────────────────────────┐
│  Supabase Cloud   │   │  Express Proxy (port 5050)   │
│  - Auth           │   │  - /api/setlists/search      │
│  - PostgreSQL     │   │  - /api/wine/search          │
│  - Storage        │   │  - /api/wine/detail/:slug    │
└───────────────────┘   │  - /api/wine/winery/:slug    │
                        │  - /api/wine/scan (Vision)   │
                        └──────────┬───────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌──────────┐  ┌──────────┐  ┌─────────────┐
             │Setlist.fm│  │  VinoFYI │  │Google Vision│
             └──────────┘  └──────────┘  └─────────────┘

Direct client-side APIs (no proxy needed):
  - Mapbox Geocoding (public token)
  - NHTSA VIN Decoder (public, no key)
  - Open Food Facts (public, no key)
```

---

## Related Documents

- **Engineering Roadmap:** `.cursor/plans/lifelog_incremental_roadmap_cc32d162.plan.md`
- **Feature Roadmap:** `.cursor/plans/lifelog_feature_roadmap_11c9083a.plan.md`
- **Wine Sub-plan:** `.cursor/plans/wine_snap_category_c5699bbc.plan.md`
