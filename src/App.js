import { useState, useRef } from "react";
import { BLOCK_PROMPTS } from "./prompts/btcPrompts";

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

const ICONS = {
  strategy:"◎", principles:"◈", customers:"◉",
  processes:"◧", people:"◑", technology:"◫", portfolio:"◪"
};

const BLOCK_LABELS = {
  strategy:   { title:"Strategy",                 sub:"Mission · Vision · Themes · KPIs" },
  principles: { title:"Guiding Principles",       sub:"Design rules for all pillars" },
  customers:  { title:"Customers & Services",     sub:"Groups · Journeys · Channels · Products" },
  processes:  { title:"Processes & Organisation", sub:"Process model · Org design · Governance" },
  people:     { title:"People & Competencies",    sub:"Leadership · Skills · Culture" },
  technology: { title:"Information & Technology", sub:"Data · Applications · Platforms" },
  portfolio:  { title:"Change Portfolio",         sub:"Initiatives · Value · Complexity · Owner" },
};

const EXAMPLE = {
  scope: "Transamerica Life Bermuda — BTP 2024",
  strategy: ["Vision: Best HNW Global insurer, excelling in customer service","Pivot: from Maintain & Sell to Invest & Grow","Driver A: Customer & partner centricity — omnichannel excellence","Driver B: Product differentiation — new propositions in 6 months","Driver C: Operational performance — 20% efficiency gain","Goal: Double value creation by 2028"],
  principles: ["Customer focus: treat HNWI by CLV — no one-size-fits-all","Personalization: 360 degree customer view across all channels","Product modularisation: reusable components, white-label ready","Distribution: segmented broker service levels, clear incentives","Convenience: omnichannel consistency — same request, same outcome","Top 3 price/quality ratio in all target markets"],
  customers: ["Segment Affluent+/HNW: 750K-1M wealth, 85% of policies","Segment HNW+: 3M-10M wealth, 20% of total sum assured","Segment UHNW: >100M — legacy planning and asset structuring","Channel: International brokers (primary, fed by private banks)","Channel: Regional/local brokers and FAs — growing","Geography: HK, Singapore, Bermuda + DIFC hub (Scenario II)"],
  processes: ["Standardise and automate: AI, OCR, chatbots where value-adding","Decouple front (CX) from back (admin and efficiency)","Agile way of working: multidisciplinary teams, fixed-budget sprints","Sourcing: top talent ops/data/tech; key roles in-house","BTP as enterprise architecture and transformation management tool"],
  people: ["Performance: clear goals, accountable, recognized","Talent management: succession planning, career conversations","Leadership: soft skills training + Rising Star Programme","Digital savviness: AI/data literacy across all staff","Engagement: pulse surveys, inclusion and diversity programme"],
  technology: ["Flexibility: modular, API-based, no redundant IT solutions","Cloud-native platform: cyber-secure, scalable, as-a-service","Data as asset: analytics across distribution, UW, claims, servicing","Data governance: quality, lifecycle, privacy, auditable access","Case management and 360 customer/broker view (Scenario II)"],
  portfolio: ["Hygiene: Brand and presence, pricing benchmark, LifePro upgrade","Hygiene: Data foundation, management dashboard","Scenario I: WOL launch HK/Bermuda, broker portal uplift","Scenario I: Global sales build-out, customer journey redesign","Scenario II: DIFC hub, FA proposition Singapore, CRM platform","Scenario III: UL remediation, PPLI/VUL assessment"],
};

// ── AI extraction via Anthropic API ──────────────────────────────────────────
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

// ── Local scoring engine (fallback + supplement) ──────────────────────────────
function scoreBlock(items) {
  const filled = items.filter(i => i.trim().length > 3);
  if (filled.length === 0) return 0;
  let score = 30;
  score += Math.min(filled.length * 8, 40);
  const specific = filled.filter(i => /\d|%|KPI|goal|target|owner|budget|Q[1-4]|\$|€/i.test(i));
  score += Math.min(specific.length * 5, 20);
  const vague = filled.filter(i => i.trim().length < 15);
  score -= vague.length * 5;
  return Math.max(10, Math.min(100, score));
}

