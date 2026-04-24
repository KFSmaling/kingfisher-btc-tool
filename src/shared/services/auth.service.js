import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase.client";

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * session === undefined  → nog aan het laden
 * session === null       → niet ingelogd
 * session === { user }   → ingelogd
 *
 * profileLoading: true zolang sessie of user_profiles nog laden
 * tenantId: null als geen profiel gevonden (account niet geconfigureerd)
 * userRole: null als geen profiel gevonden
 */
export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(undefined);
  const [userProfile, setUserProfile] = useState(undefined); // undefined = laden, null = niet gevonden

  const fetchUserProfile = useCallback(async (userId) => {
    if (!supabase) { setUserProfile(null); return; }
    const { data, error } = await supabase
      .from("user_profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[auth] user_profiles laden mislukt:", error.message);
      setUserProfile(null);
      return;
    }
    if (!data) {
      console.warn("[auth] Geen user_profile gevonden voor user:", userId, "— tenantId is null");
    }
    setUserProfile(data ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) { setSession(null); setUserProfile(null); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      if (session?.user) {
        setUserProfile(undefined); // reset naar laden terwijl profiel wordt opgehaald
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  // profileLoading: true zolang sessie nog laadt, of sessie actief maar profiel nog niet binnen
  const profileLoading = session === undefined || (session !== null && userProfile === undefined);
  const tenantId       = userProfile?.tenant_id ?? null;
  const userRole       = userProfile?.role       ?? null;

  const signIn = ({ email, password }) => {
    if (!supabase) return Promise.resolve({ error: { message: "Supabase is niet geconfigureerd." } });
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = ({ email, password }) => {
    if (!supabase) return Promise.resolve({ error: { message: "Supabase is niet geconfigureerd." } });
    return supabase.auth.signUp({ email, password });
  };

  const signOut = () => {
    if (!supabase) return Promise.resolve();
    return supabase.auth.signOut();
  };

  const resetPassword = (email) => {
    if (!supabase) return Promise.resolve({ error: { message: "Supabase is niet geconfigureerd." } });
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  };

  return (
    <AuthContext.Provider value={{
      session, user: session?.user ?? null,
      tenantId, userRole, profileLoading,
      signIn, signUp, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
