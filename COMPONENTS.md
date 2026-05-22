# LifeSnaps Component Library

> UI pattern inventory, schema conventions, and standardization rules.
> The anti-pattern: creating new surface areas per category.
> The goal: schema-driven categories that propagate changes everywhere.
> Last updated: 2026-05-21

---

## 1. Golden Path

The standard rendering pipeline for any category. If you're adding a new category, this is all you need:

```
Schema (*Schema.js)
  │  Flat array of field objects with type, section, order, visibleWhen
  ▼
useCategory(category, { schema })
  │  Loads items (own + shared), provides CRUD, filter state, modal state
  ▼
CategoryListHeader
  │  Title, StatsStrip, StatusToggle, Tabs, GroupedDropdownFilter, SourceFilterPills
  ▼
ItemCardList
  │  Renders cards using categoryMeta (icon, primary/secondary fields, date, status badge)
  │  Expands to ItemDetailContent on click
  ▼
FormPanel + ItemForm
  │  Offcanvas modal wrapping schema-driven form
  │  Field types dispatched automatically from schema
  ▼
SaveToast / SnapCaptureModal
     Post-save UX (confirmation + optional reflection prompt)
```

**Data flow:** Schema field → ItemForm renders input → user saves → `useCategory.handleSubmit` persists via dataService → ItemCardList displays via categoryMeta display rules.

---

## 2. Shared Component Inventory

### 2.1 Layout Layer

#### CategoryListHeader
**File:** `components/shared/CategoryListHeader.js`
**Role:** Standardized header for all category list pages. Renders the stack: title row → StatsStrip → StatusToggle → Tabs → Extra filters → GroupedDropdownFilter → SourceFilterPills.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Page heading |
| `addLabel` | string | Button text (default: "+ Add") |
| `onAdd` | function | Opens form panel |
| `extraActions` | ReactNode | Additional buttons beside Add |
| `stats` | object | Numeric stats for StatsStrip |
| `category` | string | Category key for StatusToggle |
| `statusOptions` | array | Status filter options |
| `filterStatus` | string | Active status filter |
| `onStatusChange` | function | Status filter handler |
| `tabs` | array | Tab definitions `[{ key, label, icon }]` |
| `activeTab` | string | Selected tab key |
| `onTabChange` | function | Tab switch handler |
| `tabColor` | string | Tab accent color |
| `renderExtraFilters` | function | Slot for custom filter UI (returns JSX) |
| `filterGroups` | array | Groups for GroupedDropdownFilter |
| `filterValue` | string | Active dropdown filter |
| `onFilterChange` | function | Dropdown filter handler |
| `filterColor` | string | Dropdown accent color |
| `sourceFilter` | string | Active source (mine/shared/recommended) |
| `onSourceChange` | function | Source filter handler |
| `avatarUrl` | string | User avatar for SourceFilterPills |
| `sharedCount` | number | Badge count on shared pill |
| `recommendedCount` | number | Badge count on recommended pill |

**Behavior:** Each section is optional — only renders if props are provided. All 8 categories use this component.

---

#### FormPanel
**File:** `components/shared/FormPanel.js`
**Role:** Slide-over modal wrapper for forms. Uses React Bootstrap Offcanvas.

**Props:** `show`, `onHide`, `title`, `children`

**Behavior:** 480px wide, right-aligned. Auto-scrolls to top on open. Focuses first input. Contains ItemForm as child.

---

#### EntryDetailPanel
**File:** `components/shared/EntryDetailPanel.js`
**Role:** Full-screen detail view with edit/view toggle.

**Props:** `item`, `category`, `schema`, `onClose`, `onSave`, `onDelete`, `renderItemExtras`

**Behavior:** Modal (size="xl"). Shows ItemDetailContent in view mode, switches to ItemForm in edit mode. The `renderItemExtras` prop allows categories to inject additional content (e.g., MovieDetailExtras for streaming providers, ratings).

---

#### SidebarNav
**File:** `components/shared/SidebarNav.js`
**Role:** App-wide navigation sidebar with category links and notification badges.

