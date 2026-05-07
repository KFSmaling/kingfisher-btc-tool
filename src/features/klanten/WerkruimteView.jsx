/**
 * WerkruimteView — fase-tabs + dimensie-grid (fase 1 actief in MVP).
 *
 * Props:
 *   - canvasId
 *   - dimensions, items
 *   - onItemClick(item)
 *   - onAddItem(dimension)
 *
 * Fase-tabs 2-4 zijn disabled met tooltip per instructie sectie 53.
 */

import React, { useState } from "react";
import { useAppConfig } from "../../shared/context/AppConfigContext";
import DimensieKolom from "./DimensieKolom";

const FASE_TABS = [
  { num: 1, key: "label.klanten.fase.1.titel", fallback: "Inventarisatie", enabled: true  },
  { num: 2, key: "label.klanten.fase.2.titel", fallback: "Pijnpunten",     enabled: false },
  { num: 3, key: "label.klanten.fase.3.titel", fallback: "Analyse",        enabled: false },
  { num: 4, key: "label.klanten.fase.4.titel", fallback: "Verbeterrichtingen", enabled: false },
];

export default function WerkruimteView({ dimensions, items, onItemClick, onAddItem }) {
  const { label: appLabel } = useAppConfig();
  const [activeFase, setActiveFase] = useState(1);

  const itemsByDim = (dimId) => items.filter(i => i.dimension_id === dimId);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Fase-tabs */}
      <div className="px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {FASE_TABS.map(tab => {
              const isActive = activeFase === tab.num;
              const tooltip = tab.enabled ? null : appLabel("klanten.fase.disabled.tooltip", "komt in latere sprint");
              return (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => tab.enabled && setActiveFase(tab.num)}
                  disabled={!tab.enabled}
                  title={tooltip || undefined}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : tab.enabled
                        ? "border-slate-300 text-slate-600 hover:border-slate-500"
                        : "border-slate-200 text-slate-300 cursor-not-allowed opacity-60"
                  }`}
                >
                  <span className="mr-1.5">{tab.num} ·</span>
                  {appLabel(tab.key, tab.fallback)}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 italic uppercase tracking-widest">
            {appLabel("klanten.helper.fase.geen_volgorde", "geen verplichte volgorde")}
          </span>
        </div>
      </div>

      {/* Dimensie-grid (fase 1) */}
      <div className="flex-1 overflow-auto p-8">
        {dimensions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 italic">Nog geen dimensies in dit canvas.</p>
            <p className="text-[11px] text-slate-400 mt-2">
              {appLabel("klanten.helper.iteratief", "werk in uitvoering — geen 'klaar' status")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dimensions.map(dim => (
              <DimensieKolom
                key={dim.id}
                dimension={dim}
                items={itemsByDim(dim.id)}
                onItemClick={onItemClick}
                onAddItem={() => onAddItem(dim)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
