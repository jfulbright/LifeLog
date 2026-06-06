import { randomUUID } from "crypto";
import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";

async function run() {
  console.log("\n\x1b[1m🧪 06 — Delete & Leave Shared Entries\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Setup: Sarah creates 2 entries, shares both with Jason and Mike ──
  section("Setup: Create shared entries for delete/leave tests");

  const entries = [];
  for (let i = 0; i < 2; i++) {
    const id = randomUUID();
    const { data: entry } = await sarah.client
      .from("items")
      .insert({
        id,
        user_id: sarah.userId,
        category: "events",
        status: "attended",
        data: { id, title: `Delete Test Entry ${i + 1}`, eventType: "concert", artist: `Band ${i + 1}`, city: "Houston" },
      })
      .select()
      .single();
    entries.push(entry);

    // Share with both, pre-accept
    for (const userId of [jason.userId, mike.userId]) {
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

    // Add overlays from both collaborators
    for (const { userId, name } of [{ userId: jason.userId, name: "Jason" }, { userId: mike.userId, name: "Mike" }]) {
      const client = userId === jason.userId ? jason.client : mike.client;
      await client.from("overlays").upsert({
        entry_id: entry.id,
        user_id: userId,
        snapshot1: `${name}'s memory of entry ${i + 1}`,
        rating: 4,
        updated_at: new Date().toISOString(),
      }, { onConflict: "entry_id,user_id" });
    }
  }

  if (entries.length < 2 || !entries[0] || !entries[1]) {
    fail("Setup", "Could not create 2 shared entries");
    printSummary();
    process.exit(1);
  }
  pass("Setup: 2 shared entries created", `ids=[${entries.map(e => e.id).join(", ")}]`);

  const [entryForDelete, entryForLeave] = entries;

  // ── Collaborator cannot delete ──
  section("Collaborator cannot delete entry");

  const { error: jasonDeleteErr } = await jason.client
    .from("items")
    .delete()
    .eq("id", entryForDelete.id);

  // Check if entry still exists
  const { data: stillExists } = await sarah.client
    .from("items")
    .select("id")
    .eq("id", entryForDelete.id)
    .maybeSingle();

  if (stillExists) {
    pass("Jason cannot delete shared entry (not owner)", jasonDeleteErr ? `Error: ${jasonDeleteErr.message}` : "Entry still exists after delete attempt");
  } else {
    fail("Jason cannot delete shared entry (not owner)", "Entry was actually deleted! RLS policy missing.");
  }

  // ── Jason "leaves" a shared entry (decline after accepting) ──
  section("Collaborator leaves shared entry");

  const { data: jasonCollab } = await jason.client
    .from("collaborators")
    .select("id")
    .eq("entry_id", entryForLeave.id)
    .eq("collaborator_user_id", jason.userId)
    .maybeSingle();

  if (!jasonCollab) {
    skip("Jason leaves shared entry", "No collab row found");
  } else {
    const { error: leaveErr } = await jason.client
      .from("collaborators")
      .update({ status: "declined" })
      .eq("id", jasonCollab.id);

    if (leaveErr) {
      fail("Jason leaves shared entry", leaveErr.message);
    } else {
      pass("Jason leaves shared entry", "status → declined");
    }

    // Verify entry disappears from Jason's readable items
    const { data: jasonRead } = await jason.client
      .from("items")
      .select("id")
      .eq("id", entryForLeave.id)
      .maybeSingle();

    if (!jasonRead) {
      pass("Entry invisible to Jason after leaving", "RLS correctly blocks");
    } else {
      fail("Entry invisible to Jason after leaving", "Entry still readable (RLS too permissive for declined?)");
    }

    // Verify entry still exists for Sarah and Mike
    const { data: sarahRead } = await sarah.client
      .from("items")
      .select("id")
      .eq("id", entryForLeave.id)
      .maybeSingle();

    const { data: mikeRead } = await mike.client
      .from("items")
      .select("id")
      .eq("id", entryForLeave.id)
      .maybeSingle();

    if (sarahRead) {
      pass("Entry still visible to owner (Sarah) after Jason leaves", "OK");
    } else {
      fail("Entry still visible to owner (Sarah) after Jason leaves", "Entry not readable by owner!");
    }

    if (mikeRead) {
      pass("Entry still visible to Mike after Jason leaves", "OK");
    } else {
      fail("Entry still visible to Mike after Jason leaves", "Entry not readable (Mike's collab may be affected)");
    }
  }

  // ── Owner deletes shared entry ──
  section("Owner deletes shared entry");

  // First check what happens to collaborator/overlay rows
  const { data: collabsBefore } = await sarah.client
    .from("collaborators")
    .select("id")
    .eq("entry_id", entryForDelete.id);

  const { data: overlaysBefore } = await sarah.client
    .from("overlays")
    .select("id")
    .eq("entry_id", entryForDelete.id);

  pass("Before delete", `${collabsBefore?.length || 0} collab rows, ${overlaysBefore?.length || 0} overlay rows`);

  const { error: ownerDeleteErr } = await sarah.client
    .from("items")
    .delete()
    .eq("id", entryForDelete.id);

  if (ownerDeleteErr) {
    fail("Sarah deletes shared entry", ownerDeleteErr.message);
  } else {
    // Verify entry is gone
    const { data: deletedCheck } = await sarah.client
      .from("items")
      .select("id")
      .eq("id", entryForDelete.id)
      .maybeSingle();

    if (!deletedCheck) {
      pass("Sarah deletes shared entry", "Entry removed");
    } else {
      fail("Sarah deletes shared entry", "Entry still exists after delete");
    }
  }

  // Check cascade behavior
  const { data: collabsAfter } = await sarah.client
    .from("collaborators")
    .select("id")
    .eq("entry_id", entryForDelete.id);

  const { data: overlaysAfter } = await sarah.client
    .from("overlays")
    .select("id")
    .eq("entry_id", entryForDelete.id);

  if (!collabsAfter || collabsAfter.length === 0) {
    pass("Collaborator rows cascaded on delete", "All removed");
  } else {
    fail("Collaborator rows NOT cascaded on delete", `${collabsAfter.length} orphaned rows (BUG: needs ON DELETE CASCADE)`);
  }

  if (!overlaysAfter || overlaysAfter.length === 0) {
    pass("Overlay rows cascaded on delete", "All removed");
  } else {
    fail("Overlay rows NOT cascaded on delete", `${overlaysAfter.length} orphaned rows (BUG: needs ON DELETE CASCADE)`);
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
