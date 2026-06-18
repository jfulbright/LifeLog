# USER_STORIES.md — Social Model Usability Walkthrough

> **Purpose:** Manually validate that the social model (sharing, recommendations, overlays, ring
> visibility) is a solid, bug-free MVP and — critically — that it presents **one mental model** that
> works identically across Events, Travel, Activities, and Movies. The social layer is the cornerstone
> of LifeSnaps. If it's confusing or broken, the app fails.
>
> **Companion docs:** [SOCIAL.md](./SOCIAL.md) (rules & flows) · [TEST.md](./TEST.md) (automated suite)
> · `scripts/seed-realistic-data.mjs` (the data these stories walk).
> Last updated: 2026-06-12

---

## 1. How to Use This Doc

### Reset to a known state
```bash
node scripts/tests/helpers/cleanup.mjs --wipe   # clear all test data
node scripts/seed-realistic-data.mjs            # seed Jason / Sarah / Mike
```
Then run the app (`cd client && npm start`) and log in as the actor each story names.

### Test users (from TEST.md)

| Name  | Email                      | Password     | Ring relationships |
|-------|----------------------------|--------------|--------------------|
| Jason | jfulbright+user1@gmail.com | TestPass123! | Sarah in his ring 4, Mike in his ring 2 |
| Sarah | jfulbright+user2@gmail.com | TestPass123! | Jason in her ring 4, Mike in her ring 3 |
| Mike  | jfulbright+user3@gmail.com | TestPass123! | Jason in his ring 2, Sarah in his ring 4 |

The densest seeded multi-contributor entry is Sarah's **"Taylor Swift — Eras Tour"** (Sarah base +
Jason + Mike overlays = 3 voices) — use it to exercise `SocialMemoriesCard` collapse/expand.

### Status legend
✅ pass · 🐛 bug · ⚠️ UX friction (works but confusing) · ⬜ not yet tested

### Logging a finding
Mark the story's **Result** cell with the status emoji + a one-line note, then copy any 🐛/⚠️ into
**§7 Findings Log** with a repro. §7 is the single source of truth for what blocks launch.

---

## 2. The One Mental Model (Consistency Contract)

The user learns the model **once** and must have it reinforced — never re-taught — in every category.
The model is a grid of **4 roles × 5 surfaces**. Every cell must behave the same regardless of category.

### Roles — who you are relative to an entry

| Role | How you get it | What you can do |
|------|----------------|-----------------|
| **Owner** | You created it | Edit all base facts; add your snaps/rating/photos; share; recommend; delete |
| **Viewer** | It's visible to your ring on someone's profile | Read only — no edit, no overlay, no delete |
| **Collaborator** | You accepted a share | Edit base facts + add your own overlay; **cannot** delete |
| **Recipient** | You accepted a recommendation | You now **own a brand-new entry** with `recommendedBy` provenance |

### Surfaces — the touchpoints that must feel identical in every category

| Surface | Components | Consistency assertion |
|---------|-----------|----------------------|
| **Add** | schema-driven `ItemForm` | Social section (companions / visibility / recommend) renders the same fields, same order, same icons |
| **View** | card, `EntryDetailPanel`, `SocialMemoriesCard`, `PrivacyIndicator`, `EntryHeader` | Attribution (🤝 Shared by / ⭐ Recommended by) and privacy icon look + read the same |
| **Edit** | `ItemForm` (owner: full; collaborator: Social section hidden) | Same form, same field behavior; collaborator edit path identical across categories |
| **Share** | `PeopleField` (companions/visibility/recommend) + `ShareWithCompanionsToggle` | Same chip-input, same ring behavior, same wording in all four categories |
| **Respond** | `SharedFeed` (`/shared`) accept/decline · `Recommendations` (`/recommendations`) wishlist/dismiss | One inbox for shares, one for recs — identical regardless of the entry's category |

### Reusable-component checklist (verify the SAME component is used everywhere)
- [ ] `PeopleField` is the only UI for companions, visibility, and recommend — no per-category variant
- [ ] `EntryHeader` renders 🤝 Shared / ⭐ Recommended attribution identically in all 4 categories
- [ ] `PrivacyIndicator` (lock / people icon) appears in the same card position
- [ ] `OverlayForm` is the same in every category a collaborator can overlay
- [ ] `SocialMemoriesCard` renders multi-contributor snaps the same everywhere
- [ ] `EntryDetailPanel` is the single detail/edit modal for all categories

### Reinforcement assertions (icon + label parity)
- [ ] 👥 "Who was there?" (companions) — same label/icon, Movies = Travel = Events = Activities
- [ ] 🔒 "Who can see this" (visibility) — same
- [ ] ⭐ "Recommend to" (recommend) — same
- [ ] Accept / Decline buttons in SharedFeed read the same regardless of category
- [ ] Add-to-Wishlist / Dismiss in Recommendations read the same regardless of category

---

## 3. Cross-Category Consistency Stories

**The heart of this doc.** Each surface gets one story, run identically across all 4 categories.
The *point* is the **Expected** column being true for every row — any divergence is a 🐛/⚠️.

### CC-ADD — Create an entry and set who can see it
Actor: **Jason**. For each category, create a new entry and open the Social section.

