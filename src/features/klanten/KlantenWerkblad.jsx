/**
 * KlantenWerkblad — root-component voor Klanten & Dienstverlening werkblad.
 *
 * Geactiveerd via DeepDiveOverlay's WERKBLAD_REGISTRY met blockId="customers".
 *
 * Props (registry-contract):
 *   - canvasId: UUID van actief canvas
 *   - onClose(): sluit overlay
 *   - onManualSaved(): callback na manual save (optioneel, niet gebruikt in MVP)
 *
 * Per CLAUDE.md sectie 4.1: feature-root krijgt key={canvasId} via
 * DeepDiveOverlay (al geïmplementeerd, regel 80). Lifecycle is daarmee
 * gegarandeerd schoon bij canvas-wissel.
 *
 * Werkruimte/Rapport-toggle (anker prototype regel 706-708).
 */

import React, { useState } from "react";
import { X, Layout, FileText } from "lucide-react";
import { useAppConfig } from "../../shared/context/AppConfigContext";
import { useCanvasDimensions } from "./hooks/useCanvasDimensions";
import * as klantenService from "./services/klanten.service";
import WerkruimteView from "./WerkruimteView";
import RapportView from "./RapportView";
import ItemModal from "./ItemModal";

export default function KlantenWerkblad({ canvasId, onClose }) {
  const { label: appLabel } = useAppConfig();
  const { loading, error, dimensions, items, reload } = useCanvasDimensions(canvasId);

  const [view, setView] = useState("werkruimte"); // "werkruimte" | "rapport"
  const [modalCtx, setModalCtx] = useState(null); // { dimension, item } of null

  function openCreateItem(dimension) {
    setModalCtx({ dimension, item: null });
  }
  function openEditItem(item) {
    const dim = dimensions?.find(d => d.id === item.dimension_id);
    setModalCtx({ dimension: dim, item });
  }
  function closeModal() {
    setModalCtx(null);
  }

  // Save-handler doorgegeven aan ItemModal — { error } contract.
  async function handleSaveItem(itemData) {
    if (!modalCtx) return { error: new Error("modal context ontbreekt") };
    const { dimension, item } = modalCtx;
    const result = item
      ? await klantenService.updateItem(item.id, itemData)
      : await klantenService.createItem({
          dimensionId: dimension.id,
          name: itemData.name,
          description: itemData.description,
          archetypeData: itemData.archetype_data,
        });
    if (result.error) return { error: result.error };
    reload();
    return { error: null };
  }

  // Canvas-naam afleiden uit eerste item/dimensie of fallback.
  // (MVP: geen aparte canvas-meta-fetch; voor rapport-header laat ik
  // canvasName leeg zodat default "Canvas" zichtbaar is.)
  const canvasName = "";

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
        <div className="flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)]">
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} /></button>
          <h2 className="text-lg font-bold text-white">{appLabel("label.klanten.werkblad.titel", "Klanten & Dienstverlening")}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
        <div className="flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)]">
          <button onClick={onClose} className="text-white/60 hover:text-white"><X size={18} /></button>
          <h2 className="text-lg font-bold text-white">{appLabel("label.klanten.werkblad.titel", "Klanten & Dienstverlening")}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-6">
          <div className="max-w-md">
            <p className="text-sm text-red-700 font-bold mb-2">Laden mislukt</p>
            <p className="text-xs text-slate-600 mb-4">{error.message}</p>
            <button onClick={reload} className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest rounded">
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-4 bg-[var(--color-primary)] flex-shrink-0">
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
        <h2 className="text-lg font-bold text-white">{appLabel("label.klanten.werkblad.titel", "Klanten & Dienstverlening")}</h2>

        {/* Werkruimte/Rapport-toggle */}
        <div className="ml-6 flex items-center gap-1 bg-white/10 rounded-md p-0.5">
          <button
            onClick={() => setView("werkruimte")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
              view === "werkruimte" ? "bg-white text-[var(--color-primary)]" : "text-white/70 hover:text-white"
            }`}
          >
            <Layout size={12} /> {appLabel("label.klanten.section.werkruimte", "Werkruimte")}
          </button>
          <button
            onClick={() => setView("rapport")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
              view === "rapport" ? "bg-white text-[var(--color-primary)]" : "text-white/70 hover:text-white"
            }`}
          >
            <FileText size={12} /> {appLabel("label.klanten.section.rapport", "Rapport")}
          </button>
        </div>
      </div>

      {/* Body */}
      {view === "werkruimte" ? (
        <WerkruimteView
          dimensions={dimensions}
          items={items}
          onItemClick={openEditItem}
          onAddItem={openCreateItem}
        />
      ) : (
        <RapportView
          canvasName={canvasName}
          dimensions={dimensions}
          items={items}
          onClose={() => setView("werkruimte")}
        />
      )}

      {/* Item-modal */}
      {modalCtx && (
        <ItemModal
          item={modalCtx.item}
          dimension={modalCtx.dimension}
          onClose={closeModal}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}
