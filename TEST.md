# TEST.md — LifeSnaps Social Integration Tests

## Quick Start

```bash
# Run full suite (cleanup → seed → all 8 test files)
node scripts/tests/run-all.mjs

# Run individual test file
node scripts/tests/02-collaboration-flow.test.mjs

# Cleanup only (reset to clean state for manual testing)
node scripts/tests/helpers/cleanup.mjs
```

## Test Users

| Name  | Email                        | Password     | Default Rings (in others' contacts)    |
|-------|------------------------------|--------------|----------------------------------------|
| Jason | jfulbright+user1@gmail.com   | TestPass123! | Sarah ring 4, Mike ring 2              |
| Sarah | jfulbright+user2@gmail.com   | TestPass123! | Jason ring 4, Mike ring 3              |
| Mike  | jfulbright+user3@gmail.com   | TestPass123! | Jason ring 2, Sarah ring 4             |

## Test Files

| File | Coverage | Tests |
|------|----------|-------|
| 01-entry-creation | Insert items across all 8 categories, verify counts | 30 |
| 02-collaboration-flow | Share, accept, decline, multi-user, cross-category | 15 |
| 03-recommendation-flow | Direct recs, ring-based recs, accept, dismiss | 13 |
| 04-ring-visibility | Ring resolution, non-retroactive changes, multi-ring | 10 |
| 05-edit-and-overlay | Overlays, peer visibility, structural edits, upsert | 10 |
| 06-delete-and-leave | Owner delete, collaborator leave, cascade behavior | 10 |
| 07-isolation-security | RLS negative tests (private entries, pending, declined) | 7 |
| 08-scale-performance | 150 items + timing assertions | 16 |

## Adding New Tests

1. Create factory in `scripts/tests/helpers/factories.mjs` if new category data needed
2. Use `insertItem(client, userId, item)` from factories — handles UUID generation
3. Use `pass()`, `fail()`, `skip()` from `helpers/assertions.mjs`
4. Use `section(title)` to group related assertions
5. Export a `run()` function and call it at module level
6. Guard `process.exit` with `if (!process.env.TEST_ORCHESTRATED && ...)`

## Performance Thresholds

| Query Pattern | Threshold | Notes |
|---------------|-----------|-------|
| getItemsWithShared(category) | < 500ms | Own + shared entries for one category |
| getMyRecommendations() | < 1000ms | Direct + ring resolution |
| getOverlaysForEntries(batch) | < 300ms | Batch load for 20 entries |
| Full category load | < 2000ms | Items + collabs + overlays combined |

## Bugs Fixed (migration 008, 2026-05-31)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Ring-based recs not visible | `recommendations` SELECT policy subqueried `contacts` table, which has its own RLS blocking cross-user reads | Created `get_my_ring_recommender_ids()` SECURITY DEFINER function |
| Collaborator rows orphaned on delete | No FK cascade on `collaborators.entry_id` | Added `ON DELETE CASCADE` (also for `recommendations.entry_id`) |
| Collaborator edit not persisting | Items UPDATE policy had `USING` but no `WITH CHECK` — base owner policy's `WITH CHECK (user_id = auth.uid())` blocked non-owner writes | Added `WITH CHECK (true)` to collaborator UPDATE policy |

## Architecture

```
scripts/tests/
  helpers/
    auth.mjs         — getAuthClient(), getAllClients()
    assertions.mjs   — pass/fail/skip, timed(), summary
    factories.mjs    — makeEvent/Travel/Movie/etc, insertItem()
    cleanup.mjs      — resetAllTestData(), seedBaselineContacts()
  01-08-*.test.mjs   — Test files (run sequentially)
  run-all.mjs        — Orchestrator
  results/
    latest.json      — Machine-readable results
    latest-summary.md — Human-readable summary
```
