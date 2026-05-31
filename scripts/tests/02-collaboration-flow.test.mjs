import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeEvent, makeTravel, makeMovie, insertItem } from "./helpers/factories.mjs";

async function createEntry(client, userId, item) {
  return insertItem(client, userId, item);
}

async function run() {
  console.log("\n\x1b[1m🧪 02 — Collaboration Flow\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Sarah creates entries to share ──
  section("Setup: Sarah creates shareable entries");

  const event = makeEvent({ data: { title: "Collab Test Concert", eventType: "concert", artist: "The Testers", venue: "Test Arena", city: "Austin" } });
  const travel = makeTravel({ data: { title: "Collab Test Trip", city: "Barcelona", country: "Spain" } });
  const movie = makeMovie({ data: { title: "Collab Test Movie", director: "Test Director", year: 2025 } });

  const { data: eventEntry } = await createEntry(sarah.client, sarah.userId, event);
  const { data: travelEntry } = await createEntry(sarah.client, sarah.userId, travel);
  const { data: movieEntry } = await createEntry(sarah.client, sarah.userId, movie);

  if (!eventEntry || !travelEntry || !movieEntry) {
    fail("Setup", "Could not create test entries");
    printSummary();
    process.exit(1);
  }
  pass("Setup: entries created", `event=${eventEntry.id}, travel=${travelEntry.id}, movie=${movieEntry.id}`);

  // ── Share event with Jason AND Mike ──
  section("Share entry with multiple collaborators");

  const shareResults = [];
  for (const { userId, name } of [{ userId: jason.userId, name: "Jason" }, { userId: mike.userId, name: "Mike" }]) {
    const { data, error } = await sarah.client
      .from("collaborators")
      .insert({
        entry_id: eventEntry.id,
        entry_category: "events",
        owner_id: sarah.userId,
        collaborator_user_id: userId,
        status: "pending",
        can_edit: true,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      fail(`Share event with ${name}`, error.message);
    } else {
      pass(`Share event with ${name}`, `collab_id=${data.id}, status=${data.status}`);
      shareResults.push(data);
    }
  }

  // ── Verify both see pending rows ──
  section("Verify pending collaborations visible");

  const { data: jasonPending } = await jason.client
    .from("collaborators")
    .select("*")
    .eq("collaborator_user_id", jason.userId)
    .eq("entry_id", eventEntry.id)
    .eq("status", "pending");

  if (jasonPending && jasonPending.length === 1) {
    pass("Jason sees pending collab", `id=${jasonPending[0].id}`);
  } else {
    fail("Jason sees pending collab", `Expected 1, got ${jasonPending?.length || 0}`);
  }

  const { data: mikePending } = await mike.client
    .from("collaborators")
    .select("*")
    .eq("collaborator_user_id", mike.userId)
    .eq("entry_id", eventEntry.id)
    .eq("status", "pending");

  if (mikePending && mikePending.length === 1) {
    pass("Mike sees pending collab", `id=${mikePending[0].id}`);
  } else {
    fail("Mike sees pending collab", `Expected 1, got ${mikePending?.length || 0}`);
  }

  // ── Jason accepts ──
  section("Accept collaboration");

  if (jasonPending && jasonPending.length > 0) {
    const { data: accepted, error } = await jason.client
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", jasonPending[0].id)
      .select()
      .single();

    if (error) {
      fail("Jason accepts collab", error.message);
    } else if (accepted.status === "accepted") {
      pass("Jason accepts collab", `status=${accepted.status}`);
    } else {
      fail("Jason accepts collab", `status=${accepted.status}, expected accepted`);
    }

    // Verify Jason can now read the entry
    const { data: readEntry } = await jason.client
      .from("items")
      .select("id, data")
      .eq("id", eventEntry.id)
      .maybeSingle();

    if (readEntry) {
      pass("Jason reads shared entry after accept", `title="${readEntry.data?.title}"`);
    } else {
      fail("Jason reads shared entry after accept", "Entry not readable via RLS");
    }
  } else {
    skip("Jason accepts collab", "No pending collab found");
  }

  // ── Mike declines ──
  section("Decline collaboration");

  if (mikePending && mikePending.length > 0) {
    const { data: declined, error } = await mike.client
      .from("collaborators")
      .update({ status: "declined" })
      .eq("id", mikePending[0].id)
      .select()
      .single();

    if (error) {
      fail("Mike declines collab", error.message);
    } else if (declined.status === "declined") {
      pass("Mike declines collab", `status=${declined.status}`);
    } else {
      fail("Mike declines collab", `status=${declined.status}, expected declined`);
    }

    // Verify Mike can NOT read the entry (RLS should block declined collaborators)
    const { data: readEntry } = await mike.client
      .from("items")
      .select("id")
      .eq("id", eventEntry.id)
      .maybeSingle();

    if (!readEntry) {
      pass("Mike cannot read entry after decline", "RLS correctly blocks");
    } else {
      fail("Mike cannot read entry after decline", "Entry still readable (RLS too permissive?)");
    }
  } else {
    skip("Mike declines collab", "No pending collab found");
  }

  // ── Share travel with Jason only → accept ──
  section("Share travel entry (single collaborator)");

  const { data: travelCollab, error: travelShareErr } = await sarah.client
    .from("collaborators")
    .insert({
      entry_id: travelEntry.id,
      entry_category: "travel",
      owner_id: sarah.userId,
      collaborator_user_id: jason.userId,
      status: "pending",
      can_edit: true,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (travelShareErr) {
    fail("Share travel with Jason", travelShareErr.message);
  } else {
    pass("Share travel with Jason", `collab_id=${travelCollab.id}`);

    const { error: acceptErr } = await jason.client
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", travelCollab.id);

    if (acceptErr) {
      fail("Jason accepts travel collab", acceptErr.message);
    } else {
      pass("Jason accepts travel collab", "accepted");
    }
  }

  // ── Share movie with both → both accept ──
  section("Share movie with both (multi-accept)");

  for (const { client, userId, name } of [jason, mike]) {
    const { data: movieCollab, error: shareErr } = await sarah.client
      .from("collaborators")
      .insert({
        entry_id: movieEntry.id,
        entry_category: "movies",
        owner_id: sarah.userId,
        collaborator_user_id: userId,
        status: "pending",
        can_edit: true,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shareErr) {
      fail(`Share movie with ${name}`, shareErr.message);
      continue;
    }

    const { error: acceptErr } = await client
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", movieCollab.id);

    if (acceptErr) {
      fail(`${name} accepts movie collab`, acceptErr.message);
    } else {
      pass(`${name} accepts movie collab`, "accepted");
    }
  }

  // ── Verify getIncomingCollaborations equivalent ──
  section("Verify collaboration counts");

  const { data: jasonAccepted } = await jason.client
    .from("collaborators")
    .select("id, entry_category")
    .eq("collaborator_user_id", jason.userId)
    .eq("status", "accepted");

  if (jasonAccepted && jasonAccepted.length >= 3) {
    const cats = [...new Set(jasonAccepted.map(c => c.entry_category))];
    pass("Jason accepted collabs count", `${jasonAccepted.length} across [${cats.join(", ")}]`);
  } else {
    fail("Jason accepted collabs count", `Expected ≥3, got ${jasonAccepted?.length || 0}`);
  }

  const { data: mikeAccepted } = await mike.client
    .from("collaborators")
    .select("id, entry_category")
    .eq("collaborator_user_id", mike.userId)
    .eq("status", "accepted");

  // Mike accepted movie but declined event
  if (mikeAccepted && mikeAccepted.length >= 1) {
    pass("Mike accepted collabs count", `${mikeAccepted.length} (declined event, accepted movie)`);
  } else {
    fail("Mike accepted collabs count", `Expected ≥1, got ${mikeAccepted?.length || 0}`);
  }

  const summary = printSummary();
  return { results: getResults(), summary, entryIds: { event: eventEntry.id, travel: travelEntry.id, movie: movieEntry.id } };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
