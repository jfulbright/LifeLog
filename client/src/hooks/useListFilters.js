import { useState, useMemo, useCallback } from "react";
import { isSharedSource, applySourceFilter } from "../helpers/operator";
import {
  getInitialSourceFilter,
  getYearOptions,
  filterByYear,
} from "../helpers/filterUtils";

/**
 * Shared list-filter state for the standard header stack. Owns the two filter
 * dimensions every page has in common — Year and Source (Mine/Shared/Recommended)
 * — so individual list components no longer re-implement them. Status filtering
 * stays in useCategory; category-specific pills stay local to each list.
 *
 * Usage:
 *   const lf = useListFilters(items);
 *   const statusFiltered = filterByStatus(items, filterStatus);
 *   const commonFiltered = lf.applyCommonFilters(statusFiltered);
 *   // then apply the page's bespoke category filter on top of commonFiltered
 *
 * @param {object[]} items - the full (unfiltered) item list for the category
 * @param {object} [opts]
 * @param {string|string[]|function} [opts.dateField] - how to read each item's date
 */
export default function useListFilters(items, { dateField } = {}) {
  const [activeYear, setActiveYear] = useState("all");
  const [sourceFilter, setSourceFilter] = useState(getInitialSourceFilter);

  const yearOptions = useMemo(
    () => getYearOptions(items, dateField),
    [items, dateField]
  );

  const sharedCount = useMemo(
    () => items.filter(isSharedSource).length,
    [items]
  );
  const recommendedCount = useMemo(
    () => items.filter((i) => i._isRecommended).length,
    [items]
  );

  const applyCommonFilters = useCallback(
    (list) => filterByYear(applySourceFilter(list, sourceFilter), activeYear, dateField),
    [sourceFilter, activeYear, dateField]
  );

  return {
    activeYear,
    setActiveYear,
    yearOptions,
    sourceFilter,
    setSourceFilter,
    sharedCount,
    recommendedCount,
    applyCommonFilters,
  };
}
