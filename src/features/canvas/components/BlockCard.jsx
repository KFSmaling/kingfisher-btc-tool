import React from "react";
import { ChevronRight } from "lucide-react";
import { useLang } from "../../../i18n";

// Sub-tab sets — pillar blocks use Current/To-Be/Change
// Guiding Principles uses the 4 pillar names as subtabs
// Subtabs en blocks zijn ID-gebaseerd; labels worden via t() opgehaald
const PILLAR_SUBTABS = [
  { id: "current", labelKey: "subtab.current", dot: "bg-slate-400",    activeBg: "bg-slate-50 border-slate-300",    color: "border-slate-400 text-slate-600"    },
  { id: "tobe",    labelKey: "subtab.tobe",    dot: "bg-[#00AEEF]",    activeBg: "bg-blue-50 border-[#1a365d]",     color: "border-[#1a365d] text-[#1a365d]"    },
  { id: "change",  labelKey: "subtab.change",  dot: "bg-orange-400",   activeBg: "bg-orange-50 border-orange-300",  color: "border-orange-400 text-orange-500"  },
];

const PRINCIPLES_SUBTABS = [
  { id: "generic",    labelKey: "subtab.generic",         dot: "bg-[#1a365d]",   activeBg: "bg-[#1a365d]/5 border-[#1a365d]/30", color: "border-[#1a365d] text-[#1a365d]"    },
  { id: "customers",  labelKey: "block.customers.title",  dot: "bg-[#00AEEF]",   activeBg: "bg-blue-50 border-blue-300",         color: "border-blue-400 text-blue-600"      },
  { id: "processes",  labelKey: "block.processes.title",  dot: "bg-violet-500",  activeBg: "bg-violet-50 border-violet-300",     color: "border-violet-500 text-violet-600"  },
  { id: "people",     labelKey: "block.people.title",     dot: "bg-green-500",   activeBg: "bg-green-50 border-green-300",       color: "border-green-500 text-green-600"    },
  { id: "technology", labelKey: "block.technology.title", dot: "bg-slate-500",   activeBg: "bg-slate-100 border-slate-400",      color: "border-slate-500 text-slate-600"    },
];

const BLOCKS = [
  { id: "strategy",   titleKey: "block.strategy.title",   subKey: "block.strategy.sub",   layout: "wide",    hasSubs: false, subTabs: null           },
  { id: "principles", titleKey: "block.principles.title", subKey: "block.principles.sub", layout: "wide",    hasSubs: true,  subTabs: PRINCIPLES_SUBTABS },
  { id: "customers",  titleKey: "block.customers.title",  subKey: "block.customers.sub",  layout: "quarter", hasSubs: true,  subTabs: PILLAR_SUBTABS },
  { id: "processes",  titleKey: "block.processes.title",  subKey: "block.processes.sub",  layout: "quarter", hasSubs: true,  subTabs: PILLAR_SUBTABS },
  { id: "people",     titleKey: "block.people.title",     subKey: "block.people.sub",     layout: "quarter", hasSubs: true,  subTabs: PILLAR_SUBTABS },
  { id: "technology", titleKey: "block.technology.title", subKey: "block.technology.sub", layout: "quarter", hasSubs: true,  subTabs: PILLAR_SUBTABS },
  { id: "portfolio",  titleKey: "block.portfolio.title",  subKey: "block.portfolio.sub",  layout: "wide",    hasSubs: false, subTabs: null           },
];


// Helper to convert string arrays to bullet objects
const eb  = (texts, source) => texts.map(text => ({ text, source }));
const ebs = (texts, source, subtab) => texts.map(text => ({ text, source, subtab }));

