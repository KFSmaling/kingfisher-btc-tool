import { useState, useRef } from "react";

const KF = {
  navyDark: "#0d1b3e", navy: "#12285a", navyLight: "#1a3570",
  green: "#2d6e4e", greenLight: "#3a8f66",
  white: "#ffffff", offWhite: "#f5f7fa",
  muted: "#94a3b8", border: "#d1dce8",
  text: "#1a2744", textLight: "#4a5a7a",
  red: "#c0392b", amber: "#d97706",
};

const BLOCK_KEYS = ["strategy","principles","customers","processes","people","technology","portfolio"];
const ACCENTS = {
  strategy:"#0d1b3e", principles:"#12285a", customers:"#2d6e4e",
  processes:"#1a3570", people:"#3a8f66", technology:"#12285a", portfolio:"#0d1b3e",
};
const ICONS = { strategy:"◎", principles:"◈", customers:"◉", processes:"◧", people:"◑", technology:"◫", portfolio:"◪" };

const BLK = {
  strategy:   { title:"Strategy",                 sub:"Mission · Vision · Themes · KPIs" },
  principles: { title:"Guiding Principles",       sub:"Design rules for all pillars" },
  customers:  { title:"Customers & Services",     sub:"Groups · Journeys · Channels · Products" },
  processes:  { title:"Processes & Organisation", sub:"Process model · Org design · Governance" },
  people:     { title:"People & Competencies",    sub:"Leadership · Skills · Culture" },
  technology: { title:"Information & Technology", sub:"Data · Applications · Platforms" },
  portfolio:  { title:"Change Portfolio",         sub:"Initiatives · Value · Complexity · Owner" },
};

const EXAMPLE = {
  scope: "International Financial Services Provider — Transformation Plan",

  strategy: [
    "Vision: Top-tier international provider known for service quality and reliability",
    "Shift: from legacy portfolio management to growth and innovation",
    "Driver A: Customer & partner centricity — seamless omnichannel interaction",
    "Driver B: Product differentiation — new propositions within 6–9 months",
    "Driver C: Operational performance — structural cost and efficiency improvement",
    "Goal: Significant increase in value creation within 5 years"
  ],

  principles: [
    "Customer focus: differentiated service based on customer lifetime value",
    "Personalisation: single customer view across all channels and touchpoints",
    "Modularisation: reusable product components to enable faster launches",
    "Distribution: clear segmentation of partners with aligned incentives",
    "Consistency: same request leads to same outcome across channels",
    "Competitive positioning: top-tier price/quality ratio in core segments"
  ],

  customers: [
    "Segment 1: affluent customers with standardised product needs",
    "Segment 2: high-value customers requiring tailored advisory",
    "Segment 3: very high-value customers focused on long-term structuring",
    "Channel: intermediaries and advisory partners (primary)",
    "Channel: direct and digital channels (increasing importance)",
    "Geography: presence across multiple international financial hubs"
  ],

  processes: [
    "Standardisation and automation using AI and workflow tooling",
    "Clear separation between front-office (experience) and back-office (efficiency)",
    "Agile delivery model with multidisciplinary teams and fixed cycles",
    "Selective insourcing of critical capabilities (data, tech, operations)",
    "Transformation governed via enterprise architecture and portfolio steering"
  ],

  people: [
    "Performance culture with clear targets and accountability",
    "Structured talent management and succession planning",
    "Leadership development focused on collaboration and change",
    "Upskilling in data, digital and AI capabilities",
    "Employee engagement through continuous feedback mechanisms"
  ],

  technology: [
    "Modular, API-based architecture with minimal redundancy",
    "Cloud-native platform with strong security and scalability",
    "Data as core asset across distribution, underwriting and servicing",
    "Formal data governance with ownership, quality and lifecycle controls",
    "Integrated customer and partner platforms enabling 360° view"
  ],

  portfolio: [
    "Foundation: core system improvements and data platform",
    "Foundation: management dashboard and performance insights",
    "Growth: new product propositions and faster launch capability",
    "Growth: partner portal and customer journey improvements",
    "Expansion: new market and partner propositions",
    "Optimisation: portfolio rationalisation and legacy clean-up"
  ]
};

