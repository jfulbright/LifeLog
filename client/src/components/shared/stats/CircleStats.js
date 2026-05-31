import React, { useState, useMemo } from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import SectionHeader from "./SectionHeader";

const RING_LABELS = { 1: "Partner", 2: "Immediate Family", 3: "Extended Family", 4: "Friends" };
const RING_COLORS = { 1: "#4A154B", 2: "#2EB67D", 3: "#8B6914", 4: "#36C5F0" };

const VIEWS = [
  { id: "together", label: "Who Was There", emoji: "\u{1F465}" },
  { id: "shared", label: "Shared", emoji: "\u{1F91D}" },
  { id: "incommon", label: "In Common", emoji: "\u{1F30D}" },
];

export default function CircleStats({
  items,
  contacts,
  activeStatus,
  itemLabel = "items",
  overlapFields = [],
  color = "var(--color-primary)",
  socialItems = [],
}) {
  const hasContacts = contacts.length > 0;

  const myItems = useMemo(() => items.filter((i) => !i._isShared), [items]);
  const sharedItems = useMemo(() => items.filter((i) => i._isShared), [items]);
  const activeMyItems = useMemo(() => myItems.filter((i) => i.status === activeStatus), [myItems, activeStatus]);

  // Compute data availability per view
  const togetherData = useMemo(() => computeTogetherData(myItems, contacts, activeStatus, overlapFields), [myItems, contacts, activeStatus, overlapFields]);
  const sharedData = useMemo(() => computeSharedData(sharedItems, contacts), [sharedItems, contacts]);
  const inCommonData = useMemo(() => computeInCommonData(activeMyItems, socialItems, contacts, overlapFields), [activeMyItems, socialItems, contacts, overlapFields]);

  const hasTogether = togetherData.companions.length > 0;
  const hasShared = sharedData.entries.length > 0;
  const hasInCommon = inCommonData.totalVisible > 0;

  // Default to first view with data
  const defaultView = hasInCommon ? "incommon" : hasShared ? "shared" : "together";
  const [view, setView] = useState(defaultView);

  if (!hasContacts) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{"\u{1F465}"}</div>
        <h6 style={{ fontWeight: 700 }}>Circle Stats — Unlock with Friends</h6>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", maxWidth: 400, margin: "0 auto 1rem" }}>
          Add friends to your Circle to see shared {itemLabel}, common experiences, and who you do things with most.
        </p>
        <Link to="/people" className="btn btn-sm btn-primary">Manage My Circle</Link>
      </div>
    );
  }

  return (
    <div className="card p-3 mb-4">
      <SectionHeader emoji={"\u{1F465}"}>Your {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} Circle</SectionHeader>

      {/* View Pills */}
      <div className="source-segment-track" style={{ marginBottom: "1rem" }}>
        {VIEWS.map((v) => {
          const disabled = (v.id === "together" && !hasTogether) ||
            (v.id === "shared" && !hasShared) ||
            (v.id === "incommon" && !hasInCommon);
          return (
            <button
              key={v.id}
              type="button"
              className={`source-segment-btn ${view === v.id ? "active" : ""}`}
              disabled={disabled}
              style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              onClick={() => !disabled && setView(v.id)}
            >
              {v.emoji && <span style={{ marginRight: "0.2rem" }}>{v.emoji}</span>}
              {v.label}
            </button>
          );
        })}
      </div>

      {/* View Content */}
      {view === "together" && <TogetherView data={togetherData} itemLabel={itemLabel} color={color} />}
      {view === "shared" && <SharedView data={sharedData} itemLabel={itemLabel} color={color} />}
      {view === "incommon" && <InCommonView data={inCommonData} itemLabel={itemLabel} color={color} overlapFields={overlapFields} />}
    </div>
  );
}

// ═══ TOGETHER VIEW (Layer 1: Companions) ════════════════════════════════════

