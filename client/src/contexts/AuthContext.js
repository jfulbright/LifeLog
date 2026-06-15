import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import collaboratorService from "../services/collaboratorService";

const AuthContext = createContext(null);

// Self-heal deferred shares for the signed-in user: links their contacts and
// back-fills collaborator rows created before they had an account. Fire-and-
// forget — visibility also resolves at read time, so a failure here is not fatal.
function resolveDeferredShares(session) {
  if (!session?.user) return;
  collaboratorService.resolveMyCollaborations().catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      resolveDeferredShares(session);
    });

    // Keep in sync with Supabase auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
      }
      if (event === "SIGNED_IN") {
        resolveDeferredShares(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  const sendPasswordReset = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.REACT_APP_SITE_URL || window.location.origin,
    });

  const clearRecovery = () => setIsRecovering(false);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.REACT_APP_SITE_URL || window.location.origin,
      },
    });

  const linkGoogleAccount = () =>
    supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: process.env.REACT_APP_SITE_URL || window.location.origin,
      },
    });

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isRecovering,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        clearRecovery,
        signInWithGoogle,
        linkGoogleAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
