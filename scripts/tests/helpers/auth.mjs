import { createClient } from "../../../client/node_modules/@supabase/supabase-js/dist/index.mjs";

export const SUPABASE_URL = "https://wzsbatztmcdungfzgrnm.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_1J2xtbjBInGL-h_XiS3asA_EjQFgKzF";

export const USERS = {
  jason: { name: "Jason", email: "jfulbright+user1@gmail.com", password: "TestPass123!" },
  sarah: { name: "Sarah", email: "jfulbright+user2@gmail.com", password: "TestPass123!" },
  mike: { name: "Mike", email: "jfulbright+user3@gmail.com", password: "TestPass123!" },
};

export async function getAuthClient(user) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Auth failed for ${user.email}: ${error.message}`);
  return { client, userId: data.user.id };
}

export async function getAllClients() {
  const [jason, sarah, mike] = await Promise.all([
    getAuthClient(USERS.jason),
    getAuthClient(USERS.sarah),
    getAuthClient(USERS.mike),
  ]);
  return {
    jason: { ...jason, name: "Jason" },
    sarah: { ...sarah, name: "Sarah" },
    mike: { ...mike, name: "Mike" },
  };
}
