import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import categoryMeta from "../helpers/categoryMeta";
import { getSnapshotTeaser } from "../helpers/operator";
import dataService from "../services/dataService";
import profileService from "../services/profileService";
import { computeTravelStats } from "../services/travelStats";
import { codeToFlag } from "../data/countries";
import { useAuth } from "../contexts/AuthContext";
import EntryDetailPanel from "../components/shared/EntryDetailPanel";
import eventSchema from "../features/events/eventSchema";
import travelSchema from "../features/travel/travelSchema";
import carSchema from "../features/cars/carSchema";
import homeSchema from "../features/homes/homeSchema";
import activitySchema from "../features/activities/activitySchema";
import cellarSchema from "../features/cellar/cellarSchema";
import kidsSchema from "../features/kids/kidsSchema";
import movieSchema from "../features/movies/movieSchema";

const SCHEMA_MAP = {
  events: eventSchema,
  travel: travelSchema,
  cars: carSchema,
  homes: homeSchema,
  activities: activitySchema,
  cellar: cellarSchema,
  kids: kidsSchema,
  movies: movieSchema,
};

const CATEGORY_KEYS = ["events", "travel", "activities", "movies", "cellar", "cars", "homes", "kids"];

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

function StatBubble({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: color || "var(--color-primary)" }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function CategoryStatCard({ cat, items }) {
  const meta = categoryMeta[cat.key] || {};
  const count = items.length;
  if (count === 0) return null;

  const experienced = items.filter((i) => !["wishlist"].includes(i.status));
  const wishlist = items.filter((i) => i.status === "wishlist");

  return (
    <Link
      to={cat.key === "travel" ? "/travel/stats" : `/${cat.key}`}
      className="text-decoration-none"
      style={{ display: "block" }}
    >
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderLeft: `4px solid ${meta.color || "var(--color-primary)"}`,
        borderRadius: "var(--card-radius, 8px)",
        padding: "1rem 1.25rem",
        transition: "box-shadow 150ms ease",
      }}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
            {meta.icon} {cat.label}
          </span>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: meta.color }}>
            {count}
          </span>
        </div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
          {experienced.length > 0 && (
            <span>{experienced.length} experienced</span>
          )}
          {experienced.length > 0 && wishlist.length > 0 && <span> &middot; </span>}
          {wishlist.length > 0 && (
            <span>{wishlist.length} planned</span>
          )}
        </div>
        <div style={{ fontSize: "var(--font-size-xs)", color: meta.color, fontWeight: 600, marginTop: "0.375rem" }}>
          View Stats &rarr;
        </div>
      </div>
    </Link>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEntry, setDetailEntry] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [prof, ...catData] = await Promise.all([
        profileService.getMyProfile().catch(() => null),
        ...categories.map(async (cat) => ({
          ...cat,
          items: await dataService.getItemsWithShared(cat.key),
          meta: categoryMeta[cat.key] || {},
        })),
      ]);
      if (!cancelled) {
        setProfile(prof);
        setAllData(catData);
        setLoading(false);
      }
    }
    load();
    const refresh = () => load();
    window.addEventListener("data-changed", refresh);
    return () => { cancelled = true; window.removeEventListener("data-changed", refresh); };
  }, []);

  if (loading) return null;

  const totalItems = allData.reduce((sum, c) => sum + c.items.length, 0);
  const travelItems = allData.find((c) => c.key === "travel")?.items || [];
  const travelStats = computeTravelStats(travelItems);
  const activityItems = allData.find((c) => c.key === "activities")?.items || [];

  const recentSnaps = allData
    .flatMap((cat) =>
      cat.items.map((item) => {
        const snap = getSnapshotTeaser(item);
        if (!snap) return null;
        return {
          id: item.id,
          category: cat.key,
          label: cat.label,
          title:
            (cat.meta.getPrimaryDisplay ? cat.meta.getPrimaryDisplay(item) : null) ||
            item[cat.meta.primaryField] || item.title || item.artist || "Untitled",
          snapshot: snap,
          date: item.startDate || item.createdAt || "",
          color: cat.meta.color || "var(--color-primary)",
          rawItem: item,
        };
      })
    )
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "You";

  return (
    <div>
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
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: "var(--color-primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.5rem",
          }}>
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h4 style={{ fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
            {displayName}
          </h4>
          {profile?.bio && (
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontStyle: "italic", marginTop: "0.2rem" }}>
              "{profile.bio}"
            </div>
          )}
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
            {totalItems} life moments captured
          </div>
        </div>
        <Link
          to="/settings?tab=account"
          style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", textDecoration: "none" }}
        >
          Edit Profile
        </Link>
      </div>

      {/* Headline stats row */}
      {totalItems > 0 && (
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          padding: "1rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius, 8px)",
          marginBottom: "1.5rem",
        }}>
          {travelStats.visitedCountryCount > 0 && (
            <StatBubble value={travelStats.visitedCountryCount} label="countries" color="var(--color-travel)" />
          )}
          <StatBubble
            value={allData.find((c) => c.key === "events")?.items.filter((i) => i.status === "attended").length || 0}
            label="events" color="var(--color-events, #611F69)"
          />
          <StatBubble
            value={travelItems.filter((i) => i.status === "visited").length}
            label="trips" color="var(--color-travel)"
          />
          {activityItems.length > 0 && (
            <StatBubble
              value={activityItems.filter((i) => i.status === "done").length}
              label="adventures" color="var(--color-success)"
            />
          )}
        </div>
      )}

      {/* World map teaser (if travel data exists) */}
      {travelStats.visitedCountryCount > 0 && (
        <Link to="/travel/stats" className="text-decoration-none" style={{ display: "block", marginBottom: "1.5rem" }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--card-radius, 8px)",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}>
            <div style={{ fontSize: "2rem" }}>🗺️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                Your World Map
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                {travelStats.visitedCountryCount} countries &middot; {travelStats.visitedContinentCount} continents
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.2rem", flexWrap: "wrap", maxWidth: 120 }}>
              {travelStats.visitedCountries.slice(0, 8).map(({ code }) => (
                <span key={code} style={{ fontSize: "1.1rem" }}>{codeToFlag(code)}</span>
              ))}
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-travel)", fontWeight: 700 }}>
              Explore &rarr;
            </span>
          </div>
        </Link>
      )}

      {/* Category stat cards */}
      <h6 style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
        By Category
      </h6>
      <Row className="g-3 mb-4">
        {allData.map((cat) => (
          <Col sm={6} lg={4} key={cat.key}>
            <CategoryStatCard cat={cat} items={cat.items} />
          </Col>
        ))}
      </Row>

      {/* Recent memories */}
      {recentSnaps.length > 0 && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 style={{ fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
              Recent Memories
            </h6>
            <Link to="/snaps" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", textDecoration: "none" }}>
              View all &rarr;
            </Link>
          </div>
          <div className="d-flex flex-column" style={{ gap: "0.5rem" }}>
            {recentSnaps.map((snap, i) => (
              <div
                key={i}
                onClick={() => snap.id && setDetailEntry(snap)}
                style={{
                  padding: "0.75rem 1rem",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${snap.color}`,
                  borderRadius: "var(--card-radius, 8px)",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontStyle: "italic", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
                  &ldquo;{snap.snapshot}&rdquo;
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
                  {snap.title} &middot; {snap.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            📸
          </div>
          <div className="empty-state-title">Start capturing your life</div>
          <div className="empty-state-text">
            Pick a category to add your first entry. Your stats will build from here.
          </div>
        </div>
      )}

      {detailEntry && (
        <EntryDetailPanel
          item={detailEntry.rawItem}
          category={detailEntry.category}
          schema={SCHEMA_MAP[detailEntry.category] || []}
          onClose={() => setDetailEntry(null)}
          onSave={(updatedData) => {
            dataService.saveItems(detailEntry.category, [updatedData]);
            setDetailEntry(null);
          }}
          onDelete={(id) => {
            setDetailEntry(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
