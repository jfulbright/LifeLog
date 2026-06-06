import React, { useState, useEffect } from "react";
import { Button, Badge } from "react-bootstrap";
import StarRating from "../components/shared/StarRating";
import recommendationService from "../services/recommendationService";
import profileService from "../services/profileService";
import dataService from "../services/dataService";
import { getCategoryMeta } from "../helpers/categoryMeta";
import statusLabels from "../helpers/statusLabels";
import { findMatchingOwnedItem, mergeRecommender } from "../helpers/recommendationMatcher";

function Recommendations() {
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const recs = await recommendationService.getMyRecommendations();

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

      // Dedup: auto-merge recommendations for items the user already owns
      const categories = [...new Set(withEntries.map((r) => r.category))];
      const ownedByCategory = {};
      for (const cat of categories) {
        ownedByCategory[cat] = await dataService.getItems(cat);
      }

      const genuinelyNew = [];
      for (const rec of withEntries) {
        const match = findMatchingOwnedItem(rec.entry, rec.category, ownedByCategory[rec.category]);
        if (match) {
          autoMerge(rec, match);
        } else {
          genuinelyNew.push(rec);
        }
      }

      setEnriched(genuinelyNew);
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

      setEnriched((prev) => prev.filter((r) => r.id !== rec.id));
      window.dispatchEvent(new Event("data-changed"));
    } catch (err) {
      console.error("[Recommendations] accept failed:", err);
    }
  }

  async function handleDismiss(rec) {
    try {
      await recommendationService.dismissRecommendation(rec.id);
      setEnriched((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (err) {
      console.error("[Recommendations] dismiss failed:", err);
    }
  }

  const categories = [...new Set(enriched.map((r) => r.category))];
  const filtered = filter === "all"
    ? enriched
    : enriched.filter((r) => r.category === filter);

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
        {enriched.length > 0 && (
          <Badge bg="warning" text="dark" pill>
            {enriched.length} new
          </Badge>
        )}
      </div>

      {enriched.length === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-warning)", color: "#fff" }}
          >
            &#11088;
          </div>
          <div className="empty-state-title">No recommendations yet</div>
          <div className="empty-state-text">
            When friends recommend events, trips, wines, or movies, they'll appear here.
          </div>
        </div>
      ) : (
        <>
          {/* Category filter */}
          {categories.length > 1 && (
            <div className="d-flex gap-2 mb-3 flex-wrap">
              <button
                className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              {categories.map((cat) => {
                const meta = getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    className={`btn btn-sm ${filter === cat ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setFilter(cat)}
                  >
                    {meta.icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Recommendation cards */}
          <div className="d-flex flex-column" style={{ gap: "0.75rem" }}>
            {filtered.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onAccept={(status) => handleAccept(rec, status)}
                onDismiss={() => handleDismiss(rec)}
              />
            ))}
          </div>
        </>
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

function RecommendationCard({ rec, onAccept, onDismiss }) {
  const meta = getCategoryMeta(rec.category);
  const entry = rec.entry;

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

      {/* Actions */}
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
        <Button size="sm" variant="outline-secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export default Recommendations;
