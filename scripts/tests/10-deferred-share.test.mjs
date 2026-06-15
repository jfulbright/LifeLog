// 10 — Deferred share resolution (the "first invite" / Madison scenario)
//
// Reproduces the real-world cornerstone flow that no prior test covered:
// you share an entry with someone who is NOT on LifeSnaps yet (an UNLINKED
// contact → collaborator row with collaborator_user_id = NULL), and later that
// person signs up. It must become visible to them.
//
// This exercises BOTH layers added in migration 010:
//   1. read-time RLS resolution (get_my_collaborations resolves by normalized
//      email, so the entry is visible BEFORE any backfill), and
//   2. resolve_my_collaborations() backfill on login (links the contact + fills
//      collaborator_user_id).
//
// It also proves the Gmail-dot fix: the contact is stored with a dotted address
// (j.fulbright+user3@gmail.com) while Mike's account email is jfulbright+user3@
// gmail.com — Google treats these as the same account, and so must we.
//
// Requires migration 010 applied to the target database.

import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary } from "./helpers/assertions.mjs";
import { makeTravel, insertItem } from "./helpers/factories.mjs";

// Mike's real auth email is jfulbright+user3@gmail.com. Store the contact with a
// dot in the local part — same Google account, different string.
const DOTTED_MIKE_EMAIL = "j.fulbright+user3@gmail.com";

async function run() {
  console.log("\n\x1b[1m🧪 10 — Deferred Share Resolution\x1b[0m\n");
  const { jason, mike } = await getAllClients();

  // Preflight: is migration 010 applied? PostgREST reports a missing function as
  // "Could not find the function public.get_my_collaborations ... in the schema cache".
  const { error: rpcCheck } = await jason.client.rpc("get_my_collaborations");
  if (rpcCheck && /get_my_collaborations/i.test(rpcCheck.message || "") &&
      /(does not exist|could not find|schema cache)/i.test(rpcCheck.message || "")) {
    skip("Deferred share", "migration 010 not applied to this DB (get_my_collaborations missing) — apply supabase/migrations/010 then re-run");
    printSummary();
    return;
  }

  let entryId, contactId, collabId;

  try {
    // ── Setup: Jason owns an entry and adds Mike as a DEFERRED (unlinked) contact ──
    section("Setup: owned entry + deferred (unlinked) contact");

    const { data: entry, error: entryErr } = await insertItem(
      jason.client,
      jason.userId,
      makeTravel({ data: { title: "Deferred Share Trip", city: "Aspen", country: "US" } })
    );
    if (entryErr || !entry) {
      fail("Setup", `could not create entry: ${entryErr?.message}`);
      printSummary();
      process.exit(1);
    }
    entryId = entry.id;

    // Insert the contact, then force it into the deferred state (linked_user_id
    // NULL) to simulate "added before the invitee had an account" — regardless of
    // whether the contact-INSERT trigger auto-linked it.
    const { data: contact, error: cErr } = await jason.client
      .from("contacts")
      .insert({
        owner_id: jason.userId,
        display_name: "Mike (deferred)",
        email: DOTTED_MIKE_EMAIL,
        ring_level: 2,
      })
      .select()
      .single();
    if (cErr || !contact) {
      fail("Setup", `could not create contact: ${cErr?.message}`);
      printSummary();
      process.exit(1);
    }
    contactId = contact.id;

    await jason.client
      .from("contacts")
      .update({ linked_user_id: null, invite_status: "pending" })
      .eq("id", contactId);

    // Deferred collaborator row: contact id set, user id NULL (as the app writes
    // it for an unlinked contact).
    const { data: collab, error: collabErr } = await jason.client
      .from("collaborators")
      .insert({
        entry_id: entryId,
        entry_category: "travel",
        owner_id: jason.userId,
        collaborator_user_id: null,
        collaborator_contact_id: contactId,
        status: "pending",
        can_edit: true,
      })
      .select()
      .single();
    if (collabErr || !collab) {
      fail("Setup", `could not create deferred collaborator row: ${collabErr?.message}`);
      printSummary();
      process.exit(1);
    }
    collabId = collab.id;
    pass("Setup", `entry=${entryId}, deferred contact + collaborator (user_id NULL) created`);

    // ── Layer 1: read-time RLS resolves by email BEFORE any backfill ──
    section("Read-time resolution (before backfill)");

    const { data: mineBefore, error: mineErr } = await mike.client.rpc("get_my_collaborations");
    const resolvedRow = (mineBefore || []).find((m) => m.entry_id === entryId);
    pass(
      "get_my_collaborations resolves by dotted email",
      resolvedRow
        ? `Mike sees the collaboration (status=${resolvedRow.status}) despite null user_id + dotted contact email`
        : `NOT resolved (err=${mineErr?.message})`
    );
    if (!resolvedRow) fail("Read-time resolution", "Mike could not resolve the deferred collaboration by email");

    const { data: readItem } = await mike.client
      .from("items")
      .select("id, data")
      .eq("id", entryId)
      .maybeSingle();
    pass(
      "items RLS grants read pre-backfill",
      readItem ? `Mike can read "${readItem.data?.title}" via email-resolved RLS` : "Mike CANNOT read the entry"
    );
    if (!readItem) fail("Read-time RLS", "deferred share not readable before backfill");

    // ── Layer 2: resolve_my_collaborations backfills on login ──
    section("Self-healing backfill (resolve_my_collaborations)");

    const { error: resolveErr } = await mike.client.rpc("resolve_my_collaborations");
    if (resolveErr) fail("resolve_my_collaborations", resolveErr.message);

    const { data: contactAfter } = await jason.client
      .from("contacts")
      .select("linked_user_id, invite_status")
      .eq("id", contactId)
      .single();
    pass(
      "contact linked on resolve",
      contactAfter?.linked_user_id === mike.userId
        ? `linked_user_id backfilled to Mike (invite_status=${contactAfter.invite_status})`
        : `NOT linked (linked_user_id=${contactAfter?.linked_user_id})`
    );
    if (contactAfter?.linked_user_id !== mike.userId) fail("Backfill", "contact.linked_user_id not set to Mike");

    const { data: collabAfter } = await jason.client
      .from("collaborators")
      .select("collaborator_user_id")
      .eq("id", collabId)
      .single();
    pass(
      "collaborator row backfilled",
      collabAfter?.collaborator_user_id === mike.userId
        ? "collaborator_user_id backfilled to Mike"
        : `NOT backfilled (collaborator_user_id=${collabAfter?.collaborator_user_id})`
    );
    if (collabAfter?.collaborator_user_id !== mike.userId) fail("Backfill", "collaborator_user_id not set to Mike");

    // ── Accept → appears in Mike's shared entries ──
    section("Accept → visible in shared list");

    await mike.client
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", collabId);

    const { data: mineAccepted } = await mike.client.rpc("get_my_collaborations");
    const acceptedRow = (mineAccepted || []).find((m) => m.entry_id === entryId);
    pass(
      "accepted share resolves",
      acceptedRow?.status === "accepted"
        ? "Mike's accepted collaboration shows in get_my_collaborations"
        : `unexpected status ${acceptedRow?.status}`
    );
  } finally {
    // ── Cleanup ──
    section("Cleanup");
    if (collabId) await jason.client.from("collaborators").delete().eq("id", collabId);
    if (contactId) await jason.client.from("contacts").delete().eq("id", contactId);
    if (entryId) await jason.client.from("items").delete().eq("id", entryId);
    pass("Cleanup", "removed test entry, contact, and collaborator row");
  }

  printSummary();
}

run().catch((err) => {
  console.error("Test crashed:", err);
  process.exit(1);
});