**Behavior:** Renders nav items from a hardcoded list. Shows badge count for pending collaborations via `AppDataContext.pendingCollaborations`. Aubergine background theme.

---

### 2.2 Form Layer

#### ItemForm
**File:** `components/shared/ItemForm.js`
**Role:** The universal form renderer. Consumes any schema array and renders a complete form with validation.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `schema` | array | Field definitions |
| `formData` | object | Current form values |
| `setFormData` | function | State setter (null = read-only mode) |
| `onSubmit` | function | Form submission handler |
| `onCancel` | function | Cancel button handler |
| `title` | string | Form title (for button text) |
| `buttonText` | string | Save button label |

**Field Type Dispatch:**

| Type | Renders | Notes |
|------|---------|-------|
| `text` (default) | `Form.Control type="text"` | Also handles `number`, `url`, `date` |
| `number` with `isCurrency` | `Form.Control` with currency formatting | Uses `formatCurrency()` helper |
| `textarea` | `Form.Control as="textarea"` | Supports `maxLength` with counter, `isSnapshot` flag for 3-row height |
| `select` | `Form.Select` | With `options` array and `optionLabels` map |
| `select` with `renderAs: "stars"` | 5-star button picker | Yellow filled/empty star buttons |
| `select` with `name: "state"` | `StateDropdown` component | US/CA state dropdown |
| `select` with `name: "country"` | `CountryDropdown` component | Full country list, sets `continent` side-effect |
| `toggle` | Bootstrap switch checkbox | Boolean field |
| `list` | `ListFieldRenderer` | Add/remove string array (setlist, lineup) |
| `contact-list` | `ContactListRenderer` → `ContactPicker` | Multi-select from contacts + freetext fallback |
| `city-autocomplete` | `CityAutocomplete` | Mapbox-powered, sets `lat`, `lng`, `country`, `state`, `continent` |
| `state-or-region` | `StateDropdown` (US/CA) or `Form.Control` (elsewhere) | Conditional based on `formData.country` |
| `linked-trip` | `LinkedTripPicker` | Search travel entries to link |
| `child-picker` | `ChildPickerField` | Pill buttons for child contacts |
| `linked-entry` | `LinkedEntryPicker` | Cross-category entry search |
| `recommend` | `RecommendSection` | Ring + individual recommendation picker |
| `visible-to` | `ShareWithSection` | Ring visibility selector |
| `photo` | `PhotoUploadField` | Upload with compression + signed URL |

**Section Rendering:** Fields are grouped by `section` property. Special sections get branded banners:
- "Snapshots" → camera icon + "Capture your Memories" banner
- "Photos" → camera icon + "3 quick Photos" banner
- "Social" → handshake icon + "Share" banner (purple/blue gradient)
- "Trip" → "Part of a Trip" subheading

**Visibility:** Fields with `visibleWhen` are hidden unless the condition matches (`isFieldVisible(field, formData)` from `helpers/operator.js`).

**Validation:** Required fields checked on submit. First error field is scrolled into view and focused.

**ShareWithCompanionsToggle injection:** After the `companions` field renders, ItemForm automatically injects `ShareWithCompanionsToggle` to offer per-companion sharing.

---

#### PhotoUploadField
**File:** `components/shared/PhotoUploadField.js`
**Role:** Photo upload with client-side compression → Supabase Storage → public URL.

**Behavior:** Accepts image file, compresses via `browser-image-compression` (max 800px, 0.6 quality), uploads to `photos/{userId}/{itemId}/{fieldName}`, stores public URL in form data. Shows thumbnail preview after upload.

---

#### CityAutocomplete
**File:** `components/shared/CityAutocomplete.js`
**Role:** Mapbox Geocoding-powered city search with debounced suggestions.

**Side effects:** On selection, populates `city`, `lat`, `lng`, `country`, `state`, `continent` in form data.

---

#### ContactPicker
**File:** `components/shared/ContactPicker.js`
**Role:** Multi-select from user's contact list + freetext entry for ad-hoc names.