function computeTogetherData(myItems, contacts, activeStatus, overlapFields) {
  const tagsByEntry = {};
  myItems.forEach((item) => {
    const ids = [
      ...(item.shareWithCompanionIds || []),
      ...(item.companions || [])
        .filter((c) => c?.type === "contact")
        .map((c) => c.contactId),
    ].filter(Boolean);
    if (ids.length > 0) tagsByEntry[item.id] = new Set(ids);
  });

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const companionIds = new Set(Object.values(tagsByEntry).flatMap((set) => [...set]));
  const companions = [...companionIds].map((id) => contactMap[id]).filter(Boolean);

  const activeItems = myItems.filter((i) => i.status === activeStatus);
  const togetherCount = activeItems.filter((item) => tagsByEntry[item.id]?.size > 0).length;

  const overlapData = overlapFields.map(({ field, label }) => {
    const myValues = new Set(activeItems.map((i) => i[field]).filter(Boolean));
    const contactValues = {};
    activeItems.forEach((item) => {
      const tags = tagsByEntry[item.id];
      if (!tags || !item[field]) return;
      tags.forEach((cid) => {
        if (!contactValues[cid]) contactValues[cid] = new Set();
        contactValues[cid].add(item[field]);
      });
    });
    const sharedValues = [...myValues].filter((val) =>
      companions.some((c) => contactValues[c.id]?.has(val))
    );
    return { label, sharedValues };
  });

  return { companions, tagsByEntry, togetherCount, overlapData, activeItems };
}

function TogetherView({ data, itemLabel, color }) {
  const { companions, tagsByEntry, togetherCount, overlapData, activeItems } = data;

  if (companions.length === 0) {
    return <EmptyMessage>Tag companions on your {itemLabel} to see who you do things with most.</EmptyMessage>;
  }

  return (
    <>
      <Row className="g-3 mb-3">
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{companions.length}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>Companions</div>
          </div>
        </Col>
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#36C5F0" }}>{togetherCount}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>{itemLabel} together</div>
          </div>
        </Col>
      </Row>

      {overlapData.map(({ label, sharedValues }) => sharedValues.length > 0 && (
        <OverlapChips key={label} label={label} values={sharedValues} />
      ))}

      <ContactList contacts={companions} getCount={(c) => activeItems.filter((item) => tagsByEntry[item.id]?.has(c.id)).length} itemLabel={itemLabel} />
    </>
  );
}

// ═══ SHARED VIEW (Layer 2: Collaborations) ══════════════════════════════════

function computeSharedData(sharedItems, contacts) {
  const contactMap = Object.fromEntries(contacts.map((c) => [c.linkedUserId || c.linked_user_id, c]));

  const entries = sharedItems.map((item) => {
    const ownerId = item._sharedBy || item._ownerId;
    const contact = contactMap[ownerId];
    return {
      id: item.id,
      title: item.title || item.city || item.activityType || "Entry",
      rating: parseInt(item.rating, 10) || null,
      ownerName: contact?.displayName || contact?.display_name || "Someone",
      ownerRing: contact?.ringLevel || contact?.ring_level || 4,
      status: item.status,
    };
  });

  const byOwner = {};
  entries.forEach((e) => {
    if (!byOwner[e.ownerName]) byOwner[e.ownerName] = [];
    byOwner[e.ownerName].push(e);
  });

  return { entries, byOwner };
}

function SharedView({ data, itemLabel, color }) {
  const { entries, byOwner } = data;

  if (entries.length === 0) {
    return <EmptyMessage>Share entries with friends to build collaborative memories.</EmptyMessage>;
  }

  return (
    <>
      <Row className="g-3 mb-3">
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{entries.length}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>shared {itemLabel}</div>
          </div>
        </Col>
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#36C5F0" }}>{Object.keys(byOwner).length}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>collaborators</div>
          </div>
        </Col>
      </Row>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {entries.slice(0, 8).map((e) => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-sm)", padding: "0.25rem 0", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
            <span style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)", marginLeft: "0.5rem" }}>
              with {e.ownerName}
              {e.rating && <span style={{ marginLeft: "0.3rem" }}>{e.rating}{"★"}</span>}
            </span>
          </div>
        ))}
        {entries.length > 8 && (
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", textAlign: "center", marginTop: "0.25rem" }}>
            +{entries.length - 8} more shared {itemLabel}
          </div>
        )}
      </div>
    </>
  );
}

// ═══ IN COMMON VIEW (Layer 3: Visible via Rings) ════════════════════════════

