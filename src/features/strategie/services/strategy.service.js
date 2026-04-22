import { supabase } from "../../../shared/services/supabase.client";

// ── Strategy Core ─────────────────────────────────────────────────────────────
export async function loadStrategyCore(canvasId) {
  if (!supabase || !canvasId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("strategy_core")
    .select("*")
    .eq("canvas_id", canvasId)
    .maybeSingle();
  return { data, error };
}

export async function upsertStrategyCore(canvasId, fields) {
  if (!supabase || !canvasId) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("strategy_core")
    .upsert({ canvas_id: canvasId, ...fields, updated_at: new Date().toISOString() },
             { onConflict: "canvas_id" });
  if (error) console.error("[strategy_core] upsert mislukt:", error.message);
  return { error };
}

// ── Analysis Items ────────────────────────────────────────────────────────────
export async function loadAnalysisItems(canvasId) {
  if (!supabase || !canvasId) return { data: [], error: null };
  return supabase
    .from("analysis_items")
    .select("*")
    .eq("canvas_id", canvasId)
    .order("type")
    .order("sort_order");
}

export async function upsertAnalysisItem(item) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  // Gebruik insert voor nieuwe items (geen id) en update voor bestaande.
  // .upsert met onConflict:"id" en id=undefined geeft een Supabase-js interne fout.
  let query;
  if (item.id) {
    const { id, ...fields } = item;
    query = supabase.from("analysis_items").update(fields).eq("id", id).select().maybeSingle();
  } else {
    query = supabase.from("analysis_items").insert(item).select().maybeSingle();
  }
  const { data, error } = await query;
  if (error) console.error("[analysis_items] upsert mislukt:", error.message);
  return { data, error };
}

/**
 * Update alleen het tag-veld van een analysis_item.
 * Gebruikt .update() i.p.v. upsert om de INSERT-fase (en NOT NULL errors) te vermijden.
 */
export async function changeAnalysisItemTag(id, tag) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("analysis_items")
    .update({ tag })
    .eq("id", id);
  if (error) console.error("[analysis_items] tag update mislukt:", error.message);
  return { error };
}

export async function deleteAnalysisItem(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase.from("analysis_items").delete().eq("id", id);
  if (error) console.error("[analysis_items] delete mislukt:", error.message);
  return { error };
}

// ── Strategic Themes ──────────────────────────────────────────────────────────
export async function loadStrategicThemes(canvasId) {
  if (!supabase || !canvasId) return { data: [], error: null };
  const { data: themes, error } = await supabase
    .from("strategic_themes")
    .select("*, ksf_kpi(*)")
    .eq("canvas_id", canvasId)
    .order("sort_order");
  return { data: themes || [], error };
}

export async function upsertStrategicTheme(theme) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("strategic_themes")
    .upsert(theme, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) console.error("[strategic_themes] upsert mislukt:", error.message);
  return { data, error };
}

export async function deleteStrategicTheme(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase.from("strategic_themes").delete().eq("id", id);
  if (error) console.error("[strategic_themes] delete mislukt:", error.message);
  return { error };
}

// ── KSF / KPI ─────────────────────────────────────────────────────────────────
export async function upsertKsfKpi(item) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("ksf_kpi")
    .upsert(item, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) console.error("[ksf_kpi] upsert mislukt:", error.message);
  return { data, error };
}

export async function deleteKsfKpi(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase.from("ksf_kpi").delete().eq("id", id);
  if (error) console.error("[ksf_kpi] delete mislukt:", error.message);
  return { error };
}
