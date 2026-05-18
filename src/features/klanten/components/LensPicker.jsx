/**
 * LensPicker — 5 AI-lens-keuzes inline binnen PijnpuntFocusCard.
 *
 * 11.U Block 2b — RFC-007-rev2 Variant D.
 *
 * Lenses: cluster / paradox / positionering / overstijgend / algemeen.
 * Klik op een lens → trigger AI-call (loading-state) → AiResultDraft verschijnt.
 *
 * Geen heuristic-aanbeveling op MVP (Optie A uit instructie); alle 5 lenses gelijk.
 */

import React from "react";
import {
  Network, Shuffle, Compass, TrendingUp, Sparkles, Loader2, X,
} from "lucide-react";

const LENSES = [
  { key: "cluster",       icon: Network },
  { key: "paradox",       icon: Shuffle },
  { key: "positionering", icon: Compass },
  { key: "overstijgend",  icon: TrendingUp },
  { key: "algemeen",      icon: Sparkles },
];

export default function LensPicker({
  loading,        // { phase: 'collecting'|'ai_running' } | null
  recommendedLens, // 11.U Block 3 F-retro-1: PAST-pill op aanbevolen lens
  onPickLens,
  onCancel,
  appLabel,
}) {
  const lbl = (key, fb) => (appLabel ? appLabel(key, fb) : fb);

  if (loading) {
    const phaseKey = loading.phase === "collecting"
      ? "klanten.verbeteracties.loading.collecting"
      : "klanten.verbeteracties.loading.ai_running";
    const phaseFb = loading.phase === "collecting"
      ? "Inputs verzamelen…"
      : "AI analyseert je pijnpunt… (dit duurt 20-40 seconden)";
    return (
      <div
        className="flex items-center justify-center gap-3 px-4 py-8 bg-slate-50 border border-slate-200 rounded-lg"
        data-testid="doorloop-lens-loading"
      >
        <Loader2 size={20} className="animate-spin text-[var(--color-accent)]" />
        <span className="text-sm text-slate-700">{lbl(phaseKey, phaseFb)}</span>
      </div>
    );
  }

  return (
    <div
      className="bg-slate-50 border border-slate-200 rounded-lg p-4"
      data-testid="doorloop-lens-picker"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {lbl("klanten.verbeteracties.lens.picker.titel", "Kies een AI-lens")}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          data-testid="doorloop-lens-cancel"
          aria-label={lbl("klanten.verbeteracties.lens.picker.annuleer", "Annuleren")}
          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LENSES.map(({ key, icon: Icon }) => {
          const isRecommended = recommendedLens === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPickLens(key)}
              data-testid={`doorloop-lens-${key}`}
              data-recommended={isRecommended ? "true" : "false"}
              className={`relative text-left border bg-white rounded-md p-3 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${
                isRecommended
                  ? "border-amber-400 ring-2 ring-amber-200"
                  : "border-slate-200 hover:border-[var(--color-accent)]/60"
              }`}
            >
              {isRecommended && (
                <span
                  data-testid={`doorloop-lens-past-${key}`}
                  className="absolute -top-2 left-3 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-widest rounded"
                >
                  {lbl("klanten.verbeteracties.lens_hint.past_marker", "PAST")}
                </span>
              )}
              <div className="flex items-center gap-2 text-[var(--color-accent)]">
                <Icon size={16} />
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  {lbl(`klanten.verbeteracties.lens.${key}.titel`, capitalize(key))}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-snug">
                {lbl(`klanten.verbeteracties.lens.${key}.body`, "")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
