/**
 * WerkbladActieknoppen — canoniek drie-knoppen-patroon voor werkbladen
 * (Sprint C, issue #69). Zie INZICHTEN_DESIGN.md sectie "Werkblad-knoppen".
 *
 * Layout: [Analyse draaien]  [Inzichten bekijken]  [Rapportage]
 *
 * Props:
 *   onAnalyse         () => void                — handler voor "Analyse draaien"
 *   onBekijken        () => void                — handler voor "Inzichten bekijken"
 *   onRapportage      () => void | null         — handler; null/undefined → knop disabled met tooltip
 *   analyseLabel      string                    — "Analyse draaien" | "Opnieuw analyseren" | "Analyseren…"
 *   analysing         boolean                   — true = analyse draait (knop disabled)
 *   bekijkenDisabled  boolean                   — true = nog geen analyse beschikbaar
 *   rapportageLabel   string?                   — override default "Rapportage"
 *   appLabel          (key, fb) => string       — config-resolver
 */

import { FileText } from "lucide-react";
import AiIcon from "./AiIcon";

export default function WerkbladActieknoppen({
  onAnalyse,
  onBekijken,
  onRapportage,
  analyseLabel,
  analysing        = false,
  bekijkenDisabled = false,
  rapportageLabel,
  appLabel,
}) {
  const lbl = (key, fb) => (appLabel ? appLabel(key, fb) : fb);
  const rapportageOff = !onRapportage;

  return (
    <div className="flex items-center gap-3">

      {/* 1 — Analyse draaien */}
      <button
        type="button"
        onClick={analysing ? undefined : onAnalyse}
        disabled={analysing}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AiIcon variant="generate" size={13} />
        {analyseLabel}
      </button>

      {/* 2 — Inzichten bekijken (disabled tot er een analyse is) */}
      <button
        type="button"
        onClick={bekijkenDisabled ? undefined : onBekijken}
        disabled={bekijkenDisabled}
        title={bekijkenDisabled ? lbl("werkblad.action.bekijk_disabled_tooltip", "Eerst een analyse draaien") : undefined}
        className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-lg transition-colors
          ${bekijkenDisabled
            ? "bg-white border-slate-200 text-slate-300 cursor-not-allowed"
            : "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/50 text-[var(--color-success)] hover:border-[var(--color-accent)] cursor-pointer"}`}
      >
        <AiIcon
          variant="generate"
          size={13}
          colorClass={bekijkenDisabled ? "text-slate-300" : "text-[var(--color-success)]"}
        />
        {lbl("werkblad.action.bekijk_inzichten", "Inzichten bekijken")}
      </button>

      {/* 3 — Rapportage (functional indien onRapportage gegeven, anders disabled placeholder) */}
      <button
        type="button"
        onClick={rapportageOff ? undefined : onRapportage}
        disabled={rapportageOff}
        title={rapportageOff ? lbl("werkblad.action.rapportage_tooltip", "Volgt in volgende release") : undefined}
        className={`flex items-center gap-2 px-4 py-2 bg-white border text-xs font-bold rounded-lg transition-colors
          ${rapportageOff
            ? "border-slate-200 text-slate-300 cursor-not-allowed opacity-60"
            : "border-slate-200 hover:border-[var(--color-primary)]/40 text-[var(--color-primary)]"}`}
      >
        <FileText size={13} />
        {rapportageLabel ?? lbl("werkblad.action.rapportage", "Rapportage")}
      </button>

    </div>
  );
}
