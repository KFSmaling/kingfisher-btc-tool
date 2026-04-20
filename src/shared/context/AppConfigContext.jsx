/**
 * AppConfigContext — prompts + UI labels uit Supabase app_config tabel
 *
 * Laadt alle config éénmalig na login. Geeft label() en prompt() functies
 * die via de hele app beschikbaar zijn zonder props drilling.
 *
 * Gebruik:
 *   const { label, prompt, refresh } = useAppConfig();
 *   label("app.title")                    → "Business Transformation Canvas"
 *   prompt("magic.system_standard")       → "Je bent een Senior Strategie..."
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";

// ── Hardcoded fallbacks (veiligheidsnet als DB onbereikbaar is) ──────────────
const LABEL_FALLBACKS = {
  "app.title":              "Business Transformation Canvas",
  "app.subtitle":           "From strategy to execution",
  "werkblad.strategie":     "Strategie Werkblad",
  "section.extern":         "Externe Marktontwikkelingen",
  "section.intern":         "Interne Ontwikkelingen",
  "section.identiteit":     "Identiteit & Positionering",
  "section.executie":       "Executie",
  "section.strategie":      "Strategische Koers",
};

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const [config, setConfig]   = useState({});
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("app_config")
      .select("key, value, category, description");

    if (!error && data) {
      const map = {};
      data.forEach(row => { map[row.key] = row; });
      setConfig(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  /**
   * label("app.title") → waarde uit DB, anders hardcoded fallback
   * label("app.title", "Mijn App") → waarde uit DB, anders opgegeven fallback
   */
  const label = useCallback((key, fallback) => {
    const row = config[`label.${key}`];
    if (row?.value && !row.value.startsWith("PLACEHOLDER")) return row.value;
    return fallback ?? LABEL_FALLBACKS[key] ?? key;
  }, [config]);

  /**
   * prompt("magic.system_standard") → volledige prompt-tekst uit DB
   * Geeft null terug als niet gevonden (component valt terug op hardcoded)
   */
  const prompt = useCallback((key) => {
    const row = config[`prompt.${key}`];
    if (row?.value && !row.value.startsWith("PLACEHOLDER")) return row.value;
    return null;
  }, [config]);

  /**
   * setting("autosave.delay_ms", 500) → numerieke instelling
   */
  const setting = useCallback((key, defaultVal) => {
    const row = config[`setting.${key}`];
    if (row?.value) return isNaN(row.value) ? row.value : Number(row.value);
    return defaultVal;
  }, [config]);

  // Alle rijen als array (voor admin UI)
  const allRows = Object.values(config);

  return (
    <AppConfigContext.Provider value={{ label, prompt, setting, allRows, loading, refresh: loadConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error("useAppConfig moet binnen AppConfigProvider gebruikt worden");
  return ctx;
}
