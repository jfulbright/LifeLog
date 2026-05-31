import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeMovie, makeEvent, insertItem } from "./helpers/factories.mjs";

async function createEntry(client, userId, item) {
  return insertItem(client, userId, item);
}

async function run() {
  console.log("\n\x1b[1m🧪 03 — Recommendation Flow\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Setup: Sarah creates entries to recommend ──
  section("Setup: Create recommendable entries");

  const movie = makeMovie({ data: { title: "Rec Test Movie", director: "Wes Anderson", year: 2025, genre: "Comedy" } });
  const event = makeEvent({ data: { title: "Rec Test Concert", eventType: "concert", artist: "Radiohead", venue: "ACL Live", city: "Austin" } });

  const { data: movieEntry } = await createEntry(sarah.client, sarah.userId, movie);
  const { data: eventEntry } = await createEntry(sarah.client, sarah.userId, event);

  if (!movieEntry || !eventEntry) {
    fail("Setup", "Could not create entries for recommendations");
    printSummary();
    process.exit(1);
  }
  pass("Setup: entries created", `movie=${movieEntry.id}, event=${eventEntry.id}`);

  // ── Direct recommendation (Sarah → Jason) ──
  section("Direct recommendation");

  const { data: directRec, error: directErr } = await sarah.client
    .from("recommendations")
    .insert({
      from_user_id: sarah.userId,
      entry_id: movieEntry.id,
      entry_category: "movies",
      to_user_id: jason.userId,
      to_ring_level: null,
      status: "active",
    })
    .select()
    .single();

  if (directErr) {
    fail("Sarah recommends movie to Jason (direct)", directErr.message);
  } else {
    pass("Sarah recommends movie to Jason (direct)", `rec_id=${directRec.id}`);
  }

  // Verify Jason sees it
  const { data: jasonRecs } = await jason.client
    .from("recommendations")
    .select("*")
    .eq("to_user_id", jason.userId)
    .eq("status", "active")
    .eq("entry_id", movieEntry.id);

  if (jasonRecs && jasonRecs.length === 1) {
    pass("Jason sees direct recommendation", `from ${jasonRecs[0].from_user_id}`);
  } else {
    fail("Jason sees direct recommendation", `Expected 1, got ${jasonRecs?.length || 0}`);
  }

  // ── Ring-based recommendation (Sarah → ring 4, which includes Jason and Mike) ──
  section("Ring-based recommendation");

  // Sarah's ring 4 = Friends. Jason is in ring 4, Mike is in ring 3 for Sarah.
  const { data: ringRec, error: ringErr } = await sarah.client
    .from("recommendations")
    .insert({
      from_user_id: sarah.userId,
      entry_id: eventEntry.id,
      entry_category: "events",
      to_user_id: null,
      to_ring_level: 4,
      status: "active",
    })
    .select()
    .single();

  if (ringErr) {
    fail("Sarah recommends event to ring 4", ringErr.message);
  } else {
    pass("Sarah recommends event to ring 4", `rec_id=${ringRec.id}`);
  }

  // Also recommend to ring 3 (Mike is in Sarah's ring 3)
  const { data: ring3Rec, error: ring3Err } = await sarah.client
    .from("recommendations")
    .insert({
      from_user_id: sarah.userId,
      entry_id: eventEntry.id,
      entry_category: "events",
      to_user_id: null,
      to_ring_level: 3,
      status: "active",
    })
    .select()
    .single();

  if (ring3Err) {
    fail("Sarah recommends event to ring 3", ring3Err.message);
  } else {
    pass("Sarah recommends event to ring 3", `rec_id=${ring3Rec.id}`);
  }

  // Verify ring-based resolution: check what ring Jason is in for Sarah
  const { data: sarahContacts } = await sarah.client
    .from("contacts")
    .select("display_name, ring_level, linked_user_id")
    .eq("owner_id", sarah.userId);

  const jasonContact = sarahContacts?.find(c => c.linked_user_id === jason.userId);
  const mikeContact = sarahContacts?.find(c => c.linked_user_id === mike.userId);

  if (jasonContact) {
    pass("Jason in Sarah's contacts", `ring=${jasonContact.ring_level}`);
  } else {
    fail("Jason in Sarah's contacts", "Not found");
  }

  if (mikeContact) {
    pass("Mike in Sarah's contacts", `ring=${mikeContact.ring_level}`);
  } else {
    fail("Mike in Sarah's contacts", "Not found");
  }

  // Verify Jason can see the ring-based recommendation (he's in ring 4)
  // Ring-based recs require app-level resolution (check contacts where you appear)
  // At DB level, Jason can read recs where to_ring_level matches his ring in Sarah's contacts
  const { data: jasonRingRecs } = await jason.client
    .from("recommendations")
    .select("*")
    .eq("from_user_id", sarah.userId)
    .eq("to_ring_level", jasonContact?.ring_level || 4)
    .eq("status", "active");

  if (jasonRingRecs && jasonRingRecs.length > 0) {
    pass("Jason sees ring-based rec", `${jasonRingRecs.length} rec(s) at ring ${jasonContact?.ring_level}`);
  } else {
    fail("Jason sees ring-based rec", "No ring-based recs visible");
  }

  // ── Accept recommendation (Jason accepts movie rec → creates new entry) ──
  section("Accept recommendation");

  if (directRec) {
    // Simulate accepting: mark rec as accepted and create new entry
    const { error: acceptErr } = await jason.client
      .from("recommendations")
      .update({ status: "accepted" })
      .eq("id", directRec.id);

    if (acceptErr) {
      fail("Jason accepts movie rec", acceptErr.message);
    } else {
      pass("Jason accepts movie rec", "status → accepted");
    }

    // Create new entry in Jason's account with recommendedBy provenance
    const { randomUUID } = await import("crypto");
    const newId = randomUUID();
    const { data: newEntry, error: newErr } = await jason.client
      .from("items")
      .insert({
        id: newId,
        user_id: jason.userId,
        category: "movies",
        status: "watchlist",
        data: {
          id: newId,
          title: movieEntry.data?.title || "Rec Test Movie",
          director: "Wes Anderson",
          year: 2025,
          genre: "Comedy",
          recommendedBy: [{ userId: sarah.userId, displayName: "Sarah" }],
        },
      })
      .select()
      .single();

    if (newErr) {
      fail("New entry created from rec acceptance", newErr.message);
    } else {
      const hasProvenance = newEntry.data?.recommendedBy?.length > 0;
      if (hasProvenance) {
        pass("New entry created from rec acceptance", `id=${newEntry.id}, has recommendedBy provenance`);
      } else {
        fail("New entry created from rec acceptance", "Missing recommendedBy provenance");
      }
    }
  } else {
    skip("Jason accepts movie rec", "No direct rec created");
  }

  // ── Dismiss recommendation (Mike dismisses) ──
  section("Dismiss recommendation");

  // Create a direct rec to Mike for dismissal testing
  const { data: mikeRec, error: mikeRecErr } = await sarah.client
    .from("recommendations")
    .insert({
      from_user_id: sarah.userId,
      entry_id: movieEntry.id,
      entry_category: "movies",
      to_user_id: mike.userId,
      to_ring_level: null,
      status: "active",
    })
    .select()
    .single();

  if (mikeRecErr) {
    fail("Create rec for Mike (dismiss test)", mikeRecErr.message);
  } else {
    const { error: dismissErr } = await mike.client
      .from("recommendations")
      .update({ status: "dismissed" })
      .eq("id", mikeRec.id);

    if (dismissErr) {
      fail("Mike dismisses rec", dismissErr.message);
    } else {
      pass("Mike dismisses rec", "status → dismissed");
    }

    // Verify no new entry was created in Mike's account
    const { data: mikeMovies } = await mike.client
      .from("items")
      .select("id, data")
      .eq("user_id", mike.userId)
      .eq("category", "movies");

    const fromRec = (mikeMovies || []).filter(m => m.data?.recommendedBy?.some(r => r.userId === sarah.userId));
    if (fromRec.length === 0) {
      pass("No entry created from dismissed rec", "Correct — dismiss means no action");
    } else {
      fail("No entry created from dismissed rec", `Found ${fromRec.length} entries with Sarah's recommendedBy`);
    }
  }

  // ── Verify active count ──
  section("Verify recommendation counts");

  const { data: sarahSent } = await sarah.client
    .from("recommendations")
    .select("id, status")
    .eq("from_user_id", sarah.userId);

  const active = (sarahSent || []).filter(r => r.status === "active").length;
  const accepted = (sarahSent || []).filter(r => r.status === "accepted").length;
  const dismissed = (sarahSent || []).filter(r => r.status === "dismissed").length;

  pass("Sarah's sent recs summary", `active=${active}, accepted=${accepted}, dismissed=${dismissed}, total=${sarahSent?.length || 0}`);

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
