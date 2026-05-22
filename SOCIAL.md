# LifeSnaps Social System

> Behavioral reference for social sharing. Defines rules, flows, edge cases, and MVP decisions.
> For data model and RLS policies, see [ARCHITECTURE.md](./ARCHITECTURE.md) §3.
> Last updated: 2026-05-21

---

## 1. Social Model

LifeSnaps uses a **two-layer social model**:

```
┌─────────────────────────────────────────────┐
│  Base Item (items.data JSONB)               │
│  Shared editable facts:                     │
│  title, dates, location, venue, type,       │
│  category-specific fields, status           │
│  Owner's snaps, photos, rating              │
├─────────────────────────────────────────────┤
│  Overlays (overlays table, per-user)        │
│  Personal additive perspective:             │
│  snapshot1-3, why_notes, rating, photos[]   │
│  Each collaborator has exactly ONE overlay  │
└─────────────────────────────────────────────┘
```

**Principle:** The base item holds collaborative structural data. The overlay holds personal perspective. All display surfaces consume normalized contributions via `socialContent.js`.

### Ring System

| Level | Label | Use Case |
|-------|-------|----------|
| 1 | Partner in Crime | Most intimate sharing (spouse/partner) |
| 2 | Immediate Family | Children, parents, people you live with |
| 3 | Extended Family | Parents, siblings, in-laws |
| 4 | Friends | Close friends, social sharing |

Rings serve two purposes:
- **Passive visibility** — control who can browse entries on your profile
- **Sharing shortcut** — select a ring to resolve to its current members

---

## 2. Social Rules

These behavioral ground truths must not be violated without deliberate product decision:

1. A contact exists in exactly **one ring** at a time.
2. Ring changes are **never retroactive** — existing shares and recommendations persist regardless of ring reassignment.
3. Every collaborator gets exactly **one overlay per entry** (DB unique constraint on `entry_id + user_id`).
4. `can_edit` defaults to **true** for all collaborator rows — there is no per-collaborator permission UI yet.
5. **Deferred sharing:** if a contact has no linked account, the collaborator row stores only `collaborator_contact_id`. Resolution happens automatically on signup via DB trigger.
6. "Leave Share" reuses the **`declined` status** — there is no distinct "left" state.
7. Edits to shared entries are **last-write-wins** — no conflict detection or notification.
8. Changes to shared entries require **page reload** to appear (no real-time sync).
9. The **owner sees all overlays** on their entries; collaborators see all overlays on entries they've accepted.
10. A recommendation targets a **ring OR a user**, never both in the same row.
11. Accepting a recommendation creates a **new entry** in the recipient's account (with `recommendedBy` provenance) — it does NOT create a collaboration. **⚠️ UNDER REVIEW** (see §8.3).
12. A shared entry appears in the collaborator's category list **only after acceptance**.

---

## 3. Sharing Flow (Collaboration)

```
User creates/edits entry
    │
    ├── Adds companions (contact-list field — "who was there")
    │
    ├── Toggles "Share & Collaborate" per companion
    │   (ShareWithCompanionsToggle component)
    │
    └── Saves entry
         │
         ├── useCategory.handleSubmit strips shareWithCompanionIds
         ├── Calls collaboratorService.shareEntryWithContacts()
         │   Creates collaborators rows:
         │   - linked contacts → collaborator_user_id set immediately
         │   - unlinked contacts → collaborator_contact_id only (deferred)
         │
         └── Recipient sees:
              ├── Badge count on "Shared Experiences" nav item
              ├── Pending entry in SharedFeed page
              │
              ├── ACCEPT → entry appears in their category list + timeline
              │   - Can add overlay (snaps, photos, rating, notes)
              │   - Can edit structural fields via SharedEditPanel
              │     (currently limited to city/dates/venue — not full schema)
              │   - Cannot delete the entry
              │
              └── DECLINE → hidden from their feed
```

**Note:** Companions and sharing are separate concepts. Adding someone as a companion records "they were there." Toggling share gives them active collaboration access. This distinction is a known UX pain point (see §8.1).

---

## 4. Recommendations Flow

