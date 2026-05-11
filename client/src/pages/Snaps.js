import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import { getAllSnapshots, getItemPhotos } from "../helpers/operator";
import dataService from "../services/dataService";

const CATEGORY_KEYS = ["events", "concerts", "travel", "cars", "homes", "activities", "cellar"];

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

const VIEW_TABS = [
  { id: "all", label: "All" },
  { id: "snaps", label: "✨ Snaps" },
  { id: "photos", label: "📷 Photos" },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Snaps() {
  const [activeView, setActiveView] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [allSnaps, setAllSnaps] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const groups = await Promise.all(
        categories.map(async (cat) => {
          const meta = categoryMeta[cat.key] || {};
          const items = await dataService.getItems(cat.key);

          const snaps = [];
          const photos = [];

          items.forEach((item) => {
            const title =
              item[meta.primaryField] ||
              item.artist ||
              item.title ||
              item.type ||
              item.make ||
              "Untitled";
            const date = item.startDate || item.createdAt || "";

            // Text snaps
            getAllSnapshots(item).forEach((text, i) => {
              snaps.push({
                kind: "snap",
                text,
                title,
                category: cat.key,
                label: cat.label,
                icon: meta.icon,
                color: meta.color,
                date,
                key: `${cat.key}-snap-${item.id || title}-${i}`,
              });
            });

            // Photos
            getItemPhotos(item).forEach((url, i) => {
              photos.push({
                kind: "photo",
                url,
                title,
                category: cat.key,
                label: cat.label,
                icon: meta.icon,
                color: meta.color,
                date,
                key: `${cat.key}-photo-${item.id || title}-${i}`,
              });
            });
          });

          return { snaps, photos };
        })
      );

      if (!cancelled) {
        setAllSnaps(groups.flatMap((g) => g.snaps));
        setAllPhotos(groups.flatMap((g) => g.photos));
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filterByCategory = (items) =>
    activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  const sortByDate = (items) =>
    [...items].sort((a, b) => b.date.localeCompare(a.date));

  const filteredSnaps = sortByDate(filterByCategory(allSnaps));
  const filteredPhotos = sortByDate(filterByCategory(allPhotos));
  const filteredAll = sortByDate(filterByCategory([...allSnaps, ...allPhotos]));

  const visibleItems =
    activeView === "snaps" ? filteredSnaps :
    activeView === "photos" ? filteredPhotos :
    filteredAll;

  const categoriesWithContent = categories.filter((cat) => {
    const hasSnap = allSnaps.some((s) => s.category === cat.key);
    const hasPhoto = allPhotos.some((p) => p.category === cat.key);
    return hasSnap || hasPhoto;
  });

  if (loading) return null;

  const totalSnaps = allSnaps.length;
  const totalPhotos = allPhotos.length;
  const isEmpty = totalSnaps === 0 && totalPhotos === 0;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ fontWeight: 700, margin: 0 }}>📸 Memories</h4>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
          {totalSnaps > 0 && `${totalSnaps} snap${totalSnaps !== 1 ? "s" : ""}`}
          {totalSnaps > 0 && totalPhotos > 0 && " · "}
          {totalPhotos > 0 && `${totalPhotos} photo${totalPhotos !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* View tabs: All / Snaps / Photos */}
      <div className="memories-view-tabs mb-3">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`memories-tab-btn${activeView === tab.id ? " active" : ""}`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter pills */}
      {categoriesWithContent.length > 1 && (
        <div className="status-toggle mb-4">
          <button
            className={`btn ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categoriesWithContent.map((cat) => {
            const meta = categoryMeta[cat.key] || {};
            return (
              <button
                key={cat.key}
                className={`btn ${activeCategory === cat.key ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {meta.icon} {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {isEmpty ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            📸
          </div>
          <div className="empty-state-title">No memories yet</div>
          <div className="empty-state-text">
            Add snapshots or photos to your entries and they will appear here.
          </div>
          <Link to="/" className="btn btn-outline-primary btn-sm">
            Go to Dashboard
          </Link>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {activeView === "photos" ? "📷" : "✨"}
          </div>
          <div className="empty-state-title">
            No {activeView === "photos" ? "photos" : activeView === "snaps" ? "snaps" : "memories"} yet
            {activeCategory !== "all" ? ` in ${activeCategory}` : ""}
          </div>
        </div>
      ) : activeView === "photos" ? (
        /* ── Photo grid layout ── */
        <div className="memories-photo-grid">
          {filteredPhotos.map((photo) => (
            <PhotoCard key={photo.key} item={photo} />
          ))}
        </div>
      ) : activeView === "snaps" ? (
        /* ── Text snaps layout ── */
        <div className="snaps-gallery">
          {filteredSnaps.map((snap) => (
            <SnapCard key={snap.key} item={snap} />
          ))}
        </div>
      ) : (
        /* ── Mixed "All" layout ── */
        <div className="memories-mixed-feed">
          {visibleItems.map((item) =>
            item.kind === "photo" ? (
              <PhotoCard key={item.key} item={item} compact />
            ) : (
              <SnapCard key={item.key} item={item} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SnapCard({ item }) {
  return (
    <div className="snap-card" style={{ borderLeftColor: item.color }}>
      <div className="snap-card-quote">✨ &ldquo;{item.text}&rdquo;</div>
      <div className="snap-card-source">
        <span className="snap-card-icon" aria-hidden="true">{item.icon}</span>
        <span>{item.title}</span>
        <span className="snap-card-divider">&middot;</span>
        <span>{item.label}</span>
        {item.date && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{formatDate(item.date)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ item, compact = false }) {
  return (
    <div className={`memories-photo-card${compact ? " compact" : ""}`}>
      <img
        src={item.url}
        alt={item.title}
        className="memories-photo-img"
      />
      <div className="memories-photo-caption">
        <span className="memories-photo-caption-icon" aria-hidden="true">{item.icon}</span>
        <span className="memories-photo-caption-title">{item.title}</span>
        {item.date && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{formatDate(item.date)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default Snaps;
