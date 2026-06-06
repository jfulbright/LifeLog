import { randomUUID } from "crypto";
import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeEvent } from "./helpers/factories.mjs";

async function run() {
  console.log("\n\x1b[1m🧪 05 — Edit & Overlay (multi-user)\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Setup: Sarah creates entry, shares with both, both accept ──
  section("Setup: Shared entry with 2 collaborators");

  const overlayEntryId = randomUUID();
  const { data: entry } = await sarah.client
    .from("items")
    .insert({
      id: overlayEntryId,
      user_id: sarah.userId,
      category: "events",
      status: "attended",
      start_date: "2025-07-04",
      data: {
        id: overlayEntryId,
        title: "Overlay Test Concert",
        eventType: "concert",
        artist: "The Overlays",
        venue: "Stubbs BBQ",
        city: "Austin",
        country: "US",
        snapshot1: "Sarah's original snap",
        rating: 5,
      },
    })
    .select()
    .single();

  if (!entry) {
    fail("Setup: create entry", "Insert failed");
    printSummary();
    process.exit(1);
  }

  // Share with Jason and Mike
  for (const { userId, name } of [{ userId: jason.userId, name: "Jason" }, { userId: mike.userId, name: "Mike" }]) {
    await sarah.client.from("collaborators").insert({
      entry_id: entry.id,
      entry_category: "events",
      owner_id: sarah.userId,
      collaborator_user_id: userId,
      status: "accepted",
      can_edit: true,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    });
  }
  pass("Setup: shared entry created", `id=${entry.id}, shared with Jason + Mike (pre-accepted)`);

  // ── Jason adds overlay ──
  section("Overlay creation");

  const jasonOverlay = {
    entry_id: entry.id,
    user_id: jason.userId,
    snapshot1: "Jason's amazing memory of this night",
    snapshot2: "The crowd was electric",
    rating: 4,
    updated_at: new Date().toISOString(),
  };

  const { data: jOverlay, error: jErr } = await jason.client
    .from("overlays")
    .upsert(jasonOverlay, { onConflict: "entry_id,user_id" })
    .select()
    .single();

  if (jErr) {
    fail("Jason adds overlay", jErr.message);
  } else {
    pass("Jason adds overlay", `id=${jOverlay.id}, rating=${jOverlay.rating}`);
  }

  // ── Mike adds overlay ──
  const mikeOverlay = {
    entry_id: entry.id,
    user_id: mike.userId,
    snapshot1: "Mike's perspective — great show",
    snapshot2: "Best encore I've seen",
    snapshot3: "The setlist was perfect",
    rating: 5,
    updated_at: new Date().toISOString(),
  };

  const { data: mOverlay, error: mErr } = await mike.client
    .from("overlays")
    .upsert(mikeOverlay, { onConflict: "entry_id,user_id" })
    .select()
    .single();

  if (mErr) {
    fail("Mike adds overlay", mErr.message);
  } else {
    pass("Mike adds overlay", `id=${mOverlay.id}, rating=${mOverlay.rating}`);
  }

  // ── Sarah (owner) reads all overlays ──
  section("Owner views all overlays");

  const { data: allOverlays, error: ownerReadErr } = await sarah.client
    .from("overlays")
    .select("*")
    .eq("entry_id", entry.id);

  if (ownerReadErr) {
    fail("Sarah reads all overlays", ownerReadErr.message);
  } else {
    const users = (allOverlays || []).map(o => o.user_id);
    if (users.includes(jason.userId) && users.includes(mike.userId)) {
      pass("Sarah reads all overlays", `${allOverlays.length} overlays (Jason + Mike)`);
    } else {
      fail("Sarah reads all overlays", `Only see overlays from: ${users.join(", ")}, expected both Jason and Mike`);
    }
  }

  // ── Jason reads peer overlays ──
  section("Collaborator views peer overlays");

  const { data: jasonReadOverlays, error: jReadErr } = await jason.client
    .from("overlays")
    .select("*")
    .eq("entry_id", entry.id);

  if (jReadErr) {
    fail("Jason reads overlays (peer visibility)", jReadErr.message);
  } else {
    const hasMikes = (jasonReadOverlays || []).some(o => o.user_id === mike.userId);
    if (hasMikes) {
      pass("Jason sees Mike's overlay (peer visibility)", `${jasonReadOverlays.length} total overlays visible`);
    } else {
      fail("Jason sees Mike's overlay (peer visibility)", "Mike's overlay not visible to Jason");
    }
  }

  // ── Jason edits shared entry structural fields ──
  section("Collaborator edits shared entry");

  // Read-merge-write pattern: read existing, merge new fields, preserve owner's reflections
  const { data: currentItem } = await jason.client
    .from("items")
    .select("data")
    .eq("id", entry.id)
    .single();

  if (!currentItem) {
    fail("Jason reads entry for editing", "Cannot read shared entry");
  } else {
    const mergedData = {
      ...currentItem.data,
      venue: "Stubb's BBQ (corrected spelling)",
      city: "Austin, TX",
      // Explicitly preserve owner's reflections
    };

    const { error: editErr } = await jason.client
      .from("items")
      .update({ data: mergedData, updated_at: new Date().toISOString() })
      .eq("id", entry.id);

    if (editErr) {
      fail("Jason edits shared entry (venue/city)", editErr.message);
    } else {
      pass("Jason edits shared entry (venue/city)", "Updated venue and city");
    }

    // Verify owner's reflections are preserved
    const { data: afterEdit } = await sarah.client
      .from("items")
      .select("data")
      .eq("id", entry.id)
      .single();

    if (afterEdit?.data?.snapshot1 === "Sarah's original snap" && afterEdit?.data?.rating === 5) {
      pass("Owner's reflections preserved after collab edit", `snapshot1="${afterEdit.data.snapshot1}", rating=${afterEdit.data.rating}`);
    } else {
      fail("Owner's reflections preserved after collab edit", `snapshot1="${afterEdit?.data?.snapshot1}", rating=${afterEdit?.data?.rating}`);
    }

    if (afterEdit?.data?.venue === "Stubb's BBQ (corrected spelling)") {
      pass("Collaborator's structural edit visible", `venue="${afterEdit.data.venue}"`);
    } else {
      fail("Collaborator's structural edit visible", `venue="${afterEdit?.data?.venue}"`);
    }
  }

  // ── Overlay upsert (no duplicates) ──
  section("Overlay upsert idempotency");

  const updatedJasonOverlay = {
    ...jasonOverlay,
    snapshot3: "Added a third memory on re-edit",
    rating: 5,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await jason.client
    .from("overlays")
    .upsert(updatedJasonOverlay, { onConflict: "entry_id,user_id" })
    .select()
    .single();

  if (upsertErr) {
    fail("Jason upserts overlay (update)", upsertErr.message);
  } else {
    // Verify no duplicates
    const { data: jasonOverlays } = await jason.client
      .from("overlays")
      .select("id")
      .eq("entry_id", entry.id)
      .eq("user_id", jason.userId);

    if (jasonOverlays && jasonOverlays.length === 1) {
      pass("Overlay upsert: no duplicates", "Exactly 1 overlay for Jason on this entry");
    } else {
      fail("Overlay upsert: no duplicates", `Found ${jasonOverlays?.length || 0} overlays (expected 1)`);
    }
  }

  // ── Sarah edits, Jason sees update ──
  section("Owner edit visible to collaborator");

  const { data: entryBeforeSarahEdit } = await sarah.client
    .from("items")
    .select("data")
    .eq("id", entry.id)
    .single();

  const sarahEditData = {
    ...entryBeforeSarahEdit.data,
    artist: "The Overlays (ft. Special Guest)",
  };

  await sarah.client
    .from("items")
    .update({ data: sarahEditData, updated_at: new Date().toISOString() })
    .eq("id", entry.id);

  const { data: jasonReread } = await jason.client
    .from("items")
    .select("data")
    .eq("id", entry.id)
    .single();

  if (jasonReread?.data?.artist === "The Overlays (ft. Special Guest)") {
    pass("Jason sees Sarah's edit on reload", `artist="${jasonReread.data.artist}"`);
  } else {
    fail("Jason sees Sarah's edit on reload", `artist="${jasonReread?.data?.artist}"`);
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
