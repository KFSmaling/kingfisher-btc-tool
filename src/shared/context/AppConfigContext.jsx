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
import { supabase } from "../services/supabase.client";

// ── Hardcoded fallbacks (veiligheidsnet als DB onbereikbaar is) ──────────────
const LABEL_FALLBACKS = {
  // Applicatie (header + footer)
  "app.title":                      "Business Transformation Canvas",
  "app.subtitle":                   "From strategy to execution",
  "footer.tagline":                 "From strategy to execution",
  // Werkblad namen
  "werkblad.strategie":             "Strategie Werkblad",
  "werkblad.richtlijnen":           "Richtlijnen & Leidende Principes",
  // Strategie Werkblad — secties (legacy, voor backwards-compat)
  "section.extern":                 "Externe Marktontwikkelingen",
  "section.intern":                 "Interne Ontwikkelingen",
  "section.identiteit":             "Identiteit & Positionering",
  "section.executie":               "Executie",
  "section.strategie":              "Strategische Koers",
  // Strategie Werkblad — sectiekoppen
  "strat.section.identiteit":       "Identiteit",
  "strat.section.analyse":          "Analyse",
  "strat.section.executie":         "Executie — 7·3·3 Regel",
  // Strategie Werkblad — veldnamen
  "strat.field.missie":             "Missie",
  "strat.field.visie":              "Visie",
  "strat.field.ambitie":            "Ambitie (BHAG)",
  "strat.field.kernwaarden":        "Kernwaarden",
  "strat.field.samenvatting":       "Strategische Samenvatting",
  "strat.field.extern":             "Externe Ontwikkelingen",
  "strat.field.intern":             "Interne Ontwikkelingen",
  "strat.autotag.button":           "Auto-tag",
  "werkblad.strategie.title":       "Strategie",
  // Werkblad — drie-knoppen-shell (Sprint C, issue #69)
  "werkblad.action.analyseer":              "Analyse draaien",
  "werkblad.action.analyseer_opnieuw":      "Opnieuw analyseren",
  "werkblad.action.analyseert":             "Analyseren…",
  "werkblad.action.bekijk_inzichten":       "Inzichten bekijken",
  "werkblad.action.bekijk_disabled_tooltip":"Eerst een analyse draaien",
  "werkblad.action.rapportage":             "Rapportage",
  "werkblad.action.rapportage_tooltip":     "Volgt in volgende release",
  // Inzichten overlay — generieke labels (alle werkbladen)
  "analysis.title":                          "Inzichten",
  "analysis.subtitle":                       "Strategische Analyse",
  "analysis.kicker":                         "Inzichten",
  "analysis.toc.label":                      "Inhoud",
  "analysis.chapter.onderdelen":             "Onderdelen",
  "analysis.chapter.dwarsverbanden":         "Dwarsverbanden",
  "analysis.chapter.number.onderdelen":      "Hoofdstuk 1",
  "analysis.chapter.number.dwarsverbanden":  "Hoofdstuk 2",
  "analysis.chapter.intro.onderdelen":       "Observaties over losse elementen van de strategie: wat ontbreekt, wat is zwak, waar liggen kansen, waar zit kracht.",
  "analysis.chapter.intro.dwarsverbanden":   "Observaties over samenhang: overlap tussen thema's, consistentie tussen visie en ambitie, en verbanden met andere werkbladen van het canvas.",
  "analysis.type.ontbreekt":                 "Ontbreekt",
  "analysis.type.zwak":                      "Zwak punt",
  "analysis.type.kans":                      "Kans",
  "analysis.type.sterk":                     "Sterkte",
  "analysis.section.observation":            "Observatie",
  "analysis.section.recommendation":         "Aanbeveling",
  "analysis.section.references":             "Verwijst naar",
  "analysis.meta.canvas":                    "Canvas:",
  "analysis.meta.generated":                 "Gegenereerd",
  "analysis.meta.findings":                  "bevindingen",
  "analysis.empty":                          "Nog geen analyse. Klik 'Analyse draaien' in het werkblad.",
  "analysis.empty.filtered":                 "Geen bevindingen zichtbaar met de huidige filters.",
  "analysis.action.terug":                   "← Terug naar werkblad",
  "analysis.loading":                        "AI analyseert uw strategie…",
  "analysis.filter.label":                   "Toon:",
  "analysis.filter.type":                    "Filter type",
  "analysis.sourceref.header":               "Verwijst naar",
  // Richtlijnen Werkblad — segmenten
  "richtl.segment.generiek":        "Generiek",
  "richtl.segment.generiek.sub":    "Strategie & Governance",
  "richtl.segment.klanten":         "Klanten",
  "richtl.segment.klanten.sub":     "Markt & Dienstverlening",
  "richtl.segment.organisatie":     "Organisatie",
  "richtl.segment.organisatie.sub": "Mens & Proces",
  "richtl.segment.it":              "IT",
  "richtl.segment.it.sub":          "Technologie & Data",
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
