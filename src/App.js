import { useState, useRef, useEffect } from "react";
import { LangProvider, useLang } from "./i18n";
import {
  Upload, Zap, CheckSquare, List, ChevronRight, X,
  Edit3, Trash2, Plus, ShieldCheck, CheckCircle2,
  AlertTriangle, FileText, BookOpen, Lightbulb, LogOut, Save, AlertOctagon,
  SlidersHorizontal, User, Building2, Layers, Users, Tag, Maximize2, ArrowLeft, Wand2, Database
} from "lucide-react";
import { saveCanvasUpload, loadUserCanvases, createCanvas, upsertCanvas, loadCanvasById, uploadDocumentToStorage, createImportJob, updateImportJob, indexDocumentChunks, searchDocumentChunks, loadDossierFiles, deleteDossierFile, deleteCanvas, loadStrategyCore, upsertStrategyCore, loadAnalysisItems, upsertAnalysisItem, deleteAnalysisItem, loadStrategicThemes, upsertStrategicTheme, deleteStrategicTheme, upsertKsfKpi, deleteKsfKpi } from "./services/canvasStorage";
import { AuthProvider, useAuth } from "./services/authContext";
import LoginScreen from "./LoginScreen";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";

// ── BTC Block definitions ────────────────────────────────────────────────────

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

