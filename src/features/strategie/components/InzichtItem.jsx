/**
 * InzichtItem — één bevinding in document-stijl
 *
 * Props:
 *   insight   — { id, category, type, title, observation, recommendation, source_refs[] }
 *   appLabel  — (key, fallback) => string  (vanuit AppConfigContext)
 */

import React from "react";
import { Minus, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

// ── Type-configuratie (kleurenblind-safe: kleur + icoon-vorm) ────────────────
// Labels worden via appLabel() opgehaald bij render; labelKey verwijst naar de
// config-key zonder het "analysis.type."-prefix.
const TYPE_CONFIG = {
  ontbreekt: {
    Icon:       Minus,
    labelKey:   "analysis.type.ontbreekt",
    labelFb:    "Ontbreekt",
    color:      "text-red-700",
    bg:         "bg-red-50",
    border:     "border-red-200",
    leftBar:    "bg-red-700",
    badgeBg:    "bg-red-100",
    badgeText:  "text-red-700",
  },
  zwak: {
    Icon:       AlertTriangle,
    labelKey:   "analysis.type.zwak",
    labelFb:    "Zwak punt",
    color:      "text-amber-800",
    bg:         "bg-amber-50",
    border:     "border-amber-200",
    leftBar:    "bg-amber-700",
    badgeBg:    "bg-amber-100",
    badgeText:  "text-amber-800",
  },
  kans: {
    Icon:       TrendingUp,
    labelKey:   "analysis.type.kans",
    labelFb:    "Kans",
    color:      "text-blue-700",
    bg:         "bg-blue-50",
    border:     "border-blue-200",
    leftBar:    "bg-blue-700",
    badgeBg:    "bg-blue-100",
    badgeText:  "text-blue-700",
  },
  sterk: {
    Icon:       CheckCircle,
    labelKey:   "analysis.type.sterk",
    labelFb:    "Sterkte",
    color:      "text-green-700",
    bg:         "bg-green-50",
    border:     "border-green-200",
    leftBar:    "bg-green-700",
    badgeBg:    "bg-green-100",
    badgeText:  "text-green-700",
  },
};

const FALLBACK_TYPE = TYPE_CONFIG.zwak;

// ── Bron-pill ────────────────────────────────────────────────────────────────
// FIX 1: prop hernoemd van 'ref' (React-gereserveerd) naar 'source'
function SourcePill({ source }) {
  const { label, exists } = source;
  if (exists === false) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border border-dashed border-red-300 text-red-700 bg-red-50">
        {label} (ontbreekt)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      {label}
    </span>
  );
}

// ── InzichtItem ───────────────────────────────────────────────────────────────
export default function InzichtItem({ insight, appLabel }) {
  const { id, type, title, observation, recommendation } = insight;
  // FIX 2: null-guard — zowel undefined als null vallen veilig terug naar []
  const source_refs = Array.isArray(insight.source_refs) ? insight.source_refs : [];

  const cfg = TYPE_CONFIG[type] ?? FALLBACK_TYPE;
  const { Icon, labelKey, labelFb, bg, border, leftBar, badgeBg, badgeText, color } = cfg;

  // FIX 3: type-label via appLabel() i.p.v. hardcoded
  const typeLabel = appLabel ? appLabel(labelKey, labelFb) : labelFb;

  return (
    <div
      id={`insight-${id}`}
      className={`relative flex gap-0 rounded-lg border ${border} ${bg} overflow-hidden mb-4`}
    >
      {/* Verticale kleur-balk links */}
      <div className={`w-1 flex-shrink-0 ${leftBar}`} />

      {/* Inhoud */}
      <div className="flex-1 px-5 py-4">
        {/* Type-badge + titel */}
        <div className="flex items-start gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${badgeBg} ${badgeText}`}>
            <Icon size={10} />
            {typeLabel}
          </span>
          <h3 className={`text-sm font-semibold leading-snug ${color}`}>{title}</h3>
        </div>

        {/* Observatie */}
        <p className="text-sm text-slate-700 leading-relaxed mb-2">{observation}</p>

        {/* Aanbeveling */}
        {recommendation && (
          <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-300 pl-3 mb-3">
            → {recommendation}
          </p>
        )}

        {/* Verwijst naar — FIX 3: header via appLabel() */}
        {source_refs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mr-0.5">
              {appLabel ? appLabel("analysis.sourceref.header", "Verwijst naar") : "Verwijst naar"}
            </span>
            {/* FIX 1: prop 'source' i.p.v. 'ref' */}
            {source_refs.map((ref, i) => (
              <SourcePill key={i} source={ref} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