function generateVerdict(key, score) {
  const verdicts = {
    strategy:   { high:"Clear strategic direction with measurable goals.", mid:"Strategy present but some themes lack KPIs.", low:"Strategy is vague — missing measurable goals." },
    principles: { high:"Principles are concrete and enforceable.", mid:"Principles defined but lack testable consequences.", low:"Principles read as slogans — need consequences." },
    customers:  { high:"Customer segmentation well-defined with clear channel logic.", mid:"Segments identified but channel strategy needs sharpening.", low:"Customer definition is too broad." },
    processes:  { high:"Process and organisation model is concrete.", mid:"Process direction set but governance needs elaboration.", low:"Missing operating model or governance structure." },
    people:     { high:"Comprehensive people agenda with talent and culture.", mid:"People themes covered but gaps not quantified.", low:"People block underdeveloped." },
    technology: { high:"Solid technology principles with clear architecture direction.", mid:"Tech direction present but governance needs detail.", low:"Technology block is vague." },
    portfolio:  { high:"Comprehensive portfolio with clear owners and sequencing.", mid:"Initiatives listed but prioritisation not explicit.", low:"Portfolio is thin — missing owners or roadmap logic." },
  };
  const level = score >= 70 ? "high" : score >= 45 ? "mid" : "low";
  return verdicts[key]?.[level] || "Assessment unavailable.";
}

