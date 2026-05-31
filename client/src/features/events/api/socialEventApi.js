import { supabase } from "../../../services/supabaseClient";
import recommendationService from "../../../services/recommendationService";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getSocialEvents({ ringLevels = [1, 2, 3, 4] } = {}) {
  const userId = await getCurrentUserId();

  const { data: contacts, error: contactErr } = await supabase
    .from("contacts")
    .select("id, display_name, ring_level, linked_user_id")
    .eq("owner_id", userId)
    .in("ring_level", ringLevels)
    .not("linked_user_id", "is", null);

  if (contactErr || !contacts?.length) return [];

  const linkedUserIds = contacts.map((c) => c.linked_user_id);
  const contactMap = {};
  contacts.forEach((c) => { contactMap[c.linked_user_id] = c; });

  const { data: rows, error: rowsErr } = await supabase
    .from("items")
    .select("id, user_id, data")
    .eq("category", "events")
    .in("user_id", linkedUserIds);

  if (rowsErr || !rows?.length) return [];

  const results = [];
  for (const row of rows) {
    const event = row.data || {};
    const contact = contactMap[row.user_id];
    if (!contact) continue;
    const visRings = event.visibilityRings || [];
    if (visRings.length === 0) continue;

    results.push({
      ...event,
      id: row.id,
      _sharedByName: contact.display_name,
      _sharedByRing: contact.ring_level,
      _sharedByUserId: row.user_id,
      _sharedByContactId: contact.id,
    });
  }

  return results;
}

function uid(c) { return c.linkedUserId || c.linked_user_id; }

export async function computeSocialEventStats(myEvents, contacts) {
  const linkedContacts = contacts.filter((c) => uid(c));
  if (linkedContacts.length === 0) {
    return { buddies: [], sharedArtists: [], upcomingFromCircle: [], influence: null, socialEvents: [] };
  }

  const socialEvents = await getSocialEvents({ ringLevels: [1, 2, 3, 4] });

  const eventsByContact = {};
  socialEvents.forEach((e) => {
    const uid = e._sharedByUserId;
    if (!uid) return;
    if (!eventsByContact[uid]) eventsByContact[uid] = [];
    eventsByContact[uid].push(e);
  });

  // Event buddies: contacts with most type overlap
  const myAttended = myEvents.filter((e) => e.status === "attended");
  const myTypes = new Set(myAttended.map((e) => e.eventType).filter(Boolean));
  const myArtists = new Set(myAttended.map((e) => e.artist || e.showName || e.comedian || e.festivalName).filter(Boolean));
  const myVenues = new Set(myAttended.map((e) => e.venue).filter(Boolean));

  const buddies = linkedContacts
    .filter((c) => eventsByContact[uid(c)]?.length > 0)
    .map((contact) => {
      const theirEvents = eventsByContact[uid(contact)].filter((e) => e.status === "attended");
      const theirTypes = new Set(theirEvents.map((e) => e.eventType).filter(Boolean));
      const theirArtists = new Set(theirEvents.map((e) => e.artist || e.showName || e.comedian || e.festivalName).filter(Boolean));
      const theirVenues = new Set(theirEvents.map((e) => e.venue).filter(Boolean));

      const sharedTypes = [...myTypes].filter((t) => theirTypes.has(t));
      const sharedArtistsArr = [...myArtists].filter((a) => theirArtists.has(a));
      const sharedVenuesArr = [...myVenues].filter((v) => theirVenues.has(v));

      return {
        contact,
        theirCount: theirEvents.length,
        sharedTypes,
        sharedArtists: sharedArtistsArr,
        sharedVenues: sharedVenuesArr,
        overlapScore: sharedTypes.length + sharedArtistsArr.length + sharedVenuesArr.length,
      };
    })
    .filter((b) => b.overlapScore > 0)
    .sort((a, b) => b.overlapScore - a.overlapScore);

  // Shared artists across all contacts
  const allTheirArtists = {};
  socialEvents.filter((e) => e.status === "attended").forEach((e) => {
    const artist = e.artist || e.showName || e.comedian || e.festivalName;
    if (artist && myArtists.has(artist)) {
      if (!allTheirArtists[artist]) allTheirArtists[artist] = new Set();
      allTheirArtists[artist].add(e._sharedByName);
    }
  });
  const sharedArtists = Object.entries(allTheirArtists)
    .map(([artist, contacts]) => ({ artist, friends: [...contacts] }))
    .sort((a, b) => b.friends.length - a.friends.length)
    .slice(0, 8);

  // Upcoming events from circle
  const upcomingFromCircle = socialEvents
    .filter((e) => e.status === "wishlist" && e.startDate)
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
    .slice(0, 8)
    .map((e) => ({
      title: e.artist || e.showName || e.comedian || e.festivalName || e.eventName || "Event",
      venue: e.venue,
      date: e.startDate,
      friend: e._sharedByName,
      type: e.eventType,
    }));

  // Influence stats
  let influence = null;
  try {
    const sent = await recommendationService.getMySentRecommendations();
    const eventSent = sent.filter((r) => r.entry_category === "events");
    const received = await recommendationService.getMyRecommendations();
    const eventReceived = received.filter((r) => r.entry_category === "events");
    const watchedFromRecs = myAttended.filter((e) => e.recommendedBy).length;

    if (eventSent.length > 0 || watchedFromRecs > 0) {
      influence = {
        sent: eventSent.length,
        sentAccepted: eventSent.filter((r) => r.status === "accepted").length,
        received: eventReceived.length,
        attendedFromRecs: watchedFromRecs,
      };
    }
  } catch { /* ignore */ }

  return { buddies, sharedArtists, upcomingFromCircle, influence, socialEvents };
}