**Behavior:** Reads contacts from `AppDataContext`. Supports legacy string companions (normalized to `{ type: "freetext", name }` objects). Contact entries are `{ type: "contact", contactId, displayName }`.

---

#### LinkedTripPicker
**File:** `components/shared/LinkedTripPicker.js`
**Role:** Cross-category link to a travel entry. Searches user's trips by date/city proximity.

---

#### LabelScanButton
**File:** `components/shared/LabelScanButton.js`
**Role:** Barcode scanner (camera) → Open Food Facts lookup → field population. Used by Cellar category only.

---

#### WineSearch / WhiskeySearch
**Files:** `components/shared/WineSearch.js`, `components/shared/WhiskeySearch.js`
**Role:** API search components that query VinoFYI/WhiskeyFYI and populate form fields from selection.

---

### 2.3 Card Layer

#### ItemCardList
**File:** `components/shared/ItemCardList.js`
**Role:** Universal card list renderer. Displays items as expandable cards using `categoryMeta` for display rules.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `category` | string | Category key (drives categoryMeta lookup) |
| `items` | array | Filtered items to display |
| `schema` | array | Schema for detail expansion |
| `onEdit` | function | Edit button handler |
| `onDelete` | function | Delete button handler |
| `onViewDetail` | function | Opens EntryDetailPanel |
| `renderItemExtras` | function | Inject custom content per card (expanded view) |
| `renderCompactExtra` | function | Inject custom content per card (compact view) |

**Card rendering logic:**
1. Gets `meta = getCategoryMeta(category)`
2. Primary label: `meta.getPrimaryDisplay(item)` if defined, else `item[meta.primaryField]`
3. Secondary label: `meta.getSecondaryDisplay(item)` if defined, else join `meta.secondaryFields`
4. Date: `item[meta.dateField]` formatted as "Mon DD, YYYY"
5. Status badge: colored via `getStatusBadgeVariant(status)` mapping
6. Thumbnail: first of `photo1` → `posterUrl` → `photoLink` → category icon
7. Snapshot teaser: first non-empty snapshot via `getAllSnapshots(item)`
8. Social preview: via `getSocialPreview(item)` from socialContent.js
9. Privacy indicator: `PrivacyIndicator` component

**Expansion:** Click card → toggles expanded view showing `ItemDetailContent` with full field listing + `renderItemExtras` slot.

---

#### ItemDetailContent
**File:** `components/shared/ItemDetailContent.js`
**Role:** Renders all schema fields for an item in read-only mode. Groups by section, skips header fields (already shown in card compact view).

---

#### PrivacyIndicator
**File:** `components/shared/PrivacyIndicator.js`
**Role:** Shows lock (private) or people (shared) icon based on item's sharing state.

**Logic:** Shows "shared" if any of: `visibilityRings`, `companions`, `_isShared`, `_sharedBy`, or recommendations exist.

---

#### StatsStrip
**File:** `components/shared/StatsStrip.js`
**Role:** Horizontal row of numeric stats (e.g., "12 Watched · 5 Watchlist · 4.2 Avg Rating").

---

#### StatusToggle
**File:** `components/shared/StatusToggle.js`
**Role:** Pill-button filter for status values. Reads options from `statusLabels[category]`.

---

### 2.4 Social Layer

#### ShareWithSection
**File:** `components/shared/ShareWithSection.js`
**Role:** Ring visibility selector — controls which rings can browse this entry.

**Behavior:** Renders ring checkboxes (1-4). Updates `formData.visibilityRings` array.

---

#### ShareWithCompanionsToggle
**File:** `components/shared/ShareWithCompanionsToggle.js`
**Role:** Per-companion share toggle. After companions are selected, shows toggle switches to opt each into active collaboration.

**Behavior:** For each companion with `type: "contact"`, renders an on/off toggle. Toggled companions are added to `formData.shareWithCompanionIds`. On save, `useCategory` uses this to create collaborator rows.

---

