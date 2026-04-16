import React, { useState, useRef, useEffect, Suspense } from "react";
import { LangProvider, useLang } from "./i18n";
import {
  Zap, X, LogOut, Save, AlertOctagon,
  SlidersHorizontal, Database, ShieldCheck, Maximize2
} from "lucide-react";
import { loadUserCanvases, createCanvas, upsertCanvas, loadCanvasById, deleteCanvas } from "./services/canvasStorage";
import { AuthProvider, useAuth } from "./services/authContext";
import LoginScreen from "./LoginScreen";

// Canvas feature
import BlockCard, { BLOCKS, EXAMPLE_BULLETS, getBlockStatus } from "./features/canvas/components/BlockCard";
import BlockPanel from "./features/canvas/components/BlockPanel";
import TipsModal from "./features/canvas/components/TipsModal";
import ConsistencyModal from "./features/canvas/components/ConsistencyModal";
import CanvasMenu from "./features/canvas/components/CanvasMenu";
import ProjectInfoSidebar from "./features/canvas/components/ProjectInfoSidebar";
import StrategyStatusBlock from "./features/canvas/components/StrategyStatusBlock";

// Dossier feature
import MasterImporterPanel from "./features/dossier/components/MasterImporterPanel";

// Strategie feature — lazy loaded
const StrategieWerkblad = React.lazy(() => import('./features/strategie/StrategieWerkblad'));

