/**
 * Strategy AI — Thema's + KSF/KPI generatie
 *
 * mode = "themes"  → genereert max 7 strategische thema's
 * mode = "ksf_kpi" → genereert 3 KSF + 3 KPI voor één thema
 *
 * Werkt op committed data (core + items), GEEN RAG/vector search.
 * Gebruikt Claude Sonnet voor synthese-kwaliteit.
 */

const MODEL   = "claude-sonnet-4-5";
const HEADERS = (key) => ({
  "Content-Type": "application/json",
  "x-api-key": key,
  "anthropic-version": "2023-06-01",
});

function buildSwotContext(core, items = []) {
  const kansen      = items.filter(i => i.tag === "kans").map(i => `- ${i.content}`).join("\n") || "(geen)";
  const bedreigingen = items.filter(i => i.tag === "bedreiging").map(i => `- ${i.content}`).join("\n") || "(geen)";
  const sterktes    = items.filter(i => i.tag === "sterkte").map(i => `- ${i.content}`).join("\n") || "(geen)";
  const zwaktes     = items.filter(i => i.tag === "zwakte").map(i => `- ${i.content}`).join("\n") || "(geen)";

  return `
IDENTITEIT
Missie:      ${core.missie      || "(niet ingevuld)"}
Visie:       ${core.visie       || "(niet ingevuld)"}
Ambitie:     ${core.ambitie     || "(niet ingevuld)"}
Kernwaarden: ${(core.kernwaarden || []).join(", ") || "(niet ingevuld)"}

ANALYSE
Kansen (extern):
${kansen}

Bedreigingen (extern):
${bedreigingen}

Sterktes (intern):
${sterktes}

Zwaktes (intern):
${zwaktes}
`.trim();
}

