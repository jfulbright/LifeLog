import { createClient } from "../client/node_modules/@supabase/supabase-js/dist/index.mjs";

const client = createClient("https://wzsbatztmcdungfzgrnm.supabase.co", "sb_publishable_1J2xtbjBInGL-h_XiS3asA_EjQFgKzF");
const { data } = await client.auth.signInWithPassword({ email: "jfulbright+user1@gmail.com", password: "TestPass123!" });
const userId = data.user.id;

const { data: collabs } = await client.from("collaborators").select("entry_id, status").eq("collaborator_user_id", userId).eq("status", "accepted");
console.log("Jason accepted collabs:", collabs?.length);

if (collabs?.length > 0) {
  const { data: item } = await client.from("items").select("id, data").eq("id", collabs[0].entry_id).single();
  console.log("Entry status:", item?.data?.status);
  console.log("Entry title:", item?.data?.title);
  console.log("Entry id matches:", item?.id === collabs[0].entry_id);

  const { data: overlay } = await client.from("overlays").select("*").eq("entry_id", collabs[0].entry_id).eq("user_id", userId).maybeSingle();
  console.log("Overlay exists:", !!overlay);
  if (overlay) {
    console.log("Overlay snap1:", overlay.snapshot1);
    console.log("Overlay snap2:", overlay.snapshot2);
    console.log("Overlay rating:", overlay.rating);
  }
}
