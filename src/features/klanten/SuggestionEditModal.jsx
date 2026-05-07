/**
 * SuggestionEditModal — refine-edit voor cd_pattern_suggestions.
 *
 * UX-consistency-principe (findings F3): wat via UI-dialoog gemaakt is, moet
 * ook via UI-dialoog gewijzigd kunnen worden.
 *
 * Bij submit: API zet `is_user_edited=true` als nieuwe text != original_ai_text_md
 * (server-side in PUT /api/klanten/pattern_suggestions). Frontend toont
 * "verfijnd"-badge na reload.
 *
 * Props:
 *   - suggestion: { id, text_md, original_ai_text_md, ... }
 *   - onClose()
 *   - onSave({ textMd }) → async, returnt { error: null|Error }
 */

import React, { useState } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useAppConfig } from "../../shared/context/AppConfigContext";

const TEXT_MAX = 8000;

export default function SuggestionEditModal({ suggestion, onClose, onSave }) {
  const { label: appLabel } = useAppConfig();

  const [textMd, setTextMd] = useState(suggestion?.text_md ?? "");
  const [showOriginal, setShowOriginal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  const trimmed = textMd.trim();
  const textValid = trimmed.length > 0 && trimmed.length <= TEXT_MAX;
  const canSubmit = textValid && !saving;

  const hasOriginal = !!suggestion?.original_ai_text_md;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setErrMsg(null);
    const { error } = await onSave({ textMd: trimmed });
    setSaving(false);
    if (error) {
      setErrMsg(error.message || "Opslaan mislukt");
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
            {appLabel("klanten.analyse.modal.edit.titel", "Suggestie bewerken")}
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
          <div>
            <label
              htmlFor="suggestion-edit-text"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-1"
            >
              {appLabel("klanten.analyse.modal.edit.tekst.label", "Tekst")}
            </label>
            <textarea
              id="suggestion-edit-text"
              rows={6}
              value={textMd}
              onChange={(e) => setTextMd(e.target.value.slice(0, TEXT_MAX))}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              maxLength={TEXT_MAX}
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {textMd.length}/{TEXT_MAX}
            </p>
          </div>

          {hasOriginal && (
            <div className="border border-slate-200 rounded">
              <button
                type="button"
                onClick={() => setShowOriginal((v) => !v)}
                data-testid="toggle-origineel"
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50"
              >
                {showOriginal ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                {appLabel("klanten.analyse.modal.edit.origineel.toggle", "originele AI-tekst")}
              </button>
              {showOriginal && (
                <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
                  <p className="text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {suggestion.original_ai_text_md}
                  </p>
                </div>
              )}
            </div>
          )}

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
            data-testid="suggestion-edit-opslaan"
            className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-widest rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Opslaan…" : appLabel("klanten.analyse.modal.edit.opslaan", "Opslaan")}
          </button>
        </div>
      </div>
    </div>
  );
}
