import { Wand2, Loader2 } from "lucide-react";

/** Kleine wand-knop naast een veldlabel.
 *  loading  → spinner + "Laden…" tekst, knop geblokkeerd
 *  disabled → grijs + slot-tooltip, knop geblokkeerd (pending draft)
 */
export default function WandButton({ onClick, loading, disabled }) {
  const isBlocked = loading || disabled;

  return (
    <button
      type="button"
      onClick={isBlocked ? undefined : onClick}
      disabled={isBlocked}
      title={
        loading  ? "Magic Staff is bezig…"
        : disabled ? "Verwerk of verwerp het huidige voorstel eerst"
        : "Magic Staff — AI voorstel op basis van geïndexeerde documenten"
      }
      className={`flex items-center gap-1 text-[10px] font-medium transition-all rounded px-1.5 py-0.5
        ${loading  ? "text-[var(--color-accent)] cursor-default"
        : disabled ? "text-slate-300 cursor-not-allowed opacity-50"
        : "text-slate-300 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8"}`}
    >
      {loading
        ? <><Loader2 size={11} className="animate-spin" /><span>Laden…</span></>
        : <Wand2 size={12} />
      }
    </button>
  );
}
