import { randomUUID } from "crypto";
import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";

async function run() {
  console.log("\n\x1b[1m🧪 07 — Isolation & Security (RLS Negative Tests)\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Setup: Sarah creates a private entry (not shared) ──
  section("Setup: Private entries");

  const privateId = randomUUID();
  const { data: privateEntry } = await sarah.client
    .from("items")
    .insert({
      id: privateId,
      user_id: sarah.userId,
      category: "movies",
      status: "watched",
      data: { id: privateId, title: "Sarah's Private Movie", director: "Private Director", year: 2025, rating: 5, snapshot1: "Private memory" },
    })
    .select()
    .single();

  if (!privateEntry) {
    fail("Setup: Sarah's private entry", "Insert failed");
    printSummary();
    process.exit(1);
  }
  pass("Setup: Sarah's private entry created", `id=${privateEntry.id}`);

  // ── Test: Mike cannot read Sarah's unshared entry ──
  section("Item isolation");

  const { data: mikeReadPrivate } = await mike.client
    .from("items")
    .select("id, data")
    .eq("id", privateEntry.id)
    .maybeSingle();

  if (!mikeReadPrivate) {
    pass("Mike cannot read Sarah's private entry", "RLS blocks correctly");
  } else {
    fail("Mike cannot read Sarah's private entry", `Mike can read it! title="${mikeReadPrivate.data?.title}"`);
  }

  // ── Test: Mike cannot read overlays on entries he's not connected to ──
  section("Overlay isolation");

  // Sarah adds an overlay on her own entry (she can do this as owner)
  await sarah.client.from("overlays").upsert({
    entry_id: privateEntry.id,
    user_id: sarah.userId,
    snapshot1: "Owner's private overlay",
    rating: 5,
    updated_at: new Date().toISOString(),
  }, { onConflict: "entry_id,user_id" });

  const { data: mikeOverlayRead } = await mike.client
    .from("overlays")
    .select("*")
    .eq("entry_id", privateEntry.id);

  if (!mikeOverlayRead || mikeOverlayRead.length === 0) {
    pass("Mike cannot read overlays on unrelated entry", "RLS blocks correctly");
  } else {
    fail("Mike cannot read overlays on unrelated entry", `Mike sees ${mikeOverlayRead.length} overlay(s)`);
  }

  // ── Test: Pending collaborator cannot UPDATE shared entry ──
  section("Pending collaborator restrictions");

  // Sarah shares with Mike but leaves as pending
  const pendingId = randomUUID();
  const { data: sharedForPendingTest } = await sarah.client
    .from("items")
    .insert({
      id: pendingId,
      user_id: sarah.userId,
      category: "travel",
      status: "visited",
      data: { id: pendingId, title: "Pending Test Trip", city: "Rome", country: "Italy" },
    })
    .select()
    .single();

  await sarah.client.from("collaborators").insert({
    entry_id: sharedForPendingTest.id,
    entry_category: "travel",
    owner_id: sarah.userId,
    collaborator_user_id: mike.userId,
    status: "pending",
    can_edit: true,
    invited_at: new Date().toISOString(),
  });

  // Mike tries to update while still pending
  const { error: pendingUpdateErr } = await mike.client
    .from("items")
    .update({ data: { title: "HACKED BY PENDING USER", city: "Rome", country: "Italy" } })
    .eq("id", sharedForPendingTest.id);

  // Check if the update actually took effect
  const { data: afterPendingUpdate } = await sarah.client
    .from("items")
    .select("data")
    .eq("id", sharedForPendingTest.id)
    .single();

  if (afterPendingUpdate?.data?.title === "Pending Test Trip") {
    pass("Pending collaborator cannot UPDATE entry", pendingUpdateErr ? `Error: ${pendingUpdateErr.message}` : "Update had no effect (0 rows matched)");
  } else {
    fail("Pending collaborator cannot UPDATE entry", `Title changed to "${afterPendingUpdate?.data?.title}" — RLS allows pending updates!`);
  }

  // ── Test: User cannot insert collaborator row on entry they don't own ──
  section("Collaborator row insertion restrictions");

  const { error: mikeInsertCollabErr } = await mike.client
    .from("collaborators")
    .insert({
      entry_id: privateEntry.id,
      entry_category: "movies",
      owner_id: sarah.userId,
      collaborator_user_id: jason.userId,
      status: "pending",
      can_edit: true,
      invited_at: new Date().toISOString(),
    });

  if (mikeInsertCollabErr) {
    pass("Non-owner cannot insert collaborator row", `Error: ${mikeInsertCollabErr.message}`);
  } else {
    // Check if it actually got inserted
    const { data: badCollab } = await sarah.client
      .from("collaborators")
      .select("id")
      .eq("entry_id", privateEntry.id)
      .eq("collaborator_user_id", jason.userId)
      .maybeSingle();

    if (!badCollab) {
      pass("Non-owner cannot insert collaborator row", "Insert returned no error but row not visible (RLS on SELECT)");
    } else {
      fail("Non-owner cannot insert collaborator row", "Row was created! Cleanup needed. RLS INSERT policy too permissive.");
      // Cleanup
      await sarah.client.from("collaborators").delete().eq("id", badCollab.id);
    }
  }

  // ── Test: User cannot delete another user's overlay ──
  section("Overlay deletion restrictions");

  // First ensure Jason has an overlay on one of his accepted shared entries
  const { data: jasonAccepted } = await jason.client
    .from("collaborators")
    .select("entry_id")
    .eq("collaborator_user_id", jason.userId)
    .eq("status", "accepted")
    .limit(1);

  if (jasonAccepted && jasonAccepted.length > 0) {
    const targetEntry = jasonAccepted[0].entry_id;

    // Jason creates an overlay
    await jason.client.from("overlays").upsert({
      entry_id: targetEntry,
      user_id: jason.userId,
      snapshot1: "Jason's overlay for security test",
      rating: 3,
      updated_at: new Date().toISOString(),
    }, { onConflict: "entry_id,user_id" });

    // Mike tries to delete Jason's overlay
    const { error: mikeDeleteOverlayErr } = await mike.client
      .from("overlays")
      .delete()
      .eq("entry_id", targetEntry)
      .eq("user_id", jason.userId);

    // Check if overlay still exists
    const { data: jasonOverlayStillExists } = await jason.client
      .from("overlays")
      .select("id")
      .eq("entry_id", targetEntry)
      .eq("user_id", jason.userId)
      .maybeSingle();

    if (jasonOverlayStillExists) {
      pass("Mike cannot delete Jason's overlay", mikeDeleteOverlayErr ? `Error: ${mikeDeleteOverlayErr.message}` : "Delete had no effect");
    } else {
      fail("Mike cannot delete Jason's overlay", "Overlay was deleted! RLS DELETE policy too permissive.");
    }
  } else {
    skip("Overlay deletion test", "Jason has no accepted collaborations");
  }

  // ── Test: Declined collaborator cannot read entry ──
  section("Declined collaborator isolation");

  // Use the pending test entry — decline Mike, then try to read
  const { data: mikeCollabOnPendingEntry } = await mike.client
    .from("collaborators")
    .select("id")
    .eq("entry_id", sharedForPendingTest.id)
    .eq("collaborator_user_id", mike.userId)
    .maybeSingle();

  if (mikeCollabOnPendingEntry) {
    await mike.client
      .from("collaborators")
      .update({ status: "declined" })
      .eq("id", mikeCollabOnPendingEntry.id);

    const { data: declinedRead } = await mike.client
      .from("items")
      .select("id")
      .eq("id", sharedForPendingTest.id)
      .maybeSingle();

    if (!declinedRead) {
      pass("Declined collaborator cannot read entry", "RLS correctly blocks");
    } else {
      fail("Declined collaborator cannot read entry", "Entry still readable after declining");
    }
  } else {
    skip("Declined collaborator isolation", "No collab row found");
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