```
User views an experienced entry (attended, visited, watched, etc.)
    │
    ├── Opens RecommendSection in form
    ├── Selects rings and/or individual contacts
    ├── Saves entry
    │
    └── useCategory.handleSubmit calls recommendationService.createRecommendations()
         │
         ├── Creates rows with to_user_id (direct) and/or to_ring_level (ring-based)
         │
         └── Recipient sees:
              ├── Recommendation on /recommendations page
              ├── Card shows: recommender name, entry title, their snapshot, rating
              │
              ├── "Add to Wishlist" → creates NEW entry in recipient's account
              │   with recommendedBy provenance + pre-filled fields
              │
              └── "Dismiss" → marks recommendation as dismissed
```

**Open question:** The "new entry" model gives recipients full autonomy but feels disconnected from the recommender's experience. Alternative: create a collaboration link instead. Decision deferred — needs user testing (see §8.3).

---

## 5. Invite & Contact Linking Flow

```
User adds contact (email) in My People
    │
    ├── IF email matches existing auth.users → auto-linked immediately
    │   (via link_contact_if_user_exists trigger on contacts INSERT)
    │
    └── IF no match → contact stays as "local_only"
         │
         ├── User clicks "Send Invite" → creates invites row + copies URL
         ├── User texts/emails the link manually
         │
         └── Invitee opens /invite/:token (public, no auth required)
              │
              ├── Sees: inviter name, shared memory count, personal message
              ├── Clicks "Join LifeSnaps" → goes to signup
              │
              └── On signup, DB triggers fire:
                   ├── invites.status → 'accepted'
                   ├── contacts.linked_user_id → new user's ID
                   └── collaborators.collaborator_user_id → resolved
                       (all deferred sharing rows activated)
```

---

## 6. Contribution Model (socialContent.js)

All display surfaces consume contributions through this normalized helper:

```javascript
// Enrichment (called once per category load in useCategory):
enrichItemsWithSocialContent(items, contacts) → items with:
  ._socialContributions      // array of contribution objects
  ._myOverlayContribution    // current user's overlay (if any)
  ._shareeContributionCount  // how many collaborators contributed

// Display helpers:
getSocialPreview(item)       // first available text for card teaser
getAllSocialSnaps(item)      // flat array of all snaps across contributors
getAllSocialPhotos(item)     // flat array of all photos across contributors
```

**Contribution shape:**
```javascript
{
  entryId, userId, displayName,
  isOwner: boolean,    // true = entry creator
  isMine: boolean,     // true = current viewer
  snaps: string[],     // 0-3 items (140 chars each)
  whyNotes: string,
  photos: string[],    // URLs
  rating: number|null,
  updatedAt: string
}
```

---

## 7. Services & Component Index

### Services

| Service | Responsibility | Key Methods |
|---------|---------------|-------------|
| `collaboratorService` | Sharing entries, accepting/declining | `shareEntryWithContacts()`, `getIncomingCollaborations()`, `acceptCollaboration()` |
| `overlayService` | Personal reflections on shared entries | `saveOverlay()`, `getOverlaysForEntry()`, `getMyOverlay()` |
| `recommendationService` | Recommendations to rings/individuals | `createRecommendations()`, `getMyRecommendations()`, `acceptRecommendation()` |
| `contactsService` | Contact CRUD, ring resolution | `getContacts()`, `resolveRingMembers()`, `resolveContactUserIds()` |
| `inviteService` | Invite generation and lookup | `createInvite()`, `getInviteByToken()` |
| `profileService` | User profile management | `getMyProfile()`, `updateProfile()`, `uploadAvatar()` |

### Components

| Component | Role |
|-----------|------|
| `ShareWithSection` | Ring visibility selector (passive browse control) |
| `ShareWithCompanionsToggle` | Per-companion share toggle (active collaboration) |
| `OverlayForm` | Form for adding personal overlay (snaps, rating, notes) |
| `RecommendSection` | Ring + individual picker for recommendations |
| `PrivacyIndicator` | Lock/people icon showing shared state on cards |

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| SharedFeed | `/shared` | Collaboration inbox: pending/accepted/declined entries |
| Recommendations | `/recommendations` | Incoming recommendations from contacts |
| MyPeople | `/people` | Contact management by ring |
| ContactProfile | `/people/:contactId` | Linked contact's shared stats |
| InviteWelcome | `/invite/:token` | Public invite landing (pre-auth) |

---

