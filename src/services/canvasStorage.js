import { supabase } from "./supabaseClient";

/**
 * Sla een geüpload document op in canvas_uploads.
 * Inclusief canvas_id en user_id koppeling (Sprint 3).
 */
export async function saveCanvasUpload({ fileName, rawText, insights, blockKey, language, canvasId, userId }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const { data, error } = await supabase
    .from("canvas_uploads")
    .upsert({
      file_name:  fileName,
      raw_text:   rawText.slice(0, 10000),
      content:    JSON.stringify({ blockKey, insights }),
      language:   language,
      block_key:  blockKey,
      canvas_id:  canvasId  || null,
      user_id:    userId    || null,
    }, { onConflict: "user_id,file_name" })
    .select("id")
    .maybeSingle();

  if (error) console.error("[upload] Supabase opslag mislukt:", error.code, error.message);
  return { data, error, uploadId: data?.id || null };
}

/**
 * Laad alle canvassen van een gebruiker, gesorteerd op meest recent.
 * Gebruik alleen kolommen die zeker bestaan: id, name, created_at.
 */
export async function loadUserCanvases(userId) {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from("canvases")
    .select("id, name, created_at, updated_at, canvas_uploads(id)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false, nullsFirst: false });
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
      user_id: userId,
      name:    name,
      blocks:  {},
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
export async function upsertCanvas(id, { scope, docs, insights, bullets, language, meta = {} }) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const payload = {
    name:                scope || null,
    blocks:              { docs, insights, bullets },
    client_name:         meta.client_name         || null,
    author_name:         meta.author_name          || null,
    industry:            meta.industry             || null,
    transformation_type: meta.transformation_type  || null,
    org_size:            meta.org_size             || null,
    project_status:      meta.project_status       || null,
    project_description: meta.project_description  || null,
  };

  const { data, error } = await supabase
    .from("canvases")
    .update(payload)
    .eq("id", id)
    .select("id, name")
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
 * Laad alle actieve blokdefinities gesorteerd op volgorde.
 * Vervangt hardcoded labels in de UI — IP protection.
 */
export async function fetchBlockDefinitions() {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from("block_definitions")
    .select("key, label_nl, label_en, ai_prompt, sort_order")
    .eq("is_active", true)
    .order("sort_order");
}

/**
 * Sla handmatige consultant-invoer op in canvases.data[blockKey].details.manual.
 *
 * MERGE-REGEL: schrijft NOOIT naar details.ai_insights.
 * De scheiding wordt gehandhaafd op API-laag, niet als frontend-conventie.
 */
export async function saveBlockManualData(canvasId, blockKey, manualData) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const { data: row, error: loadErr } = await supabase
    .from("canvases")
    .select("data")
    .eq("id", canvasId)
    .single();

  if (loadErr) {
    console.error("[deepdive] laden mislukt:", loadErr.message);
    return { error: loadErr };
  }

  const currentData    = row?.data    || {};
  const currentBlock   = currentData[blockKey]     || {};
  const currentDetails = currentBlock.details      || {};

  const merged = {
    ...currentData,
    [blockKey]: {
      ...currentBlock,
      details: {
        ...currentDetails,
        manual:      manualData,
        ai_insights: currentDetails.ai_insights || {},
      },
    },
  };

  const { error } = await supabase
    .from("canvases")
    .update({ data: merged })
    .eq("id", canvasId);

  if (error) console.error("[deepdive] opslaan mislukt:", error.message);
  return { error };
}

/**
 * Upload een bronbestand naar Supabase Storage (bucket: 'documents').
 * Pad: {canvasId}/{timestamp}_{fileName}
 */
export async function uploadDocumentToStorage(file, canvasId) {
  if (!supabase) return { path: null, error: "Supabase niet geconfigureerd" };
  const path = `${canvasId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(path, file, { upsert: true });
  if (error) console.error("[storage] upload mislukt:", error.message);
  return { path: data?.path || null, error };
}

/**
 * Maak een import job record aan in import_jobs.
 */
export async function createImportJob({ canvasId, userId, fileName, fileType }) {
  if (!supabase) return { data: null, error: "Supabase niet geconfigureerd" };
  const { data, error } = await supabase
    .from("import_jobs")
    .insert({ canvas_id: canvasId, user_id: userId, file_name: fileName, file_type: fileType, status: "queued" })
    .select()
    .single();
  if (error) console.error("[import_job] aanmaken mislukt:", error.message);
  return { data, error };
}

/**
 * Werk de status van een import job bij.
 */
export async function updateImportJob(id, updates) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("import_jobs")
    .update(updates)
    .eq("id", id);
  if (error) console.error("[import_job] update mislukt:", error.message);
  return { error };
}

/**
 * Sprint 3B — Parent-Child chunking + OpenAI embedding pipeline.
 *
 * Parent chunks (~1000 chars) bieden retrieval-context.
 * Child chunks (~200 chars) krijgen embeddings en zijn de zoekeenheden.
 * Kinderen zijn via parent_id gelinkt aan hun ouder.
 *
 * onProgress(pct: 0-100) wordt aangeroepen na elke embedbatch.
 */
export async function indexDocumentChunks(uploadId, canvasId, rawText, onProgress) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };

  const PARENT_SIZE = 1000;
  const PARENT_STEP = 800;  // 200-char overlap tussen parents
  const CHILD_SIZE  = 200;
  const CHILD_STEP  = 150;  // 50-char overlap tussen children
  const EMBED_BATCH = 50;   // max chunks per /api/embed call

  // ── Hulpfunctie: extraheer slide- of paginanummer uit tekst ─────────────────
  // Herkent: [Slide 7], [Pagina 3], [Notes 12], [Page 5]
  const extractPageNumber = (text) => {
    const match = text.match(/\[(Slide|Pagina|Page|Notes)\s+(\d+)\]/i);
    return match ? parseInt(match[2], 10) : null;
  };

  // ── Stap 1: parent chunks bouwen ──────────────────────────────────────────
  const parents = [];
  for (let i = 0; i < rawText.length; i += PARENT_STEP) {
    const text = rawText.slice(i, i + PARENT_SIZE);
    parents.push({ text, startChar: i, pageNumber: extractPageNumber(text) });
    if (i + PARENT_SIZE >= rawText.length) break;
  }
  if (parents.length === 0) return { error: "Geen tekst om te indexeren" };

  // ── Stap 2: parents opslaan (zonder embedding) ────────────────────────────
  const { data: parentRows, error: parentErr } = await supabase
    .from("document_chunks")
    .insert(parents.map(p => ({
      upload_id:   uploadId,
      canvas_id:   canvasId,
      chunk_type:  "parent",
      content:     p.text,
      page_number: p.pageNumber,
      metadata:    { startChar: p.startChar },
    })))
    .select("id");

  if (parentErr) {
    console.error("[index] parent insert mislukt:", parentErr.message);
    return { error: parentErr.message };
  }

  // ── Stap 3: child chunks per parent bouwen ────────────────────────────────
  const children = [];
  for (let pi = 0; pi < parents.length; pi++) {
    const parentId     = parentRows[pi].id;
    const parentText   = parents[pi].text;
    const parentPage   = parents[pi].pageNumber;
    for (let ci = 0; ci < parentText.length; ci += CHILD_STEP) {
      const childText = parentText.slice(ci, ci + CHILD_SIZE);
      // Gebruik slide/paginanummer van de child zelf als aanwezig, anders van de parent
      const childPage = extractPageNumber(childText) ?? parentPage;
      children.push({
        upload_id:   uploadId,
        canvas_id:   canvasId,
        chunk_type:  "child",
        parent_id:   parentId,
        content:     childText,
        page_number: childPage,
      });
      if (ci + CHILD_SIZE >= parentText.length) break;
    }
  }

  // ── Stap 4: embed + opslaan in batches ───────────────────────────────────
  for (let b = 0; b < children.length; b += EMBED_BATCH) {
    const batch = children.slice(b, b + EMBED_BATCH);
    const texts = batch.map(c => c.content);

    let embeddings;
    try {
      const embRes = await fetch("/api/embed", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ texts }),
      });
      if (!embRes.ok) {
        const err = await embRes.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${embRes.status}`);
      }
      ({ embeddings } = await embRes.json());
    } catch (e) {
      console.error("[index] embedding mislukt:", e.message);
      return { error: `Embedding mislukt: ${e.message}` };
    }

    const rows = batch.map((c, i) => ({ ...c, embedding: embeddings[i] }));
    const { error: insertErr } = await supabase
      .from("document_chunks")
      .insert(rows);

    if (insertErr) {
      console.error("[index] child insert mislukt:", insertErr.message);
      return { error: insertErr.message };
    }

    if (onProgress) {
      onProgress(Math.round(((b + batch.length) / children.length) * 100));
    }
  }

  console.log(`[index] klaar: ${parents.length} parents, ${children.length} children`);
  return { totalParents: parents.length, totalChildren: children.length, error: null };
}