#### RecommendSection
**File:** `components/shared/RecommendSection.js`
**Role:** Ring + individual contact picker for recommendations.

**Behavior:** User selects rings (`recommendedToRings`) and/or specific contacts (`recommendedToContacts`). On save, `useCategory` calls `recommendationService.createRecommendations()`.

---

#### OverlayForm
**File:** `components/shared/OverlayForm.js`
**Role:** Form for adding personal overlay on a shared entry (snapshots, rating, notes).

---

#### SourceFilterPills
**File:** `components/shared/SourceFilterPills.js`
**Role:** "Mine / Shared / Recommended" filter pills. Shows badge counts for shared and recommended items.

---

### 2.5 Utility

#### SaveToast
**File:** `components/shared/SaveToast.js`
**Role:** Bootstrap toast notification confirming a successful save.

---

#### SnapCaptureModal
**File:** `components/shared/SnapCaptureModal.js`
**Role:** Post-save modal prompting user to add reflections. Triggered when an "experienced" entry (attended, visited, etc.) has no snapshots yet.

---

#### GroupedDropdownFilter
**File:** `components/shared/GroupedDropdownFilter.js`
**Role:** Multi-group dropdown filter. Supports grouped options (e.g., RATING_GROUP with 1-5 stars, custom category groups like genre, varietal).

---

## 3. Schema Conventions

### Field Object Shape

```javascript
{
  name: "fieldName",           // Required: maps to formData key
  label: "Display Label",      // Required: form label text
  type: "text",                // Required: drives ItemForm dispatch (see §2.2)
  section: "Details",          // Groups into form sections (Main, Details, When, Where, Snapshots, Photos, Social, Trip, Hidden)
  order: 20,                   // Sort order within section
  visibleWhen: { status: "visited" },  // Conditional visibility
  optional: true,              // Skips required validation
  required: true,              // Shows * and validates non-empty
  placeholder: "...",          // Input placeholder
  maxLength: 140,              // Character limit (shows counter for textarea)
  fullWidth: true,             // Renders in Col md=12 instead of md=6
  col: 4,                      // Custom column width
  options: ["a", "b"],         // For select type
  optionLabels: { a: "Alpha" }, // Display labels for select options
  renderAs: "stars",           // Modifier for select → star picker
  isCurrency: true,            // Modifier for number → currency format
  isSnapshot: true,            // Modifier for textarea → 3-row height
  isLink: true,                // Read-only mode renders as <a> tag
  hidden: true,                // Never rendered (internal metadata)
  defaultValue: "wishlist",    // Pre-populated on form open
}
```

### Shared Helpers

| Helper | File | Returns |
|--------|------|---------|
| `getReflectionFields(status)` | `helpers/reflection.schema.js` | Rating (stars) + 3 snapshots (140 char) + 3 photos |
| `getCompanionsField()` | `helpers/reflection.schema.js` | "Who was there?" contact-list field |
| `getPhotoFields(status)` | `helpers/reflection.schema.js` | 3 photo upload fields |
| `getStatusValues(category)` | `helpers/statusLabels.js` | Array of valid status keys |

### visibleWhen Patterns

```javascript
// Single status
visibleWhen: { status: "visited" }

// Multiple statuses (any match shows field)
visibleWhen: { status: ["tried", "cellar"] }

// Sub-type condition
visibleWhen: { eventType: "concert" }
visibleWhen: { subType: "wine" }

// Combined (all must match)
visibleWhen: { status: "tried", subType: "whiskey" }
```

### Section Naming Convention

| Section | Order Range | Content |
|---------|-------------|---------|
| Main | 1-9 | Status, primary identifier (title, artist, name) |
| Details | 10-19 | Category-specific metadata |
| When | 20-24 | Date fields |
| Where | 25-29 | Location fields |
| Snapshots | 30-33 | Rating + 3 snapshot textareas |
| Photos | 34-36 | 3 photo upload slots |
| Trip | 50-59 | Trip linking (Events, Activities, Cellar) |
| Social | 60-69 | Companions, visibility, recommendations |
| Hidden | 99 | Internal metadata (never rendered) |

