import { getSocialMovies, computeTasteAlignment, getSuggestedMovies } from "../features/movies/api/socialMovieApi";
import recommendationService from "./recommendationService";

function uid(c) { return c.linkedUserId || c.linked_user_id; }

/**
 * Compute social movie stats for the current user.
 * Returns taste alignments, suggestions, influence metrics, and genre overlap.
 */
export async function computeSocialMovieStats(myMovies, contacts) {
  const linkedContacts = contacts.filter((c) => uid(c));
  if (linkedContacts.length === 0) {
    return { alignments: [], suggestions: null, influence: null, genreOverlap: [], socialMovies: [] };
  }

  const socialMovies = await getSocialMovies({ ringLevels: [1, 2, 3, 4] });

  const moviesByContact = {};
  socialMovies.forEach((m) => {
    const uid = m._sharedByUserId;
    if (!uid) return;
    if (!moviesByContact[uid]) moviesByContact[uid] = [];
    moviesByContact[uid].push(m);
  });

  // Taste alignment per contact
  const alignments = linkedContacts
    .filter((c) => moviesByContact[uid(c)]?.length > 0)
    .map((contact) => {
      const theirMovies = moviesByContact[uid(contact)];
      const { score, overlap, aligned } = computeTasteAlignment(myMovies, theirMovies);

      const sharedLoved = findSharedLovedMovies(myMovies, theirMovies);

      return {
        contact,
        score,
        overlap,
        alignedCount: aligned.length,
        sharedLoved,
        theirMovieCount: theirMovies.length,
      };
    })
    .filter((a) => a.overlap >= 2)
    .sort((a, b) => b.score - a.score);

  // Suggestions
  const suggestions = await getSuggestedMovies(myMovies, contacts);

  // Influence metrics
  const influence = await computeInfluenceStats(myMovies);

  // Genre overlap with top aligned contact
  const genreOverlap = alignments.length > 0
    ? computeGenreOverlap(myMovies, moviesByContact[uid(alignments[0].contact)] || [])
    : [];

  return { alignments, suggestions, influence, genreOverlap, socialMovies };
}

function findSharedLovedMovies(myMovies, theirMovies) {
  const myByTmdb = {};
  myMovies.forEach((m) => {
    if (m.tmdbId && m.status === "watched" && parseInt(m.rating, 10) >= 4) {
      myByTmdb[m.tmdbId] = { title: m.title, rating: parseInt(m.rating, 10), posterUrl: m.posterUrl };
    }
  });

  const shared = [];
  theirMovies.forEach((m) => {
    if (m.tmdbId && myByTmdb[m.tmdbId] && (m._socialRating || parseInt(m.rating, 10) || 0) >= 4) {
      shared.push({
        title: myByTmdb[m.tmdbId].title,
        posterUrl: myByTmdb[m.tmdbId].posterUrl,
        myRating: myByTmdb[m.tmdbId].rating,
        theirRating: m._socialRating || parseInt(m.rating, 10) || 0,
      });
    }
  });

  return shared.sort((a, b) => (b.myRating + b.theirRating) - (a.myRating + a.theirRating)).slice(0, 5);
}

async function computeInfluenceStats(myMovies) {
  try {
    const sent = await recommendationService.getMySentRecommendations();
    const movieSent = sent.filter((r) => r.entry_category === "movies");

    const received = await recommendationService.getMyRecommendations();
    const movieReceived = received.filter((r) => r.entry_category === "movies");

    const acceptedSent = movieSent.filter((r) => r.status === "accepted");
    const watchedFromRecs = myMovies.filter((m) => m.recommendedBy && m.status === "watched");

    const influencerFreq = {};
    watchedFromRecs.forEach((m) => {
      const name = m.recommendedBy?.displayName;
      if (name) influencerFreq[name] = (influencerFreq[name] || 0) + 1;
    });
    const topInfluencer = Object.entries(influencerFreq)
      .sort((a, b) => b[1] - a[1])[0] || null;

    return {
      sent: movieSent.length,
      sentAccepted: acceptedSent.length,
      received: movieReceived.length,
      watchedFromRecs: watchedFromRecs.length,
      topInfluencer: topInfluencer ? { name: topInfluencer[0], count: topInfluencer[1] } : null,
    };
  } catch {
    return null;
  }
}

function computeGenreOverlap(myMovies, theirMovies) {
  const myGenres = {};
  myMovies.filter((m) => m.status === "watched").forEach((m) => {
    (m.genre || "").split(",").forEach((g) => {
      const t = g.trim();
      if (t) myGenres[t] = (myGenres[t] || 0) + 1;
    });
  });

  const theirGenres = {};
  theirMovies.forEach((m) => {
    (m.genre || "").split(",").forEach((g) => {
      const t = g.trim();
      if (t) theirGenres[t] = (theirGenres[t] || 0) + 1;
    });
  });

  const allGenres = new Set([...Object.keys(myGenres), ...Object.keys(theirGenres)]);
  return [...allGenres]
    .map((genre) => ({
      genre,
      mine: myGenres[genre] || 0,
      theirs: theirGenres[genre] || 0,
      shared: Math.min(myGenres[genre] || 0, theirGenres[genre] || 0) > 0,
    }))
    .sort((a, b) => (b.mine + b.theirs) - (a.mine + a.theirs))
    .slice(0, 10);
}