const EXAMPLE_BULLETS = {
  strategy:   eb(["Vision: Best HNW Global insurer, excelling in customer service","Pivot: from Maintain & Sell to Invest & Grow","Driver A: Customer & partner centricity — omnichannel excellence","Driver B: Product differentiation — new propositions in 6 months","Goal: Double value creation by 2028"], "example-strategy.pdf"),
  principles: [
    ...ebs(["Customer focus: treat HNWI by CLV — no one-size-fits-all","Omnichannel consistency — same request, same outcome across channels"], "example-principles.pdf", "customers"),
    ...ebs(["Standardise supporting processes, customise the differentiating 20%","Agile by default — multidisciplinary squads over functional silos"], "example-principles.pdf", "processes"),
    ...ebs(["Digital savviness is a baseline requirement, not an option","Talent is grown from within before sourcing externally"], "example-principles.pdf", "people"),
    ...ebs(["API-first: no point solutions that cannot connect","Data is a shared asset — no departmental data islands"], "example-principles.pdf", "technology"),
  ],
  customers: [
    ...ebs(["Segment Affluent+/HNW: 750K–1M wealth, 85% of policies","Channel: International brokers (primary, fed by private banks)"], "example-customers.pdf", "current"),
    ...ebs(["Omnichannel proposition: broker + direct + private bank","Geography expansion: DIFC hub as Middle East entry point"], "example-customers.pdf", "tobe"),
    ...ebs(["Customer journey redesign for HNW+ segment","Launch broker portal uplift H1 2025"], "example-customers.pdf", "change"),
  ],
  processes: [
    ...ebs(["Manual underwriting: 60% of cases still paper-based","Siloed front/back office — no real-time case view"], "example-processes.pdf", "current"),
    ...ebs(["Straight-through processing for standard cases","Agile operating model: multidisciplinary squads"], "example-processes.pdf", "tobe"),
    ...ebs(["Standardise and automate: AI, OCR, chatbots rollout","Decouple front (CX) from back (admin) systems"], "example-processes.pdf", "change"),
  ],
  people: [
    ...ebs(["Performance management: inconsistent across BUs","Digital skills gap: limited AI/data literacy"], "example-people.pdf", "current"),
    ...ebs(["Clear accountability model, goals-based culture","Digital-savvy workforce across all levels"], "example-people.pdf", "tobe"),
    ...ebs(["Talent management programme + succession planning","Digital literacy uplift: AI/data training for all staff"], "example-people.pdf", "change"),
  ],
  technology: [
    ...ebs(["Legacy policy admin: LifePro, limited API surface","Fragmented data landscape — no 360° customer view"], "example-technology.pdf", "current"),
    ...ebs(["Cloud-native platform: modular, API-first, scalable","Single customer data platform across distribution, UW, claims"], "example-technology.pdf", "tobe"),
    ...ebs(["LifePro upgrade + API wrapper phase 1","CRM platform rollout — Phase 1 HK/Singapore"], "example-technology.pdf", "change"),
  ],
  portfolio:  eb(["Hygiene: Brand and presence, pricing benchmark, LifePro upgrade","Scenario I: WOL launch HK/Bermuda, broker portal uplift","Scenario I: Global sales build-out, customer journey redesign","Scenario II: DIFC hub, FA proposition Singapore, CRM platform"], "example-portfolio.pdf"),
};

// ── Local scoring engine ─────────────────────────────────────────────────────
function scoreBlock(bullets) {
  const texts = (bullets || []).map(b => typeof b === "string" ? b : b.text);
  const filled = texts.filter(b => b.trim().length > 3);
  if (filled.length === 0) return 0;
  let score = 30;
  score += Math.min(filled.length * 8, 40);
  const specific = filled.filter(b => /\d|%|KPI|goal|target|owner|budget|Q[1-4]|\$|€/i.test(b));
  score += Math.min(specific.length * 5, 20);
  const vague = filled.filter(b => b.trim().length < 15);
  score -= vague.length * 5;
  return Math.max(10, Math.min(100, score));
}

function getBlockStatus(blockId, docs, insights, bullets) {
  if (bullets[blockId]?.length > 0) return "done";
  if (insights[blockId]?.length > 0) return "insights";
  if (docs[blockId]?.length > 0) return "uploaded";
  return "empty";
}

// ── Consistency analysis ─────────────────────────────────────────────────────
function runConsistencyCheck(bullets) {
  const scores = {};
  BLOCKS.forEach(b => { scores[b.id] = scoreBlock(bullets[b.id] || []); });

  const issues = [];
  const filled = id => (bullets[id] || []).filter(b => (typeof b === "string" ? b : b.text).trim()).length;

  if (filled("strategy") >= 3 && filled("portfolio") < 2)
    issues.push({ severity: "high", blocks: ["strategy", "portfolio"], issueKey: "check.issue.strategy_portfolio" });
  if (filled("people") < 2 && filled("technology") >= 3)
    issues.push({ severity: "medium", blocks: ["people", "technology"], issueKey: "check.issue.people_technology" });
  if (filled("principles") < 2)
    issues.push({ severity: "medium", blocks: ["principles"], issueKey: "check.issue.principles" });
  if (filled("customers") >= 3 && filled("processes") < 2)
    issues.push({ severity: "low", blocks: ["customers", "processes"], issueKey: "check.issue.customers_processes" });
  if (issues.length === 0)
    issues.push({ severity: "low", blocks: ["strategy", "principles"], issueKey: "check.issue.default" });

  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / BLOCKS.length);

  return { scores, issues, overall };
}

// ── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  empty:    "border-l-4 border-l-transparent border border-slate-100 bg-white",
  uploaded: "border-l-4 border-l-[#1a365d] border border-slate-100 bg-white",
  insights: "border-l-4 border-l-amber-400 border border-slate-100 bg-white",
  done:     "border-l-4 border-l-[#8dc63f] border border-slate-100 bg-white",
};

