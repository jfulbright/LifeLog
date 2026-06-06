import { randomUUID } from "crypto";
import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, section, timed, printSummary, getResults } from "./helpers/assertions.mjs";

const ENTRIES_PER_USER = 50;
const COLLABS_PER_PAIR = 15;
const RECS_PER_USER = 10;
const OVERLAYS_COUNT = 10;

const CATEGORIES = ["events", "travel", "activities", "movies", "cellar", "cars", "homes", "kids"];

function randomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function makeScaleEntry(userId, i) {
  const id = randomUUID();
  const category = CATEGORIES[i % CATEGORIES.length];
  const statuses = {
    events: "attended", travel: "visited", activities: "done",
    movies: "watched", cellar: "tried", cars: "owned", homes: "owned", kids: "happened",
  };
  return {
    id,
    user_id: userId,
    category,
    status: statuses[category],
    start_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
    data: { id, title: `Scale Entry ${i}`, city: "Test City", scaleBatch: true },
  };
}

async function run() {
  console.log("\n\x1b[1m🧪 08 — Scale & Performance\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();
  const users = [jason, sarah, mike];

  // ── Seed scale data ──
  section(`Seed ${ENTRIES_PER_USER} entries per user (${ENTRIES_PER_USER * 3} total)`);

  const allEntryIds = { [jason.userId]: [], [sarah.userId]: [], [mike.userId]: [] };

  for (const user of users) {
    const batch = [];
    for (let i = 0; i < ENTRIES_PER_USER; i++) {
      batch.push(makeScaleEntry(user.userId, i));
    }

    const { data, error } = await user.client
      .from("items")
      .insert(batch)
      .select("id");

    if (error) {
      fail(`Seed ${user.name} entries`, error.message);
    } else {
      allEntryIds[user.userId] = data.map(d => d.id);
      pass(`Seed ${user.name} entries`, `${data.length} created`);
    }
  }

  // ── Seed collaborations ──
  section(`Seed ${COLLABS_PER_PAIR} collaborations per pair`);

  const pairs = [
    { owner: sarah, collab: jason },
    { owner: sarah, collab: mike },
    { owner: jason, collab: mike },
  ];

  for (const { owner, collab } of pairs) {
    const ownerEntries = allEntryIds[owner.userId].slice(0, COLLABS_PER_PAIR);
    const batch = ownerEntries.map(entryId => ({
      entry_id: entryId,
      entry_category: "events",
      owner_id: owner.userId,
      collaborator_user_id: collab.userId,
      status: "accepted",
      can_edit: true,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    }));

    const { data, error } = await owner.client
      .from("collaborators")
      .insert(batch)
      .select("id");

    if (error) {
      fail(`Collabs ${owner.name}→${collab.name}`, error.message);
    } else {
      pass(`Collabs ${owner.name}→${collab.name}`, `${data?.length || 0} rows`);
    }
  }

  // ── Seed recommendations ──
  section(`Seed ${RECS_PER_USER} recommendations per user`);

  for (const user of users) {
    const targets = users.filter(u => u.userId !== user.userId);
    const batch = [];
    const userEntries = allEntryIds[user.userId];

    for (let i = 0; i < RECS_PER_USER && i < userEntries.length; i++) {
      batch.push({
        from_user_id: user.userId,
        entry_id: userEntries[i],
        entry_category: CATEGORIES[i % CATEGORIES.length],
        to_user_id: targets[i % targets.length].userId,
        to_ring_level: null,
        status: "active",
      });
    }

    const { data, error } = await user.client
      .from("recommendations")
      .insert(batch)
      .select("id");

    if (error) {
      fail(`Recs from ${user.name}`, error.message);
    } else {
      pass(`Recs from ${user.name}`, `${data?.length || 0} created`);
    }
  }

  // ── Seed overlays ──
  section(`Seed ${OVERLAYS_COUNT} overlays`);

  const jasonSharedEntries = allEntryIds[sarah.userId].slice(0, OVERLAYS_COUNT);
  const overlayBatch = jasonSharedEntries.map((entryId, i) => ({
    entry_id: entryId,
    user_id: jason.userId,
    snapshot1: `Scale overlay ${i + 1}`,
    rating: (i % 5) + 1,
    updated_at: new Date().toISOString(),
  }));

  const { data: overlayData, error: overlayErr } = await jason.client
    .from("overlays")
    .upsert(overlayBatch, { onConflict: "entry_id,user_id" })
    .select("id");

  if (overlayErr) {
    fail("Seed overlays", overlayErr.message);
  } else {
    pass("Seed overlays", `${overlayData?.length || 0} created`);
  }

  // ── Performance tests ──
  section("Performance: getItemsWithShared (own + shared entries)");

  for (const category of ["events", "travel", "movies"]) {
    const { ms } = await timed(`Jason items+shared (${category})`, async () => {
      const { data: ownItems } = await jason.client
        .from("items")
        .select("*")
        .eq("user_id", jason.userId)
        .eq("category", category);

      const { data: sharedEntryIds } = await jason.client
        .from("collaborators")
        .select("entry_id")
        .eq("collaborator_user_id", jason.userId)
        .eq("status", "accepted");

      if (sharedEntryIds && sharedEntryIds.length > 0) {
        const ids = sharedEntryIds.map(c => c.entry_id);
        const { data: sharedItems } = await jason.client
          .from("items")
          .select("*")
          .in("id", ids)
          .eq("category", category);
        return { own: ownItems?.length || 0, shared: sharedItems?.length || 0 };
      }
      return { own: ownItems?.length || 0, shared: 0 };
    });

    if (ms < 500) {
      pass(`getItemsWithShared(${category})`, `${ms}ms (< 500ms threshold)`);
    } else {
      fail(`getItemsWithShared(${category})`, `${ms}ms (EXCEEDS 500ms threshold)`);
    }
  }

  section("Performance: getMyRecommendations");

  const { ms: recMs } = await timed("Jason recommendations", async () => {
    // Direct recs
    const { data: directRecs } = await jason.client
      .from("recommendations")
      .select("*, items(id, data, category)")
      .eq("to_user_id", jason.userId)
      .eq("status", "active");

    // Ring-based: find what rings Jason belongs to in other users' contacts
    const { data: jasonAppearances } = await jason.client
      .from("contacts")
      .select("owner_id, ring_level")
      .eq("linked_user_id", jason.userId);

    return { direct: directRecs?.length || 0, ringAppearances: jasonAppearances?.length || 0 };
  });

  if (recMs < 1000) {
    pass("getMyRecommendations (with ring resolution)", `${recMs}ms (< 1000ms threshold)`);
  } else {
    fail("getMyRecommendations (with ring resolution)", `${recMs}ms (EXCEEDS 1000ms threshold)`);
  }

  section("Performance: getOverlaysForEntries (batch)");

  const batchEntryIds = allEntryIds[sarah.userId].slice(0, 20);
  const { ms: overlayMs } = await timed("Batch overlay load", async () => {
    const { data } = await jason.client
      .from("overlays")
      .select("*")
      .in("entry_id", batchEntryIds);
    return data?.length || 0;
  });

  if (overlayMs < 300) {
    pass("getOverlaysForEntries (20 entries)", `${overlayMs}ms (< 300ms threshold)`);
  } else {
    fail("getOverlaysForEntries (20 entries)", `${overlayMs}ms (EXCEEDS 300ms threshold)`);
  }

  section("Performance: Full category load (items + collabs + overlays)");

  const { ms: fullMs } = await timed("Full events load", async () => {
    const { data: items } = await jason.client
      .from("items")
      .select("*")
      .eq("category", "events")
      .or(`user_id.eq.${jason.userId}`);

    const { data: collabs } = await jason.client
      .from("collaborators")
      .select("entry_id")
      .eq("collaborator_user_id", jason.userId)
      .eq("status", "accepted");

    const entryIds = (collabs || []).map(c => c.entry_id);
    if (entryIds.length > 0) {
      const { data: sharedItems } = await jason.client
        .from("items")
        .select("*")
        .in("id", entryIds)
        .eq("category", "events");

      const allIds = [...(items || []).map(i => i.id), ...entryIds];
      const { data: overlays } = await jason.client
        .from("overlays")
        .select("*")
        .in("entry_id", allIds.slice(0, 50));
    }
    return items?.length || 0;
  });

  if (fullMs < 2000) {
    pass("Full category load (items+collabs+overlays)", `${fullMs}ms (< 2000ms threshold)`);
  } else {
    fail("Full category load (items+collabs+overlays)", `${fullMs}ms (EXCEEDS 2000ms threshold)`);
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
