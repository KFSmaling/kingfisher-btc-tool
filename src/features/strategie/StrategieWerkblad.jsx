import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wand2, Trash2, Plus, X, ArrowLeft, Zap } from "lucide-react";
import { useLang } from "../../i18n";
import WandButton from "../../shared/components/WandButton";
import MagicResult from "../../shared/components/MagicResult";
import TagPill, { EXTERN_TAGS, INTERN_TAGS } from "../../shared/components/TagPill";
import {
  loadStrategyCore,
  upsertStrategyCore,
  loadAnalysisItems,
  upsertAnalysisItem,
  deleteAnalysisItem,
  loadStrategicThemes,
  upsertStrategicTheme,
  deleteStrategicTheme,
  upsertKsfKpi,
  deleteKsfKpi,
} from "./services/strategy.service";
import { searchDocumentChunks } from "../../shared/services/embedding.service";

/** KSF/KPI tabel-rij */
const KsfKpiRow = React.memo(function KsfKpiRow({ item, onChange, onDelete }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 items-center group">
      <input value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
        placeholder="Omschrijving…"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40" />
      <input value={item.current_value} onChange={e => onChange({ ...item, current_value: e.target.value })}
        placeholder="Huidig"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-500 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40 text-center" />
      <input value={item.target_value} onChange={e => onChange({ ...item, target_value: e.target.value })}
        placeholder="Target"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[#2c7a4b] placeholder:text-slate-300 focus:outline-none focus:border-[#2c7a4b]/40 text-center font-semibold" />
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity">
        <X size={12} />
      </button>
    </div>
  );
});

const KSF_KPI_LOADING_MSGS = [
  "Balanced Scorecard aan het kalibreren…",
  "SMART-criteria toepassen op uw ambities…",
  "KPI's formuleren die de CFO ook begrijpt…",
  "Succescriteria uitvinden die niet alleen in theorie werken…",
  "McKinsey-kwaliteit benchmarken tegen eigen targets…",
];

