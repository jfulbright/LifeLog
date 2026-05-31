import { supabase } from "../../../services/supabaseClient";
import recommendationService from "../../../services/recommendationService";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getSocialActivities({ ringLevels = [1, 2, 3, 4] } = {}) {
  const userId = await getCurrentUserId();

  const { data: contacts, error: contactErr } = await supabase
    .from("contacts")
    .select("id, display_name, ring_level, linked_user_id")
    .eq("owner_id", userId)
    .in("ring_level", ringLevels)
    .not("linked_user_id", "is", null);

  if (contactErr || !contacts?.length) return [];

  const linkedUserIds = contacts.map((c) => uid(c));
  const contactMap = {};
  contacts.forEach((c) => { contactMap[uid(c)] = c; });

  const { data: rows, error: rowsErr } = await supabase
    .from("items")
    .select("id, user_id, data")
    .eq("category", "activities")
    .in("user_id", linkedUserIds);

  if (rowsErr || !rows?.length) return [];

  const results = [];
  for (const row of rows) {
    const activity = row.data || {};
    const contact = contactMap[row.user_id];
    if (!contact) continue;
    const visRings = activity.visibilityRings || [];
    if (visRings.length === 0) continue;

    results.push({
      ...activity,
      id: row.id,
      _sharedByName: contact.display_name,
      _sharedByRing: contact.ring_level,
      _sharedByUserId: row.user_id,
      _sharedByContactId: contact.id,
    });
  }

  return results;
}

const ACTIVITY_GROUPS = {
  snow: ["Skiing", "Snowboarding", "Heli-skiing", "Cross-Country Skiing", "Snowshoeing"],
  bike: ["Mountain Biking", "Road Cycling", "Gravel Riding"],
  water: ["Surfing", "Kayaking", "Scuba Diving", "Paddleboarding", "Whitewater Rafting"],
  land: ["Hiking", "Rock Climbing", "Trail Running", "Golf", "Bungee Jumping"],
  air: ["Skydiving", "Paragliding", "Hot Air Balloon"],
};

function getActivityGroup(type) {
  for (const [group, types] of Object.entries(ACTIVITY_GROUPS)) {
    if (types.includes(type)) return group;
  }
  return "other";
}

export function computeAdventureProfile(activities) {
  const done = activities.filter((a) => a.status === "done");
  const profile = { snow: 0, bike: 0, water: 0, land: 0, air: 0 };
  done.forEach((a) => {
    const group = getActivityGroup(a.activityType);
    if (profile[group] !== undefined) profile[group]++;
  });
  return profile;
}

function uid(c) { return c.linkedUserId || uid(c); }

export async function computeSocialActivityStats(myActivities, contacts) {
  const linkedContacts = contacts.filter((c) => uid(c));
  if (linkedContacts.length === 0) {
    return { partners: [], bucketListOverlap: [], circleAchievements: [], influence: null, profileComparison: null, socialActivities: [] };
  }

  const socialActivities = await getSocialActivities({ ringLevels: [1, 2, 3, 4] });

  const activitiesByContact = {};
  socialActivities.forEach((a) => {
    const uid = a._sharedByUserId;
    if (!uid) return;
    if (!activitiesByContact[uid]) activitiesByContact[uid] = [];
    activitiesByContact[uid].push(a);
  });

  const myDone = myActivities.filter((a) => a.status === "done");
  const myTypes = new Set(myDone.map((a) => a.activityType).filter(Boolean));
  const myLocations = new Set(myDone.map((a) => a.locationName || a.city).filter(Boolean));
  const myWishlist = myActivities.filter((a) => a.status === "wishlist");

  // Adventure partners: contacts with most type/location overlap
  const partners = linkedContacts
    .filter((c) => activitiesByContact[uid(c)]?.length > 0)
    .map((contact) => {
      const theirActivities = activitiesByContact[uid(contact)].filter((a) => a.status === "done");
      const theirTypes = new Set(theirActivities.map((a) => a.activityType).filter(Boolean));
      const theirLocations = new Set(theirActivities.map((a) => a.locationName || a.city).filter(Boolean));

      const sharedTypes = [...myTypes].filter((t) => theirTypes.has(t));
      const sharedLocations = [...myLocations].filter((l) => theirLocations.has(l));

      const theirDifficulties = theirActivities.map((a) => a.difficulty).filter(Boolean);
      const avgDifficulty = theirDifficulties.length > 0
        ? theirDifficulties.reduce((s, d) => s + ["Easy", "Moderate", "Hard", "Expert"].indexOf(d), 0) / theirDifficulties.length
        : -1;

      return {
        contact,
        theirCount: theirActivities.length,
        sharedTypes,
        sharedLocations,
        avgDifficulty,
        overlapScore: sharedTypes.length * 2 + sharedLocations.length,
      };
    })
    .filter((p) => p.overlapScore > 0)
    .sort((a, b) => b.overlapScore - a.overlapScore);

  // Bucket list overlap: wishlist items that contacts have done or also want
  const bucketListOverlap = [];
  myWishlist.forEach((wish) => {
    const type = wish.activityType;
    if (!type) return;
    const friendsWhoDid = [];
    linkedContacts.forEach((c) => {
      const theirs = activitiesByContact[uid(c)] || [];
      if (theirs.some((a) => a.activityType === type && a.status === "done")) {
        friendsWhoDid.push(c.display_name);
      }
    });
    if (friendsWhoDid.length > 0) {
      bucketListOverlap.push({ type, friends: friendsWhoDid });
    }
  });

  // Circle achievements: activity types your circle has done that you haven't
  const circleTypes = {};
  socialActivities.filter((a) => a.status === "done" && a.activityType).forEach((a) => {
    if (!myTypes.has(a.activityType)) {
      if (!circleTypes[a.activityType]) circleTypes[a.activityType] = new Set();
      circleTypes[a.activityType].add(a._sharedByName);
    }
  });
  const circleAchievements = Object.entries(circleTypes)
    .map(([type, friends]) => ({ type, count: friends.size, friends: [...friends] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Adventure profile comparison with top partner
  let profileComparison = null;
  if (partners.length > 0) {
    const topPartner = partners[0];
    const myProfile = computeAdventureProfile(myActivities);
    const theirProfile = computeAdventureProfile(activitiesByContact[topPartner.contact.linked_user_id] || []);
    profileComparison = {
      contact: topPartner.contact,
      mine: myProfile,
      theirs: theirProfile,
    };
  }

  // Influence
  let influence = null;
  try {
    const sent = await recommendationService.getMySentRecommendations();
    const actSent = sent.filter((r) => r.entry_category === "activities");
    const received = await recommendationService.getMyRecommendations();
    const actReceived = received.filter((r) => r.entry_category === "activities");
    const doneFromRecs = myDone.filter((a) => a.recommendedBy).length;

    if (actSent.length > 0 || doneFromRecs > 0) {
      influence = {
        sent: actSent.length,
        sentAccepted: actSent.filter((r) => r.status === "accepted").length,
        received: actReceived.length,
        doneFromRecs,
      };
    }
  } catch { /* ignore */ }

  return { partners, bucketListOverlap, circleAchievements, influence, profileComparison, socialActivities };
}