// ── Local analysis engine ─────────────────────────────────────────────────────
// Scores a block based on: number of items, specificity, and keyword quality
function scoreBlock(items) {
  const filled = items.filter(i => i.trim().length > 3);
  if (filled.length === 0) return 0;

  let score = 30; // base for having anything
  score += Math.min(filled.length * 8, 40); // up to 40 for quantity (max 5 items)

  // Specificity bonus: items with numbers, names, percentages
  const specific = filled.filter(i => /\d|%|KPI|goal|target|owner|budget|Q[1-4]|\$|€/i.test(i));
  score += Math.min(specific.length * 5, 20);

  // Vagueness penalty: very short items
  const vague = filled.filter(i => i.trim().length < 15);
  score -= vague.length * 5;

  return Math.max(10, Math.min(100, score));
}

function generateVerdict(key, score, items) {
  const filled = items.filter(i => i.trim());
  if (filled.length === 0) return "Block is empty — no content to assess.";

  const verdicts = {
    strategy: {
      high: "Clear strategic direction with measurable goals and explicit choices.",
      mid: "Strategy is present but some themes lack clear KPIs or priorities.",
      low: "Strategy is vague — missing measurable goals or explicit focus choices.",
    },
    principles: {
      high: "Guiding principles are concrete and translate into design rules.",
      mid: "Principles defined but some lack testable or enforceable consequences.",
      low: "Principles read as slogans — need measurable consequences to be effective.",
    },
    customers: {
      high: "Customer segmentation is well-defined with clear channel and journey logic.",
      mid: "Customer groups identified but channel strategy or journey design needs sharpening.",
      low: "Customer definition is broad — segmentation and channel logic missing.",
    },
    processes: {
      high: "Process and organisation model is concrete with clear governance.",
      mid: "Process direction is set but org design or governance roles need elaboration.",
      low: "Process block is thin — missing operating model or governance structure.",
    },
    people: {
      high: "People agenda is comprehensive with talent, leadership and culture addressed.",
      mid: "People themes covered but capability gaps or hiring plans need quantification.",
      low: "People block is underdeveloped — leadership and capability agenda missing.",
    },
    technology: {
      high: "Technology principles are solid with clear data and architecture direction.",
      mid: "Tech direction present but application choices or data governance need detail.",
      low: "Technology block is vague — missing architecture principles or data strategy.",
    },
    portfolio: {
      high: "Change portfolio is comprehensive with clear owners, value and complexity.",
      mid: "Portfolio initiatives listed but prioritisation logic or owners are not explicit.",
      low: "Portfolio is thin — missing initiative clustering, owners or roadmap logic.",
    },
  };

  const level = score >= 70 ? "high" : score >= 45 ? "mid" : "low";
  return verdicts[key]?.[level] || "Assessment unavailable.";
}

function detectInconsistencies(blocks) {
  const issues = [];
  const filled = k => blocks[k].filter(i => i.trim()).length;

  // Strategy vs Portfolio alignment
  if (filled("strategy") >= 3 && filled("portfolio") < 2) {
    issues.push({ blocks:["strategy","portfolio"], issue:"Strategy has multiple themes but change portfolio is underdeveloped — the execution path for strategic ambitions is unclear.", severity:"high" });
  }

  // Principles vs Processes conflict check
  const procItems = blocks.processes.join(" ").toLowerCase();
  const princItems = blocks.principles.join(" ").toLowerCase();
  if (princItems.includes("standard") && procItems.includes("custom")) {
    issues.push({ blocks:["principles","processes"], issue:"Standardisation principle conflicts with custom solutions mentioned in processes — explicit exceptions need to be defined.", severity:"high" });
  }

  // People vs Technology gap
  if (filled("technology") >= 4 && filled("people") < 3) {
    issues.push({ blocks:["people","technology"], issue:"Strong technology agenda but thin people block — digital transformation without capability building is high-risk.", severity:"medium" });
  }

  // Customers vs Portfolio
  if (filled("customers") >= 4 && filled("portfolio") < 3) {
    issues.push({ blocks:["customers","portfolio"], issue:"Ambitious customer strategy not matched by sufficient change initiatives in the portfolio.", severity:"medium" });
  }

  // Generic if none found
  if (issues.length === 0) {
    issues.push({ blocks:["strategy","principles"], issue:"Horizontal alignment between strategy and guiding principles could be made more explicit — check that each principle directly enforces a strategic choice.", severity:"low" });
  }

  return issues.slice(0, 3);
}