| ID | Category | Steps | Expected (identical across rows) | SOCIAL.md | TEST cov | Result |
|----|----------|-------|----------------------------------|-----------|----------|--------|
| CC-ADD-MOV | Movies | Add a movie → open Social section | 🔒 visibility field present, ring chips, same order/labels | §8 | 01 | ⬜ |
| CC-ADD-TRV | Travel | Add a trip → open Social section | Identical Social section to Movies | §8 | 01 | ⬜ |
| CC-ADD-EVT | Events | Add an event → open Social section | Identical | §8 | 01 | ⬜ |
| CC-ADD-ACT | Activities | Add an activity → open Social section | Identical | §8 | 01 | ⬜ |

### CC-SHARE — Tag companions and share for collaboration
Actor: **Jason** (Sarah & Mike are contacts). For each category, add a companion and toggle share.

| ID | Category | Steps | Expected | SOCIAL.md | TEST cov | Result |
|----|----------|-------|----------|-----------|----------|--------|
| CC-SHARE-MOV | Movies | 👥 add Sarah → flip Share toggle → save | Same PeopleField + ShareWithCompanionsToggle; collaborator row created | §3, §8 | 02 | ⬜ |
| CC-SHARE-TRV | Travel | same | Identical flow & wording | §3, §8 | 02 | ⬜ |
| CC-SHARE-EVT | Events | same | Identical | §3, §8 | 02 | ⬜ |
| CC-SHARE-ACT | Activities | same | Identical | §3, §8 | 02 | ⬜ |

### CC-VIEW — Attribution + privacy indicator on shared/recommended cards
Actor: **Jason** (has seeded shares + recs in every category).

| ID | Category | Open | Expected | SOCIAL.md | TEST cov | Result |
|----|----------|------|----------|-----------|----------|--------|
| CC-VIEW-EVT | Events | Sarah's "Taylor Swift — Eras Tour" | 🤝 "Shared with you by Sarah" + SocialMemoriesCard (Sarah base, Mike + Jason overlays) | §6 | 05 | ✅ Tier B — shared badge + 2 contributions render on card |
| CC-VIEW-TRV | Travel | Sarah's "Paris in Spring" | Same attribution UI, different category | §6 | 05 | ✅ Tier B — "🤝 Shared with you by Sarah" + "Shared Memories · 1 collaborator contribution"; Jason's own contribution shown as "You" w/ avatar |
| CC-VIEW-ACT | Activities | Mike's "Trekking — Torres del Paine W Trek" | Same | §6 | 05 | ✅ Tier B — "🤝 Shared with you by Mike" + "Shared Memories · 1 collaborator contribution"; Jason's own contribution shown as "You" w/ avatar |
| CC-VIEW-MOV | Movies | "Past Lives" (accepted rec) | ⭐ "Recommended by Sarah" w/ her rating+snaps | §4 | 03 | ✅ Tier B — "⭐ Recommended by Sarah" + "From My Circle · 1 person rated this" + Sarah's ★★★★★ + her snaps on Past Lives/Poor Things cards |

### CC-EDIT — Collaborator edits base facts via the same form
Actor: **Jason** on entries shared *to* him.

| ID | Category | Steps | Expected | SOCIAL.md | TEST cov | Result |
|----|----------|-------|----------|-----------|----------|--------|
| CC-EDIT-EVT | Events | Open Sarah's Taylor Swift → edit venue via EntryDetailPanel | Full ItemForm minus Social section; saves last-write-wins | §3, §8 | 05 | ⬜ |
| CC-EDIT-TRV | Travel | Sarah's Paris → edit dates | Identical edit surface | §3 | 05 | ✅ Tier B — "Editing shared entry" banner; PEOPLE & VISIBILITY shows read-only "Shared Collaborators" roster (Sarah Owner, Jason Test) + "🔒 Who can see this: Private (only collaborators)" (not editable); Main section shows editable Status/Trip Name/City/State/Country/Start-End Date/Tips for Friends/Tags — Snapshots/Photos/Social sections hidden, identical to Events (COL-SOCIAL-HIDDEN) |
| CC-EDIT-ACT | Activities | Mike's Patagonia → edit difficulty | Identical | §3 | 05 | ✅ Tier A (data) — Jason's edit to `difficulty` persisted and was visible to Mike (reverted). UI edit surface not separately spot-checked but uses the same EntryDetailPanel as Travel; expected identical per CC-EDIT-TRV |
| CC-EDIT-MOV | Movies | Mike's "The Raid" → edit a field | Identical | §3 | 05 | ⬜ |

### CC-RESPOND — One inbox for shares, one for recs, regardless of category
Actor: **Jason**.

| ID | Surface | Steps | Expected | SOCIAL.md | TEST cov | Result |
|----|---------|-------|----------|-----------|----------|--------|
| CC-RESP-SHARE | `/shared` | View pending: Mike's "Top Gun: Maverick" (movie), any pending event | Mixed-category inbox; Accept/Decline identical per row | §3 | 02 | ⬜ |
| CC-RESP-REC | `/recommendations` | View active: Metallica (event), Patagonia (travel), Sicario (movie) from Mike | Mixed-category list; Add-to-Wishlist/Dismiss identical | §4 | 03 | ⬜ |

---

## 4. Role-Based Journey Stories (per category, end-to-end)

Each category runs the **same four journeys** so the reader sees the model recur. Grounded in seeded data.

### 4.1 Events

