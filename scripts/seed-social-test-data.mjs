/**
 * Seed script: populates shared events/travel entries across test users.
 * Run from project root: node scripts/seed-social-test-data.mjs
 *
 * Creates entries owned by Sarah and Jason, then shares them with
 * the other test users via collaborator rows. Also creates recommendations.
 */

import { createClient } from "../client/node_modules/@supabase/supabase-js/dist/index.mjs";

const SUPABASE_URL = "https://wzsbatztmcdungfzgrnm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1J2xtbjBInGL-h_XiS3asA_EjQFgKzF";

const USERS = {
  jason: { email: "jfulbright+user1@gmail.com", password: "TestPass123!" },
  sarah: { email: "jfulbright+user2@gmail.com", password: "TestPass123!" },
  mike: { email: "jfulbright+user3@gmail.com", password: "TestPass123!" },
};

async function getAuthClient(user) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Auth failed for ${user.email}: ${error.message}`);
  console.log(`  ✓ Logged in as ${user.email} (${data.user.id})`);
  return { client, userId: data.user.id };
}

function makeItem(id, category, status, data) {
  return { id, category, status, data: { ...data, id, status } };
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SARAH_EVENTS = [
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Taylor Swift — Eras Tour",
    subType: "concert",
    artist: "Taylor Swift",
    venue: "SoFi Stadium",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    startDate: "2025-08-09",
    snapshot1: "The friendship bracelets were everywhere — pure magic",
    snapshot2: "Cruel Summer live gave me actual chills",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Coldplay — Music of the Spheres",
    subType: "concert",
    artist: "Coldplay",
    venue: "MetLife Stadium",
    city: "East Rutherford",
    state: "New Jersey",
    country: "United States",
    startDate: "2025-06-14",
    snapshot1: "The LED wristbands syncing to Fix You was incredible",
    rating: 4,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Hamilton on Broadway",
    subType: "broadway",
    artist: "Lin-Manuel Miranda",
    venue: "Richard Rodgers Theatre",
    city: "New York",
    state: "New York",
    country: "United States",
    startDate: "2025-03-22",
    snapshot1: "The Room Where It Happens brought the house down",
    snapshot2: "Best birthday present ever",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "UFC 300",
    subType: "sports",
    venue: "T-Mobile Arena",
    city: "Las Vegas",
    state: "Nevada",
    country: "United States",
    startDate: "2025-04-13",
    snapshot1: "Alex Pereira's knockout was the craziest thing I've ever seen live",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Adele — Weekends with Adele",
    subType: "concert",
    artist: "Adele",
    venue: "The Colosseum at Caesars Palace",
    city: "Las Vegas",
    state: "Nevada",
    country: "United States",
    startDate: "2025-01-18",
    snapshot1: "She sang Someone Like You and the entire crowd was in tears",
    snapshot2: "Intimate venue — felt like a living room concert",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Dave Chappelle — Live",
    subType: "comedy",
    artist: "Dave Chappelle",
    venue: "Radio City Music Hall",
    city: "New York",
    state: "New York",
    country: "United States",
    startDate: "2025-09-05",
    snapshot1: "No phones allowed — made it feel special and present",
    rating: 4,
  }),
];

const SARAH_TRAVEL = [
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Rome Anniversary Trip",
    city: "Rome",
    country: "Italy",
    startDate: "2025-05-10",
    endDate: "2025-05-17",
    snapshot1: "Throwing coins in the Trevi Fountain at sunrise — just us",
    snapshot2: "The pasta at that tiny place near the Pantheon changed my life",
    snapshot3: "Getting lost in Trastevere was the best accident",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Tokyo Food Tour",
    city: "Tokyo",
    country: "Japan",
    startDate: "2025-10-01",
    endDate: "2025-10-10",
    snapshot1: "Tsukiji outer market at 6am — freshest sushi of my life",
    snapshot2: "Shibuya crossing at night feels like a movie",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Iceland Northern Lights",
    city: "Reykjavik",
    country: "Iceland",
    startDate: "2025-02-14",
    endDate: "2025-02-20",
    snapshot1: "The aurora came out on Valentine's Day — couldn't have planned it better",
    snapshot2: "Blue Lagoon was touristy but totally worth it",
    rating: 5,
  }),
];

const JASON_EVENTS = [
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Super Bowl LVIII",
    subType: "sports",
    venue: "Allegiant Stadium",
    city: "Las Vegas",
    state: "Nevada",
    country: "United States",
    startDate: "2025-02-09",
    snapshot1: "Being there for OT was absolutely electric",
    snapshot2: "Usher's halftime show was better than I expected",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Kendrick Lamar — The Big Steppers Tour",
    subType: "concert",
    artist: "Kendrick Lamar",
    venue: "Crypto.com Arena",
    city: "Los Angeles",
    state: "California",
    country: "United States",
    startDate: "2025-07-20",
    snapshot1: "HUMBLE live with the crowd going crazy — pure energy",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Austin City Limits 2025",
    subType: "festival",
    venue: "Zilker Park",
    city: "Austin",
    state: "Texas",
    country: "United States",
    startDate: "2025-10-10",
    endDate: "2025-10-12",
    snapshot1: "Three days of music, tacos, and Texas heat",
    snapshot2: "The Foo Fighters surprise set was legendary",
    rating: 4,
  }),
  makeItem(crypto.randomUUID(), "events", "attended", {
    title: "Cirque du Soleil — O",
    subType: "broadway",
    venue: "Bellagio",
    city: "Las Vegas",
    state: "Nevada",
    country: "United States",
    startDate: "2025-04-14",
    snapshot1: "The water stage is engineering insanity — jaw dropped the entire time",
    rating: 4,
  }),
];

const JASON_TRAVEL = [
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Barcelona Gaudi Tour",
    city: "Barcelona",
    country: "Spain",
    startDate: "2025-06-01",
    endDate: "2025-06-07",
    snapshot1: "La Sagrada Familia is beyond any photo — you have to see it in person",
    snapshot2: "Park Güell at sunset with sangria was peak life",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Bali Wellness Retreat",
    city: "Ubud",
    country: "Indonesia",
    startDate: "2025-03-15",
    endDate: "2025-03-22",
    snapshot1: "Rice terrace sunrise meditation — never felt more at peace",
    snapshot2: "The villa had an infinity pool over the jungle canopy",
    rating: 5,
  }),
  makeItem(crypto.randomUUID(), "travel", "visited", {
    title: "Swiss Alps Hiking",
    city: "Zermatt",
    country: "Switzerland",
    startDate: "2025-08-20",
    endDate: "2025-08-26",
    snapshot1: "Seeing the Matterhorn emerge from clouds after a 4-hour hike",
    snapshot2: "Fondue at the mountain hut — earned every calorie",
    rating: 5,
  }),
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seeding social test data...\n");

  // Authenticate all users
  console.log("Authenticating users...");
  const { client: sarahClient, userId: sarahId } = await getAuthClient(USERS.sarah);
  const { client: jasonClient, userId: jasonId } = await getAuthClient(USERS.jason);
  const { client: mikeClient, userId: mikeId } = await getAuthClient(USERS.mike);

  // ── Insert Sarah's entries ────────────────────────────────────────────────
  console.log("\nInserting Sarah's entries...");
  const sarahEntries = [...SARAH_EVENTS, ...SARAH_TRAVEL];
  for (const entry of sarahEntries) {
    const { error } = await sarahClient.from("items").upsert({
      id: entry.id,
      user_id: sarahId,
      category: entry.category,
      status: entry.status,
      start_date: entry.data.startDate || null,
      updated_at: new Date().toISOString(),
      data: entry.data,
    });
    if (error) console.error(`  ✗ ${entry.data.title}: ${error.message}`);
    else console.log(`  ✓ ${entry.data.title}`);
  }

  // ── Insert Jason's entries ────────────────────────────────────────────────
  console.log("\nInserting Jason's entries...");
  const jasonEntries = [...JASON_EVENTS, ...JASON_TRAVEL];
  for (const entry of jasonEntries) {
    const { error } = await jasonClient.from("items").upsert({
      id: entry.id,
      user_id: jasonId,
      category: entry.category,
      status: entry.status,
      start_date: entry.data.startDate || null,
      updated_at: new Date().toISOString(),
      data: entry.data,
    });
    if (error) console.error(`  ✗ ${entry.data.title}: ${error.message}`);
    else console.log(`  ✓ ${entry.data.title}`);
  }

  // ── Share Sarah's entries with Jason and Mike ─────────────────────────────
  console.log("\nCreating collaborations (Sarah → Jason & Mike)...");
  const sarahShareTargets = [
    { userId: jasonId, name: "Jason" },
    { userId: mikeId, name: "Mike" },
  ];

  for (const entry of sarahEntries) {
    for (const target of sarahShareTargets) {
      const { error } = await sarahClient.from("collaborators").upsert(
        {
          entry_id: entry.id,
          entry_category: entry.category,
          owner_id: sarahId,
          collaborator_user_id: target.userId,
          status: "pending",
          can_edit: true,
        },
        { ignoreDuplicates: false }
      );
      if (error) console.error(`  ✗ Share "${entry.data.title}" → ${target.name}: ${error.message}`);
      else console.log(`  ✓ Share "${entry.data.title}" → ${target.name}`);
    }
  }

  // ── Share Jason's entries with Sarah and Mike ─────────────────────────────
  console.log("\nCreating collaborations (Jason → Sarah & Mike)...");
  const jasonShareTargets = [
    { userId: sarahId, name: "Sarah" },
    { userId: mikeId, name: "Mike" },
  ];

  for (const entry of jasonEntries) {
    for (const target of jasonShareTargets) {
      const { error } = await jasonClient.from("collaborators").upsert(
        {
          entry_id: entry.id,
          entry_category: entry.category,
          owner_id: jasonId,
          collaborator_user_id: target.userId,
          status: "pending",
          can_edit: true,
        },
        { ignoreDuplicates: false }
      );
      if (error) console.error(`  ✗ Share "${entry.data.title}" → ${target.name}: ${error.message}`);
      else console.log(`  ✓ Share "${entry.data.title}" → ${target.name}`);
    }
  }

  // ── Create recommendations ────────────────────────────────────────────────
  console.log("\nCreating recommendations...");

  // Sarah recommends her top entries to Jason and Mike
  const sarahRecs = [SARAH_EVENTS[0], SARAH_EVENTS[4], SARAH_TRAVEL[0], SARAH_TRAVEL[1]];
  for (const entry of sarahRecs) {
    // Direct to Jason
    const { error: e1 } = await sarahClient.from("recommendations").insert({
      from_user_id: sarahId,
      entry_id: entry.id,
      entry_category: entry.category,
      to_user_id: jasonId,
      status: "active",
    });
    if (e1) console.error(`  ✗ Sarah → Jason rec "${entry.data.title}": ${e1.message}`);
    else console.log(`  ✓ Sarah recommends "${entry.data.title}" → Jason`);

    // Ring-based (ring 4 = Friends, which includes Mike)
    const { error: e2 } = await sarahClient.from("recommendations").insert({
      from_user_id: sarahId,
      entry_id: entry.id,
      entry_category: entry.category,
      to_ring_level: 4,
      status: "active",
    });
    if (e2) console.error(`  ✗ Sarah → Ring 4 rec "${entry.data.title}": ${e2.message}`);
    else console.log(`  ✓ Sarah recommends "${entry.data.title}" → Ring 4 (Friends)`);
  }

  // Jason recommends his top entries
  const jasonRecs = [JASON_EVENTS[0], JASON_TRAVEL[0], JASON_TRAVEL[2]];
  for (const entry of jasonRecs) {
    const { error: e1 } = await jasonClient.from("recommendations").insert({
      from_user_id: jasonId,
      entry_id: entry.id,
      entry_category: entry.category,
      to_user_id: mikeId,
      status: "active",
    });
    if (e1) console.error(`  ✗ Jason → Mike rec "${entry.data.title}": ${e1.message}`);
    else console.log(`  ✓ Jason recommends "${entry.data.title}" → Mike`);

    const { error: e2 } = await jasonClient.from("recommendations").insert({
      from_user_id: jasonId,
      entry_id: entry.id,
      entry_category: entry.category,
      to_user_id: sarahId,
      status: "active",
    });
    if (e2) console.error(`  ✗ Jason → Sarah rec "${entry.data.title}": ${e2.message}`);
    else console.log(`  ✓ Jason recommends "${entry.data.title}" → Sarah`);
  }

  // ── Add some overlays (Mike already accepted some and added snaps) ────────
  console.log("\nPre-accepting some entries for Mike and adding overlays...");

  // Mike accepts the first 3 Sarah entries
  const mikeAccepts = sarahEntries.slice(0, 3);
  for (const entry of mikeAccepts) {
    const { error } = await mikeClient
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("entry_id", entry.id)
      .eq("collaborator_user_id", mikeId);
    if (error) console.error(`  ✗ Mike accept "${entry.data.title}": ${error.message}`);
    else console.log(`  ✓ Mike accepted "${entry.data.title}"`);
  }

  // Mike adds overlays on first 2
  const mikeOverlays = [
    {
      entry_id: sarahEntries[0].id,
      snapshot1: "I caught a friendship bracelet from the pit — still wearing it",
      snapshot2: "The confetti during Shake It Off was cinematic",
      rating: 5,
    },
    {
      entry_id: sarahEntries[1].id,
      snapshot1: "Yellow was the perfect closer — whole stadium was glowing",
      rating: 4,
    },
  ];

  for (const overlay of mikeOverlays) {
    const { error } = await mikeClient.from("overlays").upsert(
      { ...overlay, user_id: mikeId, updated_at: new Date().toISOString() },
      { onConflict: "entry_id,user_id" }
    );
    if (error) console.error(`  ✗ Mike overlay on ${overlay.entry_id}: ${error.message}`);
    else console.log(`  ✓ Mike added overlay`);
  }

  console.log("\n✅ Seed complete! Summary:");
  console.log(`   Sarah: ${sarahEntries.length} entries (${SARAH_EVENTS.length} events + ${SARAH_TRAVEL.length} travel)`);
  console.log(`   Jason: ${jasonEntries.length} entries (${JASON_EVENTS.length} events + ${JASON_TRAVEL.length} travel)`);
  console.log(`   Collaborations: ${sarahEntries.length * 2 + jasonEntries.length * 2} total`);
  console.log(`   Recommendations: ${sarahRecs.length * 2 + jasonRecs.length * 2} total`);
  console.log(`   Mike pre-accepted: ${mikeAccepts.length} entries with ${mikeOverlays.length} overlays`);
  console.log("\n   Jason's Shared Experiences: ${sarahEntries.length} pending from Sarah");
  console.log(`   Mike's Shared Experiences: ${sarahEntries.length - 3} pending from Sarah + ${jasonEntries.length} pending from Jason`);
  console.log(`   Sarah's Shared Experiences: ${jasonEntries.length} pending from Jason`);
  console.log("");
}

main().catch(console.error);
