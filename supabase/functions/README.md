# Email notifications — Supabase backend

Email digest + immediate notifications for LifeSnaps, built entirely on
Supabase (Edge Functions + Database Webhooks + `pg_cron`) with **Resend** as the
email provider. No separate server or hosting is required.

## Pieces

| Piece | Location | Role |
| --- | --- | --- |
| Preference column | migration `013` | `profiles.notification_preferences` (JSONB) |
| Outbox table | migration `014` | `notification_outbox` — durable notification queue |
| Enqueue triggers | migration `015` | translate share / recommend / invite-accepted into outbox rows |
| Immediate sender | `send-notification-email/` | one email per event for `immediate` users |
| Weekly digest | `weekly-digest/` | one grouped email per `weekly_digest` user |
| Cron schedule | migration `016` | `pg_cron` → calls the digest function weekly |

Both functions share `_shared/` (`resend.ts`, `templates.ts`, `prefs.ts`).
`prefs.ts` defaults are the single source of truth and must stay in sync with
the client `NotificationsTab` defaults in `client/src/pages/Settings.js`.

## One-time setup

1. **Resend account + domain.** Create a Resend API key. For production, verify
   the `lifesnaps.org` sending domain (SPF/DKIM). Until then, leave `FROM_EMAIL`
   unset to send from the `onboarding@resend.dev` sandbox sender.

2. **Function secrets:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set FROM_EMAIL="LifeSnaps <notify@lifesnaps.org>"   # after domain verify
   supabase secrets set SITE_URL=https://lifesnaps.org
   ```
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

3. **Apply migrations:** `supabase db push` (013–016).

4. **Deploy functions:**
   ```bash
   supabase functions deploy send-notification-email
   supabase functions deploy weekly-digest
   ```

5. **Database Webhook (immediate sends).** In Dashboard → Database → Webhooks,
   create a webhook: table `notification_outbox`, event `INSERT`, type
   *Supabase Edge Function* → `send-notification-email`. (This is the standard
   `pg_net`-backed hook; it passes the inserted row as `{ record: ... }`.)

6. **Digest cron secrets (Vault).** Store the digest URL + service-role key once
   so migration `016` can schedule without hardcoding secrets:
   ```sql
   select vault.create_secret(
     'https://<PROJECT_REF>.functions.supabase.co/weekly-digest', 'digest_function_url');
   select vault.create_secret('<SERVICE_ROLE_KEY>', 'digest_service_role_key');
   ```

## Local testing

```bash
supabase functions serve send-notification-email
# Insert a pending collaborators / active recommendations row, then confirm a
# notification_outbox row appears. For an "immediate" recipient an email sends.

# Digest:
supabase functions serve weekly-digest
curl -X POST http://localhost:54321/functions/v1/weekly-digest
```

Idempotency: the outbox unique index `(recipient_user_id, type, source_id)` plus
the `email_sent_at IS NULL` guard make webhook retries safe (no duplicate mail).