// ── Sliding Panel ────────────────────────────────────────────────────────────
function BlockPanel({ block, docs, insights, bullets, canvasId, userId, onClose, onDocsChange, onInsightAccept, onInsightReject, onMoveToBullets, onDeleteBullet, onAddBullet, onShowTips }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("canvas");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newBullet, setNewBullet] = useState("");
  const [addingBullet, setAddingBullet] = useState(false);
  const [editedInsightTexts, setEditedInsightTexts] = useState({});
  const [activeSubTab, setActiveSubTab] = useState(() => block.subTabs?.[0]?.id || "current");

  const blockInsights = insights[block.id] || [];
  const blockBullets = bullets[block.id] || [];
  const pendingInsights = blockInsights.filter(i => i.status === "pending");
  const acceptedInsights = blockInsights.filter(i => i.status === "accepted");

  const TABS = [
    { id: "extract",  labelKey: "panel.tab.extract", icon: Zap },
    { id: "review",   labelKey: "panel.tab.review",  icon: CheckSquare },
    { id: "canvas",   labelKey: "panel.tab.canvas",  icon: List },
  ];

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.12)] z-30 flex flex-col">
      {/* Panel header */}
      <div className="px-8 py-5 bg-[#1a365d] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black text-lg uppercase tracking-tight">{t(block.titleKey)}</h2>
          <p className="text-[#1a365d] text-[10px] uppercase tracking-widest mt-0.5">{t(block.subKey)}</p>
        </div>
        <div className="flex items-center gap-3">
          {TIPS_DATA.nl[block.id] && (
            <button
              onClick={() => onShowTips(block.id)}
              className="flex items-center gap-1.5 text-white/40 hover:text-[#2c7a4b] transition-colors"
              title={t("tips.panel.button")}
            >
              <BookOpen size={15} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Tips</span>
            </button>
          )}
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors ml-1"><X size={22} /></button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all
              ${activeTab === tab.id ? "border-orange-500 text-[#001f33] bg-white" : "border-transparent text-slate-500 hover:text-[#001f33]"}`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* 1. EXTRACT */}
        {activeTab === "extract" && (
          <div className="space-y-4">
            {pendingInsights.length === 0 && acceptedInsights.length === 0 && (
              <div className="text-center py-16">
                <Zap size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("extract.empty")}</p>
                <p className="text-[9px] text-slate-300 mt-2">Upload documenten via Het Dossier</p>
              </div>
            )}

            {/* Counter */}
            {(pendingInsights.length > 0 || acceptedInsights.length > 0) && (
              <div className="flex gap-4 pb-3 border-b border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{t("extract.pending", { n: pendingInsights.length })}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-green-600">{t("extract.accepted", { n: acceptedInsights.length })}</span>
              </div>
            )}

            {/* Pending insights — accept or reject only */}
            {pendingInsights.map(ins => (
              <div key={ins.id} className="p-5 bg-slate-50 border border-slate-200 border-l-4 border-l-[#00AEEF] rounded-sm">
                <p className="text-sm text-slate-800 leading-relaxed mb-4">{ins.text}</p>
                {ins.source && (
                  <p className="text-[9px] text-slate-400 mb-3 italic">{t("extract.source")} {ins.source}</p>
                )}
                <div className="flex gap-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onInsightAccept(block.id, ins.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline"
                  >
                    {t("extract.accept")}
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500"
                  >
                    {t("extract.reject")}
                  </button>
                </div>
              </div>
            ))}

            {/* Accepted summary cards */}
            {acceptedInsights.length > 0 && (
              <div className="space-y-2">
                {acceptedInsights.map(ins => (
                  <div key={ins.id} className="flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-sm">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 leading-snug flex-1">{ins.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Go to review — only when no more pending */}
            {pendingInsights.length === 0 && acceptedInsights.length > 0 && (
              <button
                onClick={() => setActiveTab("review")}
                className="w-full py-3 bg-[#001f33] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#00AEEF] transition-colors mt-2"
              >
                {t("extract.go.review", { n: acceptedInsights.length })}
              </button>
            )}
          </div>
        )}

        {/* 3. REVIEW */}
        {activeTab === "review" && (
          <div className="space-y-4">
            {acceptedInsights.length === 0 && (
              <div className="text-center py-16">
                <CheckSquare size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("review.empty")}</p>
                <button onClick={() => setActiveTab("extract")} className="mt-4 text-xs text-[#1a365d] font-bold hover:underline">{t("review.back")}</button>
              </div>
            )}
            {acceptedInsights.length > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {t("review.subtitle", { n: acceptedInsights.length })}
                </p>
                <button
                  onClick={() => {
                    acceptedInsights.forEach(ins => {
                      const text = (editedInsightTexts[ins.id] ?? ins.text).trim();
                      if (text) onMoveToBullets(block.id, { ...ins, text });
                    });
                  }}
                  className="text-[9px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors"
                >
                  {t("review.all.to.canvas")}
                </button>
              </div>
            )}
            {acceptedInsights.map(ins => (
              <div key={ins.id} className="p-4 border border-slate-200 bg-white rounded-sm shadow-sm space-y-3">
                {ins.source && (
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} className="text-slate-300 shrink-0" />
                    <span className="text-[9px] text-slate-400 italic">{ins.source}</span>
                  </div>
                )}
                <textarea
                  value={editedInsightTexts[ins.id] ?? ins.text}
                  onChange={e => setEditedInsightTexts(prev => ({ ...prev, [ins.id]: e.target.value }))}
                  rows={3}
                  className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-sm p-3 resize-none focus:outline-none focus:border-[#1a365d] bg-slate-50 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = (editedInsightTexts[ins.id] ?? ins.text).trim();
                      if (text) onMoveToBullets(block.id, { ...ins, text });
                    }}
                    className="flex-1 py-2.5 bg-[#1a365d] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#2c7a4b] transition-colors"
                  >
                    {t("review.to.canvas")}
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 rounded-sm hover:border-red-200 transition-colors"
                  >
                    {t("review.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. CANVAS */}
        {activeTab === "canvas" && (
          <div className="space-y-3">

            {block.hasSubs ? (
              /* ── Pillar blocks: Current / To-Be / Change sub-tabs ── */
              <>
                {/* Sub-tab nav */}
                <div className="flex gap-2 pb-4 border-b border-slate-100">
                  {(block.subTabs || PILLAR_SUBTABS).map(st => {
                    const count = blockBullets.filter(b => b.subtab === st.id).length;
                    const isActive = activeSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => { setActiveSubTab(st.id); setAddingBullet(false); setEditingIdx(null); }}
                        className={`flex-1 py-2 px-3 rounded-sm border text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-0.5
                          ${isActive ? st.activeBg + " " + st.color.split(" ")[1] : "border-slate-100 text-slate-400 bg-white hover:border-slate-200"}`}
                      >
                        <div className={`w-1.5 h-1.5 rotate-45 mb-0.5 ${isActive ? st.dot : "bg-slate-300"}`} />
                        {t(st.labelKey)}
                        {count > 0 && <span className="text-[8px]">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab bullet list */}
                {(() => {
                  const st = (block.subTabs || PILLAR_SUBTABS).find(s => s.id === activeSubTab) || (block.subTabs || PILLAR_SUBTABS)[0];
                  const stBullets = blockBullets.map((b, i) => ({ ...b, _idx: i })).filter(b => b.subtab === activeSubTab);
                  return (
                    <div className="space-y-2">
                      {stBullets.map(bullet => {
                        const i = bullet._idx;
                        const bulletText   = bullet.text;
                        const bulletSource = bullet.source;
                        return (
                          <div key={i} className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-sm hover:shadow-sm transition-all">
                            <div className={`mt-1.5 w-2 h-2 rotate-45 shrink-0 ${st.dot}`} />
                            <div className="flex-1 min-w-0">
                              {editingIdx === i ? (
                                <div className="flex gap-2">
                                  <input
                                    autoFocus
                                    value={editVal}
                                    onChange={e => setEditVal(e.target.value)}
                                    className="flex-1 text-sm border-b border-[#1a365d] outline-none text-slate-800 bg-transparent"
                                    onKeyDown={e => {
                                      if (e.key === "Enter") { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }
                                      if (e.key === "Escape") setEditingIdx(null);
                                    }}
                                  />
                                  <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }} className="text-[10px] text-green-600 font-bold">✓</button>
                                  <button onClick={() => setEditingIdx(null)} className="text-[10px] text-slate-400 font-bold">✕</button>
                                </div>
                              ) : (
                                <span className="text-[14px] text-slate-700 leading-snug block">{bulletText}</span>
                              )}
                              {bulletSource && editingIdx !== i && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FileText size={10} className="text-slate-300 shrink-0" />
                                  <span className="text-[10px] text-slate-500 italic truncate">{bulletSource}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 items-center">
                              {/* Move to other sub-tab */}
                              <select
                                value={activeSubTab}
                                onChange={e => onMoveToBullets(block.id, { text: bulletText, source: bulletSource, subtab: e.target.value }, i, true)}
                                className="text-[9px] text-slate-400 bg-white border border-slate-200 rounded-sm px-1 py-0.5 outline-none hover:border-[#1a365d] cursor-pointer"
                                title={t("canvas.move.to")}
                              >
                                {(block.subTabs || PILLAR_SUBTABS).map(s => (
                                  <option key={s.id} value={s.id} disabled={s.id === activeSubTab}>{t(s.labelKey)}</option>
                                ))}
                              </select>
                              <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#2c7a4b]"><Edit3 size={14} /></button>
                              <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}

                      {addingBullet && (
                        <div className="flex items-center gap-2 p-3 border border-dashed border-[#1a365d] rounded-sm">
                          <div className={`w-2 h-2 rotate-45 shrink-0 ${st.dot}`} />
                          <textarea
                            autoFocus
                            value={newBullet}
                            onChange={e => setNewBullet(e.target.value)}
                            placeholder={`${t("canvas.add.manual")} ${t(st.labelKey).toLowerCase()}…`}
                            rows={3}
                            className="flex-1 text-sm outline-none text-slate-800 resize-none leading-relaxed"
                            onKeyDown={e => {
                              if (e.key === "Enter" && e.metaKey && newBullet.trim()) {
                                onAddBullet(block.id, newBullet.trim(), activeSubTab);
                                setNewBullet("");
                                setAddingBullet(false);
                              }
                              if (e.key === "Escape") { setAddingBullet(false); setNewBullet(""); }
                            }}
                          />
                          <button onClick={() => setAddingBullet(false)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                        </div>
                      )}

                      {stBullets.length === 0 && !addingBullet && (
                        <div className="text-center py-8">
                          <div className={`w-4 h-4 rotate-45 mx-auto mb-3 ${st.dot} opacity-20`} />
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("canvas.empty.sub", { label: t(st.labelKey) })}</p>
                          <p className="text-[9px] text-slate-300 mt-1">{t("canvas.empty.hint")}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setAddingBullet(true)}
                        className="flex items-center gap-1 text-[10px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors pt-1"
                      >
                        <Plus size={14} /> {t("canvas.add.manual")}
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : (
              /* ── Non-pillar blocks: flat list (unchanged) ── */
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-[9px] font-black text-[#001f33] uppercase tracking-widest">{t("canvas.bullets.count", { n: blockBullets.length })}</span>
                  {blockBullets.length < 7 && (
                    <button
                      onClick={() => setAddingBullet(true)}
                      className="flex items-center gap-1 text-[10px] font-black text-[#1a365d] hover:text-orange-500 uppercase tracking-widest transition-colors"
                    >
                      <Plus size={14} /> {t("canvas.add.manual")}
                    </button>
                  )}
                </div>

                {blockBullets.map((bullet, i) => {
                  const bulletText   = typeof bullet === "string" ? bullet : bullet.text;
                  const bulletSource = typeof bullet === "string" ? null  : bullet.source;
                  return (
                    <div key={i} className="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-sm hover:shadow-sm transition-all">
                      <div className="mt-1.5 w-2 h-2 bg-orange-500 rotate-45 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {editingIdx === i ? (
                          <div className="flex flex-col gap-2 w-full">
                            <textarea
                              autoFocus
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              rows={3}
                              className="w-full text-sm border border-[#1a365d] rounded-sm outline-none text-slate-800 bg-slate-50 p-2 resize-none leading-relaxed"
                              onKeyDown={e => {
                                if (e.key === "Enter" && e.metaKey) { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }
                                if (e.key === "Escape") setEditingIdx(null);
                              }}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }} className="text-[10px] px-3 py-1 bg-[#1a365d] text-white rounded-sm font-bold">Opslaan</button>
                              <button onClick={() => setEditingIdx(null)} className="text-[10px] px-3 py-1 border border-slate-200 text-slate-400 rounded-sm font-bold">Annuleer</button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-700 leading-snug block">{bulletText}</span>
                        )}
                        {bulletSource && editingIdx !== i && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText size={10} className="text-slate-300 shrink-0" />
                            <span className="text-[10px] text-slate-500 italic truncate">{bulletSource}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#2c7a4b]"><Edit3 size={14} /></button>
                        <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}

                {addingBullet && (
                  <div className="flex flex-col gap-2 p-3 border border-dashed border-[#1a365d] rounded-sm">
                    <textarea
                      autoFocus
                      value={newBullet}
                      onChange={e => setNewBullet(e.target.value)}
                      placeholder={t("canvas.placeholder")}
                      rows={3}
                      className="w-full text-sm outline-none text-slate-800 resize-none leading-relaxed bg-transparent"
                      onKeyDown={e => {
                        if (e.key === "Enter" && e.metaKey && newBullet.trim()) {
                          onAddBullet(block.id, newBullet.trim(), null);
                          setNewBullet("");
                          setAddingBullet(false);
                        }
                        if (e.key === "Escape") { setAddingBullet(false); setNewBullet(""); }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-300">⌘ + Enter om op te slaan</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { if (newBullet.trim()) { onAddBullet(block.id, newBullet.trim(), null); setNewBullet(""); setAddingBullet(false); } }}
                          className="text-[10px] px-3 py-1 bg-[#1a365d] text-white rounded-sm font-bold"
                        >Toevoegen</button>
                        <button onClick={() => { setAddingBullet(false); setNewBullet(""); }} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    </div>
                  </div>
                )}

                {blockBullets.length === 0 && !addingBullet && (
                  <div className="text-center py-12">
                    <List size={28} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("canvas.empty.flat")}</p>
                    <p className="text-[9px] text-slate-300 mt-1">{t("canvas.empty.flat.hint")}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Consistency Check Modal ──────────────────────────────────────────────────
function ConsistencyModal({ bullets, onClose }) {
  const { t } = useLang();
  const { scores, issues, overall } = runConsistencyCheck(bullets);
  const scoreColor = v => v >= 70 ? "text-green-600" : v >= 45 ? "text-orange-500" : "text-red-500";
  const barColor  = v => v >= 70 ? "bg-green-500" : v >= 45 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="fixed inset-0 bg-[#001f33]/95 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#1a365d] max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#001f33] font-black text-2xl uppercase tracking-tighter">{t("consistency.title")}</h2>
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

// ── Tips & Tricks data (NL + EN) ─────────────────────────────────────────────
const TIPS_DATA = {
  nl: {
    algemeen: {
      title: "Algemeen", icon: Lightbulb,
      intro: "Op basis van het boek Business Transformatie Canvas van Marc Beijen, Ruben Heetebrij en Roos Tigchelaar.",
      tips: [
        { kop: "Gebruik het als kapstok, niet als kookboek", tekst: "Het canvas is een framework om een aanpak op maat te maken, geen rigide stappenplan dat blind gevolgd moet worden." },
        { kop: "Focus op samenhang", tekst: "De kracht van het canvas zit in de verbinding tussen de bouwstenen (horizontale samenhang) en de vertaling van strategie naar uitvoering (verticale samenhang)." },
        { kop: "Time-boxing", tekst: "Ga uit van een iteratief proces. Het is vaak beter om in vier weken een 80%-versie te hebben dan in een half jaar een 100%-versie." },
        { kop: "Het magische getal is 7", tekst: "Beperk uitwerkingen tot de essentie om overzicht te behouden — maximaal zeven strategische thema's of veranderinitiatieven per blok." },
        { kop: "Gebruik wat er al is", tekst: "Het is niet de bedoeling alles opnieuw te bedenken. Vlecht bestaande marketingplannen of IT-architecturen in de structuur van het canvas." },
        { kop: "Begeleid de onderstroom", tekst: "Succes hangt niet alleen af van het harde ontwerp (de bovenstroom), maar vooral van hoe mensen de verandering begrijpen, willen en kunnen toepassen." },
      ],
    },
    strategy: {
      title: "Strategie", icon: null,
      intro: "De strategie vormt het fundament van het hele canvas. Alles wat volgt moet hieruit logisch afleiden.",
      tips: [
        { kop: "Maak het inspirerend", tekst: "Een strategie moet vooral motiveren en de neuzen dezelfde kant op krijgen. Kies krachtige taal boven management-jargon." },
        { kop: "Outside-in & Inside-out", tekst: "Combineer een omgevingsanalyse (kansen/bedreigingen) met een eerlijke blik op de eigen organisatie (sterkten/zwakten). Beide lenzen zijn nodig." },
        { kop: "BCG-matrix", tekst: "Gebruik dit hulpmiddel om scherpe keuzes te maken in welke product/markt-combinaties je investeert of waarvan je afscheid neemt." },
      ],
    },
    principles: {
      title: "Richtlijnen", icon: null,
      intro: "Richtlijnen zijn de spelregels die alle keuzes in de vier pijlers sturen en begrenzen.",
      tips: [
        { kop: "'Tight-loose' karakter", tekst: "Bepaal per principe of het strak (verplichtend voor synergie) of los (vrijheidsgraden voor autonomie) moet zijn." },
        { kop: "Formuleer implicaties", tekst: "Een principe is pas duidelijk als ook de consequenties zijn benoemd: 'wat betekent dit concreet voor ons?'" },
        { kop: "Wisselwerking", tekst: "Gebruik de principes om de keuzevrijheid in de andere pijlers bewust te beperken en zo consistentie te borgen." },
      ],
    },
    customers: {
      title: "Klanten & Diensten", icon: null,
      intro: "Wie bedien je, hoe bereik je ze, en wat lever je hen? Dit blok verbindt de strategie met de dagelijkse klantbeleving.",
      tips: [
        { kop: "Life events als triggers", tekst: "Denk bij klantbehoeften aan gebeurtenissen in het leven van de klant (zoals verhuizen of trouwen) om relevante proposities te ontwerpen." },
        { kop: "Omnichannel-denken", tekst: "Zorg dat de klantervaring naadloos is over alle kanalen heen. De klant ervaart geen kanaalwisseling — de organisatie mag dat ook niet." },
        { kop: "Maak het visueel", tekst: "Vat klantgroepen, klantreizen en distributiekanalen samen op één pagina voor maximale adoptie binnen de organisatie." },
      ],
    },
    processes: {
      title: "Proces & Organisatie", icon: null,
      intro: "Hoe richt je de organisatie en processen in om de klantambities en strategie daadwerkelijk waar te maken?",
      tips: [
        { kop: "Waardestromen als basis", tekst: "Richt de organisatie in langs de weg waarop waarde voor de klant wordt gecreëerd, in plaats van puur functionele afdelingen." },
        { kop: "Vereenvoudig", tekst: "Gebruik de transformatie om ballast uit het verleden weg te snijden. Complexiteit die ooit nuttig was, is dat nu misschien niet meer." },
        { kop: "Standaardiseer waar mogelijk", tekst: "Stop met doen alsof alles uniek is. Gebruik marktstandaarden voor ondersteunende processen en focus maatwerk op de unieke 10–20%." },
      ],
    },
    people: {
      title: "Mensen & Competenties", icon: null,
      intro: "Transformatie staat of valt met mensen. Wat vraagt de nieuwe koers van leiderschap, teams en cultuur?",
      tips: [
        { kop: "Maak de zachte kant 'hard'", tekst: "Benoem expliciet welke kennis, vaardigheden en leiderschapsstijl nodig zijn om de strategie te laten slagen. Maak het concreet en meetbaar." },
        { kop: "Betrek de werkvloer", tekst: "De beste ideeën voor verbetering komen vaak van de mensen die het dichtst bij de klant staan. Organiseer dat structureel." },
        { kop: "Focus op verandervermogen", tekst: "Veranderen is tegenwoordig een kerncompetentie. Investeer in een cultuur van continu leren — niet alleen in dit traject." },
      ],
    },
    technology: {
      title: "Informatie & Technologie", icon: null,
      intro: "Technologie en data als versneller van de transformatie, niet als beperkende factor.",
      tips: [
        { kop: "IT als versneller", tekst: "Zie technologie niet als een kostenpost of 'lastig domein', maar als een inspiratiebron en enabler voor nieuwe businessmodellen." },
        { kop: "Data als asset", tekst: "Geavanceerde analyses zijn noodzakelijk om klantgedrag te begrijpen en gepersonaliseerde diensten te bieden. Data is strategie." },
        { kop: "Cloud-first", tekst: "Infrastructuur moet 'als water uit de kraan' komen, zodat de focus kan liggen op connectiviteit, veiligheid en innovatie." },
      ],
    },
    portfolio: {
      title: "Veranderprogramma", icon: null,
      intro: "Het veranderprogramma vertaalt de ambities naar concrete initiatieven met prioriteit, fasering en eigenaarschap.",
      tips: [
        { kop: "Eet de olifant in stukjes", tekst: "Cluster losse veranderacties tot behapbare initiatieven met een logische fasering. Groot denken, klein beginnen." },
        { kop: "Objectieve prioritering", tekst: "Voorkom dat de manager die het hardst roept altijd voorrang krijgt. Weeg initiatieven af op businesswaarde én haalbaarheid." },
        { kop: "Continu herijken", tekst: "Een roadmap is niet in beton gegoten. Stuur bij op basis van feedback en veranderende externe omstandigheden." },
      ],
    },
  },

  en: {
    algemeen: {
      title: "General", icon: Lightbulb,
      intro: "Based on the book Business Transformation Canvas by Marc Beijen, Ruben Heetebrij and Roos Tigchelaar.",
      tips: [
        { kop: "Use it as a coat rack, not a cookbook", tekst: "The canvas is a framework for crafting a tailored approach — not a rigid step-by-step plan to follow blindly." },
        { kop: "Focus on coherence", tekst: "The power of the canvas lies in the connections between building blocks (horizontal coherence) and the translation from strategy to execution (vertical coherence)." },
        { kop: "Time-boxing", tekst: "Work iteratively. It is often better to have an 80% version in four weeks than a 100% version in six months." },
        { kop: "The magic number is 7", tekst: "Keep each block concise to maintain overview — no more than seven strategic themes or change initiatives per block." },
        { kop: "Use what already exists", tekst: "The goal is not to reinvent everything. Weave existing marketing plans or IT architectures into the structure of the canvas." },
        { kop: "Guide the undercurrent", tekst: "Success depends not only on the hard design (the formal plan) but especially on how people understand, embrace, and apply the change." },
      ],
    },
    strategy: {
      title: "Strategy", icon: null,
      intro: "The strategy forms the foundation of the entire canvas. Everything that follows must logically derive from it.",
      tips: [
        { kop: "Make it inspiring", tekst: "A strategy must motivate and align people. Choose powerful language over management jargon." },
        { kop: "Outside-in & Inside-out", tekst: "Combine an environmental analysis (opportunities/threats) with an honest look at the organisation itself (strengths/weaknesses). Both lenses are necessary." },
        { kop: "BCG matrix", tekst: "Use this tool to make sharp choices about which product/market combinations to invest in and which to exit." },
      ],
    },
    principles: {
      title: "Guiding Principles", icon: null,
      intro: "Guiding principles are the design rules that steer and constrain all choices across the four pillars.",
      tips: [
        { kop: "'Tight-loose' character", tekst: "Determine per principle whether it should be tight (mandatory for synergy) or loose (degrees of freedom for autonomy)." },
        { kop: "Formulate implications", tekst: "A principle only becomes clear when its consequences are also named: 'what does this mean concretely for us?'" },
        { kop: "Interplay", tekst: "Use the principles to deliberately constrain freedom of choice in the other pillars and ensure consistency." },
      ],
    },
    customers: {
      title: "Customers & Services", icon: null,
      intro: "Who do you serve, how do you reach them, and what do you deliver? This block connects strategy to everyday customer experience.",
      tips: [
        { kop: "Life events as triggers", tekst: "Think of customer needs in terms of life events (such as moving house or getting married) to design relevant propositions." },
        { kop: "Omnichannel thinking", tekst: "Ensure the customer experience is seamless across all channels. The customer experiences no channel switching — the organisation should not either." },
        { kop: "Make it visual", tekst: "Summarise customer groups, journeys, and distribution channels on a single page for maximum adoption across the organisation." },
      ],
    },
    processes: {
      title: "Processes & Organisation", icon: null,
      intro: "How do you organise processes and structure to genuinely deliver on customer ambitions and strategy?",
      tips: [
        { kop: "Value streams as the basis", tekst: "Organise around the path through which value is created for the customer, rather than purely functional departments." },
        { kop: "Simplify", tekst: "Use the transformation to cut away baggage from the past. Complexity that was once useful may no longer be." },
        { kop: "Standardise where possible", tekst: "Stop pretending everything is unique. Use market standards for supporting processes and focus customisation on the distinctive 10–20%." },
      ],
    },
    people: {
      title: "People & Competencies", icon: null,
      intro: "Transformation stands or falls with people. What does the new direction demand of leadership, teams, and culture?",
      tips: [
        { kop: "Make the soft side 'hard'", tekst: "Explicitly name what knowledge, skills, and leadership style are needed to make the strategy succeed. Make it concrete and measurable." },
        { kop: "Involve the frontline", tekst: "The best ideas for improvement often come from the people closest to the customer. Organise this structurally." },
        { kop: "Focus on change capability", tekst: "Adapting to change is now a core competency. Invest in a culture of continuous learning — not just for this programme." },
      ],
    },
    technology: {
      title: "Information & Technology", icon: null,
      intro: "Technology and data as an accelerator of transformation, not a limiting factor.",
      tips: [
        { kop: "IT as accelerator", tekst: "See technology not as a cost item or 'difficult domain', but as a source of inspiration and an enabler of new business models." },
        { kop: "Data as an asset", tekst: "Advanced analytics are essential for understanding customer behaviour and delivering personalised services. Data is strategy." },
        { kop: "Cloud-first", tekst: "Infrastructure should be available 'like water from a tap', so focus can be placed on connectivity, security, and innovation." },
      ],
    },
    portfolio: {
      title: "Change Portfolio", icon: null,
      intro: "The change portfolio translates ambitions into concrete initiatives with priority, phasing, and ownership.",
      tips: [
        { kop: "Eat the elephant in pieces", tekst: "Cluster individual change actions into manageable initiatives with a logical phasing. Think big, start small." },
        { kop: "Objective prioritisation", tekst: "Prevent the loudest manager always getting priority. Weigh initiatives on business value and feasibility." },
        { kop: "Continuously recalibrate", tekst: "A roadmap is not set in stone. Adjust based on feedback and changing external circumstances." },
      ],
    },
  },
};

// TIPS_NAV wordt dynamisch gebouwd in de TipsModal via useLang()

// ── Tips Modal ────────────────────────────────────────────────────────────────
function TipsModal({ onClose, initialSection }) {
  const { t, lang } = useLang();
  const [activeSection, setActiveSection] = useState(initialSection || "algemeen");
  const TIPS = TIPS_DATA[lang] || TIPS_DATA.nl;
  const section = TIPS[activeSection] || TIPS.algemeen;
  const TIPS_NAV = [
    { key: "algemeen", label: t("tips.general") },
    ...BLOCKS.map(b => ({ key: b.id, label: t(b.titleKey) })),
  ];

  return (
    <div className="fixed inset-0 bg-[#001f33]/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#1a365d] flex overflow-hidden" style={{ height: "80vh" }}>

        {/* Left nav */}
        <div className="w-52 bg-[#001f33] flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen size={14} className="text-[#1a365d]" />
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{t("tips.title")}</span>
            </div>
            <p className="text-[9px] text-white/30 leading-snug mt-1">{t("tips.subtitle")}</p>
          </div>
          <nav className="flex-1 overflow-y-auto py-3">
            {TIPS_NAV.map((item, idx) => {
              const isActive = activeSection === item.key;
              const isFirst = idx === 0;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full text-left px-5 py-2.5 text-xs transition-all flex items-center gap-2
                    ${isActive
                      ? "bg-[#00AEEF]/20 text-white font-bold border-l-2 border-[#1a365d]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"}
                    ${isFirst ? "mb-1" : ""}`}
                >
                  {isFirst && <Lightbulb size={12} className={isActive ? "text-[#1a365d]" : "text-white/30"} />}
                  {!isFirst && <div className={`w-1.5 h-1.5 rotate-45 shrink-0 ${isActive ? "bg-orange-400" : "bg-white/20"}`} />}
                  <span className={isFirst ? "text-[10px] uppercase tracking-wider" : ""}>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-[8px] text-white/20 leading-relaxed">{t("tips.footer")}</p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-[#001f33] font-black text-xl uppercase tracking-tight">{section.title}</h2>
              {section.intro && (
                <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-lg">{section.intro}</p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors ml-4 shrink-0 mt-1">
              <X size={22} />
            </button>
          </div>

          {/* Tips list */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
            {section.tips.map((tip, i) => (
              <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-sm hover:border-[#1a365d]/30 transition-colors">
                <div className="shrink-0 mt-1">
                  <div className="w-2 h-2 bg-orange-500 rotate-45" />
                </div>
                <div>
                  <h3 className="text-[#001f33] font-black text-sm mb-1">{tip.kop}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{tip.tekst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer nav */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <button
              onClick={() => {
                const idx = TIPS_NAV.findIndex(t => t.key === activeSection);
                if (idx > 0) setActiveSection(TIPS_NAV[idx - 1].key);
              }}
              disabled={TIPS_NAV.findIndex(t => t.key === activeSection) === 0}
              className="text-[10px] font-bold text-slate-400 hover:text-[#001f33] uppercase tracking-wider disabled:opacity-20 transition-colors"
            >
              {t("tips.prev")}
            </button>
            <span className="text-[9px] text-slate-300 uppercase tracking-widest">
              {TIPS_NAV.findIndex(t => t.key === activeSection) + 1} / {TIPS_NAV.length}
            </span>
            <button
              onClick={() => {
                const idx = TIPS_NAV.findIndex(t => t.key === activeSection);
                if (idx < TIPS_NAV.length - 1) setActiveSection(TIPS_NAV[idx + 1].key);
              }}
              disabled={TIPS_NAV.findIndex(t => t.key === activeSection) === TIPS_NAV.length - 1}
              className="text-[10px] font-bold text-slate-400 hover:text-[#001f33] uppercase tracking-wider disabled:opacity-20 transition-colors"
            >
              {t("tips.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Manager (Supabase) ────────────────────────────────────────────────

/**
 * CanvasMenu — toont huidige canvas naam + dropdown met alle canvassen.
 * Props worden van AppInner doorgegeven; geen eigen state voor de lijst.
 */
function CanvasMenu({ currentName, activeCanvasId, canvases, onNew, onSelect, onRename, onLoadExample, onDelete }) {
  const { t } = useLang();
  const [open, setOpen]                     = useState(false);
  const [editingName, setEditingName]       = useState(false);
  const [draftName, setDraftName]           = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const displayName = currentName || t("menu.unnamed");

  const commitRename = () => {
    if (draftName.trim()) onRename(draftName.trim());
    setEditingName(false);
  };

  return (
    <div className="relative flex items-center">
      {/* Canvas naam (klikbaar) of inline edit */}
      {editingName ? (
        <input
          autoFocus
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === "Enter")  commitRename();
            if (e.key === "Escape") setEditingName(false);
          }}
          className="bg-transparent border-b border-white/40 text-white text-base font-semibold outline-none w-64 pb-0.5 placeholder-white/40"
          placeholder="Canvas naam…"
        />
      ) : (
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 group">
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-white/55 uppercase tracking-[0.2em] font-medium leading-none mb-1">{t("header.active.canvas")}</span>
            <span className="text-white font-semibold text-[15px] leading-none group-hover:text-[#8dc63f] transition-colors">
              {displayName}
            </span>
          </div>
          <svg width="10" height="6" viewBox="0 0 10 6" className={`text-white/40 group-hover:text-white transition-all mt-2 ${open ? "rotate-180" : ""}`} fill="currentColor">
            <path d="M0 0l5 6 5-6H0z"/>
          </svg>
        </button>
      )}

      {/* Potlood: naam bewerken */}
      {!editingName && (
        <button
          onClick={() => { setDraftName(currentName || ""); setEditingName(true); setOpen(false); }}
          className="ml-2 mt-1 text-white/50 hover:text-white transition-colors"
          title={t("menu.edit.name")}
        >
          <Edit3 size={12} />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-3 w-72 bg-white rounded-sm shadow-2xl border border-slate-200 z-50 overflow-hidden">

            <div className="p-3 space-y-1 border-b border-slate-100">
              {/* Nieuw canvas */}
              <button
                onClick={() => { onNew(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border border-dashed border-slate-200 hover:border-[#1a365d] transition-colors"
              >
                <Plus size={13} className="text-[#1a365d] shrink-0" />
                <span className="font-semibold">{t("menu.new.canvas")}</span>
              </button>
              {/* Voorbeeld laden */}
              <button
                onClick={() => { onLoadExample(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <FileText size={13} className="text-slate-400 shrink-0" />
                <span>{t("menu.load.example")}</span>
              </button>
            </div>

            {/* Opgeslagen canvassen uit Supabase */}
            {canvases.length > 0 && (
              <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1">{t("menu.saved")}</p>
                {canvases.map(c => {
                  const createdAt = c.created_at
                    ? new Date(c.created_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
                    : "";
                  const docCount   = c.canvas_uploads?.length ?? 0;
                  const isActive   = c.id === activeCanvasId;
                  const isConfirm  = confirmDeleteId === c.id;

                  // Bevestigingsbalk
                  if (isConfirm) return (
                    <div key={c.id} className="px-3 py-2 rounded-sm bg-red-50 border border-red-200">
                      <p className="text-[10px] font-semibold text-red-700 mb-1.5 truncate">
                        Verwijder "{c.name || "Naamloos"}"?
                      </p>
                      <p className="text-[9px] text-red-500 mb-2">Dit verwijdert ook alle geüploade documenten en chunks.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { onDelete(c.id); setConfirmDeleteId(null); setOpen(false); }}
                          className="flex-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1 transition-colors"
                        >
                          Ja, verwijder
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded px-2 py-1 transition-colors"
                        >
                          Annuleer
                        </button>
                      </div>
                    </div>
                  );

                  return (
                    <div key={c.id} className={`group/item rounded-sm flex items-center gap-1 transition-colors
                      ${isActive ? "bg-[#1a365d]/5 border border-[#1a365d]/20" : "hover:bg-slate-50"}`}>
                      <button
                        onClick={() => { onSelect(c); setOpen(false); }}
                        className="flex-1 text-left px-3 py-2.5 min-w-0"
                      >
                        <p className="text-xs font-semibold text-slate-700 truncate">{c.name || t("menu.unnamed")}</p>
                        <p className="text-[9px] text-slate-400">Aangemaakt {createdAt} · {docCount} {docCount === 1 ? "document" : "documenten"}</p>
                      </button>
                      {isActive
                        ? <span className="text-[8px] font-bold text-[#1a365d]/60 uppercase tracking-widest pr-3 flex-shrink-0">Actief</span>
                        : (
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id); }}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity pr-2.5 text-slate-300 hover:text-red-400 flex-shrink-0"
                            title="Canvas verwijderen"
                          >
                            <Trash2 size={13} />
                          </button>
                        )
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {canvases.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-400">Nog geen opgeslagen canvassen</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Project Info Sidebar ─────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  "Finance", "Healthcare", "Industry", "Public", "Retail",
  "Energy", "Professional Services", "Other",
];
const TRANSFORMATION_OPTIONS = [
  "Digitaal/IT", "Cultuur & Gedrag", "Duurzaamheid (ESG)",
  "Strategische Heroriëntatie", "Fusie/Overname",
];
const ORG_SIZE_OPTIONS = ["< 100 fte", "100-500 fte", "500-2500 fte", "2500+ fte"];
const PROJECT_STATUS_OPTIONS = [
  { value: "concept",   label: "Concept",   color: "bg-slate-100 text-slate-600 border-slate-300" },
  { value: "review",    label: "In Review", color: "bg-amber-50 text-amber-700 border-amber-300"  },
  { value: "definitief",label: "Definitief",color: "bg-[#8dc63f]/20 text-[#4a7c1f] border-[#8dc63f]" },
];

function ProjectInfoSidebar({ meta, onChange }) {
  const field = (key, value) => onChange({ ...meta, [key]: value });

  return (
    <aside className="w-[280px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-[#1a365d] uppercase tracking-[0.15em]">Project Details</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Metadata voor analyse & benchmarks</p>
      </div>

      <div className="px-5 py-4 space-y-5 flex-1">

        {/* Klantnaam */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Building2 size={11} /> Klantnaam
          </label>
          <input
            type="text"
            value={meta.client_name || ""}
            onChange={e => field("client_name", e.target.value)}
            placeholder="Naam van de klant…"
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300"
          />
        </div>

        {/* Lead Consultant */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <User size={11} /> Lead Consultant
          </label>
          <input
            type="text"
            value={meta.author_name || ""}
            onChange={e => field("author_name", e.target.value)}
            placeholder="Naam van de consultant…"
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300"
          />
        </div>

        {/* Branche */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Layers size={11} /> Branche
          </label>
          <select
            value={meta.industry || ""}
            onChange={e => field("industry", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer branche…</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Type Transformatie */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Tag size={11} /> Type Transformatie
          </label>
          <select
            value={meta.transformation_type || ""}
            onChange={e => field("transformation_type", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer type…</option>
            {TRANSFORMATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Organisatiegrootte */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <Users size={11} /> Organisatiegrootte
          </label>
          <select
            value={meta.org_size || ""}
            onChange={e => field("org_size", e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors bg-white"
          >
            <option value="">Selecteer grootte…</option>
            {ORG_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Projectstatus */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-2">
            <ShieldCheck size={11} /> Projectstatus
          </label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => field("project_status", meta.project_status === opt.value ? "" : opt.value)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border uppercase tracking-wider transition-all
                  ${meta.project_status === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Beschrijving */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#1a365d] uppercase tracking-widest mb-1.5">
            <FileText size={11} /> Beschrijving
          </label>
          <textarea
            value={meta.project_description || ""}
            onChange={e => field("project_description", e.target.value)}
            placeholder="Aanleiding, scope of bijzonderheden van dit traject…"
            rows={4}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#1a365d] transition-colors placeholder-slate-300 resize-none leading-relaxed"
          />
        </div>

      </div>
    </aside>
  );
}

// ── Dossier — document import + kennisbank ───────────────────────────────────
const IMPORT_PHASES = {
  queued:    { label: "In wachtrij", pct: 0,   color: "bg-slate-200"  },
  uploading: { label: "Uploaden…",   pct: 25,  color: "bg-[#00AEEF]" },
  reading:   { label: "Lezen…",      pct: 55,  color: "bg-amber-400"  },
  indexing:  { label: "Indexeren…",  pct: 80,  color: "bg-[#8dc63f]"  },
  done:      { label: "Klaar",       pct: 100, color: "bg-[#2c7a4b]"  },
  error:     { label: "Fout",        pct: 100, color: "bg-red-400"    },
};

async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const arrayBuf = await file.arrayBuffer();

  if (ext === "txt" || ext === "csv") {
    return new TextDecoder("utf-8").decode(arrayBuf);
  }
  if (ext === "pptx") {
    const zip = await JSZip.loadAsync(arrayBuf);
    const parts = [];
    const slideKeys = Object.keys(zip.files)
      .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort();
    for (const key of slideKeys) {
      const num = key.match(/slide(\d+)\.xml$/)?.[1];
      const xml = await zip.files[key].async("string");
      const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const notePath = `ppt/notesSlides/notesSlide${num}.xml`;
      let notes = "";
      if (zip.files[notePath]) {
        const noteXml = await zip.files[notePath].async("string");
        notes = noteXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      if (text)  parts.push(`[Slide ${num}] ${text}`);
      if (notes) parts.push(`[Notes ${num}] ${notes}`);
    }
    return parts.join("\n\n");
  }
  if (ext === "pdf") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      pages.push(`[Pagina ${p}] ` + content.items.map(i => i.str).join(" "));
    }
    return pages.join("\n\n");
  }
  throw new Error(`Bestandstype .${ext} wordt niet ondersteund.`);
}

function MasterImporterPanel({ canvasId, userId, onClose }) {
  const [jobs, setJobs]           = useState([]);
  const [dragOver, setDragOver]   = useState(false);
  const [files, setFiles]         = useState([]);       // canvas_uploads uit DB
  const [filesLoading, setFilesLoading] = useState(false);
  const fileInputRef              = useRef(null);

  // Laad Dossier-bestanden vanuit canvas_uploads
  const refreshFiles = async () => {
    if (!canvasId) return;
    setFilesLoading(true);
    const { data } = await loadDossierFiles(canvasId);
    setFiles(data || []);
    setFilesLoading(false);
  };

  useEffect(() => { refreshFiles(); }, [canvasId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" verwijderen uit het Dossier?`)) return;
    await deleteDossierFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateJob = (id, patch) =>
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));

  const processFile = async (file) => {
    const localId = `${Date.now()}_${Math.random()}`;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf","pptx","txt","csv"].includes(ext)) {
      setJobs(prev => [...prev, { id: localId, file, phase: "error", error: `.${ext} niet ondersteund.` }]);
      return;
    }
    setJobs(prev => [...prev, { id: localId, file, phase: "queued", error: null, jobId: null }]);
    try {
      updateJob(localId, { phase: "uploading" });
      let dbJobId = null;
      if (canvasId) {
        const { data: job } = await createImportJob({ canvasId, userId, fileName: file.name, fileType: ext });
        if (job) dbJobId = job.id;
        await uploadDocumentToStorage(file, canvasId);
        if (dbJobId) await updateImportJob(dbJobId, { status: "reading" });
      }
      updateJob(localId, { phase: "reading", jobId: dbJobId });
      const rawText = await extractFileText(file);
      if (!rawText || rawText.trim().length < 20) throw new Error("Geen leesbare tekst gevonden.");
      updateJob(localId, { phase: "indexing" });
      if (dbJobId) await updateImportJob(dbJobId, { status: "indexing" });

      // Sla rawText op en haal het upload_id op voor de chunk FK
      const { uploadId, error: saveErr } = await saveCanvasUpload({
        fileName: file.name, rawText: rawText.slice(0, 10000),
        insights: [], blockKey: "importer", language: "nl",
        canvasId: canvasId || null, userId: userId || null,
      });
      if (saveErr) throw new Error(`Opslag mislukt: ${saveErr.message || saveErr}`);

      // Parent-Child chunking + OpenAI embeddings → document_chunks
      let totalChunks = 0;
      if (uploadId && canvasId) {
        const { totalChildren, error: idxErr } = await indexDocumentChunks(
          uploadId, canvasId, rawText,
          (pct) => updateJob(localId, { indexPct: pct }),
        );
        if (idxErr) throw new Error(`Indexeren mislukt: ${idxErr}`);
        totalChunks = totalChildren || 0;
      }

      if (dbJobId) await updateImportJob(dbJobId, { status: "done", total_chunks: totalChunks, processed_chunks: totalChunks });
      updateJob(localId, { phase: "done", totalChunks });
      refreshFiles(); // Dossier-lijst verversen
    } catch (err) {
      updateJob(localId, { phase: "error", error: err.message });
    }
  };

  const handleFiles = (files) => Array.from(files).forEach(f => processFile(f));
  const activeCount = jobs.filter(j => !["done","error"].includes(j.phase)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-16 px-8 pb-8">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a365d] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-[#8dc63f]" />
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Het Dossier</h2>
              <p className="text-white/50 text-[9px] uppercase tracking-wider">Kennisbank — Magic Staff AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="text-[10px] text-white/60">{activeCount} bezig…</span>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
          </div>
        </div>

        {/* Drop zone — compact */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`mx-6 mt-5 border-2 border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all
            ${dragOver ? "border-[#1a365d] bg-[#1a365d]/5" : "border-slate-200 hover:border-[#1a365d]/40 hover:bg-slate-50"}`}
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.txt,.csv" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dragOver ? "bg-[#1a365d]/10" : "bg-slate-100"}`}>
            <Upload size={18} className={dragOver ? "text-[#1a365d]" : "text-slate-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Bestanden toevoegen aan Dossier</p>
            <p className="text-xs text-slate-400">PDF · PPTX · TXT · CSV — sleep of klik</p>
          </div>
        </div>

        {/* Actieve upload-jobs */}
        {jobs.length > 0 && (
          <div className="px-6 pt-4 space-y-3">
            {jobs.map(job => {
              const phase = IMPORT_PHASES[job.phase] || IMPORT_PHASES.queued;
              const ext   = job.file.name.split(".").pop().toUpperCase();
              const phaseOrder = ["uploading","reading","indexing","done"];
              const currentIdx = phaseOrder.indexOf(job.phase);
              return (
                <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#1a365d]/10 text-[#1a365d] rounded flex-shrink-0">{ext}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate">{job.file.name}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${job.phase === "done" ? "text-[#2c7a4b]" : job.phase === "error" ? "text-red-500" : "text-slate-400"}`}>
                      {phase.label}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${phase.color}`} style={{ width: `${phase.pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {phaseOrder.map((p, i) => (
                      <span key={p} className={`text-[8px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded ${
                        job.phase === p ? "bg-[#1a365d] text-white" :
                        (job.phase === "done" || (currentIdx > i && job.phase !== "error")) ? "bg-[#8dc63f]/20 text-[#2c7a4b]" :
                        "text-slate-300"}`}>
                        {IMPORT_PHASES[p]?.label}
                      </span>
                    ))}
                    {job.phase === "indexing" && job.indexPct !== undefined && (
                      <span className="text-[8px] text-slate-400 ml-1">{job.indexPct}%</span>
                    )}
                  </div>
                  {job.phase === "done" && job.totalChunks > 0 && (
                    <p className="text-[9px] text-[#2c7a4b] mt-1">{job.totalChunks} fragmenten geïndexeerd</p>
                  )}
                  {job.phase === "error" && <p className="text-[10px] text-red-500 mt-1">{job.error}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Dossier-lijst — bestanden uit canvas_uploads */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Dossier {files.length > 0 ? `— ${files.length} bestand${files.length !== 1 ? "en" : ""}` : ""}
            </p>
            {filesLoading && <span className="text-[9px] text-slate-300 animate-pulse">laden…</span>}
          </div>
          {!filesLoading && files.length === 0 && (
            <div className="text-center py-8">
              <Database size={24} className="mx-auto text-slate-200 mb-3" />
              <p className="text-xs text-slate-300">Nog geen bestanden in het Dossier.</p>
              <p className="text-[10px] text-slate-200 mt-1">Upload documenten hierboven om de Magic Staff te activeren.</p>
            </div>
          )}
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 group">
              <FileText size={13} className="text-slate-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-600 truncate block">{f.file_name}</span>
                <span className="text-[9px] text-slate-300">
                  {new Date(f.created_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-[#2c7a4b] uppercase tracking-wider flex-shrink-0">Geïndexeerd</span>
              <button
                onClick={() => handleDelete(f.id, f.file_name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 flex-shrink-0"
                title="Verwijder uit Dossier"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-[9px] text-slate-300 uppercase tracking-widest">Magic Staff gebruikt alleen documenten uit dit Dossier</p>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-[#1a365d] uppercase tracking-widest transition-colors">Sluiten</button>
        </div>
      </div>
    </div>
  );
}

// ── Sprint 3C — Magic Staff helpers ─────────────────────────────────────────

/** Typewriter-effect: typt `text` karakter voor karakter met `speed` ms interval. */
function useTypewriter(text, speed = 10) {
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

/** Kleine wand-knop naast een veldlabel. */
function WandButton({ onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1 text-[10px] transition-colors rounded px-1 py-0.5
        ${loading ? "text-[#8dc63f] cursor-default" : "text-slate-300 hover:text-[#8dc63f] hover:bg-[#8dc63f]/8"}`}
      title="Magic Staff — AI voorstel op basis van geïndexeerde documenten"
    >
      <Wand2 size={12} className={loading ? "animate-pulse" : ""} />
    </button>
  );
}

/** Toont AI-voorstel met typewriter, bronvermelding en Overnemen/Weggooien knoppen. */
function MagicResult({ result, onAccept, onReject }) {
  const typed = useTypewriter(result?.suggestion, 10);
  if (!result || (!result.loading && !result.suggestion && !result.error && !result.noChunks)) return null;

  if (result.loading) return (
    <div className="mt-2 px-3 py-2.5 bg-[#8dc63f]/5 border border-[#8dc63f]/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Wand2 size={11} className="text-[#8dc63f] animate-pulse flex-shrink-0" />
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
    <div className="mt-2 bg-[#8dc63f]/5 border border-[#8dc63f]/20 rounded-lg overflow-hidden">
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
      <div className="sticky bottom-0 flex items-center gap-4 px-3 py-2 bg-[#edf7e0] border-t border-[#8dc63f]/30">
        <button
          onClick={canAccept ? onAccept : undefined}
          disabled={!canAccept}
          className={`text-[10px] font-black uppercase tracking-widest transition-colors
            ${canAccept
              ? "text-[#2c7a4b] hover:text-[#1a365d] cursor-pointer"
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

// ── Werkblad sub-components ────────────────────────────────────────────────────

/** Tag-pill voor analyse-items */
const ALL_TAGS = [
  { key: "kans",          label: "Kans",          color: "bg-emerald-100 text-emerald-700 border-emerald-200"  },
  { key: "sterkte",       label: "Sterkte",        color: "bg-blue-100 text-blue-700 border-blue-200"          },
  { key: "bedreiging",    label: "Bedreiging",     color: "bg-red-100 text-red-700 border-red-200"             },
  { key: "zwakte",        label: "Zwakte",         color: "bg-orange-100 text-orange-700 border-orange-200"    },
  { key: "niet_relevant", label: "Niet relevant",  color: "bg-slate-100 text-slate-400 border-slate-200"       },
];
const EXTERN_TAGS = ["kans", "bedreiging", "niet_relevant"];
const INTERN_TAGS = ["sterkte", "zwakte", "niet_relevant"];

function TagPill({ tag, onChange, allowedKeys }) {
  const tags = allowedKeys ? ALL_TAGS.filter(t => allowedKeys.includes(t.key)) : ALL_TAGS;
  const current = ALL_TAGS.find(t => t.key === tag) || ALL_TAGS[4];
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${current.color} uppercase tracking-wide whitespace-nowrap`}
      >
        {current.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[130px]">
            {tags.map(t => (
              <button key={t.key} onClick={() => { onChange(t.key); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold hover:bg-slate-50 ${t.key === tag ? "text-[#1a365d]" : "text-slate-600"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Tekstveld met Draft-modus, Magic Staff en Improve-menu */
function WerkbladTextField({ label, fieldKey, value, draft, onChange, onMagic, onImprove, onAcceptDraft, onEditDraft, onRejectDraft, placeholder, multiline = true, magicResult }) {
  const hasDraft = draft !== null && draft !== undefined;
  const [improveOpen, setImproveOpen] = useState(false);
  const IMPROVE_PRESETS = [
    { key: "inspirerender", icon: "✨", label: "Inspirerender"    },
    { key: "mckinsey",      icon: "📊", label: "McKinsey-stijl"  },
    { key: "beknopter",     icon: "✂️", label: "Beknopter"       },
    { key: "financieel",    icon: "💶", label: "Focus Financieel" },
  ];

  return (
    <div className="space-y-1.5">
      {/* Label + knoppen */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
        <div className="flex items-center gap-1.5">
          {/* Improve dropdown — alleen als er tekst is */}
          {value && onImprove && (
            <div className="relative">
              <button onClick={() => setImproveOpen(o => !o)}
                className="text-[9px] font-bold text-slate-400 hover:text-[#1a365d] px-2 py-0.5 rounded border border-slate-200 hover:border-[#1a365d]/40 transition-colors flex items-center gap-1"
                title="Tekst verbeteren">
                <span>✨</span> Improve
              </button>
              {improveOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setImproveOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[160px]">
                    {IMPROVE_PRESETS.map(p => (
                      <button key={p.key} onClick={() => { onImprove(p.key); setImproveOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-slate-50 text-slate-600 flex items-center gap-2">
                        <span>{p.icon}</span>{p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* Magic Staff */}
          {onMagic && <WandButton onClick={onMagic} loading={magicResult?.loading} />}
        </div>
      </div>

      {/* Tekstveld */}
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `${label}…`}
          rows={3}
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-[#1a365d]/40 placeholder:text-slate-300 leading-relaxed"
        />
      ) : (
        <input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || `${label}…`}
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1a365d]/40 placeholder:text-slate-300"
        />
      )}

      {/* Magic Staff result */}
      {magicResult && <MagicResult result={magicResult} onAccept={() => { onChange(magicResult.suggestion); onRejectDraft && onRejectDraft(); }} onReject={() => onRejectDraft && onRejectDraft()} />}

      {/* Draft overlay */}
      {hasDraft && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
              <span>✨</span> AI Voorstel — Concept
            </span>
            <div className="flex items-center gap-2">
              <button onClick={onAcceptDraft}
                className="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                <span>✓</span> Accepteren
              </button>
              <button onClick={onEditDraft}
                className="text-[9px] font-bold text-[#1a365d] hover:text-[#1a365d]/70 flex items-center gap-1">
                <span>✏️</span> Bewerken
              </button>
              <button onClick={onRejectDraft}
                className="text-[9px] font-bold text-slate-500 hover:text-red-500 flex items-center gap-1">
                <span>✕</span> Negeren
              </button>
            </div>
          </div>
          <p className="px-3 py-2.5 text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{draft}</p>
        </div>
      )}
    </div>
  );
}

/** Analyse-lijst (extern of intern) met tagging */
function AnalyseSection({ title, type, items, onAdd, onDelete, onTagChange, onMagic, magicResult, onRejectMagic }) {
  const allowedTagKeys = type === "extern" ? EXTERN_TAGS : type === "intern" ? INTERN_TAGS : undefined;
  const [draft, setDraft] = useState("");
  const [proposedLines, setProposedLines] = useState([]);

  // Patroon voor paginaverwijzingen en losse kopjes die we willen wegfilteren
  const isNoise = (line) => {
    if (/^\[(slide|pagina|page|notes)\s+\d+\]/i.test(line)) return true;  // [Slide 7]
    if (/\[(slide|pagina|page|notes)\s+\d+\]$/i.test(line)) return true;  // tekst [Slide 7]
    if (/^(slide|pagina|page)\s+\d+$/i.test(line)) return true;           // "Slide 7"
    if (line.length < 12) return true;                                     // te kort = kopje
    if (/^[A-Z][A-Z\s&/–-]{8,}$/.test(line)) return true;                 // ALL CAPS kopje
    if (/^\d+[.)]\s/.test(line) && line.length < 20) return true;           // "1. Titel"
    return false;
  };

  // Zodra er een nieuwe magic suggestion binnenkomt: split op regels
  useEffect(() => {
    if (magicResult?.suggestion && !magicResult.loading) {
      const lines = magicResult.suggestion
        .split("\n")
        .map(l => l.trim().replace(/^[-•*]\s*/, ""))  // strip leading bullets
        .filter(l => l.length > 4 && !isNoise(l));
      setProposedLines(lines);
    } else if (!magicResult || magicResult.loading) {
      setProposedLines([]);
    }
  }, [magicResult?.suggestion, magicResult?.loading, magicResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = () => {
    const val = draft.trim();
    if (val) { onAdd(val); setDraft(""); }
  };

  const acceptLine = (i) => {
    onAdd(proposedLines[i]);
    setProposedLines(prev => prev.filter((_, j) => j !== i));
  };
  const acceptAll = () => {
    proposedLines.forEach(l => onAdd(l));
    setProposedLines([]);
    onRejectMagic?.();
  };
  const dismissAll = () => {
    setProposedLines([]);
    onRejectMagic?.();
  };

  const tagColors = {
    kans:          "bg-emerald-50 border-l-emerald-400",
    sterkte:       "bg-blue-50 border-l-blue-400",
    bedreiging:    "bg-red-50 border-l-red-400",
    zwakte:        "bg-orange-50 border-l-orange-400",
    niet_relevant: "bg-slate-50 border-l-slate-200",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</h4>
        {onMagic && <WandButton onClick={onMagic} loading={magicResult?.loading} />}
      </div>

      {/* Laden */}
      {magicResult?.loading && (
        <div className="text-[10px] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 animate-pulse">
          Analyseren…
        </div>
      )}

      {/* Geen chunks */}
      {magicResult?.noChunks && (
        <div className="text-[10px] text-slate-400 italic px-1">Geen documenten gevonden voor dit veld.</div>
      )}

      {/* Voorgestelde items (regel-voor-regel) */}
      {proposedLines.length > 0 && (
        <div className="border border-amber-300 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 px-3 py-2 border-b border-amber-200">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
              🪄 Voorstel — {proposedLines.length} item{proposedLines.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1.5">
              <button onClick={acceptAll}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded px-2 py-0.5 transition-colors">
                Alle toevoegen
              </button>
              <button onClick={dismissAll}
                className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5 transition-colors">
                Weggooien
              </button>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {proposedLines.map((line, i) => (
              <div key={i} className="group flex items-start gap-2 bg-white hover:bg-amber-50/40 px-3 py-2 transition-colors">
                <p className="flex-1 text-xs text-slate-700 leading-relaxed">{line}</p>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => acceptLine(i)}
                    title="Toevoegen"
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded px-1.5 py-0.5 transition-colors">
                    ✓
                  </button>
                  <button onClick={() => setProposedLines(prev => prev.filter((_, j) => j !== i))}
                    title="Overslaan"
                    className="text-xs text-slate-400 hover:text-red-400 bg-slate-50 hover:bg-red-50 rounded px-1.5 py-0.5 transition-colors">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bestaande items */}
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id}
            className={`group flex items-start gap-2 border-l-4 rounded-r-lg px-3 py-2 ${tagColors[item.tag] || tagColors.niet_relevant}`}>
            <p className="flex-1 text-xs text-slate-700 leading-relaxed">{item.content}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <TagPill tag={item.tag} onChange={tag => onTagChange(item.id, tag)} allowedKeys={allowedTagKeys} />
              <button onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          placeholder={`+ Nieuwe ${title.toLowerCase()}…`}
          className="flex-1 text-xs bg-white border border-dashed border-slate-300 rounded-lg px-3 py-2 text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40"
        />
        <button onClick={commit}
          className="text-xs font-bold text-white bg-[#1a365d] hover:bg-[#1a365d]/80 rounded-lg px-3 py-2 transition-colors">
          +
        </button>
      </div>
    </div>
  );
}

/** KSF/KPI tabel-rij */
function KsfKpiRow({ item, onChange, onDelete }) {
  return (
    <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 items-center group">
      <input value={item.description} onChange={e => onChange({ ...item, description: e.target.value })}
        placeholder="Omschrijving…"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40" />
      <input value={item.current_value} onChange={e => onChange({ ...item, current_value: e.target.value })}
        placeholder="Huidig"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-500 placeholder:text-slate-300 focus:outline-none focus:border-[#1a365d]/40 text-center" />
      <input value={item.target_value} onChange={e => onChange({ ...item, target_value: e.target.value })}
        placeholder="Target"
        className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-[#2c7a4b] placeholder:text-slate-300 focus:outline-none focus:border-[#2c7a4b]/40 text-center font-semibold" />
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity">
        <X size={12} />
      </button>
    </div>
  );
}

/** Strategisch Thema accordeon met KSF/KPI tabel */
function ThemaAccordeon({ thema, index, onTitleChange, onDelete, onAddKsfKpi, onUpdateKsfKpi, onDeleteKsfKpi }) {
  const [open, setOpen] = useState(index === 0);
  const ksfs = (thema.ksf_kpi || []).filter(k => k.type === "ksf").sort((a,b) => a.sort_order - b.sort_order);
  const kpis = (thema.ksf_kpi || []).filter(k => k.type === "kpi").sort((a,b) => a.sort_order - b.sort_order);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[10px] font-black text-[#1a365d]/60 uppercase tracking-widest w-5 flex-shrink-0">{index + 1}</span>
        <input
          value={thema.title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder={`Strategisch Thema ${index + 1}…`}
          className="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
        />
        <button onClick={() => setOpen(o => !o)}
          className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
            className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l5 6 5-6H2z" />
          </svg>
        </button>
        <button onClick={onDelete}
          className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 space-y-5">
          {/* KSF sectie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-[#1a365d]">
                KSF — Kritieke Succesfactoren <span className="font-normal text-slate-400">({ksfs.length}/3)</span>
              </h5>
              {ksfs.length < 3 && (
                <button onClick={() => onAddKsfKpi("ksf")}
                  className="text-[9px] font-bold text-[#1a365d] hover:text-[#1a365d]/70 flex items-center gap-1">
                  <Plus size={10} /> Toevoegen
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 pb-1 border-b border-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Omschrijving</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 text-center">Huidig</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#2c7a4b] text-center">Target</span>
              <span />
            </div>
            {ksfs.map(k => (
              <KsfKpiRow key={k.id} item={k}
                onChange={updated => onUpdateKsfKpi(updated)}
                onDelete={() => onDeleteKsfKpi(k.id)} />
            ))}
            {ksfs.length === 0 && <p className="text-[10px] text-slate-300 italic">Nog geen KSF's — klik Toevoegen</p>}
          </div>

          {/* KPI sectie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-[#2c7a4b]">
                KPI — Prestatie-indicatoren <span className="font-normal text-slate-400">({kpis.length}/3)</span>
              </h5>
              {kpis.length < 3 && (
                <button onClick={() => onAddKsfKpi("kpi")}
                  className="text-[9px] font-bold text-[#2c7a4b] hover:text-[#2c7a4b]/70 flex items-center gap-1">
                  <Plus size={10} /> Toevoegen
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_100px_100px_24px] gap-2 pb-1 border-b border-slate-100">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Omschrijving</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 text-center">Huidig</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#2c7a4b] text-center">Target</span>
              <span />
            </div>
            {kpis.map(k => (
              <KsfKpiRow key={k.id} item={k}
                onChange={updated => onUpdateKsfKpi(updated)}
                onDelete={() => onDeleteKsfKpi(k.id)} />
            ))}
            {kpis.length === 0 && <p className="text-[10px] text-slate-300 italic">Nog geen KPI's — klik Toevoegen</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function StrategieWerkblad({ canvasId, onClose, onManualSaved }) {
  const { lang } = useLang(); // eslint-disable-line no-unused-vars
  const [mounted, setMounted]   = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // Data state
  const [core, setCore]         = useState({ missie: "", visie: "", ambitie: "", kernwaarden: [] });
  const [items, setItems]       = useState([]);   // analysis_items
  const [themas, setThemas]     = useState([]);   // strategic_themes incl. ksf_kpi

  // Draft state (fieldKey → string)
  const [drafts, setDrafts]     = useState({});

  // Magic Staff state
  const [magic, setMagic]       = useState({});
  const [autoDraftRunning, setAutoDraftRunning] = useState(false);
  const [autoDraftOpen, setAutoDraftOpen]       = useState(false);

  const debounceRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load data from DB
  useEffect(() => {
    if (!canvasId) { setIsLoaded(true); return; }
    Promise.all([
      loadStrategyCore(canvasId),
      loadAnalysisItems(canvasId),
      loadStrategicThemes(canvasId),
    ]).then(([{ data: coreData }, { data: itemsData }, { data: themasData }]) => {
      if (coreData) setCore({ missie: coreData.missie || "", visie: coreData.visie || "", ambitie: coreData.ambitie || "", kernwaarden: coreData.kernwaarden || [] });
      if (itemsData) setItems(itemsData);
      if (themasData) setThemas(themasData);
      setIsLoaded(true);
    });
  }, [canvasId]);

  // Debounced autosave van strategy_core
  useEffect(() => {
    if (!isLoaded || !canvasId) return;
    clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(async () => {
      const { error } = await upsertStrategyCore(canvasId, core);
      setSaveStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setSaveStatus("idle"), 2500);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [core, isLoaded, canvasId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core field handlers ──────────────────────────────────────────────────────
  const updateCore = (field, value) => setCore(prev => ({ ...prev, [field]: value }));

  // ── Draft handlers ───────────────────────────────────────────────────────────
  const setDraftFor  = (key, text) => setDrafts(prev => ({ ...prev, [key]: text }));
  const clearDraft   = (key) => setDrafts(prev => { const n = { ...prev }; delete n[key]; return n; });
  const acceptDraft  = (key) => { updateCore(key, drafts[key]); clearDraft(key); };
  const editDraft    = (key) => { updateCore(key, drafts[key]); clearDraft(key); };

  // ── Magic Staff ──────────────────────────────────────────────────────────────
  const setMagicFor = (key, patch) =>
    setMagic(prev => ({ ...prev, [key]: patch === null ? undefined : { ...(prev[key] || {}), ...patch } }));

  const FIELD_QUERIES = {
    missie:    "mission statement missie purpose why we exist organizational purpose reason for being",
    visie:     "vision statement visie future ambition long-term goal where we want to be",
    ambitie:   "ambition strategic ambition BHAG aspirations growth targets what we strive for",
    kernwaarden: "core values kernwaarden principles culture beliefs guiding principles what we stand for",
    extern:    "external developments trends marktomgeving macro-economisch sector trends opportunities threats",
    intern:    "internal strengths weaknesses capabilities resources internal developments organizational",
    themas:    "strategic themes priorities strategic pillars focus areas key initiatives transformation themes",
  };

  const callWerkbladMagic = async (fieldKey, isArray = false) => {
    if (!canvasId) { setMagicFor(fieldKey, { error: "Sla het canvas eerst op." }); return; }
    const isHeavy = ["extern","intern","themas"].includes(fieldKey);
    const matchCount = isHeavy ? 30 : 12;
    setMagicFor(fieldKey, { loading: true, suggestion: null, error: null });
    try {
      const query = FIELD_QUERIES[fieldKey] || fieldKey;
      const embRes = await fetch("/api/embed", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ texts: [query] }) });
      if (!embRes.ok) throw new Error("Embedding mislukt");
      const { embeddings } = await embRes.json();
      const { data: chunks, error: searchErr } = await searchDocumentChunks(embeddings[0], canvasId, matchCount);
      if (searchErr) console.warn("[werkblad magic] RPC fout:", searchErr);
      if (!chunks || chunks.length === 0) {
        setMagicFor(fieldKey, { loading: false, noChunks: true, suggestion: null });
        return;
      }
      const citations = [...new Set(chunks.map(c => c.file_name).filter(Boolean))];
      const magicRes = await fetch("/api/magic", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ field: fieldKey, chunks, isArray, heavy: isHeavy }),
      });
      const magicData = await magicRes.json();
      if (!magicRes.ok) throw new Error(magicData.error || "AI fout");
      const suggestion = magicData.suggestion || "";
      const isNoInfo = suggestion.toLowerCase().includes("geen relevante informatie") || suggestion.toLowerCase().includes("onvoldoende");
      setMagicFor(fieldKey, { loading: false, suggestion, citations, isNoInfo });
      if (!isNoInfo) setDraftFor(fieldKey, suggestion);
    } catch (err) {
      setMagicFor(fieldKey, { loading: false, error: err.message });
    }
  };

  // ── Improve ──────────────────────────────────────────────────────────────────
  const callImprove = async (fieldKey, text, preset) => {
    if (!text) return;
    setMagicFor(fieldKey, { loading: true });
    try {
      const res = await fetch("/api/improve", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text, preset, field: fieldKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Improve mislukt");
      setDraftFor(fieldKey, data.suggestion);
      setMagicFor(fieldKey, { loading: false, suggestion: null });
    } catch (err) {
      setMagicFor(fieldKey, { loading: false, error: err.message });
    }
  };

  // ── Full Draft ───────────────────────────────────────────────────────────────
  const handleFullDraft = async () => {
    setAutoDraftOpen(false);
    setAutoDraftRunning(true);
    const fields = ["missie","visie","ambitie","kernwaarden","extern","intern"];
    for (let i = 0; i < fields.length; i++) {
      await callWerkbladMagic(fields[i], ["kernwaarden"].includes(fields[i]));
      if (i < fields.length - 1) await new Promise(r => setTimeout(r, 400));
    }
    setAutoDraftRunning(false);
  };

  // ── Analysis item handlers ────────────────────────────────────────────────────
  const addAnalysisItem = async (type, content) => {
    const newItem = { canvas_id: canvasId, type, content, tag: "niet_relevant", sort_order: items.filter(i => i.type === type).length };
    const { data } = await upsertAnalysisItem(newItem);
    if (data) setItems(prev => [...prev, data]);
  };
  const removeAnalysisItem = async (id) => {
    await deleteAnalysisItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };
  const changeAnalysisTag = async (id, tag) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, tag } : i));
    await upsertAnalysisItem({ id, tag });
  };

  // ── Thema handlers ────────────────────────────────────────────────────────────
  const addThema = async () => {
    if (themas.length >= 7) return;
    const { data } = await upsertStrategicTheme({ canvas_id: canvasId, title: "", sort_order: themas.length });
    if (data) setThemas(prev => [...prev, { ...data, ksf_kpi: [] }]);
  };
  const removeThema = async (id) => {
    await deleteStrategicTheme(id);
    setThemas(prev => prev.filter(t => t.id !== id));
  };
  const updateThemaTitle = async (id, title) => {
    setThemas(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertStrategicTheme({ id, title }), 500);
  };
  const addKsfKpi = async (themaId, type) => {
    const thema = themas.find(t => t.id === themaId);
    const existing = (thema?.ksf_kpi || []).filter(k => k.type === type);
    if (existing.length >= 3) return;
    const { data } = await upsertKsfKpi({ theme_id: themaId, type, description: "", current_value: "", target_value: "", sort_order: existing.length });
    if (data) setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: [...(t.ksf_kpi||[]), data] } : t));
  };
  const updateKsfKpiItem = async (themaId, item) => {
    setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: t.ksf_kpi.map(k => k.id === item.id ? item : k) } : t));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertKsfKpi(item), 500);
  };
  const removeKsfKpi = async (themaId, id) => {
    await deleteKsfKpi(id);
    setThemas(prev => prev.map(t => t.id === themaId ? { ...t, ksf_kpi: t.ksf_kpi.filter(k => k.id !== id) } : t));
  };

  const externItems = items.filter(i => i.type === "extern");
  const internItems = items.filter(i => i.type === "intern");
  const saveLabel   = { idle: "", saving: "Opslaan…", saved: "Opgeslagen ✓", error: "Fout" }[saveStatus];
  const saveColor   = { saving: "text-slate-400", saved: "text-[#2c7a4b]", error: "text-red-500", idle: "" }[saveStatus];

  if (!isLoaded) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Wand2 size={28} className="text-[#8dc63f] animate-pulse mx-auto" />
        <p className="text-sm text-slate-500">Strategie laden…</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
      ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#1a365d] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">De Werkkamer</p>
            <h2 className="text-lg font-bold text-white leading-tight">Strategie Werkblad</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveLabel && <span className={`text-[10px] font-semibold ${saveColor}`}>{saveLabel}</span>}
          {/* Full Draft */}
          <button
            onClick={() => setAutoDraftOpen(true)}
            disabled={autoDraftRunning}
            className="flex items-center gap-2 px-4 py-2 bg-[#8dc63f] hover:bg-[#7ab535] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
            <Zap size={13} />
            {autoDraftRunning ? "Bezig…" : "Full Draft"}
          </button>
        </div>
      </div>

      {/* Full Draft bevestiging */}
      {autoDraftOpen && (
        <div className="flex-shrink-0 mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-800">🚀 Full Draft starten?</p>
            <p className="text-xs text-amber-600 mt-0.5">Vult alle velden met AI-concepten op basis van Het Dossier. Bestaande tekst wordt niet overschreven.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleFullDraft} className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg px-4 py-2">Start</button>
            <button onClick={() => setAutoDraftOpen(false)} className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">Annuleer</button>
          </div>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">

        {/* SECTIE 1: IDENTITEIT */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#1a365d] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1a365d]">Identiteit</h3>
            <div className="flex-1 h-px bg-[#1a365d]/15" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <WerkbladTextField
              label="Missie"
              fieldKey="missie"
              value={core.missie}
              draft={drafts.missie}
              onChange={v => updateCore("missie", v)}
              onMagic={() => callWerkbladMagic("missie")}
              onImprove={(preset) => callImprove("missie", core.missie, preset)}
              onAcceptDraft={() => acceptDraft("missie")}
              onEditDraft={() => editDraft("missie")}
              onRejectDraft={() => clearDraft("missie")}
              magicResult={magic.missie?.error || magic.missie?.noChunks ? magic.missie : undefined}
              placeholder="Waarom bestaan wij?"
            />
            <WerkbladTextField
              label="Visie"
              fieldKey="visie"
              value={core.visie}
              draft={drafts.visie}
              onChange={v => updateCore("visie", v)}
              onMagic={() => callWerkbladMagic("visie")}
              onImprove={(preset) => callImprove("visie", core.visie, preset)}
              onAcceptDraft={() => acceptDraft("visie")}
              onEditDraft={() => editDraft("visie")}
              onRejectDraft={() => clearDraft("visie")}
              magicResult={magic.visie?.error || magic.visie?.noChunks ? magic.visie : undefined}
              placeholder="Waar staan wij over 5 jaar?"
            />
            <WerkbladTextField
              label="Ambitie (BHAG)"
              fieldKey="ambitie"
              value={core.ambitie}
              draft={drafts.ambitie}
              onChange={v => updateCore("ambitie", v)}
              onMagic={() => callWerkbladMagic("ambitie")}
              onImprove={(preset) => callImprove("ambitie", core.ambitie, preset)}
              onAcceptDraft={() => acceptDraft("ambitie")}
              onEditDraft={() => editDraft("ambitie")}
              onRejectDraft={() => clearDraft("ambitie")}
              magicResult={magic.ambitie?.error || magic.ambitie?.noChunks ? magic.ambitie : undefined}
              placeholder="Onze grote, haast onmogelijke doelstelling…"
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kernwaarden</label>
                <WandButton onClick={() => callWerkbladMagic("kernwaarden", true)} loading={magic.kernwaarden?.loading} />
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[60px] bg-white border border-slate-200 rounded-lg p-2.5">
                {core.kernwaarden.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1a365d] bg-[#1a365d]/8 border border-[#1a365d]/20 rounded-full px-2.5 py-1">
                    {kw}
                    <button onClick={() => setCore(prev => ({ ...prev, kernwaarden: prev.kernwaarden.filter((_,j) => j !== i) }))}
                      className="text-[#1a365d]/40 hover:text-red-400 transition-colors"><X size={10} /></button>
                  </span>
                ))}
                <input
                  placeholder="+ Waarde…"
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      setCore(prev => ({ ...prev, kernwaarden: [...prev.kernwaarden, e.target.value.trim()] }));
                      e.target.value = "";
                    }
                  }}
                  className="text-[10px] bg-transparent border-none focus:outline-none placeholder:text-slate-300 text-slate-600 min-w-[80px]"
                />
              </div>
              {/* Draft voor kernwaarden */}
              {drafts.kernwaarden && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">✨ AI Voorstel — Concept</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const vals = drafts.kernwaarden.split("\n").map(s=>s.trim()).filter(Boolean);
                        setCore(prev => ({ ...prev, kernwaarden: [...new Set([...prev.kernwaarden, ...vals])] }));
                        clearDraft("kernwaarden");
                      }} className="text-[9px] font-bold text-emerald-700">✓ Accepteren</button>
                      <button onClick={() => clearDraft("kernwaarden")} className="text-[9px] font-bold text-slate-500">✕ Negeren</button>
                    </div>
                  </div>
                  <p className="px-3 py-2 text-xs text-amber-900 whitespace-pre-wrap">{drafts.kernwaarden}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTIE 2: ANALYSE */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#00AEEF] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#00AEEF]">Analyse</h3>
            <div className="flex-1 h-px bg-[#00AEEF]/20" />
            <p className="text-[9px] text-slate-400 flex-shrink-0">Tag elk item voor de SWOT-rapportage</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <AnalyseSection
              title="Externe Ontwikkelingen"
              type="extern"
              items={externItems}
              onAdd={content => addAnalysisItem("extern", content)}
              onDelete={removeAnalysisItem}
              onTagChange={changeAnalysisTag}
              onMagic={() => callWerkbladMagic("extern", true)}
              magicResult={magic.extern}
              onRejectMagic={() => setMagicFor("extern", null)}
            />
            <AnalyseSection
              title="Interne Ontwikkelingen"
              type="intern"
              items={internItems}
              onAdd={content => addAnalysisItem("intern", content)}
              onDelete={removeAnalysisItem}
              onTagChange={changeAnalysisTag}
              onMagic={() => callWerkbladMagic("intern", true)}
              magicResult={magic.intern}
              onRejectMagic={() => setMagicFor("intern", null)}
            />
          </div>
        </section>

        {/* SECTIE 3: EXECUTIE 7-3-3 */}
        <section className="space-y-5 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#8dc63f] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#2c7a4b]">Executie — 7·3·3 Regel</h3>
            <div className="flex-1 h-px bg-[#8dc63f]/30" />
            <p className="text-[9px] text-slate-400 flex-shrink-0">{themas.length}/7 thema's</p>
          </div>
          <div className="space-y-3">
            {themas.map((thema, i) => (
              <ThemaAccordeon
                key={thema.id}
                thema={thema}
                index={i}
                onTitleChange={title => updateThemaTitle(thema.id, title)}
                onDelete={() => removeThema(thema.id)}
                onAddKsfKpi={type => addKsfKpi(thema.id, type)}
                onUpdateKsfKpi={item => updateKsfKpiItem(thema.id, item)}
                onDeleteKsfKpi={id => removeKsfKpi(thema.id, id)}
              />
            ))}
            {themas.length < 7 && (
              <button onClick={addThema}
                className="w-full border-2 border-dashed border-slate-200 hover:border-[#8dc63f]/50 rounded-lg py-3 text-xs font-semibold text-slate-400 hover:text-[#2c7a4b] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} />
                Strategisch Thema toevoegen {themas.length > 0 ? `(${themas.length}/7)` : ""}
              </button>
            )}
            {themas.length === 0 && (
              <p className="text-center text-xs text-slate-300 italic py-4">
                Nog geen strategische thema's — klik hierboven om te beginnen
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DeepDiveOverlay({ blockId, canvasId, onClose, onManualSaved }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Strategy: volledig nieuwe Werkblad
  if (blockId === "strategy") {
    return (
      <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
        <StrategieWerkblad canvasId={canvasId} onClose={onClose} onManualSaved={onManualSaved} />
      </div>
    );
  }

  // Overige blokken: generieke placeholder
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex flex-col">
      <div className={`flex flex-col flex-1 min-h-0 bg-slate-50 transition-all duration-300 ease-out
        ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-[0.99]"}`}>
        <div className="flex items-center gap-3 px-8 py-4 bg-[#1a365d] flex-shrink-0">
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-white capitalize">{blockId}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Verdieping voor dit blok komt in een volgende sprint.</p>
        </div>
      </div>
    </div>
  );
}

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
  const swotFilled = Object.values(strategyManual?.swot || {}).some(v => Array.isArray(v) ? v.length > 0 : false);

  const STATUS_FIELDS = [
    { key: "missie",         nl: "Missie",           en: "Mission"    },
    { key: "visie",          nl: "Visie",            en: "Vision"     },
    { key: "ambitie",        nl: "Ambitie",          en: "Ambition"   },
    { key: "kernwaarden",    nl: "Kernwaarden",      en: "Core Values"     },
    { key: "doelstellingen", nl: "Doelstellingen",   en: "Objectives" },
    { key: "swot",           nl: "SWOT",             en: "SWOT",      swot: true },
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
          <button
            onClick={e => { e.stopPropagation(); onDeepDive(); }}
            className="flex items-center gap-1 bg-[#1a365d] hover:bg-[#2c7a4b] text-white text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm shadow transition-colors"
          >
            <Maximize2 size={9} /> Verdiep
          </button>
        </div>
      </div>

      {/* Strategische samenvatting (executive summary uit DB) */}
      {filled(strategyManual?.executive_summary) ? (
        <p className="text-xs text-slate-600 leading-relaxed border-l-2 border-[#8dc63f] pl-3 italic">
          {String(strategyManual.executive_summary).slice(0, 200)}{strategyManual.executive_summary.length > 200 ? "…" : ""}
        </p>
      ) : (
        <p className="text-[11px] text-slate-300 italic">Voeg een Executive Summary toe via Verdieping →</p>
      )}

      {/* Status monitor — checkmarks voor kleurenblindheid */}
      <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-slate-100">
        {STATUS_FIELDS.map(f => {
          const isOk = f.swot ? swotFilled : filled(strategyManual?.[f.key]);
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

// ── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { t, lang, setLang } = useLang();
  const { user, signOut }    = useAuth();

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [deepDiveBlockId, setDeepDiveBlockId] = useState(null);
  const [showConsistency, setShowConsistency] = useState(null);
  const [showTips, setShowTips]   = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [tipsSection, setTipsSection] = useState("algemeen");

  // Canvas identiteit
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [scope, setScope]       = useState("");

  // Project metadata
  const [meta, setMeta] = useState({});
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  // Per-block state
  const [docs, setDocs]         = useState({});
  const [insights, setInsights] = useState({});
  const [bullets, setBullets]   = useState({});

  // Deep Dive manual data (per blok) — geladen vanuit canvases.data
  const [strategyManual, setStrategyManual] = useState(null);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  // Multi-tab waarschuwing
  const [multiTabWarning, setMultiTabWarning] = useState(false);

  // Ref om autosave te onderdrukken tijdens canvas-laden
  const suppressSaveRef  = useRef(false);
  const autosaveTimerRef = useRef(null);

  const activeBlock = BLOCKS.find(b => b.id === activeBlockId);

  // ── Laad canvassen bij inloggen ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const today = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });

    loadUserCanvases(user.id).then(async ({ data, error }) => {
      if (error) {
        console.error("[init] Canvassen laden mislukt:", error.code, error.message);
        return;
      }

      console.log("[init] canvassen geladen:", data?.length, data);

      if (data && data.length > 0) {
        setCanvases(data);
        const latest = data[0];
        const { data: full, error: loadErr } = await loadCanvasById(latest.id);
        console.log("[init] canvas laden:", full, loadErr);
        if (full) {
          suppressSaveRef.current = true;
          setActiveCanvasId(full.id);
          setScope(full.name || "");
          setDocs(full.blocks?.docs || {});
          setInsights(full.blocks?.insights || {});
          setBullets(full.blocks?.bullets || {});
          setMeta({
            client_name:         full.client_name         || "",
            author_name:         full.author_name          || "",
            industry:            full.industry             || "",
            transformation_type: full.transformation_type  || "",
            org_size:            full.org_size             || "",
            project_status:      full.project_status       || "",
            project_description: full.project_description  || "",
          });
          setTimeout(() => { suppressSaveRef.current = false; }, 100);
          // Load Deep Dive manual data
          const sm = full.data?.strategy?.details?.manual;
          if (sm) setStrategyManual(sm);
        }
      } else {
        // Geen canvassen — maak direct een nieuw canvas aan
        const name = `Canvas ${today}`;
        const { data: created, error: createErr } = await createCanvas({ userId: user.id, name, language: lang });
        console.log("[init] nieuw canvas:", created, createErr);
        if (created) {
          setCanvases([created]);
          setActiveCanvasId(created.id);
          setScope(created.name || name);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Autosave (500ms debounce, last-write-wins) ───────────────────────────
  useEffect(() => {
    if (!activeCanvasId) { console.log("[autosave] skip: geen activeCanvasId"); return; }
    if (!user)           { console.log("[autosave] skip: geen user"); return; }
    if (suppressSaveRef.current) { console.log("[autosave] skip: suppress actief"); return; }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const { error } = await upsertCanvas(activeCanvasId, { scope, docs, insights, bullets, language: lang, meta });
      if (!error) {
        setSaveStatus("saved");
        setCanvases(prev => prev.map(c =>
          c.id === activeCanvasId ? { ...c, name: scope } : c
        ));
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(autosaveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, docs, insights, bullets, meta, activeCanvasId]);

  // ── Multi-tab detectie ───────────────────────────────────────────────────
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    let warned = false;
    const bc = new BroadcastChannel("kingfisher_btc");
    bc.postMessage("ping");
    bc.onmessage = (e) => {
      if (e.data === "ping") bc.postMessage("pong");
      if (e.data === "pong" && !warned) { warned = true; setMultiTabWarning(true); }
    };
    return () => bc.close();
  }, []);

  // ── Canvas handlers ──────────────────────────────────────────────────────
  const handleNewCanvas = async () => {
    const today = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
    const name  = `Canvas ${today}`;
    const { data, error } = await createCanvas({ userId: user.id, name, language: lang });
    if (!error && data) {
      setCanvases(prev => [data, ...prev]);
      suppressSaveRef.current = true;
      setActiveCanvasId(data.id);
      setScope(data.name);
      setDocs({}); setInsights({}); setBullets({});
      setActiveBlockId(null);
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  };

  const handleSelectCanvas = async (canvasRecord) => {
    const { data: full } = await loadCanvasById(canvasRecord.id);
    if (full) {
      suppressSaveRef.current = true;
      setActiveCanvasId(full.id);
      setScope(full.name || "");
      setDocs(full.blocks?.docs || {});
      setInsights(full.blocks?.insights || {});
      setBullets(full.blocks?.bullets || {});
      setMeta({
        client_name:         full.client_name         || "",
        author_name:         full.author_name          || "",
        industry:            full.industry             || "",
        transformation_type: full.transformation_type  || "",
        org_size:            full.org_size             || "",
        project_status:      full.project_status       || "",
      });
      setActiveBlockId(null);
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  };

  const handleRenameCanvas = (newName) => {
    setScope(newName);
    // Autosave pikt de gewijzigde scope op via het debounce-effect
  };

  const handleDeleteCanvas = async (canvasId) => {
    const { error } = await deleteCanvas(canvasId);
    if (error) { console.error("[delete] canvas verwijderen mislukt:", error.message); return; }
    const remaining = canvases.filter(c => c.id !== canvasId);
    setCanvases(remaining);
    // Als het actieve canvas verwijderd wordt: schakel over naar het eerste resterende
    if (activeCanvasId === canvasId) {
      if (remaining.length > 0) {
        const { data: full } = await loadCanvasById(remaining[0].id);
        if (full) {
          suppressSaveRef.current = true;
          setActiveCanvasId(full.id);
          setScope(full.name || "");
          setDocs(full.blocks?.docs || {});
          setInsights(full.blocks?.insights || {});
          setBullets(full.blocks?.bullets || {});
          setTimeout(() => { suppressSaveRef.current = false; }, 100);
        }
      } else {
        // Geen canvassen meer over — maak nieuw leeg canvas
        setActiveCanvasId(null);
        setScope("");
        setDocs({}); setInsights({}); setBullets({});
      }
    }
  };

  const handleLoadExample = () => {
    suppressSaveRef.current = true;
    setBullets(EXAMPLE_BULLETS);
    setScope("Company Example — BTP 2024");
    setDocs({});
    setInsights({});
    setActiveBlockId(null);
    // Voorbeeld laadt in huidig canvas (wordt 500ms later opgeslagen)
    setTimeout(() => { suppressSaveRef.current = false; }, 100);
  };

  // Handlers passed to panel
  const handleDocsChange = (blockId, filename, newInsights) => {
    setDocs(p => ({ ...p, [blockId]: [...(p[blockId] || []), filename] }));
    setInsights(p => ({ ...p, [blockId]: [...(p[blockId] || []), ...newInsights] }));
  };

  const handleInsightAccept = (blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].map(i => i.id === insightId ? { ...i, status: "accepted" } : i),
    }));
  };

  const handleInsightReject = (blockId, insightId) => {
    setInsights(p => ({
      ...p,
      [blockId]: p[blockId].filter(i => i.id !== insightId),
    }));
  };

  const handleMoveToBullets = (blockId, insight, editIdx = null, isEdit = false) => {
    const block = BLOCKS.find(b => b.id === blockId);
    const bulletObj = {
      text: insight.text,
      source: insight.source || null,
      subtab: insight.subtab || (block?.hasSubs ? (block.subTabs?.[0]?.id || "current") : null),
    };
    if (isEdit && editIdx !== null) {
      setBullets(p => {
        const arr = [...(p[blockId] || [])];
        arr[editIdx] = bulletObj;
        return { ...p, [blockId]: arr };
      });
    } else {
      setBullets(p => ({
        ...p,
        [blockId]: [...(p[blockId] || []).filter(b => (typeof b === "string" ? b : b.text) !== insight.text), bulletObj],
      }));
      if (!isEdit) {
        setInsights(p => ({
          ...p,
          [blockId]: (p[blockId] || []).filter(i => i.id !== insight.id),
        }));
      }
    }
  };

  const handleDeleteBullet = (blockId, idx) => {
    setBullets(p => ({ ...p, [blockId]: p[blockId].filter((_, i) => i !== idx) }));
  };

  const handleAddBullet = (blockId, text, subtab = null) => {
    setBullets(p => ({ ...p, [blockId]: [...(p[blockId] || []), { text, source: null, subtab }] }));
  };

  const allDone = BLOCKS.every(b => (bullets[b.id] || []).length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans flex flex-col">

      {/* Header */}
      <header className="h-20 bg-[#1a365d] flex items-center justify-between z-20 border-b-2 border-[#8dc63f] shrink-0 shadow-lg">

        {/* Left: logo + app title */}
        <div className="flex items-center h-full shrink-0">
          <div className="px-6 flex items-center justify-center h-full shrink-0 border-r border-white/10">
            <img src="/kf-logo-white.png" alt="Kingfisher & Partners" className="h-10 w-auto object-contain object-center"
              onError={e => { e.target.src = "/kf-logo.png"; }}
            />
          </div>
          <div className="px-6 border-r border-white/10 h-full flex flex-col justify-center">
            <h1 className="text-[15px] font-bold tracking-[0.14em] uppercase text-white leading-none">Business Transformation Canvas</h1>
            <p className="text-[10px] tracking-[0.12em] text-[#8dc63f] mt-1.5 uppercase font-semibold">From strategy to execution</p>
          </div>
        </div>

        {/* Centre: canvas name as interactive element */}
        <div className="flex-1 flex items-center justify-center px-8">
          <CanvasMenu
            currentName={scope}
            activeCanvasId={activeCanvasId}
            canvases={canvases}
            onNew={handleNewCanvas}
            onSelect={handleSelectCanvas}
            onRename={handleRenameCanvas}
            onLoadExample={handleLoadExample}
            onDelete={handleDeleteCanvas}
          />
        </div>

        {/* Right: autosave indicator + lang + tips + consistency + logout */}
        <div className="flex items-center gap-3 px-6 shrink-0">

          {/* Autosave indicator */}
          {/* Autosave indicator — klein en elegant */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-white/50 font-medium">
              <Save size={10} className="animate-pulse" /> Opslaan…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[10px] text-[#8dc63f] font-medium">
              <CheckCircle2 size={10} /> Opgeslagen
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
              <AlertOctagon size={10} /> Opslaan mislukt
            </span>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "nl" ? "en" : "nl")}
            className="flex items-center gap-1.5 text-white/60 hover:text-white border border-white/20 hover:border-white/40 px-3 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title="Switch language"
          >
            <span className={lang === "nl" ? "text-white font-black" : "text-white/30"}>NL</span>
            <span className="text-white/20">|</span>
            <span className={lang === "en" ? "text-white font-black" : "text-white/30"}>EN</span>
          </button>

          <button
            onClick={() => setShowImporter(true)}
            className="flex items-center gap-2 text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title="Het Dossier — documenten importeren"
          >
            <Database size={14} /> Dossier
          </button>

          <button
            onClick={() => { setTipsSection("algemeen"); setShowTips(true); }}
            className="flex items-center gap-2 text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title={t("tips.title")}
          >
            <BookOpen size={14} /> {t("header.tips")}
          </button>

          <button
            onClick={() => setShowConsistency(true)}
            className="flex items-center gap-2 bg-[#8dc63f] hover:bg-[#7ab52e] text-[#1a365d] px-5 py-2.5 rounded-sm font-bold text-[10px] shadow-sm transition-all uppercase tracking-widest"
          >
            <ShieldCheck size={14} /> {t("header.consistency")}
          </button>

          {/* Project Info toggle */}
          <button
            onClick={() => setShowInfoSidebar(s => !s)}
            className={`flex items-center gap-1.5 transition-colors ml-1 ${showInfoSidebar ? "text-[#8dc63f]" : "text-white/40 hover:text-white"}`}
            title="Project details"
          >
            <SlidersHorizontal size={15} />
          </button>

          {/* Uitloggen */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors ml-1"
            title="Uitloggen"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Multi-tab waarschuwing */}
      {multiTabWarning && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-6 py-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            De app is al geopend in een ander tabblad. Wijzigingen in dit tabblad kunnen overschreven worden.
          </span>
          <button onClick={() => setMultiTabWarning(false)} className="text-amber-500 hover:text-amber-800 ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard + optionele sidebar */}
      <div className="flex flex-1 min-h-0">
      <main className="flex-1 p-10 overflow-auto">

        {/* Canvas grid — BTC layout (12-col) */}
        <div className="grid grid-cols-12 gap-5">

          {/* Row 1: Strategy — full width status dashboard */}
          {BLOCKS.filter(b => b.id === "strategy").map(block => (
            <StrategyStatusBlock
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              strategyManual={strategyManual}
              onClick={() => setDeepDiveBlockId(block.id)}
              onDeepDive={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 2: Guiding Principles — full width (col-span-12) */}
          {BLOCKS.filter(b => b.id === "principles").map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 3: 4 Segments — equal quarters (col-span-3 each) */}
          {BLOCKS.filter(b => ["customers", "processes", "people", "technology"].includes(b.id)).map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setDeepDiveBlockId(block.id)}
            />
          ))}

          {/* Row 4: Portfolio Roadmap — full width (col-span-12) */}
          <BlockCard
            key="portfolio"
            block={BLOCKS.find(b => b.id === "portfolio")}
            status={getBlockStatus("portfolio", docs, insights, bullets)}
            bullets={bullets["portfolio"]}
            insightCount={(insights["portfolio"] || []).filter(i => i.status === "pending").length}
            onClick={() => setDeepDiveBlockId("portfolio")}
          />
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { label: "Empty", color: "bg-slate-200" },
              { label: "Uploaded", color: "bg-[#00AEEF]" },
              { label: "Insights pending", color: "bg-orange-400" },
              { label: "Done", color: "bg-green-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
          {allDone && (
            <button
              onClick={() => setShowConsistency(true)}
              className="flex items-center gap-2 bg-[#2c7a4b] hover:bg-[#1a365d] text-white px-6 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest shadow-sm transition-colors"
            >
              <ShieldCheck size={14} /> {t("progress.all.done")}
            </button>
          )}
          <p className="text-[9px] text-slate-300 uppercase tracking-widest">
            Kingfisher & Partners · From strategy to execution
          </p>
        </div>
      </main>

      {/* Project Info Sidebar */}
      {showInfoSidebar && (
        <ProjectInfoSidebar meta={meta} onChange={setMeta} />
      )}

      </div>{/* end flex-1 row */}

      {/* Sliding panel */}
      {activeBlockId && (
        <>
          <BlockPanel
            block={activeBlock}
            docs={docs}
            insights={insights}
            bullets={bullets}
            canvasId={activeCanvasId}
            userId={user?.id}
            onClose={() => setActiveBlockId(null)}
            onDocsChange={handleDocsChange}
            onInsightAccept={handleInsightAccept}
            onInsightReject={handleInsightReject}
            onMoveToBullets={handleMoveToBullets}
            onDeleteBullet={handleDeleteBullet}
            onAddBullet={handleAddBullet}
            onShowTips={(blockId) => { setTipsSection(blockId); setShowTips(true); }}
          />
        </>
      )}

      {/* Consistency modal */}
      {showConsistency && (
        <ConsistencyModal bullets={bullets} onClose={() => setShowConsistency(false)} />
      )}

      {/* Tips modal */}
      {showTips && (
        <TipsModal
          initialSection={tipsSection}
          onClose={() => setShowTips(false)}
        />
      )}

      {/* Master Importer */}
      {showImporter && (
        <MasterImporterPanel
          canvasId={activeCanvasId}
          userId={user?.id}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Deep Dive Overlay */}
      {deepDiveBlockId && (
        <DeepDiveOverlay
          blockId={deepDiveBlockId}
          canvasId={activeCanvasId}
          onClose={() => setDeepDiveBlockId(null)}
          onManualSaved={m => { if (deepDiveBlockId === "strategy") setStrategyManual(m); }}
        />
      )}
    </div>
  );
}

// ── Auth-guard wrapper ────────────────────────────────────────────────────────
function AuthGate() {
  const { session } = useAuth();

  // Laden — sessie nog niet bepaald
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#1a365d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8dc63f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Niet ingelogd → toon LoginScreen
  if (!session) return <LoginScreen />;

  // Ingelogd → toon canvas app
  return <AppInner />;
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AuthGate />
      </LangProvider>
    </AuthProvider>
  );
}
