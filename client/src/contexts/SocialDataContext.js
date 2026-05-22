import React, { createContext, useContext, useState, useCallback } from "react";

const SocialDataContext = createContext({
  mutationVersion: 0,
  incrementVersion: () => {},
});

export function SocialDataProvider({ children }) {
  const [mutationVersion, setMutationVersion] = useState(0);

  const incrementVersion = useCallback(() => {
    setMutationVersion((v) => v + 1);
  }, []);

  return (
    <SocialDataContext.Provider value={{ mutationVersion, incrementVersion }}>
      {children}
    </SocialDataContext.Provider>
  );
}

export function useSocialData() {
  return useContext(SocialDataContext);
}
