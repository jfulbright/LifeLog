import { useState, useMemo } from "react";

/**
 * Generalized "whose stats" scope toggle (Epic D / D4), extracted from the
 * Movies stats page so every category stats page can offer Mine / My Circle /
 * per-person / In-common scoping.
 *
 * @param socialItems    array of the circle's shared items (socialStats.social*)
 * @param contacts       contacts list (for names/rings)
 * @param baseStats      the viewer's own computed stats (returned for "mine")
 * @param computeStatsFn (items, period) => stats
 * @param experiencedStatus  status to stamp on social items before recompute (e.g. "watched")
 * @param getUid         social item -> owner userId (default m._sharedByUserId)
 * @param getRating      social item -> rating (default m._socialRating)
 * @param myItems        the viewer's own items (for the "In common" intersection)
 * @param matchKey       item -> a comparable key (e.g. m => m.tmdbId ?? m.title); enables "In common"
 */
export default function useScopeToggle({
  socialItems,
  contacts,
  baseStats,
  computeStatsFn,
  experiencedStatus = "done",
  getUid = (m) => m._sharedByUserId,
  getRating = (m) => m._socialRating,
  myItems = [],
  matchKey = null,
}) {
  const [scope, setScope] = useState("mine");

  const scopeContacts = useMemo(() => {
    if (!socialItems) return [];
    const counts = {};
    socialItems.forEach((m) => { const uid = getUid(m); if (uid) counts[uid] = (counts[uid] || 0) + 1; });
    return (contacts || [])
      .map((c) => ({ uid: c.linkedUserId || c.linked_user_id, name: c.display_name || c.displayName, ring: c.ring_level || c.ringLevel }))
      .filter((c) => c.uid && counts[c.uid])
      .map((c) => ({ ...c, count: counts[c.uid] }))
      .sort((a, b) => b.count - a.count);
  }, [socialItems, contacts, getUid]);

  const inCommonCount = useMemo(() => {
    if (!matchKey || !socialItems) return 0;
    const myKeys = new Set((myItems || []).map(matchKey).filter(Boolean));
    return socialItems.filter((m) => myKeys.has(matchKey(m))).length;
  }, [matchKey, socialItems, myItems]);

  const scopeValid =
    scope === "mine" || scope === "circle" ||
    (scope === "together" && inCommonCount > 0) ||
    scopeContacts.some((c) => c.uid === scope);
  const activeScope = scopeValid ? scope : "mine";

  const scopedStats = useMemo(() => {
    if (activeScope === "mine") return baseStats;
    const sm = socialItems || [];
    let src;
    if (activeScope === "circle") src = sm;
    else if (activeScope === "together") {
      const myKeys = new Set((myItems || []).map(matchKey).filter(Boolean));
      src = sm.filter((m) => myKeys.has(matchKey(m)));
    } else src = sm.filter((m) => getUid(m) === activeScope);

    const normalized = src.map((m) => ({
      ...m,
      status: experiencedStatus,
      rating: getRating(m) != null ? String(getRating(m)) : (m.rating || ""),
    }));
    // Social items rarely carry a date; compute all-time so the period filter
    // (which is oriented at the viewer's own data) doesn't zero them out.
    return computeStatsFn(normalized, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, baseStats, socialItems, myItems]);

  return { scope, setScope, scopeContacts, activeScope, scopedStats, inCommonCount };
}