function runLocalAnalysis(blocks, scope) {
  const blockScores = {};
  BLOCK_KEYS.forEach(k => { blockScores[k] = scoreBlock(blocks[k]); });
  const avg = Math.round(BLOCK_KEYS.reduce((s, k) => s + blockScores[k], 0) / BLOCK_KEYS.length);
  const filled = k => blocks[k].filter(i => i.trim()).length;
  const totalFilled = BLOCK_KEYS.reduce((s, k) => s + filled(k), 0);
  const coverage = Math.min(100, Math.round((totalFilled / (BLOCK_KEYS.length * 4)) * 100));
  const consistency = Math.max(20, avg - 5);
  const focus = Math.min(100, BLOCK_KEYS.filter(k => filled(k) >= 2 && filled(k) <= 7).length * 14);
  const feasibility = Math.round((blockScores.people + blockScores.technology + blockScores.portfolio) / 3);
  const overall = Math.round((avg + coverage + consistency + focus + feasibility) / 5);
  const scorecard = {};
  BLOCK_KEYS.forEach(k => {
    scorecard[k] = { score: blockScores[k], verdict: generateVerdict(k, blockScores[k]) };
  });
  const strengths = [];
  const topBlocks = BLOCK_KEYS.filter(k => blockScores[k] >= 60).slice(0, 3);
  if (topBlocks.length > 0) strengths.push(`Well-developed ${topBlocks.map(k => BLOCK_LABELS[k].title).join(", ")} block${topBlocks.length > 1 ? "s" : ""}`);
  if (totalFilled >= 20) strengths.push("Comprehensive canvas coverage across all seven building blocks");
  if (filled("portfolio") >= 3) strengths.push("Change portfolio has sufficient initiatives to drive execution");
  if (strengths.length < 2) strengths.push("Canvas provides a useful starting point for transformation dialogue");
  return {
    scores: { consistency, coverage, focus, feasibility, overall },
    scorecard,
    strengths: strengths.slice(0, 3),
    inconsistencies: [
      filled("strategy") >= 3 && filled("portfolio") < 2
        ? { blocks:["strategy","portfolio"], issue:"Strategy has multiple themes but change portfolio is underdeveloped.", severity:"high" }
        : { blocks:["strategy","principles"], issue:"Check that each guiding principle directly enforces a strategic choice.", severity:"low" }
    ],
    gaps: [
      filled("portfolio") < 2 ? { block:"portfolio", missing:"Change initiative owners and budget allocation", impact:"Without ownership, portfolio remains directional rather than executable." } : null,
      filled("people") < 2 ? { block:"people", missing:"Capability gap analysis and hiring plan", impact:"Transformation without explicit capability building creates execution risk." } : null,
    ].filter(Boolean),
    recommendations: [
      { title:"Run a horizontal alignment check across all 7 blocks", why:"The BTC's power comes from coherence — a decision in one block should constrain or enable choices in others.", first_steps:["For each guiding principle, trace its impact on all 4 pillars","Check: does every portfolio initiative link to at least one strategy theme?"] },
      { title:"Quantify capability gaps and build hiring plan", why:"The people agenda needs to move from intent to action with specific gap analysis.", first_steps:["Identify top 5 critical roles needed for transformation","Score current capability against future need per function"] },
    ],
    executive_summary: `The Business Transformation Canvas for ${scope || "this organisation"} scores ${overall}/100 overall. ${overall >= 70 ? "The canvas shows a well-developed transformation plan with good cross-pillar coherence." : overall >= 50 ? "A solid foundation exists with several areas requiring further development." : "The canvas is still in early stages and needs significant elaboration before it can drive execution."} Priority attention is needed on ${BLOCK_KEYS.filter(k => blockScores[k] < 50).map(k => BLOCK_LABELS[k].title).join(", ") || "further detailing all blocks"}.`,
  };
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function scoreColor(v) {
  const n = Number(v) || 0;
  return n >= 70 ? KF.green : n >= 45 ? KF.amber : KF.red;
}

function ScoreBar({ label, value }) {
  const v = Number(value) || 0;
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

// ── Block Card with upload ────────────────────────────────────────────────────
function BlockCard({ bkey, items, onUpdate, onAdd, onRemove, onUpload, uploadingKey, wide }) {
  const block = BLOCK_LABELS[bkey];
  const accent = ACCENTS[bkey];
  const isUploading = uploadingKey === bkey;
  const fileRef = useRef();

  return (
    <div style={{
      background:KF.white, border:`1px solid ${KF.border}`,
      borderTop:`4px solid ${accent}`, borderRadius:8,
      padding:"14px 14px 10px",
      gridColumn:wide ? "1 / -1" : undefined,
      boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:16, color:accent }}>{ICONS[bkey]}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:KF.text }}>{block.title}</div>
          <div style={{ fontSize:10, color:KF.muted, marginTop:1 }}>{block.sub}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:KF.border }}>{items.length}/7</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.pptx,.docx,.csv"
            style={{ display:"none" }}
            onChange={e => e.target.files[0] && onUpload(bkey, e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current.click()}
            disabled={isUploading}
            title="Upload document — AI extracts relevant content for this block"
            style={{
              background: isUploading ? KF.amber+"22" : KF.green+"11",
              border:`1px solid ${isUploading ? KF.amber : KF.green}`,
              borderRadius:5, padding:"3px 10px",
              cursor: isUploading ? "not-allowed" : "pointer",
              fontSize:11, color: isUploading ? KF.amber : KF.green,
              fontFamily:"inherit", fontWeight:600,
            }}
          >
            {isUploading ? "⏳ extracting…" : "⬆ upload"}
          </button>
        </div>
      </div>

      <div style={wide ? { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 } : {}}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display:"flex", gap:5, marginBottom:wide?0:5, alignItems:"center" }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:accent, flexShrink:0 }} />
            <input
              value={item}
              onChange={e => onUpdate(idx, e.target.value)}
              placeholder="Enter item…"
              style={{
                flex:1, border:`1px solid ${KF.border}`, background:KF.offWhite,
                color:KF.text, padding:"5px 8px", borderRadius:5,
                fontSize:11, fontFamily:"inherit", outline:"none",
              }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = KF.border}
            />
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
  const emptyBlocks = () => BLOCK_KEYS.reduce((a, k) => ({ ...a, [k]:[""] }), {});
  const [blocks, setBlocks] = useState(emptyBlocks());
  const [scope, setScope] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [tab, setTab] = useState("canvas");

  const loadExample = () => {
    setBlocks(BLOCK_KEYS.reduce((a, k) => ({ ...a, [k]:[...EXAMPLE[k]] }), {}));
    setScope(EXAMPLE.scope);
    setAnalysis(null);
  };

  const reset = () => { setBlocks(emptyBlocks()); setScope(""); setAnalysis(null); setTab("canvas"); };
  const updateItem = (k, i, v) => setBlocks(p => { const a=[...p[k]]; a[i]=v; return {...p,[k]:a}; });
  const addItem = k => setBlocks(p => p[k].length < 7 ? {...p,[k]:[...p[k],""]} : p);
  const removeItem = (k, i) => setBlocks(p => { const a=p[k].filter((_,j)=>j!==i); return {...p,[k]:a.length?a:[""]}; });

  // Upload handler — reads file text then calls AI
  const handleUpload = async (blockKey, file) => {
    setUploadingKey(blockKey);
    setUploadError(null);
    try {
      // Read file as text
      const text = await file.text();
      if (!text || text.trim().length < 50) {
        throw new Error("File appears to be empty or binary. Please use a text-based file.");
      }
      // Call AI extraction
      const items = await extractWithAI(blockKey, text);
      setBlocks(p => ({ ...p, [blockKey]: items }));
    } catch (err) {
      setUploadError(`${BLOCK_LABELS[blockKey].title}: ${err.message}`);
    } finally {
      setUploadingKey(null);
    }
  };

  // Run local analysis
  const analyse = () => {
    const hasContent = BLOCK_KEYS.some(k => blocks[k].some(i => i.trim()));
    if (!hasContent) return;
    const result = runLocalAnalysis(blocks, scope);
    setAnalysis(result);
    setTab("scorecard");
  };

  const sevColor = s => s==="high" ? KF.red : s==="medium" ? KF.amber : KF.muted;

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

      {/* Scope bar */}
      <div style={{ background:KF.white, borderBottom:`1px solid ${KF.border}`, padding:"8px 24px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:11, color:KF.muted, whiteSpace:"nowrap" }}>Scope:</span>
        <input value={scope} onChange={e => setScope(e.target.value)} placeholder="Organisation / project name…"
          style={{ flex:1, border:"none", background:"transparent", color:KF.text, fontSize:12, fontFamily:"inherit", outline:"none" }} />
      </div>

      {/* Upload tip */}
      <div style={{ background:"#eff6ff", borderBottom:`1px solid #bfdbfe`, padding:"8px 24px", fontSize:11, color:"#1e40af" }}>
        💡 <strong>Upload documents per block</strong> — click the green ⬆ upload button on any block to upload a PDF, PPTX or text file. AI will automatically extract the relevant content using Kingfisher BTC methodology.
      </div>

      {/* Upload error */}
      {uploadError && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, margin:"10px 24px 0", padding:"10px 14px", color:KF.red, fontSize:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>⚠ Upload failed — {uploadError}</span>
          <button onClick={() => setUploadError(null)} style={{ background:"none", border:"none", color:KF.red, cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      )}

      {/* Canvas Tab */}
      {tab === "canvas" && (
        <div style={{ padding:"16px 24px 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {["strategy","principles"].map(k => (
              <BlockCard key={k} bkey={k} items={blocks[k]}
                onUpdate={(i,v) => updateItem(k,i,v)} onAdd={() => addItem(k)} onRemove={i => removeItem(k,i)}
                onUpload={handleUpload} uploadingKey={uploadingKey} />
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:10 }}>
            {["customers","processes","people","technology"].map(k => (
              <BlockCard key={k} bkey={k} items={blocks[k]}
                onUpdate={(i,v) => updateItem(k,i,v)} onAdd={() => addItem(k)} onRemove={i => removeItem(k,i)}
                onUpload={handleUpload} uploadingKey={uploadingKey} />
            ))}
          </div>
          <BlockCard bkey="portfolio" items={blocks.portfolio} wide
            onUpdate={(i,v) => updateItem("portfolio",i,v)} onAdd={() => addItem("portfolio")} onRemove={i => removeItem("portfolio",i)}
            onUpload={handleUpload} uploadingKey={uploadingKey} />
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
                        <span style={{ fontSize:11, color:KF.text }}>{BLOCK_LABELS[k].title}</span>
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