## 8. UX Pain Points & Open Questions

### 8.1 Sharing Toggle Confusion

**Problem:** The distinction between "tag as companion" (who was there) and "Share & Collaborate" (give them active access) is unclear to users. The `ShareWithCompanionsToggle` appears after companions are selected, creating a two-step mental model that may not be intuitive.

**Current behavior:** Companions field records who experienced the entry together. The toggle then opts each companion into active collaboration (creates collaborator row).

**Open question:** Should all companions auto-share? Or should sharing be a completely separate action decoupled from the companions field? Options:
- (a) Auto-share all companions (simplest UX, but removes granular control)
- (b) Keep separate but improve labeling/placement
- (c) Split into two distinct UI sections with clearer intent

### 8.2 Ring Labels & Flexibility

**Problem:** The fixed labels "Partner in Crime / Immediate Family / Extended Family / Friends" feel rigid. Not all users structure their relationships this way — some may want "Work Friends" or "Travel Buddies."

**Current behavior:** Ring labels are hardcoded in `ringMeta.js`. Contacts can only be in one ring.

**For MVP:** Ship with current labels. Consider custom ring names post-launch. The 4-level hierarchy (most intimate → broadest) is sound even if labels change.

### 8.3 Recommendation Disconnection

**Problem:** Accepting a recommendation creates an entirely independent entry in the recipient's account. There's no ongoing link to the recommender's experience — their snapshots, rating, and photos don't carry over.

**Options:**
- (a) **Keep as-is** — recipient gets full autonomy over their entry. Clean data model.
- (b) **Create collaboration instead** — recipient sees the recommender's actual entry and adds an overlay. More social but less autonomy.
- (c) **Hybrid "inspired by" link** — new entry with a `recommendedBy` reference that enables viewing the recommender's version. Best of both but more complex.

**Decision:** DEFERRED. Needs real user testing to determine which model creates more engagement.

---

## 9. MVP Decisions

### 9.1 Ship As-Is (acceptable for 10-20 users)

| Decision | Rationale |
|----------|-----------|
| SharedEditPanel is generic (city/dates/venue only) | Collaborators primarily contribute overlays, not structural edits. Owners can fix category-specific fields. |
| No conflict handling (last-write-wins) | Concurrent edits unlikely at this scale. Data is correctable if it happens. |
| "Leave Share" reuses declined status | No user-visible consequence at MVP. Can split later if needed. |
| No real-time sync (reload required) | Acceptable. Users learn the pattern. Push is premature. |
| N+1 query in SharedFeed | Performance fine with <100 shared entries. Optimize later. |
| `can_edit` hardcoded true | Slightly risky with 10-20 users, but all are known contacts. Manageable. |
| No activity feed | Not enough activity at this scale to justify the feature. |
| Deferred sharing UI is silent | Users who share already know the contact isn't on the platform. |

### 9.2 Verify Before Launch

- [ ] **Ring-based recommendations RLS** — test end-to-end: user A recommends to ring 2, user B (in ring 2 via contacts) sees it on `/recommendations`
- [ ] **TravelStats shared entry inclusion** — confirm `getItemsWithShared()` is used in the stats query path
- [ ] **Deferred sharing resolution** — test full flow: share with unlinked contact → they sign up → auto-link resolves → entry appears in their SharedFeed

### 9.3 Deferred to Post-Launch

- Real-time sync (Supabase Realtime subscriptions)
- Activity feed / collaboration history
- Per-collaborator permission UI (granular `can_edit`)
- Distinct "left" status (separate from "declined")
- Category-aware SharedEditPanel (full schema-driven editing for collaborators)
- SharedFeed query optimization (batch load instead of N+1)
- Custom ring labels
- Recommendation model decision (new entry vs. collaboration vs. hybrid)

---

## 10. Post-Launch Social Roadmap

These items link to [ROADMAP.md](./ROADMAP.md) priorities:

- **"Recommended" status model** — cross-category flag, one-tap wishlist from feed (Priority 2)
- **Wishlist-to-Done tracking** — conversion metric for recommendation effectiveness (Priority 2)
- **Ring-gated friend comparison stats** — collective stats, non-competitive framing (Priority 3)
- **Lightweight "tips" field** — let recommenders add advice alongside recommendations (Priority 2)