// ── MODE: THEMES ──────────────────────────────────────────────────────────────
async function generateThemes(core, items, apiKey, systemOverride, languageInstruction = "Schrijf ALTIJD in het Nederlands.", tenantVars = {}) {
  const context = buildSwotContext(core, items);

  const rawSystemRaw = systemOverride || `Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau. Je formuleert strategische thema's die de koers van een organisatie bepalen voor de komende 3-5 jaar.

REGELS:
- Maximaal 7 thema's
- Elk thema is een korte, activerende zin (max 8 woorden) — geen werkwoord, wel richting
- Thema's zijn complementair en dekken samen de volledige strategische agenda
- Gebruik Balanced Scorecard-denken: financieel, klant, intern proces, innovatie & groei
- Koppel elk thema impliciet aan kansen of sterktes uit de analyse
- {taal_instructie}
- Geen nummering, bullets, uitleg of toelichting — één thema per regel
- Als data ontbreekt: formuleer op basis van missie/visie/ambitie`;
  const system = renderPrompt(rawSystemRaw, tenantVars).replace(/\{taal_instructie\}/g, languageInstruction);

  const user = `Genereer maximaal 7 strategische thema's voor deze organisatie. De thema's vormen samen de strategische agenda — elke koersrichting krijgt één thema.

${context}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI fout (themes)");
  const raw = (data.content || []).map(c => c.text || "").join("").trim();
  const themes = raw.split("\n").map(l => l.trim().replace(/^[-•*\d.)\s]+/, "")).filter(l => l.length > 4);
  return themes.slice(0, 7);
}

// ── MODE: KSF_KPI ─────────────────────────────────────────────────────────────
async function generateKsfKpi(themaTitle, core, items, apiKey, systemOverride, languageInstruction = "Schrijf ALTIJD in het Nederlands.", tenantVars = {}) {
  const context = buildSwotContext(core, items);

  const rawSystem = systemOverride || `Je bent een Senior Strategie Consultant én Balanced Scorecard-expert. Je formuleert KSF's (Kritieke Succesfactoren) en KPI's (Key Performance Indicators) voor strategische thema's.

DEFINITIES:
- KSF: de voorwaarden waaraan voldaan moet zijn om het thema te realiseren (kwalitatief, kritisch)
- KPI: meetbare indicator met een huidige en een doelwaarde (SMART: Specifiek, Meetbaar, Ambitieus, Realistisch, Tijdgebonden)

BALANCED SCORECARD PERSPECTIEVEN — gebruik ze als lens:
1. Financieel: omzet, marge, kosten, ROI
2. Klant: NPS, klanttevredenheid, marktaandeel, retentie
3. Intern Proces: doorlooptijd, kwaliteit, operationele efficiëntie
4. Leren & Groeien: medewerkerstevredenheid, digitale volwassenheid, innovatiesnelheid

OUTPUT FORMAT — antwoord EXACT in dit JSON-formaat:
{
  "ksf": [
    { "description": "...", "current_value": "", "target_value": "" },
    { "description": "...", "current_value": "", "target_value": "" },
    { "description": "...", "current_value": "", "target_value": "" }
  ],
  "kpi": [
    { "description": "...", "current_value": "...", "target_value": "..." },
    { "description": "...", "current_value": "...", "target_value": "..." },
    { "description": "...", "current_value": "...", "target_value": "..." }
  ]
}

REGELS:
- Exact 3 KSF's en 3 KPI's
- KSF beschrijvingen zijn kwalitatief en actiegericht (max 12 woorden)
- KPI beschrijvingen bevatten de meeteenheid (bijv. "NPS-score", "% omzetgroei YoY")
- KPI current_value: realistisch startpunt op basis van de analyseontwikkelingen ("~30%", "onbekend" als niet te schatten)
- KPI target_value: ambitieus maar haalbaar in 2-3 jaar ("60%", ">50")
- {taal_instructie}
- Geen markdown, geen uitleg buiten de JSON`;
  const system = renderPrompt(rawSystem, tenantVars).replace(/\{taal_instructie\}/g, languageInstruction);

  const user = `Formuleer 3 KSF's en 3 KPI's voor het strategisch thema: "${themaTitle}"

STRATEGISCHE CONTEXT:
${context}

Gebruik de Balanced Scorecard-lenzen. Maak de KPI's SMART met realistische huidig/doel waarden.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI fout (ksf_kpi)");
  const raw = (data.content || []).map(c => c.text || "").join("").trim();
  // Extract JSON — Claude kan soms uitleg voor/na JSON schrijven
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Onverwacht AI-formaat — geen JSON gevonden");
  return JSON.parse(jsonMatch[0]);
}

// ── MODE: ANALYSIS — Inzichten schema (sprint A) ─────────────────────────────

// Bouwt analyse-context met expliciete IDs zodat de AI source_refs correct kan invullen
function buildAnalysisContext(core, items, themas) {
  const identity = [
    `strategy_core_field (id: missie):      ${core.missie      || "(niet ingevuld)"}`,
    `strategy_core_field (id: visie):       ${core.visie       || "(niet ingevuld)"}`,
    `strategy_core_field (id: ambitie):     ${core.ambitie     || "(niet ingevuld)"}`,
    `strategy_core_field (id: kernwaarden): ${(core.kernwaarden || []).join(", ") || "(niet ingevuld)"}`,
  ].join("\n");

  const tagged = items.filter(i => i.tag && i.tag !== "niet_relevant");
  const swot = tagged.length
    ? tagged.map(i => `analysis_item (id: ${i.id}, tag: ${i.tag}): ${i.content}`).join("\n")
    : "(geen getagde analyse-items)";

  const themasCtx = themas.length > 0
    ? themas.map(t => {
        const ksfs = (t.ksf_kpi || []).filter(k => k.type === "ksf").map(k => k.description).filter(Boolean);
        const kpis = (t.ksf_kpi || []).filter(k => k.type === "kpi").map(k => `${k.description}${k.target_value ? ` (target: ${k.target_value})` : ""}`).filter(Boolean);
        return `theme (id: ${t.id}): ${t.title || "(geen titel)"}${ksfs.length ? `\n   KSF: ${ksfs.join(" | ")}` : ""}${kpis.length ? `\n   KPI: ${kpis.join(" | ")}` : ""}`;
      }).join("\n\n")
    : "(geen strategische thema's)";

  return `IDENTITEIT (gebruik deze strategy_core_field IDs in source_refs):
${identity}

SWOT-ANALYSE (gebruik deze analysis_item IDs in source_refs):
${swot}

STRATEGISCHE THEMA'S (gebruik deze theme IDs in source_refs):
${themasCtx}`;
}

