/**
 * RichtlijnenWerkblad — Swimlane dashboard voor Leidende Principes
 * Kingfisher & Partners — April 2026
 *
 * Vier verticale swimlanes (Generiek · Klanten · Organisatie · IT)
 * AI generatie per segment · Advies modal · Portrait onepager
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense,
} from "react";
import { ArrowLeft, Plus, Trash2, Wand2, X, Sparkles, FileText, RefreshCw } from "lucide-react";
import { apiFetch } from "../../shared/services/apiClient";
import { useLang } from "../../i18n";
import { useAppConfig } from "../../shared/context/AppConfigContext";
import {
  loadGuidelines, createGuideline, updateGuideline, deleteGuideline,
  loadGuidelineAnalysis, upsertGuidelineAnalysis,
} from "./services/guidelines.service";
import {
  loadStrategyCore, loadStrategicThemes,
} from "../strategie/services/strategy.service";

const GuidelinesOnePager = lazy(() => import("./GuidelinesOnePager"));

// ── Segment definities ────────────────────────────────────────────────────────
const SEGMENTS = [
  {
    key: "generiek",
    label: "Generiek",
    sublabel: "Strategie & Governance",
    headerBg:   "bg-[#1a365d]",
    borderL:    "border-l-[#1a365d]",
    badgeActive:"bg-[#1a365d] text-white",
    colBg:      "bg-blue-50/40",
    accent:     "#1a365d",
  },
  {
    key: "klanten",
    label: "Klanten",
    sublabel: "Markt & Dienstverlening",
    headerBg:   "bg-orange-600",
    borderL:    "border-l-orange-500",
    badgeActive:"bg-orange-500 text-white",
    colBg:      "bg-orange-50/40",
    accent:     "#c2410c",
  },
  {
    key: "organisatie",
    label: "Organisatie",
    sublabel: "Mens & Proces",
    headerBg:   "bg-[#2c7a4b]",
    borderL:    "border-l-[#2c7a4b]",
    badgeActive:"bg-[#2c7a4b] text-white",
    colBg:      "bg-green-50/40",
    accent:     "#2c7a4b",
  },
  {
    key: "it",
    label: "IT",
    sublabel: "Technologie & Data",
    headerBg:   "bg-purple-700",
    borderL:    "border-l-purple-600",
    badgeActive:"bg-purple-600 text-white",
    colBg:      "bg-purple-50/40",
    accent:     "#6b21a8",
  },
];

const GENERATE_MSGS = [
  "Strategie vertalen naar richtlijnen…",
  "Leidende principes formuleren…",
  "Organisatiegedrag uitkristalliseren…",
  "Principes kalibreren op ambities…",
  "Richtinggevende kaders opstellen…",
];

const EMPTY_IMPLICATIONS = { stop: "", start: "", continue: "" };

// ── GuidelineKaart ─────────────────────────────────────────────────────────────
const GuidelineKaart = React.memo(function GuidelineKaart({
  guideline, themas, segment,
  onChangeField, onChangeImplication, onToggleTheme, onDelete,
  implLoading, onGenerateImplications,
}) {
  const linked = Array.isArray(guideline.linked_themes) ? guideline.linked_themes : [];
  const impl   = guideline.implications || EMPTY_IMPLICATIONS;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${segment.borderL} shadow-sm overflow-hidden`}>

      {/* Title row */}
      <div className="flex items-start gap-2 px-3 pt-3 pb-2">
        <input
          value={guideline.title}
          onChange={e => onChangeField("title", e.target.value)}
          placeholder="Principe titel…"
          className="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300"
        />
        <button
          onClick={onDelete}
          className="text-slate-200 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
          title="Principe verwijderen"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Theme badge cloud */}
      {themas.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {themas.map((t, i) => {
            const isActive = linked.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onToggleTheme(t.id)}
                title={t.title}
                className={`text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center transition-all
                  ${isActive ? segment.badgeActive : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="mx-3 h-px bg-slate-100 mb-2" />

      {/* Description */}
      <div className="px-3 pb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          Toelichting &amp; Motivatie
        </p>
        <textarea
          value={guideline.description || ""}
          onChange={e => onChangeField("description", e.target.value)}
          placeholder="Waarom dit principe? Wat is de strategische motivatie?"
          rows={3}
          className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-slate-300 placeholder:text-slate-300 leading-relaxed"
        />
      </div>

      {/* Stop / Start / Continue */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Stop · Start · Continue</p>
          {guideline.title?.trim() && (
            <button
              onClick={onGenerateImplications}
              disabled={implLoading}
              className="flex items-center gap-1 text-[8px] font-bold text-slate-400 hover:text-[#1a365d] border border-slate-200 hover:border-[#1a365d]/30 rounded px-1.5 py-0.5 transition-colors disabled:opacity-40"
              title="AI Stop/Start/Continue genereren"
            >
              <Wand2 size={9} />
              {implLoading ? "…" : "AI"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "stop",     label: "Stop",     labelCls: "text-red-500",   bg: "bg-red-50",   border: "border-red-100"   },
            { key: "start",    label: "Start",    labelCls: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
            { key: "continue", label: "Continue", labelCls: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100"  },
          ].map(({ key, label, labelCls, bg, border }) => (
            <div key={key}>
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${labelCls}`}>{label}</p>
              <textarea
                value={impl[key] || ""}
                onChange={e => onChangeImplication(key, e.target.value)}
                placeholder={`${label}…`}
                rows={3}
                className={`w-full text-[10px] text-slate-600 ${bg} border ${border} rounded px-2 py-1.5 resize-none focus:outline-none focus:border-slate-300 placeholder:text-slate-300 leading-relaxed`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Generate Draft Panel ───────────────────────────────────────────────────────
function GenerateDraftPanel({ draft, onAcceptOne, onAcceptAll, onReject, segment }) {
  if (!draft) return null;
  return (
    <div className="mx-3 mt-3 border border-amber-300 rounded-xl overflow-hidden flex-shrink-0">
      <div className="flex items-center justify-between bg-amber-50 px-3 py-2 border-b border-amber-200">
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
          {draft.loading
            ? `🪄 ${draft.msg}`
            : `🪄 ${draft.guidelines.length} principes voorgesteld`}
        </span>
        {!draft.loading && (
          <div className="flex gap-1.5">
            <button onClick={onAcceptAll}
              className="text-[9px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5">
              Alle toevoegen
            </button>
            <button onClick={onReject}
              className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5">
              Weggooien
            </button>
          </div>
        )}
      </div>
      {draft.loading && (
        <div className="px-3 py-3 text-[10px] text-amber-700 animate-pulse bg-white">{draft.msg}</div>
      )}
      {!draft.loading && (draft.guidelines || []).map((g, i) => (
        <div key={i} className="group flex items-start gap-3 px-3 py-2.5 bg-white hover:bg-amber-50/30 border-b border-amber-100 last:border-0 transition-colors">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700">{g.title}</p>
            {g.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{g.description}</p>}
          </div>
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            <button onClick={() => onAcceptOne(i)}
              className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded px-2 py-0.5">
              ✓
            </button>
            <button onClick={() => onReject(i)}
              className="text-[9px] text-slate-400 hover:text-red-400 bg-slate-50 hover:bg-red-50 rounded px-1.5 py-0.5">
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SwimLane ──────────────────────────────────────────────────────────────────
function SwimLane({
  segment, guidelines, themas,
  onAdd, onDelete, onChangeField, onChangeImplication, onToggleTheme,
  onGenerate, generateDraft, onAcceptOneDraft, onAcceptAllDraft, onRejectDraft,
  implLoadings, onGenerateImplications,
}) {
  return (
    <div className={`flex flex-col border-r border-slate-200 last:border-r-0 ${segment.colBg} min-h-0`}>

      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 ${segment.headerBg} flex-shrink-0`}>
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{segment.label}</h3>
          <p className="text-[9px] text-white/60 font-medium">{segment.sublabel}</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generateDraft?.loading}
          title={`Genereer principes voor ${segment.label}`}
          className="flex items-center gap-1.5 text-[9px] font-bold text-white/80 hover:text-white border border-white/30 hover:border-white/60 rounded-md px-2.5 py-1 transition-colors disabled:opacity-50"
        >
          <Wand2 size={10} />
          {generateDraft?.loading ? "…" : "Genereer"}
        </button>
      </div>

      {/* Draft panel */}
      <GenerateDraftPanel
        draft={generateDraft}
        segment={segment}
        onAcceptOne={onAcceptOneDraft}
        onAcceptAll={onAcceptAllDraft}
        onReject={onRejectDraft}
      />

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {guidelines.map(g => (
          <GuidelineKaart
            key={g.id}
            guideline={g}
            themas={themas}
            segment={segment}
            onChangeField={(field, value)  => onChangeField(g.id, field, value)}
            onChangeImplication={(sk, val) => onChangeImplication(g.id, sk, val)}
            onToggleTheme={(themaId)       => onToggleTheme(g.id, themaId)}
            onDelete={()                   => onDelete(g.id)}
            implLoading={!!implLoadings[g.id]}
            onGenerateImplications={()     => onGenerateImplications(g.id)}
          />
        ))}
        {guidelines.length === 0 && !generateDraft && (
          <p className="text-[10px] text-slate-300 italic text-center py-8">
            Klik 🪄 Genereer voor AI-principes<br/>of voeg er handmatig een toe
          </p>
        )}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-slate-200/80 flex-shrink-0">
        <button
          onClick={onAdd}
          className="w-full py-2 text-[10px] font-semibold text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-white/60 hover:bg-white"
        >
          <Plus size={11} /> Principe toevoegen
        </button>
      </div>
    </div>
  );
}

// ── RichtlijnenWerkblad (main export) ─────────────────────────────────────────
export default function RichtlijnenWerkblad({ canvasId, onClose }) {
  const { t }              = useLang();
  const { prompt: appPrompt } = useAppConfig();

  const [mounted,  setMounted]  = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Data state
  const [guidelines, setGuidelines] = useState([]);
  const [themas,     setThemas]     = useState([]);
  const [core,       setCore]       = useState({ missie: "", visie: "", ambitie: "", kernwaarden: [] });
  const [canvasName, setCanvasName] = useState("");

  // AI overlay state
  const [showAdvies,      setShowAdvies]      = useState(false);
  const [showOnePager,    setShowOnePager]    = useState(false);
  const [analysis,        setAnalysis]        = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError,   setAnalysisError]   = useState(null);

  // Per-segment generate drafts: { [segKey]: { loading, msg, guidelines: [] } }
  const [generateDrafts, setGenerateDrafts] = useState({});

  // Per-guideline implications loading: { [id]: bool }
  const [implLoadings, setImplLoadings] = useState({});

  // Debounce refs
  const guidelinesRef  = useRef([]);
  const pendingUpdates = useRef({});
  const saveTimers     = useRef({});

  useEffect(() => { guidelinesRef.current = guidelines; }, [guidelines]);

  // Entrance animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load data
  useEffect(() => {
    if (!canvasId) { setIsLoaded(true); return; }
    Promise.all([
      loadGuidelines(canvasId),
      loadStrategicThemes(canvasId),
      loadStrategyCore(canvasId),
      loadGuidelineAnalysis(canvasId),
    ]).then(([{ data: gl }, { data: th }, { data: co }, { data: ga }]) => {
      setGuidelines(gl || []);
      setThemas(th || []);
      if (co) {
        setCore({
          missie:      co.missie      || "",
          visie:       co.visie       || "",
          ambitie:     co.ambitie     || "",
          kernwaarden: co.kernwaarden || [],
        });
      }
      if (ga?.recommendations) setAnalysis(ga.recommendations);
      setIsLoaded(true);
    });
  }, [canvasId]);

  // Haal canvas naam op voor onepager
  useEffect(() => {
    const stored = localStorage.getItem("btc.lastCanvasId");
    if (stored) {
      import("../../shared/services/canvas.service").then(({ loadCanvasById }) => {
        loadCanvasById(canvasId).then(({ data }) => {
          if (data?.name) setCanvasName(data.name);
        });
      });
    }
  }, [canvasId]);

  // ── Debounced save helper ──────────────────────────────────────────────────
  const scheduleDbSave = useCallback((id, patch) => {
    pendingUpdates.current[id] = { ...(pendingUpdates.current[id] || {}), ...patch };
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const updates = pendingUpdates.current[id];
      delete pendingUpdates.current[id];
      if (updates) await updateGuideline(id, updates);
    }, 800);
  }, []);

  // ── Field change handlers ──────────────────────────────────────────────────
  const handleChangeField = useCallback((id, field, value) => {
    setGuidelines(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    scheduleDbSave(id, { [field]: value });
  }, [scheduleDbSave]);

  const handleChangeImplication = useCallback((id, subKey, value) => {
    setGuidelines(prev => prev.map(g => {
      if (g.id !== id) return g;
      const newImpl = { ...(g.implications || EMPTY_IMPLICATIONS), [subKey]: value };
      scheduleDbSave(id, { implications: newImpl });
      return { ...g, implications: newImpl };
    }));
  }, [scheduleDbSave]);

  const handleToggleTheme = useCallback((id, themaId) => {
    setGuidelines(prev => prev.map(g => {
      if (g.id !== id) return g;
      const current = Array.isArray(g.linked_themes) ? g.linked_themes : [];
      const newLinked = current.includes(themaId)
        ? current.filter(x => x !== themaId)
        : [...current, themaId];
      scheduleDbSave(id, { linked_themes: newLinked });
      return { ...g, linked_themes: newLinked };
    }));
  }, [scheduleDbSave]);

  // ── Add / Delete ───────────────────────────────────────────────────────────
  const handleAdd = useCallback(async (segment) => {
    const { data } = await createGuideline(canvasId, segment);
    if (data) setGuidelines(prev => [...prev, data]);
  }, [canvasId]);

  const handleDelete = useCallback(async (id) => {
    clearTimeout(saveTimers.current[id]);
    delete pendingUpdates.current[id];
    await deleteGuideline(id);
    setGuidelines(prev => prev.filter(g => g.id !== id));
  }, []);

  // ── AI: Generate per segment ───────────────────────────────────────────────
  const handleGenerate = useCallback(async (segKey) => {
    const msg = GENERATE_MSGS[Math.floor(Math.random() * GENERATE_MSGS.length)];
    setGenerateDrafts(prev => ({ ...prev, [segKey]: { loading: true, msg, guidelines: [] } }));
    try {
      const res = await apiFetch("/api/guidelines", {
        method: "POST",
        body: JSON.stringify({
          mode: "generate",
          segment: segKey,
          core,
          items: [],   // SWOT items niet geladen hier (licht houden); API werkt ook zonder
          themas,
          systemPromptGenerate: appPrompt("guideline.generate") || undefined,
          languageInstruction: t("ai.language"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fout");
      setGenerateDrafts(prev => ({ ...prev, [segKey]: { loading: false, msg, guidelines: data.guidelines || [] } }));
    } catch (err) {
      setGenerateDrafts(prev => ({ ...prev, [segKey]: { loading: false, msg, guidelines: [], error: err.message } }));
    }
  }, [core, themas, appPrompt, t]);

  const handleAcceptOneDraft = useCallback(async (segKey, idx) => {
    const draft = generateDrafts[segKey];
    if (!draft) return;
    const g = draft.guidelines[idx];
    const { data } = await createGuideline(canvasId, segKey);
    if (data) {
      const updated = { ...data, title: g.title || "", description: g.description || "", implications: g.implications || EMPTY_IMPLICATIONS };
      await updateGuideline(data.id, { title: updated.title, description: updated.description, implications: updated.implications });
      setGuidelines(prev => [...prev, updated]);
    }
    setGenerateDrafts(prev => ({
      ...prev,
      [segKey]: { ...prev[segKey], guidelines: prev[segKey].guidelines.filter((_, i) => i !== idx) },
    }));
  }, [canvasId, generateDrafts]);

  const handleAcceptAllDraft = useCallback(async (segKey) => {
    const draft = generateDrafts[segKey];
    if (!draft) return;
    for (const g of draft.guidelines) {
      const { data } = await createGuideline(canvasId, segKey);
      if (data) {
        const updated = { ...data, title: g.title || "", description: g.description || "", implications: g.implications || EMPTY_IMPLICATIONS };
        await updateGuideline(data.id, { title: updated.title, description: updated.description, implications: updated.implications });
        setGuidelines(prev => [...prev, updated]);
      }
    }
    setGenerateDrafts(prev => { const n = { ...prev }; delete n[segKey]; return n; });
  }, [canvasId, generateDrafts]);

  const handleRejectDraft = useCallback((segKey) => {
    setGenerateDrafts(prev => { const n = { ...prev }; delete n[segKey]; return n; });
  }, []);

  // ── AI: Implications per kaart ─────────────────────────────────────────────
  const handleGenerateImplications = useCallback(async (id) => {
    const g = guidelinesRef.current.find(x => x.id === id);
    if (!g?.title?.trim()) return;
    setImplLoadings(prev => ({ ...prev, [id]: true }));
    try {
      const res = await apiFetch("/api/guidelines", {
        method: "POST",
        body: JSON.stringify({
          mode: "implications",
          title: g.title,
          description: g.description,
          context: core.ambitie,
          systemPromptImplications: appPrompt("guideline.implications") || undefined,
          languageInstruction: t("ai.language"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fout");
      const newImpl = {
        stop:     data.stop     || "",
        start:    data.start    || "",
        continue: data.continue || "",
      };
      handleChangeImplication(id, "stop",     newImpl.stop);
      handleChangeImplication(id, "start",    newImpl.start);
      handleChangeImplication(id, "continue", newImpl.continue);
    } catch (err) {
      console.error("[impl AI]", err.message);
    } finally {
      setImplLoadings(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  }, [core.ambitie, appPrompt, t, handleChangeImplication]);

  // ── AI: Advies modal ───────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await apiFetch("/api/guidelines", {
        method: "POST",
        body: JSON.stringify({
          mode: "advies",
          guidelines,
          themas,
          core,
          systemPromptAdvies: appPrompt("guideline.advies") || undefined,
          languageInstruction: t("ai.language"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fout");
      const recs = data.recommendations || [];
      setAnalysis(recs);
      await upsertGuidelineAnalysis(canvasId, recs);
    } catch (e) {
      setAnalysisError(e.message);
    } finally {
      setAnalysisLoading(false);
    }
  }, [guidelines, themas, core, canvasId, appPrompt, t]);

  // ── Per-segment memoized handlers ──────────────────────────────────────────
  const segmentHandlers = useMemo(() =>
    SEGMENTS.reduce((acc, seg) => ({
      ...acc,
      [seg.key]: {
        onAdd:             ()          => handleAdd(seg.key),
        onGenerate:        ()          => handleGenerate(seg.key),
        onAcceptOneDraft:  (idx)       => handleAcceptOneDraft(seg.key, idx),
        onAcceptAllDraft:  ()          => handleAcceptAllDraft(seg.key),
        onRejectDraft:     ()          => handleRejectDraft(seg.key),
      },
    }), {}),
  [handleAdd, handleGenerate, handleAcceptOneDraft, handleAcceptAllDraft, handleRejectDraft]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50 items-center justify-center">
        <Wand2 size={28} className="text-[#8dc63f] animate-pulse mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Richtlijnen laden…</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
      ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-[#1a365d] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">De Werkkamer</p>
            <h2 className="text-lg font-bold text-[#1a365d] leading-tight">Richtlijnen &amp; Leidende Principes</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvies(true)}
            className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-lg transition-colors
              ${analysis
                ? "bg-[#8dc63f]/10 border-[#8dc63f]/50 text-[#2c7a4b] hover:border-[#8dc63f]"
                : "bg-white border-slate-200 hover:border-[#1a365d]/40 text-[#1a365d]"}`}
          >
            <Sparkles size={13} />
            Richtlijnen Advies{analysis ? " ✓" : ""}
          </button>
          <button
            onClick={() => setShowOnePager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[#1a365d]/40 text-[#1a365d] text-xs font-bold rounded-lg transition-colors"
          >
            <FileText size={13} />
            Onepager
          </button>
        </div>
      </div>

      {/* ── Context-balk: Ambitie + Thema-badges ── */}
      <div className="flex-shrink-0 bg-[#1a365d]/5 border-b border-[#1a365d]/10 px-8 py-2.5 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Stip op de horizon</span>
          <span className="text-[11px] font-semibold text-[#1a365d] max-w-xs truncate" title={core.ambitie}>
            {core.ambitie || <span className="italic text-slate-400 font-normal">geen ambitie ingevuld</span>}
          </span>
        </div>
        {themas.length > 0 && (
          <>
            <div className="h-5 w-px bg-slate-300 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {themas.map((t, i) => (
                <span key={t.id} title={t.title}
                  className="inline-flex items-center gap-1 text-[9px] font-semibold bg-[#8dc63f]/10 text-[#2c7a4b] border border-[#8dc63f]/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                  <span className="font-black text-[8px]">{i + 1}</span>
                  <span className="max-w-[80px] truncate">{t.title}</span>
                </span>
              ))}
            </div>
          </>
        )}
        {themas.length === 0 && (
          <span className="text-[9px] text-slate-400 italic">Geen thema's — voeg ze toe in het Strategie Werkblad</span>
        )}
      </div>

      {/* ── Swimlane grid ── */}
      <div className="flex-1 grid grid-cols-4 min-h-0 overflow-hidden">
        {SEGMENTS.map(seg => {
          const segGuidelines = guidelines.filter(g => g.segment === seg.key);
          const handlers      = segmentHandlers[seg.key];
          return (
            <SwimLane
              key={seg.key}
              segment={seg}
              guidelines={segGuidelines}
              themas={themas}
              generateDraft={generateDrafts[seg.key]}
              implLoadings={implLoadings}
              onAdd={handlers.onAdd}
              onDelete={handleDelete}
              onChangeField={handleChangeField}
              onChangeImplication={handleChangeImplication}
              onToggleTheme={handleToggleTheme}
              onGenerate={handlers.onGenerate}
              onAcceptOneDraft={handlers.onAcceptOneDraft}
              onAcceptAllDraft={handlers.onAcceptAllDraft}
              onRejectDraft={handlers.onRejectDraft}
              onGenerateImplications={handleGenerateImplications}
            />
          );
        })}
      </div>

      {/* ── Advies overlay ── */}
      {showAdvies && (
        <div className="fixed inset-0 z-[59] flex flex-col bg-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-[#1a365d] border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-[#8dc63f]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Richtlijnen Advies</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={analysisLoading}
                className="flex items-center gap-2 px-5 py-2 bg-[#8dc63f] hover:bg-[#7ab535] text-[#1a365d] text-[10px] font-black uppercase tracking-widest rounded-md transition-colors disabled:opacity-50"
              >
                {analysisLoading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {analysisLoading ? "Analyseren…" : analysis ? "Opnieuw analyseren" : "Analyseer richtlijnen"}
              </button>
              <button onClick={() => setShowAdvies(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <div className="w-full max-w-5xl">
              {analysisError && <p className="text-red-500 text-sm italic mb-4">{analysisError}</p>}
              {analysisLoading && (
                <p className="text-slate-400 text-sm italic animate-pulse pt-8 text-center">
                  AI analyseert uw richtlijnen op coherentie, segment-balans en strategische dekking…
                </p>
              )}
              {!analysisLoading && analysis && analysis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.map((rec, i) => {
                    const cm = {
                      warning: { bg: "bg-orange-50", border: "border-orange-200", title: "text-orange-700", text: "text-orange-800" },
                      info:    { bg: "bg-blue-50",   border: "border-blue-200",   title: "text-blue-700",   text: "text-blue-800"   },
                      success: { bg: "bg-green-50",  border: "border-green-200",  title: "text-green-700",  text: "text-green-800"  },
                    };
                    const c = cm[rec.type] || cm.info;
                    return (
                      <div key={i} className={`rounded-xl border ${c.border} border-l-4 p-5 bg-white shadow-sm`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${c.title}`}>{rec.title}</p>
                        <p className={`text-sm leading-relaxed ${c.text}`}>{rec.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {!analysisLoading && !analysis && !analysisError && (
                <div className="flex items-center justify-center h-64">
                  <p className="text-slate-400 text-sm italic text-center max-w-sm">
                    Klik "Analyseer richtlijnen" voor AI-inzichten over coherentie, segment-balans en strategische dekking.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center py-2 text-[9px] text-slate-400 uppercase tracking-widest flex-shrink-0 bg-slate-100">
            AI-analyse op basis van alle leidende principes · opgeslagen per canvas
          </div>
        </div>
      )}

      {/* ── OnePager overlay ── */}
      {showOnePager && (
        <Suspense fallback={null}>
          <GuidelinesOnePager
            guidelines={guidelines}
            themas={themas}
            core={core}
            canvasName={canvasName}
            onClose={() => setShowOnePager(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