/**
 * Sprint 3C — Vector similarity search via Supabase RPC.
 * Vereist de `match_document_chunks` functie in Supabase (zie SQL hieronder).
 *
 * SQL om in Supabase SQL Editor uit te voeren:
 *   CREATE OR REPLACE FUNCTION match_document_chunks(
 *     query_embedding vector(1536),
 *     match_canvas_id uuid,
 *     match_count int DEFAULT 5
 *   ) RETURNS TABLE (id uuid, content text, file_name text, page_number int, distance float)
 *   LANGUAGE sql STABLE AS $$
 *     SELECT dc.id, dc.content, cu.file_name, dc.page_number,
 *            (dc.embedding <=> query_embedding)::float AS distance
 *     FROM document_chunks dc
 *     LEFT JOIN canvas_uploads cu ON dc.upload_id = cu.id
 *     WHERE dc.chunk_type = 'child'
 *       AND dc.canvas_id = match_canvas_id
 *       AND dc.embedding IS NOT NULL
 *     ORDER BY dc.embedding <=> query_embedding
 *     LIMIT match_count;
 *   $$;
 */
export async function searchDocumentChunks(embedding, canvasId, count = 5) {
  if (!supabase) return { data: [], error: null };
  return supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_canvas_id: canvasId,
    match_count: count,
  });
}

/**
 * Verwijder een canvas op basis van ID.
 */
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

/**
 * Diagnostisch: tel hoeveel geïndexeerde child-chunks met embedding een canvas heeft.
 * Gebruikt in callMagic om canvas_id mismatch te detecteren.
 */
export async function countIndexedChunks(canvasId) {
  if (!supabase || !canvasId) return { count: 0, error: null };
  const { count, error } = await supabase
    .from("document_chunks")
    .select("id", { count: "exact", head: true })
    .eq("canvas_id", canvasId)
    .eq("chunk_type", "child")
    .not("embedding", "is", null);
  return { count: count ?? 0, error };
}

export async function deleteCanvas(id) {
  if (!supabase) return { error: "Supabase niet geconfigureerd" };
  const { error } = await supabase
    .from("canvases")
    .delete()
    .eq("id", id);
  if (error) console.error("Canvas verwijderen mislukt:", error.message);
  return { error };
}

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
  const { data, error } = await supabase
    .from("analysis_items")
    .upsert(item, { onConflict: "id" })
    .select()
    .maybeSingle();
  if (error) console.error("[analysis_items] upsert mislukt:", error.message);
  return { data, error };
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
