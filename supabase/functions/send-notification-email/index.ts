// Immediate notification sender.
//
// Invoked by a Supabase Database Webhook on INSERT into notification_outbox
// (see README for setup). For a row whose recipient chose "immediate"
// delivery, it sends one email via Resend and stamps email_sent_at. Rows for
// "weekly_digest" / "off" recipients are left for the digest job (or dropped).
//
// Idempotent: it only sends when email_sent_at IS NULL, and a unique constraint
// on the outbox prevents duplicate rows, so webhook retries are safe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderImmediate, OutboxRow } from "../_shared/templates.ts";
import { deliveryMode, eventEnabled, Prefs, NotificationType } from "../_shared/prefs.ts";
import { sendEmail } from "../_shared/resend.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://lifesnaps.org";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

interface WebhookBody {
  type?: string;
  record?: {
    id: string;
    recipient_user_id: string;
    recipient_email: string;
    type: NotificationType;
    payload: OutboxRow["payload"];
    email_sent_at: string | null;
  };
}

Deno.serve(async (req) => {
  let body: WebhookBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const record = body.record;
  if (!record || record.email_sent_at) {
    return new Response(JSON.stringify({ skipped: "no-op" }), { status: 200 });
  }

  // Load the recipient's preferences.
  const { data: profile } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", record.recipient_user_id)
    .single();

  const prefs = (profile?.notification_preferences ?? {}) as Prefs;

  if (!eventEnabled(prefs, record.type) || deliveryMode(prefs) !== "immediate") {
    return new Response(JSON.stringify({ skipped: "not-immediate" }), { status: 200 });
  }

  const email = renderImmediate({ type: record.type, payload: record.payload }, SITE_URL);
  const result = await sendEmail({
    to: record.recipient_email,
    subject: email.subject,
    html: email.html,
  });

  if (!result.ok) {
    console.error("Resend send failed:", result.error);
    return new Response(JSON.stringify({ error: result.error }), { status: 502 });
  }

  // Stamp only after a confirmed send (guarded on still-null to avoid races).
  await admin
    .from("notification_outbox")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", record.id)
    .is("email_sent_at", null);

  return new Response(JSON.stringify({ sent: true, id: result.id }), { status: 200 });
});
