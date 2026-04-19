/**
 * useCanvasState — canvas business logic hook
 *
 * Verantwoordelijk voor:
 *  - canvas-laden bij login (meest recente canvas)
 *  - autosave (500ms debounce)
 *  - multi-tab detectie
 *  - alle canvas CRUD handlers
 *  - per-blok state (docs, insights, bullets)
 *
 * App.js houdt alleen UI-state bij (welk panel open, modals, etc.)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  loadUserCanvases,
  createCanvas,
  upsertCanvas,
  loadCanvasById,
  deleteCanvas,
} from "../../../services/canvasStorage";
import { BLOCKS, EXAMPLE_BULLETS } from "../components/BlockCard";

/**
 * @param {object} options
 * @param {object}   options.user           — Supabase user object (null als niet ingelogd)
 * @param {string}   options.lang           — huidige taalcode ("nl" | "en")
 * @param {function} options.onCanvasSwitch — wordt aangeroepen wanneer canvas wisselt (reset UI-state)
 */
export function useCanvasState({ user, lang, onCanvasSwitch }) {
  // ── Canvas identiteit ───────────────────────────────────────────────────────
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [canvases, setCanvases]             = useState([]);
  const [scope, setScope]                   = useState("");

  // ── Project metadata ────────────────────────────────────────────────────────
  const [meta, setMeta] = useState({});

  // ── Per-blok state ──────────────────────────────────────────────────────────
  const [docs, setDocs]         = useState({});
  const [insights, setInsights] = useState({});
  const [bullets, setBullets]   = useState({});

  // ── Deep Dive manual data (strategie executive summary) ─────────────────────
  const [strategyManual, setStrategyManual] = useState(null);

  // ── Autosave indicator ──────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  // ── Multi-tab waarschuwing ──────────────────────────────────────────────────
  const [multiTabWarning, setMultiTabWarning] = useState(false);

  // ── Interne refs ────────────────────────────────────────────────────────────
  const suppressSaveRef  = useRef(false); // onderdruk autosave tijdens canvas-laden
  const autosaveTimerRef = useRef(null);

  // ── Helper: laad een canvas-record in state ─────────────────────────────────
  const applyCanvasData = useCallback((full) => {
    suppressSaveRef.current = true;
    setActiveCanvasId(full.id);
    setScope(full.name || "");
    setDocs(full.blocks?.docs || {});
    setInsights(full.blocks?.insights || {});
    setBullets(full.blocks?.bullets || {});
    setMeta({
      client_name:         full.client_name         || "",
      author_name:         full.author_name          || "",
      industry:            full.industry             || "",
      transformation_type: full.transformation_type  || "",
      org_size:            full.org_size             || "",
      project_status:      full.project_status       || "",
      project_description: full.project_description  || "",
    });
    const sm = full.data?.strategy?.details?.manual;
    setStrategyManual(sm || null);
    setTimeout(() => { suppressSaveRef.current = false; }, 100);
  }, []);

  // ── Laad canvassen bij inloggen ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const today = new Date().toLocaleDateString("nl-NL", {
      day: "2-digit", month: "short", year: "numeric",
    });

    loadUserCanvases(user.id).then(async ({ data, error }) => {
      if (error) {
        console.error("[init] Canvassen laden mislukt:", error.code, error.message);
        return;
      }
      console.log("[init] canvassen geladen:", data?.length, data);

      if (data && data.length > 0) {
        setCanvases(data);
        const { data: full, error: loadErr } = await loadCanvasById(data[0].id);
        console.log("[init] canvas laden:", full, loadErr);
        if (full) applyCanvasData(full);
      } else {
        // Geen canvassen — maak direct een nieuw aan
        const name = `Canvas ${today}`;
        const { data: created, error: createErr } = await createCanvas({
          userId: user.id, name, language: lang,
        });
        console.log("[init] nieuw canvas:", created, createErr);
        if (created) {
          suppressSaveRef.current = true;
          setCanvases([created]);
          setActiveCanvasId(created.id);
          setScope(created.name || name);
          setTimeout(() => { suppressSaveRef.current = false; }, 100);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Autosave (500ms debounce, last-write-wins) ──────────────────────────────
  useEffect(() => {
    if (!activeCanvasId) { console.log("[autosave] skip: geen activeCanvasId"); return; }
    if (!user)           { console.log("[autosave] skip: geen user"); return; }
    if (suppressSaveRef.current) { console.log("[autosave] skip: suppress actief"); return; }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const { error } = await upsertCanvas(activeCanvasId, {
        scope, docs, insights, bullets, language: lang, meta,
      });
      if (!error) {
        setSaveStatus("saved");
        setCanvases(prev =>
          prev.map(c => c.id === activeCanvasId ? { ...c, name: scope } : c)
        );
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(autosaveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, docs, insights, bullets, meta, activeCanvasId]);

  // ── Multi-tab detectie ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    let warned = false;
    const bc = new BroadcastChannel("kingfisher_btc");
    bc.postMessage("ping");
    bc.onmessage = (e) => {
      if (e.data === "ping") bc.postMessage("pong");
      if (e.data === "pong" && !warned) { warned = true; setMultiTabWarning(true); }
    };
    return () => bc.close();
  }, []);

  // ── Canvas handlers ─────────────────────────────────────────────────────────

  const handleNewCanvas = useCallback(async () => {
    const today = new Date().toLocaleDateString("nl-NL", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const name = `Canvas ${today}`;
    const { data, error } = await createCanvas({ userId: user.id, name, language: lang });
    if (!error && data) {
      setCanvases(prev => [data, ...prev]);
      suppressSaveRef.current = true;
      setActiveCanvasId(data.id);
      setScope(data.name);
      setDocs({}); setInsights({}); setBullets({});
      onCanvasSwitch?.();
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  }, [user, lang, onCanvasSwitch]);

  const handleSelectCanvas = useCallback(async (canvasRecord) => {
    const { data: full } = await loadCanvasById(canvasRecord.id);
    if (full) {
      applyCanvasData(full);
      onCanvasSwitch?.();
    }
  }, [applyCanvasData, onCanvasSwitch]);

  const handleRenameCanvas = useCallback((newName) => {
    setScope(newName);
    // Autosave pikt de gewijzigde scope op via het debounce-effect
  }, []);

  const handleDeleteCanvas = useCallback(async (canvasId) => {
    const { error } = await deleteCanvas(canvasId);
    if (error) { console.error("[delete] canvas verwijderen mislukt:", error.message); return; }

    setCanvases(prev => {
      const remaining = prev.filter(c => c.id !== canvasId);

      // Als het actieve canvas verwijderd wordt: switch naar eerste resterende
      if (activeCanvasId === canvasId) {
        if (remaining.length > 0) {
          loadCanvasById(remaining[0].id).then(({ data: full }) => {
            if (full) applyCanvasData(full);
          });
        } else {
          // Geen canvassen meer over
          setActiveCanvasId(null);
          setScope("");
          setDocs({}); setInsights({}); setBullets({});
        }
        onCanvasSwitch?.();
      }

      return remaining;
    });
  }, [activeCanvasId, applyCanvasData, onCanvasSwitch]);

  const handleLoadExample = useCallback(() => {
    suppressSaveRef.current = true;
    setBullets(EXAMPLE_BULLETS);
    setScope("Company Example — BTP 2024");
    setDocs({});
    setInsights({});
    onCanvasSwitch?.();
    setTimeout(() => { suppressSaveRef.current = false; }, 100);
  }, [onCanvasSwitch]);

  // ── Per-blok handlers ───────────────────────────────────────────────────────

  const handleDocsChange = useCallback((blockId, filename, newInsights) => {
    setDocs(p => ({ ...p, [blockId]: [...(p[blockId] || []), filename] }));
    setInsights(p => ({ ...p, [blockId]: [...(p[blockId] || []), ...newInsights] }));
  }, []);

  const handleInsightAccept = useCallback((blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].map(i => i.id === insightId ? { ...i, status: "accepted" } : i),
    }));
  }, []);

  const handleInsightReject = useCallback((blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].filter(i => i.id !== insightId),
    }));
  }, []);

  const handleMoveToBullets = useCallback((blockId, insight, editIdx = null, isEdit = false) => {
    const block = BLOCKS.find(b => b.id === blockId);
    const bulletObj = {
      text:   insight.text,
      source: insight.source || null,
      subtab: insight.subtab || (block?.hasSubs ? (block.subTabs?.[0]?.id || "current") : null),
    };
    if (isEdit && editIdx !== null) {
      setBullets(p => {
        const arr = [...(p[blockId] || [])];
        arr[editIdx] = bulletObj;
        return { ...p, [blockId]: arr };
      });
    } else {
      setBullets(p => ({
        ...p,
        [blockId]: [
          ...(p[blockId] || []).filter(b =>
            (typeof b === "string" ? b : b.text) !== insight.text
          ),
          bulletObj,
        ],
      }));
      if (!isEdit) {
        setInsights(p => ({
          ...p,
          [blockId]: (p[blockId] || []).filter(i => i.id !== insight.id),
        }));
      }
    }
  }, []);

  const handleDeleteBullet = useCallback((blockId, idx) => {
    setBullets(p => ({ ...p, [blockId]: p[blockId].filter((_, i) => i !== idx) }));
  }, []);

  const handleAddBullet = useCallback((blockId, text, subtab = null) => {
    setBullets(p => ({
      ...p,
      [blockId]: [...(p[blockId] || []), { text, source: null, subtab }],
    }));
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  return {
    // state (readonly vanuit App.js perspectief)
    activeCanvasId,
    canvases,
    scope,
    meta,
    docs,
    insights,
    bullets,
    strategyManual,
    saveStatus,
    multiTabWarning,

    // directe setters (voor projectinfo sidebar, multi-tab dismiss, strategy preview)
    setMeta,
    setMultiTabWarning,
    setStrategyManual,

    // canvas handlers
    handleNewCanvas,
    handleSelectCanvas,
    handleRenameCanvas,
    handleDeleteCanvas,
    handleLoadExample,

    // blok handlers
    handleDocsChange,
    handleInsightAccept,
    handleInsightReject,
    handleMoveToBullets,
    handleDeleteBullet,
    handleAddBullet,
  };
}
