import { supabase } from "./supabaseClient";

/**
 * Sla een geüpload en geëxtraheerd document op in Supabase.
 *
 * @param {object} params
 * @param {string} params.fileName     - Originele bestandsnaam
 * @param {string} params.rawText      - Geëxtraheerde tekst uit het document
 * @param {string[]} params.insights   - Array van geëxtraheerde bullets
 * @param {string} params.blockKey     - BTC blok (bijv. "strategy")
 * @param {string} params.language     - "nl" | "en"
 */
export async function saveCanvasUpload({ fileName, rawText, insights, blockKey, language }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      file_name:    fileName,
      raw_text:     rawText.slice(0, 10000),   // kolom-limiet
      content:      JSON.stringify({ blockKey, insights }),
      language:     language,
      is_historical: false,
      tags:         [blockKey],
      user_id:      null,                       // geen auth (nog) — vereist open RLS policy
    });

  if (error) console.error("Supabase opslag mislukt:", error.message);
  return { data, error };
}
