# LifeSnaps Social Architecture

> Handoff document describing the complete social sharing system.
> Last updated: May 2026

## 1. Architecture Overview

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

**Principle:** Base item = collaborative structural data. Overlay = personal perspective. All display surfaces consume normalized contributions from `socialContent.js`.

---

## 2. Data Model

### 2.1 profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK, FK auth.users) | User's auth ID |
| display_name | TEXT | How the user appears to others |
| first_name | TEXT | Optional first name |
| last_name | TEXT | Optional last name |
| phone | TEXT | Optional phone |
| avatar_url | TEXT | Profile photo URL (Supabase Storage) |
| bio | TEXT (max 140) | Short bio |
| notification_preferences | JSONB | Per-type notification toggles |
| created_at / updated_at | TIMESTAMPTZ | Timestamps |

### 2.2 contacts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Contact record ID |
| owner_id | UUID (FK auth.users) | Who added this contact |
| email | TEXT | Contact's email (unique per owner) |
| display_name | TEXT | Owner's label for this person |
| ring_level | INT (1-4) | Ring assignment |
| invite_status | TEXT | local_only / invited / accepted / declined |
| linked_user_id | UUID (FK auth.users) | Set when contact signs up |
| is_child | BOOLEAN | Marks children for Kids category |
| birthday | DATE | Contact's birthday |
| phone | TEXT | Optional phone |
| created_at | TIMESTAMPTZ | When added |

### 2.3 collaborators
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Collaboration record ID |
| entry_id | UUID | The shared item's ID |
| entry_category | TEXT | Category (travel, events, etc.) |
| owner_id | UUID (FK auth.users) | Who shared the entry |
| collaborator_user_id | UUID (FK auth.users) | Who it's shared WITH (null if deferred) |
| collaborator_contact_id | UUID | Contact row ID (for deferred resolution) |
| status | TEXT | pending / accepted / declined |
| can_edit | BOOLEAN | Whether collaborator can edit base item |
| invited_at | TIMESTAMPTZ | When shared |
| accepted_at | TIMESTAMPTZ | When accepted |

### 2.4 overlays
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Overlay ID |
| entry_id | UUID | Which entry this overlay is on |
| user_id | UUID (FK auth.users) | Who wrote this overlay |
| snapshot1-3 | TEXT (max 140 each) | Personal memory snaps |
| why_notes | TEXT | Personal notes / interest reasons |
| rating | INT (1-5) | Personal rating |
| photos | TEXT[] | Array of photo URLs |
| created_at / updated_at | TIMESTAMPTZ | Timestamps |

Unique constraint: `(entry_id, user_id)` -- one overlay per person per entry.

### 2.5 recommendations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Recommendation ID |
| from_user_id | UUID (FK auth.users) | Who recommended |
| entry_id | UUID | Which entry is being recommended |
| entry_category | TEXT | Category |
| to_user_id | UUID (FK auth.users) | Direct recipient (null for ring-based) |
| to_ring_level | INT | Ring-level targeting (null for direct) |
| status | TEXT | active / accepted / dismissed |
| created_at | TIMESTAMPTZ | When created |

### 2.6 invites
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Invite ID |
| token | TEXT (unique) | URL-safe token (auto-generated) |
| inviter_id | UUID (FK auth.users) | Who sent the invite |
| invitee_email | TEXT | Recipient's email |
| invitee_name | TEXT | Display name for the invite page |
| message | TEXT | Optional personal message |
| shared_entry_count | INT | Count shown on invite welcome page |
| status | TEXT | pending / accepted / expired |
| created_at / accepted_at | TIMESTAMPTZ | Timestamps |

---

## 3. Ring System

| Level | Label | Description | Use Case |
|-------|-------|-------------|----------|
| 1 | Partner in Crime | Your partner or spouse | Most intimate sharing |
| 2 | Immediate Family | Children, parents you live with | Family memories |
| 3 | Extended Family | Parents, siblings, in-laws | Broader family |
| 4 | Friends | Close friends | Social sharing |

**Behavior:**
- Rings control passive visibility (who can see entries on your profile)
- Rings are a shortcut for sharing (select a ring → resolves to current members)
- Ring changes are NOT retroactive (existing shares stay)
- A contact exists in exactly one ring

---

## 4. Sharing Flow

