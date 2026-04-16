import { supabase } from "../../services/supabaseClient";

/**
 * Dossier — laad alle geüploade bestanden voor een canvas (canvas_uploads).
 */
export async function loadDossierFiles(canvasId) {
  if (!supabase || !canvasId) return { data: [], error: null };
  return supabase
    .from("canvas_uploads")
    .select("id, file_name, created_at, block_key")
    .eq("canvas_id", canvasId)
    .order("created_at", { ascending: false });
}

/**
 * Dossier — verwijder een bestand uit canvas_uploads.
 * document_chunks worden automatisch verwijderd via CASCADE op upload_id FK.
 */
export async function deleteDossierFile(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  // Verwijder chunks expliciet voor zekerheid (als CASCADE niet actief is)
  await supabase.from("document_chunks").delete().eq("upload_id", id);
  const { error } = await supabase.from("canvas_uploads").delete().eq("id", id);
  if (error) console.error("[dossier] verwijderen mislukt:", error.message);
  return { error };
}