---

## 4. Category Compliance Matrix

| Category | useCategory | CategoryListHeader | ItemCardList | FormPanel+ItemForm | EntryDetailPanel | Extra Components | Tier |
|----------|:-----------:|:------------------:|:------------:|:-----------------:|:----------------:|-----------------|------|
| **Cars** | ✓ | ✓ | ✓ | ✓ | ✓ | 0 | Standard |
| **Homes** | ✓ | ✓ | ✓ | ✓ | ✓ | 0 | Standard |
| **Activities** | ✓ | ✓ | ✓ | ✓ | ✓ | 0 | Standard |
| **Kids** | ✓ | ✓ (renderExtraFilters) | ✓ (renderCompactExtra) | ✓ | ✓ | 3 filter components | Extended |
| **Events** | ✓ | ✓ | ✓ | ✓ | ✓ | EventForm (Setlist.fm search) | Extended |
| **Cellar** | ✓ | ✓ (tabs) | ✓ (renderCompactExtra) | ✓ | ✓ | CellarForm (wine/whiskey search + scan) | Extended |
| **Travel** | ✓ | ✓ (tabs) | ✓ (multiple calls) | ✓ | ✓ | WorldMapView, ItineraryHeader, LinkedActivityRow, TripDetailPeek | Specialized |
| **Movies** | ✓ | ✓ (extra filters) | ✓ | ✓ | ✓ (renderItemExtras) | 9 components (TMDB, social, stats) | Specialized |

### Deviation Justification

| Deviation | Category | Justified? | Reason |
|-----------|----------|:----------:|--------|
| TMDB search with poster cards | Movies | ✓ | External API with fundamentally different result rendering |
| World map visualization | Travel | ✓ | Geospatial library (react-simple-maps), cannot be schema-driven |
| Itinerary grouping (trip→stops) | Travel | ✓ | Multi-level aggregation not expressible in flat schema |
| Setlist.fm search UI | Events | ✓ | Concert-specific artist/year/state search |
| Wine/Whiskey label scanning | Cellar | ✓ | Camera → OCR → field population (hardware integration) |
| Movie stats page | Movies | ✓ | Category-specific analytics (genre/decade breakdown) |
| VIN lookup button | Cars | ⚠️ | Could be a generic "lookup" field type |
| Sub-type tab switching | Cellar, Events | ⚠️ | Pattern is identical — could be shared abstraction |
| Hardcoded genre/decade filters | Movies | ⚠️ | Filter logic lives outside schema |
| renderCompactExtra per category | Kids, Cellar | ⚠️ | Could be schema-driven card metadata |
| Milestone/child filter components | Kids | ⚠️ | Could be schema-driven filter definitions |

---

## 5. categoryMeta.js — Card Display System

**File:** `helpers/categoryMeta.js`

Drives how `ItemCardList` renders each item's card. Each category entry defines:

```javascript
{
  icon: "🎬",                    // Category emoji
  color: "var(--color-movies)",  // CSS variable for accent
  primaryField: "title",         // Field name for card title
  secondaryFields: ["year"],     // Field names joined for subtitle
  dateField: "startDate",       // Field name for date badge
  getPrimaryDisplay: (item) => ...,    // Override for complex primary (sub-types)
  getSecondaryDisplay: (item) => ...,  // Override for complex secondary
}
```

**Status badge coloring** (in `ItemCardList.getStatusBadgeVariant`):
| Status | Variant | Color |
|--------|---------|-------|
| attended, visited, owned, watched, done, tried, happened | `success` | Green |
| wishlist, watchlist, upcoming | `warning` | Yellow |
| rented, cellar | `info` | Blue |
| other | `secondary` | Gray |

**Gap:** `categoryMeta` is a separate file from schema. When sub-types are added (new event type, new whiskey variant), both `categoryMeta` AND the schema must be updated. This is a maintenance risk.

---

## 6. statusLabels.js — Status Registry

**File:** `helpers/statusLabels.js`