function detectGaps(blocks) {
  const gaps = [];
  const filled = k => blocks[k].filter(i => i.trim()).length;

  if (filled("portfolio") < 2) gaps.push({ block:"portfolio", missing:"Change initiative owners and budget allocation", impact:"Without clear ownership and budget, portfolio remains directional rather than executable." });
  if (filled("people") < 2) gaps.push({ block:"people", missing:"Capability gap analysis and hiring plan", impact:"Transformation without explicit capability building creates execution risk." });
  if (filled("principles") < 2) gaps.push({ block:"principles", missing:"Enforceable design rules per pillar", impact:"Without testable principles, design decisions lack a consistent framework to evaluate against." });

  const techText = blocks.technology.join(" ").toLowerCase();
  if (!techText.includes("data") && !techText.includes("analytics")) {
    gaps.push({ block:"technology", missing:"Data and analytics strategy", impact:"Digital transformation requires an explicit data foundation — currently not addressed." });
  }

  if (gaps.length === 0) {
    gaps.push({ block:"strategy", missing:"Explicit 'not-do' choices and focus boundaries", impact:"Without clear exclusions, the strategy risks spreading resources too thin across competing priorities." });
  }

  return gaps.slice(0, 3);
}

function generateRecommendations(blocks, scores) {
  const recs = [];
  const filled = k => blocks[k].filter(i => i.trim()).length;

  // Lowest scoring block gets first rec
  const sorted = BLOCK_KEYS.map(k => ({ k, s: scores[k] })).sort((a,b) => a.s - b.s);
  const weakest = sorted[0].k;

  const recMap = {
    strategy: { title:"Sharpen strategic focus with explicit choices", why:"The strategy needs clearer 'not-do' decisions and measurable KPIs per theme to drive prioritisation.", first_steps:["List the 3 strategic themes and assign a KPI to each","Document 2-3 explicit choices about what TLB will NOT pursue"] },
    principles: { title:"Make guiding principles enforceable", why:"Principles without testable consequences are just slogans — each principle needs an architectural or process implication.", first_steps:["Rewrite each principle as: 'We always X — we never Y'","Review each pillar against the principles and flag contradictions"] },
    customers: { title:"Define customer journeys per segment", why:"Segmentation is defined but the experience and journey design per segment is missing.", first_steps:["Map the pre-sales to service journey for the top 2 segments","Identify the 3 biggest friction points per journey"] },
    processes: { title:"Design the target operating model explicitly", why:"Process direction needs to be translated into a clear one-pager TOM with roles and governance.", first_steps:["Sketch the front/back office split on one page","Assign C-suite owners to each process domain"] },
    people: { title:"Quantify capability gaps and build hiring plan", why:"The people agenda needs to move from intent to action with specific gap analysis and resourcing.", first_steps:["Identify top 5 critical roles needed for transformation","Score current capability against future need per function"] },
    technology: { title:"Define the data and application architecture", why:"Technology strategy needs an explicit architecture vision and data governance framework.", first_steps:["Produce a one-page application landscape (current vs target)","Define data ownership and governance per data domain"] },
    portfolio: { title:"Add owners, budget and sequencing to portfolio", why:"The portfolio needs to move from a list to a programme — with owners, investment buckets and a roadmap.", first_steps:["Assign a business owner to each initiative bucket","Classify initiatives: hygiene / growth / innovation and sequence"] },
  };

  if (recMap[weakest]) recs.push(recMap[weakest]);

  // Portfolio always gets a rec if underdeveloped
  if (weakest !== "portfolio" && filled("portfolio") < 3) {
    recs.push(recMap.portfolio);
  }

  // Add a generic integration rec
  recs.push({
    title: "Run a horizontal alignment check across all 7 blocks",
    why: "The BTC's power comes from coherence — a decision in one block should automatically constrain or enable choices in others.",
    first_steps: ["Workshop: for each guiding principle, trace its impact on all 4 pillars","Check: does every portfolio initiative link to at least one strategy theme?"],
  });

  return recs.slice(0, 3);
}

