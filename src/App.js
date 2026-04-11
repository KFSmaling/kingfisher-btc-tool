import { useState, useRef, useEffect } from "react";
import { LangProvider, useLang } from "./i18n";
import {
  Upload, Zap, CheckSquare, List, ChevronRight, X,
  Edit3, Trash2, Plus, ShieldCheck, AlertCircle, CheckCircle2,
  AlertTriangle, FileText, BookOpen, Lightbulb, LogOut, Save, AlertOctagon
} from "lucide-react";
import { BLOCK_PROMPTS } from "./prompts/btcPrompts";
import { validateDocument } from "./services/btcValidator";
import { saveCanvasUpload, loadUserCanvases, createCanvas, upsertCanvas, loadCanvasById } from "./services/canvasStorage";
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
  { id: "tobe",    labelKey: "subtab.tobe",    dot: "bg-[#00AEEF]",    activeBg: "bg-blue-50 border-[#00AEEF]",     color: "border-[#00AEEF] text-[#00AEEF]"    },
  { id: "change",  labelKey: "subtab.change",  dot: "bg-orange-400",   activeBg: "bg-orange-50 border-orange-300",  color: "border-orange-400 text-orange-500"  },
];

const PRINCIPLES_SUBTABS = [
  { id: "customers",  labelKey: "block.customers.title",  dot: "bg-[#00AEEF]",   activeBg: "bg-blue-50 border-blue-300",      color: "border-blue-400 text-blue-600"      },
  { id: "processes",  labelKey: "block.processes.title",  dot: "bg-violet-500",  activeBg: "bg-violet-50 border-violet-300",  color: "border-violet-500 text-violet-600"  },
  { id: "people",     labelKey: "block.people.title",     dot: "bg-green-500",   activeBg: "bg-green-50 border-green-300",    color: "border-green-500 text-green-600"    },
  { id: "technology", labelKey: "block.technology.title", dot: "bg-slate-500",   activeBg: "bg-slate-100 border-slate-400",   color: "border-slate-500 text-slate-600"    },
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

// ── AI extraction via serverless function ────────────────────────────────────
async function extractWithAI(blockKey, documentText, langInstruction = "Respond in Dutch.") {
  const prompt = BLOCK_PROMPTS[blockKey];
  if (!prompt) throw new Error(`No prompt found for block: ${blockKey}`);

  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blockKey,
      documentText: langInstruction + "\n\n" + prompt + "\n\n" + documentText.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }

  const data = await response.json();
  const raw = data.text || "";
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("AI did not return a valid list");
  const arr = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("AI returned empty list");
  return arr.slice(0, 7);
}

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
  empty:    "border-slate-200 bg-white",
  uploaded: "border-[#00AEEF] border-t-4 bg-white",
  insights: "border-orange-400 border-t-4 bg-white",
  done:     "border-[#00AEEF] border-t-4 bg-white",
};

const STATUS_BADGE_KEYS = {
  empty:    null,
  uploaded: { labelKey: "status.uploaded", color: "bg-blue-100 text-blue-700" },
  insights: { labelKey: "status.insights", color: "bg-orange-100 text-orange-700" },
  done:     { labelKey: "status.done",     color: "bg-green-100 text-green-700" },
};