| Category | Statuses | "Experienced" | "Aspirational" |
|----------|----------|:-------------:|:--------------:|
| Movies | watched, watchlist | watched | watchlist |
| Travel | visited, wishlist | visited | wishlist |
| Events | attended, wishlist | attended | wishlist |
| Activities | done, wishlist | done | wishlist |
| Cellar | tried, cellar, wishlist | tried | cellar, wishlist |
| Cars | owned, wishlist | owned | wishlist |
| Homes | owned, rented, wishlist | owned, rented | wishlist |
| Kids | happened, upcoming | happened | upcoming |

**Inconsistency:** 8 different "experienced" status names (watched, visited, attended, done, tried, happened, owned, rented). Generic code that needs to detect "has this been experienced?" must check all variants. `getReflectionFields()` requires the caller to pass the correct status string.

---

## 7. Deviation Rules

### When Custom Components ARE Acceptable

1. **External API search UI** — When results require fundamentally different rendering (posters, setlists, wine labels)
2. **Geospatial visualization** — Maps, globes, location-based views
3. **Category-specific stats** — Unique analytics (genre breakdown, route maps)
4. **Multi-level data relationships** — Itineraries (trip → stops), hierarchies not in schema model
5. **Hardware integration** — Camera scanning, barcode reading

### When Custom Components Are NOT Acceptable

1. **Card rendering** — Use `ItemCardList` + `categoryMeta`. Never create a custom card component.
2. **Form field rendering** — Extend `ItemForm`'s type dispatch. Never create per-category form logic.
3. **Detail views** — Use `EntryDetailPanel` + `renderItemExtras` slot. Never create a standalone detail page.
4. **Filter logic** — Use `CategoryListHeader` props (`filterGroups`, `tabs`, `renderExtraFilters`). Never hardcode filters in List components.
5. **CRUD operations** — Use `useCategory`. Never write custom save/delete logic.

### Decision Tree

```
Need new UI behavior?
  │
  ├── Is it about how a FIELD is entered?
  │   → Add a new field type to ItemForm's switch statement
  │
  ├── Is it about how items are DISPLAYED on cards?
  │   → Add/modify categoryMeta entry
  │
  ├── Is it about how items are FILTERED?
  │   → Add filterGroups to CategoryListHeader props
  │
  ├── Is it about ENRICHMENT from an external API?
  │   → Create a feature-specific component, use renderItemExtras slot
  │
  └── Is it a fundamentally different VIEW of the data?
      → Only then: create a custom component (map, stats page, search panel)
```

---

## 8. Standardization Opportunities

### 8.1 Schema-Driven Card Display (HIGH IMPACT)

**Problem:** `categoryMeta.js` hardcodes display rules that duplicate what schemas already know. Adding a sub-type requires updating both schema and categoryMeta separately.

**Sketch:** Add `cardDisplay` to schema exports:
```javascript
export const cardDisplay = {
  primary: "title",
  secondary: ["year"],
  // For sub-types:
  primaryBySubType: { concert: "artist", sports: "teams", broadway: "showName" }
};
```
`categoryMeta.js` reads from schema's `cardDisplay` instead of hardcoding. Eliminates the dual-maintenance problem.

---

### 8.2 Schema-Driven Filters (HIGH IMPACT)

**Problem:** Filter options (genre, decade, varietal, milestone type) are hardcoded in each List component. Adding a filterable field to a schema doesn't automatically add it to the filter UI.

**Sketch:** Add `filters` to schema exports:
```javascript
export const filters = [
  { field: "genre", label: "Genre", options: ["Action", "Comedy", ...] },
  { field: "decade", label: "Decade", deriveFrom: "year", transform: "decade" }
];
```
`CategoryListHeader` reads `filterGroups` from schema. List components pass schema filters through without custom logic.

---

### 8.3 Generic Lookup Field Type (MEDIUM IMPACT)

**Problem:** VIN lookup in CarForm is bespoke. Same pattern needed for ISBN (books), barcode (products), DOI (papers).

