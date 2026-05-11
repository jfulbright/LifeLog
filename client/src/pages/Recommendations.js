import React, { useState, useEffect } from "react";
import { Button, Badge } from "react-bootstrap";
import recommendationService from "../services/recommendationService";
import profileService from "../services/profileService";
import dataService from "../services/dataService";
import { getCategoryMeta } from "../helpers/categoryMeta";

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
          // Fetch the entry data
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

      setEnriched(enrichedData.filter((r) => r.entry));
    } catch (err) {
      console.error("[Recommendations] load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWishlist(rec) {
    try {
      const entry = rec.entry;

      // Create a new wishlist entry pre-populated from the recommendation
      const newEntry = {
        id: crypto.randomUUID(),
        status: "wishlist",
        recommendedBy: {
          userId: rec.from_user_id,
          displayName: rec.recommenderName,
          entryId: rec.entry_id,
        },
      };

      // Copy relevant fields based on category
      const fieldsToCopy = ["title", "city", "state", "country", "venue",
        "artist", "teams", "showName", "comedian", "festivalName", "eventName",
        "eventType", "sport", "league", "theater"];

      fieldsToCopy.forEach((field) => {
        if (entry[field]) newEntry[field] = entry[field];
      });

      await dataService.addItem(rec.category, newEntry);
      await recommendationService.acceptRecommendation(rec.id);

      setEnriched((prev) => prev.filter((r) => r.id !== rec.id));
      window.dispatchEvent(new Event("data-changed"));
    } catch (err) {
      console.error("[Recommendations] addToWishlist failed:", err);
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
        <h4 className="mb-0" style={{ fontWeight: 700 }}>For You</h4>
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
                onAddToWishlist={() => handleAddToWishlist(rec)}
                onDismiss={() => handleDismiss(rec)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function RecommendationCard({ rec, onAddToWishlist, onDismiss }) {
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
        <div style={{ marginBottom: "0.75rem", color: "#f5a623", letterSpacing: "0.05em" }}>
          {"★".repeat(parseInt(entry.rating))}{"☆".repeat(5 - parseInt(entry.rating))}
        </div>
      )}

      {/* Actions */}
      <div className="d-flex gap-2">
        <Button size="sm" variant="primary" onClick={onAddToWishlist}>
          Add to Wishlist
        </Button>
        <Button size="sm" variant="outline-secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export default Recommendations;
