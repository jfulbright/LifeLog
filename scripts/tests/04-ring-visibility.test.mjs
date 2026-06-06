import { randomUUID } from "crypto";
import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeEvent } from "./helpers/factories.mjs";

async function run() {
  console.log("\n\x1b[1m🧪 04 — Ring Visibility & Resolution\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Verify ring assignments ──
  section("Verify baseline ring assignments");

  const { data: sarahContacts } = await sarah.client
    .from("contacts")
    .select("display_name, ring_level, linked_user_id, email")
    .eq("owner_id", sarah.userId);

  const jasonInSarah = sarahContacts?.find(c => c.linked_user_id === jason.userId);
  const mikeInSarah = sarahContacts?.find(c => c.linked_user_id === mike.userId);

  if (jasonInSarah && jasonInSarah.ring_level === 4) {
    pass("Jason is ring 4 in Sarah's contacts", `ring=${jasonInSarah.ring_level}`);
  } else if (jasonInSarah) {
    fail("Jason is ring 4 in Sarah's contacts", `ring=${jasonInSarah.ring_level}, expected 4`);
  } else {
    fail("Jason is ring 4 in Sarah's contacts", "Not found in Sarah's contacts");
  }

  if (mikeInSarah && mikeInSarah.ring_level === 3) {
    pass("Mike is ring 3 in Sarah's contacts", `ring=${mikeInSarah.ring_level}`);
  } else if (mikeInSarah) {
    fail("Mike is ring 3 in Sarah's contacts", `ring=${mikeInSarah.ring_level}, expected 3`);
  } else {
    fail("Mike is ring 3 in Sarah's contacts", "Not found in Sarah's contacts");
  }

  const { data: jasonContacts } = await jason.client
    .from("contacts")
    .select("display_name, ring_level, linked_user_id")
    .eq("owner_id", jason.userId);

  const mikeInJason = jasonContacts?.find(c => c.linked_user_id === mike.userId);
  if (mikeInJason && mikeInJason.ring_level === 2) {
    pass("Mike is ring 2 in Jason's contacts", `ring=${mikeInJason.ring_level}`);
  } else {
    fail("Mike is ring 2 in Jason's contacts", `ring=${mikeInJason?.ring_level || "not found"}`);
  }

  // ── Ring-based recommendation resolution ──
  section("Ring-based recommendation delivery");

  // Jason creates an entry and recommends to ring 2 (Mike is in Jason's ring 2)
  const entryId = randomUUID();
  const { data: jasonEntry } = await jason.client
    .from("items")
    .insert({
      id: entryId,
      user_id: jason.userId,
      category: "events",
      status: "attended",
      data: { id: entryId, title: "Ring Test Event", eventType: "concert", artist: "Test Band", city: "Denver" },
    })
    .select()
    .single();

  if (!jasonEntry) {
    fail("Setup: Jason creates entry", "Insert failed");
    printSummary();
    process.exit(1);
  }

  // Recommend to ring 2
  const { data: ring2Rec, error: r2Err } = await jason.client
    .from("recommendations")
    .insert({
      from_user_id: jason.userId,
      entry_id: jasonEntry.id,
      entry_category: "events",
      to_user_id: null,
      to_ring_level: 2,
      status: "active",
    })
    .select()
    .single();

  if (r2Err) {
    fail("Jason recommends to ring 2", r2Err.message);
  } else {
    pass("Jason recommends to ring 2", `rec_id=${ring2Rec.id}`);
  }

  // Mike should receive (he's in Jason's ring 2)
  // Resolution: Mike checks recs FROM Jason where to_ring_level = Mike's ring in Jason's contacts
  const { data: mikeInJasonContacts } = await jason.client
    .from("contacts")
    .select("ring_level")
    .eq("owner_id", jason.userId)
    .eq("linked_user_id", mike.userId)
    .maybeSingle();

  if (mikeInJasonContacts?.ring_level === 2) {
    // Mike should see the rec
    const { data: mikeRingRecs } = await mike.client
      .from("recommendations")
      .select("*")
      .eq("from_user_id", jason.userId)
      .eq("to_ring_level", 2)
      .eq("status", "active");

    if (mikeRingRecs && mikeRingRecs.length > 0) {
      pass("Mike receives ring-2 rec from Jason", `${mikeRingRecs.length} rec(s)`);
    } else {
      fail("Mike receives ring-2 rec from Jason", "No ring-2 recs visible to Mike");
    }
  } else {
    skip("Mike receives ring-2 rec from Jason", `Mike's ring in Jason's contacts: ${mikeInJasonContacts?.ring_level}`);
  }

  // Sarah should NOT receive (she's in Jason's ring 4, not ring 2)
  const { data: sarahInJasonContacts } = await jason.client
    .from("contacts")
    .select("ring_level")
    .eq("owner_id", jason.userId)
    .eq("linked_user_id", sarah.userId)
    .maybeSingle();

  if (sarahInJasonContacts?.ring_level !== 2) {
    const { data: sarahRing2Recs } = await sarah.client
      .from("recommendations")
      .select("*")
      .eq("from_user_id", jason.userId)
      .eq("to_ring_level", 2)
      .eq("status", "active");

    if (!sarahRing2Recs || sarahRing2Recs.length === 0) {
      pass("Sarah does NOT receive ring-2 rec", "Correct — she's ring 4");
    } else {
      fail("Sarah does NOT receive ring-2 rec", `Sarah sees ${sarahRing2Recs.length} ring-2 recs (should be 0 — RLS too permissive?)`);
    }
  }

  // ── Ring change persistence (rule 2: never retroactive) ──
  section("Ring change is not retroactive");

  // Change Mike to ring 4 in Jason's contacts
  const { error: ringChangeErr } = await jason.client
    .from("contacts")
    .update({ ring_level: 4 })
    .eq("owner_id", jason.userId)
    .eq("linked_user_id", mike.userId);

  if (ringChangeErr) {
    fail("Change Mike's ring 2→4 in Jason's contacts", ringChangeErr.message);
  } else {
    pass("Change Mike's ring 2→4 in Jason's contacts", "Updated");
  }

  // The existing ring-2 rec should still exist (not deleted retroactively)
  if (ring2Rec) {
    const { data: stillExists } = await jason.client
      .from("recommendations")
      .select("id, to_ring_level, status")
      .eq("id", ring2Rec.id)
      .maybeSingle();

    if (stillExists && stillExists.status === "active") {
      pass("Existing ring-2 rec persists after ring change", `status=${stillExists.status}`);
    } else {
      fail("Existing ring-2 rec persists after ring change", "Rec was deleted or modified");
    }
  }

  // ── Restore ring for clean state ──
  await jason.client
    .from("contacts")
    .update({ ring_level: 2 })
    .eq("owner_id", jason.userId)
    .eq("linked_user_id", mike.userId);

  // ── Multi-ring recommendation ──
  section("Multi-ring recommendation");

  // Jason recommends same entry to ring 4 as well
  const { data: ring4Rec, error: r4Err } = await jason.client
    .from("recommendations")
    .insert({
      from_user_id: jason.userId,
      entry_id: jasonEntry.id,
      entry_category: "events",
      to_user_id: null,
      to_ring_level: 4,
      status: "active",
    })
    .select()
    .single();

  if (r4Err) {
    fail("Jason recommends to ring 4", r4Err.message);
  } else {
    pass("Jason recommends to ring 4", `rec_id=${ring4Rec.id}`);
  }

  // Sarah (ring 4) should now see it
  const { data: sarahRing4Recs } = await sarah.client
    .from("recommendations")
    .select("*")
    .eq("from_user_id", jason.userId)
    .eq("to_ring_level", 4)
    .eq("status", "active");

  if (sarahRing4Recs && sarahRing4Recs.length > 0) {
    pass("Sarah receives ring-4 rec from Jason", `${sarahRing4Recs.length} rec(s)`);
  } else {
    fail("Sarah receives ring-4 rec from Jason", "No ring-4 recs visible to Sarah");
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