function computeInCommonData(activeMyItems, socialItems, contacts, overlapFields) {
  if (!socialItems || socialItems.length === 0) {
    return { totalVisible: 0, overlapCount: 0, byContact: [], overlapData: [] };
  }

  const contactMap = Object.fromEntries(contacts.map((c) => [c.linkedUserId || c.linked_user_id, c]));

  // Build lookup of my items by common identifiers
  const myTmdbIds = new Set(activeMyItems.map((i) => i.tmdbId).filter(Boolean));
  const myFieldValues = {};
  overlapFields.forEach(({ field }) => {
    myFieldValues[field] = new Set(activeMyItems.map((i) => i[field]).filter(Boolean));
  });

  // Count visible items and overlaps per contact
  const byContactMap = {};
  let overlapCount = 0;

  socialItems.forEach((item) => {
    const uid = item._sharedByUserId;
    if (!uid) return;
    if (!byContactMap[uid]) {
      const contact = contactMap[uid];
      byContactMap[uid] = {
        contact: contact || { displayName: item._sharedByName, ringLevel: item._sharedByRing },
        name: item._sharedByName,
        total: 0,
        overlap: 0,
      };
    }
    byContactMap[uid].total++;

    const isOverlap = (item.tmdbId && myTmdbIds.has(item.tmdbId)) ||
      overlapFields.some(({ field }) => item[field] && myFieldValues[field]?.has(item[field]));

    if (isOverlap) {
      byContactMap[uid].overlap++;
      overlapCount++;
    }
  });

  const byContact = Object.values(byContactMap).sort((a, b) => b.overlap - a.overlap);

  // Compute field-level overlap from social items
  const overlapData = overlapFields.map(({ field, label }) => {
    const theirValues = new Set(socialItems.map((i) => i[field]).filter(Boolean));
    const sharedValues = [...(myFieldValues[field] || [])].filter((v) => theirValues.has(v));
    return { label, sharedValues };
  });

  return { totalVisible: socialItems.length, overlapCount, byContact, overlapData };
}

function InCommonView({ data, itemLabel, color }) {
  const { totalVisible, overlapCount, byContact, overlapData } = data;

  if (totalVisible === 0) {
    return <EmptyMessage>Your circle's {itemLabel} will appear here once they make them visible.</EmptyMessage>;
  }

  return (
    <>
      <Row className="g-3 mb-3">
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color }}>{totalVisible}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>visible from circle</div>
          </div>
        </Col>
        <Col xs={6}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ECB22E" }}>{overlapCount}</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600 }}>in common</div>
          </div>
        </Col>
      </Row>

      {overlapData.map(({ label, sharedValues }) => sharedValues.length > 0 && (
        <OverlapChips key={label} label={label} values={sharedValues} />
      ))}

      {byContact.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: "0.5rem" }}>Per Contact</div>
          {byContact.slice(0, 6).map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.4rem 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: RING_COLORS[c.contact?.ringLevel || c.contact?.ring_level || 4] || "#ccc",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "var(--font-size-sm)",
                flexShrink: 0,
              }}>
                {(c.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{c.name}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                  {c.total} visible · {c.overlap} in common
                </div>
              </div>
              {c.overlap > 0 && (
                <Badge bg="light" text="dark" style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                  {c.overlap} overlap
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══ SHARED UI HELPERS ══════════════════════════════════════════════════════

function OverlapChips({ label, values }) {
  return (
    <div className="mb-3">
      <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
        {values.slice(0, 12).map((val) => (
          <span key={val} style={{
            background: "var(--color-surface-hover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "0.15rem 0.5rem",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
          }}>
            {val}
          </span>
        ))}
        {values.length > 12 && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", alignSelf: "center" }}>
            +{values.length - 12} more
          </span>
        )}
      </div>
    </div>
  );
}

function ContactList({ contacts, getCount, itemLabel }) {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: "0.5rem" }}>Your Circle</div>
      {contacts.slice(0, 6).map((contact) => {
        const ring = contact.ringLevel || contact.ring_level || 3;
        const count = getCount(contact);
        return (
          <div key={contact.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.4rem 0", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: RING_COLORS[ring] || "#ccc",
              color: ring === 2 ? "#333" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "var(--font-size-sm)",
              flexShrink: 0,
            }}>
              {(contact.displayName || contact.email || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {contact.displayName || contact.email}
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                {RING_LABELS[ring] || "Friend"}
              </div>
            </div>
            {count > 0 && (
              <Badge bg="light" text="dark" style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                {count} {itemLabel}
              </Badge>
            )}
          </div>
        );
      })}
      {contacts.length > 6 && (
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.5rem", textAlign: "center" }}>
          +{contacts.length - 6} more in your circle
        </div>
      )}
    </div>
  );
}

function EmptyMessage({ children }) {
  return (
    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", margin: 0 }}>
      {children}
    </p>
  );
}
