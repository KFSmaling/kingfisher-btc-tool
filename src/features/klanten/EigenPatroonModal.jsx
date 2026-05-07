/**
 * EigenPatroonModal — consultant-eigen patroon (geen AI).
 *
 * Submit doet POST /api/klanten/pattern_suggestions met:
 *   - pattern_type (dropdown 5 keuzes)
 *   - text_md
 *   - scope='canvas' (MVP fase 3)
 *   - vanuit (multi-select uit pijnpunten + items, of leeg)
 * → API INSERT-t suggestion + ai_generated-event met source='consultant_eigen'.
 *
 * Props:
 *   - canvasId
 *   - dimensions, items, painPoints   // voor vanuit-multi-select
 *   - onClose()
 *   - onSave({ patternType, textMd, vanuit }) → async, returnt { error: null|Error }
 */

import React, { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useAppConfig } from "../../shared/context/AppConfigContext";
import {
  PATTERN_TYPES,
  getPatternTypeLabelKey,
  getPatternTypeLabelFallback,
} from "./patternTypeStyles";

const TEXT_MAX = 8000;
const VANUIT_FRAGMENT_MAX = 200;

export default function EigenPatroonModal({
  dimensions = [],
  items = [],
  painPoints = [],
  onClose,
  onSave,
}) {
  const { label: appLabel } = useAppConfig();

  const [patternType, setPatternType] = useState("eigen");
  const [textMd, setTextMd] = useState("");
  const [selectedVanuit, setSelectedVanuit] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const trimmed = textMd.trim();
  const textValid = trimmed.length > 0 && trimmed.length <= TEXT_MAX;
  const canSubmit = textValid && !saving;

  // Vanuit-bronnen: pijnpunten (eerste 100 chars) + items (per dim)
  const vanuitSources = useMemo(() => {
    const sources = [];
    for (const pp of painPoints) {
      sources.push({
        key: `pp:${pp.id}`,
        label: String(pp.text_md || "").slice(0, VANUIT_FRAGMENT_MAX),
        kind: "pijnpunt",
      });
    }
    for (const dim of dimensions) {
      const dimItems = items.filter((it) => it.dimension_id === dim.id);
      for (const it of dimItems) {
        sources.push({
          key: `it:${it.id}`,
          label: `${dim.name} · ${it.name}`,
          kind: "item",
        });
      }
    }
    return sources;
  }, [dimensions, items, painPoints]);

  function toggleVanuit(key) {
    setSelectedVanuit((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    // Vanuit-array opbouwen — letterlijke fragmenten/labels van geselecteerde bronnen
    const selectedLabels = vanuitSources
      .filter((s) => selectedVanuit.has(s.key))
      .map((s) => s.label);

    setSaving(true);
    setErrMsg(null);
    const { error } = await onSave({
      patternType,
      textMd: trimmed,
      vanuit: selectedLabels.length > 0 ? selectedLabels : null,
    });
    setSaving(false);
    if (error) {
      setErrMsg(error.message || "Toevoegen mislukt");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-[var(--color-primary)]">
            {appLabel("klanten.analyse.modal.eigen.titel", "Eigen patroon toevoegen")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {/* Type */}
          <div>
            <label
              htmlFor="eigen-type"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.analyse.modal.eigen.type.label", "Type")}
            </label>
            <select
              id="eigen-type"
              value={patternType}
              onChange={(e) => setPatternType(e.target.value)}
              data-testid="eigen-type-dropdown"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            >
              {PATTERN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {appLabel(getPatternTypeLabelKey(t), getPatternTypeLabelFallback(t))}
                </option>
              ))}
            </select>
          </div>

          {/* Tekst */}
          <div>
            <label
              htmlFor="eigen-text"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.analyse.modal.eigen.tekst.label", "Beschrijving")}
            </label>
            <textarea
              id="eigen-text"
              rows={4}
              value={textMd}
              onChange={(e) => setTextMd(e.target.value.slice(0, TEXT_MAX))}
              placeholder={appLabel("klanten.analyse.modal.eigen.tekst.placeholder", "Beschrijf het patroon dat je ziet (markdown ondersteund)")}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              maxLength={TEXT_MAX}
              data-testid="eigen-text"
              autoFocus
            />
          </div>

          {/* Vanuit */}
          <div>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1">
              {appLabel("klanten.analyse.modal.eigen.vanuit.label", "Vanuit (optioneel)")}
            </p>
            <p className="text-[10px] text-slate-500 italic mb-2">
              {appLabel("klanten.analyse.modal.eigen.vanuit.helper", "Welke pijnpunten of items onderbouwen dit patroon?")}
            </p>
            {vanuitSources.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Geen pijnpunten of items in canvas.</p>
            ) : (
              <div className="space-y-1 max-h-56 overflow-auto border border-slate-200 rounded p-2 bg-slate-50">
                {vanuitSources.map((s) => (
                  <label
                    key={s.key}
                    className="flex items-start gap-2 text-[12px] cursor-pointer hover:text-[var(--color-primary)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVanuit.has(s.key)}
                      onChange={() => toggleVanuit(s.key)}
                      className="mt-0.5 accent-[var(--color-accent)]"
                      data-testid={`eigen-vanuit-${s.key}`}
                    />
                    <span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 mr-1">
                        {s.kind}
                      </span>
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {errMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              {errMsg}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            {appLabel("klanten.analyse.modal.edit.annuleer", "Annuleren")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="eigen-opslaan"
            className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Opslaan…" : appLabel("klanten.analyse.modal.eigen.opslaan", "Toevoegen")}
          </button>
        </div>
      </div>
    </div>
  );
}