| ID | Role | Steps (actor) | Expected | Component | SOCIAL.md | Result |
|----|------|---------------|----------|-----------|-----------|--------|
| EVT-OWN | Owner (Jason) | Open "Austin City Limits 2025" → view Sarah's & Mike's overlays → edit base | Owner sees all overlays; can edit/delete | EntryDetailPanel, SocialMemoriesCard | rule 10 | ✅ Tier A (data) — Sarah+Mike overlays visible to owner; UI pending |
| EVT-VIEW | Viewer (Mike) | Browse Jason's profile/ring-visible events | Read-only; no edit/overlay affordance | PrivacyIndicator | rule (visibility) | ⬜ — see **F-008** (Viewer role architectural gap) |
| EVT-COLLAB | Collaborator (Jason) | Open Sarah's "Taylor Swift" → add/edit own overlay | Base + others' overlays visible; own overlay editable | OverlayForm | rules 3,10 | ✅ Tier A + B — detail shows Sarah/You/Mike contributions; "Edit" on own overlay |
| EVT-RECIP | Recipient (Jason) | `/recommendations` → Mike's "Metallica" → Add to Wishlist | New owned event entry w/ recommendedBy; no collab row | EntryHeader | rule 12 | ✅ after **F-001 fix** — Metallica now surfaces on `/recommendations` (3 new), not swallowed |

### 4.2 Travel

| ID | Role | Steps (actor) | Expected | Component | SOCIAL.md | Result |
|----|------|---------------|----------|-----------|-----------|--------|
| TRV-OWN | Owner (Sarah) | Open her "Paris in Spring" → see Jason's overlay | Owner sees collaborator overlay | SocialMemoriesCard | rule 10 | ✅ Tier A — Sarah sees Jason's overlay on Paris (snapshot1: "That tiny restaurant she found in the 5th was perfection") |
| TRV-VIEW | Viewer (Mike) | Browse Jason's ring-visible travel | Read-only | PrivacyIndicator | visibility | ⬜ — see **F-008** (Viewer role architectural gap) |
| TRV-COLLAB | Collaborator (Jason) | Sarah's "Paris in Spring" → overlay "tiny restaurant in the 5th" | Overlay saves, visible to Sarah on reload | OverlayForm | rules 3,9 | ✅ Tier A + B — Jason's overlay edit to `travelTips` persisted and was visible to Sarah (reverted); CC-EDIT-TRV confirms the edit surface in UI |
| TRV-RECIP | Recipient (Jason) | Mike's "Patagonia" rec → Add to Wishlist | New owned travel wishlist entry w/ recommendedBy | EntryHeader | rule 12 | ✅ Tier B — clicked "Add to Wishlist" on Mike's "Patagonia — Torres del Paine" rec; `/recommendations` Accepted tab shows "View in Travel →"; `/travel?source=recommended` shows new Wishlist entry "Patagonia — Torres del Paine" with "⭐ Recommended by Mike Test" |

### 4.3 Activities

| ID | Role | Steps (actor) | Expected | Component | SOCIAL.md | Result |
|----|------|---------------|----------|-----------|-----------|--------|
| ACT-OWN | Owner (Mike) | Open his "Trekking — Torres del Paine W Trek" (the "Patagonia trek") → see Jason's overlay | Owner sees overlay | SocialMemoriesCard | rule 10 | ✅ Tier A — Mike sees Jason's overlay on the trek (snapshot1: "Day 3 was brutal but the glacier view made it worth every step") |
| ACT-VIEW | Viewer (Sarah) | Browse Mike's ring-visible activities | Read-only | PrivacyIndicator | visibility | ⬜ — see **F-008** (Viewer role architectural gap) |
| ACT-COLLAB | Collaborator (Jason) | Mike's "Trekking — Torres del Paine W Trek" (Patagonia trek) → edit base + own overlay | Same collab surface as other categories | EntryDetailPanel, OverlayForm | rules 3,8 | ✅ Tier A + B — Jason's edit to `difficulty` persisted, visible to Mike (reverted); `/activities?source=shared` shows "🤝 Shared with you by Mike" + Jason's "You" contribution ("Day 3 was brutal..."); RULE-ONE-OVERLAY confirms no dup overlay on re-save |
| ACT-RECIP | Recipient (Sarah) | Jason's "Moab biking" rec (accepted) → entry in her list | Owned entry w/ recommendedBy: Jason | EntryHeader | rule 12 | ⬜ |

### 4.4 Movies

| ID | Role | Steps (actor) | Expected | Component | SOCIAL.md | Result |
|----|------|---------------|----------|-----------|-----------|--------|
| MOV-OWN | Owner (Jason) | Open "Interstellar" (companions Sarah+Mike) → recommend to a ring | Owner controls recommend; recommendedToRings persists | PeopleField recommend | rule 11 | ⬜ |
| MOV-VIEW | Viewer (Mike) | Browse Jason's ring-visible movies | Read-only | PrivacyIndicator | visibility | ⬜ — see **F-008** (Viewer role architectural gap) |
| MOV-COLLAB | Collaborator (Jason) | Mike's "The Raid" (accepted) → overlay "hallway fight scene" | Collab + overlay; Top Gun: Maverick stays PENDING in `/shared` | OverlayForm | rules 3,13 | ✅ Tier A + B — Mike sees Jason's overlay on The Raid (snapshot1: "The hallway fight scene is insane — watched it three times"); `/movies?source=shared` shows "🤝 Shared with you by Mike" + Jason's "You" contribution; `/shared` shows "Top Gun: Maverick" still **Pending** w/ Accept/Decline only |
| MOV-RECIP | Recipient (Jason) | "Past Lives" / "Poor Things" already accepted | ⭐ "Recommended by Sarah" + her denormalized rating+snaps | EntryHeader | rule 12 | ✅ Tier B — both cards show "⭐ Recommended by Sarah" + "From My Circle · 1 person rated this" + Sarah's ★★★★★ rating + her snaps |

