// Email templates (plain HTML strings — no build step, no React Email runtime
// dependency). Brand tokens mirror client/src/index.css so emails feel native.

const COLOR_PRIMARY = "#4A154B"; // Aubergine
const COLOR_TEXT = "#1D1C1D";
const COLOR_SECONDARY = "#696969";
const COLOR_SURFACE = "#F4F4F5";

export interface OutboxRow {
  type: "collab_invite" | "recommendation" | "invite_accepted";
  payload: {
    actor_name?: string;
    entry_title?: string;
    entry_category?: string;
    link_path?: string;
  };
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${COLOR_PRIMARY};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;font-family:'Lato',Arial,sans-serif;font-size:15px">${esc(label)}</a>`;
}

// Shared shell: header, body slot, CTA, and the CAN-SPAM-compliant footer with
// a manage-preferences link (Settings page).
function layout(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaHref: string;
  ctaLabel: string;
  siteUrl: string;
}): string {
  const settingsUrl = `${opts.siteUrl}/settings`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLOR_SURFACE};">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;">${esc(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_SURFACE};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${COLOR_PRIMARY};padding:20px 28px;">
          <span style="font-family:'DM Sans',Arial,sans-serif;font-weight:700;font-size:20px;color:#fff;">LifeSnaps</span>
        </td></tr>
        <tr><td style="padding:28px;font-family:'Lato',Arial,sans-serif;color:${COLOR_TEXT};">
          <h1 style="font-family:'DM Sans',Arial,sans-serif;font-size:20px;margin:0 0 12px;color:${COLOR_TEXT};">${esc(opts.heading)}</h1>
          <div style="font-size:15px;line-height:1.55;color:${COLOR_TEXT};">${opts.bodyHtml}</div>
          <div style="margin:24px 0 4px;">${button(opts.ctaHref, opts.ctaLabel)}</div>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #EBEAEB;font-family:'Lato',Arial,sans-serif;font-size:12px;color:${COLOR_SECONDARY};">
          You're receiving this because you have email notifications on.
          <a href="${esc(settingsUrl)}" style="color:${COLOR_PRIMARY};">Manage your notification preferences</a> or turn email off anytime.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Single-event (immediate) emails ──────────────────────────────────────────
export function renderImmediate(row: OutboxRow, siteUrl: string): RenderedEmail {
  const actor = row.payload.actor_name ?? "Someone";
  const title = row.payload.entry_title ?? "an entry";
  const ctaHref = `${siteUrl}${row.payload.link_path ?? "/"}`;

  switch (row.type) {
    case "collab_invite":
      return {
        subject: `${actor} shared "${title}" with you`,
        html: layout({
          preheader: `${actor} invited you to collaborate on ${title}.`,
          heading: `${actor} shared an entry with you`,
          bodyHtml: `<p><strong>${esc(actor)}</strong> invited you to collaborate on <strong>${esc(title)}</strong>. Accept it to add your own snaps, photos, and rating.</p>`,
          ctaHref,
          ctaLabel: "View invitation",
          siteUrl,
        }),
      };
    case "recommendation":
      return {
        subject: `${actor} recommended "${title}" to you`,
        html: layout({
          preheader: `${actor} thinks you'd like ${title}.`,
          heading: `${actor} recommended something`,
          bodyHtml: `<p><strong>${esc(actor)}</strong> recommended <strong>${esc(title)}</strong> to you. Add it to your list with one tap.</p>`,
          ctaHref,
          ctaLabel: "See recommendation",
          siteUrl,
        }),
      };
    case "invite_accepted":
      return {
        subject: `${actor} joined LifeSnaps`,
        html: layout({
          preheader: `${actor} accepted your invite.`,
          heading: `${actor} joined LifeSnaps`,
          bodyHtml: `<p><strong>${esc(actor)}</strong> accepted your invitation. You're now connected and can start sharing memories.</p>`,
          ctaHref,
          ctaLabel: "Open LifeSnaps",
          siteUrl,
        }),
      };
  }
}

// ── Weekly digest (many events, one email) ───────────────────────────────────
export function renderDigest(rows: OutboxRow[], siteUrl: string): RenderedEmail {
  const collab = rows.filter((r) => r.type === "collab_invite");
  const recs = rows.filter((r) => r.type === "recommendation");
  const joined = rows.filter((r) => r.type === "invite_accepted");

  const section = (label: string, items: OutboxRow[], verb: string): string => {
    if (items.length === 0) return "";
    const lis = items
      .map((r) => {
        const actor = esc(r.payload.actor_name ?? "Someone");
        const title = r.payload.entry_title ? ` — <strong>${esc(r.payload.entry_title)}</strong>` : "";
        return `<li style="margin:6px 0;">${actor} ${verb}${title}</li>`;
      })
      .join("");
    return `<p style="font-weight:700;margin:18px 0 6px;color:${COLOR_PRIMARY};">${esc(label)}</p><ul style="margin:0;padding-left:18px;">${lis}</ul>`;
  };

  const total = rows.length;
  const body =
    section("Shared with you", collab, "shared an entry") +
    section("Recommended to you", recs, "recommended something") +
    section("New connections", joined, "joined LifeSnaps");

  return {
    subject: `Your LifeSnaps week — ${total} new ${total === 1 ? "update" : "updates"}`,
    html: layout({
      preheader: `${total} new ${total === 1 ? "update" : "updates"} from your people this week.`,
      heading: "Here's what you missed this week",
      bodyHtml: body,
      ctaHref: `${siteUrl}/`,
      ctaLabel: "Open LifeSnaps",
      siteUrl,
    }),
  };
}