function generateSummary(scores, scope) {
  const overall = scores.overall;
  const weakBlocks = BLOCK_KEYS.filter(k => scores[k] < 50).map(k => BLK[k].title);
  const strongBlocks = BLOCK_KEYS.filter(k => scores[k] >= 70).map(k => BLK[k].title);

  let summary = `The Business Transformation Canvas for ${scope || "this organisation"} scores ${overall}/100 overall, `;
  if (overall >= 70) summary += "indicating a well-developed transformation plan with good cross-pillar coherence. ";
  else if (overall >= 50) summary += "showing a solid foundation with several areas requiring further development. ";
  else summary += "revealing a canvas that is still in early stages and needs significant elaboration before it can drive execution. ";

  if (strongBlocks.length > 0) summary += `Strongest blocks are ${strongBlocks.join(" and ")}. `;
  if (weakBlocks.length > 0) summary += `Priority attention is needed on ${weakBlocks.join(", ")} to make the transformation plan executable.`;

  return summary;
}

function runAnalysis(blocks, scope) {
  const blockScores = {};
  BLOCK_KEYS.forEach(k => { blockScores[k] = scoreBlock(blocks[k]); });

  const avg = Math.round(BLOCK_KEYS.reduce((s,k) => s + blockScores[k], 0) / BLOCK_KEYS.length);
  const filled = k => blocks[k].filter(i => i.trim()).length;
  const totalFilled = BLOCK_KEYS.reduce((s,k) => s + filled(k), 0);

  const coverage = Math.min(100, Math.round((totalFilled / (BLOCK_KEYS.length * 4)) * 100));
  const consistency = Math.max(20, avg - (detectInconsistencies(blocks).filter(i => i.severity==="high").length * 10));
  const focus = Math.min(100, BLOCK_KEYS.filter(k => filled(k) >= 2 && filled(k) <= 7).length * 14);
  const feasibility = Math.round((blockScores.people + blockScores.technology + blockScores.portfolio) / 3);
  const overall = Math.round((avg + coverage + consistency + focus + feasibility) / 5);

  const scorecard = {};
  BLOCK_KEYS.forEach(k => {
    scorecard[k] = { score: blockScores[k], verdict: generateVerdict(k, blockScores[k], blocks[k]) };
  });

  const strengths = [];
  const topBlocks = BLOCK_KEYS.filter(k => blockScores[k] >= 60).slice(0, 3);
  if (topBlocks.length > 0) strengths.push(`Well-developed ${topBlocks.map(k => BLK[k].title).join(", ")} block${topBlocks.length > 1 ? "s" : ""}`);
  if (totalFilled >= 20) strengths.push("Comprehensive canvas coverage across all seven building blocks");
  if (filled("portfolio") >= 3) strengths.push("Change portfolio has sufficient initiatives to drive execution");
  if (filled("principles") >= 4) strengths.push("Strong guiding principles provide a clear decision framework");
  if (strengths.length < 2) strengths.push("Canvas provides a useful starting point for transformation dialogue");

  const recommendations = generateRecommendations(blocks, blockScores);

  return {
    scores: { consistency, coverage, focus, feasibility, overall },
    scorecard,
    strengths: strengths.slice(0, 3),
    inconsistencies: detectInconsistencies(blocks),
    gaps: detectGaps(blocks),
    recommendations,
    executive_summary: generateSummary({ ...blockScores, overall }, scope),
  };
}

// ── UI Components ─────────────────────────────────────────────────────────────

function scoreColor(v) {
  const n = Number(v)||0;
  return n >= 70 ? KF.green : n >= 45 ? KF.amber : KF.red;
}

function ScoreBar({ label, value }) {
  const v = Number(value)||0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:KF.textLight }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color:scoreColor(v) }}>{v}/100</span>
      </div>
      <div style={{ height:5, background:KF.border, borderRadius:3 }}>
        <div style={{ height:"100%", width:`${v}%`, background:scoreColor(v), borderRadius:3, transition:"width 1s ease" }} />
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background:KF.white, border:`1px solid ${KF.border}`, borderRadius:8, padding:20, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:KF.muted, marginBottom:14, fontWeight:700 }}>{title}</div>
      {children}
    </div>
  );
}

