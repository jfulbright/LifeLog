import overlayService from "../services/overlayService";

export function getSnaps(source) {
  return [source?.snapshot1, source?.snapshot2, source?.snapshot3]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
}

export function getOwnerPhotos(item) {
  return [item?.photo1, item?.photo2, item?.photo3].filter(Boolean);
}

export function getOverlayPhotos(overlay) {
  if (Array.isArray(overlay?.photos)) return overlay.photos.filter(Boolean);
  return [overlay?.photo1, overlay?.photo2, overlay?.photo3].filter(Boolean);
}

export function getOwnerWhyNotes(item) {
  return item?.why_notes || item?.wishlistReason || item?.notes || "";
}

function findContactByUserId(contacts, userId) {
  if (!userId) return null;
  return (contacts || []).find((contact) => contact.linkedUserId === userId);
}

export function buildOwnerContribution(item, contacts = []) {
  const snaps = getSnaps(item);
  const photos = getOwnerPhotos(item);
  const whyNotes = getOwnerWhyNotes(item);
  const contact = findContactByUserId(contacts, item?._ownerId || item?._sharedBy);
  const displayName = item?._isShared
    ? item?._ownerName || contact?.displayName || "Owner"
    : "You";

  return {
    entryId: item?.id,
    userId: item?._ownerId || item?._sharedBy || null,
    displayName,
    isOwner: true,
    isMine: !item?._isShared,
    snaps,
    whyNotes,
    photos,
    rating: item?.rating || null,
    updatedAt: item?.updatedAt || item?.updated_at || item?.createdAt || null,
  };
}

export function buildOverlayContribution(overlay, item, contacts = []) {
  const contact = findContactByUserId(contacts, overlay?.user_id);
  const isMine = overlay?.user_id && overlay.user_id === item?._currentUserId;
  return {
    entryId: overlay?.entry_id || item?.id,
    userId: overlay?.user_id || null,
    displayName: isMine ? "You" : contact?.displayName || overlay?._profileName || "A collaborator",
    isOwner: false,
    isMine: !!isMine,
    snaps: getSnaps(overlay),
    whyNotes: overlay?.why_notes || "",
    photos: getOverlayPhotos(overlay),
    rating: overlay?.rating || null,
    updatedAt: overlay?.updated_at || overlay?.created_at || null,
  };
}

export function hasContributionContent(contribution) {
  return Boolean(
    contribution?.whyNotes ||
      contribution?.rating ||
      contribution?.snaps?.length ||
      contribution?.photos?.length
  );
}

export function normalizeSocialContributions(item, overlays = [], contacts = []) {
  const owner = buildOwnerContribution(item, contacts);
  const shareeContributions = (overlays || [])
    .filter((overlay) => overlay.entry_id === item?.id)
    .filter((overlay) => overlay.user_id !== owner.userId)
    .map((overlay) => buildOverlayContribution(overlay, item, contacts))
    .filter(hasContributionContent)
    .sort((a, b) => {
      if (a.isMine && !b.isMine) return -1;
      if (!a.isMine && b.isMine) return 1;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });

  return [owner, ...shareeContributions].filter(hasContributionContent);
}

export async function enrichItemsWithSocialContent(items, contacts = []) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return [];

  const overlays = await overlayService.getOverlaysForEntries(list.map((item) => item.id));

  // Resolve unknown overlay authors via profile lookup
  const unknownUserIds = overlays
    .map((o) => o.user_id)
    .filter((uid) => uid && !contacts.find((c) => c.linkedUserId === uid));
  const uniqueUnknownIds = [...new Set(unknownUserIds)];

  let profileNames = {};
  if (uniqueUnknownIds.length > 0) {
    try {
      const { supabase } = await import("../services/supabaseClient");
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", uniqueUnknownIds);
      if (profiles) {
        profiles.forEach((p) => { profileNames[p.id] = p.display_name; });
      }
    } catch {}
  }

  // Attach profile names to overlays for display fallback
  const enrichedOverlays = overlays.map((o) => ({
    ...o,
    _profileName: profileNames[o.user_id] || null,
  }));

  return list.map((item) => {
    const socialContributions = normalizeSocialContributions(item, enrichedOverlays, contacts);
    const mine = socialContributions.find((contribution) => contribution.isMine && !contribution.isOwner);
    const shareeCount = socialContributions.filter((contribution) => !contribution.isOwner).length;

    return {
      ...item,
      _socialContributions: socialContributions,
      _myOverlayContribution: mine || null,
      _shareeContributionCount: shareeCount,
    };
  });
}

export function getSocialPreview(item) {
  const mine = item?._myOverlayContribution;
  if (mine?.whyNotes) return mine.whyNotes;
  if (mine?.snaps?.length) return mine.snaps[0];

  const sharee = item?._socialContributions?.find((contribution) => !contribution.isOwner);
  if (sharee?.whyNotes) return sharee.whyNotes;
  if (sharee?.snaps?.length) return sharee.snaps[0];
  return null;
}

export function getAllSocialSnaps(item) {
  return (item?._socialContributions || []).flatMap((contribution) =>
    (contribution.snaps || []).map((text, index) => ({ contribution, text, index }))
  );
}

export function getAllSocialPhotos(item) {
  return (item?._socialContributions || []).flatMap((contribution) =>
    (contribution.photos || []).map((url, index) => ({ contribution, url, index }))
  );
}
