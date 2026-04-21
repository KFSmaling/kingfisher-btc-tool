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

export async function createGuideline(canvasId, segment) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("guidelines")
    .insert({
      canvas_id:    canvasId,
      segment,
      title:        "",
      description:  "",
      implications: { stop: "", start: "", continue: "" },
      linked_themes: [],
      sort_order:   Date.now(), // unix ms als sort_order → behoud volgorde van aanmaken
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
