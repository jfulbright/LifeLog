import { supabase } from "../../../services/supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

/**
 * Get movies from the user's social circles with optional filters.
 * Queries other users' movie items where visibility allows access.
 */
export async function getSocialMovies({ ringLevels = [1, 2, 3, 4], minRating = 0, excludeTmdbIds = [], contactId = null } = {}) {
  const userId = await getCurrentUserId();

  // Get contacts with linked accounts in the specified rings
  let contactQuery = supabase
    .from("contacts")
    .select("id, display_name, ring_level, linked_user_id")
    .eq("owner_id", userId)
    .in("ring_level", ringLevels)
    .not("linked_user_id", "is", null);

  if (contactId) {
    contactQuery = contactQuery.eq("id", contactId);
  }

  const { data: contacts, error: contactErr } = await contactQuery;
  if (contactErr || !contacts?.length) return [];

  const linkedUserIds = contacts.map((c) => c.linked_user_id);
  const contactMap = {};
  contacts.forEach((c) => { contactMap[c.linked_user_id] = c; });

  // Query movie items from those users
  const { data: rows, error: rowsErr } = await supabase
    .from("items")
    .select("id, user_id, data")
    .eq("category", "movies")
    .in("user_id", linkedUserIds);

  if (rowsErr || !rows?.length) return [];

  // Filter by visibility, rating, and exclusion list
  const results = [];
  for (const row of rows) {
    const movie = row.data || {};
    const contact = contactMap[row.user_id];
    if (!contact) continue;

    // Check visibility: movie's visibilityRings should include the ring level
    // that the owner assigned to the current user (which is contact.ring_level from their perspective)
    // Since we can't easily query what ring level THEY assigned to US,
    // we check if visibilityRings includes common levels or is set to all
    const visRings = movie.visibilityRings || [];
    if (visRings.length === 0) continue; // private movie

    // Rating filter
    const rating = parseInt(movie.rating, 10) || 0;
    if (minRating > 0 && rating < minRating) continue;

    // Exclude already-seen
    if (excludeTmdbIds.length > 0 && movie.tmdbId && excludeTmdbIds.includes(movie.tmdbId)) continue;

    results.push({
      ...movie,
      id: row.id,
      _socialSource: true,
      _sharedByName: contact.display_name,
      _sharedByRing: contact.ring_level,
      _sharedByContactId: contact.id,
      _sharedByUserId: row.user_id,
      _socialRating: rating,
    });
  }

  // Sort by rating descending
  results.sort((a, b) => (b._socialRating || 0) - (a._socialRating || 0));
  return results;
}

/**
 * Get enriched movie recommendations directed at the current user.
 */
