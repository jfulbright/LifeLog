import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import { formatDisplayDate } from "../helpers/dateUtils";
import { getAllSnapshots, getItemPhotos, isSharedSource } from "../helpers/operator";
import {
  enrichItemsWithSocialContent,
  getAllSocialSnaps,
  getAllSocialPhotos,
} from "../helpers/socialContent";
import dataService from "../services/dataService";
import SourceFilterPills from "../components/shared/SourceFilterPills";
import StatsStrip from "../components/shared/StatsStrip";
import MultiPillFilter from "../components/shared/MultiPillFilter";
import { matchesDoneWishlist } from "../components/shared/DoneWishlistFilter";
import { getYearOptions, filterByYear } from "../helpers/filterUtils";
import EntryDetailPanel from "../components/shared/EntryDetailPanel";
import { useAppData } from "../contexts/AppDataContext";
import { SCHEMA_MAP, CATEGORY_KEYS } from "../helpers/schemaRegistry";

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

const VIEW_TABS = [
  { id: "all", label: "All" },
  { id: "snaps", label: "✨ Snaps" },
  { id: "photos", label: "📷 Photos" },
];

function Snaps() {
  const [activeView, setActiveView] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeYear, setActiveYear] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [allSnaps, setAllSnaps] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEntry, setDetailEntry] = useState(null);
  const { profile, contacts } = useAppData();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const groups = await Promise.all(
        categories.map(async (cat) => {
          const meta = categoryMeta[cat.key] || {};
          const rawItems = await dataService.getItemsWithShared(cat.key);
          const items = await enrichItemsWithSocialContent(rawItems, contacts);

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
                itemId: item.id,
                category: cat.key,
                label: cat.label,
                icon: meta.icon,
                color: meta.color,
                date,
                isShared: isSharedSource(item),
                rawItem: item,
                key: `${cat.key}-snap-${item.id || title}-${i}`,
              });
            });
            getAllSocialSnaps(item)
              .filter(({ contribution }) => !contribution.isOwner)
              .forEach(({ text, contribution, index }) => {
                snaps.push({
                  kind: "snap",
                  text,
                  title,
                  itemId: item.id,
                  category: cat.key,
                  label: cat.label,
                  icon: meta.icon,
                  color: meta.color,
                  date,
                  isShared: true,
                  rawItem: item,
                  author: contribution.displayName,
                  key: `${cat.key}-overlay-snap-${item.id || title}-${contribution.userId || "user"}-${index}`,
                });
              });

            // Photos
            getItemPhotos(item).forEach((url, i) => {
              photos.push({
                kind: "photo",
                url,
                title,
                itemId: item.id,
                category: cat.key,
                label: cat.label,
                icon: meta.icon,
                color: meta.color,
                date,
                isShared: isSharedSource(item),
                rawItem: item,
                key: `${cat.key}-photo-${item.id || title}-${i}`,
              });
            });
            getAllSocialPhotos(item)
              .filter(({ contribution }) => !contribution.isOwner)
              .forEach(({ url, contribution, index }) => {
                photos.push({
                  kind: "photo",
                  url,
                  title,
                  itemId: item.id,
                  category: cat.key,
                  label: cat.label,
                  icon: meta.icon,
                  color: meta.color,
                  date,
                  isShared: true,
                  rawItem: item,
                  author: contribution.displayName,
                  key: `${cat.key}-overlay-photo-${item.id || title}-${contribution.userId || "user"}-${index}`,
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
  }, [contacts]);

  const filterByCategory = (items) =>
    activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);

  const filterBySource = (items) => {
    if (sourceFilter === "mine") return items.filter((i) => !i.isShared);
    if (sourceFilter === "shared") return items.filter((i) => i.isShared);
    if (sourceFilter === "recommended") return items.filter((i) => i.rawItem?._isRecommended);
    return items;
  };

  const filterByYearLocal = (items) => filterByYear(items, activeYear, "date");

  const filterByStatusLocal = (items) =>
    items.filter((i) => matchesDoneWishlist(i.rawItem?.status, activeStatus));

  const sortByDate = (items) =>
    [...items].sort((a, b) => b.date.localeCompare(a.date));

  const applyFilters = (items) =>
    sortByDate(filterBySource(filterByYearLocal(filterByStatusLocal(filterByCategory(items)))));

  const yearOptions = getYearOptions([...allSnaps, ...allPhotos], "date");
  const filteredSnaps = applyFilters(allSnaps);
  const filteredPhotos = applyFilters(allPhotos);
  const filteredAll = applyFilters([...allSnaps, ...allPhotos]);

  const visibleItems =
    activeView === "snaps" ? filteredSnaps :
    activeView === "photos" ? filteredPhotos :
    filteredAll;

  const categoriesWithContent = categories.filter((cat) => {
    const hasSnap = allSnaps.some((s) => s.category === cat.key);
    const hasPhoto = allPhotos.some((p) => p.category === cat.key);
    return hasSnap || hasPhoto;
  });

  // One dropdown-pill row: Status · Year · Category (view toggle stays separate).
  const snapsPills = [
    {
      key: "__status", label: "Status", allLabel: "Any status",
      value: activeStatus, onChange: setActiveStatus,
      options: [{ value: "done", label: "Done" }, { value: "wishlist", label: "Wishlist" }],
    },
    ...(yearOptions.length > 0 ? [{
      key: "__year", label: "Year", allLabel: "Any year",
      value: activeYear, onChange: setActiveYear,
      options: yearOptions.map((y) => ({ value: String(y), label: String(y) })),
    }] : []),
    ...(categoriesWithContent.length > 1 ? [{
      key: "__category", label: "Category", allLabel: "All categories",
      value: activeCategory, onChange: setActiveCategory,
      options: categoriesWithContent.map((cat) => ({
        value: cat.key,
        label: `${(categoryMeta[cat.key] || {}).icon || ""} ${cat.label}`,
      })),
    }] : []),
  ];

  if (loading) return null;

  const totalSnaps = allSnaps.length;
  const totalPhotos = allPhotos.length;
  const isEmpty = totalSnaps === 0 && totalPhotos === 0;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 style={{ fontWeight: 700, margin: 0 }}>📸 Memories</h4>
      </div>

      {(totalSnaps > 0 || totalPhotos > 0) && (
        <StatsStrip stats={[
          ...(totalSnaps > 0 ? [{ value: totalSnaps, label: "snaps", color: "var(--color-primary)" }] : []),
          ...(totalPhotos > 0 ? [{ value: totalPhotos, label: "photos", color: "var(--color-events)" }] : []),
        ]} />
      )}

      {/* Unified filter row: Status · Year · Category */}
      <MultiPillFilter pills={snapsPills} color="var(--color-primary)" />

      {/* View tabs: All / Snaps / Photos */}
      <div className="d-flex gap-2 mb-3">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: "0.3rem 0.9rem",
              borderRadius: "20px",
              border: "2px solid var(--color-primary)",
              background: activeView === tab.id ? "var(--color-primary)" : "transparent",
              color: activeView === tab.id ? "#fff" : "var(--color-primary)",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SourceFilterPills
        value={sourceFilter}
        onChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={[...allSnaps, ...allPhotos].filter((i) => i.isShared).length}
        recommendedCount={[...allSnaps, ...allPhotos].filter((i) => i.rawItem?._isRecommended).length}
      />

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
            <PhotoCard key={photo.key} item={photo} onViewDetail={setDetailEntry} />
          ))}
        </div>
      ) : activeView === "snaps" ? (
        /* ── Text snaps layout ── */
        <div className="snaps-gallery">
          {filteredSnaps.map((snap) => (
            <SnapCard key={snap.key} item={snap} onViewDetail={setDetailEntry} />
          ))}
        </div>
      ) : (
        /* ── Mixed "All" layout ── */
        <div className="memories-mixed-feed">
          {visibleItems.map((item) =>
            item.kind === "photo" ? (
              <PhotoCard key={item.key} item={item} compact onViewDetail={setDetailEntry} />
            ) : (
              <SnapCard key={item.key} item={item} onViewDetail={setDetailEntry} />
            )
          )}
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

function SnapCard({ item, onViewDetail }) {
  return (
    <div
      className="snap-card"
      style={{ borderLeftColor: item.color, cursor: "pointer" }}
      onClick={() => item.rawItem && onViewDetail(item)}
    >
      <div className="snap-card-quote">✨ &ldquo;{item.text}&rdquo;</div>
      <div className="snap-card-source">
        <span className="snap-card-icon" aria-hidden="true">{item.icon}</span>
        <span>{item.title}</span>
        {item.author && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{item.author}</span>
          </>
        )}
        <span className="snap-card-divider">&middot;</span>
        <span>{item.label}</span>
        {item.date && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{formatDisplayDate(item.date)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function PhotoCard({ item, compact = false, onViewDetail }) {
  return (
    <div
      className={`memories-photo-card${compact ? " compact" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={() => item.rawItem && onViewDetail(item)}
    >
      <img
        src={item.url}
        alt={item.title}
        className="memories-photo-img"
      />
      <div className="memories-photo-caption">
        <span className="memories-photo-caption-icon" aria-hidden="true">{item.icon}</span>
        <span className="memories-photo-caption-title">{item.title}</span>
        {item.author && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{item.author}</span>
          </>
        )}
        {item.date && (
          <>
            <span className="snap-card-divider">&middot;</span>
            <span>{formatDisplayDate(item.date)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default Snaps;