```
User creates entry
    │
    ├── Adds companions (contact-list field)
    │
    ├── Toggles "Share & Collaborate" per companion
    │   (ShareWithCompanionsToggle component)
    │
    └── Saves entry
         │
         ├── useCategory.handleSubmit strips shareWithCompanionIds
         ├── Calls collaboratorService.shareEntryWithContacts()
         │   Creates collaborators rows:
         │   - linked contacts → collaborator_user_id set
         │   - unlinked contacts → collaborator_contact_id only (deferred)
         │
         └── Recipient sees:
              ├── Badge count on "Shared Experiences" nav item
              ├── Pending entry in SharedFeed page
              │
              ├── ACCEPT → entry appears in their category list + timeline
              │   - Marked with _isShared: true
              │   - Can add overlay (snaps, photos, rating, notes)
              │   - Can edit structural fields (if can_edit=true)
              │   - Cannot delete the entry
              │
              └── DECLINE → hidden from their feed
```

**Deferred sharing:** If a contact isn't on LifeSnaps yet, the collaborator row stores `collaborator_contact_id` with null `collaborator_user_id`. When they sign up, the DB trigger `handle_invite_auto_link()` resolves all deferred rows.

---

## 5. Recommendations Flow

```
User views an experienced entry (attended, visited, tried, etc.)
    │
    ├── Opens "Recommend to my People" section (RecommendSection)
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
              ├── "Add to Wishlist" → creates a new entry in recipient's account
              │   with recommendedBy provenance + pre-filled fields
              │
              └── "Dismiss" → marks recommendation as dismissed
```

---

## 6. Invite Flow

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
              └── On signup, trigger fires:
                   ├── invites.status → 'accepted'
                   ├── contacts.linked_user_id → new user's ID
                   └── collaborators.collaborator_user_id → new user's ID
                       (all deferred rows resolved)
```

---

## 7. Security Model (RLS)

### items table
| Operation | Policy |
|-----------|--------|
| SELECT own | `user_id = auth.uid()` |
| SELECT shared | `id IN (collaborators WHERE collaborator_user_id = me AND status IN pending/accepted)` |
| SELECT recommended | `id IN (recommendations WHERE to_user_id = me AND active)` |
| INSERT/UPDATE/DELETE own | `user_id = auth.uid()` |
| UPDATE shared | `id IN (collaborators WHERE collaborator_user_id = me AND can_edit AND accepted)` |

### overlays table
| Operation | Policy |
|-----------|--------|
| ALL own | `user_id = auth.uid()` |
| SELECT shared | `entry_id IN (collaborators WHERE user_id = me AND accepted) OR entry_id IN (items WHERE user_id = me)` |

### collaborators table
| Operation | Policy |
|-----------|--------|
| ALL (owner) | `owner_id = auth.uid()` |
| SELECT (recipient) | `collaborator_user_id = auth.uid()` |
| UPDATE (recipient) | `collaborator_user_id = auth.uid()` (with WITH CHECK) |

### recommendations table
| Operation | Policy |
|-----------|--------|
| ALL (sender) | `from_user_id = auth.uid()` |
| SELECT (recipient) | `to_user_id = auth.uid() OR (ring-based via contacts subquery)` |
| UPDATE (recipient) | `to_user_id = auth.uid()` |

### Storage (photos bucket)
- Upload/update/delete: user can only write to `{their_user_id}/` folder
- Read: publicly accessible (photos are viewable by anyone with the URL)

---

## 8. Services Reference

### collaboratorService.js
- `shareEntry(entryId, category, userIds)` — share with resolved user IDs
- `shareEntryWithContacts(entryId, category, contacts)` — share with contact objects (supports deferred)
- `getIncomingCollaborations()` — all collabs directed at current user
- `getPendingCount()` — badge count
- `acceptCollaboration(id)` / `declineCollaboration(id)` — status transitions
- `getCollaboratorsForEntry(entryId)` — group album: who's on this entry
- `getSharedEntries()` — all accepted shared items with data

### overlayService.js
- `getMyOverlay(entryId)` — current user's overlay
- `saveOverlay(entryId, data)` — upsert overlay
- `getOverlaysForEntry(entryId)` — all overlays (group view)
- `getOverlaysForEntries(entryIds)` — bulk load
- `deleteOverlay(entryId)` — remove own overlay

### contactsService.js
- `getContacts()` / `addContact()` / `updateContact()` / `deleteContact()`
- `resolveRingMembers(ringLevels)` — ring → user IDs
- `resolveContactUserIds(contactIds)` — contact IDs → user IDs

### inviteService.js
- `createInvite({ email, name, message })` — create + count shared entries
- `getInviteByToken(token)` — public lookup
- `getMyInvites()` — sent invites
- `getInviteUrl(token)` — construct URL

### recommendationService.js
- `createRecommendations(entryId, category, { toUserIds, toRingLevels })`
- `getMyRecommendations()` — direct + ring-based, deduplicated
- `getActiveCount()` — badge count
- `acceptRecommendation(id)` / `dismissRecommendation(id)`
- `getMySentRecommendations()`

### profileService.js
- `getMyProfile()` / `updateProfile(updates)`
- `getProfileByUserId(userId)` — for displaying collaborator names
- `uploadAvatar(file)` — upload + update profile URL

---

## 9. UI Components

| Component | File | Role |
|-----------|------|------|
| OverlayForm | `components/shared/OverlayForm.js` | Unified form for adding personal overlay (snaps, rating, notes) |
| RecommendSection | `components/shared/RecommendSection.js` | Ring + individual picker for recommendations |
| ShareWithSection | `components/shared/ShareWithSection.js` | Ring visibility selector (passive browse) |
| ShareWithCompanionsToggle | `components/shared/ShareWithCompanionsToggle.js` | Per-companion share toggle (active collaboration) |
| PrivacyIndicator | `components/shared/PrivacyIndicator.js` | Lock/people icon showing shared state |

---

## 10. Pages

| Page | Route | Purpose |
|------|-------|---------|
| SharedFeed | `/shared` | Collaboration inbox: pending/accepted/declined entries |
| Recommendations | `/recommendations` | Incoming recommendations from contacts |
| MyPeople | `/people` | Contact management by ring |
| ContactProfile | `/people/:contactId` | Read-only view of a linked contact's shared stats |
| InviteWelcome | `/invite/:token` | Public invite landing page (pre-auth) |
| Dashboard | `/` | User's own stats profile page |

---

## 11. socialContent.js — Normalized Contribution Model

All display surfaces consume contributions through this helper:

```javascript
// Enrichment (called once per category load):
enrichItemsWithSocialContent(items, contacts) → items with:
  ._socialContributions  // array of { displayName, snaps, photos, rating, whyNotes, isOwner, isMine }
  ._myOverlayContribution  // current user's overlay contribution (if any)
  ._shareeContributionCount  // how many collaborators contributed