/** Strategisch Thema accordeon met KSF/KPI tabel */
const ThemaAccordeon = React.memo(function ThemaAccordeon({ thema, index, onTitleChange, onDelete, onAddKsfKpi, onUpdateKsfKpi, onDeleteKsfKpi, onGenerateKsfKpi, ksfKpiDraft, onAcceptKsfKpiDraft, onRejectKsfKpiDraft }) {
  const [open, setOpen] = useState(index === 0);
  const ksfs = (thema.ksf_kpi || []).filter(k => k.type === "ksf").sort((a,b) => a.sort_order - b.sort_order);
  const kpis = (thema.ksf_kpi || []).filter(k => k.type === "kpi").sort((a,b) => a.sort_order - b.sort_order);
  const loadingMsg = ksfKpiDraft?.loadingMsg || KSF_KPI_LOADING_MSGS[0];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[10px] font-black text-[#1a365d]/60 uppercase tracking-widest w-5 flex-shrink-0">{index + 1}</span>
        <input
          value={thema.title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder={`Strategisch Thema ${index + 1}…`}
          className="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
        />
        {/* KSF/KPI genereren knop */}
        {onGenerateKsfKpi && thema.title?.trim() && (
          <button
            onClick={() => { if (!ksfKpiDraft?.loading) { setOpen(true); onGenerateKsfKpi(); } }}
            disabled={ksfKpiDraft?.loading}
            title="KSF & KPI genereren op basis van dit thema"
            className="flex items-center gap-1 text-[9px] font-bold text-[#8dc63f] hover:text-[#2c7a4b] border border-[#8dc63f]/40 hover:border-[#2c7a4b]/60 rounded-md px-2 py-1 transition-colors disabled:opacity-50 flex-shrink-0">
            <Wand2 size={10} />
            {ksfKpiDraft?.loading ? "…" : "KSF & KPI"}
          </button>
        )}
        <button onClick={() => setOpen(o => !o)}
          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
            className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l5 6 5-6H2z" />
          </svg>
        </button>
        <button onClick={onDelete}
          className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 space-y-5">

          {/* KSF/KPI Draft panel */}
          {ksfKpiDraft && (
            <div className="border border-amber-300 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-amber-50 px-3 py-2 border-b border-amber-200">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                  {ksfKpiDraft.loading ? "🪄 " + loadingMsg : `🪄 AI Voorstel — ${(ksfKpiDraft.ksf||[]).length} KSF's + ${(ksfKpiDraft.kpi||[]).length} KPI's`}
                </span>
                {!ksfKpiDraft.loading && (
                  <div className="flex gap-2">
                    <button onClick={onAcceptKsfKpiDraft}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5 transition-colors">
                      Alles toevoegen
                    </button>
                    <button onClick={onRejectKsfKpiDraft}
                      className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5 transition-colors">
                      Weggooien
                    </button>
                  </div>
                )}
              </div>
              {ksfKpiDraft.loading && (
                <div className="px-4 py-3 text-[10px] text-amber-700 animate-pulse">
                  {loadingMsg}
                </div>
              )}
              {!ksfKpiDraft.loading && (
                <div className="divide-y divide-amber-100">
                  {/* KSF preview */}
                  {(ksfKpiDraft.ksf || []).map((k, i) => (
                    <div key={`ksf-${i}`} className="grid grid-cols-[20px_1fr_90px_90px] gap-2 items-center px-3 py-2 bg-white hover:bg-amber-50/30 transition-colors">
                      <span className="text-[8px] font-black text-[#1a365d]/50 uppercase">KSF</span>
                      <span className="text-xs text-slate-700">{k.description}</span>
                      <span className="text-[10px] text-slate-400 text-center">{k.current_value || "—"}</span>
                      <span className="text-[10px] text-[#2c7a4b] font-semibold text-center">{k.target_value || "—"}</span>
                    </div>
                  ))}
                  {/* KPI preview */}
                  {(ksfKpiDraft.kpi || []).map((k, i) => (
                    <div key={`kpi-${i}`} className="grid grid-cols-[20px_1fr_90px_90px] gap-2 items-center px-3 py-2 bg-white hover:bg-amber-50/30 transition-colors">
                      <span className="text-[8px] font-black text-[#2c7a4b]/70 uppercase">KPI</span>
                      <span className="text-xs text-slate-700">{k.description}</span>
                      <span className="text-[10px] text-slate-400 text-center">{k.current_value || "—"}</span>
                      <span className="text-[10px] text-[#2c7a4b] font-semibold text-center">{k.target_value || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* KSF sectie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-[#1a365d]">
                KSF — Kritieke Succesfactoren <span className="font-normal text-slate-400">({ksfs.length}/3)</span>
              </h5>
              {ksfs.length < 3 && (
                <button onClick={() => onAddKsfKpi("ksf")}
                  className="text-[9px] font-bold text-[#1a365d] hover:text-[#1a365d]/70 flex items-center gap-1">
                  <Plus size={10} /> Toevoegen
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 pb-1 border-b border-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Omschrijving</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 text-center">Huidig</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#2c7a4b] text-center">Target</span>
              <span />
            </div>
            {ksfs.map(k => (
              <KsfKpiRow key={k.id} item={k}
                onChange={updated => onUpdateKsfKpi(updated)}
                onDelete={() => onDeleteKsfKpi(k.id)} />
            ))}
            {ksfs.length === 0 && <p className="text-[10px] text-slate-300 italic">Nog geen KSF's — klik Toevoegen of gebruik 🪄 KSF &amp; KPI</p>}
          </div>

          {/* KPI sectie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-[#2c7a4b]">
                KPI — Prestatie-indicatoren <span className="font-normal text-slate-400">({kpis.length}/3)</span>
              </h5>
              {kpis.length < 3 && (
                <button onClick={() => onAddKsfKpi("kpi")}
                  className="text-[9px] font-bold text-[#2c7a4b] hover:text-[#2c7a4b]/70 flex items-center gap-1">
                  <Plus size={10} /> Toevoegen
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 pb-1 border-b border-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Omschrijving</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 text-center">Huidig</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#2c7a4b] text-center">Target</span>
              <span />
            </div>
            {kpis.map(k => (
              <KsfKpiRow key={k.id} item={k}
                onChange={updated => onUpdateKsfKpi(updated)}
                onDelete={() => onDeleteKsfKpi(k.id)} />
            ))}
            {kpis.length === 0 && <p className="text-[10px] text-slate-300 italic">Nog geen KPI's — klik Toevoegen of gebruik 🪄 KSF &amp; KPI</p>}
          </div>
        </div>
      )}
    </div>
  );
});

/** Analyse-lijst (extern of intern) met tagging */
function AnalyseSection({ title, type, items, onAdd, onDelete, onTagChange, onMagic, magicResult, onRejectMagic }) {
  const allowedTagKeys = type === "extern" ? EXTERN_TAGS : type === "intern" ? INTERN_TAGS : undefined;
  const [draft, setDraft] = useState("");
  const [proposedLines, setProposedLines] = useState([]);

  // Patroon voor paginaverwijzingen en losse kopjes die we willen wegfilteren
  const isNoise = (line) => {
    if (/^\[(slide|pagina|page|notes)\s+\d+\]/i.test(line)) return true;  // [Slide 7]
    if (/\[(slide|pagina|page|notes)\s+\d+\]$/i.test(line)) return true;  // tekst [Slide 7]
    if (/^(slide|pagina|page)\s+\d+$/i.test(line)) return true;           // "Slide 7"
    if (line.length < 12) return true;                                     // te kort = kopje
    if (/^[A-Z][A-Z\s&/–-]{8,}$/.test(line)) return true;                 // ALL CAPS kopje
    if (/^\d+[.)]\s/.test(line) && line.length < 20) return true;           // "1. Titel"
    return false;
  };

  // Zodra er een nieuwe magic suggestion binnenkomt: split op regels
  useEffect(() => {
    if (magicResult?.suggestion && !magicResult.loading) {
      const lines = magicResult.suggestion
        .split("\n")
        .map(l => l.trim().replace(/^[-•*]\s*/, ""))  // strip leading bullets
        .filter(l => l.length > 4 && !isNoise(l));
      setProposedLines(lines);
    } else if (!magicResult || magicResult.loading) {
      setProposedLines([]);
    }
  }, [magicResult?.suggestion, magicResult?.loading, magicResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    const val = draft.trim();
    if (val) { onAdd(val); setDraft(""); }
  };

  const acceptLine = (i) => {
    onAdd(proposedLines[i]);
    setProposedLines(prev => prev.filter((_, j) => j !== i));
  };
  const acceptAll = () => {
    proposedLines.forEach(l => onAdd(l));
    setProposedLines([]);
    onRejectMagic?.();
  };
  const dismissAll = () => {
    setProposedLines([]);
    onRejectMagic?.();
  };

  const tagColors = {
    kans:          "bg-emerald-50 border-l-emerald-400",
    sterkte:       "bg-blue-50 border-l-blue-400",
    bedreiging:    "bg-red-50 border-l-red-400",
    zwakte:        "bg-orange-50 border-l-orange-400",
    niet_relevant: "bg-slate-50 border-l-slate-200",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h4>
        {onMagic && <WandButton onClick={onMagic} loading={magicResult?.loading} />}
      </div>

      {/* Laden */}
      {magicResult?.loading && (
        <div className="text-[10px] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 animate-pulse">
          Analyseren…
        </div>
      )}

      {/* Geen chunks */}
      {magicResult?.noChunks && (
        <div className="text-[10px] text-slate-400 italic px-1">Geen documenten gevonden voor dit veld.</div>
      )}

      {/* Voorgestelde items (regel-voor-regel) */}
      {proposedLines.length > 0 && (
        <div className="border border-amber-300 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 px-3 py-2 border-b border-amber-200">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
              🪄 Voorstel — {proposedLines.length} item{proposedLines.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1.5">
              <button onClick={acceptAll}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5 transition-colors">
                Alle toevoegen
              </button>
              <button onClick={dismissAll}
                className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5 transition-colors">
                Weggooien
              </button>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {proposedLines.map((line, i) => (
              <div key={i} className="group flex items-start gap-2 bg-white hover:bg-amber-50/40 px-3 py-2 transition-colors">
                <p className="flex-1 text-xs text-slate-700 leading-relaxed">{line}</p>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => acceptLine(i)}
                    title="Toevoegen"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded px-1.5 py-0.5 transition-colors">
                    ✓
                  </button>
                  <button onClick={() => setProposedLines(prev => prev.filter((_, j) => j !== i))}
                    title="Overslaan"
                    className="text-xs text-slate-400 hover:text-red-400 bg-slate-50 hover:bg-red-50 rounded px-1.5 py-0.5 transition-colors">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bestaande items */}
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id}
            className={`group flex items-start gap-2 border-l-4 rounded-r-lg px-3 py-2 ${tagColors[item.tag] || tagColors.niet_relevant}`}>
            <p className="flex-1 text-xs text-slate-700 leading-relaxed">{item.content}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <TagPill tag={item.tag} onChange={tag => onTagChange(item.id, tag)} allowedKeys={allowedTagKeys} />
              <button onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          placeholder={`+ Nieuwe ${title.toLowerCase()}…`}
          className="flex-1 text-xs bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2 text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40"
        />
        <button onClick={commit}
          className="text-xs font-bold text-white bg-[#1a365d] hover:bg-[#1a365d]/80 rounded-lg px-3 py-2 transition-colors">
          +
        </button>
      </div>
    </div>
  );
}

/** Tekstveld met Draft-modus, Magic Staff en Improve-menu */
function WerkbladTextField({ label, fieldKey, value, draft, onChange, onMagic, onImprove, onAcceptDraft, onEditDraft, onRejectDraft, placeholder, multiline = true, magicResult }) {
  const hasDraft = draft !== null && draft !== undefined;
  const [improveOpen, setImproveOpen] = useState(false);
  const IMPROVE_PRESETS = [
    { key: "inspirerender", icon: "✨", label: "Inspirerender"    },
    { key: "mckinsey",      icon: "📊", label: "McKinsey-stijl"  },
    { key: "beknopter",     icon: "✂️", label: "Beknopter"       },
    { key: "financieel",    icon: "💶", label: "Focus Financieel" },
  ];

  return (
    <div className="space-y-1.5">
      {/* Label + knoppen */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
        <div className="flex items-center gap-1.5">
          {/* Improve dropdown — alleen als er tekst is */}
          {value && onImprove && (
            <div className="relative">
              <button onClick={() => setImproveOpen(o => !o)}
                className="text-[9px] font-bold text-slate-400 hover:text-[#1a365d] px-2 py-0.5 rounded border border-slate-200 hover:border-[#1a365d]/40 transition-colors flex items-center gap-1"
                title="Tekst verbeteren">
                <span>✨</span> Improve
              </button>
              {improveOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setImproveOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[160px]">
                    {IMPROVE_PRESETS.map(p => (
                      <button key={p.key} onClick={() => { onImprove(p.key); setImproveOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-slate-50 text-slate-600 flex items-center gap-2">
                        <span>{p.icon}</span>{p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* Magic Staff */}
          {onMagic && <WandButton onClick={onMagic} loading={magicResult?.loading} />}
        </div>
      </div>

      {/* Tekstveld */}
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `${label}…`}
          rows={3}
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-[#1a365d]/40 placeholder:text-slate-300 leading-relaxed"
        />
      ) : (
        <input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `${label}…`}
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1a365d]/40 placeholder:text-slate-300"
        />
      )}

      {/* Magic Staff result */}
      {magicResult && <MagicResult result={magicResult} onAccept={() => { onChange(magicResult.suggestion); onRejectDraft && onRejectDraft(); }} onReject={() => onRejectDraft && onRejectDraft()} />}

      {/* Draft overlay */}
      {hasDraft && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
              <span>✨</span> AI Voorstel — Concept
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onAcceptDraft}
                className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                <span>✓</span> Accepteren
              </button>
              <button onClick={onEditDraft}
                className="text-[9px] font-bold text-[#1a365d] hover:text-[#1a365d]/70 flex items-center gap-1">
                <span>✏️</span> Bewerken
              </button>
              <button onClick={onRejectDraft}
                className="text-[9px] font-bold text-slate-500 hover:text-red-500 flex items-center gap-1">
                <span>✕</span> Negeren
              </button>
            </div>
          </div>
          <p className="px-3 py-2.5 text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{draft}</p>
        </div>
      )}
    </div>
  );
}

export default function StrategieWerkblad({ canvasId, onClose, onManualSaved }) {
  const { t } = useLang();
  const [mounted, setMounted]   = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // Data state
  const [core, setCore]         = useState({ missie: "", visie: "", ambitie: "", kernwaarden: [] });
  const [items, setItems]       = useState([]);   // analysis_items
  const [themas, setThemas]     = useState([]);   // strategic_themes incl. ksf_kpi

  // Draft state (fieldKey → string)
  const [drafts, setDrafts]     = useState({});

  // Magic Staff state
  const [magic, setMagic]       = useState({});
  const [autoDraftRunning, setAutoDraftRunning] = useState(false);
  const [autoDraftOpen, setAutoDraftOpen]       = useState(false);

  // Executie Magic state
  const [themaDraft, setThemaDraft]     = useState(null); // { loading, loadingMsg, lines }
  const [ksfKpiDrafts, setKsfKpiDrafts] = useState({});   // { [themaId]: { loading, loadingMsg, ksf, kpi } }

  const debounceRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load data from DB
  useEffect(() => {
    if (!canvasId) { setIsLoaded(true); return; }
    Promise.all([
      loadStrategyCore(canvasId),
      loadAnalysisItems(canvasId),
      loadStrategicThemes(canvasId),
    ]).then(([{ data: coreData }, { data: itemsData }, { data: themasData }]) => {
      if (coreData) setCore({ missie: coreData.missie || "", visie: coreData.visie || "", ambitie: coreData.ambitie || "", kernwaarden: coreData.kernwaarden || [] });
      if (itemsData) setItems(itemsData);
      if (themasData) setThemas(themasData);
      setIsLoaded(true);
    });
  }, [canvasId]);

  // Debounced autosave van strategy_core
  useEffect(() => {
    if (!isLoaded || !canvasId) return;
    clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      const { error } = await upsertStrategyCore(canvasId, core);
      setSaveStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setSaveStatus("idle"), 2500);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [core, isLoaded, canvasId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core field handlers ──────────────────────────────────────────────────────
  const updateCore = (field, value) => setCore(prev => ({ ...prev, [field]: value }));

  // ── Draft handlers ───────────────────────────────────────────────────────────
  const setDraftFor  = (key, text) => setDrafts(prev => ({ ...prev, [key]: text }));
  const clearDraft   = (key) => setDrafts(prev => { const n = { ...prev }; delete n[key]; return n; });
  const acceptDraft  = (key) => { updateCore(key, drafts[key]); clearDraft(key); };
  const editDraft    = (key) => { updateCore(key, drafts[key]); clearDraft(key); };

  // ── Magic Staff ──────────────────────────────────────────────────────────────
  const setMagicFor = (key, patch) =>
    setMagic(prev => ({ ...prev, [key]: patch === null ? undefined : { ...(prev[key] || {}), ...patch } }));

  const FIELD_QUERIES = {
    missie:    "mission statement missie purpose why we exist organizational purpose reason for being",
    visie:     "vision statement visie future ambition long-term goal where we want to be",
    ambitie:   "ambition strategic ambition BHAG aspirations growth targets what we strive for",
    kernwaarden: "core values kernwaarden principles culture beliefs guiding principles what we stand for",
    extern:    "external developments trends marktomgeving macro-economisch sector trends opportunities threats",
    intern:    "internal strengths weaknesses capabilities resources internal developments organizational",
    themas:    "strategic themes priorities strategic pillars focus areas key initiatives transformation themes",
  };

  const callWerkbladMagic = async (fieldKey, isArray = false) => {
    if (!canvasId) { setMagicFor(fieldKey, { error: "Sla het canvas eerst op." }); return; }
    const isHeavy = ["extern","intern","themas"].includes(fieldKey);
    const matchCount = isHeavy ? 30 : 12;
    setMagicFor(fieldKey, { loading: true, suggestion: null, error: null });
    try {
      const query = FIELD_QUERIES[fieldKey] || fieldKey;
      const embRes = await fetch("/api/embed", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ texts: [query] }) });
      if (!embRes.ok) throw new Error("Embedding mislukt");
      const { embeddings } = await embRes.json();
      const { data: chunks, error: searchErr } = await searchDocumentChunks(embeddings[0], canvasId, matchCount);
      if (searchErr) console.warn("[werkblad magic] RPC fout:", searchErr);
      if (!chunks || chunks.length === 0) {
        setMagicFor(fieldKey, { loading: false, noChunks: true, suggestion: null });
        return;
      }
      const citations = [...new Set(chunks.map(c => c.file_name).filter(Boolean))];
      const magicRes = await fetch("/api/magic", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ field: fieldKey, chunks, isArray, heavy: isHeavy, languageInstruction: t("ai.language") }),
      });
      const magicData = await magicRes.json();
      if (!magicRes.ok) throw new Error(magicData.error || "AI fout");
      const suggestion = magicData.suggestion || "";
      const isNoInfo = suggestion.toLowerCase().includes("geen relevante informatie") || suggestion.toLowerCase().includes("onvoldoende");
      setMagicFor(fieldKey, { loading: false, suggestion, citations, isNoInfo });
      if (!isNoInfo) setDraftFor(fieldKey, suggestion);
    } catch (err) {
      setMagicFor(fieldKey, { loading: false, error: err.message });
    }
  };

  // ── Improve ──────────────────────────────────────────────────────────────────
  const callImprove = async (fieldKey, text, preset) => {
    if (!text) return;
    setMagicFor(fieldKey, { loading: true });
    try {
      const res = await fetch("/api/improve", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text, preset, field: fieldKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Improve mislukt");
      setDraftFor(fieldKey, data.suggestion);
      setMagicFor(fieldKey, { loading: false, suggestion: null });
    } catch (err) {
      setMagicFor(fieldKey, { loading: false, error: err.message });
    }
  };

  // ── Full Draft ───────────────────────────────────────────────────────────────
  const handleFullDraft = async () => {
    setAutoDraftOpen(false);
    setAutoDraftRunning(true);
    const fields = ["missie","visie","ambitie","kernwaarden","extern","intern"];
    for (let i = 0; i < fields.length; i++) {
      await callWerkbladMagic(fields[i], ["kernwaarden"].includes(fields[i]));
      if (i < fields.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    setAutoDraftRunning(false);
  };

  // ── Analysis item handlers ────────────────────────────────────────────────────
  const addAnalysisItem = useCallback(async (type, content) => {
    const newItem = { canvas_id: canvasId, type, content, tag: "niet_relevant", sort_order: items.filter(i => i.type === type).length };
    const { data } = await upsertAnalysisItem(newItem);
    if (data) setItems(prev => [...prev, data]);
  }, [canvasId, items]);

  const removeAnalysisItem = useCallback(async (id) => {
    await deleteAnalysisItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const changeAnalysisTag = useCallback(async (id, tag) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, tag } : i));
    await upsertAnalysisItem({ id, tag });
  }, []);

  // ── Thema handlers ────────────────────────────────────────────────────────────
  const addThema = useCallback(async () => {
    if (themas.length >= 7) return;
    const { data } = await upsertStrategicTheme({ canvas_id: canvasId, title: "", sort_order: themas.length });
    if (data) setThemas(prev => [...prev, { ...data, ksf_kpi: [] }]);
  }, [canvasId, themas.length]);

  const removeThema = useCallback(async (id) => {
    await deleteStrategicTheme(id);
    setThemas(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateThemaTitle = useCallback(async (id, title) => {
    setThemas(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertStrategicTheme({ id, title }), 500);
  }, []);

  const addKsfKpi = useCallback(async (themaId, type, initialData = {}) => {
    const thema = themas.find(t => t.id === themaId);
    const existing = (thema?.ksf_kpi || []).filter(k => k.type === type);
    if (existing.length >= 3) return null;
    const { data } = await upsertKsfKpi({
      theme_id: themaId, type,
      description:   initialData.description   || "",
      current_value: initialData.current_value || "",
      target_value:  initialData.target_value  || "",
      sort_order: existing.length,
    });
    if (data) setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: [...(t.ksf_kpi||[]), data] } : t));
    return data;
  }, [themas]);

  const updateKsfKpiItem = useCallback(async (themaId, item) => {
    setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: t.ksf_kpi.map(k => k.id === item.id ? item : k) } : t));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertKsfKpi(item), 500);
  }, []);

  const removeKsfKpi = useCallback(async (themaId, id) => {
    await deleteKsfKpi(id);
    setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: t.ksf_kpi.filter(k => k.id !== id) } : t));
  }, []);

  // ── Executie Magic handlers ───────────────────────────────────────────────────
  const THEME_LOADING_MSGS = [
    "Bezig met het vertalen van dromen naar spreadsheets…",
    "De raad van bestuur simuleren voor kritische feedback…",
    "Zeven thema's destilleren uit de strategische ruis…",
    "Strategische ambities omzetten naar werkbare richting…",
    "Coherente koerslijnen uitstippelen voor de komende 3-5 jaar…",
  ];

  const generateThemas = async () => {
    const loadingMsg = THEME_LOADING_MSGS[Math.floor(Math.random() * THEME_LOADING_MSGS.length)];
    setThemaDraft({ loading: true, loadingMsg, lines: [] });
    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "themes", core, items, languageInstruction: t("ai.language") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fout");
      setThemaDraft({ loading: false, loadingMsg, lines: data.themes || [] });
    } catch (err) {
      setThemaDraft({ loading: false, loadingMsg, lines: [], error: err.message });
    }
  };

  const acceptThemaDraftLine = useCallback(async (line) => {
    if (themas.length >= 7) return;
    const { data } = await upsertStrategicTheme({ canvas_id: canvasId, title: line, sort_order: themas.length });
    if (data) setThemas(prev => [...prev, { ...data, ksf_kpi: [] }]);
    setThemaDraft(prev => ({ ...prev, lines: prev.lines.filter(l => l !== line) }));
  }, [canvasId, themas.length]);

  const acceptAllThemaDraft = useCallback(async () => {
    const toAdd = (themaDraft?.lines || []).slice(0, 7 - themas.length);
    for (const line of toAdd) {
      const { data } = await upsertStrategicTheme({ canvas_id: canvasId, title: line, sort_order: themas.length });
      if (data) setThemas(prev => [...prev, { ...data, ksf_kpi: [] }]);
    }
    setThemaDraft(null);
  }, [canvasId, themaDraft, themas.length]);

  const generateKsfKpiForThema = useCallback(async (themaId) => {
    const thema = themas.find(t => t.id === themaId);
    if (!thema?.title?.trim()) return;
    const loadingMsg = KSF_KPI_LOADING_MSGS[Math.floor(Math.random() * KSF_KPI_LOADING_MSGS.length)];
    setKsfKpiDrafts(prev => ({ ...prev, [themaId]: { loading: true, loadingMsg } }));
    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ksf_kpi", thema: thema.title, core, items, languageInstruction: t("ai.language") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fout");
      setKsfKpiDrafts(prev => ({ ...prev, [themaId]: { loading: false, loadingMsg, ksf: data.ksf || [], kpi: data.kpi || [] } }));
    } catch (err) {
      setKsfKpiDrafts(prev => ({ ...prev, [themaId]: { loading: false, loadingMsg, error: err.message } }));
    }
  }, [themas, core, items, t]);

  const acceptKsfKpiDraft = useCallback(async (themaId) => {
    const draft = ksfKpiDrafts[themaId];
    if (!draft) return;
    const thema = themas.find(t => t.id === themaId);
    const existingKsf = (thema?.ksf_kpi || []).filter(k => k.type === "ksf");
    const existingKpi = (thema?.ksf_kpi || []).filter(k => k.type === "kpi");
    for (const ksf of (draft.ksf || []).slice(0, 3 - existingKsf.length)) {
      await addKsfKpi(themaId, "ksf", ksf);
    }
    for (const kpi of (draft.kpi || []).slice(0, 3 - existingKpi.length)) {
      await addKsfKpi(themaId, "kpi", kpi);
    }
    setKsfKpiDrafts(prev => { const n = { ...prev }; delete n[themaId]; return n; });
  }, [ksfKpiDrafts, themas, addKsfKpi]);

  const rejectKsfKpiDraft = useCallback((themaId) => {
    setKsfKpiDrafts(prev => { const n = { ...prev }; delete n[themaId]; return n; });
  }, []);

  // ── Memoized per-thema handlers ──────────────────────────────────────────────
  const themaHandlers = useMemo(() =>
    themas.reduce((acc, t) => ({
      ...acc,
      [t.id]: {
        onTitleChange: (title) => updateThemaTitle(t.id, title),
        onDelete:      ()      => removeThema(t.id),
        onAddKsfKpi:   (type)  => addKsfKpi(t.id, type),
        onUpdateKsfKpi:(item)  => updateKsfKpiItem(t.id, item),
        onDeleteKsfKpi:(id)    => removeKsfKpi(t.id, id),
        onGenerateKsfKpi: ()   => generateKsfKpiForThema(t.id),
        onAcceptKsfKpiDraft: () => acceptKsfKpiDraft(t.id),
        onRejectKsfKpiDraft: () => rejectKsfKpiDraft(t.id),
      }
    }), {}),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [themas.map(t => t.id).join(',')]
  );

  const externItems = items.filter(i => i.type === "extern");
  const internItems = items.filter(i => i.type === "intern");
  const saveLabel   = { idle: "", saving: "Opslaan…", saved: "Opgeslagen ✓", error: "Fout" }[saveStatus];
  const saveColor   = { saving: "text-slate-400", saved: "text-[#2c7a4b]", error: "text-red-500", idle: "" }[saveStatus];

  if (!isLoaded) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Wand2 size={28} className="text-[#8dc63f] animate-pulse mx-auto" />
        <p className="text-sm text-slate-500">Strategie laden…</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
      ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#1a365d] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">De Werkkamer</p>
            <h2 className="text-lg font-bold text-white leading-tight">Strategie Werkblad</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveLabel && <span className={`text-[10px] font-semibold ${saveColor}`}>{saveLabel}</span>}
          {/* Full Draft */}
          <button
            onClick={() => setAutoDraftOpen(true)}
            disabled={autoDraftRunning}
            className="flex items-center gap-2 px-4 py-2 bg-[#8dc63f] hover:bg-[#7ab535] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
            <Zap size={13} />
            {autoDraftRunning ? "Bezig…" : "Full Draft"}
          </button>
        </div>
      </div>

      {/* Full Draft bevestiging */}
      {autoDraftOpen && (
        <div className="flex-shrink-0 mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-800">🚀 Full Draft starten?</p>
            <p className="text-xs text-amber-600 mt-0.5">Vult alle velden met AI-concepten op basis van Het Dossier. Bestaande tekst wordt niet overschreven.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleFullDraft} className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-4 py-2">Start</button>
            <button onClick={() => setAutoDraftOpen(false)} className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">Annuleer</button>
          </div>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">

        {/* SECTIE 1: IDENTITEIT */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#1a365d] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1a365d]">Identiteit</h3>
            <div className="flex-1 h-px bg-[#1a365d]/15" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <WerkbladTextField
              label="Missie"
              fieldKey="missie"
              value={core.missie}
              draft={drafts.missie}
              onChange={v => updateCore("missie", v)}
              onMagic={() => callWerkbladMagic("missie")}
              onImprove={(preset) => callImprove("missie", core.missie, preset)}
              onAcceptDraft={() => acceptDraft("missie")}
              onEditDraft={() => editDraft("missie")}
              onRejectDraft={() => clearDraft("missie")}
              magicResult={magic.missie?.error || magic.missie?.noChunks ? magic.missie : undefined}
              placeholder="Waarom bestaan wij?"
            />
            <WerkbladTextField
              label="Visie"
              fieldKey="visie"
              value={core.visie}
              draft={drafts.visie}
              onChange={v => updateCore("visie", v)}
              onMagic={() => callWerkbladMagic("visie")}
              onImprove={(preset) => callImprove("visie", core.visie, preset)}
              onAcceptDraft={() => acceptDraft("visie")}
              onEditDraft={() => editDraft("visie")}
              onRejectDraft={() => clearDraft("visie")}
              magicResult={magic.visie?.error || magic.visie?.noChunks ? magic.visie : undefined}
              placeholder="Waar staan wij over 5 jaar?"
            />
            <WerkbladTextField
              label="Ambitie (BHAG)"
              fieldKey="ambitie"
              value={core.ambitie}
              draft={drafts.ambitie}
              onChange={v => updateCore("ambitie", v)}
              onMagic={() => callWerkbladMagic("ambitie")}
              onImprove={(preset) => callImprove("ambitie", core.ambitie, preset)}
              onAcceptDraft={() => acceptDraft("ambitie")}
              onEditDraft={() => editDraft("ambitie")}
              onRejectDraft={() => clearDraft("ambitie")}
              magicResult={magic.ambitie?.error || magic.ambitie?.noChunks ? magic.ambitie : undefined}
              placeholder="Onze grote, haast onmogelijke doelstelling…"
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kernwaarden</label>
                <WandButton onClick={() => callWerkbladMagic("kernwaarden", true)} loading={magic.kernwaarden?.loading} />
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[60px] bg-white border border-slate-200 rounded-lg p-2.5">
                {core.kernwaarden.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1a365d] bg-[#1a365d]/8 border border-[#1a365d]/20 rounded-full px-2.5 py-1">
                    {kw}
                    <button onClick={() => setCore(prev => ({ ...prev, kernwaarden: prev.kernwaarden.filter((_,j) => j !== i) }))}
                      className="text-[#1a365d]/40 hover:text-red-400 transition-colors"><X size={10} /></button>
                  </span>
                ))}
                <input
                  placeholder="+ Waarde…"
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      setCore(prev => ({ ...prev, kernwaarden: [...prev.kernwaarden, e.target.value.trim()] }));
                      e.target.value = "";
                    }
                  }}
                  className="text-[10px] bg-transparent border-none focus:outline-none placeholder:text-slate-300 text-slate-600 min-w-[80px]"
                />
              </div>
              {/* Draft voor kernwaarden */}
              {drafts.kernwaarden && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">✨ AI Voorstel — Concept</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const vals = drafts.kernwaarden.split("\n").map(s=>s.trim()).filter(Boolean);
                        setCore(prev => ({ ...prev, kernwaarden: [...new Set([...prev.kernwaarden, ...vals])] }));
                        clearDraft("kernwaarden");
                      }} className="text-[9px] font-bold text-emerald-700">✓ Accepteren</button>
                      <button onClick={() => clearDraft("kernwaarden")} className="text-[9px] font-bold text-slate-500">✕ Negeren</button>
                    </div>
                  </div>
                  <p className="px-3 py-2 text-xs text-amber-900 whitespace-pre-wrap">{drafts.kernwaarden}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTIE 2: ANALYSE */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00AEEF] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#00AEEF]">Analyse</h3>
            <div className="flex-1 h-px bg-[#00AEEF]/20" />
            <p className="text-[9px] text-slate-400 flex-shrink-0">Tag elk item voor de SWOT-rapportage</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <AnalyseSection
              title="Externe Ontwikkelingen"
              type="extern"
              items={externItems}
              onAdd={content => addAnalysisItem("extern", content)}
              onDelete={removeAnalysisItem}
              onTagChange={changeAnalysisTag}
              onMagic={() => callWerkbladMagic("extern", true)}
              magicResult={magic.extern}
              onRejectMagic={() => setMagicFor("extern", null)}
            />
            <AnalyseSection
              title="Interne Ontwikkelingen"
              type="intern"
              items={internItems}
              onAdd={content => addAnalysisItem("intern", content)}
              onDelete={removeAnalysisItem}
              onTagChange={changeAnalysisTag}
              onMagic={() => callWerkbladMagic("intern", true)}
              magicResult={magic.intern}
              onRejectMagic={() => setMagicFor("intern", null)}
            />
          </div>
        </section>

        {/* SECTIE 3: EXECUTIE 7-3-3 */}
        <section className="space-y-5 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#8dc63f] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#2c7a4b]">Executie — 7·3·3 Regel</h3>
            <div className="flex-1 h-px bg-[#8dc63f]/30" />
            <p className="text-[9px] text-slate-400 flex-shrink-0">{themas.length}/7 thema's</p>
            {themas.length < 7 && (
              <button
                onClick={generateThemas}
                disabled={themaDraft?.loading}
                className="flex items-center gap-1.5 text-[9px] font-bold text-[#8dc63f] hover:text-[#2c7a4b] border border-[#8dc63f]/40 hover:border-[#2c7a4b]/60 rounded-md px-2.5 py-1 transition-colors disabled:opacity-50 flex-shrink-0">
                <Wand2 size={10} />
                {themaDraft?.loading ? "Genereren…" : "Genereer Thema's"}
              </button>
            )}
          </div>

          {/* Thema draft panel */}
          {themaDraft && (
            <div className="border border-amber-300 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-amber-50 px-3 py-2 border-b border-amber-200">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                  {themaDraft.loading
                    ? `🪄 ${themaDraft.loadingMsg}`
                    : `🪄 ${themaDraft.lines.length} thema's voorgesteld — review en selecteer`}
                </span>
                {!themaDraft.loading && (
                  <div className="flex gap-2">
                    <button onClick={acceptAllThemaDraft}
                      disabled={themas.length >= 7}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5 transition-colors disabled:opacity-40">
                      Alle toevoegen
                    </button>
                    <button onClick={() => setThemaDraft(null)}
                      className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5 transition-colors">
                      Weggooien
                    </button>
                  </div>
                )}
              </div>
              {themaDraft.loading && (
                <div className="px-4 py-3 text-[10px] text-amber-700 animate-pulse">{themaDraft.loadingMsg}</div>
              )}
              {!themaDraft.loading && themaDraft.error && (
                <div className="px-4 py-3 text-[10px] text-red-600">{themaDraft.error}</div>
              )}
              {!themaDraft.loading && (themaDraft.lines || []).map((line, i) => (
                <div key={i} className="group flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-amber-50/30 border-b border-amber-100 last:border-0 transition-colors">
                  <span className="text-[9px] font-black text-[#8dc63f]/70 w-4 flex-shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm font-semibold text-slate-700">{line}</p>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => acceptThemaDraftLine(line)}
                      disabled={themas.length >= 7}
                      className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded px-2 py-0.5 transition-colors disabled:opacity-40">
                      ✓ Toevoegen
                    </button>
                    <button
                      onClick={() => setThemaDraft(prev => ({ ...prev, lines: prev.lines.filter((_, j) => j !== i) }))}
                      className="text-[10px] text-slate-400 hover:text-red-400 bg-slate-50 hover:bg-red-50 rounded px-2 py-0.5 transition-colors">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {themas.map((thema, i) => {
              const handlers = themaHandlers[thema.id] || {};
              return (
                <ThemaAccordeon
                  key={thema.id}
                  thema={thema}
                  index={i}
                  onTitleChange={handlers.onTitleChange || (title => updateThemaTitle(thema.id, title))}
                  onDelete={handlers.onDelete || (() => removeThema(thema.id))}
                  onAddKsfKpi={handlers.onAddKsfKpi || (type => addKsfKpi(thema.id, type))}
                  onUpdateKsfKpi={handlers.onUpdateKsfKpi || (item => updateKsfKpiItem(thema.id, item))}
                  onDeleteKsfKpi={handlers.onDeleteKsfKpi || (id => removeKsfKpi(thema.id, id))}
                  onGenerateKsfKpi={handlers.onGenerateKsfKpi || (() => generateKsfKpiForThema(thema.id))}
                  ksfKpiDraft={ksfKpiDrafts[thema.id]}
                  onAcceptKsfKpiDraft={handlers.onAcceptKsfKpiDraft || (() => acceptKsfKpiDraft(thema.id))}
                  onRejectKsfKpiDraft={handlers.onRejectKsfKpiDraft || (() => rejectKsfKpiDraft(thema.id))}
                />
              );
            })}
            {themas.length < 7 && (
              <button onClick={addThema}
                className="w-full border-2 border-dashed border-slate-200 hover:border-[#8dc63f]/50 rounded-lg py-3 text-xs font-semibold text-slate-400 hover:text-[#2c7a4b] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} />
                Strategisch Thema handmatig toevoegen {themas.length > 0 ? `(${themas.length}/7)` : ""}
              </button>
            )}
            {themas.length === 0 && !themaDraft && (
              <p className="text-center text-xs text-slate-300 italic py-4">
                Gebruik 🪄 Genereer Thema's of voeg een thema handmatig toe
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
