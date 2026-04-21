/**
 * _auth.js — gedeelde JWT-validatie middleware voor alle API endpoints
 * Kingfisher & Partners — April 2026
 *
 * Gebruik:
 *   const { requireAuth } = require('./_auth');
 *   const user = await requireAuth(req, res);
 *   if (!user) return;  // 401 is al gestuurd
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Valideert het Supabase JWT uit de Authorization: Bearer <token> header.
 * @returns {object|null} user object bij succes, null bij fout (401 al verstuurd)
 */
async function requireAuth(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    res.status(401).json({ error: "Niet geautoriseerd — voeg een Authorization: Bearer <token> header toe" });
    return null;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Lokale dev zonder Supabase-config — passeer door
    console.warn("[_auth] Supabase niet geconfigureerd — auth check overgeslagen");
    return { id: "dev", email: "dev@local" };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Niet geautoriseerd — ongeldig of verlopen token" });
      return null;
    }
    return user;
  } catch (err) {
    console.error("[_auth] verificatie fout:", err.message);
    res.status(401).json({ error: "Auth verificatie mislukt" });
    return null;
  }
}

module.exports = { requireAuth };
