/**
 * MotivatieInput — modal voor "Bewust niet adresseren" met motivatie-textarea.
 *
 * 11.U Block 3 — Fix 3, anker: Processen-werkblad MotivatieModal pattern (11.M.1).
 *
 * Wireframe-doc regel 165-169:
 *  - Textarea (3 rows) met placeholder-suggesties
 *  - Validatie: min 20 chars (CHECK in DB)
 *  - Knop: "Negeer en volgende" — primary grijs #6B6A60, niet rood (bewuste keuze)
 */

import React, { useState, useEffect } from "react";
import { X, Check, Loader2 } from "lucide-react";

const MIN_MOTIVATION_CHARS = 20;
const MAX_MOTIVATION_CHARS = 2000;

export default function MotivatieInput({
  open,
  painPoint,
  onClose,
  onConfirm,
  appLabel,
}) {
  const lbl = (key, fb) => (appLabel ? appLabel(key, fb) : fb);
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setMotivation("");
      setBusy(false);
      setErr(null);
    }
  }, [open, painPoint?.id]);

  // Escape sluit
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const trimmed = motivation.trim();
  const tooShort = trimmed.length < MIN_MOTIVATION_CHARS;
  const counterColor = tooShort ? "text-red-600" : "text-slate-500";
  const counterText = lbl("klanten.verbeteracties.dismiss.char_counter", "{N}/20+ chars")
    .replace("{N}", trimmed.length);

  async function handleConfirm() {
    if (tooShort || busy) return;
    setBusy(true);
    setErr(null);
    const r = await onConfirm(trimmed);
    setBusy(false);
    if (r?.error) {
      setErr(r.error.message || lbl("klanten.verbeteracties.dismiss.error_min_chars", "Opslaan mislukt"));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      data-testid="dismiss-motivatie-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dismiss-motivatie-modal-titel"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3
            id="dismiss-motivatie-modal-titel"
            className="text-base font-semibold text-slate-900"
          >
            {lbl("klanten.verbeteracties.dismiss.titel", "Bewust niet adresseren")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={lbl("klanten.verbeteracties.dismiss.cancel", "Annuleer")}
            data-testid="dismiss-motivatie-close"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>

        {painPoint && (
          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 px-3 py-2 rounded border-l-2 border-slate-300">
            {painPoint.text_md || painPoint.title || ""}
          </p>
        )}

        <div>
          <textarea
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            maxLength={MAX_MOTIVATION_CHARS}
            disabled={busy}
            data-testid="dismiss-motivatie-textarea"
            placeholder={lbl(
              "klanten.verbeteracties.dismiss.placeholder",
              "Bijv. 'Komt terug in IT-werkblad' of 'Buiten scope voor dit kwartaal'",
            )}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-[var(--color-accent)] resize-y"
          />
          <div className="flex items-center justify-between mt-1">
            <span
              data-testid="dismiss-motivatie-counter"
              className={`text-xs ${counterColor}`}
            >
              {counterText}
            </span>
            {err && (
              <span className="text-xs text-red-600" data-testid="dismiss-motivatie-error">
                {err}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            data-testid="dismiss-motivatie-cancel"
            className="text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-500 px-3 py-2 rounded disabled:opacity-50"
          >
            {lbl("klanten.verbeteracties.dismiss.cancel", "Annuleer")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={tooShort || busy}
            data-testid="dismiss-motivatie-confirm"
            style={{ backgroundColor: tooShort || busy ? undefined : "#6B6A60" }}
            className={`text-xs font-bold uppercase tracking-widest text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 ${
              tooShort || busy ? "bg-slate-300" : "hover:opacity-90"
            }`}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {lbl("klanten.verbeteracties.dismiss.confirm", "Negeer en volgende")}
          </button>
        </div>
      </div>
    </div>
  );
}