---

## 5. Edge & Rule-Enforcement Stories (Bug-Hunters)

Tied to SOCIAL.md §2 ground truths and §10.2 "Verify Before Launch." These are where bugs hide.

| ID | Rule under test | Steps | Expected | SOCIAL.md | TEST cov | Result |
|----|-----------------|-------|----------|-----------|----------|--------|
| RULE-PENDING | Pending ≠ in list (rule 13) | As Sarah, check Events list for Jason's "Super Bowl LVIII" (shared **pending** to her) | NOT in Events list; appears only in `/shared` inbox | rule 13 | 02, 07 | ✅ Tier A — absent from list; 1 pending inbox row |
| RULE-ACCEPTED | Accepted appears in list | As Mike, Jason's "Super Bowl" (accepted) | Appears in Mike's Events list + timeline | rule 13 | 02 | ✅ Tier A — in Mike's events list |
| RULE-RING-RETRO | Ring change non-retroactive (rule 2) | As Jason, move Sarah to a different ring after a ring-share | Existing shares/recs persist unchanged | rule 2 | 04 | ⬜ |
| RULE-ONE-RING | Contact in exactly one ring (rule 1) | As Jason, MyPeople → assign Sarah to a new ring | She leaves the old ring; never in two | rule 1 | 04 | ⬜ |
| RULE-ONE-OVERLAY | One overlay per entry (rule 3) | As Jason, add a second overlay to Sarah's Taylor Swift | Upserts the existing overlay, no duplicate | rule 3 | 05 | ✅ Tier A (Activities) — double-upsert of Jason's overlay on Mike's "Trekking — Torres del Paine W Trek" yielded 1 row before and after (no dup) |
| RULE-RING-REC | Ring-based rec visibility (§10.2) | As Sarah, `/recommendations` — Jason recommended Inception + Barcelona to ring 4 (she's in it) | Both appear on her recs page | rule 11, §10.2 | 03, 04 | ✅ Tier A — 2 active ring-4 recs resolve to Sarah |
| RULE-REC-NOT-COLLAB | Rec ≠ collaboration (rule 12, §9.3) | As Jason, accept a rec → inspect the new entry | New row owned by Jason; **no** collaborator row; edits don't touch recommender's entry | rule 12 | 03 | ✅ Tier A + B — 4 accepted recs (Past Lives, Poor Things, hiking/Angels Landing, + Patagonia travel accepted live in Tier B); none created a collaborator row for Jason on the recommender's entry |
| RULE-LWW | Last-write-wins (rule 8) | Jason & Mike both edit shared "Super Bowl" venue | Last save wins, no error/lock | rule 8 | 05 | ⬜ |
| RULE-RELOAD | Reload to see (rule 9) | Sarah adds overlay to ACL; Jason (already on page) | Jason sees it only after reload | rule 9 | — | ⬜ |
| RULE-DISMISS | Dismissed recs hidden | As Jason, confirm "Barbie" + "Scuba Belize" (dismissed) | NOT shown on `/recommendations` | §4 | 03 | ✅ Tier A — 2 dismissed recs (Barbie, Scuba Belize); 0 overlap with the active list |
| RULE-LEAVE | Leave = declined (rule 7) | As Mike, leave Jason's "ACL Festival" share | Entry leaves his list; status → declined | rule 7 | 06 | ✅ Tier A — Mike's collaborator row toggled accepted→declined→restored on ACL Festival; after decline Mike's item read was blocked by RLS |
| RULE-VIEWER | Viewer read-only | As Mike, view a ring-visible Jason entry | No edit/overlay/delete affordance | — | 07 | ⬜ — see **F-008** (Viewer role architectural gap) |
| RULE-DELETE | Owner delete cascades | As Sarah, delete "Paris in Spring" | Jason's collab + overlay removed (FK cascade) | §10.2 | 06 | ⬜ |

---

## 5a. Negative / Validation Stories — Adding Memories & Snaps

The snap model is the most-used write path (every owner + every collaborator). SOCIAL.md §6 defines
snaps as **0–3 items, 140 chars each**. These probe the boundaries — run for both an **owner adding base
snaps** (ItemForm) and a **collaborator adding overlay snaps** (OverlayForm), in each core category.

| ID | Surface | Steps (actor) | Expected | SOCIAL.md | Result |
|----|---------|---------------|----------|-----------|--------|
| NEG-SNAP-LEN | OverlayForm / ItemForm | Type a snap > 140 chars | Blocked at 140 (counter/limit) — not silently truncated on save, not 500'd | §6 | ✅ Tier B (Events Add form) — snap `<textarea maxlength=140>` enforces hard limit |
| NEG-SNAP-MAX | OverlayForm | Add a 4th snap | Prevented (max 3); affordance disabled or hidden after 3 | §6 | ✅ Tier B (Events) — exactly 3 fixed snap fields, no add-4th affordance |
| NEG-SNAP-EMPTY | OverlayForm | Save snap of only spaces / empty | Trimmed; empty snap not persisted as a blank contribution | §6 | ⬜ |
| NEG-OVERLAY-NOOP | OverlayForm | Save overlay with no snaps, no rating, no notes | Either no-op (no empty overlay row) or clearly handled — no phantom contributor in SocialMemoriesCard | rule 3, §6 | ⬜ |
| NEG-SNAP-EMOJI | OverlayForm | Snap with emoji/multibyte at the 140 boundary | Char count handles multibyte correctly; no off-by-one truncation mid-grapheme | §6 | ⬜ |
| NEG-SAVE-FAIL | OverlayForm | Add a snap, kill network, save | Error surfaced to user; not a silent failure; retry possible; no half-written state | rule 8 | ⬜ |
| NEG-ADD-REQUIRED | ItemForm (Add) | Create an entry with required field (e.g. title) blank | Validation blocks save with a clear message; consistent across all 4 categories | §8 | ⬜ inconclusive — Events Add flow is multi-step/search-driven; the snapshot section shown had no title input. Needs a flow-specific pass (pick type → core fields). |
| NEG-RATING-RANGE | ItemForm / OverlayForm | Set rating outside 1–5 (if reachable) | Clamped/blocked; never stored out of range | §6 | ⬜ |
| NEG-DUP-OVERLAY | OverlayForm | Save an overlay twice quickly (double-submit) | Upsert on (entry_id,user_id) — one row, no duplicate contributor | rule 3 | ⬜ |

> **Consistency note:** every NEG-* case must behave **identically** in Movies / Travel / Events /
> Activities. A 140-char limit enforced in Movies but not Travel is itself a 🐛.

---

## 5b. Collaborator-Edit Guard Stories (shared + accepted, you're a collaborator)

Happy-path collaborator editing lives in §3 (CC-EDIT) and §4 (`*-COLLAB`). These are the **guards** —
what a collaborator must *not* be able to do, and the race/edge conditions. Actor: **Jason**, on entries
shared *to* him (Sarah's Taylor Swift / Paris, Mike's Patagonia / The Raid).

| ID | Guard under test | Steps | Expected | SOCIAL.md | Result |
|----|------------------|-------|----------|-----------|--------|
| COL-NO-DELETE | Collaborator can't delete | Open an accepted shared entry as Jason | No Delete affordance; if forced via API, RLS rejects | §3 ("Cannot delete") | ✅ Tier A + B — RLS rejected forced delete (0 rows); detail panel shows no Delete button |
| COL-PENDING-NOEDIT | Pending can't edit | Mike's "Top Gun: Maverick" (status **pending**, not accepted) | Not in Movies list; only Accept/Decline in `/shared` — no edit/overlay until accepted | rule 13 | ✅ Tier A + B — Tier A: `collab.status = "pending"`, Jason's item read succeeds but a forced `rating` edit was blocked by RLS (rating unchanged); Tier B: `/shared` shows "Top Gun: Maverick" under **Pending** with only Accept/Decline (no edit/overlay affordance), and it's absent from `/movies` |
| COL-SOCIAL-HIDDEN | Social section hidden | Edit an accepted shared entry via EntryDetailPanel | ItemForm renders **minus** the Social section (no companions/visibility/recommend) — only the owner controls sharing | §3 | ✅ Tier B (Events) — detail panel shows read-only "Shared Collaborators" roster, no editable companions/visibility/recommend controls |
| COL-EDIT-BASE-OK | Base edit persists | Edit venue/date on Sarah's Taylor Swift | Saves via read-merge-write; owner's snaps/rating preserved; visible to Sarah on reload | §8 (read-merge-write), rule 9 | ⬜ |
| COL-CONCURRENT | Concurrent edit (LWW) | Jason and Mike edit the same shared field; both save | Last write wins, no crash, no silently dropped *other* fields (merge preserves untouched keys) | rule 8 | ⬜ |
| COL-OWNER-DELETES | Edit during owner delete | Jason editing while Sarah deletes the entry | Graceful failure (entry gone) — clear message, no orphaned overlay, no infinite spinner | §10.2 (cascade) | ⬜ |
| COL-LEAVE-THEN-EDIT | Edit after leaving | Jason leaves the share (declined), then tries to open/edit | Entry gone from his list; edit path unreachable; RLS blocks stale write | rule 7 | ⬜ |
| COL-OVERLAY-OWN-ONLY | Can't edit others' overlays | Jason opens an entry where Mike also has an overlay | Jason edits only *his* overlay; Mike's is read-only to him | rules 3, 10 | ✅ Tier A + B — RLS blocked write (0 rows); detail panel shows "Edit" only on Jason's own overlay row |

---

## 6. Known UX Pain Points to Pressure-Test (SOCIAL.md §9)

These already work mechanically — the question is whether they *confuse*. Run as first-time-user tasks.

| ID | Pain point | Task to give a fresh tester | What to watch for | Result |
|----|-----------|------------------------------|-------------------|--------|
| UX-COMPANION | §9.1 Companion vs Share | "Add a movie you watched with Sarah, and let her add her own memories" | Do they find the Share toggle? Do they expect tagging = sharing? Hesitation/wrong path = ⚠️ | ⬜ |
| UX-REC-DISCONNECT | §9.3 Recommendation disconnection | "Sarah recommended Past Lives — add it and check what carries over" | Does "⭐ Recommended by Sarah" feel connected to her experience, or orphaned? | ⬜ |
| UX-RING-LABELS | §9.2 Ring labels rigid | "Share a trip with just your closest people" | Do the fixed ring labels match their mental grouping? | ⬜ |
| UX-PENDING-VIS | Pending discoverability | "Someone shared something with you — find it" | Do they discover the `/shared` inbox + nav badge unaided? | ⬜ |

---

## 7. Findings Log

Roll up every 🐛/⚠️ from §§3–6 here. This is the launch-blocking list.

| ID | Story ref | Severity | Type | Surface / Category | Description | Repro | Proposed fix |
|----|-----------|----------|------|--------------------|-------------|-------|--------------|
| F-001 | EVT-RECIP / EVT-REC-ANOMALY | **P0** ✅ FIXED | bug | Recommendations matcher / Events | **Every incoming *event* recommendation is silently auto-accepted and mis-attributed on page load.** Root cause: `findMatchingOwnedItem` events branch (`client/src/helpers/recommendationMatcher.js`) tested `normalize(item.eventName) === normalize(recEntry.eventName)`, but `eventName` is not a real field (events use `title`+`artist`). Both sides are `undefined` → `"" === ""` → **always true** → matched the *first* owned event. `autoMerge` (Recommendations.js:54-61, runs on every `/recommendations` load) then accepted the rec and stamped `recommendedBy` onto that unrelated event, and **never created a new entry**. Net: the recommendation vanished from `/recommendations`, no owned entry created, and a random event got a false "Recommended by X". This was the cornerstone "Jason doesn't see seeded data" symptom. | Live: Mike→Jason "Metallica" rec auto-merged into Jason's "Austin City Limits 2025" (`data.recommendedBy[0].entryId` = Mike's Metallica id; `acceptedAt` = page-load time). No "Metallica" entry existed for Jason. | **FIXED** in `recommendationMatcher.js`: added `eqNonEmpty()` helper; events branch matches `artist`+`eventType` or `title` (dropped the bogus `eventName` clause); same non-empty guard applied to `movies`/`cellar`/`activities`/`default`. Unit-checked (Metallica→null, exact-title dedup still matches) + reseeded. Verified: `/recommendations` now shows Metallica/Patagonia/Sicario as "3 new". |
| F-002 | CC-VIEW-EVT / EVT-OWN | P1 ✅ FIXED | bug (symptom of F-001) | Card UI / Events | Jason's own "Austin City Limits 2025" card rendered "⭐ Recommended by Mike Test" though he owns it. Caused by the F-001 false merge writing `recommendedBy`. | Tier B: `/events` as Jason → ACL card showed ⭐ attribution. | Cleared by F-001 fix + reseed — verified ACL card no longer shows "Recommended by". (Optional hardening: `EntryHeader` could also suppress "Recommended by" when the contributor === current owner.) |
| F-004 | Movies shared — attribution/avatar | P1 ✅ FIXED | bug | SocialMemoriesCard / SharedFeed | In Shared Experiences, the current user's own overlay showed as "A collaborator" with no avatar (and other non-contact collaborators showed "A collaborator" too). Root: SharedFeed's path hit `SocialMemoriesCard`'s self-fetch fallback, which used raw `getOverlaysForEntry` with no `_currentUserId` and no profile enrichment. | As Jason, `/shared` → accepted "The Raid" → own overlay labelled "A collaborator", no profile pic. | **FIXED**: `enrichItemsWithSocialContent` now resolves the session user (so `isMine` works without the caller stamping `_currentUserId`); `SocialMemoriesCard` fallback now routes through that enrichment (resolves names + avatars). Verified: The Raid shows "You" + avatar. |
| F-005 | Deep-link source filter | P2 ✅ FIXED | UX | SharedFeed / Recommendations / all category lists | "View in Movies" from a shared entry landed on the All source tab instead of Shared; no equivalent deep link from Recommendations. | As Jason, `/shared` → "View in Movies" → list opened on All. | **FIXED**: added `getInitialSourceFilter()` (reads `?source=`); all 8 category lists initialise `sourceFilter` from it; SharedFeed links to `?source=shared`; accepted recs link to `?source=recommended`. Verified `/movies?source=shared` opens the Shared tab. |
| F-006 | Recommendations status filters + label | P2 ✅ FIXED | UX | Recommendations page | No Pending/Accepted/Declined filters; action button said "Dismiss" (inconsistent with Shared Experiences' "Decline"). | `/recommendations` had only category filters + a "Dismiss" button. | **FIXED**: added a Status toggle (All/Pending/Accepted/Declined) mirroring SharedFeed; `getMyRecommendations(statuses)` param; auto-merge restricted to active; renamed "Dismiss"→"Decline". Accepted/Declined tabs now populate (see F-007). |
| F-007 | Resolved recs unreadable | P1 ✅ FIXED | data/RLS | items RLS / Recommendations | Accepted/declined recommendation entries are unreadable by the recipient: items policy "Recipients can read recommended entries" (migration 006) restricts to `status = 'active'`. So the new Accepted/Declined tabs render empty for cross-user recs. | DB: as Jason, accepted/dismissed rec `entry_id`s return no row (RLS). | **FIXED**: applied `supabase/migrations/009_recommended_entries_any_status.sql` to the live DB (broadens the policy to any status). Verified via Preview as Jason: Accepted tab shows Metallica/Past Lives/Poor Things/hiking with full snapshot+rating+"View in X →"; Declined tab shows scuba diving/Barbie with snapshot+rating. |
| F-003 | EVT-OWN | P3 ✅ NOT A BUG | UX nuance | SocialMemoriesCard / Events | ACL's list card shows owner + Mike but not Sarah. **By design:** `SocialMemoriesCard.js:84` caps the card at `MAX_IN_CARD = 2` (`slice(0,2)`) when not expanded; the full set (incl. Sarah) renders in the expanded detail panel. Data is correct (Sarah + Mike overlays present, `recommendedBy` null post-reseed). | Read of SocialMemoriesCard.js:84-85; verified ACL overlays intact in DB. | None required. Minor UX consideration: the inline cap of 2 *includes the owner*, so a 3-contributor entry shows only 1 collaborator inline beside a "2 collaborator contributions" label — consider capping by sharee count, not total, for clearer preview. |
| F-008 | EVT-VIEW / TRV-VIEW / ACT-VIEW / MOV-VIEW / RULE-VIEWER | **P1** ✅ FIXED (migration 011, applied) | architectural gap (RLS + seed data) | ContactProfile (`/people/:contactId`) — "Viewer" role, all categories | The **Viewer** role (SOCIAL.md §1: "Passive visibility — control who can browse entries on your profile") appeared non-functional for travel/activities/movies/events. `ContactProfile.js` queried `items` where `user_id = linkedUserId` then filtered client-side by `item.visibilityRings.includes(ringLevel)` (or a higher ring). Two compounding gaps: (1) **RLS** — the `items` SELECT policies only granted cross-user reads via an accepted collaborator row or a recommendation-recipient row; there was **no ring-visibility policy**, so a pure "viewer" got zero rows regardless of `visibilityRings`, and **`visibilityContacts` (phase-2 individual sharing) was never consumed at all**. (2) the client filter was also semantically wrong — it keyed off the ring the *viewer* assigned the *owner*, not the ring the owner assigned the viewer. | As Mike, visit `/people/<jason-contact-id>` — "Nothing shared yet" despite being shared with; an individual added to "Who can see this" got no access. | **FIXED** in `supabase/migrations/011_visibility_ring_and_contact_reads.sql` (applied to prod): `get_my_viewer_contacts()` (SECURITY DEFINER) resolves which of an owner's contacts is the caller by `linked_user_id` **OR** normalized email (mirrors migration 010), and a new permissive `items` SELECT policy grants a read when `data.visibilityRings @> my ring` **OR** `data.visibilityContacts ? my contact id`. `ContactProfile.js` now trusts RLS (removed the insecure/incorrect client filter). Verified by `scripts/tests/11-visibility-contact-reads.test.mjs` (6/6) incl. unlinked-contact email resolution; `07-isolation-security` still green (no cross-user leak). |
| F-009 | CC-EDIT-ACT / COL-* (all categories) | **P0** ✅ FIXED | bug | EntryDetailPanel edit flow (all categories, esp. Activities) | **Editing an entry via "See Details → Edit → Update {Category}" silently dropped the save** for Activities, and silently dropped any collaboration/recommendation changes for every other category. Two compounding bugs: (1) `ActivityList.js`'s `EntryDetailPanel onSave` callback discarded the edited form data entirely (`onSave={(updatedData) => { setViewDetailItem(null); }}`) — no base-field edits, companions, sharing, or recommendations persisted at all. Every other category list correctly called `saveDetailEdit(data)`. (2) `useCategory.js`'s `saveDetailEdit` (used by all categories' detail-edit flow) stripped `shareWithCompanionIds`/`recommendedToRings`/`recommendedToContacts` from the payload and never created the corresponding `collaborators`/`recommendations` rows — that logic only existed in the list-form `handleSubmit` path. So base-field edits via the detail panel worked everywhere except Activities, but enabling "Share & Collaborate" or "Recommend to" via the detail-panel edit did nothing in *any* category. | User report: as Jason, edited the real "Scuba Diving" (Cozumel) activity via See Details → Edit, added Sarah as a companion, toggled "Share & Collaborate" for her, clicked "Update Activities" — dialog closed but DB `companions`/`updated_at`/`collaborators` were all unchanged. Confirmed via live Preview repro (mousedown-based contact picker selection) before the fix. | **FIXED**: [ActivityList.js:193](client/src/features/activities/components/ActivityList.js:193) now calls `saveDetailEdit(updatedData)`. `saveDetailEdit` in [useCategory.js](client/src/hooks/useCategory.js:286) now mirrors `handleSubmit`'s collaborator-share and recommendation-creation logic. Verified live: re-ran the repro — `companions` now includes Sarah, `updated_at` refreshed, and a new `collaborators` row (`status: "pending"`) was created for Sarah. |
| F-010 | Deferred share / "first invite" (RULE-DEFERRED, MVP gate §8) | **P0** ⏳ FIX READY (migration 010, not yet applied) | architectural bug (RLS + linking) | Sharing with someone not yet on LifeSnaps — all categories | **The cornerstone first-invite flow was broken.** Sharing with a contact who has not signed up writes a `collaborators` row with `collaborator_user_id = NULL` (only `collaborator_contact_id` set, [collaboratorService.js:49](client/src/services/collaboratorService.js)). Every collaborator RLS policy keyed **strictly** on `collaborator_user_id = auth.uid()` (migrations 006/008), so a NULL row granted **zero** visibility — permanently — until back-filled. The only back-fill was the one-shot `on_auth_user_created_link` trigger (migration 004), a hand-applied, exact-string-email-match dependency with no fallback. Real-world failure: daughter invited to the Aspen trip before she signed up; after Google signup she still saw nothing, and her contact still read "Not on LifeSnaps yet" — proving the trigger's contact-link step never took effect (un-applied migration in prod and/or Gmail dot/alias mismatch: the join was `WHERE email = NEW.email`, exact + dot-sensitive, so `madison.fulbright@` ≠ `madisonfulbright@`). | As Mike (deferred, unlinked contact with a NULL collaborator row), before any backfill: cannot read the owner's entry; contact stays unlinked. Reproduced by `scripts/tests/10-deferred-share.test.mjs` (skips until migration 010 applied). | **FIX READY** in `supabase/migrations/010_self_healing_share_resolution.sql`: (1) `normalize_email()` — lower/trim, strip Gmail dots, keep +suffix; (2) `get_my_collaborations()` SECURITY DEFINER resolves a collaborator row by `collaborator_user_id` **OR** normalized email; every collaborator policy (items SELECT/UPDATE, collaborators SELECT/UPDATE, overlays SELECT) rewritten to use it → **read-time visibility no longer depends on backfill**; (3) `resolve_my_collaborations()` RPC called on every login ([AuthContext.js](client/src/contexts/AuthContext.js)) self-heals contacts + collaborator rows; (4) both auto-link triggers re-applied with normalized matching. **Requires applying migration 010 to the live DB** (DDL — owner action), then `node scripts/tests/10-deferred-share.test.mjs`. |
| F-011 | COL-EDIT / share toggle hydration (all categories) | **P1** ✅ FIXED | bug | EntryDetailPanel "Share & Collaborate" toggle | The share toggle read **off** when re-opening an entry via "See Details → Edit", even for companions who were live collaborators (your wife really was shared — she could edit — but the UI showed her toggle off). `EntryDetailPanel` seeded its form from the raw list item (`useState({ ...item })`), which never carries `shareWithCompanionIds` — that field was only reconstructed from the `collaborators` table inside `useCategory.startEditing`, which the detail-panel path never calls. Worse, `shareEntryWithContacts` only ever **upserts**, so toggling off + save was a silent no-op — there was **no way to un-share**. | As Jason, edit an entry with an existing share via the detail panel → toggle shows off; toggling off + save left the collaborator row intact. | **FIXED**: [EntryDetailPanel.js](client/src/components/shared/EntryDetailPanel.js) now hydrates `shareWithCompanionIds` from `getCollaboratorsForOwnedEntry` on open (owned, non-shared). `saveDetailEdit`/`handleSubmit` now **reconcile** shares — diff hydrated vs submitted, `shareEntryWithContacts` for adds and the new `unshareEntryWithContacts` for removes (guarded on `Array.isArray` so an un-hydrated flow is a no-op, never a wipe). RTL test `EntryDetailPanel.test.js` covers the hydration. |
| F-012 | COL-EDIT-TRV | **P1** ✅ FIXED | bug | TravelList detail-panel save | Travel's detail-panel `onSave` called `handleSubmit({preventDefault})`, which reads the **hook's** `formData` (stale — set by the list form, not the panel), so edits made in the detail panel were ignored. Same class as F-009's Activities bug, different symptom. | As Jason, edit a trip via See Details → Edit → save: panel edits not persisted. | **FIXED**: [TravelList.js:960](client/src/features/travel/components/TravelList.js) now calls `saveDetailEdit(updatedData)` like every other category. All 8 category lists' detail-panel saves are now uniform. |

Severity: **P0** blocks launch (data loss, broken sharing, wrong visibility) · **P1** major confusion ·
**P2** polish.

### Why the suite missed F-009 through F-012 (process note)

The integration suite asserts against the **same data shape it seeds**: `seed-realistic-data.mjs` only ever creates **linked** contacts (`linked_user_id` set) and collaborator rows with `collaborator_user_id` **pre-filled**, and tests sign in as **pre-existing** users. So it proves "given correct rows, the queries work" — never "the real UI flow *creates* correct rows," which is where every one of these bugs lived. The deferred path (share with an unlinked person who signs up later — literally the first-invite experience) had **zero** fixture or test coverage, and was a known-unchecked item in the §8 launch gate. Closed by: `scripts/tests/10-deferred-share.test.mjs` (creates the deferred state + asserts read-time resolution and backfill) and `client/src/components/shared/EntryDetailPanel.test.js` (asserts the edit form reflects live shares).

---

## 8. MVP Launch Checklist (Gate)

The social model ships only when all of the following are ✅. Derived from SOCIAL.md §10.2.

- [ ] All **§3 consistency** stories ✅ — the model looks/behaves identically across all 4 categories
- [ ] All **§4 role journeys** ✅ — Owner / Viewer / Collaborator / Recipient correct in every category
- [ ] All **§5 rule-enforcement** stories ✅ — no rule from SOCIAL.md §2 is violated
- [ ] All **§5a negative/validation** stories ✅ — snap limits & required-field validation hold, identically per category
- [ ] All **§5b collaborator-edit guards** ✅ — no delete, Social hidden, pending blocked, concurrent/race handled
- [ ] **Ring-based recommendations** verified end-to-end (RULE-RING-REC) — SOCIAL.md §10.2
- [ ] **Deferred sharing resolution** verified (unlinked contact → signup → auto-link → SharedFeed)
- [ ] **TravelStats / category stats** include accepted shared entries (`getItemsWithShared` path)
- [ ] No **P0** in §7; all **P1** triaged with an owner
- [ ] §6 pain points reviewed — confusion either fixed or consciously accepted for MVP
```
