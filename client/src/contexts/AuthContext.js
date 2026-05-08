import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // Hydrate from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep in sync with Supabase auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
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
