/**
 * Improve — verbetert bestaande tekst op basis van een preset
 * Input:  { text, preset, field }
 * preset: 'inspirerender' | 'mckinsey' | 'beknopter' | 'financieel'
 * Output: { suggestion }
 */

const PRESETS = {
  inspirerender: "Herschrijf de tekst zodat hij energieker, meer inspirerend en activerend klinkt. Behoud de kernboodschap maar maak het urgenter en ambtieuzer.",
  mckinsey:      "Herschrijf de tekst in een strakke, analytische McKinsey/BCG stijl. Gebruik concrete feiten, actieve zinnen en eliminieer jargon. Geen wollig taalgebruik.",
  beknopter:     "Maak de tekst 40-50% korter zonder inhoudsverlies. Verwijder herhalingen en omhaal. Behoud alle kernpunten.",
  financieel:    "Herschrijf de tekst met een expliciete focus op financiële impact, ROI, kostenreductie of groeipercentages. Voeg kwantitatieve taal toe waar passend.",
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { text, preset, field } = req.body || {};
  if (!text || !preset) return res.status(400).json({ error: "Ontbrekende parameters: text en preset zijn vereist" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY niet geconfigureerd" });

  const instruction = PRESETS[preset];
  if (!instruction) return res.status(400).json({ error: `Onbekende preset: ${preset}` });

  const system = `Je bent een senior strategie-consultant bij Kingfisher & Partners die teksten voor het Business Transformatie Canvas verfijnt.
Geef ALLEEN de verbeterde tekst terug — geen uitleg, geen preamble, geen aanhalingstekens.
Behoud de taal van de originele tekst (NL of EN).`;

  const userMsg = `${instruction}\n\nOriginele tekst voor het veld "${field || "onbekend"}":\n${text}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, system, messages: [{ role: "user", content: userMsg }] }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "AI fout" });
    const suggestion = (data.content || []).map(c => c.text || "").join("").trim();
    return res.status(200).json({ suggestion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
