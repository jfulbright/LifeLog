import React, { useState, useEffect } from "react";
import { Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import StarRating from "../components/shared/StarRating";
import recommendationService from "../services/recommendationService";
import profileService from "../services/profileService";
import dataService from "../services/dataService";
import { getCategoryMeta } from "../helpers/categoryMeta";
import statusLabels from "../helpers/statusLabels";
import { findMatchingOwnedItem, mergeRecommender } from "../helpers/recommendationMatcher";
import MultiPillFilter from "../components/shared/MultiPillFilter";
import { getYearOptions, filterByYear } from "../helpers/filterUtils";

// Year/category derive from the recommended entry's date (falling back to when
// the recommendation arrived) so the filters read like the My Memories page.
const recDate = (r) => r.entry?.startDate || r.created_at || "";

// Recommendation rows use active/accepted/dismissed; the UI presents these with
// the same Pending/Accepted/Declined vocabulary as the Shared Experiences feed.
const STATUS_TABS = ["all", "pending", "accepted", "declined"];
const TAB_TO_STATUS = { pending: "active", accepted: "accepted", declined: "dismissed" };

function Recommendations() {
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeYear, setActiveYear] = useState("all");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const recs = await recommendationService.getMyRecommendations(["active", "accepted", "dismissed"]);

      // Enrich with entry data and recommender profiles
      const enrichedData = await Promise.all(
        recs.map(async (rec) => {
          const profile = await profileService.getProfileByUserId(rec.from_user_id);
          const { data: entryRow } = await (await import("../services/supabaseClient")).supabase
            .from("items")
            .select("data, category")
            .eq("id", rec.entry_id)
            .single();

          return {
            ...rec,
            recommenderName: profile?.display_name || "Someone",
            recommenderAvatar: profile?.avatar_url,
            entry: entryRow?.data || null,
            category: entryRow?.category || rec.entry_category,
          };
        })
      );

      const withEntries = enrichedData.filter((r) => r.entry);

      // Dedup auto-merge applies ONLY to pending (active) recs — accepted/dismissed
      // rows are already resolved and must not be re-merged.
      const activeRecs = withEntries.filter((r) => r.status === "active");
      const resolvedRecs = withEntries.filter((r) => r.status !== "active");

      const categories = [...new Set(activeRecs.map((r) => r.category))];
      const ownedByCategory = {};
      for (const cat of categories) {
        ownedByCategory[cat] = await dataService.getItems(cat);
      }

      const pendingNew = [];
      for (const rec of activeRecs) {
        const match = findMatchingOwnedItem(rec.entry, rec.category, ownedByCategory[rec.category]);
        if (match) {
          autoMerge(rec, match);
        } else {
          pendingNew.push(rec);
        }
      }

      setEnriched([...pendingNew, ...resolvedRecs]);
    } catch (err) {
      console.error("[Recommendations] load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function autoMerge(rec, existingItem) {
    try {
      await recommendationService.acceptRecommendation(rec.id);
      const newRecommender = {
        userId: rec.from_user_id,
        displayName: rec.recommenderName,
        entryId: rec.entry_id,
      };
      const updatedRecommendedBy = mergeRecommender(existingItem.recommendedBy, newRecommender);
      await dataService.updateItem(rec.category, existingItem.id, {
        ...existingItem,
        recommendedBy: updatedRecommendedBy,
      });
    } catch (err) {
      console.error("[Recommendations] autoMerge failed:", err);
    }
  }

  async function handleAccept(rec, status) {
    try {
      const entry = rec.entry;

      const newEntry = {
        id: crypto.randomUUID(),
        status,
        recommendedBy: [{
          userId: rec.from_user_id,
          displayName: rec.recommenderName,
          entryId: rec.entry_id,
          acceptedAt: new Date().toISOString(),
        }],
      };

      const fieldsToCopy = ["title", "city", "state", "country", "venue",
        "artist", "teams", "showName", "comedian", "festivalName", "eventName",
        "eventType", "sport", "league", "theater",
        "tmdbId", "posterUrl", "genre", "year", "director", "overview",
        "wineName", "winery", "subType", "varietal", "region", "vintage",
        "activityType", "location"];

      fieldsToCopy.forEach((field) => {
        if (entry[field]) newEntry[field] = entry[field];
      });

      await dataService.addItem(rec.category, newEntry);
      await recommendationService.acceptRecommendation(rec.id);

      // Reflect the new status locally without dropping the row (it moves to the
      // Accepted tab) so the filters stay consistent with Shared Experiences.
      setEnriched((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: "accepted" } : r)));
      window.dispatchEvent(new Event("data-changed"));
    } catch (err) {
      console.error("[Recommendations] accept failed:", err);
    }
  }

  async function handleDecline(rec) {
    try {
      await recommendationService.dismissRecommendation(rec.id);
      setEnriched((prev) => prev.map((r) => (r.id === rec.id ? { ...r, status: "dismissed" } : r)));
    } catch (err) {
      console.error("[Recommendations] decline failed:", err);
    }
  }

  const pendingCount = enriched.filter((r) => r.status === "active").length;

  const statusFiltered = statusFilter === "all"
    ? enriched
    : enriched.filter((r) => r.status === TAB_TO_STATUS[statusFilter]);

  const categories = [...new Set(enriched.map((r) => r.category))];
  const yearOptions = getYearOptions(enriched, recDate);

  const categoryFiltered = categoryFilter === "all"
    ? statusFiltered
    : statusFiltered.filter((r) => r.category === categoryFilter);
  const filtered = filterByYear(categoryFiltered, activeYear, recDate);

  // One dropdown-pill row: Status · Year · Category — consistent with the rest.
  const recPills = [
    {
      key: "__status", label: "Status", allLabel: "Any status",
      value: statusFilter, onChange: setStatusFilter,
      options: STATUS_TABS.filter((s) => s !== "all").map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
    },
    ...(yearOptions.length > 0 ? [{
      key: "__year", label: "Year", allLabel: "Any year",
      value: activeYear, onChange: setActiveYear,
      options: yearOptions.map((y) => ({ value: String(y), label: String(y) })),
    }] : []),
    ...(categories.length >= 1 ? [{
      key: "category", label: "\u{1F4C2} Category", allLabel: "All categories",
      value: categoryFilter, onChange: setCategoryFilter,
      options: categories.map((cat) => ({
        value: cat,
        label: `${getCategoryMeta(cat).icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      })),
    }] : []),
  ];

  if (loading) {
    return (
      <div className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
        Loading recommendations...
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Recommendations</h4>
        {pendingCount > 0 && (
          <Badge bg="warning" text="dark" pill>
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Unified filter row: Status · Year · Category */}
      <MultiPillFilter pills={recPills} color="var(--color-primary)" />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-warning)", color: "#fff" }}
          >
            &#11088;
          </div>
          <div className="empty-state-title">
            {statusFilter === "pending" || statusFilter === "all" ? "No recommendations yet" : `Nothing ${statusFilter}`}
          </div>
          <div className="empty-state-text">
            When friends recommend events, trips, wines, or movies, they'll appear here.
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onAccept={(status) => handleAccept(rec, status)}
              onDecline={() => handleDecline(rec)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function getAcceptActions(category) {
  const labels = statusLabels[category];
  if (!labels) return [{ status: "wishlist", label: "Add to Wishlist", variant: "primary" }];

  const actions = Object.entries(labels).map(([status, label]) => ({
    status,
    label: status === "wishlist" || status === "watchlist" ? `Add to ${label}` : label,
  }));

  const wishlistIdx = actions.findIndex((a) => a.status === "wishlist" || a.status === "watchlist");
  if (wishlistIdx > 0) {
    const [item] = actions.splice(wishlistIdx, 1);
    actions.unshift(item);
  }
  return actions;
}

function ResolvedBadge({ status }) {
  const config = {
    accepted: { label: "Accepted", bg: "var(--color-success)", color: "#fff" },
    dismissed: { label: "Declined", bg: "var(--color-danger)", color: "#fff" },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 8, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function RecommendationCard({ rec, onAccept, onDecline }) {
  const meta = getCategoryMeta(rec.category);
  const entry = rec.entry;
  const isPending = rec.status === "active";

  const title = meta.getPrimaryDisplay
    ? meta.getPrimaryDisplay(entry)
    : entry[meta.primaryField] || entry.title || entry.artist || "Untitled";

  const subtitle = (meta.secondaryFields || [])
    .map((f) => entry[f])
    .filter(Boolean)
    .join(", ");

  const snapshot = entry.snapshot1 || entry.snapshot2 || entry.snapshot3;
  const actions = getAcceptActions(rec.category);

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderLeft: `4px solid ${meta.color || "var(--color-primary)"}`,
        borderRadius: "var(--radius-md, 8px)",
        padding: "1rem 1.25rem",
        opacity: rec.status === "dismissed" ? 0.7 : 1,
      }}
    >
      {/* Recommender */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
        }}
      >
        {rec.recommenderAvatar ? (
          <img
            src={rec.recommenderAvatar}
            alt=""
            style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: meta.color || "var(--color-primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              fontWeight: 700,
            }}
          >
            {(rec.recommenderName || "?")[0].toUpperCase()}
          </span>
        )}
        <span style={{ fontWeight: 600 }}>{rec.recommenderName}</span>
        <span>recommends</span>
        <span style={{ marginLeft: "auto" }}>
          <ResolvedBadge status={rec.status} />
        </span>
      </div>

      {/* Entry info */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
          {meta.icon} {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Snapshot preview (recommender's reflection) */}
      {snapshot && (
        <div
          style={{
            fontStyle: "italic",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            borderLeft: "3px solid var(--color-border)",
            paddingLeft: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          "{snapshot}"
        </div>
      )}

      {/* Rating */}
      {entry.rating && (
        <div style={{ marginBottom: "0.75rem" }}>
          <StarRating rating={entry.rating} />
        </div>
      )}

      {/* Actions — pending recs get accept/decline; resolved recs show a link to the category */}
      {isPending ? (
        <div className="d-flex gap-2 flex-wrap">
          {actions.map((action, i) => (
            <Button
              key={action.status}
              size="sm"
              variant={i === 0 ? "primary" : "outline-primary"}
              onClick={() => onAccept(action.status)}
            >
              {action.label}
            </Button>
          ))}
          <Button size="sm" variant="outline-secondary" onClick={onDecline}>
            Decline
          </Button>
        </div>
      ) : rec.status === "accepted" ? (
        <Link
          to={`/${rec.category}?source=recommended`}
          style={{ fontSize: "var(--font-size-sm)", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
        >
          View in {rec.category.charAt(0).toUpperCase() + rec.category.slice(1)} &rarr;
        </Link>
      ) : null}
    </div>
  );
}

export default Recommendations;
