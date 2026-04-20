import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useLang } from "../../../i18n";
import { STATUS_COLORS, STATUS_BADGE_KEYS } from "./BlockCard";

// ── Strategy Status Block (canvas dashboard view) ────────────────────────────
function StrategyStatusBlock({ block, status, bullets, strategyManual, onClick, onDeepDive }) {
  const { t, lang } = useLang();
  const title = t(block.titleKey);
  const badgeDef = STATUS_BADGE_KEYS[status];
  const badge = badgeDef ? { label: t(badgeDef.labelKey), color: badgeDef.color } : null;

  const filled = (val) => {
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return String(val).trim().length > 0;
  };
  // SWOT: nieuw via swotCount (analysis_items), fallback op legacy JSONB-veld
  const swotFilled = (strategyManual?.swotCount > 0) ||
    Object.values(strategyManual?.swot || {}).some(v => Array.isArray(v) ? v.length > 0 : false);

  const STATUS_FIELDS = [
    { key: "missie",         nl: "Missie",           en: "Mission"                          },
    { key: "visie",          nl: "Visie",            en: "Vision"                           },
    { key: "ambitie",        nl: "Ambitie",          en: "Ambition"                         },
    { key: "kernwaarden",    nl: "Kernwaarden",      en: "Core Values"                      },
    { key: "doelstellingen", nl: "Doelstellingen",   en: "Objectives",  themas: true        },
    { key: "swot",           nl: "SWOT",             en: "SWOT",        swot: true          },
  ];

  return (
    <div
      className={`col-span-12 p-5 rounded shadow-md hover:shadow-xl cursor-pointer transition-all relative flex flex-col gap-3 min-h-[140px] ${STATUS_COLORS[status]}`}
      onClick={onClick}
    >
      {/* Top: title + badge */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[#1a365d] font-bold text-[13px] uppercase tracking-[0.12em]" style={{fontFamily:"'Montserrat','Inter',sans-serif"}}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${badge.color}`}>{badge.label}</span>
          )}
        </div>
      </div>

      {/* Missie-preview als ingevuld, anders subtiele klik-hint */}
      {filled(strategyManual?.missie) ? (
        <p className="text-xs text-slate-600 leading-relaxed border-l-2 border-[#8dc63f] pl-3 italic">
          {String(strategyManual.missie).slice(0, 220)}{strategyManual.missie.length > 220 ? "…" : ""}
        </p>
      ) : (
        <p className="text-[11px] text-slate-300 italic">Klik om het strategie werkblad te openen →</p>
      )}

      {/* Status monitor — checkmarks voor kleurenblindheid */}
      <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-slate-100">
        {STATUS_FIELDS.map(f => {
          const isOk = f.themas ? (strategyManual?.themaCount > 0)
                    : f.swot   ? swotFilled
                    : filled(strategyManual?.[f.key]);
          const label = lang === "en" ? f.en : f.nl;
          return (
            <div key={f.key} className="flex items-center gap-1.5">
              {isOk
                ? <CheckCircle2 size={13} className="text-[#2c7a4b] flex-shrink-0" />
                : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 flex-shrink-0" />
              }
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOk ? "text-slate-600" : "text-slate-300"}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StrategyStatusBlock;
