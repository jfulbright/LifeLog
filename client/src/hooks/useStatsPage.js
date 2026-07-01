import { useState, useEffect, useMemo } from "react";
import dataService from "../services/dataService";
import contactsService from "../services/contactsService";

export default function useStatsPage(category, computeStatsFn, computeSocialStatsFn, { profileUserId } = {}) {
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("year");
  const [socialStats, setSocialStats] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    // When viewing another user's stats (F2), read their items via
    // getItemsForUser so RLS gates visibility; otherwise the viewer's own
    // items + accepted shares.
    const itemsPromise = profileUserId
      ? dataService.getItemsForUser(profileUserId, category)
      : dataService.getItemsWithShared(category);
    Promise.all([
      itemsPromise,
      contactsService.getContacts(),
    ]).then(([itemData, contactData]) => {
      setItems(itemData || []);
      setContacts(contactData || []);
      setLoading(false);
    });
  }, [category, profileUserId]);

  useEffect(() => {
    if (!computeSocialStatsFn || items.length === 0 || contacts.length === 0) return;
    setSocialLoading(true);
    computeSocialStatsFn(items, contacts)
      .then(setSocialStats)
      .catch(() => setSocialStats(null))
      .finally(() => setSocialLoading(false));
  }, [items, contacts, computeSocialStatsFn]);

  const stats = useMemo(() => computeStatsFn(items, periodFilter), [items, periodFilter, computeStatsFn]);

  const hasLinkedContacts = contacts.some((c) => c.linkedUserId || c.linked_user_id);

  return { items, contacts, loading, periodFilter, setPeriodFilter, stats, socialStats, socialLoading, hasLinkedContacts };
}
