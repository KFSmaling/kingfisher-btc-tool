/**
 * InzichtItem — één bevinding als lees-sectie (document-stijl)
 *
 * Visueel: geen card/border, geen gekleurde achtergrond per bevinding.
 * Bevindingen zijn lees-secties gescheiden door een subtiele border-bottom.
 * Gebaseerd op docs/prototypes/inzichten-prototype-v2.html.
 *
 * Color mapping: docs/inzichten-68-color-mapping.md
 *
 * Props:
 *   insight   — { id, category, type, title, observation, recommendation, source_refs[] }
 *   appLabel  — (key, fallback) => string  (vanuit AppConfigContext)
 *
 * Named exports:
 *   TYPE_CONFIG — gebruikt door InzichtenOverlay voor TOC-dots
 *   FALLBACK_TYPE
 */

import React from "react";
import { Minus, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

// ── Type-configuratie ─────────────────────────────────────────────────────────
// Kleur-toewijzing via Tailwind semantic names — nooit hardcoded hex.
// dotColor = TOC-indicator (geëxporteerd voor gebruik in InzichtenOverlay).
// Kleuren per color-mapping doc: zwak → amber-700, kans → blue-600 (dichter bij proto).
export const TYPE_CONFIG = {
  ontbreekt: {
    Icon:       Minus,
    labelKey:   "analysis.type.ontbreekt",
    labelFb:    "Ontbreekt",
    color:      "text-red-700",
    bg:         "bg-red-50",
    dotColor:   "bg-red-700",
  },
  zwak: {
    Icon:       AlertTriangle,
    labelKey:   "analysis.type.zwak",
    labelFb:    "Zwak punt",
    color:      "text-amber-700",     // proto: #c26a1f → amber-700 dichter dan amber-800
    bg:         "bg-amber-50",
    dotColor:   "bg-amber-700",
  },
  kans: {
    Icon:       TrendingUp,
    labelKey:   "analysis.type.kans",
    labelFb:    "Kans",
    color:      "text-blue-600",      // proto: #2a6bb4 → blue-600 dichter dan blue-700
    bg:         "bg-blue-50",
    dotColor:   "bg-blue-600",
  },
  sterk: {
    Icon:       CheckCircle,
    labelKey:   "analysis.type.sterk",
    labelFb:    "Sterkte",
    color:      "text-green-700",
    bg:         "bg-green-50",
    dotColor:   "bg-green-700",
  },
};

export const FALLBACK_TYPE = TYPE_CONFIG.zwak;

// ── Bron-link (tekst + · scheidingsteken, geen pill) ─────────────────────────
// missing: dashed border rood (semantisch, mag hardcoded — geen brand-kleur)
function SourceLink({ source, isLast }) {
  const { label, exists } = source;
  return (
    <>
      {exists === false ? (
        <span className="inline border border-dashed border-red-400 text-red-600 text-[10px] px-1 rounded leading-normal">
          {label} (ontbreekt)
        </span>
      ) : (
        <span className="text-slate-600 underline decoration-slate-200 underline-offset-2 hover:decoration-slate-400 transition-colors cursor-default">
          {label}
        </span>
      )}
      {!isLast && (
        <span className="mx-2 text-slate-300 select-none" aria-hidden="true">·</span>
      )}
    </>
  );
}

// ── InzichtItem ───────────────────────────────────────────────────────────────
export default function InzichtItem({ insight, appLabel }) {
  const { id, type, title, observation, recommendation } = insight;
  // Null-guard: zowel undefined als null vallen veilig terug naar []
  const source_refs = Array.isArray(insight.source_refs) ? insight.source_refs : [];

  const cfg = TYPE_CONFIG[type] ?? FALLBACK_TYPE;
  const { Icon, labelKey, labelFb, bg, color } = cfg;

  // Labels via appLabel() — fallback naar hardcoded als prop afwezig (defensive)
  const typeLabel = appLabel ? appLabel(labelKey, labelFb) : labelFb;
  const obsLabel  = appLabel ? appLabel("analysis.section.observation",    "Observatie")    : "Observatie";
  const recLabel  = appLabel ? appLabel("analysis.section.recommendation", "Aanbeveling")   : "Aanbeveling";
  const refsLabel = appLabel ? appLabel("analysis.section.references",     "Verwijst naar") : "Verwijst naar";

  return (
    <article
      id={`insight-${id}`}
      className="py-8 border-b border-slate-100 last:border-b-0"
    >
      {/* ── Kop: 24px cirkel-marker + type-label kicker + h3 ─────────────── */}
      <div className="flex items-start gap-3.5 mb-4">

        {/* Ronde cirkel-marker — type-achtergrond (zacht), icoon in type-kleur */}
        {/* bg uit TYPE_CONFIG → Tailwind semantic class, nooit hardcoded hex */}
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${bg}`}
          aria-hidden="true"
        >
          <span className={color}><Icon size={13} /></span>
        </span>

        <div className="flex-1 min-w-0">
          {/* Type-label: eigen regel boven de titel, 10px uppercase */}
          {/* color uit TYPE_CONFIG → Tailwind semantic class */}
          <div className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-1 ${color}`}>
            {typeLabel}
          </div>
          {/* Titel: 18px, brand-primair via CSS-variabele */}
          <h3 className="text-[18px] font-semibold text-[var(--color-primary)] leading-snug tracking-[-0.005em]">
            {title}
          </h3>
        </div>
      </div>

      {/* ── Body: ingesprongen 38px (= w-6 cirkel + gap-3.5 = 24 + 14 = 38px) */}
      <div className="ml-[38px]">

        {/* Observatie-blok */}
        {observation && (
          <div className="mb-3.5">
            <strong className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1 not-italic">
              {obsLabel}
            </strong>
            <p className="text-[15px] text-slate-700 leading-relaxed m-0">
              {observation}
            </p>
          </div>
        )}

        {/* Aanbeveling-blok */}
        {recommendation && (
          <div className="mb-3.5">
            <strong className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-1 not-italic">
              {recLabel}
            </strong>
            <p className="text-[15px] text-slate-700 leading-relaxed m-0">
              {recommendation}
            </p>
          </div>
        )}

        {/* "Verwijst naar" footer */}
        {source_refs.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mr-2">
              {refsLabel}
            </span>
            {source_refs.map((ref, i) => (
              <SourceLink key={i} source={ref} isLast={i === source_refs.length - 1} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