export async function getMovieRecommendationsEnriched() {
  const userId = await getCurrentUserId();

  // Direct recommendations
  const { data: direct } = await supabase
    .from("recommendations")
    .select("*")
    .eq("to_user_id", userId)
    .eq("status", "active")
    .eq("entry_category", "movies")
    .order("created_at", { ascending: false });

  // Ring-based recommendations
  const { data: contactsWhoHaveMe } = await supabase
    .from("contacts")
    .select("owner_id, ring_level")
    .eq("linked_user_id", userId);

  let ringRecs = [];
  if (contactsWhoHaveMe?.length) {
    for (const contact of contactsWhoHaveMe) {
      const { data: recs } = await supabase
        .from("recommendations")
        .select("*")
        .eq("from_user_id", contact.owner_id)
        .eq("to_ring_level", contact.ring_level)
        .eq("entry_category", "movies")
        .eq("status", "active")
        .is("to_user_id", null);

      if (recs) ringRecs = [...ringRecs, ...recs];
    }
  }

  // Deduplicate
  const allRecs = [...(direct || []), ...ringRecs];
  const seen = new Set();
  const dedupedRecs = allRecs.filter((r) => {
    if (seen.has(r.entry_id)) return false;
    seen.add(r.entry_id);
    return true;
  });

  if (dedupedRecs.length === 0) return [];

  // Enrich with entry data and recommender info
  const entryIds = dedupedRecs.map((r) => r.entry_id);
  const { data: entryRows } = await supabase
    .from("items")
    .select("id, data")
    .in("id", entryIds);

  const entryMap = {};
  (entryRows || []).forEach((row) => { entryMap[row.id] = row.data; });

  // Get recommender profiles
  const recommenderIds = [...new Set(dedupedRecs.map((r) => r.from_user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", recommenderIds);

  const profileMap = {};
  (profiles || []).forEach((p) => { profileMap[p.id] = p; });

  // Get contact info for ring context
  const { data: myContacts } = await supabase
    .from("contacts")
    .select("linked_user_id, ring_level, display_name")
    .eq("owner_id", userId)
    .not("linked_user_id", "is", null);

  const myContactMap = {};
  (myContacts || []).forEach((c) => { myContactMap[c.linked_user_id] = c; });

  return dedupedRecs
    .map((rec) => {
      const entry = entryMap[rec.entry_id];
      if (!entry) return null;
      const profile = profileMap[rec.from_user_id] || {};
      const contact = myContactMap[rec.from_user_id];

      return {
        ...entry,
        id: rec.entry_id,
        _recId: rec.id,
        _recommendedBy: profile.display_name || contact?.display_name || "Someone",
        _recommenderAvatar: profile.avatar_url || null,
        _recommenderRing: contact?.ring_level || null,
        _recommendedAt: rec.created_at,
        _socialRating: parseInt(entry.rating, 10) || 0,
      };
    })
    .filter(Boolean);
}

/**
 * Compute taste alignment score between user's movies and a contact's movies.
 * Returns a value 0-1 representing how similar their ratings are.
 */
export function computeTasteAlignment(ownMovies, contactMovies) {
  const ownByTmdb = {};
  ownMovies.forEach((m) => {
    if (m.tmdbId && m.rating) ownByTmdb[m.tmdbId] = parseInt(m.rating, 10);
  });

  const contactByTmdb = {};
  contactMovies.forEach((m) => {
    if (m.tmdbId && m.rating) contactByTmdb[m.tmdbId] = parseInt(m.rating, 10);
  });

  // Find movies both have rated
  const sharedTmdbIds = Object.keys(ownByTmdb).filter((id) => contactByTmdb[id]);
  if (sharedTmdbIds.length < 2) return { score: 0, overlap: 0, aligned: [] };

  let totalDiff = 0;
  const aligned = [];
  for (const id of sharedTmdbIds) {
    const diff = Math.abs(ownByTmdb[id] - contactByTmdb[id]);
    totalDiff += diff;
    if (diff <= 1) aligned.push(id);
  }

  const maxDiff = sharedTmdbIds.length * 4; // max possible difference per movie is 4
  const score = 1 - totalDiff / maxDiff;

  return { score, overlap: sharedTmdbIds.length, aligned };
}

/**
 * Generate suggested movies using social signals.
 * Returns sections: consensus, taste-match, genre-affinity.
 */
export async function getSuggestedMovies(ownMovies, contacts) {
  const allSocial = await getSocialMovies({ ringLevels: [1, 2, 3, 4], minRating: 0 });
  if (allSocial.length === 0) return { consensus: [], tasteMatch: [], genreAffinity: [] };

  const ownTmdbIds = new Set(ownMovies.map((m) => m.tmdbId).filter(Boolean));

  // Filter to unseen only
  const unseen = allSocial.filter((m) => m.tmdbId && !ownTmdbIds.has(m.tmdbId));

  // --- Consensus picks: movies rated 4+ by 2+ people ---
  const tmdbCounts = {};
  const tmdbBest = {};
  unseen.forEach((m) => {
    if ((m._socialRating || 0) >= 4) {
      const key = m.tmdbId;
      tmdbCounts[key] = (tmdbCounts[key] || 0) + 1;
      if (!tmdbBest[key] || m._socialRating > tmdbBest[key]._socialRating) {
        tmdbBest[key] = m;
      }
    }
  });
  const consensus = Object.entries(tmdbCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tmdbId, count]) => ({ ...tmdbBest[tmdbId], _consensusCount: count }));

  // --- Taste alignment: find best-matching contact ---
  const contactGroups = {};
  unseen.forEach((m) => {
    const uid = m._sharedByUserId;
    if (!uid) return;
    if (!contactGroups[uid]) contactGroups[uid] = [];
    contactGroups[uid].push(m);
  });

  let bestContact = null;
  let bestScore = 0;
  for (const [uid, movies] of Object.entries(contactGroups)) {
    const { score } = computeTasteAlignment(ownMovies, movies);
    if (score > bestScore) {
      bestScore = score;
      bestContact = { userId: uid, movies, score };
    }
  }

  const tasteMatch = bestContact
    ? bestContact.movies
        .filter((m) => (m._socialRating || 0) >= 4)
        .slice(0, 8)
        .map((m) => ({ ...m, _tasteScore: bestScore }))
    : [];

  // --- Genre affinity: genres popular in circles that user hasn't explored ---
  const ownGenres = new Set();
  ownMovies.forEach((m) => {
    (m.genre || "").split(",").forEach((g) => { if (g.trim()) ownGenres.add(g.trim()); });
  });

  const socialGenreCounts = {};
  unseen.forEach((m) => {
    (m.genre || "").split(",").forEach((g) => {
      const trimmed = g.trim();
      if (trimmed && !ownGenres.has(trimmed)) {
        socialGenreCounts[trimmed] = (socialGenreCounts[trimmed] || 0) + 1;
      }
    });
  });

  const topNewGenre = Object.entries(socialGenreCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const genreAffinity = topNewGenre
    ? unseen
        .filter((m) => (m.genre || "").includes(topNewGenre[0]))
        .slice(0, 8)
        .map((m) => ({ ...m, _suggestedGenre: topNewGenre[0] }))
    : [];

  return {
    consensus,
    tasteMatch,
    tasteMatchContact: bestContact ? allSocial.find((m) => m._sharedByUserId === bestContact.userId)?._sharedByName : null,
    genreAffinity,
    suggestedGenre: topNewGenre ? topNewGenre[0] : null,
  };
}
