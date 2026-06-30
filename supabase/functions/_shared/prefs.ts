// Single source of truth for interpreting profiles.notification_preferences.
// Defaults here MUST match the client (Settings → NotificationsTab) and
// migration 013's documented shape.

export type DeliveryMode = "immediate" | "weekly_digest" | "off";
export type NotificationType = "collab_invite" | "recommendation" | "invite_accepted";

export interface Prefs {
  email_enabled?: boolean;
  email_delivery?: DeliveryMode;
  email_collab_invite?: boolean;
  email_recommendation?: boolean;
  email_invite_accepted?: boolean;
}

const TOGGLE_KEY: Record<NotificationType, keyof Prefs> = {
  collab_invite: "email_collab_invite",
  recommendation: "email_recommendation",
  invite_accepted: "email_invite_accepted",
};

// Per-event default (invite_accepted is opt-in; the rest opt-out).
const TOGGLE_DEFAULT: Record<NotificationType, boolean> = {
  collab_invite: true,
  recommendation: true,
  invite_accepted: false,
};

export function deliveryMode(prefs: Prefs | null | undefined): DeliveryMode {
  return prefs?.email_delivery ?? "weekly_digest";
}

// Master email switch AND the per-event toggle both have to be on.
export function eventEnabled(prefs: Prefs | null | undefined, type: NotificationType): boolean {
  const masterOn = prefs?.email_enabled ?? true;
  if (!masterOn) return false;
  const key = TOGGLE_KEY[type];
  const val = prefs?.[key];
  return typeof val === "boolean" ? val : TOGGLE_DEFAULT[type];
}
