import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import profileService from "../services/profileService";
import { CATEGORY_KEYS } from "../helpers/schemaRegistry";
import { ViewerModeProvider } from "../contexts/ViewerModeContext";
import CarList from "../features/cars/components/CarList";
import HomeList from "../features/homes/components/HomeList";
import TravelList from "../features/travel/components/TravelList";
import EventList from "../features/events/components/EventList";
import ActivityList from "../features/activities/components/ActivityList";
import CellarList from "../features/cellar/components/CellarList";
import KidsList from "../features/kids/components/KidsList";
import MovieList from "../features/movies/components/MovieList";

const LIST_BY_CATEGORY = {
  cars: CarList,
  homes: HomeList,
  travel: TravelList,
  events: EventList,
  activities: ActivityList,
  cellar: CellarList,
  kids: KidsList,
  movies: MovieList,
};

/**
 * Another user's category page (Epic D / D5). Renders the NATIVE category List
 * (travel map, movie feed, …) inside ViewerModeProvider, so the shared plumbing
 * (useCategory / CategoryListHeader / ItemCardList / EntryDetailPanel) loads that
 * user's visibility-gated items read-only with no add / log / search / edit.
 */
function VisitorCategoryPage() {
  const { userId, category } = useParams();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let cancelled = false;
    profileService.getProfileByUserId(userId)
      .then((p) => { if (!cancelled) setDisplayName(p?.display_name || "Someone"); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  const ListComponent = CATEGORY_KEYS.includes(category) ? LIST_BY_CATEGORY[category] : null;

  if (!ListComponent) {
    return <div className="empty-state"><div className="empty-state-title">Unknown category</div></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontWeight: 600 }}>
          {displayName ? `${displayName}'s` : ""} view
        </span>
        <Link to={`/u/${userId}`} className="btn btn-sm btn-outline-secondary">
          &larr; Profile
        </Link>
      </div>
      <ViewerModeProvider value={userId}>
        <ListComponent />
      </ViewerModeProvider>
    </div>
  );
}

export default VisitorCategoryPage;
