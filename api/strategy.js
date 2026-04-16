/**
 * Strategy AI — Thema's + KSF/KPI generatie
 * Kingfisher & Partners — April 2026
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
async function generateThemes(core, items, apiKey) {
  const context = buildSwotContext(core, items);

  const system = `Je bent een Senior Strategie Consultant op McKinsey/BCG-niveau. Je formuleert strategische thema's die de koers van een organisatie bepalen voor de komende 3-5 jaar.

REGELS:
- Maximaal 7 thema's
- Elk thema is een korte, activerende zin (max 8 woorden) — geen werkwoord, wel richting
- Thema's zijn complementair en dekken samen de volledige strategische agenda
- Gebruik Balanced Scorecard-denken: financieel, klant, intern proces, innovatie & groei
- Koppel elk thema impliciet aan kansen of sterktes uit de analyse
- Schrijf ALTIJD in het Nederlands
- Geen nummering, bullets, uitleg of toelichting — één thema per regel
- Als data ontbreekt: formuleer op basis van missie/visie/ambitie`;

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
async function generateKsfKpi(themaTitle, core, items, apiKey) {
  const context = buildSwotContext(core, items);

  const system = `Je bent een Senior Strategie Consultant én Balanced Scorecard-expert. Je formuleert KSF's (Kritieke Succesfactoren) en KPI's (Key Performance Indicators) voor strategische thema's.

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
- Schrijf ALTIJD in het Nederlands
- Geen markdown, geen uitleg buiten de JSON`;

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

// ── HANDLER ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mode, core = {}, items = [], thema } = req.body || {};
  if (!mode) return res.status(400).json({ error: "Missing mode" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" });

  try {
    if (mode === "themes") {
      const themes = await generateThemes(core, items, apiKey);
      return res.status(200).json({ themes });
    }
    if (mode === "ksf_kpi") {
      if (!thema) return res.status(400).json({ error: "Missing thema" });
      const result = await generateKsfKpi(thema, core, items, apiKey);
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: `Onbekende mode: ${mode}` });
  } catch (err) {
    console.error("[strategy]", err.message);
    return res.status(500).json({ error: err.message });
  }
};
