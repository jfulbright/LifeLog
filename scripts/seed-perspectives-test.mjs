/**
 * Seed script: Adds 3-person overlay contributions to shared events.
 * Ensures collaborations are accepted and each person adds snaps + ratings.
 *
 * Run: node scripts/seed-perspectives-test.mjs
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

async function main() {
  console.log("\n🎬 Seeding 3-person perspectives on shared events...\n");

  const { client: jasonClient, userId: jasonId } = await getAuthClient(USERS.jason);
  const { client: sarahClient, userId: sarahId } = await getAuthClient(USERS.sarah);
  const { client: mikeClient, userId: mikeId } = await getAuthClient(USERS.mike);

  // Find Sarah's event entries (she owns UFC 300, Eras Tour, Hamilton, etc.)
  const { data: sarahEvents } = await sarahClient
    .from("items")
    .select("id, data, category")
    .eq("user_id", sarahId)
    .eq("category", "events");

  console.log(`\nFound ${sarahEvents?.length || 0} Sarah events`);

  // Pick target events for multi-person overlays
  const targetTitles = ["UFC 300", "Taylor Swift", "Hamilton on Broadway", "Coldplay"];
  const targetEvents = (sarahEvents || []).filter((e) =>
    targetTitles.some((t) => e.data?.title?.includes(t))
  );

  console.log(`Targeting ${targetEvents.length} events for 3-person perspectives:`);
  targetEvents.forEach((e) => console.log(`  • ${e.data.title}`));

  // Ensure Jason and Mike have accepted collaborations on these
  console.log("\nAccepting collaborations...");
  for (const entry of targetEvents) {
    for (const [name, client, userId] of [["Jason", jasonClient, jasonId], ["Mike", mikeClient, mikeId]]) {
      const { data: existing } = await client
        .from("collaborators")
        .select("id, status")
        .eq("entry_id", entry.id)
        .eq("collaborator_user_id", userId)
        .single();

      if (!existing) {
        // Create the collaboration row via owner
        const { error: createErr } = await sarahClient.from("collaborators").insert({
          entry_id: entry.id,
          entry_category: "events",
          owner_id: sarahId,
          collaborator_user_id: userId,
          status: "accepted",
          can_edit: true,
          accepted_at: new Date().toISOString(),
        });
        if (createErr && !createErr.message.includes("duplicate")) {
          console.error(`  ✗ Create collab ${name} on "${entry.data.title}": ${createErr.message}`);
        } else {
          console.log(`  ✓ Created + accepted collab for ${name} on "${entry.data.title}"`);
        }
      } else if (existing.status !== "accepted") {
        await client
          .from("collaborators")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", existing.id);
        console.log(`  ✓ ${name} accepted "${entry.data.title}"`);
      } else {
        console.log(`  – ${name} already accepted "${entry.data.title}"`);
      }
    }
  }

  // Define overlays per event per person
  const overlayData = {
    "UFC 300": {
      jason: {
        snapshot1: "Pereira vs Jamahal Hill was over in seconds — absolute carnage",
        snapshot2: "The walkouts with the Vegas production were insane",
        snapshot3: "Best card top to bottom I've ever witnessed live",
        rating: 5,
        why_notes: "Once in a lifetime card — stacked from prelims to main event",
      },
      mike: {
        snapshot1: "The crowd energy when Pereira connected was deafening",
        snapshot2: "We were 8 rows back and could hear every impact",
        snapshot3: "Zhang Weili's fight was the sleeper FOTY candidate",
        rating: 5,
        why_notes: "Best live sporting event I've been to, period",
      },
    },
    "Taylor Swift": {
      jason: {
        snapshot1: "Okay I'll admit it — the production value converted me",
        snapshot2: "The acoustic set in the middle was genuinely impressive",
        snapshot3: "3.5 hours and she never lost the crowd once",
        rating: 4,
        why_notes: "Went as a skeptic, left understanding the hype",
      },
      mike: {
        snapshot1: "I caught a friendship bracelet from the pit — still wearing it",
        snapshot2: "The confetti during Shake It Off was cinematic",
        snapshot3: "Anti-Hero live hit completely different",
        rating: 5,
        why_notes: "Pure joy — everyone was singing every word",
      },
    },
    "Hamilton on Broadway": {
      jason: {
        snapshot1: "The turntable staging is genius — adds so much kinetic energy",
        snapshot2: "King George stole every scene he was in",
        snapshot3: "Left the theater wanting to read a history book",
        rating: 5,
        why_notes: "Lived up to every bit of the hype and then some",
      },
      mike: {
        snapshot1: "Satisfied is the most technically impressive song I've seen performed live",
        snapshot2: "The ensemble choreography is on another level",
        snapshot3: "Cried during It's Quiet Uptown — did not expect that",
        rating: 5,
        why_notes: "Changed how I think about what theater can be",
      },
    },
    "Coldplay": {
      jason: {
        snapshot1: "The LED wristband moment during A Sky Full of Stars was magical",
        snapshot2: "Chris Martin's crowd interaction felt genuinely personal",
        snapshot3: "The confetti cannons during Viva La Vida — peak concert",
        rating: 4,
        why_notes: "Great production, solid setlist — slightly long though",
      },
      mike: {
        snapshot1: "Yellow was the perfect closer — whole stadium was glowing",
        snapshot2: "The Xylobands made me feel like we were all connected",
        snapshot3: "Best visual production of any concert I've seen",
        rating: 5,
        why_notes: "Felt like being inside a music video for 2 hours",
      },
    },
  };

  // Insert overlays
  console.log("\nInserting perspective overlays...");
  for (const entry of targetEvents) {
    const titleKey = Object.keys(overlayData).find((k) => entry.data.title.includes(k));
    if (!titleKey) continue;

    const perspectives = overlayData[titleKey];

    // Jason's overlay
    if (perspectives.jason) {
      const { error } = await jasonClient.from("overlays").upsert(
        {
          entry_id: entry.id,
          user_id: jasonId,
          ...perspectives.jason,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "entry_id,user_id" }
      );
      if (error) console.error(`  ✗ Jason overlay on "${entry.data.title}": ${error.message}`);
      else console.log(`  ✓ Jason added perspective on "${entry.data.title}"`);
    }

    // Mike's overlay
    if (perspectives.mike) {
      const { error } = await mikeClient.from("overlays").upsert(
        {
          entry_id: entry.id,
          user_id: mikeId,
          ...perspectives.mike,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "entry_id,user_id" }
      );
      if (error) console.error(`  ✗ Mike overlay on "${entry.data.title}": ${error.message}`);
      else console.log(`  ✓ Mike added perspective on "${entry.data.title}"`);
    }
  }

  // Verify the state
  console.log("\n📊 Verification — overlay counts per event:");
  for (const entry of targetEvents) {
    const { data: overlays } = await sarahClient
      .from("overlays")
      .select("user_id, rating, snapshot1")
      .eq("entry_id", entry.id);
    const ownerSnaps = [entry.data.snapshot1, entry.data.snapshot2, entry.data.snapshot3].filter(Boolean).length;
    console.log(`  "${entry.data.title}": owner has ${ownerSnaps} snaps + ${(overlays || []).length} overlay(s)`);
    (overlays || []).forEach((o) => {
      const who = o.user_id === jasonId ? "Jason" : o.user_id === mikeId ? "Mike" : "Unknown";
      console.log(`    └─ ${who}: ★${o.rating} "${o.snapshot1?.slice(0, 40)}..."`);
    });
  }

  console.log("\n✅ Done! Log in as Sarah (jfulbright+user2@gmail.com) to see 3-person perspectives on events.");
  console.log("   Each event now has: Sarah (owner) + Jason + Mike with snaps and ratings.\n");
}

main().catch(console.error);
