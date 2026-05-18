/**
 * SuggestedLensHint — amber-hint onder ChoiceCards die de aanbevolen AI-lens suggereert.
 *
 * 11.U Block 3 — F-retro-1 fix.
 *
 * Wireframe-doc regel 141: "Bij `open`-status: drie ChoiceCards op een rij (...).
 * AI-lens-suggestie als amber-hint onderaan."
 *
 * Klik op hint → opent LensPicker met aanbevolen lens preselected (PAST-pill).
 */

import React from "react";
import { Sparkles } from "lucide-react";

const LENS_LABEL_DISPLAY = {
  cluster:       "Cluster",
  paradox:       "Paradox",
  positionering: "Positionering",
  overstijgend:  "Overstijgend",
  algemeen:      "Algemeen",
};

export default function SuggestedLensHint({
  recommendedLens,
  onClick,
  disabled = false,
  appLabel,
}) {
  const lbl = (key, fb) => (appLabel ? appLabel(key, fb) : fb);
  if (!recommendedLens) return null;

  const lensName = lbl(`klanten.verbeteracties.lens.${recommendedLens}.titel`,
    LENS_LABEL_DISPLAY[recommendedLens] || "Algemeen");
  const bodyText = lbl(
    `klanten.verbeteracties.lens_hint.body.${recommendedLens}`,
    lbl(`klanten.verbeteracties.lens.${recommendedLens}.body`, ""),
  );
  const titel = lbl("klanten.verbeteracties.lens_hint.titel",
    "AI-suggestie: {lens-naam} past hier waarschijnlijk").replace("{lens-naam}", lensName);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="doorloop-lens-hint"
      data-recommended-lens={recommendedLens}
      className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-amber-900">{titel}</p>
        {bodyText && (
          <p className="text-xs text-amber-800 mt-0.5 leading-snug">{bodyText}</p>
        )}
      </div>
    </button>
  );
}