// Valideert één insight-object. Geeft null bij succes, foutmelding als string.
const _ANALYSIS_VALID_CATEGORIES = new Set(["onderdeel", "dwarsverband"]);
const _ANALYSIS_VALID_TYPES      = new Set(["ontbreekt", "zwak", "kans", "sterk"]);
const _ANALYSIS_VALID_KINDS      = new Set(["strategy_core_field", "analysis_item", "theme"]);

function _validateInsights(insights) {
  if (!Array.isArray(insights) || insights.length === 0) return "insights is geen array of leeg";
  for (let i = 0; i < insights.length; i++) {
    const v = insights[i];
    if (!_ANALYSIS_VALID_CATEGORIES.has(v.category))   return `[${i}].category ongeldig: "${v.category}"`;
    if (!_ANALYSIS_VALID_TYPES.has(v.type))             return `[${i}].type ongeldig: "${v.type}"`;
    if (typeof v.title          !== "string")           return `[${i}].title geen string`;
    if (typeof v.observation    !== "string")           return `[${i}].observation geen string`;
    if (typeof v.recommendation !== "string")           return `[${i}].recommendation geen string`;
    if (!Array.isArray(v.source_refs))                  return `[${i}].source_refs geen array`;
    for (let j = 0; j < v.source_refs.length; j++) {
      const r = v.source_refs[j];
      if (!_ANALYSIS_VALID_KINDS.has(r.kind)) return `[${i}].source_refs[${j}].kind ongeldig: "${r.kind}"`;
      if (typeof r.id    !== "string")        return `[${i}].source_refs[${j}].id geen string`;
      if (typeof r.label !== "string")        return `[${i}].source_refs[${j}].label geen string`;
      if (typeof r.exists !== "boolean")      return `[${i}].source_refs[${j}].exists geen boolean`;
    }
  }
  return null;
}

function _tryParseInsights(raw) {
  // Strip markdown code fences (```json ... ``` of ``` ... ```)
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const m = stripped.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]).insights || null; } catch { return null; }
}

