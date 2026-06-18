// 11 — Travel visibility user journeys (rings + individual + collaborator)
//
// Exercises the TRV-VIEW "Viewer" journeys end-to-end against the RLS enforcement
// added in migration 011. Visibility is granted when the owner either
//   (a) shared with a ring the owner placed the viewer in (data.visibilityRings), OR
//   (b) named the viewer individually (data.visibilityContacts) — resolved by
//       linked_user_id OR normalized email (so not-yet-linked contacts work too).
// Rule under test: a collaboration contributor automatically has visibility
// (the form unions collaborators into visibilityContacts; the seed mirrors this).
//
// Owner is Jason. In Jason's contacts: Mike = ring 2, Sarah = ring 4. Each journey
// asserts BOTH the positive (who should see) and the negative (who must NOT).
//
// Requires migrations 010 + 011 applied to the target database.

import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, skip, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeTravel, insertItem } from "./helpers/factories.mjs";

// A dotted alias of Mike's real account email (jfulbright+user3@gmail.com).
// normalize_email() strips Gmail dots, so this resolves to the same account while
// staying a distinct raw string (satisfies contacts UNIQUE(owner_id, email)).
const DOTTED_MIKE_EMAIL = "j.fulbright+user3@gmail.com";

async function run() {
  console.log("\n\x1b[1m🧪 11 — Travel Visibility User Journeys\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // Preflight: is migration 011 applied?
  const { error: rpcCheck } = await jason.client.rpc("get_my_viewer_contacts");
  if (rpcCheck && /get_my_viewer_contacts/i.test(rpcCheck.message || "") &&
      /(does not exist|could not find|schema cache)/i.test(rpcCheck.message || "")) {
    skip("Travel visibility", "migration 011 not applied (get_my_viewer_contacts missing) — apply supabase/migrations/011 then re-run");
    return { results: getResults(), summary: printSummary() };
  }

  // Resolve Jason's contact ids + rings for Mike (ring 2) and Sarah (ring 4).
  const { data: jasonContacts } = await jason.client
    .from("contacts").select("id, ring_level, linked_user_id").eq("owner_id", jason.userId);
  const mikeC = jasonContacts?.find((c) => c.linked_user_id === mike.userId);
  const sarahC = jasonContacts?.find((c) => c.linked_user_id === sarah.userId);
  if (!mikeC || !sarahC) {
    skip("Travel visibility", "seed contacts (Mike/Sarah in Jason's contacts) not found — run the seed first");
    return { results: getResults(), summary: printSummary() };
  }

  const created = [];
  let dottedContactId, collabId;

  // Helper: does `viewer` get the row back under RLS?
  const canSee = async (viewer, id) => {
    const { data } = await viewer.client.from("items").select("id").eq("id", id).maybeSingle();
    return !!data;
  };
  // Assert a full journey: who should see, who must not.
  const journey = async (label, id, { visible = [], hidden = [] }) => {
    for (const v of visible) {
      if (await canSee(v, id)) pass(`${label}: ${v.name} (ring ${ringOf(v)}) sees it`, "");
      else fail(`${label}: ${v.name} sees it`, "got no row — visibility not granted");
    }
    for (const v of hidden) {
      if (!(await canSee(v, id))) pass(`${label}: ${v.name} (ring ${ringOf(v)}) is correctly blocked`, "negative case");
      else fail(`${label}: ${v.name} is correctly blocked`, "leak — RLS too permissive");
    }
  };
  const ringOf = (v) => (v === mike ? mikeC.ring_level : v === sarah ? sarahC.ring_level : "?");

  const addTrip = async (title, data) => {
    const { data: row, error } = await insertItem(jason.client, jason.userId, makeTravel({ data: { title, ...data } }));
    if (error || !row) { fail(`Setup: ${title}`, error?.message || "insert failed"); throw new Error("setup"); }
    created.push(row.id);
    return row.id;
  };

  try {
    // ── TRV-VIEW: "Everyone" trip — every ring sees it ─────────────────────────
    section('"Everyone" trip — visibilityRings [1,2,3,4]');
    const everyone = await addTrip("Everyone Trip", { visibilityRings: [1, 2, 3, 4], visibilityContacts: [] });
    await journey("Everyone", everyone, { visible: [mike, sarah], hidden: [] });

    // ── "Immediate family" trip [1,2] — Mike (2) sees, Sarah (4) blocked ───────
    section('"Immediate family" trip — visibilityRings [1,2]');
    const family = await addTrip("Family Trip", { visibilityRings: [1, 2], visibilityContacts: [] });
    await journey("Immediate family", family, { visible: [mike], hidden: [sarah] });

    // ── "Friends only" trip [4] — Sarah (4) sees, Mike (2) blocked ─────────────
    section('"Friends only" trip — visibilityRings [4]');
    const friends = await addTrip("Friends Trip", { visibilityRings: [4], visibilityContacts: [] });
    await journey("Friends only", friends, { visible: [sarah], hidden: [mike] });

    // ── Collaborator auto-visibility: rings exclude everyone, but Sarah is named ─
    // individually (the collaborate ⟹ visible rule) AND has a collaborator row.
    section("Collaborator auto-visibility — partner-only rings, Sarah named individually");
    const collabTrip = await addTrip("Collab Trip", { visibilityRings: [1], visibilityContacts: [sarahC.id] });
    const { data: collab, error: collabErr } = await jason.client.from("collaborators").insert({
      entry_id: collabTrip, entry_category: "travel", owner_id: jason.userId,
      collaborator_user_id: sarah.userId, status: "accepted", can_edit: true,
      invited_at: new Date().toISOString(), accepted_at: new Date().toISOString(),
    }).select("id").single();
    if (collabErr) fail("Setup: collaborator row", collabErr.message);
    else collabId = collab.id;
    await journey("Collaborator", collabTrip, { visible: [sarah], hidden: [mike] });

    // ── "Only Me" trip — empty rings + contacts grants nobody ──────────────────
    section('"Only Me" trip — empty visibility');
    const onlyMe = await addTrip("Private Trip", { visibilityRings: [], visibilityContacts: [] });
    await journey("Only Me", onlyMe, { visible: [], hidden: [mike, sarah] });

    // ── Deferred individual: unlinked contact resolves by normalized email ─────
    section("Deferred individual — unlinked contact resolves by email");
    const { data: dotted, error: ce } = await jason.client
      .from("contacts")
      .insert({ owner_id: jason.userId, email: DOTTED_MIKE_EMAIL, display_name: "Mike (dotted)", ring_level: 4 })
      .select().single();
    if (ce || !dotted) { fail("Setup: dotted contact", ce?.message || "insert failed"); throw new Error("setup"); }
    dottedContactId = dotted.id;
    // Force back to deferred (the on_contact_created_link trigger auto-links it
    // because Mike's account exists — we want to prove read-time email resolution).
    await jason.client.from("contacts").update({ linked_user_id: null, invite_status: "local_only" }).eq("id", dotted.id);

    const deferred = await addTrip("Deferred-individual Trip", { visibilityRings: [], visibilityContacts: [dotted.id] });
    if (await canSee(mike, deferred)) pass("Deferred individual: Mike sees via UNLINKED contact", "email resolution, no linked_user_id");
    else fail("Deferred individual: Mike sees via UNLINKED contact", "got no row — normalized-email match failed");
    if (!(await canSee(sarah, deferred))) pass("Deferred individual: Sarah is correctly blocked", "negative case");
    else fail("Deferred individual: Sarah is correctly blocked", "leak — unrelated viewer saw it");
  } catch (err) {
    if (err.message !== "setup") fail("Unexpected error", err.message);
  } finally {
    if (collabId) await jason.client.from("collaborators").delete().eq("id", collabId);
    if (created.length) await jason.client.from("items").delete().in("id", created);
    if (dottedContactId) await jason.client.from("contacts").delete().eq("id", dottedContactId);
  }

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output?.summary?.failed > 0) process.exit(1);

export default run;
