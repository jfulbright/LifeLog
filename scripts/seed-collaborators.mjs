/**
 * Fix script: insert collaborator rows for already-seeded entries.
 * Run: node scripts/seed-collaborators.mjs
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
  return { client, userId: data.user.id };
}

async function main() {
  console.log("\n🔗 Inserting collaborator rows...\n");

  const { client: sarahClient, userId: sarahId } = await getAuthClient(USERS.sarah);
  const { client: jasonClient, userId: jasonId } = await getAuthClient(USERS.jason);
  const { userId: mikeId } = await getAuthClient(USERS.mike);

  // Get Sarah's entries
  const { data: sarahEntries } = await sarahClient
    .from("items")
    .select("id, category, data")
    .eq("user_id", sarahId);

  // Get Jason's entries
  const { data: jasonEntries } = await jasonClient
    .from("items")
    .select("id, category, data")
    .eq("user_id", jasonId);

  console.log(`Found ${sarahEntries?.length || 0} Sarah entries, ${jasonEntries?.length || 0} Jason entries`);

  // Share Sarah's entries with Jason and Mike
  console.log("\nSharing Sarah's entries...");
  for (const entry of sarahEntries || []) {
    const title = entry.data?.title || entry.data?.artist || "unknown";
    for (const [name, targetId] of [["Jason", jasonId], ["Mike", mikeId]]) {
      const { error } = await sarahClient.from("collaborators").insert({
        entry_id: entry.id,
        entry_category: entry.category,
        owner_id: sarahId,
        collaborator_user_id: targetId,
        status: "pending",
        can_edit: true,
      });
      if (error && error.message.includes("duplicate")) {
        console.log(`  – "${title}" → ${name} (already exists)`);
      } else if (error) {
        console.error(`  ✗ "${title}" → ${name}: ${error.message}`);
      } else {
        console.log(`  ✓ "${title}" → ${name}`);
      }
    }
  }

  // Share Jason's entries with Sarah and Mike
  console.log("\nSharing Jason's entries...");
  for (const entry of jasonEntries || []) {
    const title = entry.data?.title || entry.data?.artist || "unknown";
    for (const [name, targetId] of [["Sarah", sarahId], ["Mike", mikeId]]) {
      const { error } = await jasonClient.from("collaborators").insert({
        entry_id: entry.id,
        entry_category: entry.category,
        owner_id: jasonId,
        collaborator_user_id: targetId,
        status: "pending",
        can_edit: true,
      });
      if (error && error.message.includes("duplicate")) {
        console.log(`  – "${title}" → ${name} (already exists)`);
      } else if (error) {
        console.error(`  ✗ "${title}" → ${name}: ${error.message}`);
      } else {
        console.log(`  ✓ "${title}" → ${name}`);
      }
    }
  }

  console.log("\n✅ Done! Collaborator rows inserted.");
  console.log(`   Jason should see: ${sarahEntries?.length || 0} pending from Sarah`);
  console.log(`   Sarah should see: ${jasonEntries?.length || 0} pending from Jason`);
  console.log(`   Mike should see: ${(sarahEntries?.length || 0) + (jasonEntries?.length || 0)} pending total`);
}

main().catch(console.error);
