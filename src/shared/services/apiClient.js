/**
 * apiClient.js — geauthenticeerde fetch wrapper voor alle /api/* calls
 *
 * GEBRUIK — altijd apiFetch ipv fetch() voor /api/* endpoints:
 *
 *   import { apiFetch } from "../../shared/services/apiClient";
 *
 *   const res = await apiFetch("/api/magic", {
 *     method: "POST",
 *     body: JSON.stringify({ field, chunks }),
 *   });
 *
 * apiFetch voegt automatisch toe:
 *   - Content-Type: application/json
 *   - Authorization: Bearer <supabase-session-token>
 *
 * Voor toekomstige API-endpoints: gebruik ALTIJD apiFetch, nooit bare fetch().
 */

import { supabase } from "./supabase.client";

export async function apiFetch(url, options = {}) {
  let token = null;

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
