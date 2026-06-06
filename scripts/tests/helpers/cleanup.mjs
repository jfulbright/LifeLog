import { getAllClients, USERS } from "./auth.mjs";

export async function resetAllTestData() {
  console.log("  Resetting test data for all 3 users...");
  const { jason, sarah, mike } = await getAllClients();

  for (const { client, userId, name } of [jason, sarah, mike]) {
    // Delete in FK-safe order
    const tables = ["overlays", "recommendations", "collaborators", "items", "contacts"];
    for (const table of tables) {
      let query;
      if (table === "overlays") {
        query = client.from(table).delete().eq("user_id", userId);
      } else if (table === "recommendations") {
        // Delete both sent and received
        const { error: e1 } = await client.from(table).delete().eq("from_user_id", userId);
        const { error: e2 } = await client.from(table).delete().eq("to_user_id", userId);
        if (e1) console.log(`    WARN: ${name} recommendations (from) delete: ${e1.message}`);
        if (e2) console.log(`    WARN: ${name} recommendations (to) delete: ${e2.message}`);
        continue;
      } else if (table === "collaborators") {
        // Delete both owned and received
        const { error: e1 } = await client.from(table).delete().eq("owner_id", userId);
        const { error: e2 } = await client.from(table).delete().eq("collaborator_user_id", userId);
        if (e1) console.log(`    WARN: ${name} collaborators (owner) delete: ${e1.message}`);
        if (e2) console.log(`    WARN: ${name} collaborators (collab) delete: ${e2.message}`);
        continue;
      } else if (table === "contacts") {
        query = client.from(table).delete().eq("owner_id", userId);
      } else {
        query = client.from(table).delete().eq("user_id", userId);
      }
      const { error } = await query;
      if (error) console.log(`    WARN: ${name} ${table} delete: ${error.message}`);
    }
    console.log(`    ✓ ${name} cleaned`);
  }
}

export async function seedBaselineContacts() {
  console.log("  Seeding baseline contacts...");
  const { jason, sarah, mike } = await getAllClients();

  // Jason has Sarah (ring 4) and Mike (ring 2)
  await upsertContact(jason.client, jason.userId, {
    email: USERS.sarah.email,
    display_name: "Sarah",
    ring_level: 4,
    linked_user_id: sarah.userId,
    invite_status: "accepted",
  });
  await upsertContact(jason.client, jason.userId, {
    email: USERS.mike.email,
    display_name: "Mike",
    ring_level: 2,
    linked_user_id: mike.userId,
    invite_status: "accepted",
  });

  // Sarah has Jason (ring 4) and Mike (ring 3)
  await upsertContact(sarah.client, sarah.userId, {
    email: USERS.jason.email,
    display_name: "Jason",
    ring_level: 4,
    linked_user_id: jason.userId,
    invite_status: "accepted",
  });
  await upsertContact(sarah.client, sarah.userId, {
    email: USERS.mike.email,
    display_name: "Mike",
    ring_level: 3,
    linked_user_id: mike.userId,
    invite_status: "accepted",
  });

  // Mike has Jason (ring 2) and Sarah (ring 4)
  await upsertContact(mike.client, mike.userId, {
    email: USERS.jason.email,
    display_name: "Jason",
    ring_level: 2,
    linked_user_id: jason.userId,
    invite_status: "accepted",
  });
  await upsertContact(mike.client, mike.userId, {
    email: USERS.sarah.email,
    display_name: "Sarah",
    ring_level: 4,
    linked_user_id: sarah.userId,
    invite_status: "accepted",
  });

  console.log("    ✓ Baseline contacts seeded (Jason↔Sarah ring 4, Jason↔Mike ring 2, Sarah↔Mike ring 3/4)");
}

async function upsertContact(client, ownerId, contact) {
  const { error } = await client
    .from("contacts")
    .upsert(
      { owner_id: ownerId, ...contact },
      { onConflict: "owner_id,email", ignoreDuplicates: false }
    );
  if (error && !error.message.includes("duplicate")) {
    console.log(`    WARN: contact upsert failed: ${error.message}`);
  }
}

// Allow running standalone
if (process.argv[1]?.endsWith("cleanup.mjs")) {
  const isWipe = process.argv.includes("--wipe");

  if (isWipe) {
    console.log("\n\x1b[1m🗑️  Full Wipe — Removing ALL data for test users\x1b[0m\n");
    await resetAllTestData();
    console.log("\n  ✓ All test user data removed (items, collaborators, overlays, recommendations, contacts).");
    console.log("  Run 'node scripts/seed-realistic-data.mjs' to repopulate.\n");
  } else {
    console.log("\n\x1b[1m🧹 Test Data Cleanup\x1b[0m\n");
    await resetAllTestData();
    await seedBaselineContacts();
    console.log("\n  Done.\n");
  }
}
