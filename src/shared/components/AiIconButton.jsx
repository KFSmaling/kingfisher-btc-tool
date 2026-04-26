/**
 * AiIconButton — canoniek button-component voor AI-affordances.
 *
 * Past de visuele standaard automatisch toe (zie CLAUDE.md sectie 3B):
 *   - Default (clickable, idle): text-[var(--color-accent)]/70
 *   - Hover:                     text-[var(--color-accent)] + bg-[var(--color-accent)]/8
 *   - Active/loading:            text-[var(--color-accent)] (+ animate-spin spinner)
 *   - Disabled:                  text-slate-400 opacity-60 cursor-not-allowed
 *
 * Props:
 *   variant   "improve" (Wand2) of "generate" (Sparkles). Default "improve".
 *   size      Icon-grootte in px. Default 12.
 *   loading   Toont spinner i.p.v. icon, knop geblokkeerd.
 *   disabled  Grijs + cursor-not-allowed, knop geblokkeerd.
 *   onClick   Handler.
 *   tooltip   title-attribuut.
 *   label     Optionele tekst naast icon (klein, font-bold).
 *   className Extra utilities (bv. flex-shrink-0, rounded-full).
 */

import AiIcon from "./AiIcon";

export default function AiIconButton({
  variant   = "improve",
  size      = 12,
  loading   = false,
  disabled  = false,
  onClick,
  tooltip,
  label,
  className = "",
}) {
  const isBlocked = loading || disabled;

  // Base + state-driven kleur/cursor
  const stateCls = isBlocked
    ? (disabled
        ? "text-slate-400 opacity-60 cursor-not-allowed"
        : "text-[var(--color-accent)] cursor-default")
    : "text-[var(--color-accent)]/70 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8 cursor-pointer";

  return (
    <button
      type="button"
      onClick={isBlocked ? undefined : onClick}
      disabled={isBlocked}
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-all ${stateCls} ${className}`}
    >
      <AiIcon
        variant={variant}
        size={size}
        loading={loading}
        colorClass=""  /* kleur overgenomen van button (currentColor) */
      />
      {label && <span className="text-[10px] font-medium">{label}</span>}
    </button>
  );
}
