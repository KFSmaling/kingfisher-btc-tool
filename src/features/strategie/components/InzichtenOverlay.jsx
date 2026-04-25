/**
 * InzichtenOverlay — document-layout voor Inzichten (sprint B, issue #68)
 *
 * Props:
 *   insights    — array van insight-objecten of null
 *   loading     — boolean
 *   error       — string of null
 *   onClose     — () => void
 *   appLabel    — (key, fallback) => string  (doorgegeven vanuit StrategieWerkblad)
 */

import React, { useState } from "react";
import { X, Sparkles, Minus, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import InzichtItem from "./InzichtItem";

// ── Type-filter configuratie ──────────────────────────────────────────────────
const FILTER_TYPES = [
  { key: "ontbreekt", Icon: Minus,         label: "Ontbreekt", active: "bg-red-100 text-red-700 border-red-300",     inactive: "bg-white text-slate-500 border-slate-200 hover:border-slate-300" },
  { key: "zwak",      Icon: AlertTriangle, label: "Zwak punt", active: "bg-amber-100 text-amber-800 border-amber-300", inactive: "bg-white text-slate-500 border-slate-200 hover:border-slate-300" },
  { key: "kans",      Icon: TrendingUp,    label: "Kans",      active: "bg-blue-100 text-blue-700 border-blue-300",   inactive: "bg-white text-slate-500 border-slate-200 hover:border-slate-300" },
  { key: "sterk",     Icon: CheckCircle,   label: "Sterkte",   active: "bg-green-100 text-green-700 border-green-300", inactive: "bg-white text-slate-500 border-slate-200 hover:border-slate-300" },
];

// Kleur-streepje per type in TOC
const TOC_BAR_COLOR = {
  ontbreekt: "bg-red-700",
  zwak:      "bg-amber-700",
  kans:      "bg-blue-700",
  sterk:     "bg-green-700",
};

// ── TypeFilter knop ───────────────────────────────────────────────────────────
function FilterButton({ cfg, active, count, onClick }) {
  const { key, Icon, label } = cfg;
  const cls = active ? cfg.active : cfg.inactive;
  return (
    <button
      onClick={() => onClick(key)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-semibold transition-colors ${cls}`}
    >
      <Icon size={11} />
      {label}
      <span className="ml-0.5 opacity-60">({count})</span>
    </button>
  );
}

// ── TOC entry ─────────────────────────────────────────────────────────────────
function TocEntry({ insight }) {
  const barColor = TOC_BAR_COLOR[insight.type] ?? "bg-slate-400";
  return (
    <a
      href={`#insight-${insight.id}`}
      className="flex items-center gap-2 py-1 group"
    >
      <div className={`w-0.5 h-4 flex-shrink-0 rounded-full ${barColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
      <span className="truncate max-w-[160px] text-[11px] text-slate-500 group-hover:text-slate-800 transition-colors leading-tight">
        {insight.title}
      </span>
    </a>
  );
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function InzichtenOverlay({ insights, loading, error, onClose, appLabel }) {
  // Alle filters standaard actief
  const [activeFilters, setActiveFilters] = useState(
    new Set(["ontbreekt", "zwak", "kans", "sterk"])
  );

  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Minimaal 1 filter actief houden
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Gefilterde bevindingen, gesplitst per categorie
  const allInsights  = Array.isArray(insights) ? insights : [];
  const visible      = allInsights.filter(i => activeFilters.has(i.type));
  const onderdelen   = visible.filter(i => i.category === "onderdeel");
  const dwarsverb    = visible.filter(i => i.category === "dwarsverband");

  // Counts per type (over alle insights, niet alleen gefilterd — voor de teller)
  const countByType  = FILTER_TYPES.reduce((acc, { key }) => {
    acc[key] = allInsights.filter(i => i.type === key).length;
    return acc;
  }, {});

  const isEmpty = !loading && !error && allInsights.length === 0;

  return (
    <div className="fixed inset-0 z-[59] flex flex-col bg-slate-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-primary)] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[var(--color-accent)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            {appLabel("analysis.title", "Inzichten")}
            {" — "}
            {appLabel("analysis.subtitle", "Strategische Analyse")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
          aria-label="Sluiten"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Filters ── */}
      {!loading && !isEmpty && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-slate-200 flex-shrink-0 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
            {appLabel("analysis.filter.label", "Toon:")}
          </span>
          {FILTER_TYPES.map(cfg => (
            <FilterButton
              key={cfg.key}
              cfg={cfg}
              active={activeFilters.has(cfg.key)}
              count={countByType[cfg.key]}
              onClick={toggleFilter}
            />
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Sidebar TOC */}
        {!loading && !isEmpty && visible.length > 0 && (
          <aside className="w-52 flex-shrink-0 overflow-y-auto px-4 py-4 border-r border-slate-200 bg-white hidden md:block">
            {onderdelen.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {appLabel("analysis.chapter.onderdelen", "Onderdelen")}
                </p>
                {onderdelen.map(i => <TocEntry key={i.id} insight={i} />)}
              </div>
            )}
            {dwarsverb.length > 0 && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {appLabel("analysis.chapter.dwarsverbanden", "Dwarsverbanden")}
                </p>
                {dwarsverb.map(i => <TocEntry key={i.id} insight={i} />)}
              </div>
            )}
          </aside>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">

            {/* Loading */}
            {loading && (
              <p className="text-slate-400 text-sm italic animate-pulse pt-12 text-center">
                {appLabel("analysis.loading", "AI analyseert uw strategie…")}
              </p>
            )}

            {/* Error */}
            {!loading && error && (
              <p className="text-red-500 text-sm italic">{error}</p>
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-400 text-sm italic text-center max-w-sm">
                  {appLabel("analysis.empty", "Nog geen analyse. Klik 'Analyseer strategie' in het werkblad.")}
                </p>
              </div>
            )}

            {/* Geen resultaten na filteren */}
            {!loading && !isEmpty && visible.length === 0 && (
              <div className="flex items-center justify-center h-48">
                <p className="text-slate-400 text-sm italic text-center">
                  Geen bevindingen zichtbaar met de huidige filters.
                </p>
              </div>
            )}

            {/* Onderdelen */}
            {onderdelen.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200">
                  {appLabel("analysis.chapter.onderdelen", "Onderdelen")}
                  <span className="ml-2 font-normal text-slate-300">({onderdelen.length})</span>
                </h2>
                {onderdelen.map(insight => (
                  <InzichtItem key={insight.id} insight={insight} />
                ))}
              </section>
            )}

            {/* Dwarsverbanden */}
            {dwarsverb.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200">
                  {appLabel("analysis.chapter.dwarsverbanden", "Dwarsverbanden")}
                  <span className="ml-2 font-normal text-slate-300">({dwarsverb.length})</span>
                </h2>
                {dwarsverb.map(insight => (
                  <InzichtItem key={insight.id} insight={insight} />
                ))}
              </section>
            )}

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-2 text-[9px] text-slate-400 uppercase tracking-widest flex-shrink-0 bg-slate-100 border-t border-slate-200">
        AI-analyse op basis van missie, visie, SWOT en strategische thema's · opgeslagen per canvas
      </div>
    </div>
  );
}