const STATUS_BADGE_KEYS = {
  empty:    null,
  uploaded: { labelKey: "status.uploaded", color: "bg-[#1a365d]/10 text-[#1a365d]" },
  insights: { labelKey: "status.insights", color: "bg-amber-50 text-amber-700" },
  done:     { labelKey: "status.done",     color: "bg-[#8dc63f]/20 text-[#4a7c1f]" },
};

const SEV_COLOR = { high: "border-l-red-400 bg-red-50", medium: "border-l-amber-400 bg-amber-50", low: "border-l-slate-300 bg-slate-50" };
const SEV_TEXT  = { high: "text-red-600", medium: "text-amber-700", low: "text-slate-500" };

// ── Block Card (dashboard) ───────────────────────────────────────────────────
function BlockCard({ block, status, bullets, insightCount, onClick }) {
  const { t } = useLang();
  const badgeDef = STATUS_BADGE_KEYS[status];
  const badge = badgeDef ? { label: t(badgeDef.labelKey), color: badgeDef.color } : null;
  const isWide    = block.layout === "wide";
  const isHalf    = block.layout === "half";
  const isQuarter = block.layout === "quarter";
  const title = t(block.titleKey);
  const sub   = t(block.subKey);

  return (
    <div
      onClick={onClick}
      className={`
        p-6 rounded shadow-md hover:shadow-xl cursor-pointer transition-all group relative flex flex-col justify-between min-h-[160px]
        ${STATUS_COLORS[status]}
        ${isWide ? "col-span-12" : isHalf ? "col-span-6" : isQuarter ? "col-span-3" : "col-span-4"}
      `}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-[#1a365d] font-bold text-[13px] uppercase tracking-[0.12em] leading-tight" style={{fontFamily:"'Montserrat','Inter',sans-serif"}}>{title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 tracking-wide">{sub}</p>
          </div>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2 ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Bullet preview */}
        {block.hasSubs ? (
          <div className="space-y-1 mt-3">
            {(block.subTabs || PILLAR_SUBTABS).map(st => {
              const stBullets = (bullets || []).filter(b => b.subtab === st.id);
              if (stBullets.length === 0) return null;
              return (
                <div key={st.id}>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${st.color.split(" ")[1]}`}>{t(st.labelKey)}</span>
                  {stBullets.slice(0, 2).map((b, i) => (
                    <div key={i} className="flex items-start gap-2 mt-0.5">
                      <div className={`mt-1.5 w-1 h-1 rotate-45 shrink-0 ${st.dot}`} />
                      <span className="text-[13px] text-slate-700 leading-snug">{b.text}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {(bullets || []).length === 0 && (
              <p className="text-xs text-slate-500 italic uppercase tracking-tight">{t("status.empty")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 mt-3">
            {(bullets || []).slice(0, isWide ? 4 : 3).map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rotate-45 shrink-0" />
                <span className="text-[13px] text-slate-700 leading-snug">{typeof b === "string" ? b : b.text}</span>
              </div>
            ))}
            {(bullets || []).length === 0 && (
              <p className="text-xs text-slate-500 italic uppercase tracking-tight">{t("status.empty")}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
        {insightCount > 0 ? (
          <span className="text-[9px] font-bold text-orange-500 uppercase">{insightCount} {t("status.insights")}</span>
        ) : block.hasSubs ? (
          <div className="flex items-center gap-1.5">
            {(block.subTabs || PILLAR_SUBTABS).map(st => {
              const count = (bullets || []).filter(b => b.subtab === st.id).length;
              const filled = count > 0;
              return (
                <span
                  key={st.id}
                  className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border transition-all
                    ${filled
                      ? st.id === "current" ? "bg-slate-100 border-slate-300 text-slate-600"
                        : st.id === "tobe"    ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-orange-100 border-orange-300 text-orange-700"
                      : "bg-white border-slate-200 text-slate-300"}`}
                >
                  {t(st.labelKey)}{filled ? ` · ${count}` : ""}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-[9px] text-slate-300 uppercase">{(bullets || []).length} bullets</span>
        )}
        <ChevronRight size={18} className="text-slate-200 group-hover:text-[#8dc63f] transition-colors" />
      </div>
    </div>
  );
}

export { BLOCKS, PILLAR_SUBTABS, PRINCIPLES_SUBTABS, EXAMPLE_BULLETS, STATUS_COLORS, STATUS_BADGE_KEYS, SEV_COLOR, SEV_TEXT, scoreBlock, getBlockStatus, runConsistencyCheck };
export default BlockCard;
