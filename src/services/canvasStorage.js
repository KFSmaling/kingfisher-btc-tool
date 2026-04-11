import { supabase } from "./supabaseClient";

/**
 * Sla een geüpload en geëxtraheerd document op in Supabase.
 */
export async function saveCanvasUpload({ fileName, rawText, insights, blockKey, language }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      file_name:     fileName,
      raw_text:      rawText.slice(0, 10000),
      content:       JSON.stringify({ blockKey, insights }),
      language:      language,
      is_historical: false,
      tags:          [blockKey],
      user_id:       null,
    });

  if (error) console.error("Supabase opslag mislukt:", error.message);
  return { data, error };
}