// Display helpers:
getSocialPreview(item)     // first available text for card teaser
getAllSocialSnaps(item)    // flat array of all snaps across contributors
getAllSocialPhotos(item)   // flat array of all photos across contributors
```

**Contribution shape:**
```javascript
{
  entryId, userId, displayName,
  isOwner: boolean,    // true = entry creator
  isMine: boolean,     // true = current viewer
  snaps: string[],     // 0-3 items
  whyNotes: string,
  photos: string[],    // URLs
  rating: number|null,
  updatedAt: string
}
```

---

## 12. Known Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| SharedEditPanel is generic (city/dates/venue only) | Collaborators can't edit category-specific fields from SharedFeed | Medium |
| No conflict handling on base item edits | Last-write-wins, no notification of overwrite | Low |
| "Leave Share" reuses decline status | Can't distinguish "never accepted" from "accepted then left" | Low |
| No real-time sync | Collaborator changes only appear on reload | Low (MVP acceptable) |
| Ring-based recommendations may still hit RLS issues | Depends on migration 006 being run | High (verify) |
| N+1 in SharedFeed load | Each collab fires separate item query | Medium (perf) |
| TravelStats may not fully include shared entries | Depends on getItemsWithShared being used | Medium |

---

## 13. Migrations (Sequential)

| # | File | Description |
|---|------|-------------|
| 001 | `001_social_tables.sql` | Core tables + RLS + triggers + avatars bucket |
| 002 | `002_ring_redesign_kids.sql` | Expand rings 3→4, add is_child + birthday |
| 003 | `003_autolink_contacts_notifications.sql` | Auto-link trigger on contact INSERT + backfill + notification prefs |
| 004 | `004_resolve_deferred_collaborators.sql` | Enhanced signup trigger resolves deferred collaborator rows |
| 005 | `005_collaborative_edit.sql` | why_notes column + collaborator UPDATE RLS on items |
| 006 | `006_rls_validation_complete.sql` | Comprehensive RLS validation + photos bucket policies |

**Run order matters.** Each migration builds on the previous. Run them sequentially in Supabase SQL Editor.
