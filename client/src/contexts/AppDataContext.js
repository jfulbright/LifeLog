import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import dataService from "../services/dataService";
import contactsService from "../services/contactsService";
import collaboratorService from "../services/collaboratorService";
import profileService from "../services/profileService";
import { migrateSocialDataToSupabase } from "../utils/migrateSocialData";

const AppDataContext = createContext({
  contacts: [],
  counts: { events: 0, concerts: 0, travel: 0, cars: 0, homes: 0, activities: 0, cellar: 0, kids: 0 },
  notifications: [],
  pendingCollaborations: 0,
  profile: null,
  refreshContacts: () => {},
  refreshCounts: () => {},
  refreshNotifications: () => {},
  refreshProfile: () => {},
});

export function AppDataProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({
    events: 0,
    concerts: 0,
    travel: 0,
    cars: 0,
    homes: 0,
    activities: 0,
    cellar: 0,
    kids: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [pendingCollaborations, setPendingCollaborations] = useState(0);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await contactsService.getContacts();
      setContacts(data);
    } catch {
      // Fall back to localStorage if Supabase contacts table doesn't exist yet
      const data = await dataService.getContacts();
      setContacts(data);
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    const data = await dataService.getCounts();
    setCounts(data);
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const count = await collaboratorService.getPendingCount();
      setPendingCollaborations(count);
      setNotifications(count > 0 ? Array(count).fill({ status: "pending" }) : []);
    } catch {
      const tags = await dataService.getEntryTags();
      const pending = tags.filter((t) => t.status === "pending");
      setNotifications(pending);
      setPendingCollaborations(pending.length);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await profileService.getMyProfile();
      setProfile(p);
    } catch {
      // Profile table may not exist yet
    }
  }, []);

  // Run one-time migration on mount
  useEffect(() => {
    migrateSocialDataToSupabase().then(() => {
      refreshContacts();
      refreshCounts();
      refreshNotifications();
      refreshProfile();
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = () => {
      refreshCounts();
      refreshContacts();
      refreshNotifications();
      refreshProfile();
    };
    window.addEventListener("data-changed", handler);
    return () => window.removeEventListener("data-changed", handler);
  }, [refreshContacts, refreshCounts, refreshNotifications, refreshProfile]);

  return (
    <AppDataContext.Provider
      value={{
        contacts,
        counts,
        notifications,
        pendingCollaborations,
        profile,
        refreshContacts,
        refreshCounts,
        refreshNotifications,
        refreshProfile,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}

export default AppDataContext;
