/**
 * RefineDeeperModal — mini-modal voor refine-deeper-flow.
 *
 * Toont parent-tekst (read-only) + tekstveld voor `refinement_focus`. Submit
 * triggert AI-call die een kind-suggestion genereert met `parent_id=parent.id`
 * en `pattern_type=parent.pattern_type` (kind erft type — zie code-comment in
 * pattern_suggestions_generate.js).
 *
 * Props:
 *   - parentSuggestion: { id, pattern_type, text_md }
 *   - onClose()
 *   - onSubmit({ refinementFocus }) → async, returnt { error: null|Error }
 */

import React, { useState } from "react";
import { X } from "lucide-react";
import { useAppConfig } from "../../shared/context/AppConfigContext";
import {
  getPatternTypeLabelKey,
  getPatternTypeLabelFallback,
  getStyle,
} from "./patternTypeStyles";

const FOCUS_MAX = 500;

export default function RefineDeeperModal({ parentSuggestion, onClose, onSubmit }) {
  const { label: appLabel } = useAppConfig();
  const [focus, setFocus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const trimmed = focus.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const parentStyle = getStyle(parentSuggestion?.pattern_type);
  const parentTypeLabel = appLabel(
    getPatternTypeLabelKey(parentSuggestion?.pattern_type),
    getPatternTypeLabelFallback(parentSuggestion?.pattern_type),
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrMsg(null);
    const { error } = await onSubmit({ refinementFocus: trimmed });
    setSubmitting(false);
    if (error) {
      setErrMsg(error.message || "Genereren mislukt");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-md shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-[var(--color-primary)]">
            {appLabel("klanten.analyse.modal.deeper.titel", "Wat wil je dieper laten graven?")}
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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {parentSuggestion && (
            <div
              className="rounded-md border border-slate-200 border-l-[3px] p-3"
              style={{ borderLeftColor: parentStyle.border, background: parentStyle.bg }}
            >
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: parentStyle.label }}
              >
                {parentTypeLabel}
              </span>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: parentStyle.text }}>
                {parentSuggestion.text_md}
              </p>
            </div>
          )}

          <div>
            <textarea
              rows={3}
              value={focus}
              onChange={(e) => setFocus(e.target.value.slice(0, FOCUS_MAX))}
              placeholder={appLabel("klanten.analyse.modal.deeper.placeholder", "bijv. specifiek voor SME-segment")}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              maxLength={FOCUS_MAX}
              autoFocus
              data-testid="refine-deeper-focus"
            />
            <p className="text-[10px] text-slate-500 italic mt-1">
              {appLabel("klanten.analyse.modal.deeper.helper", "AI gebruikt deze focus om een verfijnde suggestie te genereren")}
            </p>
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
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            {appLabel("klanten.analyse.modal.edit.annuleer", "Annuleren")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="refine-deeper-submit"
            className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? appLabel("klanten.analyse.loading", "AI denkt na…")
              : appLabel("klanten.analyse.modal.deeper.submit", "Genereer verfijning")}
          </button>
        </div>
      </div>
    </div>
  );
}