function BlockCard({ bkey, items, onUpdate, onAdd, onRemove, onFileUpload, uploadingKey, wide }) {
  const block = BLK[bkey];
  const accent = ACCENTS[bkey];
  const isUploading = uploadingKey === bkey;
  const fileRef = useRef();

  return (
    <div style={{ background:KF.white, border:`1px solid ${KF.border}`, borderTop:`4px solid ${accent}`, borderRadius:8, padding:"14px 14px 10px", gridColumn:wide?"1 / -1":undefined, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:16, color:accent }}>{ICONS[bkey]}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:KF.text }}>{block.title}</div>
          <div style={{ fontSize:10, color:KF.muted, marginTop:1 }}>{block.sub}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:KF.border }}>{items.length}/7</span>
          <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display:"none" }}
            onChange={e => e.target.files[0] && onFileUpload(bkey, e.target.files[0])} />
          <button onClick={() => fileRef.current.click()} disabled={isUploading}
            title="Upload .txt file to paste content"
            style={{ background:isUploading?KF.amber+"22":KF.offWhite, border:`1px solid ${KF.border}`, borderRadius:4, padding:"2px 8px", cursor:isUploading?"not-allowed":"pointer", fontSize:10, color:isUploading?KF.amber:KF.muted, fontFamily:"inherit" }}>
            {isUploading ? "⏳" : "⬆ txt"}
          </button>
        </div>
      </div>
      <div style={wide ? { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 } : {}}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display:"flex", gap:5, marginBottom:wide?0:5, alignItems:"center" }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:accent, flexShrink:0 }} />
            <input value={item} onChange={e => onUpdate(idx, e.target.value)} placeholder="Enter item…"
              style={{ flex:1, border:`1px solid ${KF.border}`, background:KF.offWhite, color:KF.text, padding:"5px 8px", borderRadius:5, fontSize:11, fontFamily:"inherit", outline:"none" }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = KF.border} />
            {items.length > 1 && (
              <button onClick={() => onRemove(idx)} style={{ background:"none", border:"none", color:KF.muted, cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}>×</button>
            )}
          </div>
        ))}
      </div>
      {items.length < 7 && (
        <button onClick={onAdd} style={{ marginTop:6, width:"100%", background:"none", border:`1px dashed ${accent}55`, color:accent, padding:"4px 0", borderRadius:5, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>
          + Add item
        </button>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function BTCTool() {
  const emptyBlocks = () => BLOCK_KEYS.reduce((a,k) => ({...a,[k]:[""]}), {});
  const [blocks, setBlocks] = useState(emptyBlocks());
  const [scope, setScope] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [tab, setTab] = useState("canvas");
  const [uploadingKey, setUploadingKey] = useState(null);

  const loadExample = () => {
    setBlocks(BLOCK_KEYS.reduce((a,k) => ({...a,[k]:[...EXAMPLE[k]]}), {}));
    setScope(EXAMPLE.scope); setAnalysis(null);
  };
  const reset = () => { setBlocks(emptyBlocks()); setScope(""); setAnalysis(null); setTab("canvas"); };
  const updateItem = (k,i,v) => setBlocks(p => { const a=[...p[k]]; a[i]=v; return {...p,[k]:a}; });
  const addItem = (k) => setBlocks(p => p[k].length<7 ? {...p,[k]:[...p[k],""]} : p);
  const removeItem = (k,i) => setBlocks(p => { const a=p[k].filter((_,j)=>j!==i); return {...p,[k]:a.length?a:[""]}; });

  const handleFileUpload = async (blockKey, file) => {
    setUploadingKey(blockKey);
    try {
      const text = await file.text();
      // Split on newlines and take meaningful lines
      const lines = text.split(/\n/).map(l => l.replace(/^[-•*]\s*/,"").trim()).filter(l => l.length > 10).slice(0,7);
      if (lines.length > 0) setBlocks(p => ({...p, [blockKey]: lines}));
    } catch {}
    setUploadingKey(null);
  };

  const analyse = () => {
    const hasContent = BLOCK_KEYS.some(k => blocks[k].some(i => i.trim()));
    if (!hasContent) return;
    const result = runAnalysis(blocks, scope);
    setAnalysis(result);
    setTab("scorecard");
  };

  const sevColor = s => s==="high"?KF.red:s==="medium"?KF.amber:KF.muted;

  return (
    <div style={{ minHeight:"100vh", background:KF.offWhite, fontFamily:"Trebuchet MS, Calibri, sans-serif", color:KF.text, fontSize:13 }}>

      {/* Header */}
      <div style={{ background:KF.navyDark, borderBottom:`4px solid ${KF.green}`, padding:"0 24px", display:"flex", alignItems:"stretch" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", marginRight:24 }}>
          <div style={{ width:36, height:36, borderRadius:7, background:`linear-gradient(135deg,${KF.green},${KF.greenLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:KF.white }}>K</div>
          <div>
            <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:KF.greenLight, marginBottom:1 }}>Kingfisher & Partners</div>
            <div style={{ fontSize:14, fontWeight:700, color:KF.white }}>Business Transformation Canvas</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:2, flex:1 }}>
          {[["canvas","Canvas"],["scorecard","Scorecard"],["report","Report"]].map(([id,lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background:tab===id?KF.offWhite:"transparent", color:tab===id?KF.navyDark:"#8ab0cc", border:"none", borderRadius:"6px 6px 0 0", padding:"8px 16px", cursor:"pointer", fontSize:12, fontWeight:tab===id?700:400, fontFamily:"inherit", marginBottom:-1 }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"12px 0" }}>
          <button onClick={loadExample} style={{ background:"#1a3570", border:"none", color:"#e2e8f0", padding:"6px 12px", borderRadius:5, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Load Example</button>
          <button onClick={reset} style={{ background:"none", border:"1px solid #8ab0cc55", color:"#8ab0cc", padding:"5px 10px", borderRadius:5, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>Reset</button>
          <button onClick={analyse} style={{ background:KF.green, color:KF.white, border:"none", padding:"7px 18px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
            Analyse Canvas
          </button>
        </div>
      </div>

      {/* Scope */}
      <div style={{ background:KF.white, borderBottom:`1px solid ${KF.border}`, padding:"8px 24px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:11, color:KF.muted, whiteSpace:"nowrap" }}>Scope:</span>
        <input value={scope} onChange={e=>setScope(e.target.value)} placeholder="Organisation / project name…"
          style={{ flex:1, border:"none", background:"transparent", color:KF.text, fontSize:12, fontFamily:"inherit", outline:"none" }} />
      </div>

      {/* Canvas Tab */}
      {tab === "canvas" && (
        <div style={{ padding:"16px 24px 40px" }}>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"8px 14px", marginBottom:12, fontSize:11, color:"#1e40af" }}>
            💡 Fill in each block manually, or use ⬆ txt to paste content from a text file. Click <strong>Analyse Canvas</strong> to get instant scores and recommendations — no internet required.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {["strategy","principles"].map(k => (
              <BlockCard key={k} bkey={k} items={blocks[k]}
                onUpdate={(i,v)=>updateItem(k,i,v)} onAdd={()=>addItem(k)} onRemove={i=>removeItem(k,i)}
                onFileUpload={handleFileUpload} uploadingKey={uploadingKey} />
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:10 }}>
            {["customers","processes","people","technology"].map(k => (
              <BlockCard key={k} bkey={k} items={blocks[k]}
                onUpdate={(i,v)=>updateItem(k,i,v)} onAdd={()=>addItem(k)} onRemove={i=>removeItem(k,i)}
                onFileUpload={handleFileUpload} uploadingKey={uploadingKey} />
            ))}
          </div>
          <BlockCard bkey="portfolio" items={blocks.portfolio} wide
            onUpdate={(i,v)=>updateItem("portfolio",i,v)} onAdd={()=>addItem("portfolio")} onRemove={i=>removeItem("portfolio",i)}
            onFileUpload={handleFileUpload} uploadingKey={uploadingKey} />
          <div style={{ textAlign:"center", marginTop:14, color:KF.muted, fontSize:10, letterSpacing:"1px", textTransform:"uppercase" }}>
            From strategy to execution · Kingfisher & Partners
          </div>
        </div>
      )}

      {/* Scorecard Tab */}
      {tab === "scorecard" && (
        <div style={{ padding:"20px 24px" }}>
          {!analysis ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, color:KF.border, marginBottom:12 }}>◎</div>
              <p style={{ color:KF.muted, fontSize:13, marginBottom:20 }}>Fill in the canvas and click Analyse Canvas</p>
              <button onClick={analyse} style={{ background:KF.green, color:KF.white, border:"none", padding:"9px 24px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>Analyse Canvas</button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Card title="Overall Score">
                <div style={{ fontSize:48, fontWeight:800, color:scoreColor(analysis.scores.overall), lineHeight:1, marginBottom:16 }}>
                  {analysis.scores.overall}<span style={{ fontSize:18, color:KF.muted }}>/100</span>
                </div>
                <ScoreBar label="Consistency" value={analysis.scores.consistency} />
                <ScoreBar label="Coverage" value={analysis.scores.coverage} />
                <ScoreBar label="Focus" value={analysis.scores.focus} />
                <ScoreBar label="Feasibility" value={analysis.scores.feasibility} />
              </Card>
              <Card title="Per Block">
                {BLOCK_KEYS.map(k => {
                  const s = analysis.scorecard[k];
                  return (
                    <div key={k} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                        <span style={{ fontSize:11, color:KF.text }}>{BLK[k].title}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:scoreColor(s.score) }}>{s.score}</span>
                      </div>
                      <div style={{ fontSize:10, color:KF.muted, marginBottom:3, lineHeight:1.4 }}>{s.verdict}</div>
                      <div style={{ height:3, background:KF.border, borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${s.score}%`, background:scoreColor(s.score), borderRadius:2 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
              <Card title="Strengths">
                {analysis.strengths.map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                    <span style={{ color:KF.green, fontWeight:700, flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:12, color:KF.text, lineHeight:1.5 }}>{s}</span>
                  </div>
                ))}
              </Card>
              <Card title="Inconsistencies & Gaps">
                {analysis.inconsistencies.map((inc,i) => (
                  <div key={i} style={{ marginBottom:10, paddingLeft:10, borderLeft:`3px solid ${sevColor(inc.severity)}` }}>
                    <div style={{ fontSize:9, color:sevColor(inc.severity), textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>
                      {inc.severity} · {inc.blocks.join(" ↔ ")}
                    </div>
                    <div style={{ fontSize:11, color:KF.textLight, lineHeight:1.5 }}>{inc.issue}</div>
                  </div>
                ))}
                {analysis.gaps.map((g,i) => (
                  <div key={i} style={{ marginBottom:10, paddingLeft:10, borderLeft:`3px solid ${KF.border}` }}>
                    <div style={{ fontSize:9, color:KF.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>gap · {g.block}</div>
                    <div style={{ fontSize:11, color:KF.textLight, lineHeight:1.5 }}>{g.missing}</div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Report Tab */}
      {tab === "report" && (
        <div style={{ padding:"20px 24px" }}>
          {!analysis ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, color:KF.border, marginBottom:12 }}>◎</div>
              <p style={{ color:KF.muted, fontSize:13, marginBottom:20 }}>Run the analysis first</p>
              <button onClick={analyse} style={{ background:KF.green, color:KF.white, border:"none", padding:"9px 24px", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>Analyse Canvas</button>
            </div>
          ) : (
            <div style={{ maxWidth:720 }}>
              <div style={{ background:KF.navyDark, borderRadius:10, padding:24, marginBottom:20 }}>
                <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:KF.greenLight, marginBottom:10, fontWeight:700 }}>Executive Summary</div>
                <p style={{ fontSize:14, lineHeight:1.75, color:"#e2e8f0", margin:0 }}>{analysis.executive_summary}</p>
              </div>
              <div style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:KF.muted, marginBottom:14, fontWeight:700 }}>Recommendations</div>
              {analysis.recommendations.map((r,i) => (
                <div key={i} style={{ background:KF.white, border:`1px solid ${KF.border}`, borderLeft:`4px solid ${KF.green}`, borderRadius:8, padding:18, marginBottom:10 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:KF.green, color:KF.white, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:KF.text, marginBottom:5 }}>{r.title}</div>
                      <div style={{ fontSize:12, color:KF.textLight, lineHeight:1.6, marginBottom:10 }}>{r.why}</div>
                      <div style={{ fontSize:9, letterSpacing:"1px", textTransform:"uppercase", color:KF.muted, marginBottom:6 }}>First steps</div>
                      {r.first_steps.map((s,j) => (
                        <div key={j} style={{ display:"flex", gap:6, marginBottom:4 }}>
                          <span style={{ color:KF.green, fontWeight:700, flexShrink:0 }}>→</span>
                          <span style={{ fontSize:11, color:KF.textLight }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:28, paddingTop:14, borderTop:`1px solid ${KF.border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, color:KF.muted }}>Kingfisher & Partners · From strategy to execution</span>
                <span style={{ fontSize:10, color:KF.muted }}>{scope}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
