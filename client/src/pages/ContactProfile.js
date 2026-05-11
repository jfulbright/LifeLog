import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { supabase } from "../services/supabaseClient";
import contactsService from "../services/contactsService";
import categoryMeta from "../helpers/categoryMeta";
import { RING_META } from "../helpers/ringMeta";
import { getSnapshotTeaser } from "../helpers/operator";
import { codeToFlag } from "../data/countries";

const CATEGORY_KEYS = ["events", "travel", "activities", "cellar", "cars", "homes", "kids"];

function ContactProfile() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const contacts = await contactsService.getContacts();
        const c = contacts.find((x) => x.id === contactId);
        if (!c || !c.linkedUserId) {
          setLoading(false);
          return;
        }
        setContact(c);

        // Fetch their items that are visible (shared with rings your level or higher)
        const { data: rows } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", c.linkedUserId)
          .order("start_date", { ascending: false });

        const allItems = (rows || []).map((row) => ({
          ...row.data,
          _category: row.category,
          id: row.id,
        }));

        // Filter to items visible to your ring level
        const visibleItems = allItems.filter((item) => {
          const rings = item.visibilityRings || [];
          return rings.includes(c.ringLevel) || rings.some((r) => r >= c.ringLevel);
        });

        setItems(visibleItems);
      } catch (err) {
        console.error("[ContactProfile] load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contactId]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)" }}>Loading profile...</div>;
  }

  if (!contact) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h5>Contact not found</h5>
        <Link to="/people">Back to My People</Link>
      </div>
    );
  }

  if (!contact.linkedUserId) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
        <h5 style={{ fontWeight: 700 }}>{contact.displayName}</h5>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Not on LifeSnaps yet. Send them an invite to see their profile.
        </p>
        <Link to="/people" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
          &larr; Back to My People
        </Link>
      </div>
    );
  }

  const ring = RING_META[contact.ringLevel];
  const byCategory = {};
  CATEGORY_KEYS.forEach((key) => {
    byCategory[key] = items.filter((i) => i._category === key);
  });

  const totalVisible = items.length;
  const travelItems = byCategory.travel || [];
  const countries = [...new Set(travelItems.filter((i) => i.country).map((i) => i.country))];
  const cities = [...new Set(travelItems.filter((i) => i.city).map((i) => i.city))];

  const recentSnaps = items
    .map((item) => {
      const snap = getSnapshotTeaser(item);
      if (!snap) return null;
      const meta = categoryMeta[item._category] || {};
      return {
        title: (meta.getPrimaryDisplay ? meta.getPrimaryDisplay(item) : null) ||
          item[meta.primaryField] || item.title || item.artist || "Untitled",
        snapshot: snap,
        category: item._category,
        color: meta.color || "var(--color-primary)",
      };
    })
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div>
      <Link to="/people" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
        &larr; My People
      </Link>

      {/* Profile header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1.5rem",
        padding: "1.25rem",
        background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
        borderRadius: "var(--card-radius, 8px)",
        border: "1px solid var(--color-border)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          backgroundColor: ring?.color || "var(--color-primary)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "1.5rem",
        }}>
          {(contact.displayName || "?")[0].toUpperCase()}
        </div>
        <div>
          <h4 style={{ fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
            {contact.displayName}
          </h4>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>
            {ring?.emoji} {ring?.label} &middot; On LifeSnaps
          </div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>
            {totalVisible} {totalVisible === 1 ? "entry" : "entries"} shared with you
          </div>
        </div>
      </div>

      {totalVisible === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius, 8px)",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔒</div>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Nothing shared yet</div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {contact.displayName} hasn't made any entries visible to your ring yet.
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "1rem",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--card-radius, 8px)",
            marginBottom: "1.5rem",
          }}>
            {countries.length > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-travel)" }}>{countries.length}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>countries</div>
              </div>
            )}
            {cities.length > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-travel)" }}>{cities.length}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>cities</div>
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-events, #611F69)" }}>
                {(byCategory.events || []).length}
              </div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>events</div>
            </div>
            {(byCategory.activities || []).length > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>
                  {byCategory.activities.length}
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>adventures</div>
              </div>
            )}
          </div>

          {/* Country flags */}
          {countries.length > 0 && (
            <div style={{
              display: "flex",
              gap: "0.3rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
              padding: "0.75rem 1rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius, 8px)",
            }}>
              {countries.map((code) => (
                <span key={code} style={{ fontSize: "1.5rem" }}>{codeToFlag(code)}</span>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          <h6 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
            Shared with you
          </h6>
          <Row className="g-3 mb-4">
            {CATEGORY_KEYS.map((key) => {
              const catItems = byCategory[key] || [];
              if (catItems.length === 0) return null;
              const meta = categoryMeta[key] || {};
              return (
                <Col sm={6} lg={4} key={key}>
                  <div style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderLeft: `4px solid ${meta.color || "var(--color-primary)"}`,
                    borderRadius: "var(--card-radius, 8px)",
                    padding: "1rem 1.25rem",
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {meta.icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: "1.25rem", color: meta.color }}>
                        {catItems.length}
                      </span>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>

          {/* Their recent snaps */}
          {recentSnaps.length > 0 && (
            <div>
              <h6 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
                Their Recent Memories
              </h6>
              <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
                {recentSnaps.map((snap, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderLeft: `3px solid ${snap.color}`,
                      borderRadius: "var(--card-radius, 8px)",
                    }}
                  >
                    <div style={{ fontStyle: "italic", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
                      &ldquo;{snap.snapshot}&rdquo;
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
                      {snap.title} &middot; {snap.category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ContactProfile;
