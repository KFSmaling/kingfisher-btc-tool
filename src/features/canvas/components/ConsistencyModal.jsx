import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { useLang } from "../../../i18n";
import { BLOCKS, SEV_COLOR, SEV_TEXT, runConsistencyCheck } from "./BlockCard";

// ── Consistency Check Modal ──────────────────────────────────────────────────
function ConsistencyModal({ bullets, onClose }) {
  const { t } = useLang();
  const { scores, issues, overall } = runConsistencyCheck(bullets);
  const scoreColor = v => v >= 70 ? "text-green-600" : v >= 45 ? "text-orange-500" : "text-red-500";
  const barColor  = v => v >= 70 ? "bg-green-500" : v >= 45 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="fixed inset-0 bg-[var(--color-overlay)]/95 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[var(--color-primary)] max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[var(--color-overlay)] font-black text-2xl uppercase tracking-tighter">{t("consistency.title")}</h2>
            <p className="text-slate-400 text-xs mt-1">{t("consistency.overall")} <span className={`font-black text-lg ${scoreColor(overall)}`}>{overall}/100</span></p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors"><X size={28} /></button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
          {/* Per block scores */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{t("consistency.per.block")}</p>
            <div className="space-y-3">
              {BLOCKS.map(b => {
                const s = scores[b.id] || 0;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-700">{t(b.titleKey)}</span>
                      <span className={`text-xs font-black ${scoreColor(s)}`}>{s}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className={`h-full rounded-full ${barColor(s)} transition-all`} style={{ width: `${s}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issues */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{t("consistency.issues")}</p>
            <div className="space-y-3">
              {issues.map((iss, i) => (
                <div key={i} className={`p-4 border-l-4 rounded-sm ${SEV_COLOR[iss.severity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className={SEV_TEXT[iss.severity]} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${SEV_TEXT[iss.severity]}`}>
                      {iss.severity} · {iss.blocks.join(" ↔ ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{t(iss.issueKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsistencyModal;
