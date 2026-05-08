import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import dataService from "../services/dataService";

const AppDataContext = createContext({
  contacts: [],
  counts: { concerts: 0, travel: 0, cars: 0, homes: 0 },
  notifications: [],
  refreshContacts: () => {},
  refreshCounts: () => {},
  refreshNotifications: () => {},
});

export function AppDataProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [counts, setCounts] = useState({
    concerts: 0,
    travel: 0,
    cars: 0,
    homes: 0,
  });
  const [notifications, setNotifications] = useState([]);

  const refreshContacts = useCallback(async () => {
    const data = await dataService.getContacts();
    setContacts(data);
  }, []);

  const refreshCounts = useCallback(async () => {
    const data = await dataService.getCounts();
    setCounts(data);
  }, []);

  const refreshNotifications = useCallback(async () => {
    // Phase 7c: pending tags directed at the current user.
    // Until Phase 6 adds auth, we surface locally-stored pending tags.
    const tags = await dataService.getEntryTags();
    const pending = tags.filter((t) => t.status === "pending");
    setNotifications(pending);
  }, []);

  useEffect(() => {
    refreshContacts();
    refreshCounts();
    refreshNotifications();
  }, [refreshContacts, refreshCounts, refreshNotifications]);

  useEffect(() => {
    const handler = () => {
      refreshCounts();
      refreshContacts();
      refreshNotifications();
    };
    window.addEventListener("data-changed", handler);
    return () => window.removeEventListener("data-changed", handler);
  }, [refreshContacts, refreshCounts, refreshNotifications]);

  return (
    <AppDataContext.Provider
      value={{
        contacts,
        counts,
        notifications,
        refreshContacts,
        refreshCounts,
        refreshNotifications,
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
