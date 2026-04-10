import { useState, useRef } from "react";
import {
  Upload, Zap, CheckSquare, List, ChevronRight, X,
  Edit3, Trash2, Plus, ShieldCheck, AlertCircle, CheckCircle2,
  AlertTriangle, FileText
} from "lucide-react";
import { BLOCK_PROMPTS } from "./prompts/btcPrompts";

// ── BTC Block definitions ────────────────────────────────────────────────────
const BLOCKS = [
  { id: "strategy",   title: "Strategy",                 sub: "Mission · Vision · Themes · KPIs",            layout: "wide",    hasSubs: false },
  { id: "principles", title: "Guiding Principles",       sub: "Design rules for all pillars",                layout: "half",    hasSubs: false },
  { id: "customers",  title: "Customers & Services",     sub: "Groups · Journeys · Channels · Products",     layout: "half",    hasSubs: true  },
  { id: "processes",  title: "Processes & Organisation", sub: "Process model · Org design · Governance",     layout: "quarter", hasSubs: true  },
  { id: "people",     title: "People & Competencies",    sub: "Leadership · Skills · Culture",               layout: "quarter", hasSubs: true  },
  { id: "technology", title: "Information & Technology", sub: "Data · Applications · Platforms",             layout: "quarter", hasSubs: true  },
  { id: "portfolio",  title: "Change Portfolio",         sub: "Initiatives · Value · Complexity · Owner",    layout: "wide",    hasSubs: false },
];

const SUBTABS = [
  { id: "current", label: "Current",  color: "border-slate-400 text-slate-600",  dot: "bg-slate-400",   activeBg: "bg-slate-50  border-slate-300" },
  { id: "tobe",    label: "To-Be",    color: "border-[#00AEEF] text-[#00AEEF]",  dot: "bg-[#00AEEF]",   activeBg: "bg-blue-50   border-[#00AEEF]" },
  { id: "change",  label: "Change",   color: "border-orange-400 text-orange-500", dot: "bg-orange-400",  activeBg: "bg-orange-50 border-orange-300" },
];

// Helper to convert string arrays to bullet objects
const eb  = (texts, source) => texts.map(text => ({ text, source }));
const ebs = (texts, source, subtab) => texts.map(text => ({ text, source, subtab }));

