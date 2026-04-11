import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app.
 * session === undefined  → nog aan het laden
 * session === null       → niet ingelogd
 * session === { user }   → ingelogd
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!supabase) { setSession(null); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = ({ email, password }) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = ({ email, password }) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