async function _callAnalysisApi(system, messages, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({ model: MODEL, max_tokens: 6000, system, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI fout (analysis)");
  return (data.content || []).map(c => c.text || "").join("").trim();
}

const ANALYSIS_SYSTEM_PROMPT = `Je bent een kritische Senior Strategie Consultant. Je analyseert de samenhang en kwaliteit van een strategische kaart en levert gestructureerde bevindingen in het Inzichten-formaat.

BEKNOPTHEID — VERPLICHT:
- observation: maximaal 80 woorden
- recommendation: maximaal 60 woorden
- Geen lege regels of overbodige witruimte in de JSON-output
- Compacte JSON: geen extra inspringen of opmaak buiten het vereiste formaat

FOCUS:
- Coherentie: sluiten thema's en KSF/KPI aan bij missie/visie/ambitie?
- Volledigheid: zijn alle Balanced Scorecard-perspectieven gedekt?
- Kwaliteit: zijn missie/visie/ambitie scherp geformuleerd of te vaag?
- Risico's: ontbreken kritische thema's, KSF's of KPI's?
- Verbanden: tegenstrijdigheden of ontbrekende koppelingen tussen elementen?

BEVINDING-TYPES:
- "ontbreekt" — een verwacht element is volledig afwezig
- "zwak"      — aanwezig maar onvoldoende scherp, concreet of consistent
- "kans"      — positieve samenhang of onbenutte mogelijkheid
- "sterk"     — element dat uitzonderlijk goed is of als voorbeeld dient

CATEGORIEËN:
- "onderdeel"    — bevinding over één specifiek element (veld, thema, KPI)
- "dwarsverband" — bevinding over relatie of spanning TUSSEN meerdere elementen

REGELS:
- Minimaal 3, maximaal 8 bevindingen
- Minimaal 1 bevinding met category "dwarsverband" als de data daartoe aanleiding geeft
- Maximaal 2 bevindingen met type "sterk" — focus op verbetering, niet complimenteren
- cross_worksheet is altijd false — blijf binnen de Strategie-scope
- observation beschrijft (feiten, patronen); recommendation schrijft voor (concrete actie)
- source_refs verwijzen naar EXACTE elementen uit de meegegeven context
- exists: false alleen bij verwijzingen naar ontbrekende elementen
- {taal_instructie}

SOURCE REF KINDS:
- "strategy_core_field" — id is de veldnaam: missie, visie, ambitie, of kernwaarden
- "analysis_item"       — id is de UUID van het analyse-item
- "theme"               — id is de UUID van het strategisch thema

OUTPUT FORMAT — antwoord EXACT in dit JSON-formaat, geen tekst erbuiten, geen witruimte buiten de strings:
- observation: maximaal 80 woorden per bevinding
- recommendation: maximaal 60 woorden per bevinding
{"insights":[{"category":"onderdeel","type":"zwak","title":"Missie beschrijft activiteiten, niet richting","observation":"De missie beschrijft wat de organisatie doet, niet waarom ze bestaat.","recommendation":"Herformuleer als normatieve uitspraak over het bestaansrecht.","source_refs":[{"kind":"strategy_core_field","id":"missie","label":"Missie","exists":true}],"cross_worksheet":false}]}`;

async function generateAnalysis(core, items, themas, apiKey, systemOverride, languageInstruction = "Schrijf ALTIJD in het Nederlands.", tenantVars = {}) {
  const context  = buildAnalysisContext(core, items, themas);
  const rawSystem = systemOverride || ANALYSIS_SYSTEM_PROMPT;
  // Stap-7 fase-3 pilot: render tenant-template-tokens vóór taal-instructie-replace
  const templated = renderPrompt(rawSystem, tenantVars);
  const system    = templated.replace(/\{taal_instructie\}/g, languageInstruction);
  const userMsg   = `Analyseer de strategie en lever 3–8 bevindingen in het Inzichten-formaat.\n\n${context}`;

  // Eerste poging
  const raw1     = await _callAnalysisApi(system, [{ role: "user", content: userMsg }], apiKey);
  const parsed1  = _tryParseInsights(raw1);
  const error1   = parsed1 ? _validateInsights(parsed1) : "geen geldige JSON gevonden";
  if (!error1) return { insights: parsed1.map(v => ({ id: crypto.randomUUID(), ...v, cross_worksheet: false })) };

  // Tweede poging — fout-context meegeven
  const retryMsg = `${userMsg}\n\nJe vorige antwoord was ongeldig (fout: ${error1}). Geef nu EXACT het gevraagde JSON-formaat terug zonder tekst erbuiten.`;
  const raw2     = await _callAnalysisApi(system, [{ role: "user", content: retryMsg }], apiKey);
  const parsed2  = _tryParseInsights(raw2);
  const error2   = parsed2 ? _validateInsights(parsed2) : "geen geldige JSON gevonden";
  if (!error2) return { insights: parsed2.map(v => ({ id: crypto.randomUUID(), ...v, cross_worksheet: false })) };

  throw new Error(`AI-analyse leverde na twee pogingen geen geldig formaat op. Laatste fout: ${error2}`);
}

// ── MODE: SAMENVATTING ────────────────────────────────────────────────────────
async function generateSamenvatting(core, themas, apiKey, systemOverride, languageInstruction = "Schrijf ALTIJD in het Nederlands.", tenantVars = {}) {
  const themasCtx = themas.length > 0
    ? themas.map(t => t.title).filter(Boolean).join(", ")
    : "(geen thema's)";

  const rawSystem = systemOverride || `Je schrijft een strategische samenvatting van maximaal 2 zinnen.

REGELS:
- Maximaal 2 zinnen, totaal max 60 woorden
- Beschrijf concreet waar de organisatie over 3 jaar staat
- Combineer: de transformatierichting + marktpositie of maatschappelijke impact
- Specifiek en inspirerend — geen algemeenheden of managementjargon
- Geen bullets, lijsten of kopjes — alleen vloeiende tekst
- {taal_instructie}

Antwoord met ALLEEN de samenvatting — geen uitleg, geen aanhalingstekens.`;

  const system = renderPrompt(rawSystem, tenantVars).replace(/\{taal_instructie\}/g, languageInstruction);
  const user = `Missie: ${core.missie || "(niet ingevuld)"}
Visie: ${core.visie || "(niet ingevuld)"}
Ambitie: ${core.ambitie || "(niet ingevuld)"}
Kernwaarden: ${(core.kernwaarden || []).join(", ") || "(niet ingevuld)"}
Strategische thema's: ${themasCtx}

Schrijf een strategische samenvatting van maximaal 2 zinnen.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 150,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI fout (samenvatting)");
  return (data.content || []).map(c => c.text || "").join("").trim();
}

// ── MODE: AUTO_TAG ────────────────────────────────────────────────────────────
// Tagt niet-gelabelde externe/interne items op zekere gevallen.
// Extern → kans | bedreiging | (overslaan)
// Intern → sterkte | zwakte | (overslaan)
// Gebruikt indices (niet UUIDs) om hallucination te voorkomen.
async function autoTag(core, items, apiKey, systemOverride, languageInstruction = "Schrijf ALTIJD in het Nederlands.", tenantVars = {}) {
  const untagged = items.filter(i => !i.tag || i.tag === "niet_relevant");
  if (untagged.length === 0) return {};

  const externList = untagged.filter(i => i.type === "extern").map((i, idx) => ({ ...i, listIndex: idx }));
  const internList = untagged.filter(i => i.type === "intern").map((i, idx) => ({ ...i, listIndex: idx }));

  const externCtx = externList.length
    ? externList.map(i => `${i.listIndex}. ${i.content}`).join("\n")
    : "(geen)";
  const internCtx = internList.length
    ? internList.map(i => `${i.listIndex}. ${i.content}`).join("\n")
    : "(geen)";

  const identityCtx = `Missie:      ${core.missie      || "(niet ingevuld)"}
Visie:       ${core.visie       || "(niet ingevuld)"}
Ambitie:     ${core.ambitie     || "(niet ingevuld)"}
Kernwaarden: ${(core.kernwaarden || []).join(", ") || "(niet ingevuld)"}`;

  const rawSystem = systemOverride || `Je classificeert analyse-items in een SWOT-kader op basis van de organisatie-identiteit.

REGELS:
- Externe items krijgen: "kans" OF "bedreiging" (nooit sterkte/zwakte)
- Interne items krijgen: "sterkte" OF "zwakte" (nooit kans/bedreiging)
- Classificeer ALLEEN bij zekerheid — bij twijfel of dubbelzinnigheid: sla over (laat weg uit output)
- Een kans is een externe ontwikkeling die deze specifieke organisatie helpt (past bij missie/ambitie)
- Een bedreiging is een externe ontwikkeling die deze organisatie schaadt of in gevaar brengt
- Een sterkte is een interne capaciteit die deze organisatie onderscheidend maakt
- Een zwakte is een intern tekort dat de realisatie van de strategie belemmert
- {taal_instructie}

OUTPUT: Exact JSON — alleen items waar je zeker van bent. Laat twijfelgevallen weg.
{
  "extern": { "<index>": "kans" | "bedreiging", ... },
  "intern": { "<index>": "sterkte" | "zwakte", ... }
}`;

  const system = renderPrompt(rawSystem, tenantVars).replace(/\{taal_instructie\}/g, languageInstruction);
  const user = `ORGANISATIE-IDENTITEIT:
${identityCtx}

EXTERNE ITEMS (classificeer als kans of bedreiging — alleen bij zekerheid):
${externCtx}

INTERNE ITEMS (classificeer als sterkte of zwakte — alleen bij zekerheid):
${internCtx}

Geef alleen classificaties terug waar je zeker van bent. Overige items worden overgeslagen.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: HEADERS(apiKey),
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI fout (auto_tag)");
  const raw = (data.content || []).map(c => c.text || "").join("").trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Onverwacht AI-formaat — geen JSON gevonden");
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch { throw new Error("AI-antwoord ongeldig (auto_tag). Probeer opnieuw."); }

  // Vertaal indices → item IDs, valideer tags
  const VALID_EXTERN = new Set(["kans", "bedreiging"]);
  const VALID_INTERN = new Set(["sterkte", "zwakte"]);
  const result = {};
  Object.entries(parsed.extern || {}).forEach(([idxStr, tag]) => {
    const item = externList[parseInt(idxStr)];
    if (item && VALID_EXTERN.has(tag)) result[item.id] = tag;
  });
  Object.entries(parsed.intern || {}).forEach(([idxStr, tag]) => {
    const item = internList[parseInt(idxStr)];
    if (item && VALID_INTERN.has(tag)) result[item.id] = tag;
  });
  return result;
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
const { requireAuth } = require("./_auth");
const { renderPrompt, getTenantVars, userScopedClient } = require("./_template");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    mode, core = {}, items = [], themas = [], thema,
    systemPromptThemes, systemPromptKsfKpi, systemPromptAnalysis, systemPromptSamenvatting, systemPromptAutoTag,
    languageInstruction = "Schrijf ALTIJD in het Nederlands.",
  } = req.body || {};
  if (!mode) return res.status(400).json({ error: "Missing mode" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" });

  // Stap-7 fase-4: tenant-vars ophalen één keer per request (alle 5 modes)
  const tenantVars = await getTenantVars(userScopedClient(req));

  try {
    if (mode === "themes") {
      const themes = await generateThemes(core, items, apiKey, systemPromptThemes, languageInstruction, tenantVars);
      return res.status(200).json({ themes });
    }
    if (mode === "ksf_kpi") {
      if (!thema) return res.status(400).json({ error: "Missing thema" });
      const result = await generateKsfKpi(thema, core, items, apiKey, systemPromptKsfKpi, languageInstruction, tenantVars);
      return res.status(200).json(result);
    }
    if (mode === "analysis") {
      const result = await generateAnalysis(core, items, themas, apiKey, systemPromptAnalysis, languageInstruction, tenantVars);
      return res.status(200).json(result);
    }
    if (mode === "samenvatting") {
      const samenvatting = await generateSamenvatting(core, themas, apiKey, systemPromptSamenvatting, languageInstruction, tenantVars);
      return res.status(200).json({ samenvatting });
    }
    if (mode === "auto_tag") {
      const tags = await autoTag(core, items, apiKey, systemPromptAutoTag, languageInstruction, tenantVars);
      return res.status(200).json({ tags });
    }
    return res.status(400).json({ error: `Onbekende mode: ${mode}` });
  } catch (err) {
    console.error("[strategy]", err.message);
    return res.status(500).json({ error: err.message });
  }
};
