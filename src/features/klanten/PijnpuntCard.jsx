/**
 * PijnpuntCard — één card per pijnpunt in PijnpuntenView.
 *
 * Toont:
 *   - tekst (eerste paar regels van markdown, geen full render)
 *   - chips per coupling (`segment · SME` etc.) afgeleid uit dimension+item
 *   - "geen koppeling — overstijgend"-tekst voor is_floating-pijnpunten
 *   - gestreepte border + col-span-2 voor overstijgend (anker prototype regel 553)
 *
 * Click → opent PijnpuntModal in edit-mode (UX-consistency F3).
 *
 * Props:
 *   - painPoint: { id, text_md, is_floating, ... }
 *   - couplings: array gefilterd op deze pijnpunt
 *   - dimensions: array (voor archetype-label per coupling)
 *   - items: array (voor item-naam per coupling)
 *   - onClick(painPoint)
 */

import React from "react";
import { useAppConfig } from "../../shared/context/AppConfigContext";

function couplingLabel(coupling, dimensions, items) {
  if (coupling.target_table === "cd_items") {
    const item = items.find(i => i.id === coupling.target_id);
    if (!item) return null;
    const dim = dimensions.find(d => d.id === item.dimension_id);
    return { archetype: dim?.archetype || "item", name: item.name };
  }
  if (coupling.target_table === "cd_dimensions") {
    const dim = dimensions.find(d => d.id === coupling.target_id);
    if (!dim) return null;
    return { archetype: "dimensie", name: dim.name };
  }
  return null;
}

export default function PijnpuntCard({ painPoint, nummer = null, couplings, dimensions, items, onClick }) {
  const { label: appLabel } = useAppConfig();
  const isFloating = couplings.length === 0;

  return (
    <button
      type="button"
      onClick={() => onClick(painPoint)}
      data-testid={`pijnpunt-card-${painPoint.id}`}
      className={`relative text-left border rounded-md p-3 bg-white hover:border-[var(--color-accent)] hover:shadow-sm transition-all ${
        isFloating ? "col-span-2 border-dashed border-slate-400" : "border-slate-200"
      }`}
    >
      {/* Stap Bundle 3 F27 — nummer-badge linksboven voor cross-referentie
          met item-card-indicator-bolletjes in inventaris-grid */}
      {nummer != null && (
        <span
          data-testid={`pijnpunt-nummer-${painPoint.id}`}
          className="absolute -top-2 -left-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none shadow-sm"
        >
          {nummer}
        </span>
      )}
      <div className="text-[12px] mb-2 leading-relaxed text-slate-800 whitespace-pre-wrap pl-4">
        {painPoint.text_md}
      </div>
      <div className="flex gap-1 flex-wrap items-center">
        {isFloating ? (
          <span className="text-[10px] text-slate-400 italic">
            {appLabel("klanten.pijnpunt.overstijgend.label", "geen koppeling — overstijgend")}
          </span>
        ) : (
          couplings.map(c => {
            const lbl = couplingLabel(c, dimensions, items);
            if (!lbl) return null;
            return (
              <span
                key={c.id}
                className="inline-block text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900"
              >
                {lbl.archetype} · {lbl.name}
              </span>
            );
          })
        )}
      </div>
    </button>
  );
}
