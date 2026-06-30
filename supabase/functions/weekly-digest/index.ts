// Weekly digest sender.
//
// Triggered by pg_cron via pg_net (see migration 016). Walks every recipient
// with undelivered outbox rows, and for those who chose "weekly_digest"
// delivery sends a single grouped email, then stamps digest_included_at on the
// rows it covered. Recipients with nothing pending get no email.
//
// Can also be invoked manually (POST, no body) for testing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderDigest, OutboxRow } from "../_shared/templates.ts";
import { deliveryMode, eventEnabled, Prefs, NotificationType } from "../_shared/prefs.ts";
import { sendEmail } from "../_shared/resend.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://lifesnaps.org";
const WINDOW_DAYS = 7;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

interface OutboxRecord {
  id: string;
  recipient_user_id: string;
  recipient_email: string;
  type: NotificationType;
  payload: OutboxRow["payload"];
}

Deno.serve(async () => {
  const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();

  // Pull all undelivered rows in the window, then group in memory. Volume is
  // tiny for the family beta; revisit with keyset pagination if it grows.
  const { data: rows, error } = await admin
    .from("notification_outbox")
    .select("id, recipient_user_id, recipient_email, type, payload")
    .is("email_sent_at", null)
    .is("digest_included_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .returns<OutboxRecord[]>();

  if (error) {
    console.error("Outbox query failed:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const byRecipient = new Map<string, OutboxRecord[]>();
  for (const row of rows ?? []) {
    const list = byRecipient.get(row.recipient_user_id) ?? [];
    list.push(row);
    byRecipient.set(row.recipient_user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const [userId, userRows] of byRecipient) {
    const { data: profile } = await admin
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .single();
    const prefs = (profile?.notification_preferences ?? {}) as Prefs;

    if (deliveryMode(prefs) !== "weekly_digest") {
      skipped++;
      continue;
    }

    // Respect per-event toggles within the digest too.
    const included = userRows.filter((r) => eventEnabled(prefs, r.type));
    if (included.length === 0) {
      skipped++;
      continue;
    }

    const email = renderDigest(
      included.map((r) => ({ type: r.type, payload: r.payload })),
      SITE_URL,
    );
    const result = await sendEmail({
      to: userRows[0].recipient_email,
      subject: email.subject,
      html: email.html,
    });

    if (!result.ok) {
      failures.push(`${userId}: ${result.error}`);
      continue;
    }

    await admin
      .from("notification_outbox")
      .update({ digest_included_at: new Date().toISOString() })
      .in("id", included.map((r) => r.id));
    sent++;
  }

  if (failures.length) console.error("Digest failures:", failures);
  return new Response(
    JSON.stringify({ recipients: byRecipient.size, sent, skipped, failures: failures.length }),
    { status: 200 },
  );
});