const SEV_COLOR = { high: "border-l-red-500 bg-red-50", medium: "border-l-orange-400 bg-orange-50", low: "border-l-slate-300 bg-slate-50" };
const SEV_TEXT  = { high: "text-red-600", medium: "text-orange-600", low: "text-slate-500" };

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
        p-6 border rounded-sm shadow-sm hover:shadow-xl cursor-pointer transition-all group relative flex flex-col justify-between min-h-[160px]
        ${STATUS_COLORS[status]}
        ${isWide ? "col-span-12" : isHalf ? "col-span-6" : isQuarter ? "col-span-3" : "col-span-4"}
      `}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-[#001f33] font-black text-sm uppercase tracking-widest">{title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 tracking-wide">{sub}</p>
          </div>
          {badge && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2 ${badge.color}`}>
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
                  <span className={`text-[8px] font-black uppercase tracking-widest ${st.color.split(" ")[1]}`}>{t(st.labelKey)}</span>
                  {stBullets.slice(0, 2).map((b, i) => (
                    <div key={i} className="flex items-start gap-2 mt-0.5">
                      <div className={`mt-1.5 w-1 h-1 rotate-45 shrink-0 ${st.dot}`} />
                      <span className="text-[11px] text-slate-600 leading-snug">{b.text}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {(bullets || []).length === 0 && (
              <p className="text-[11px] text-slate-400 italic uppercase tracking-tight">{t("status.empty")}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 mt-3">
            {(bullets || []).slice(0, isWide ? 4 : 3).map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rotate-45 shrink-0" />
                <span className="text-[12px] text-slate-600 leading-snug">{typeof b === "string" ? b : b.text}</span>
              </div>
            ))}
            {(bullets || []).length === 0 && (
              <p className="text-[11px] text-slate-400 italic uppercase tracking-tight">{t("status.empty")}</p>
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
        <ChevronRight size={18} className="text-slate-200 group-hover:text-[#00AEEF] transition-colors" />
      </div>
    </div>
  );
}

// ── Sliding Panel ────────────────────────────────────────────────────────────
function BlockPanel({ block, docs, insights, bullets, canvasId, userId, onClose, onDocsChange, onInsightAccept, onInsightReject, onMoveToBullets, onDeleteBullet, onAddBullet, onShowTips }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadPhase, setUploadPhase] = useState(null); // null | 'validating' | 'extracting'
  const [validation, setValidation] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newBullet, setNewBullet] = useState("");
  const [addingBullet, setAddingBullet] = useState(false);
  const [editedInsightTexts, setEditedInsightTexts] = useState({});
  const [activeSubTab, setActiveSubTab] = useState(() => block.subTabs?.[0]?.id || "current");
  const fileRef = useRef();

  const blockDocs = docs[block.id] || [];
  const blockInsights = insights[block.id] || [];
  const blockBullets = bullets[block.id] || [];
  const pendingInsights = blockInsights.filter(i => i.status === "pending");
  const acceptedInsights = blockInsights.filter(i => i.status === "accepted");

  const handleUpload = async (file) => {
    setUploadError(null);
    setValidation(null);

    // Duplicate check — voorkom dubbele uploads per blok
    if ((docs[block.id] || []).includes(file.name)) {
      setUploadError(`"${file.name}" is al geüpload voor dit blok.`);
      return;
    }

    try {
      // ── Stap 1: Parse (0 tokens) ───────────────────────────────────────────
      setUploadPhase("validating");
      const ext = file.name.split(".").pop().toLowerCase();
      const arrayBuf = await file.arrayBuffer();
      let text = "";

      if (ext === "txt" || ext === "csv") {
        // Client-side — direct leesbaar
        text = new TextDecoder("utf-8").decode(arrayBuf);

      } else if (ext === "pptx" || ext === "docx") {
        // Client-side via JSZip — geen server nodig, geen size-limiet
        const zip = await JSZip.loadAsync(arrayBuf);
        const xmlFiles = [];
        zip.forEach((path, zipFile) => {
          if (
            (ext === "pptx" && /^ppt\/slides\/slide\d+\.xml$/.test(path)) ||
            (ext === "docx" && path === "word/document.xml")
          ) xmlFiles.push(zipFile);
        });
        const xmlContents = await Promise.all(xmlFiles.map(f => f.async("string")));
        text = xmlContents
          .map(xml => xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
          .join("\n\n");

      } else if (ext === "pdf") {
        // Client-side via pdfjs-dist — geen server, geen size-limiet
        // Worker uit npm-pakket zelf, geen CDN-afhankelijkheid
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
        const pages = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          pages.push(content.items.map(i => i.str).join(" "));
        }
        text = pages.join("\n\n");

      } else {
        throw new Error(`Bestandstype .${ext} wordt niet ondersteund.`);
      }

      text = text.trim();
      if (text.length < 30) throw new Error("Bestand bevat geen leesbare tekst.");

      // ── Stap 2: Validate (goedkoop model, weinig tokens) ──────────────────
      const validResult = await validateDocument(text);
      if (!validResult.isValid) {
        throw new Error(validResult.overallReason || "Document niet geschikt voor BTC-analyse.");
      }
      setValidation(validResult);

      // ── Stap 3: Extract (premium model, alleen bij goedkeuring) ───────────
      setUploadPhase("extracting");
      const items = await extractWithAI(block.id, text, t("ai.language"));
      const newInsights = items.map((item, i) => ({ id: Date.now() + i, text: item, status: "pending", source: file.name }));
      onDocsChange(block.id, file.name, newInsights);

      // ── Stap 4: Opslaan in Supabase (canvas_uploads) ─────────────────────
      saveCanvasUpload({
        fileName: file.name,
        rawText:  text,
        insights: items,
        blockKey: block.id,
        language: t("ai.language").includes("Dutch") ? "nl" : "en",
        canvasId: canvasId || null,
        userId:   userId   || null,
      });

      setActiveTab("extract");
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadPhase(null);
    }
  };

  const TABS = [
    { id: "upload",   labelKey: "panel.tab.upload",  icon: Upload },
    { id: "extract",  labelKey: "panel.tab.extract", icon: Zap },
    { id: "review",   labelKey: "panel.tab.review",  icon: CheckSquare },
    { id: "canvas",   labelKey: "panel.tab.canvas",  icon: List },
  ];

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.12)] z-30 flex flex-col">
      {/* Panel header */}
      <div className="px-8 py-5 bg-[#001f33] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black text-lg uppercase tracking-tight">{t(block.titleKey)}</h2>
          <p className="text-[#00AEEF] text-[10px] uppercase tracking-widest mt-0.5">{t(block.subKey)}</p>
        </div>
        <div className="flex items-center gap-3">
          {TIPS_DATA.nl[block.id] && (
            <button
              onClick={() => onShowTips(block.id)}
              className="flex items-center gap-1.5 text-white/40 hover:text-[#00AEEF] transition-colors"
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
            className={`flex-1 py-4 flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all
              ${activeTab === tab.id ? "border-orange-500 text-[#001f33] bg-white" : "border-transparent text-slate-400 hover:text-[#001f33]"}`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* 1. UPLOAD */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div
              onClick={() => !uploadPhase && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-12 text-center transition-all cursor-pointer group
                ${uploadPhase === "validating" ? "border-violet-300 bg-violet-50" :
                  uploadPhase === "extracting" ? "border-orange-300 bg-orange-50" :
                  "border-slate-200 bg-slate-50 hover:border-[#00AEEF] hover:bg-blue-50"}`}
            >
              {uploadPhase === "validating" && (
                <>
                  <ShieldCheck size={40} className="mx-auto mb-4 text-violet-400 animate-pulse" />
                  <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{t("upload.scanning")}</p>
                  <p className="text-[9px] text-violet-300 mt-1">{t("upload.scanning.sub")}</p>
                </>
              )}
              {uploadPhase === "extracting" && (
                <>
                  <Zap size={40} className="mx-auto mb-4 text-orange-400 animate-pulse" />
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{t("upload.extracting")}</p>
                  <p className="text-[9px] text-orange-300 mt-1">{t("upload.extracting.sub")}</p>
                </>
              )}
              {!uploadPhase && (
                <>
                  <Upload size={40} className="mx-auto mb-4 text-slate-300 group-hover:text-[#00AEEF]" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("upload.cta")}</p>
                  <p className="text-[9px] text-slate-300 mt-1">{t("upload.formats")}</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.pptx,.docx,.csv"
                className="hidden"
                onChange={e => e.target.files[0] && handleUpload(e.target.files[0])}
              />
            </div>

            {uploadError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Validatieresultaat */}
            {validation && !uploadPhase && (
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <ShieldCheck size={13} className="text-[#2d6e4e]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t("upload.scan.result")}</span>
                  <span className="ml-auto text-[9px] text-slate-400 italic">{validation.overallReason}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {Object.entries(validation.confidenceScores || {}).map(([blockId, data]) => {
                    const score = data?.score ?? 0;
                    const color = score >= 70 ? "bg-[#2d6e4e]" : score >= 30 ? "bg-orange-400" : "bg-slate-200";
                    const textColor = score >= 70 ? "text-[#2d6e4e]" : score >= 30 ? "text-orange-500" : "text-slate-400";
                    const blockDef = BLOCKS.find(b => b.id === blockId);
                    const label = blockDef ? t(blockDef.titleKey) : blockId;
                    const isCurrentBlock = blockId === block.id;
                    return (
                      <div key={blockId} className={`flex items-center gap-3 px-4 py-2 ${isCurrentBlock ? "bg-blue-50" : ""}`}>
                        <span className={`text-[9px] font-black uppercase w-36 shrink-0 ${isCurrentBlock ? "text-[#001f33]" : "text-slate-500"}`}>{label}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
                        </div>
                        <span className={`text-[9px] font-black w-8 text-right ${textColor}`}>{score}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {blockDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t("upload.docs.label")}</p>
                {blockDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700">
                    <FileText size={14} className="text-[#00AEEF] shrink-0" />
                    {doc}
                  </div>
                ))}
              </div>
            )}

            {blockInsights.length > 0 && (
              <button
                onClick={() => setActiveTab("extract")}
                className="w-full py-3 bg-[#001f33] text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#00AEEF] transition-colors"
              >
                {t("upload.view.insights", { n: blockInsights.length })}
              </button>
            )}
          </div>
        )}

        {/* 2. EXTRACT */}
        {activeTab === "extract" && (
          <div className="space-y-4">
            {pendingInsights.length === 0 && acceptedInsights.length === 0 && (
              <div className="text-center py-16">
                <Zap size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t("extract.empty")}</p>
                <button onClick={() => setActiveTab("upload")} className="mt-4 text-xs text-[#00AEEF] font-bold hover:underline">{t("extract.back")}</button>
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
                <button onClick={() => setActiveTab("extract")} className="mt-4 text-xs text-[#00AEEF] font-bold hover:underline">{t("review.back")}</button>
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
                  className="text-[9px] font-black text-[#00AEEF] hover:text-orange-500 uppercase tracking-widest transition-colors"
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
                  className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-sm p-3 resize-none focus:outline-none focus:border-[#00AEEF] bg-slate-50 transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = (editedInsightTexts[ins.id] ?? ins.text).trim();
                      if (text) onMoveToBullets(block.id, { ...ins, text });
                    }}
                    className="flex-1 py-2.5 bg-[#001f33] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#00AEEF] transition-colors"
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
                                    className="flex-1 text-sm border-b border-[#00AEEF] outline-none text-slate-800 bg-transparent"
                                    onKeyDown={e => {
                                      if (e.key === "Enter") { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }
                                      if (e.key === "Escape") setEditingIdx(null);
                                    }}
                                  />
                                  <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource, subtab: activeSubTab }, i, true); setEditingIdx(null); }} className="text-[10px] text-green-600 font-bold">✓</button>
                                  <button onClick={() => setEditingIdx(null)} className="text-[10px] text-slate-400 font-bold">✕</button>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-700 leading-snug block">{bulletText}</span>
                              )}
                              {bulletSource && editingIdx !== i && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FileText size={10} className="text-slate-300 shrink-0" />
                                  <span className="text-[9px] text-slate-400 italic truncate">{bulletSource}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 items-center">
                              {/* Move to other sub-tab */}
                              <select
                                value={activeSubTab}
                                onChange={e => onMoveToBullets(block.id, { text: bulletText, source: bulletSource, subtab: e.target.value }, i, true)}
                                className="text-[9px] text-slate-400 bg-white border border-slate-200 rounded-sm px-1 py-0.5 outline-none hover:border-[#00AEEF] cursor-pointer"
                                title={t("canvas.move.to")}
                              >
                                {(block.subTabs || PILLAR_SUBTABS).map(s => (
                                  <option key={s.id} value={s.id} disabled={s.id === activeSubTab}>{t(s.labelKey)}</option>
                                ))}
                              </select>
                              <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#00AEEF]"><Edit3 size={14} /></button>
                              <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}

                      {addingBullet && (
                        <div className="flex items-center gap-2 p-3 border border-dashed border-[#00AEEF] rounded-sm">
                          <div className={`w-2 h-2 rotate-45 shrink-0 ${st.dot}`} />
                          <input
                            autoFocus
                            value={newBullet}
                            onChange={e => setNewBullet(e.target.value)}
                            placeholder={`${t("canvas.add.manual")} ${t(st.labelKey).toLowerCase()}…`}
                            className="flex-1 text-sm outline-none text-slate-800"
                            onKeyDown={e => {
                              if (e.key === "Enter" && newBullet.trim()) {
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
                        className="flex items-center gap-1 text-[10px] font-black text-[#00AEEF] hover:text-orange-500 uppercase tracking-widest transition-colors pt-1"
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
                      className="flex items-center gap-1 text-[10px] font-black text-[#00AEEF] hover:text-orange-500 uppercase tracking-widest transition-colors"
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
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              className="flex-1 text-sm border-b border-[#00AEEF] outline-none text-slate-800 bg-transparent"
                              onKeyDown={e => {
                                if (e.key === "Enter") { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }
                                if (e.key === "Escape") setEditingIdx(null);
                              }}
                            />
                            <button onClick={() => { onMoveToBullets(block.id, { text: editVal, source: bulletSource }, i, true); setEditingIdx(null); }} className="text-[10px] text-green-600 font-bold">✓</button>
                            <button onClick={() => setEditingIdx(null)} className="text-[10px] text-slate-400 font-bold">✕</button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-700 leading-snug block">{bulletText}</span>
                        )}
                        {bulletSource && editingIdx !== i && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText size={10} className="text-slate-300 shrink-0" />
                            <span className="text-[9px] text-slate-400 italic truncate">{bulletSource}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingIdx(i); setEditVal(bulletText); }} className="text-slate-300 hover:text-[#00AEEF]"><Edit3 size={14} /></button>
                        <button onClick={() => onDeleteBullet(block.id, i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}

                {addingBullet && (
                  <div className="flex items-center gap-2 p-3 border border-dashed border-[#00AEEF] rounded-sm">
                    <div className="w-2 h-2 bg-orange-500 rotate-45 shrink-0" />
                    <input
                      autoFocus
                      value={newBullet}
                      onChange={e => setNewBullet(e.target.value)}
                      placeholder={t("canvas.placeholder")}
                      className="flex-1 text-sm outline-none text-slate-800"
                      onKeyDown={e => {
                        if (e.key === "Enter" && newBullet.trim()) {
                          onAddBullet(block.id, newBullet.trim(), null);
                          setNewBullet("");
                          setAddingBullet(false);
                        }
                        if (e.key === "Escape") { setAddingBullet(false); setNewBullet(""); }
                      }}
                    />
                    <button onClick={() => setAddingBullet(false)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
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
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#00AEEF] max-h-[90vh] overflow-y-auto">
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
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#00AEEF] flex overflow-hidden" style={{ height: "80vh" }}>

        {/* Left nav */}
        <div className="w-52 bg-[#001f33] flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen size={14} className="text-[#00AEEF]" />
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
                      ? "bg-[#00AEEF]/20 text-white font-bold border-l-2 border-[#00AEEF]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"}
                    ${isFirst ? "mb-1" : ""}`}
                >
                  {isFirst && <Lightbulb size={12} className={isActive ? "text-[#00AEEF]" : "text-white/30"} />}
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
              <div key={i} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-sm hover:border-[#00AEEF]/30 transition-colors">
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
function CanvasMenu({ currentName, activeCanvasId, canvases, onNew, onSelect, onRename, onLoadExample }) {
  const { t } = useLang();
  const [open, setOpen]               = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName]     = useState("");

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
          className="bg-transparent border-b border-white/60 text-white text-base font-semibold outline-none w-64 pb-0.5 placeholder-white/40"
          placeholder="Canvas naam…"
        />
      ) : (
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2.5 group">
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium leading-none mb-1">{t("header.active.canvas")}</span>
            <span className="text-white font-semibold text-[15px] leading-none group-hover:text-[#00AEEF] transition-colors">
              {displayName}
            </span>
          </div>
          <svg width="10" height="6" viewBox="0 0 10 6" className={`text-white/40 group-hover:text-[#00AEEF] transition-all mt-2 ${open ? "rotate-180" : ""}`} fill="currentColor">
            <path d="M0 0l5 6 5-6H0z"/>
          </svg>
        </button>
      )}

      {/* Potlood: naam bewerken */}
      {!editingName && (
        <button
          onClick={() => { setDraftName(currentName || ""); setEditingName(true); setOpen(false); }}
          className="ml-2 mt-1 text-white/20 hover:text-white/70 transition-colors"
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
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border border-dashed border-slate-200 hover:border-[#00AEEF] transition-colors"
              >
                <Plus size={13} className="text-[#00AEEF] shrink-0" />
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
                  const savedAt = c.updated_at
                    ? new Date(c.updated_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
                    : "";
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onSelect(c); setOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between group transition-colors
                        ${c.id === activeCanvasId ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">{c.name || t("menu.unnamed")}</p>
                        <p className="text-[9px] text-slate-400">{savedAt}</p>
                      </div>
                    </button>
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

// ── Main App ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { t, lang, setLang } = useLang();
  const { user, signOut }    = useAuth();

  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showConsistency, setShowConsistency] = useState(null);
  const [showTips, setShowTips]   = useState(false);
  const [tipsSection, setTipsSection] = useState("algemeen");

  // Canvas identiteit
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [canvases, setCanvases] = useState([]);
  const [scope, setScope]       = useState("");

  // Per-block state
  const [docs, setDocs]         = useState({});
  const [insights, setInsights] = useState({});
  const [bullets, setBullets]   = useState({});

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
      if (error) { console.error("Canvassen laden mislukt:", error.message); return; }

      if (data && data.length > 0) {
        setCanvases(data);
        // Laad het meest recente canvas
        const latest = data[0];
        const { data: full } = await loadCanvasById(latest.id);
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
        // Geen canvassen — maak direct een nieuw canvas aan
        const name = `Canvas ${today}`;
        const { data: created } = await createCanvas({ userId: user.id, name, language: lang });
        if (created) {
          setCanvases([created]);
          setActiveCanvasId(created.id);
          setScope(created.name);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Autosave (500ms debounce, last-write-wins) ───────────────────────────
  useEffect(() => {
    if (!activeCanvasId || !user || suppressSaveRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      const { error } = await upsertCanvas(activeCanvasId, { scope, docs, insights, bullets, language: lang });
      if (!error) {
        setSaveStatus("saved");
        // Actualiseer naam in lokale canvassenlijst
        setCanvases(prev => prev.map(c =>
          c.id === activeCanvasId ? { ...c, name: scope, updated_at: new Date().toISOString() } : c
        ));
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(autosaveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, docs, insights, bullets, activeCanvasId]);

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
      setActiveBlockId(null);
      setTimeout(() => { suppressSaveRef.current = false; }, 100);
    }
  };

  const handleRenameCanvas = (newName) => {
    setScope(newName);
    // Autosave pikt de gewijzigde scope op via het debounce-effect
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
    <div className="min-h-screen bg-[#F4F7F9] text-[#1A365D] font-sans">

      {/* Header */}
      <header className="h-20 bg-[#001f33] text-white flex items-center justify-between shadow-xl z-20 border-b-2 border-[#00AEEF]/50 shrink-0">

        {/* Left: logo + app title */}
        <div className="flex items-center h-full shrink-0">
          <div className="bg-white px-4 flex items-center h-full shrink-0 border-r border-slate-200/20">
            <img src="/kf-logo.png" alt="Kingfisher & Partners" className="h-9 object-contain" />
          </div>
          <div className="px-6 border-r border-white/10 h-full flex flex-col justify-center">
            <h1 className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/90 leading-none">Business Transformation Canvas</h1>
            <p className="text-[9px] tracking-[0.2em] text-[#00AEEF]/70 mt-1 uppercase font-light">From strategy to execution</p>
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
          />
        </div>

        {/* Right: autosave indicator + lang + tips + consistency + logout */}
        <div className="flex items-center gap-3 px-6 shrink-0">

          {/* Autosave indicator */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-[9px] text-white/40 uppercase tracking-widest">
              <Save size={11} className="animate-pulse" /> Opslaan…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-[9px] text-green-400 uppercase tracking-widest">
              <CheckCircle2 size={11} /> Opgeslagen
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-[9px] text-red-400 uppercase tracking-widest">
              <AlertOctagon size={11} /> Opslaan mislukt
            </span>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "nl" ? "en" : "nl")}
            className="flex items-center gap-1.5 text-white/50 hover:text-white border border-white/20 hover:border-white/40 px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
            title="Switch language"
          >
            <span className={lang === "nl" ? "text-white" : "text-white/30"}>NL</span>
            <span className="text-white/20">|</span>
            <span className={lang === "en" ? "text-white" : "text-white/30"}>EN</span>
          </button>

          <button
            onClick={() => { setTipsSection("algemeen"); setShowTips(true); }}
            className="flex items-center gap-2 text-white/60 hover:text-white border border-white/20 hover:border-white/50 px-4 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            title={t("tips.title")}
          >
            <BookOpen size={14} /> {t("header.tips")}
          </button>

          <button
            onClick={() => setShowConsistency(true)}
            className="flex items-center gap-2 bg-[#00AEEF] hover:bg-orange-500 text-white px-5 py-2.5 rounded-sm font-black text-[10px] shadow-lg transition-all uppercase tracking-widest"
          >
            <ShieldCheck size={15} /> {t("header.consistency")}
          </button>

          {/* Uitloggen */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-white/30 hover:text-white/80 transition-colors ml-1"
            title="Uitloggen"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Multi-tab waarschuwing */}
      {multiTabWarning && (
        <div className="bg-orange-500 text-white px-6 py-2 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            De app is al geopend in een ander tabblad. Wijzigingen in dit tabblad kunnen overschreven worden.
          </span>
          <button onClick={() => setMultiTabWarning(false)} className="text-white/70 hover:text-white ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard */}
      <main className="p-10">

        {/* Canvas grid — BTC layout (12-col) */}
        <div className="grid grid-cols-12 gap-5">

          {/* Row 1: Strategy — full width (col-span-12) */}
          {BLOCKS.filter(b => b.id === "strategy").map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setActiveBlockId(block.id)}
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
              onClick={() => setActiveBlockId(block.id)}
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
              onClick={() => setActiveBlockId(block.id)}
            />
          ))}

          {/* Row 4: Portfolio Roadmap — full width (col-span-12) */}
          <BlockCard
            key="portfolio"
            block={BLOCKS.find(b => b.id === "portfolio")}
            status={getBlockStatus("portfolio", docs, insights, bullets)}
            bullets={bullets["portfolio"]}
            insightCount={(insights["portfolio"] || []).filter(i => i.status === "pending").length}
            onClick={() => setActiveBlockId("portfolio")}
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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-sm text-xs font-black uppercase tracking-widest shadow-md transition-colors"
            >
              <ShieldCheck size={14} /> {t("progress.all.done")}
            </button>
          )}
          <p className="text-[9px] text-slate-300 uppercase tracking-widest">
            Kingfisher & Partners · From strategy to execution
          </p>
        </div>
      </main>

      {/* Sliding panel overlay */}
      {activeBlockId && (
        <>
          <div
            className="fixed inset-0 bg-[#001f33]/20 z-20 backdrop-blur-[1px]"
            onClick={() => setActiveBlockId(null)}
          />
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
    </div>
  );
}

// ── Auth-guard wrapper ────────────────────────────────────────────────────────
function AuthGate() {
  const { session } = useAuth();

  // Laden — sessie nog niet bepaald
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#001f33] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00AEEF] border-t-transparent rounded-full animate-spin" />
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
