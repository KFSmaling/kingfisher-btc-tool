import React, { useState } from "react";
import { LangProvider, useLang } from "./i18n";
import {
  Zap, X, LogOut, Save, AlertOctagon,
  SlidersHorizontal, Database, ShieldCheck, Maximize2,
} from "lucide-react";
import { AuthProvider, useAuth } from "./services/authContext";
import LoginScreen from "./LoginScreen";

// Canvas feature
import BlockCard, { BLOCKS, getBlockStatus } from "./features/canvas/components/BlockCard";
import BlockPanel from "./features/canvas/components/BlockPanel";
import TipsModal from "./features/canvas/components/TipsModal";
import ConsistencyModal from "./features/canvas/components/ConsistencyModal";
import CanvasMenu from "./features/canvas/components/CanvasMenu";
import ProjectInfoSidebar from "./features/canvas/components/ProjectInfoSidebar";
import StrategyStatusBlock from "./features/canvas/components/StrategyStatusBlock";
import DeepDiveOverlay from "./features/canvas/components/DeepDiveOverlay";
import { useCanvasState } from "./features/canvas/hooks/useCanvasState";

// Dossier feature
import MasterImporterPanel from "./features/dossier/components/MasterImporterPanel";

// ── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { t, lang, setLang } = useLang();
  const { user, signOut }    = useAuth();

  // ── UI-only state (panels, modals — geen business logic) ──────────────────
  const [activeBlockId,   setActiveBlockId]   = useState(null);
  const [deepDiveBlockId, setDeepDiveBlockId] = useState(null);
  const [showConsistency, setShowConsistency] = useState(false);
  const [showTips,        setShowTips]        = useState(false);
  const [showImporter,    setShowImporter]    = useState(false);
  const [tipsSection,     setTipsSection]     = useState("algemeen");
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  // ── Canvas state + handlers (business logic in hook) ──────────────────────
  const {
    activeCanvasId, canvases, scope, meta, docs, insights, bullets,
    strategyManual, saveStatus, multiTabWarning,
    setMeta, setMultiTabWarning, setStrategyManual,
    handleNewCanvas, handleSelectCanvas, handleRenameCanvas, handleDeleteCanvas,
    handleLoadExample, handleDocsChange, handleInsightAccept, handleInsightReject,
    handleMoveToBullets, handleDeleteBullet, handleAddBullet,
  } = useCanvasState({
    user,
    lang,
    onCanvasSwitch: () => {
      setActiveBlockId(null);
      setDeepDiveBlockId(null);
    },
  });

  const activeBlock = BLOCKS.find(b => b.id === activeBlockId);
  const allDone     = BLOCKS.every(b => (bullets[b.id] || []).length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans flex flex-col">

      {/* Header */}
      <header className="h-20 bg-[#1a365d] flex items-center justify-between z-20 border-b-2 border-[#8dc63f] shrink-0 shadow-lg">

        {/* Left: logo + app title */}
        <div className="flex items-center h-full shrink-0">
          <div className="px-6 flex items-center justify-center h-full shrink-0 border-r border-white/10">
            <img
              src="/kf-logo-white.png"
              alt="Kingfisher & Partners"
              className="h-10 w-auto object-contain object-center"
              onError={e => { e.target.src = "/kf-logo.png"; }}
            />
          </div>
          <div className="px-6 border-r border-white/10 h-full flex flex-col justify-center">
            <h1 className="text-[15px] font-bold tracking-[0.14em] uppercase text-white leading-none">
              Business Transformation Canvas
            </h1>
            <p className="text-[10px] tracking-[0.12em] text-[#8dc63f] mt-1.5 uppercase font-semibold">
              From strategy to execution
            </p>
          </div>
        </div>

        {/* Centre: canvas selector */}
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

        {/* Right: autosave + lang + dossier + tips + consistency + sidebar + logout */}
        <div className="flex items-center gap-3 px-6 shrink-0">

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

          <button
            onClick={() => setShowInfoSidebar(s => !s)}
            className={`flex items-center gap-1.5 transition-colors ml-1 ${showInfoSidebar ? "text-[#8dc63f]" : "text-white/40 hover:text-white"}`}
            title="Project details"
          >
            <SlidersHorizontal size={15} />
          </button>

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

            {/* Row 2: Guiding Principles — full width */}
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

            {/* Row 3: 4 Pillars — equal quarters */}
            {BLOCKS.filter(b =>
              ["customers", "processes", "people", "technology"].includes(b.id)
            ).map(block => (
              <BlockCard
                key={block.id}
                block={block}
                status={getBlockStatus(block.id, docs, insights, bullets)}
                bullets={bullets[block.id]}
                insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
                onClick={() => setDeepDiveBlockId(block.id)}
              />
            ))}

            {/* Row 4: Portfolio Roadmap — full width */}
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
                { label: "Empty",            color: "bg-slate-200"  },
                { label: "Uploaded",         color: "bg-[#00AEEF]"  },
                { label: "Insights pending", color: "bg-orange-400" },
                { label: "Done",             color: "bg-green-500"  },
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
      </div>

      {/* Sliding block panel */}
      {activeBlockId && (
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
      )}

      {/* Consistency modal */}
      {showConsistency && (
        <ConsistencyModal bullets={bullets} onClose={() => setShowConsistency(false)} />
      )}

      {/* Tips modal */}
      {showTips && (
        <TipsModal initialSection={tipsSection} onClose={() => setShowTips(false)} />
      )}

      {/* Master Importer (Het Dossier) */}
      {showImporter && (
        <MasterImporterPanel
          canvasId={activeCanvasId}
          userId={user?.id}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Deep Dive Overlay — werkblad per blok via registry */}
      {deepDiveBlockId && (
        <DeepDiveOverlay
          blockId={deepDiveBlockId}
          canvasId={activeCanvasId}
          onClose={() => setDeepDiveBlockId(null)}
          onManualSaved={m => {
            if (deepDiveBlockId === "strategy") setStrategyManual(m);
          }}
        />
      )}
    </div>
  );
}

// ── Auth-guard wrapper ────────────────────────────────────────────────────────
function AuthGate() {
  const { session } = useAuth();

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#1a365d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8dc63f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;
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
