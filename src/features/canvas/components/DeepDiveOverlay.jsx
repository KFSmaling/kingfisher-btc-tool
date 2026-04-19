/**
 * DeepDiveOverlay — volledig scherm werkblad per BTC-blok
 *
 * Gebruikt WERKBLAD_REGISTRY om lazy-loaded werkbladen te koppelen aan block-id's.
 * Nieuw werkblad toevoegen = 1 regel in de registry, nul wijzigingen in App.js.
 *
 * Registry-contract per werkblad:
 *   props: { canvasId: string, onClose: fn, onManualSaved?: fn }
 */

import React, { useState, useEffect, Suspense } from "react";
import { X } from "lucide-react";

// ── Werkblad Registry ────────────────────────────────────────────────────────
// Voeg hier nieuwe verdiepingen toe — App.js hoeft nooit te wijzigen.
const WERKBLAD_REGISTRY = {
  strategy: React.lazy(() => import("../../strategie/StrategieWerkblad")),
  // principles: React.lazy(() => import("../../principles/PrinciplesWerkblad")),
  // customers:  React.lazy(() => import("../../customers/CustomersWerkblad")),
  // people:     React.lazy(() => import("../../people/PeopleWerkblad")),
};

// ── Loading spinner (gedeeld door alle werkbladen) ───────────────────────────
function WerkbladSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#8dc63f] border-t-transparent animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Werkblad laden…</p>
      </div>
    </div>
  );
}

// ── Generieke placeholder (blokken zonder werkblad) ──────────────────────────
function GenericPlaceholder({ blockId, onClose, mounted }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
      <div
        className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
          ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.99]"}`}
      >
        <div className="flex items-center gap-3 px-8 py-4 bg-[#1a365d] flex-shrink-0">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
          <h2 className="text-lg font-bold text-white capitalize">{blockId}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">
            Verdieping voor dit blok komt in een volgende sprint.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── DeepDiveOverlay ──────────────────────────────────────────────────────────
/**
 * @param {string}   blockId        — BTC block-id (e.g. "strategy", "people")
 * @param {string}   canvasId       — UUID van actief canvas
 * @param {function} onClose        — sluit overlay
 * @param {function} onManualSaved  — callback na manual save (optioneel)
 */
export default function DeepDiveOverlay({ blockId, canvasId, onClose, onManualSaved }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const Werkblad = WERKBLAD_REGISTRY[blockId] ?? null;

  if (Werkblad) {
    return (
      <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
        <Suspense fallback={<WerkbladSpinner />}>
          <Werkblad
            canvasId={canvasId}
            onClose={onClose}
            onManualSaved={onManualSaved}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <GenericPlaceholder blockId={blockId} onClose={onClose} mounted={mounted} />
  );
}
