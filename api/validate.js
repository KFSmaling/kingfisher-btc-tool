/**
 * BTC Validator — Serverless Function
 * Kingfisher & Partners — April 2026
 * Gebruikt claude-haiku voor snelle, goedkope pre-flight check.
 */

const VALIDATION_PROMPT = `Je bent een senior auditor bij Kingfisher & Partners.
Beoordeel de tekst op bruikbaarheid voor het Business Transformatie Canvas (BTC).

ANTWOORD UITSLUITEND IN DIT JSON FORMAAT (geen markdown, alleen pure JSON):
{
  "isValid": true,
  "overallReason": "Uitleg waarom wel/niet bruikbaar",
  "confidenceScores": {
    "strategy":   { "score": 0, "reason": "uitleg" },
    "principles": { "score": 0, "reason": "uitleg" },
    "customers":  { "score": 0, "reason": "uitleg" },
    "processes":  { "score": 0, "reason": "uitleg" },
    "people":     { "score": 0, "reason": "uitleg" },
    "technology": { "score": 0, "reason": "uitleg" },
    "portfolio":  { "score": 0, "reason": "uitleg" }
  }
}

CRITERIA PER BLOK:
- strategy:   missie, visie, strategische doelen, KPIs, ambities
- principles: design principles, leidende regels, waarden, kaders
- customers:  klantgroepen, segmenten, journeys, kanalen, producten/diensten
- processes:  procesmodel, organisatiestructuur, governance, operationeel model
- people:     leiderschap, competenties, cultuur, HR, skills, capaciteit
- technology: IT-systemen, data, applicaties, platforms, architectuur
- portfolio:  initiatieven, projecten, roadmap, investeringen, prioriteiten

SCORES:
- 80-100: Expliciete, concrete informatie aanwezig
- 50-79:  Impliciete of fragmentarische informatie
- 20-49:  Hints aanwezig maar weinig bruikbaar
- 0-19:   Geen relevante informatie

isValid = true als minimaal één blok score >= 30 heeft.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { documentText } = req.body;
  if (!documentText) return res.status(400).json({ error: "Missing documentText" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: VALIDATION_PROMPT + "\n\nTE BEOORDELEN DOCUMENT:\n" + documentText.slice(0, 6000),
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "API error" });

    const text = (data.content || []).map(c => c.text || "").join("");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Geen geldige JSON van validator ontvangen");

    const result = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
