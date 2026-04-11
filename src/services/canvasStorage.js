import { supabase } from "./supabaseClient";

/**
 * Sla een geüpload document op in canvas_uploads.
 * Inclusief canvas_id en user_id koppeling (Sprint 3).
 */
export async function saveCanvasUpload({ fileName, rawText, insights, blockKey, language, canvasId, userId }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const { data, error } = await supabase
    .from("canvas_uploads")
    .insert({
      file_name:  fileName,
      raw_text:   rawText.slice(0, 10000),
      content:    JSON.stringify({ blockKey, insights }),
      language:   language,
      block_key:  blockKey,
      canvas_id:  canvasId  || null,
      user_id:    userId    || null,
    });

  if (error) console.error("Supabase upload opslag mislukt:", error.message);
  return { data, error };
}

/**
 * Laad alle canvassen van een gebruiker, gesorteerd op meest recent.
 */
export async function loadUserCanvases(userId) {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from("canvases")
    .select("id, name, language, updated_at, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

/**
 * Maak een nieuw canvas aan voor een gebruiker.
 * Geeft het aangemaakte record terug (inclusief id).
 */
export async function createCanvas({ userId, name, language = "nl" }) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };

  console.log("[createCanvas] inserting:", { userId, name, language });

  const { data, error } = await supabase
    .from("canvases")
    .insert({
      user_id:  userId,
      name:     name,
      blocks:   {},
      language: language,
    })
    .select()
    .single();

  if (error) {
    console.error("[createCanvas] mislukt:", error.code, error.message, error.details);
  } else {
    console.log("[createCanvas] success:", data);
  }
  return { data, error };
}

/**
 * Sla de huidige canvas staat op (autosave).
 * Last-write-wins. updated_at wordt weggelaten voor schema-compatibiliteit.
 */
export async function upsertCanvas(id, { scope, docs, insights, bullets, language }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const payload = {
    name:     scope || null,
    blocks:   { docs, insights, bullets },
    language: language || "nl",
  };

  console.log("[autosave] updating canvas", id, payload);

  const { data, error } = await supabase
    .from("canvases")
    .update(payload)
    .eq("id", id)
    .select("id, name, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[autosave] mislukt:", error.code, error.message, error.details);
  } else {
    console.log("[autosave] success:", data);
  }
  return { error };
}

/**
 * Laad één canvas op basis van ID (inclusief blocks voor herstel staat).
 */
export async function loadCanvasById(id) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("canvases")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("Canvas laden mislukt:", error.message);
  return { data, error };
}

/**
 * Verwijder een canvas op basis van ID.
 */
export async function deleteCanvas(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id);
  if (error) console.error("Canvas verwijderen mislukt:", error.message);
  return { error };
}
