import { useState, useEffect } from "react";
import { Wand2, AlertTriangle } from "lucide-react";

/** Typewriter-effect: typt `text` karakter voor karakter met `speed` ms interval. */
export function useTypewriter(text, speed = 10) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

/** Toont AI-voorstel met typewriter, bronvermelding en Overnemen/Weggooien knoppen. */
export default function MagicResult({ result, onAccept, onReject }) {
  const typed = useTypewriter(result?.suggestion, 10);
  if (!result || (!result.loading && !result.suggestion && !result.error && !result.noChunks)) return null;

  if (result.loading) return (
    <div className="mt-2 px-3 py-2.5 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Wand2 size={11} className="text-[var(--color-accent)] animate-pulse flex-shrink-0" />
        <span className="text-[9px] font-semibold text-[#2c7a4b] uppercase tracking-wider animate-pulse">AI genereert voorstel…</span>
      </div>
    </div>
  );

  if (result.error) return (
    <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-[10px] text-red-500">{result.error}</p>
    </div>
  );

  // Geen chunks gevonden in Dossier
  if (result.noChunks) return (
    <div className="mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
      <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold text-amber-700">Geen documenten gevonden in Het Dossier.</p>
        {result.noChunksDiagnose
          ? <p className="text-[9px] text-amber-600 mt-0.5 font-mono">{result.noChunksDiagnose}</p>
          : <p className="text-[9px] text-amber-500 mt-0.5">Upload eerst bestanden via Het Dossier om Magic Staff te activeren.</p>
        }
      </div>
    </div>
  );

  if (!result.suggestion) return null;

  const canAccept = !result.isNoInfo;

  return (
    <div className="mt-2 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg overflow-hidden">
      <div className="px-3 py-2.5 space-y-2">
        {result.isNoInfo ? (
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 leading-relaxed">{typed}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{typed}</p>
        )}
        {result.citations?.length > 0 && (
          <p className="text-[9px] text-slate-400 italic leading-relaxed">
            Bron: {result.citations.join(" · ")}
          </p>
        )}
      </div>
      {/* Sticky accept/reject balk */}
      <div className="sticky bottom-0 flex items-center gap-4 px-3 py-2 bg-[#edf7e0] border-t border-[var(--color-accent)]/30">
        <button
          onClick={canAccept ? onAccept : undefined}
          disabled={!canAccept}
          className={`text-[10px] font-black uppercase tracking-widest transition-colors
            ${canAccept
              ? "text-[#2c7a4b] hover:text-[var(--color-primary)] cursor-pointer"
              : "text-slate-300 cursor-not-allowed"}`}
        >
          ✓ Overnemen
        </button>
        <button onClick={onReject}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors">
          ✕ Weggooien
        </button>
      </div>
    </div>
  );
}
