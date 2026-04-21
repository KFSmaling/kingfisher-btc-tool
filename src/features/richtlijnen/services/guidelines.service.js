import { supabase } from "../../../shared/services/supabase.client";

// ── Guidelines ────────────────────────────────────────────────────────────────

export async function loadGuidelines(canvasId) {
  if (!supabase || !canvasId) return { data: [], error: null };
  return supabase
    .from("guidelines")
    .select("*")
    .eq("canvas_id", canvasId)
    .order("segment")
    .order("sort_order");
}

/**
 * Maak een nieuw leeg principe aan.
 * sort_order wordt door de aanroeper meegegeven als kleine integer (bijv. huidige count in segment).
 * NOOIT Date.now() gebruiken — PostgreSQL int max is ~2.1 mrd, Date.now() is ~1.7 biljoen → overflow.
 */
export async function createGuideline(canvasId, segment, sortOrder = 0) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("guidelines")
    .insert({
      canvas_id:     canvasId,
      segment,
      title:         "",
      description:   "",
      implications:  { stop: "", start: "", continue: "" },
      linked_themes: [],
      sort_order:    sortOrder,
    })
    .select()
    .single();
  if (error) console.error("[guidelines] create mislukt:", error.message);
  return { data, error };
}

export async function updateGuideline(id, updates) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase.from("guidelines").update(updates).eq("id", id);
  if (error) console.error("[guidelines] update mislukt:", error.message);
  return { error };
}

export async function deleteGuideline(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase.from("guidelines").delete().eq("id", id);
  if (error) console.error("[guidelines] delete mislukt:", error.message);
  return { error };
}

/**
 * Laad alleen het aantal richtlijnen per segment voor een canvas.
 * Teruggeeft: { data: { generiek: 3, klanten: 2, ... }, error }
 * Lightweight — haalt alleen de segment-kolom op.
 */
export async function loadGuidelineCounts(canvasId) {
  if (!supabase || !canvasId) return { data: {}, error: null };
  const { data, error } = await supabase
    .from("guidelines")
    .select("segment")
    .eq("canvas_id", canvasId);
  if (error) { console.error("[guidelines] counts laden mislukt:", error.message); return { data: {}, error }; }
  const counts = {};
  (data || []).forEach(row => {
    counts[row.segment] = (counts[row.segment] || 0) + 1;
  });
  return { data: counts, error: null };
}

// ── Guideline Analysis ────────────────────────────────────────────────────────

export async function loadGuidelineAnalysis(canvasId) {
  if (!supabase || !canvasId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("guideline_analysis")
    .select("*")
    .eq("canvas_id", canvasId)
    .maybeSingle();
  return { data, error };
}

export async function upsertGuidelineAnalysis(canvasId, recommendations) {
  if (!supabase || !canvasId) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("guideline_analysis")
    .upsert(
      { canvas_id: canvasId, recommendations, updated_at: new Date().toISOString() },
      { onConflict: "canvas_id" }
    );
  if (error) console.error("[guideline_analysis] upsert mislukt:", error.message);
  return { error };
}