const EXAMPLE_BULLETS = {
  strategy:   eb(["Vision: Best HNW Global insurer, excelling in customer service","Pivot: from Maintain & Sell to Invest & Grow","Driver A: Customer & partner centricity — omnichannel excellence","Driver B: Product differentiation — new propositions in 6 months","Goal: Double value creation by 2028"], "example-strategy.pdf"),
  principles: eb(["Customer focus: treat HNWI by CLV — no one-size-fits-all","Personalisation: 360° customer view across all channels","Product modularisation: reusable components, white-label ready","Convenience: omnichannel consistency — same request, same outcome"], "example-principles.pdf"),
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
async function extractWithAI(blockKey, documentText) {
  const prompt = BLOCK_PROMPTS[blockKey];
  if (!prompt) throw new Error(`No prompt found for block: ${blockKey}`);

  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blockKey,
      documentText: prompt + "\n\n" + documentText.slice(0, 8000),
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
    issues.push({ severity: "high", blocks: ["strategy", "portfolio"], issue: "Strategy has multiple themes but change portfolio is underdeveloped." });
  if (filled("people") < 2 && filled("technology") >= 3)
    issues.push({ severity: "medium", blocks: ["people", "technology"], issue: "Strong technology agenda but people & competencies is underdeveloped — execution risk." });
  if (filled("principles") < 2)
    issues.push({ severity: "medium", blocks: ["principles"], issue: "Guiding principles are thin — these should constrain decisions in all 4 pillars." });
  if (filled("customers") >= 3 && filled("processes") < 2)
    issues.push({ severity: "low", blocks: ["customers", "processes"], issue: "Customer ambitions are set, but operating model to deliver them is not defined." });
  if (issues.length === 0)
    issues.push({ severity: "low", blocks: ["strategy", "principles"], issue: "Check that each guiding principle directly enforces a strategic choice." });

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

const STATUS_BADGE = {
  empty:    null,
  uploaded: { label: "Uploaded", color: "bg-blue-100 text-blue-700" },
  insights: { label: "Pending review", color: "bg-orange-100 text-orange-700" },
  done:     { label: "Done", color: "bg-green-100 text-green-700" },
};

const SEV_COLOR = { high: "border-l-red-500 bg-red-50", medium: "border-l-orange-400 bg-orange-50", low: "border-l-slate-300 bg-slate-50" };
const SEV_TEXT  = { high: "text-red-600", medium: "text-orange-600", low: "text-slate-500" };

// ── Block Card (dashboard) ───────────────────────────────────────────────────
function BlockCard({ block, status, bullets, insightCount, onClick }) {
  const badge = STATUS_BADGE[status];
  const isWide = block.layout === "wide";
  const isHalf = block.layout === "half";

  return (
    <div
      onClick={onClick}
      className={`
        p-6 border rounded-sm shadow-sm hover:shadow-xl cursor-pointer transition-all group relative flex flex-col justify-between min-h-[160px]
        ${STATUS_COLORS[status]}
        ${isWide ? "col-span-12" : isHalf ? "col-span-6" : "col-span-4"}
      `}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-[#001f33] font-black text-sm uppercase tracking-widest">{block.title}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 tracking-wide">{block.sub}</p>
          </div>
          {badge && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2 ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Bullet preview */}
        {block.hasSubs ? (
          // Pillar blocks: show bullets grouped by subtab label
          <div className="space-y-1 mt-3">
            {SUBTABS.map(st => {
              const stBullets = (bullets || []).filter(b => b.subtab === st.id);
              if (stBullets.length === 0) return null;
              return (
                <div key={st.id}>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${st.color.split(" ")[1]}`}>{st.label}</span>
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
              <p className="text-[11px] text-slate-400 italic uppercase tracking-tight">No data yet</p>
            )}
          </div>
        ) : (
          // Other blocks: flat bullet list
          <div className="space-y-1.5 mt-3">
            {(bullets || []).slice(0, isWide ? 4 : 3).map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rotate-45 shrink-0" />
                <span className="text-[12px] text-slate-600 leading-snug">{typeof b === "string" ? b : b.text}</span>
              </div>
            ))}
            {(bullets || []).length === 0 && (
              <p className="text-[11px] text-slate-400 italic uppercase tracking-tight">No data yet</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
        {insightCount > 0 ? (
          <span className="text-[9px] font-bold text-orange-500 uppercase">{insightCount} insight{insightCount !== 1 ? "s" : ""} pending</span>
        ) : block.hasSubs ? (
          // Show filled sub-tab pills as visible status indicators
          <div className="flex items-center gap-1.5">
            {SUBTABS.map(st => {
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
                  {st.label}{filled ? ` · ${count}` : ""}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-[9px] text-slate-300 uppercase">{(bullets || []).length} bullet{(bullets || []).length !== 1 ? "s" : ""}</span>
        )}
        <ChevronRight size={18} className="text-slate-200 group-hover:text-[#00AEEF] transition-colors" />
      </div>
    </div>
  );
}

// ── Sliding Panel ────────────────────────────────────────────────────────────
function BlockPanel({ block, docs, insights, bullets, onClose, onDocsChange, onInsightAccept, onInsightReject, onMoveToBullets, onDeleteBullet, onAddBullet }) {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newBullet, setNewBullet] = useState("");
  const [addingBullet, setAddingBullet] = useState(false);
  const [editedInsightTexts, setEditedInsightTexts] = useState({});
  const [activeSubTab, setActiveSubTab] = useState("current");
  const fileRef = useRef();

  const blockDocs = docs[block.id] || [];
  const blockInsights = insights[block.id] || [];
  const blockBullets = bullets[block.id] || [];
  const pendingInsights = blockInsights.filter(i => i.status === "pending");
  const acceptedInsights = blockInsights.filter(i => i.status === "accepted");

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadError(null);
    try {
      const text = await file.text();
      if (!text || text.trim().length < 20) throw new Error("File appears to be empty or binary.");
      const items = await extractWithAI(block.id, text);
      const newInsights = items.map((text, i) => ({ id: Date.now() + i, text, status: "pending", source: file.name }));
      onDocsChange(block.id, file.name, newInsights);
      setActiveTab("extract");
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const TABS = [
    { id: "upload",   label: "1. Upload",    icon: Upload },
    { id: "extract",  label: "2. Extract",   icon: Zap },
    { id: "review",   label: "3. Review",    icon: CheckSquare },
    { id: "canvas",   label: "4. Canvas",    icon: List },
  ];

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.12)] z-30 flex flex-col">
      {/* Panel header */}
      <div className="px-8 py-6 bg-[#001f33] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black text-lg uppercase tracking-tight">{block.title}</h2>
          <p className="text-[#00AEEF] text-[10px] uppercase tracking-widest mt-0.5">{block.sub}</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* 1. UPLOAD */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-16 text-center transition-all cursor-pointer group
                ${uploading ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-[#00AEEF] hover:bg-blue-50"}`}
            >
              <Upload size={40} className={`mx-auto mb-4 ${uploading ? "text-orange-400 animate-pulse" : "text-slate-300 group-hover:text-[#00AEEF]"}`} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {uploading ? "Extracting with AI…" : "Click to upload a document"}
              </p>
              <p className="text-[9px] text-slate-300 mt-1">PDF · PPTX · DOCX · TXT</p>
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

            {blockDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Uploaded documents</p>
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
                View {blockInsights.length} extracted insights →
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
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Upload a document to extract insights</p>
                <button onClick={() => setActiveTab("upload")} className="mt-4 text-xs text-[#00AEEF] font-bold hover:underline">← Back to upload</button>
              </div>
            )}

            {/* Counter */}
            {(pendingInsights.length > 0 || acceptedInsights.length > 0) && (
              <div className="flex gap-4 pb-3 border-b border-slate-100">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{pendingInsights.length} pending</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-green-600">{acceptedInsights.length} accepted</span>
              </div>
            )}

            {/* Pending insights — accept or reject only */}
            {pendingInsights.map(ins => (
              <div key={ins.id} className="p-5 bg-slate-50 border border-slate-200 border-l-4 border-l-[#00AEEF] rounded-sm">
                <p className="text-sm text-slate-800 leading-relaxed mb-4">{ins.text}</p>
                {ins.source && (
                  <p className="text-[9px] text-slate-400 mb-3 italic">Bron: {ins.source}</p>
                )}
                <div className="flex gap-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onInsightAccept(block.id, ins.id)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500"
                  >
                    × Reject
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
                Review &amp; edit {acceptedInsights.length} accepted insight{acceptedInsights.length !== 1 ? "s" : ""} →
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
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">No accepted insights yet</p>
                <button onClick={() => setActiveTab("extract")} className="mt-4 text-xs text-[#00AEEF] font-bold hover:underline">← Back to Extract</button>
              </div>
            )}
            {acceptedInsights.length > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {acceptedInsights.length} insight{acceptedInsights.length !== 1 ? "s" : ""} — bewerk indien nodig
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
                  Alles naar canvas →
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
                    ✓ Naar canvas
                  </button>
                  <button
                    onClick={() => onInsightReject(block.id, ins.id)}
                    className="px-4 py-2.5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest border border-slate-200 rounded-sm hover:border-red-200 transition-colors"
                  >
                    Verwijder
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
                  {SUBTABS.map(st => {
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
                        {st.label}
                        {count > 0 && <span className="text-[8px]">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-tab bullet list */}
                {(() => {
                  const st = SUBTABS.find(s => s.id === activeSubTab);
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
                                title="Verplaats naar…"
                              >
                                {SUBTABS.map(s => (
                                  <option key={s.id} value={s.id} disabled={s.id === activeSubTab}>{s.label}</option>
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
                            placeholder={`Voeg ${st.label.toLowerCase()} bullet toe…`}
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
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{st.label} — nog leeg</p>
                          <p className="text-[9px] text-slate-300 mt-1">Voeg handmatig toe of push vanuit Review</p>
                        </div>
                      )}

                      <button
                        onClick={() => setAddingBullet(true)}
                        className="flex items-center gap-1 text-[10px] font-black text-[#00AEEF] hover:text-orange-500 uppercase tracking-widest transition-colors pt-1"
                      >
                        <Plus size={14} /> Handmatig toevoegen
                      </button>
                    </div>
                  );
                })()}
              </>
            ) : (
              /* ── Non-pillar blocks: flat list (unchanged) ── */
              <>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-[9px] font-black text-[#001f33] uppercase tracking-widest">Canvas bullets ({blockBullets.length}/7)</span>
                  {blockBullets.length < 7 && (
                    <button
                      onClick={() => setAddingBullet(true)}
                      className="flex items-center gap-1 text-[10px] font-black text-[#00AEEF] hover:text-orange-500 uppercase tracking-widest transition-colors"
                    >
                      <Plus size={14} /> Add manually
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
                      placeholder="Type bullet point…"
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
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">No bullets yet</p>
                    <p className="text-[9px] text-slate-300 mt-1">Accept insights in the Review tab, or add manually</p>
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
  const { scores, issues, overall } = runConsistencyCheck(bullets);
  const scoreColor = v => v >= 70 ? "text-green-600" : v >= 45 ? "text-orange-500" : "text-red-500";
  const barColor  = v => v >= 70 ? "bg-green-500" : v >= 45 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="fixed inset-0 bg-[#001f33]/95 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl border-t-4 border-[#00AEEF] max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-[#001f33] font-black text-2xl uppercase tracking-tighter">Canvas Consistency Check</h2>
            <p className="text-slate-400 text-xs mt-1">Overall score: <span className={`font-black text-lg ${scoreColor(overall)}`}>{overall}/100</span></p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 transition-colors"><X size={28} /></button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8">
          {/* Per block scores */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Per block</p>
            <div className="space-y-3">
              {BLOCKS.map(b => {
                const s = scores[b.id] || 0;
                return (
                  <div key={b.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-700">{b.title}</span>
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Issues & observations</p>
            <div className="space-y-3">
              {issues.map((iss, i) => (
                <div key={i} className={`p-4 border-l-4 rounded-sm ${SEV_COLOR[iss.severity]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className={SEV_TEXT[iss.severity]} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${SEV_TEXT[iss.severity]}`}>
                      {iss.severity} · {iss.blocks.join(" ↔ ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{iss.issue}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Manager (localStorage) ───────────────────────────────────────────
const STORAGE_KEY = "btc_canvases";

function loadAllCanvases() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveAllCanvases(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// CanvasMenu renders as the central canvas-name element in the header (Optie A)
function CanvasMenu({ currentName, currentState, onLoad, onNew, onNameChange }) {
  const [open, setOpen] = useState(false);
  const [canvases, setCanvases] = useState(loadAllCanvases);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  const handleSave = () => {
    const name = (saving && draftName.trim()) ? draftName.trim() : (currentName || "Naamloos canvas");
    const now = new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
    const existing = canvases.findIndex(c => c.name === name);
    const entry = { name, savedAt: now, state: { ...currentState, scope: name } };
    const updated = existing >= 0
      ? canvases.map((c, i) => i === existing ? entry : c)
      : [entry, ...canvases];
    saveAllCanvases(updated);
    setCanvases(updated);
    setSaving(false);
    setDraftName("");
    onNameChange(name);
  };

  const handleDelete = (name, e) => {
    e.stopPropagation();
    const updated = canvases.filter(c => c.name !== name);
    saveAllCanvases(updated);
    setCanvases(updated);
  };

  const displayName = currentName || "Naamloos canvas";

  return (
    <div className="relative flex items-center">
      {/* Central canvas name — click to open menu */}
      {editingName ? (
        <input
          autoFocus
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={() => { if (draftName.trim()) onNameChange(draftName.trim()); setEditingName(false); }}
          onKeyDown={e => {
            if (e.key === "Enter") { if (draftName.trim()) onNameChange(draftName.trim()); setEditingName(false); }
            if (e.key === "Escape") setEditingName(false);
          }}
          className="bg-transparent border-b border-white/60 text-white text-base font-semibold outline-none w-64 pb-0.5 placeholder-white/40"
          placeholder="Canvas naam…"
        />
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium leading-none mb-1">Actief canvas</span>
            <span className="text-white font-semibold text-[15px] leading-none group-hover:text-[#00AEEF] transition-colors">
              {displayName}
            </span>
          </div>
          <svg width="10" height="6" viewBox="0 0 10 6" className={`text-white/40 group-hover:text-[#00AEEF] transition-all mt-2 ${open ? "rotate-180" : ""}`} fill="currentColor">
            <path d="M0 0l5 6 5-6H0z"/>
          </svg>
        </button>
      )}

      {/* Edit name pencil */}
      {!editingName && (
        <button
          onClick={() => { setDraftName(currentName || ""); setEditingName(true); setOpen(false); }}
          className="ml-2 mt-1 text-white/20 hover:text-white/70 transition-colors"
          title="Naam bewerken"
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
              {/* New canvas */}
              <button
                onClick={() => { onNew(); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 border border-dashed border-slate-200 hover:border-[#00AEEF] transition-colors"
              >
                <Plus size={13} className="text-[#00AEEF] shrink-0" />
                <span className="font-semibold">Nieuw canvas</span>
              </button>
              {/* Load example */}
              <button
                onClick={() => { onLoad("example"); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-sm text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <FileText size={13} className="text-slate-400 shrink-0" />
                <span>Voorbeeld laden</span>
              </button>
            </div>

            {/* Saved canvases */}
            {canvases.length > 0 && (
              <div className="p-3 space-y-1 border-b border-slate-100 max-h-52 overflow-y-auto">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1 pb-1">Opgeslagen canvassen</p>
                {canvases.map(c => (
                  <button
                    key={c.name}
                    onClick={() => { onLoad({ ...c.state, scope: c.name }); setOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center justify-between group transition-colors
                      ${c.name === currentName ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{c.name}</p>
                      <p className="text-[9px] text-slate-400">{c.savedAt}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(c.name, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Save */}
            <div className="p-3">
              {saving ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder={currentName || "Canvas naam…"}
                    className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-sm px-3 py-2 outline-none focus:border-[#00AEEF]"
                    onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setSaving(false); }}
                  />
                  <button onClick={handleSave} className="px-3 py-2 bg-[#001f33] text-white text-xs rounded-sm hover:bg-[#00AEEF] transition-colors font-bold">✓</button>
                  <button onClick={() => setSaving(false)} className="text-slate-400 hover:text-red-500 px-1"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => { setSaving(true); setDraftName(currentName || ""); }}
                  className="w-full py-2 bg-[#001f33] text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-[#00AEEF] transition-colors"
                >
                  Huidig canvas opslaan
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showConsistency, setShowConsistency] = useState(null);
  const [scope, setScope] = useState("");

  // Per-block state
  const [docs, setDocs] = useState({});
  const [insights, setInsights] = useState({});
  const [bullets, setBullets] = useState({});

  const activeBlock = BLOCKS.find(b => b.id === activeBlockId);

  // Canvas state snapshot for saving
  const currentCanvasState = { scope, docs, insights, bullets };

  const handleLoadCanvas = (stateOrKey) => {
    if (stateOrKey === "example") {
      setBullets(EXAMPLE_BULLETS);
      setScope("Company Example — BTP 2024");
      setDocs({});
      setInsights({});
    } else {
      setScope(stateOrKey.scope || "");
      setDocs(stateOrKey.docs || {});
      setInsights(stateOrKey.insights || {});
      setBullets(stateOrKey.bullets || {});
    }
    setActiveBlockId(null);
  };

  const handleNewCanvas = () => {
    setDocs({}); setInsights({}); setBullets({}); setScope(""); setActiveBlockId(null);
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
      subtab: insight.subtab || (block?.hasSubs ? "current" : null),
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
            currentState={currentCanvasState}
            onLoad={handleLoadCanvas}
            onNew={handleNewCanvas}
            onNameChange={setScope}
          />
        </div>

        {/* Right: consistency check */}
        <div className="flex items-center gap-4 px-8 shrink-0">
          <button
            onClick={() => setShowConsistency(true)}
            className="flex items-center gap-2 bg-[#00AEEF] hover:bg-orange-500 text-white px-5 py-2.5 rounded-sm font-black text-[10px] shadow-lg transition-all uppercase tracking-widest"
          >
            <ShieldCheck size={15} /> Consistency Check
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <main className="p-10">

        {/* Canvas grid — BTC layout (12-col for even thirds on row 3) */}
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

          {/* Row 2: Principles + Customers — half width each (col-span-6) */}
          {BLOCKS.filter(b => ["principles", "customers"].includes(b.id)).map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setActiveBlockId(block.id)}
            />
          ))}

          {/* Row 3: Processes + People + Technology — equal thirds (col-span-4 each) */}
          {BLOCKS.filter(b => ["processes", "people", "technology"].includes(b.id)).map(block => (
            <BlockCard
              key={block.id}
              block={block}
              status={getBlockStatus(block.id, docs, insights, bullets)}
              bullets={bullets[block.id]}
              insightCount={(insights[block.id] || []).filter(i => i.status === "pending").length}
              onClick={() => setActiveBlockId(block.id)}
            />
          ))}

          {/* Row 4: Portfolio — full width (col-span-12) */}
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
              <ShieldCheck size={14} /> All blocks done — Run full analysis
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
            onClose={() => setActiveBlockId(null)}
            onDocsChange={handleDocsChange}
            onInsightAccept={handleInsightAccept}
            onInsightReject={handleInsightReject}
            onMoveToBullets={handleMoveToBullets}
            onDeleteBullet={handleDeleteBullet}
            onAddBullet={handleAddBullet}
          />
        </>
      )}

      {/* Consistency modal */}
      {showConsistency && (
        <ConsistencyModal bullets={bullets} onClose={() => setShowConsistency(false)} />
      )}
    </div>
  );
}
