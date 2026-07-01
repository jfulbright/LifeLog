import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import dataService from "../services/dataService";
import profileService from "../services/profileService";
import { enrichItemsWithSocialContent } from "../helpers/socialContent";
import { useAppData } from "../contexts/AppDataContext";
import { SCHEMA_MAP, CATEGORY_KEYS } from "../helpers/schemaRegistry";
import ItemCardList from "../components/shared/ItemCardList";
import EntryDetailPanel from "../components/shared/EntryDetailPanel";

/**
 * Read-only category page for another user's profile (Epic D / D5).
 * Renders their visibility-gated items for a single category — no add / log /
 * search / edit. Opening an item shows the same rich EntryDetailPanel (trip
 * itineraries, movie details, etc.) in read-only mode.
 */
function VisitorCategoryPage() {
  const { userId, category } = useParams();
  const { contacts } = useAppData();
  const [items, setItems] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState(null);

  const validCategory = CATEGORY_KEYS.includes(category);
  const meta = categoryMeta[category] || {};
  const schema = SCHEMA_MAP[category] || [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!validCategory) { setLoading(false); return; }
      const [prof, rawItems] = await Promise.all([
        profileService.getProfileByUserId(userId).catch(() => null),
        dataService.getItemsForUser(userId, category),
      ]);
      const enriched = await enrichItemsWithSocialContent(rawItems, contacts);
      if (!cancelled) {
        setDisplayName(prof?.display_name || "Someone");
        setItems(enriched);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, category, contacts, validCategory]);

  if (!validCategory) {
    return <div className="empty-state"><div className="empty-state-title">Unknown category</div></div>;
  }
  if (loading) return null;

  const label = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          {meta.icon} {displayName}'s {label}
        </h4>
        <Link to={`/u/${userId}`} className="btn btn-sm btn-outline-secondary">
          &larr; Profile
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: meta.color || "var(--color-primary)", color: "#fff" }}>
            {meta.icon || "📄"}
          </div>
          <div className="empty-state-title">Nothing visible here</div>
          <div className="empty-state-text">
            {displayName} hasn't shared any {label.toLowerCase()} visible to you.
          </div>
        </div>
      ) : (
        <ItemCardList
          category={category}
          items={items}
          schema={schema}
          onViewDetail={setDetailItem}
        />
      )}

      {detailItem && (
        <EntryDetailPanel
          item={detailItem}
          category={category}
          schema={schema}
          readOnly
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}

export default VisitorCategoryPage;