function DeepDiveOverlay({ blockId, canvasId, onClose, onManualSaved }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Strategy: volledig nieuwe Werkblad (lazy loaded — Sprint 4C)
  if (blockId === "strategy") {
    return (
      <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#8dc63f] border-t-transparent animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Werkblad laden…</p>
            </div>
          </div>
        }>
          <StrategieWerkblad canvasId={canvasId} onClose={onClose} onManualSaved={onManualSaved} />
        </Suspense>
      </div>
    );
  }

  // Overige blokken: generieke placeholder
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
      <div className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
        ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.99]"}`}>
        <div className="flex items-center gap-3 px-8 py-4 bg-[#1a365d] flex-shrink-0">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <h2 className="text-lg font-bold text-white capitalize">{blockId}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Verdieping voor dit blok komt in een volgende sprint.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { t, lang, setLang } = useLang();
  const { user, signOut }    = useAuth();

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [deepDiveBlockId, setDeepDiveBlockId] = useState(null);
  const [showConsistency, setShowConsistency] = useState(null);
  const [showTips, setShowTips]   = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [tipsSection, setTipsSection] = useState("algemeen");

  // Canvas identiteit
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [scope, setScope]       = useState("");

  // Project metadata
  const [meta, setMeta] = useState({});
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  // Per-block state
  const [docs, setDocs]         = useState({});
  const [insights, setInsights] = useState({});
  const [bullets, setBullets]   = useState({});

  // Deep Dive manual data (per blok) — geladen vanuit canvases.data
  const [strategyManual, setStrategyManual] = useState(null);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  // Multi-tab waarschuwing
  const [multiTabWarning, setMultiTabWarning] = useState(false);

  // Ref om autosave te onderdrukken tijdens canvas-laden
  const suppressSaveRef  = useRef(false);
  const autosaveTimerRef = useRef(null);

  const activeBlock = BLOCKS.find(b => b.id === activeBlockId);

  // ── Laad canvassen bij inloggen ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const today = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });

    loadUserCanvases(user.id).then(async ({ data, error }) => {
      if (error) {
        console.error("[init] Canvassen laden mislukt:", error.code, error.message);
        return;
      }

      console.log("[init] canvassen geladen:", data?.length, data);

      if (data && data.length > 0) {
        setCanvases(data);
        const latest = data[0];
        const { data: full, error: loadErr } = await loadCanvasById(latest.id);
        console.log("[init] canvas laden:", full, loadErr);
        if (full) {
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
          setTimeout(() => { suppressSaveRef.current = false; }, 100);
          // Load Deep Dive manual data
          const sm = full.data?.strategy?.details?.manual;
          if (sm) setStrategyManual(sm);
        }
      } else {
        // Geen canvassen — maak direct een nieuw canvas aan
        const name = `Canvas ${today}`;
        const { data: created, error: createErr } = await createCanvas({ userId: user.id, name, language: lang });
        console.log("[init] nieuw canvas:", created, createErr);
        if (created) {
          setCanvases([created]);
          setActiveCanvasId(created.id);
          setScope(created.name || name);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Autosave (500ms debounce, last-write-wins) ───────────────────────────
  useEffect(() => {
    if (!activeCanvasId) { console.log("[autosave] skip: geen activeCanvasId"); return; }
    if (!user)           { console.log("[autosave] skip: geen user"); return; }
    if (suppressSaveRef.current) { console.log("[autosave] skip: suppress actief"); return; }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const { error } = await upsertCanvas(activeCanvasId, { scope, docs, insights, bullets, language: lang, meta });
      if (!error) {
        setSaveStatus("saved");
        setCanvases(prev => prev.map(c =>
          c.id === activeCanvasId ? { ...c, name: scope } : c
        ));
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(autosaveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, docs, insights, bullets, meta, activeCanvasId]);

  // ── Multi-tab detectie ───────────────────────────────────────────────────
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

  // ── Canvas handlers ──────────────────────────────────────────────────────
  const handleNewCanvas = async () => {
    const today = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
    const name  = `Canvas ${today}`;
    const { data, error } = await createCanvas({ userId: user.id, name, language: lang });
    if (!error && data) {
      setCanvases(prev => [data, ...prev]);
      suppressSaveRef.current = true;
      setActiveCanvasId(data.id);
      setScope(data.name);
      setDocs({}); setInsights({}); setBullets({});
      setActiveBlockId(null);
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  };

  const handleSelectCanvas = async (canvasRecord) => {
    const { data: full } = await loadCanvasById(canvasRecord.id);
    if (full) {
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
      });
      setActiveBlockId(null);
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  };

  const handleRenameCanvas = (newName) => {
    setScope(newName);
    // Autosave pikt de gewijzigde scope op via het debounce-effect
  };

  const handleDeleteCanvas = async (canvasId) => {
    const { error } = await deleteCanvas(canvasId);
    if (error) { console.error("[delete] canvas verwijderen mislukt:", error.message); return; }
    const remaining = canvases.filter(c => c.id !== canvasId);
    setCanvases(remaining);
    // Als het actieve canvas verwijderd wordt: schakel over naar het eerste resterende
    if (activeCanvasId === canvasId) {
      if (remaining.length > 0) {
        const { data: full } = await loadCanvasById(remaining[0].id);
        if (full) {
          suppressSaveRef.current = true;
          setActiveCanvasId(full.id);
          setScope(full.name || "");
          setDocs(full.blocks?.docs || {});
          setInsights(full.blocks?.insights || {});
          setBullets(full.blocks?.bullets || {});
          setTimeout(() => { suppressSaveRef.current = false; }, 100);
        }
      } else {
        // Geen canvassen meer over — maak nieuw leeg canvas
        setActiveCanvasId(null);
        setScope("");
        setDocs({}); setInsights({}); setBullets({});
      }
    }
  };

  const handleLoadExample = () => {
    suppressSaveRef.current = true;
    setBullets(EXAMPLE_BULLETS);
    setScope("Company Example — BTP 2024");
    setDocs({});
    setInsights({});
    setActiveBlockId(null);
    // Voorbeeld laadt in huidig canvas (wordt 500ms later opgeslagen)
    setTimeout(() => { suppressSaveRef.current = false; }, 100);
  };

  // Handlers passed to panel
  const handleDocsChange = (blockId, filename, newInsights) => {
    setDocs(p => ({ ...p, [blockId]: [...(p[blockId] || []), filename] }));
    setInsights(p => ({ ...p, [blockId]: [...(p[blockId] || []), ...newInsights] }));
  };

  const handleInsightAccept = (blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].map(i => i.id === insightId ? { ...i, status: "accepted" } : i),
    }));
  };

  const handleInsightReject = (blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].filter(i => i.id !== insightId),
    }));
  };

  const handleMoveToBullets = (blockId, insight, editIdx = null, isEdit = false) => {
    const block = BLOCKS.find(b => b.id === blockId);
    const bulletObj = {
      text: insight.text,
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
        [blockId]: [...(p[blockId] || []).filter(b => (typeof b === "string" ? b : b.text) !== insight.text), bulletObj],
      }));
      if (!isEdit) {
        setInsights(p => ({
          ...p,
          [blockId]: (p[blockId] || []).filter(i => i.id !== insight.id),
        }));
      }
    }
  };

  const handleDeleteBullet = (blockId, idx) => {
    setBullets(p => ({ ...p, [blockId]: p[blockId].filter((_, i) => i !== idx) }));
  };

  const handleAddBullet = (blockId, text, subtab = null) => {
    setBullets(p => ({ ...p, [blockId]: [...(p[blockId] || []), { text, source: null, subtab }] }));
  };

  const allDone = BLOCKS.every(b => (bullets[b.id] || []).length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans flex flex-col">

      {/* Header */}
      <header className="h-20 bg-[#1a365d] flex items-center justify-between z-20 border-b-2 border-[#8dc63f] shrink-0 shadow-lg">

        {/* Left: logo + app title */}
        <div className="flex items-center h-full shrink-0">
          <div className="px-6 flex items-center justify-center h-full shrink-0 border-r border-white/10">
            <img src="/kf-logo-white.png" alt="Kingfisher & Partners" className="h-10 w-auto object-contain object-center"
              onError={e => { e.target.src = "/kf-logo.png"; }}
            />
          </div>
          <div className="px-6 border-r border-white/10 h-full flex flex-col justify-center">
            <h1 className="text-[15px] font-bold tracking-[0.14em] uppercase text-white leading-none">Business Transformation Canvas</h1>
            <p className="text-[10px] tracking-[0.12em] text-[#8dc63f] mt-1.5 uppercase font-semibold">From strategy to execution</p>
          </div>
        </div>

        {/* Centre: canvas name as interactive element */}
        <div className="flex-1 flex items-center justify-center px-8">
          <CanvasMenu
            currentName={scope}
            activeCanvasId={activeCanvasId}
            canvases={canvases}
            onNew={handleNewCanvas}
            onSelect={handleSelectCanvas}
            onRename={handleRenameCanvas}
            onLoadExample={handleLoadExample}
            onDelete={handleDeleteCanvas}
          />
        </div>

        {/* Right: autosave indicator + lang + tips + consistency + logout */}
        <div className="flex items-center gap-3 px-6 shrink-0">

          {/* Autosave indicator — klein en elegant */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-white/50 font-medium">
              <Save size={10} className="animate-pulse" /> Opslaan…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[10px] text-[#8dc63f] font-medium">
              <Zap size={10} /> Opgeslagen
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
              <AlertOctagon size={10} /> Opslaan mislukt
            </span>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "nl" ? "en" : "nl")}
            className="flex items-center gap-1.5 text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title="Switch language"
          >
            <span className={lang === "nl" ? "text-white font-black" : "text-white/30"}>NL</span>
            <span className="text-white/20">|</span>
            <span className={lang === "en" ? "text-white font-black" : "text-white/30"}>EN</span>
          </button>

          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title="Het Dossier — documenten importeren"
          >
            <Database size={14} /> Dossier
          </button>

          <button
            onClick={() => { setTipsSection("algemeen"); setShowTips(true); }}
            className="flex items-center gap-2 text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title={t("tips.title")}
          >
            <Maximize2 size={14} /> {t("header.tips")}
          </button>

          <button
            onClick={() => setShowConsistency(true)}
            className="flex items-center gap-2 bg-[#8dc63f] hover:bg-[#7ab52e] text-[#1a365d] px-5 py-2.5 rounded-sm font-bold text-[10px] shadow-sm transition-all uppercase tracking-widest"
          >
            <ShieldCheck size={14} /> {t("header.consistency")}
          </button>

          {/* Project Info toggle */}
          <button
            onClick={() => setShowInfoSidebar(s => !s)}
            className={`flex items-center gap-1.5 transition-colors ml-1 ${showInfoSidebar ? "text-[#8dc63f]" : "text-white/40 hover:text-white"}`}
            title="Project details"
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Uitloggen */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors ml-1"
            title="Uitloggen"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Multi-tab waarschuwing */}
      {multiTabWarning && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 py-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <X size={14} />
            De app is al geopend in een ander tabblad. Wijzigingen in dit tabblad kunnen overschreven worden.
          </span>
          <button onClick={() => setMultiTabWarning(false)} className="text-amber-500 hover:text-amber-800 ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard + optionele sidebar */}
      <div className="flex flex-1 min-h-0">
      <main className="flex-1 p-10 overflow-auto">

        {/* Canvas grid — BTC layout (12-col) */}
        <div className="grid grid-cols-12 gap-5">

          {/* Row 1: Strategy — full width status dashboard */}
          {BLOCKS.filter(b => b.id === "strategy").map(block => (
            <StrategyStatusBlock
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              strategyManual={strategyManual}
              onClick={() => setDeepDiveBlockId(block.id)}
              onDeepDive={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 2: Guiding Principles — full width (col-span-12) */}
          {BLOCKS.filter(b => b.id === "principles").map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 3: 4 Segments — equal quarters (col-span-3 each) */}
          {BLOCKS.filter(b => ["customers", "processes", "people", "technology"].includes(b.id)).map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 4: Portfolio Roadmap — full width (col-span-12) */}
          <BlockCard
            key="portfolio"
            block={BLOCKS.find(b => b.id === "portfolio")}
            status={getBlockStatus("portfolio", docs, insights, bullets)}
            bullets={bullets["portfolio"]}
            insightCount={(insights["portfolio"] || []).filter(i => i.status === "pending").length}
            onClick={() => setDeepDiveBlockId("portfolio")}
          />
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { label: "Empty", color: "bg-slate-200" },
              { label: "Uploaded", color: "bg-[#00AEEF]" },
              { label: "Insights pending", color: "bg-orange-400" },
              { label: "Done", color: "bg-green-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
          {allDone && (
            <button
              onClick={() => setShowConsistency(true)}
              className="flex items-center gap-2 bg-[#2c7a4b] hover:bg-[#1a365d] text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest shadow-sm transition-colors"
            >
              <ShieldCheck size={14} /> {t("progress.all.done")}
            </button>
          )}
          <p className="text-[9px] text-slate-300 uppercase tracking-widest">
            Kingfisher & Partners · From strategy to execution
          </p>
        </div>
      </main>

      {/* Project Info Sidebar */}
      {showInfoSidebar && (
        <ProjectInfoSidebar meta={meta} onChange={setMeta} />
      )}

      </div>{/* end flex-1 row */}

      {/* Sliding panel */}
      {activeBlockId && (
        <>
          <BlockPanel
            block={activeBlock}
            docs={docs}
            insights={insights}
            bullets={bullets}
            canvasId={activeCanvasId}
            userId={user?.id}
            onClose={() => setActiveBlockId(null)}
            onDocsChange={handleDocsChange}
            onInsightAccept={handleInsightAccept}
            onInsightReject={handleInsightReject}
            onMoveToBullets={handleMoveToBullets}
            onDeleteBullet={handleDeleteBullet}
            onAddBullet={handleAddBullet}
            onShowTips={(blockId) => { setTipsSection(blockId); setShowTips(true); }}
          />
        </>
      )}

      {/* Consistency modal */}
      {showConsistency && (
        <ConsistencyModal bullets={bullets} onClose={() => setShowConsistency(false)} />
      )}

      {/* Tips modal */}
      {showTips && (
        <TipsModal
          initialSection={tipsSection}
          onClose={() => setShowTips(false)}
        />
      )}

      {/* Master Importer */}
      {showImporter && (
        <MasterImporterPanel
          canvasId={activeCanvasId}
          userId={user?.id}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Deep Dive Overlay */}
      {deepDiveBlockId && (
        <DeepDiveOverlay
          blockId={deepDiveBlockId}
          canvasId={activeCanvasId}
          onClose={() => setDeepDiveBlockId(null)}
          onManualSaved={m => { if (deepDiveBlockId === "strategy") setStrategyManual(m); }}
        />
      )}
    </div>
  );
}

// ── Auth-guard wrapper ────────────────────────────────────────────────────────
function AuthGate() {
  const { session } = useAuth();

  // Laden — sessie nog niet bepaald
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#1a365d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8dc63f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Niet ingelogd → toon LoginScreen
  if (!session) return <LoginScreen />;

  // Ingelogd → toon canvas app
  return <AppInner />;
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AuthGate />
      </LangProvider>
    </AuthProvider>
  );
}