**Sketch:** New schema field type `lookup`:
```javascript
{ name: "vin", type: "lookup", label: "VIN",
  lookup: { endpoint: "/api/vin/:value", mapResponse: (data) => ({ make: data.Make, model: data.Model, year: data.Year }) } }
```
ItemForm renders input + "Lookup" button, calls endpoint, spreads mapped response into formData.

---

### 8.4 Sub-Type Tab Pattern (MEDIUM IMPACT)

**Problem:** Cellar (Wine/Whiskey) and Events (Concert/Sports/Broadway/etc.) both implement sub-type branching independently in their List and Form components.

**Sketch:** Schema exports `subTypes` array:
```javascript
export const subTypes = [
  { key: "wine", label: "Wine", icon: "🍷" },
  { key: "whiskey", label: "Whiskey", icon: "🥃" }
];
```
A shared `SubTypeTabs` component renders tabs. Both `CategoryListHeader` (via `tabs` prop) and Form (via type selector step) read from this same definition. Eliminates per-category tab logic.

---

### 8.5 Consistent Status Convention (LOW IMPACT, HIGH CLARITY)

**Problem:** 8 different "experienced" status names make generic code harder. Each category's getReflectionFields call must know its specific status string.

**Sketch:** Add `isExperienced` flag to statusLabels:
```javascript
movies: {
  watched: { label: "Watched", isExperienced: true },
  watchlist: { label: "Watchlist", isExperienced: false }
}
```
Generic code checks `statusLabels[category][status].isExperienced` instead of maintaining a hardcoded set of status strings.

---

## 9. Adding a New Category (Checklist)

### Files to Create

- [ ] `client/src/features/{name}/{name}Schema.js` — Field definitions array using helpers
- [ ] `client/src/features/{name}/{Name}List.js` — Thin wrapper: `useCategory` + `CategoryListHeader` + `ItemCardList` + `FormPanel`
- [ ] `client/src/features/{name}/{Name}Form.js` — Thin wrapper passing schema to `ItemForm`

### Files to Update

- [ ] `client/src/helpers/categoryMeta.js` — Add `{ icon, color, primaryField, secondaryFields, dateField }`
- [ ] `client/src/helpers/statusLabels.js` — Add status options (at minimum: one "experienced" + "wishlist")
- [ ] `client/src/services/dataService.js` — Add category key to `SUPABASE_CATEGORIES` set
- [ ] `client/src/App.js` — Add `<Route path="/{name}" element={<{Name}List />} />`
- [ ] `client/src/components/shared/SidebarNav.js` — Add nav item
- [ ] `client/src/contexts/AppDataContext.js` — Add to category keys array in `getCounts()`
- [ ] `client/src/index.css` — Add `--color-{name}` CSS variable

### Schema Template

```javascript
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";
import { getStatusValues } from "../../helpers/statusLabels";

const schema = [
  { name: "status", label: "Status", type: "select", options: getStatusValues("{name}"), section: "Main", order: 1, required: true },
  { name: "title", label: "Title", type: "text", section: "Main", order: 2, required: true },
  // ... category-specific fields (section: "Details", order: 10-19)
  { name: "startDate", label: "Date", type: "date", section: "When", order: 20 },
  // Location fields if applicable (section: "Where", order: 25-29)
  ...getReflectionFields("{experienced_status}"),
  getCompanionsField(),
  { name: "visibilityControl", type: "visible-to", section: "Social", order: 61 },
  { name: "recommendation", type: "recommend", section: "Social", order: 62 },
];

export default schema;
```

### DO NOT

- Create custom card components (use `ItemCardList` + `categoryMeta`)
- Create custom detail views (use `EntryDetailPanel` + `renderItemExtras`)
- Create custom form field types (extend ItemForm's switch statement instead)
- Hardcode filters in the List component (use `CategoryListHeader` `filterGroups` prop)
- Duplicate `useCategory` logic (if you need different CRUD, extend the hook)
- Add status badge color mappings outside `ItemCardList.getStatusBadgeVariant()`
